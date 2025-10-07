-- Disable the problematic cost calculation trigger
DROP TRIGGER IF EXISTS energy_logs_calculate_cost ON energy_logs;

-- Keep the updated_at trigger (it's harmless)
-- energy_logs_updated_at is fine to keep

-- Verify the trigger is gone
SELECT 
  trigger_name,
  event_manipulation as event,
  action_timing as timing
FROM information_schema.triggers
WHERE event_object_table = 'energy_logs'
ORDER BY trigger_name;
