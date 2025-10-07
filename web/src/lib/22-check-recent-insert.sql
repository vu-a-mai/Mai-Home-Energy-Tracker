-- Check what was actually inserted in the most recent entry
SELECT 
  id,
  device_id,
  usage_date,
  start_time,
  end_time,
  total_kwh,
  calculated_cost,
  source_type,
  rate_breakdown::text as rate_breakdown,
  created_at
FROM energy_logs
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 3;

-- Also check what the trigger would see
DO $$
DECLARE
  latest_log RECORD;
BEGIN
  SELECT * INTO latest_log
  FROM energy_logs
  WHERE created_at > NOW() - INTERVAL '10 minutes'
  ORDER BY created_at DESC
  LIMIT 1;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== LATEST LOG ANALYSIS ===';
  RAISE NOTICE 'source_type: %', latest_log.source_type;
  RAISE NOTICE 'total_kwh: %', latest_log.total_kwh;
  RAISE NOTICE 'calculated_cost: %', latest_log.calculated_cost;
  RAISE NOTICE '';
  RAISE NOTICE 'Condition check:';
  RAISE NOTICE '  source_type = ''manual''? %', (latest_log.source_type = 'manual');
  RAISE NOTICE '  total_kwh IS NOT NULL? %', (latest_log.total_kwh IS NOT NULL);
  RAISE NOTICE '  calculated_cost IS NOT NULL? %', (latest_log.calculated_cost IS NOT NULL);
  RAISE NOTICE '';
  RAISE NOTICE 'Would skip recalculation? %', 
    (latest_log.source_type = 'manual' AND latest_log.total_kwh IS NOT NULL AND latest_log.calculated_cost IS NOT NULL);
END $$;
