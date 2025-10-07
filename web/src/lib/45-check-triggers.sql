-- Check all triggers on energy_logs table
SELECT 
  trigger_name,
  event_manipulation as event,
  action_timing as timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'energy_logs'
ORDER BY trigger_name;
