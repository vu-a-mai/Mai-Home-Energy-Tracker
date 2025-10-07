-- Get detailed info about all August logs with device info
SELECT 
  el.id,
  el.usage_date,
  el.start_time,
  el.end_time,
  el.assigned_users,
  el.created_by,
  d.name as device_name,
  d.wattage,
  -- Calculate hours of usage
  EXTRACT(EPOCH FROM (el.end_time - el.start_time)) / 3600 as hours,
  -- Calculate approximate kWh (wattage * hours / 1000)
  (d.wattage * EXTRACT(EPOCH FROM (el.end_time - el.start_time)) / 3600 / 1000) as approximate_kwh
FROM energy_logs el
JOIN devices d ON el.device_id = d.id
WHERE el.usage_date >= '2025-08-01' AND el.usage_date <= '2025-08-31'
ORDER BY el.usage_date, el.created_at;
