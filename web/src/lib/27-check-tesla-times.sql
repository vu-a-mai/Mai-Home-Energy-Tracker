-- Check the Tesla entry's time range
SELECT 
  id,
  usage_date,
  start_time,
  end_time,
  total_kwh,
  calculated_cost,
  -- Calculate what the UI would show based on time
  -- 9600W device, time difference
  EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0 as hours,
  (9600.0 / 1000.0) * (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0) as recalculated_kwh
FROM energy_logs
WHERE id = '6eda826b-63e0-446d-a8ce-1abf7622b475'::uuid;
