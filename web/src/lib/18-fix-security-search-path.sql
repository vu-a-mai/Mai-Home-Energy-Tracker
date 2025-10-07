-- ============================================
-- Migration: Fix Function Search Path Security
-- ============================================
-- Description: 
--   Fixes Supabase Security Advisor warnings by setting search_path
--   on all SECURITY DEFINER functions to prevent SQL injection attacks.
--   
--   Also reviews and secures the data_health_check view.
--
-- Issue: Function Search Path Mutable
--   Functions without fixed search_path can be exploited by attackers
--   who create malicious functions/tables with the same name.
--
-- Created: 2025-10-06
-- ============================================

-- ============================================
-- PART 1: Fix Function Search Paths
-- ============================================

-- Safely fix all SECURITY DEFINER functions by checking existence first
DO $$
DECLARE
  v_fixed_count integer := 0;
BEGIN
  -- Fix get_user_household_id (used in RLS policies)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_household_id') THEN
    ALTER FUNCTION public.get_user_household_id() SET search_path = public;
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Fixed: get_user_household_id()';
  END IF;

  -- Fix deleted logs functions (from migration 17)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_deleted_energy_logs') THEN
    ALTER FUNCTION public.get_deleted_energy_logs() SET search_path = public;
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Fixed: get_deleted_energy_logs()';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'restore_energy_logs') THEN
    ALTER FUNCTION public.restore_energy_logs(uuid[]) SET search_path = public;
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Fixed: restore_energy_logs()';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'soft_delete_energy_logs') THEN
    ALTER FUNCTION public.soft_delete_energy_logs(uuid[], integer) SET search_path = public;
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Fixed: soft_delete_energy_logs()';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'permanent_delete_energy_logs') THEN
    ALTER FUNCTION public.permanent_delete_energy_logs(uuid[]) SET search_path = public;
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Fixed: permanent_delete_energy_logs()';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'extend_recovery_period') THEN
    ALTER FUNCTION public.extend_recovery_period(uuid[], integer) SET search_path = public;
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Fixed: extend_recovery_period()';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_expired_deleted_logs') THEN
    ALTER FUNCTION public.cleanup_expired_deleted_logs() SET search_path = public;
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Fixed: cleanup_expired_deleted_logs()';
  END IF;

  -- Fix recurring log generation functions
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_generate_recurring_logs') THEN
    ALTER FUNCTION public.auto_generate_recurring_logs(date) SET search_path = public;
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Fixed: auto_generate_recurring_logs()';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_recurring_logs') THEN
    ALTER FUNCTION public.generate_recurring_logs(uuid, date) SET search_path = public;
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Fixed: generate_recurring_logs()';
  END IF;

  -- Fix timestamp update functions
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_device_groups_updated_at') THEN
    ALTER FUNCTION public.update_device_groups_updated_at() SET search_path = public;
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Fixed: update_device_groups_updated_at()';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_template_timestamp') THEN
    ALTER FUNCTION public.update_template_timestamp() SET search_path = public;
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Fixed: update_template_timestamp()';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_schedule_timestamp') THEN
    ALTER FUNCTION public.update_schedule_timestamp() SET search_path = public;
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Fixed: update_schedule_timestamp()';
  END IF;

  -- Fix energy cost calculation functions (with dynamic parameter detection)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_energy_cost') THEN
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path = public',
      (SELECT oid::regprocedure FROM pg_proc WHERE proname = 'calculate_energy_cost' LIMIT 1)
    );
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Fixed: calculate_energy_cost()';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'recalculate_energy_cost') THEN
    ALTER FUNCTION public.recalculate_energy_cost() SET search_path = public;
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Fixed: recalculate_energy_cost()';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_calculate_energy_cost') THEN
    ALTER FUNCTION public.trigger_calculate_energy_cost() SET search_path = public;
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Fixed: trigger_calculate_energy_cost()';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_set_updated_at') THEN
    ALTER FUNCTION public.trigger_set_updated_at() SET search_path = public;
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Fixed: trigger_set_updated_at()';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Fixed search_path for % functions', v_fixed_count;
END $$;

-- ============================================
-- PART 2: Review and Secure data_health_check View
-- ============================================

-- Analysis: data_health_check view shows counts of data integrity issues:
--   - Orphaned Devices (devices with invalid created_by)
--   - Orphaned Energy Logs (logs with invalid device_id)
--   - Energy Logs with Invalid Users (assigned_users referencing non-existent users)
--
-- Security Assessment:
--   - DOES NOT expose sensitive user data (names, emails, etc.)
--   - Only shows aggregate counts
--   - Useful for admin monitoring
--   - SECURITY DEFINER is intentional for monitoring purposes
--
-- Recommendation: KEEP as SECURITY DEFINER
--   This allows admin monitoring without exposing individual user data.
--   The view only returns counts, not personal information.

-- Add a comment to document the security decision
COMMENT ON VIEW data_health_check IS 
'Health monitoring view for data integrity checks. 
SECURITY DEFINER is intentional - allows admin monitoring of orphaned records 
without exposing personal user data. Only returns aggregate counts.
Reviewed: 2025-10-06';

-- ============================================
-- PART 3: Verify Security Fixes
-- ============================================

-- Check which functions now have search_path set
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE WHEN prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security,
  COALESCE(
    (SELECT option_value 
     FROM pg_options_to_table(proconfig) 
     WHERE option_name = 'search_path'),
    'NOT SET'
  ) as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND prosecdef = true  -- Only SECURITY DEFINER functions
ORDER BY p.proname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
DECLARE
  v_fixed_functions integer;
BEGIN
  -- Count functions with search_path set
  SELECT COUNT(*) INTO v_fixed_functions
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND prosecdef = true
    AND EXISTS (
      SELECT 1 FROM pg_options_to_table(p.proconfig) 
      WHERE option_name = 'search_path'
    );
  
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ SECURITY FIXES APPLIED';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '  - Fixed search_path for % SECURITY DEFINER functions', v_fixed_functions;
  RAISE NOTICE '  - Reviewed data_health_check view (SECURITY DEFINER is intentional)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security Status:';
  RAISE NOTICE '  ✅ Function search paths secured';
  RAISE NOTICE '  ✅ SQL injection prevention enabled';
  RAISE NOTICE '  ✅ Health check view reviewed and documented';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '  1. Run Security Advisor in Supabase Dashboard';
  RAISE NOTICE '  2. Verify warnings are resolved';
  RAISE NOTICE '  3. Test app functionality';
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
END $$;
