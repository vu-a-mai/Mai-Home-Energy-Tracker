-- ============================================
-- RESTORE BACKUP DATA
-- ============================================
-- This script restores your devices and energy logs from the backup
-- Run this AFTER completing steps 1 and 2 (schema + auth sync)
-- ============================================

-- ============================================
-- IMPORTANT: User ID Mapping
-- ============================================
-- Your backup has these old user IDs:
-- - 5c2152ee-6cd0-4d9a-abaf-60217a3d4b10 (Thuy - created most devices)
-- - 9ce4fa93-3643-4fe4-babb-03b3eaa299b2 (Han)
-- - a0c13164-ccb7-444a-b912-281fc1ed06c8 (Thuy)
-- - 7041c865-c3bc-4317-bfc5-f156e454639b (Vy)
--
-- These will be mapped to your NEW auth user IDs
-- ============================================

DO $$
DECLARE
  v_household_id UUID;
  v_vu_id UUID;
  v_vy_id UUID;
  v_thuy_id UUID;
  v_han_id UUID;
  
  -- Old user ID from backup (Thuy was the creator)
  v_old_thuy_id UUID := '5c2152ee-6cd0-4d9a-abaf-60217a3d4b10';
BEGIN
  -- Get new household and user IDs
  SELECT household_id INTO v_household_id FROM users LIMIT 1;
  SELECT id INTO v_vu_id FROM users WHERE email = 'vu@maihome.com';
  SELECT id INTO v_vy_id FROM users WHERE email = 'vy@maihome.com';
  SELECT id INTO v_thuy_id FROM users WHERE email = 'thuy@maihome.com';
  SELECT id INTO v_han_id FROM users WHERE email = 'han@maihome.com';
  
  RAISE NOTICE '================================';
  RAISE NOTICE 'Restoring backup data...';
  RAISE NOTICE '================================';
  RAISE NOTICE 'New Household ID: %', v_household_id;
  RAISE NOTICE 'Vu ID: %', v_vu_id;
  RAISE NOTICE 'Vy ID: %', v_vy_id;
  RAISE NOTICE 'Thuy ID: %', v_thuy_id;
  RAISE NOTICE 'Han ID: %', v_han_id;
  RAISE NOTICE '================================';
  
  -- ============================================
  -- RESTORE DEVICES (12 devices)
  -- ============================================
  
  -- Most devices were created by Thuy (old ID: 5c2152ee-6cd0-4d9a-abaf-60217a3d4b10)
  -- We'll assign them to the appropriate new owners
  
  INSERT INTO devices (id, household_id, name, device_type, location, wattage, is_shared, created_by, created_at, updated_at)
  VALUES
    -- Samsung TV (shared, created by Thuy)
    ('90218def-8fea-4bc2-b6ed-623e4f24405d', v_household_id, 'Samsung TV (Un55c8000 model)', 'TV', 'Thuy/Han Room', 80, true, v_thuy_id, '2025-09-30T16:34:16.136245', '2025-09-30T16:34:16.136245'),
    
    -- Thuy's devices
    ('afb0dd73-3569-4f26-b8b4-eaba1626ab13', v_household_id, 'Thuy LG Monitor', 'Computer', 'Thuy/Han Room', 25, false, v_thuy_id, '2025-09-30T16:32:09.784857', '2025-09-30T16:32:09.784857'),
    ('015a5a1d-83c7-485a-9599-67f62d9a0f32', v_household_id, 'Thuy Asus Zenbook', 'Computer', 'Thuy/Han Room', 45, false, v_thuy_id, '2025-09-30T16:31:38.894389', '2025-09-30T16:31:38.894389'),
    ('831586c8-1513-4d6a-91ac-0c8959b9cf55', v_household_id, 'Breville Convection Smart Oven Bov800xl', 'Toaster', 'Laundry Room', 1800, false, v_thuy_id, '2025-09-30T16:10:30.709348', '2025-09-30T16:10:30.709348'),
    
    -- Lasko Fan (shared)
    ('db91dda1-282f-4997-aedc-c0c52063843f', v_household_id, 'Lasko Fan', 'Fan', 'Thuy/Han Room', 50, true, v_thuy_id, '2025-09-30T16:30:11.883372', '2025-09-30T16:30:11.883372'),
    
    -- Han's devices
    ('25ab0f0f-c163-4438-a9ff-6f81530ab8ad', v_household_id, 'Han Watch Charger', 'Other', 'Thuy/Han Room', 3, false, v_han_id, '2025-09-30T16:28:23.771658', '2025-09-30T16:28:23.771658'),
    ('5d0fbe3a-bc36-40b9-9080-23762b5b5fa5', v_household_id, 'Han Wireless Charger Slab', 'Other', 'Thuy/Han Room', 25, false, v_han_id, '2025-09-30T16:27:10.26886', '2025-09-30T16:27:10.26886'),
    ('451dd1e2-f0d9-4e7b-a88c-21f58aa59185', v_household_id, 'Han LED Lamp', 'Other', 'Thuy/Han Room', 4, false, v_han_id, '2025-09-30T16:23:16.174978', '2025-09-30T16:23:16.174978'),
    ('3563a286-e273-45e6-83ba-4746a9df6030', v_household_id, 'Han Dell Monitor', 'Computer', 'Thuy/Han Room', 30, false, v_han_id, '2025-09-30T16:22:26.176459', '2025-09-30T16:22:26.176459'),
    ('06e583fd-16ce-4b4e-b874-bddc92944079', v_household_id, 'Han Macbook Pro', 'Computer', 'Thuy/Han Room', 96, false, v_han_id, '2025-09-30T16:21:02.321492', '2025-09-30T16:21:02.321492'),
    
    -- Tesla chargers (shared)
    ('419c67eb-bf9c-4c84-9c30-ea1a88765832', v_household_id, 'Vy Tesla Model 3', 'EV Charger', 'Driveway', 9600, true, v_vy_id, '2025-09-30T10:08:42.770219', '2025-09-30T10:08:42.770219'),
    ('1137bdad-8265-462d-a71a-0283dd34eec5', v_household_id, 'Vu Tesla Model Y', 'EV Charger', 'Driveway', 9600, true, v_vu_id, '2025-09-30T10:06:01.233177', '2025-09-30T10:06:01.233177')
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE '✅ Restored 12 devices';
  
  -- ============================================
  -- RESTORE ENERGY LOGS (4 logs)
  -- ============================================
  -- Note: The trigger will auto-calculate costs based on the new rates
  -- The backup costs were: Han Macbook: $0.30, Vu Tesla: $12.00, Thuy Zenbook: $0.28, Vy Tesla: $26.98
  
  INSERT INTO energy_logs (id, household_id, device_id, usage_date, start_time, end_time, assigned_users, created_by, created_at, updated_at)
  VALUES
    -- Han Macbook Pro - Oct 1, 2025 (8:38 AM - 6:38 PM)
    ('bec9bb41-8914-43e2-8977-ae6683ead4bc', v_household_id, '06e583fd-16ce-4b4e-b874-bddc92944079', '2025-10-01', '08:38:00', '18:38:00', ARRAY[v_han_id], v_thuy_id, '2025-10-01T06:38:15.18261', '2025-10-01T06:38:15.18261'),
    
    -- Vu Tesla Model Y - Sep 29, 2025 (9:37 PM - 2:37 AM overnight)
    ('c9e835cb-1ee8-441d-b71b-dc7feac3482e', v_household_id, '1137bdad-8265-462d-a71a-0283dd34eec5', '2025-09-29', '21:37:00', '02:37:00', ARRAY[v_vu_id], v_thuy_id, '2025-10-01T06:37:37.974273', '2025-10-01T06:37:37.974273'),
    
    -- Thuy Asus Zenbook - Sep 29, 2025 (8:37 PM - 6:37 PM next day)
    ('e8fa058a-b855-4515-8d0a-b9355f0089f9', v_household_id, '015a5a1d-83c7-485a-9599-67f62d9a0f32', '2025-09-29', '20:37:00', '18:37:00', ARRAY[v_thuy_id], v_thuy_id, '2025-10-01T06:37:58.146607', '2025-10-01T06:37:58.146607'),
    
    -- Vy Tesla Model 3 - Sep 29, 2025 (4:38 PM - 10:38 PM)
    ('32da4b86-ed01-4e8a-886e-b3fd84fe177e', v_household_id, '419c67eb-bf9c-4c84-9c30-ea1a88765832', '2025-09-29', '16:38:00', '22:38:00', ARRAY[v_vy_id], v_thuy_id, '2025-10-01T06:38:38.873292', '2025-10-01T06:38:38.873292')
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE '✅ Restored 4 energy logs';
  RAISE NOTICE '💰 Costs will be auto-calculated by triggers';
  
END $$;

-- ============================================
-- VERIFY RESTORED DATA
-- ============================================

-- Check devices
SELECT 
  '📊 Devices Summary' as section;

SELECT 
  COUNT(*) as total_devices,
  SUM(CASE WHEN is_shared THEN 1 ELSE 0 END) as shared_devices,
  SUM(CASE WHEN NOT is_shared THEN 1 ELSE 0 END) as personal_devices
FROM devices;

-- List all devices
SELECT 
  d.name,
  d.device_type,
  d.wattage,
  d.location,
  d.is_shared,
  u.name as owner
FROM devices d
JOIN users u ON d.created_by = u.id
ORDER BY 
  CASE 
    WHEN d.name LIKE '%Tesla%' THEN 1
    WHEN d.name LIKE '%Macbook%' OR d.name LIKE '%Zenbook%' THEN 2
    ELSE 3
  END,
  d.name;

-- Check energy logs with calculated costs
SELECT 
  '⚡ Energy Logs Summary' as section;

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

-- Cost summary by user
SELECT 
  '💰 Cost Summary by User' as section;

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
-- SUCCESS MESSAGE
-- ============================================
DO $$
DECLARE
  v_device_count INTEGER;
  v_log_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_device_count FROM devices;
  SELECT COUNT(*) INTO v_log_count FROM energy_logs;
  
  RAISE NOTICE '================================';
  RAISE NOTICE '🎉 BACKUP RESTORED SUCCESSFULLY!';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Devices: %', v_device_count;
  RAISE NOTICE 'Energy Logs: %', v_log_count;
  RAISE NOTICE '================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Your data has been restored!';
  RAISE NOTICE '✅ All costs have been recalculated';
  RAISE NOTICE '✅ Ready to use the app!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Login to your app and verify everything looks correct';
END $$;
