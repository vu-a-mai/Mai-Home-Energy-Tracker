-- Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'energy_logs'
ORDER BY trigger_name;

-- Disable the trigger that calculates costs (causes timeout)
DROP TRIGGER IF EXISTS calculate_cost_on_insert ON energy_logs;
DROP TRIGGER IF EXISTS calculate_cost_on_update ON energy_logs;
DROP TRIGGER IF EXISTS set_energy_log_cost ON energy_logs;
DROP TRIGGER IF EXISTS update_energy_log_cost ON energy_logs;

-- Verify triggers are gone
SELECT 
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'energy_logs';
