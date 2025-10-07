-- Find ALL Tesla entries
SELECT 
  el.id,
  d.name as device_name,
  el.usage_date,
  el.start_time,
  el.end_time,
  el.total_kwh,
  el.calculated_cost,
  el.source_type,
  el.created_at
FROM energy_logs el
JOIN devices d ON el.device_id = d.id
WHERE d.name LIKE '%Tesla%'
ORDER BY el.usage_date DESC, el.created_at DESC;
