-- ============================================
-- FIX MISSING COSTS FOR OVERNIGHT SESSIONS
-- ============================================
-- This fixes the 2 energy logs that didn't calculate properly
-- ============================================

-- Check current state
SELECT 
  d.name as device,
  el.usage_date,
  el.start_time,
  el.end_time,
  el.total_kwh,
  el.calculated_cost
FROM energy_logs el
JOIN devices d ON el.device_id = d.id
WHERE el.total_kwh = 0 OR el.calculated_cost = 0
ORDER BY el.usage_date DESC;

-- ============================================
-- Option 1: Delete and re-insert (triggers will fire)
-- ============================================

DO $$
DECLARE
  v_household_id UUID;
  v_vu_id UUID;
  v_thuy_id UUID;
BEGIN
  -- Get IDs
  SELECT household_id INTO v_household_id FROM users LIMIT 1;
  SELECT id INTO v_vu_id FROM users WHERE email = 'user1@example.com';
  SELECT id INTO v_thuy_id FROM users WHERE email = 'user3@example.com';
  
  -- Delete the problematic logs
  DELETE FROM energy_logs WHERE id IN (
    'e8fa058a-b855-4515-8d0a-b9355f0089f9',  -- Thuy Zenbook
    'c9e835cb-1ee8-441d-b71b-dc7feac3482e'   -- Vu Tesla
  );
  
  -- Re-insert them (trigger will calculate)
  INSERT INTO energy_logs (id, household_id, device_id, usage_date, start_time, end_time, assigned_users, created_by)
  VALUES
    -- Thuy Asus Zenbook - Sep 29, 2025 (8:37 PM - 6:37 PM next day = 22 hours)
    ('e8fa058a-b855-4515-8d0a-b9355f0089f9', v_household_id, '015a5a1d-83c7-485a-9599-67f62d9a0f32', '2025-09-29', '20:37:00', '18:37:00', ARRAY[v_thuy_id], v_thuy_id),
    
    -- Vu Tesla Model Y - Sep 29, 2025 (9:37 PM - 2:37 AM overnight = 5 hours)
    ('c9e835cb-1ee8-441d-b71b-dc7feac3482e', v_household_id, '1137bdad-8265-462d-a71a-0283dd34eec5', '2025-09-29', '21:37:00', '02:37:00', ARRAY[v_vu_id], v_thuy_id);
  
  RAISE NOTICE '✅ Re-inserted 2 energy logs with trigger calculation';
END $$;

-- ============================================
-- Verify the fix
-- ============================================

SELECT 
  d.name as device,
  el.usage_date,
  el.start_time,
  el.end_time,
  el.total_kwh,
  el.calculated_cost,
  u.name as assigned_to
FROM energy_logs el
JOIN devices d ON el.device_id = d.id
LEFT JOIN users u ON u.id = ANY(el.assigned_users)
ORDER BY el.usage_date DESC, el.start_time;

-- Cost summary
SELECT 
  u.name,
  COUNT(el.id) as log_count,
  ROUND(SUM(el.total_kwh), 2) as total_kwh,
  ROUND(SUM(el.calculated_cost), 2) as total_cost
FROM users u
LEFT JOIN energy_logs el ON u.id = ANY(el.assigned_users)
GROUP BY u.name
ORDER BY total_cost DESC;

-- ============================================
-- Expected Results:
-- ============================================
-- Thuy Zenbook: ~0.99 kWh, ~$0.08 (22 hours at 45W, mostly off-peak)
-- Vu Tesla: ~48 kWh, ~$3.94 (5 hours at 9600W, all off-peak overnight)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Fix complete!';
  RAISE NOTICE 'All energy logs should now have calculated costs';
END $$;
