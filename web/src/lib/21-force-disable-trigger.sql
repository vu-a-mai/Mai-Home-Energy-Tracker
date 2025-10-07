-- ============================================
-- TEMPORARY: Completely disable the trigger
-- ============================================
-- This is a temporary fix to test if disabling the trigger
-- allows your manual values to work.
-- We can re-enable it later for regular entries.
-- ============================================

-- Disable the trigger completely
ALTER TABLE energy_logs DISABLE TRIGGER energy_logs_calculate_cost;

-- Verify it's disabled
SELECT 
  tgname as trigger_name,
  CASE tgenabled
    WHEN 'D' THEN '❌ DISABLED'
    WHEN 'O' THEN '✅ ENABLED'
    ELSE 'UNKNOWN'
  END as status
FROM pg_trigger
WHERE tgname = 'energy_logs_calculate_cost';

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '⚠️  TRIGGER TEMPORARILY DISABLED';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'The energy_logs_calculate_cost trigger has been disabled.';
  RAISE NOTICE '';
  RAISE NOTICE 'What this means:';
  RAISE NOTICE '  ✅ Manual bulk entries will keep your kWh values';
  RAISE NOTICE '  ❌ Regular entries will NOT auto-calculate cost';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Delete the wrong Tesla entry (230.40 kWh)';
  RAISE NOTICE '  2. Create new entry with 412 kWh';
  RAISE NOTICE '  3. Verify it shows 412 kWh and $103.00';
  RAISE NOTICE '';
  RAISE NOTICE 'After testing, we can re-enable with better logic.';
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
END $$;
