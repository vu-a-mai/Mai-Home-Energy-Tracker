-- ============================================
-- Diagnostic: Check if trigger was updated
-- ============================================

-- 1. Check if trigger exists
SELECT 
  tgname as trigger_name,
  tgtype,
  tgenabled
FROM pg_trigger
WHERE tgname = 'energy_logs_calculate_cost';

-- 2. Check the function source code
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'trigger_calculate_energy_cost';

-- 3. Test what the trigger would do with sample data
-- This shows if the logic is working
DO $$
DECLARE
  test_source_type TEXT := 'manual';
  test_kwh NUMERIC := 412.00;
  test_cost NUMERIC := 103.00;
  should_skip BOOLEAN;
BEGIN
  -- Test the condition
  should_skip := (test_source_type = 'manual' AND test_kwh IS NOT NULL AND test_cost IS NOT NULL);
  
  RAISE NOTICE '';
  RAISE NOTICE '=== TRIGGER LOGIC TEST ===';
  RAISE NOTICE 'source_type: %', test_source_type;
  RAISE NOTICE 'total_kwh: %', test_kwh;
  RAISE NOTICE 'calculated_cost: %', test_cost;
  RAISE NOTICE 'Should skip recalculation? %', should_skip;
  RAISE NOTICE '';
  
  IF should_skip THEN
    RAISE NOTICE '✅ Logic is correct - would skip recalculation';
  ELSE
    RAISE NOTICE '❌ Logic is wrong - would recalculate (THIS IS THE BUG)';
  END IF;
END $$;
