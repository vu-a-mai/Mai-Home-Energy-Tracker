-- ============================================
-- Migration: Complete auto-scheduling
-- ============================================
-- - Unified idempotent recurring log generation
-- - Soft-delete-aware duplicate checks
-- - Bulk generation RPC
-- - Per-household timezone settings
-- - Service-role runner for due schedules (cron calls this)
-- Created: 2026-07-30
-- ============================================

-- ============================================
-- 1) Partial unique index for active recurring logs
-- ============================================
-- Soft-delete older duplicates so the unique index can be created safely
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY source_id, usage_date
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM energy_logs
  WHERE source_type = 'recurring'
    AND deleted_at IS NULL
    AND source_id IS NOT NULL
)
UPDATE energy_logs el
SET
  deleted_at = NOW(),
  permanent_delete_at = NOW() + INTERVAL '30 days',
  deletion_mode = 'soft',
  updated_at = NOW()
FROM ranked
WHERE el.id = ranked.id
  AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_energy_logs_recurring_active_unique
  ON energy_logs (source_id, usage_date)
  WHERE source_type = 'recurring'
    AND deleted_at IS NULL
    AND source_id IS NOT NULL;

-- ============================================
-- 2) Household settings (timezone)
-- ============================================
CREATE TABLE IF NOT EXISTS public.household_settings (
  household_id UUID PRIMARY KEY,
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT household_settings_timezone_not_blank CHECK (length(trim(timezone)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_household_settings_timezone
  ON public.household_settings (timezone);

ALTER TABLE public.household_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own household settings" ON public.household_settings;
CREATE POLICY "Users can view own household settings"
  ON public.household_settings FOR SELECT
  USING (household_id = get_user_household_id());

DROP POLICY IF EXISTS "Users can insert own household settings" ON public.household_settings;
CREATE POLICY "Users can insert own household settings"
  ON public.household_settings FOR INSERT
  WITH CHECK (household_id = get_user_household_id());

DROP POLICY IF EXISTS "Users can update own household settings" ON public.household_settings;
CREATE POLICY "Users can update own household settings"
  ON public.household_settings FOR UPDATE
  USING (household_id = get_user_household_id())
  WITH CHECK (household_id = get_user_household_id());

-- Seed settings for every known household
INSERT INTO public.household_settings (household_id, timezone)
SELECT DISTINCT u.household_id, 'America/Los_Angeles'
FROM public.users u
WHERE u.household_id IS NOT NULL
ON CONFLICT (household_id) DO NOTHING;

-- Validate IANA timezone names via PostgreSQL
CREATE OR REPLACE FUNCTION public.is_valid_timezone(p_timezone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  PERFORM NOW() AT TIME ZONE p_timezone;
  RETURN TRUE;
EXCEPTION
  WHEN invalid_parameter_value THEN
    RETURN FALSE;
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_household_timezone(p_household_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_timezone TEXT;
BEGIN
  v_household_id := COALESCE(p_household_id, get_user_household_id());
  IF v_household_id IS NULL THEN
    RETURN 'America/Los_Angeles';
  END IF;

  SELECT timezone INTO v_timezone
  FROM public.household_settings
  WHERE household_id = v_household_id;

  IF v_timezone IS NULL OR NOT public.is_valid_timezone(v_timezone) THEN
    RETURN 'America/Los_Angeles';
  END IF;

  RETURN v_timezone;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_household_timezone(p_timezone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_timezone TEXT;
BEGIN
  v_household_id := get_user_household_id();
  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no household for current user';
  END IF;

  v_timezone := trim(p_timezone);
  IF v_timezone IS NULL OR v_timezone = '' THEN
    RAISE EXCEPTION 'Timezone is required';
  END IF;

  IF NOT public.is_valid_timezone(v_timezone) THEN
    RAISE EXCEPTION 'Invalid timezone: %', v_timezone;
  END IF;

  INSERT INTO public.household_settings (household_id, timezone, updated_at, updated_by)
  VALUES (v_household_id, v_timezone, NOW(), auth.uid())
  ON CONFLICT (household_id) DO UPDATE
    SET timezone = EXCLUDED.timezone,
        updated_at = NOW(),
        updated_by = EXCLUDED.updated_by;

  RETURN v_timezone;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_valid_timezone(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_household_timezone(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_household_timezone(TEXT) TO authenticated;

-- ============================================
-- 3) Core generation helper (internal)
-- ============================================
CREATE OR REPLACE FUNCTION public._generate_recurring_log_core(
  p_schedule_id UUID,
  p_target_date DATE,
  p_replace_existing BOOLEAN DEFAULT false,
  p_expected_household_id UUID DEFAULT NULL
)
RETURNS TABLE(
  out_log_id UUID,
  out_status TEXT,
  out_error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedule recurring_schedules;
  v_day_of_week INT;
  v_existing_id UUID;
  v_new_log_id UUID;
  v_created_by UUID;
BEGIN
  SELECT * INTO v_schedule
  FROM recurring_schedules
  WHERE id = p_schedule_id;

  IF NOT FOUND THEN
    out_log_id := NULL;
    out_status := 'error';
    out_error_message := 'Schedule not found';
    RETURN NEXT;
    RETURN;
  END IF;

  IF p_expected_household_id IS NOT NULL
     AND v_schedule.household_id IS DISTINCT FROM p_expected_household_id THEN
    out_log_id := NULL;
    out_status := 'error';
    out_error_message := 'Unauthorized: schedule is outside your household';
    RETURN NEXT;
    RETURN;
  END IF;

  IF NOT v_schedule.is_active THEN
    out_log_id := NULL;
    out_status := 'error';
    out_error_message := 'Schedule not found or inactive';
    RETURN NEXT;
    RETURN;
  END IF;

  IF p_target_date < v_schedule.schedule_start_date THEN
    out_log_id := NULL;
    out_status := 'error';
    out_error_message := 'Target date is before schedule start date';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_schedule.schedule_end_date IS NOT NULL
     AND p_target_date > v_schedule.schedule_end_date THEN
    out_log_id := NULL;
    out_status := 'error';
    out_error_message := 'Target date is after schedule end date';
    RETURN NEXT;
    RETURN;
  END IF;

  v_day_of_week := EXTRACT(DOW FROM p_target_date)::INT;
  IF NOT (v_day_of_week = ANY(v_schedule.days_of_week)) THEN
    out_log_id := NULL;
    out_status := 'error';
    out_error_message := 'Schedule does not run on this day of week';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Serialize concurrent generation for the same schedule+date
  PERFORM pg_advisory_xact_lock(
    hashtext(p_schedule_id::text || ':' || p_target_date::text)
  );

  SELECT id INTO v_existing_id
  FROM energy_logs
  WHERE source_type = 'recurring'
    AND source_id = p_schedule_id
    AND usage_date = p_target_date
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    IF NOT p_replace_existing THEN
      out_log_id := v_existing_id;
      out_status := 'skipped';
      out_error_message := NULL;
      RETURN NEXT;
      RETURN;
    END IF;

    -- Soft-delete existing active log before creating replacement
    UPDATE energy_logs
    SET deleted_at = NOW(),
        deleted_by = COALESCE(auth.uid(), v_schedule.created_by),
        permanent_delete_at = NOW() + INTERVAL '30 days',
        deletion_mode = 'soft',
        updated_at = NOW()
    WHERE id = v_existing_id
      AND deleted_at IS NULL;
  END IF;

  v_created_by := COALESCE(auth.uid(), v_schedule.created_by);

  BEGIN
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
      v_schedule.household_id,
      v_schedule.device_id,
      p_target_date,
      v_schedule.start_time,
      v_schedule.end_time,
      v_schedule.assigned_users,
      v_created_by,
      'recurring',
      p_schedule_id
    )
    RETURNING id INTO v_new_log_id;
  EXCEPTION
    WHEN unique_violation THEN
      SELECT id INTO v_new_log_id
      FROM energy_logs
      WHERE source_type = 'recurring'
        AND source_id = p_schedule_id
        AND usage_date = p_target_date
        AND deleted_at IS NULL
      LIMIT 1;

      out_log_id := v_new_log_id;
      out_status := 'skipped';
      out_error_message := NULL;
      RETURN NEXT;
      RETURN;
  END;

  out_log_id := v_new_log_id;
  out_status := CASE WHEN v_existing_id IS NOT NULL THEN 'replaced' ELSE 'created' END;
  out_error_message := NULL;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public._generate_recurring_log_core(UUID, DATE, BOOLEAN, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._generate_recurring_log_core(UUID, DATE, BOOLEAN, UUID) FROM anon;
REVOKE ALL ON FUNCTION public._generate_recurring_log_core(UUID, DATE, BOOLEAN, UUID) FROM authenticated;

-- ============================================
-- 4) Public single-day generator (auth household)
-- ============================================
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
  v_caller_household UUID;
  v_result RECORD;
BEGIN
  v_caller_household := get_user_household_id();
  IF v_caller_household IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no household for current user';
  END IF;

  SELECT * INTO v_result
  FROM public._generate_recurring_log_core(
    p_schedule_id,
    p_target_date,
    false,
    v_caller_household
  );

  IF v_result.out_status = 'error' THEN
    RAISE EXCEPTION '%', v_result.out_error_message;
  END IF;

  -- skipped / created / replaced all return a log id when available
  IF v_result.out_status = 'skipped' THEN
    RAISE EXCEPTION 'Log already exists for this date and schedule';
  END IF;

  RETURN v_result.out_log_id;
END;
$$;

-- ============================================
-- 5) Auto-generate for one date (auth household)
-- ============================================
DROP FUNCTION IF EXISTS public.auto_generate_recurring_logs(DATE);

CREATE OR REPLACE FUNCTION public.auto_generate_recurring_logs(
  p_target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  schedule_id UUID,
  log_id UUID,
  status TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedule RECORD;
  v_day_of_week INT;
  v_caller_household UUID;
  v_result RECORD;
BEGIN
  v_caller_household := get_user_household_id();
  IF v_caller_household IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no household for current user';
  END IF;

  v_day_of_week := EXTRACT(DOW FROM p_target_date)::INT;

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
    SELECT * INTO v_result
    FROM public._generate_recurring_log_core(
      v_schedule.id,
      p_target_date,
      false,
      v_caller_household
    );

    schedule_id := v_schedule.id;
    log_id := v_result.out_log_id;
    status := v_result.out_status;
    error_message := v_result.out_error_message;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- ============================================
-- 6) Bulk generate for one schedule (auth household)
-- ============================================
CREATE OR REPLACE FUNCTION public.bulk_generate_recurring_logs(
  p_schedule_id UUID,
  p_end_date DATE,
  p_replace_existing BOOLEAN DEFAULT false
)
RETURNS TABLE(
  usage_date DATE,
  log_id UUID,
  status TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_household UUID;
  v_schedule recurring_schedules;
  v_cursor DATE;
  v_actual_end DATE;
  v_result RECORD;
BEGIN
  v_caller_household := get_user_household_id();
  IF v_caller_household IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no household for current user';
  END IF;

  SELECT * INTO v_schedule
  FROM recurring_schedules
  WHERE id = p_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule not found';
  END IF;

  IF v_schedule.household_id IS DISTINCT FROM v_caller_household THEN
    RAISE EXCEPTION 'Unauthorized: schedule is outside your household';
  END IF;

  v_actual_end := p_end_date;
  IF v_schedule.schedule_end_date IS NOT NULL
     AND v_schedule.schedule_end_date < v_actual_end THEN
    v_actual_end := v_schedule.schedule_end_date;
  END IF;

  IF v_actual_end < v_schedule.schedule_start_date THEN
    RETURN;
  END IF;

  v_cursor := v_schedule.schedule_start_date;
  WHILE v_cursor <= v_actual_end LOOP
    IF EXTRACT(DOW FROM v_cursor)::INT = ANY(v_schedule.days_of_week) THEN
      SELECT * INTO v_result
      FROM public._generate_recurring_log_core(
        v_schedule.id,
        v_cursor,
        p_replace_existing,
        v_caller_household
      );

      usage_date := v_cursor;
      log_id := v_result.out_log_id;
      status := v_result.out_status;
      error_message := v_result.out_error_message;
      RETURN NEXT;
    END IF;

    v_cursor := v_cursor + 1;
  END LOOP;
END;
$$;

-- ============================================
-- 7) Service-role runner for households in local midnight hour
-- ============================================
CREATE OR REPLACE FUNCTION public.run_due_recurring_schedules()
RETURNS TABLE(
  household_id UUID,
  local_date DATE,
  schedule_id UUID,
  log_id UUID,
  status TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household RECORD;
  v_local_ts TIMESTAMP;
  v_local_date DATE;
  v_local_hour INT;
  v_schedule RECORD;
  v_result RECORD;
BEGIN
  -- Ensure every known household has settings
  INSERT INTO public.household_settings (household_id, timezone)
  SELECT DISTINCT u.household_id, 'America/Los_Angeles'
  FROM public.users u
  WHERE u.household_id IS NOT NULL
  ON CONFLICT (household_id) DO NOTHING;

  FOR v_household IN
    SELECT hs.household_id, public.get_household_timezone(hs.household_id) AS timezone
    FROM public.household_settings hs
  LOOP
    BEGIN
      v_local_ts := NOW() AT TIME ZONE v_household.timezone;
      v_local_date := v_local_ts::date;
      v_local_hour := EXTRACT(HOUR FROM v_local_ts)::INT;
    EXCEPTION
      WHEN OTHERS THEN
        CONTINUE;
    END;

    -- Only generate during the household's local midnight hour
    IF v_local_hour <> 0 THEN
      CONTINUE;
    END IF;

    FOR v_schedule IN
      SELECT *
      FROM recurring_schedules rs
      WHERE rs.is_active = true
        AND rs.auto_create = true
        AND rs.household_id = v_household.household_id
        AND v_local_date >= rs.schedule_start_date
        AND (rs.schedule_end_date IS NULL OR v_local_date <= rs.schedule_end_date)
        AND EXTRACT(DOW FROM v_local_date)::INT = ANY(rs.days_of_week)
    LOOP
      SELECT * INTO v_result
      FROM public._generate_recurring_log_core(
        v_schedule.id,
        v_local_date,
        false,
        v_household.household_id
      );

      household_id := v_household.household_id;
      local_date := v_local_date;
      schedule_id := v_schedule.id;
      log_id := v_result.out_log_id;
      status := v_result.out_status;
      error_message := v_result.out_error_message;
      RETURN NEXT;
    END LOOP;
  END LOOP;
END;
$$;

-- ============================================
-- 8) Grants
-- ============================================
REVOKE ALL ON FUNCTION public.generate_recurring_logs(UUID, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_recurring_logs(UUID, DATE) FROM anon;
GRANT EXECUTE ON FUNCTION public.generate_recurring_logs(UUID, DATE) TO authenticated;

REVOKE ALL ON FUNCTION public.auto_generate_recurring_logs(DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auto_generate_recurring_logs(DATE) FROM anon;
GRANT EXECUTE ON FUNCTION public.auto_generate_recurring_logs(DATE) TO authenticated;

REVOKE ALL ON FUNCTION public.bulk_generate_recurring_logs(UUID, DATE, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bulk_generate_recurring_logs(UUID, DATE, BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION public.bulk_generate_recurring_logs(UUID, DATE, BOOLEAN) TO authenticated;

REVOKE ALL ON FUNCTION public.run_due_recurring_schedules() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_due_recurring_schedules() FROM anon;
REVOKE ALL ON FUNCTION public.run_due_recurring_schedules() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.run_due_recurring_schedules() TO service_role;

COMMENT ON FUNCTION public.auto_generate_recurring_logs(DATE) IS
  'Generates today''s auto_create schedules for the caller household. Skips existing active logs.';
COMMENT ON FUNCTION public.bulk_generate_recurring_logs(UUID, DATE, BOOLEAN) IS
  'Bulk-generates logs for one schedule through end date using shared generation core.';
COMMENT ON FUNCTION public.run_due_recurring_schedules() IS
  'Service-role only. For each household in local midnight hour, generate due auto_create schedules.';
COMMENT ON TABLE public.household_settings IS
  'Per-household preferences including IANA timezone for auto-scheduling.';
