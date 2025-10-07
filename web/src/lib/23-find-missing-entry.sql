-- Find the entry we just created
SELECT 
  id,
  usage_date,
  start_time,
  end_time,
  total_kwh,
  calculated_cost,
  source_type,
  created_at
FROM energy_logs
WHERE id = '71c7fb50-9ba6-498b-a88b-b742fdb9a27a'::uuid;

-- Also check if there are ANY manual bulk entries
SELECT 
  id,
  usage_date,
  total_kwh,
  calculated_cost,
  source_type,
  created_at
FROM energy_logs
WHERE source_type = 'manual'
ORDER BY created_at DESC
LIMIT 5;

-- Check for ANY entries with 412 kWh
SELECT 
  id,
  usage_date,
  total_kwh,
  calculated_cost,
  source_type,
  created_at
FROM energy_logs
WHERE total_kwh = 412
ORDER BY created_at DESC;
