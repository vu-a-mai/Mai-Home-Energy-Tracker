-- Check which database you're connected to
SELECT current_database() as database_name;

-- Check if recent entry creation happened HERE
SELECT 
  COUNT(*) as total_entries,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as last_hour,
  COUNT(CASE WHEN total_kwh > 100 THEN 1 END) as large_kwh_entries
FROM energy_logs;

-- Show all entries from today with device names
SELECT 
  el.id,
  d.name as device_name,
  el.usage_date,
  el.total_kwh,
  el.calculated_cost,
  el.source_type,
  el.created_at
FROM energy_logs el
LEFT JOIN devices d ON el.device_id = d.id
WHERE DATE(el.created_at) = CURRENT_DATE
ORDER BY el.created_at DESC;
