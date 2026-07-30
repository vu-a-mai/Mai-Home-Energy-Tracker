-- ============================================
-- Migration: Secure recurring + cleanup RPCs
-- ============================================
-- Fixes cross-tenant writes/deletes in SECURITY DEFINER helpers:
--   - generate_recurring_logs: require caller's household match
--   - auto_generate_recurring_logs: only process caller's household
--   - cleanup_expired_deleted_logs: revoke from authenticated (cron/service_role only)
-- Created: 2026-07-30
-- ============================================

-- 1) generate_recurring_logs — authorize by household
CREATE OR REPLACE FUNCTION public.generate_recurring_logs(
  p_schedule_id UUID,
  p_target_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedule recurring_schedules;
  v_day_of_week INT;
  v_log_id UUID;
  v_household_id UUID;
  v_caller_household UUID;
BEGIN
  v_caller_household := get_user_household_id();
  IF v_caller_household IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no household for current user';
  END IF;

  SELECT * INTO v_schedule
  FROM recurring_schedules
  WHERE id = p_schedule_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule not found or inactive';
  END IF;

  IF v_schedule.household_id IS DISTINCT FROM v_caller_household THEN
    RAISE EXCEPTION 'Unauthorized: schedule is outside your household';
  END IF;

  IF p_target_date < v_schedule.schedule_start_date THEN
    RAISE EXCEPTION 'Target date is before schedule start date';
  END IF;

  IF v_schedule.schedule_end_date IS NOT NULL AND p_target_date > v_schedule.schedule_end_date THEN
    RAISE EXCEPTION 'Target date is after schedule end date';
  END IF;

  v_day_of_week := EXTRACT(DOW FROM p_target_date);

  IF NOT (v_day_of_week = ANY(v_schedule.days_of_week)) THEN
    RAISE EXCEPTION 'Schedule does not run on this day of week';
  END IF;

  IF EXISTS (
    SELECT 1 FROM energy_logs
    WHERE source_type = 'recurring'
      AND source_id = p_schedule_id
      AND usage_date = p_target_date
  ) THEN
    RAISE EXCEPTION 'Log already exists for this date and schedule';
  END IF;

  v_household_id := v_schedule.household_id;

  INSERT INTO energy_logs (
    household_id,
    device_id,
    usage_date,
    start_time,
    end_time,
    assigned_users,
    created_by,
    source_type,
    source_id
  ) VALUES (
    v_household_id,
    v_schedule.device_id,
    p_target_date,
    v_schedule.start_time,
    v_schedule.end_time,
    v_schedule.assigned_users,
    COALESCE(auth.uid(), v_schedule.created_by),
    'recurring',
    p_schedule_id
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- 2) auto_generate_recurring_logs — household-scoped for authenticated callers
CREATE OR REPLACE FUNCTION public.auto_generate_recurring_logs(p_target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(schedule_id UUID, log_id UUID, success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedule RECORD;
  v_day_of_week INT;
  v_log_id UUID;
  v_caller_household UUID;
BEGIN
  v_caller_household := get_user_household_id();
  IF v_caller_household IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no household for current user';
  END IF;

  v_day_of_week := EXTRACT(DOW FROM p_target_date);

  FOR v_schedule IN
    SELECT *
    FROM recurring_schedules
    WHERE is_active = true
      AND auto_create = true
      AND household_id = v_caller_household
      AND p_target_date >= schedule_start_date
      AND (schedule_end_date IS NULL OR p_target_date <= schedule_end_date)
      AND v_day_of_week = ANY(days_of_week)
  LOOP
    BEGIN
      v_log_id := generate_recurring_logs(v_schedule.id, p_target_date);

      schedule_id := v_schedule.id;
      log_id := v_log_id;
      success := true;
      error_message := NULL;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      schedule_id := v_schedule.id;
      log_id := NULL;
      success := false;
      error_message := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;

-- 3) cleanup_expired_deleted_logs — service/cron only (not client-callable)
CREATE OR REPLACE FUNCTION public.cleanup_expired_deleted_logs()
RETURNS TABLE(cleaned_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cleaned_count INT;
BEGIN
  DELETE FROM energy_logs
  WHERE deleted_at IS NOT NULL
    AND permanent_delete_at IS NOT NULL
    AND permanent_delete_at <= NOW();

  GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;

  RETURN QUERY SELECT v_cleaned_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_deleted_logs() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_expired_deleted_logs() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_expired_deleted_logs() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_deleted_logs() TO service_role;

-- Keep authenticated execute on household-scoped generators
GRANT EXECUTE ON FUNCTION public.generate_recurring_logs(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_generate_recurring_logs(DATE) TO authenticated;
