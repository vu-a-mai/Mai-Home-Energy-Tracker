-- Check the entry that was just created
SELECT 
  id,
  device_id,
  usage_date,
  start_time,
  end_time,
  total_kwh,
  calculated_cost,
  source_type,
  created_at
FROM energy_logs
WHERE id = '6eda826b-63e0-446d-a8ce-1abf7622b475'::uuid;

-- Also check all entries from the last 5 minutes
SELECT 
  id,
  usage_date,
  total_kwh,
  calculated_cost,
  source_type,
  created_at
FROM energy_logs
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
