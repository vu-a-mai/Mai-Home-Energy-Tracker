-- ============================================
-- ADD SAMPLE DATA - Devices & Energy Logs
-- ============================================
-- Run this AFTER syncing auth users
-- ============================================

-- ============================================
-- Step 1: Get your IDs (for reference)
-- ============================================
SELECT 
  'Household ID:' as label,
  household_id::TEXT as value
FROM users
LIMIT 1

UNION ALL

SELECT 
  name || ' ID:' as label,
  id::TEXT as value
FROM users
ORDER BY name;

-- ============================================
-- Step 2: Add Sample Devices
-- ============================================

DO $$
DECLARE
  v_household_id UUID;
  v_vu_id UUID;
  v_vy_id UUID;
  v_thuy_id UUID;
  v_han_id UUID;
  v_vu_tesla_id UUID;
  v_vy_tesla_id UUID;
  v_han_macbook_id UUID;
  v_thuy_zenbook_id UUID;
BEGIN
  -- Get IDs
  SELECT household_id INTO v_household_id FROM users LIMIT 1;
  SELECT id INTO v_vu_id FROM users WHERE email = 'user1@example.com';
  SELECT id INTO v_vy_id FROM users WHERE email = 'user2@example.com';
  SELECT id INTO v_thuy_id FROM users WHERE email = 'user3@example.com';
  SELECT id INTO v_han_id FROM users WHERE email = 'user4@example.com';
  
  -- Insert devices
  INSERT INTO devices (household_id, name, device_type, location, wattage, is_shared, created_by)
  VALUES
    -- Shared EV Chargers
    (v_household_id, 'Vu Tesla Model Y', 'EV Charger', 'Garage', 9600, true, v_vu_id),
    (v_household_id, 'Vy Tesla Model 3', 'EV Charger', 'Garage', 9600, true, v_vy_id),
    -- Personal Computers
    (v_household_id, 'Han Macbook Pro', 'Computer', 'Bedroom', 96, false, v_han_id),
    (v_household_id, 'Thuy Asus Zenbook', 'Computer', 'Office', 45, false, v_thuy_id),
    -- Shared Appliances
    (v_household_id, 'Living Room TV', 'TV', 'Living Room', 150, true, v_vu_id),
    (v_household_id, 'Kitchen Refrigerator', 'Refrigerator', 'Kitchen', 150, true, v_thuy_id),
    (v_household_id, 'Washing Machine', 'Washing Machine', 'Laundry Room', 500, true, v_vy_id),
    (v_household_id, 'Air Conditioner', 'Air Conditioner', 'Living Room', 3500, true, v_han_id)
  RETURNING id INTO v_vu_tesla_id;
  
  -- Get device IDs for energy logs
  SELECT id INTO v_vu_tesla_id FROM devices WHERE name = 'Vu Tesla Model Y';
  SELECT id INTO v_vy_tesla_id FROM devices WHERE name = 'Vy Tesla Model 3';
  SELECT id INTO v_han_macbook_id FROM devices WHERE name = 'Han Macbook Pro';
  SELECT id INTO v_thuy_zenbook_id FROM devices WHERE name = 'Thuy Asus Zenbook';
  
  RAISE NOTICE '✅ Devices created successfully!';
  
  -- ============================================
  -- Step 3: Add Sample Energy Logs
  -- ============================================
  
  -- Vu Tesla charging (overnight Off-Peak)
  INSERT INTO energy_logs (household_id, device_id, usage_date, start_time, end_time, assigned_users, created_by)
  VALUES (
    v_household_id,
    v_vu_tesla_id,
    CURRENT_DATE - INTERVAL '2 days',
    '21:17:00',
    '02:37:00',
    ARRAY[v_vu_id],
    v_vu_id
  );
  
  -- Vy Tesla charging (afternoon to evening)
  INSERT INTO energy_logs (household_id, device_id, usage_date, start_time, end_time, assigned_users, created_by)
  VALUES (
    v_household_id,
    v_vy_tesla_id,
    CURRENT_DATE - INTERVAL '2 days',
    '16:38:00',
    '22:38:00',
    ARRAY[v_vy_id],
    v_vy_id
  );
  
  -- Han Macbook (work from home - full day)
  INSERT INTO energy_logs (household_id, device_id, usage_date, start_time, end_time, assigned_users, created_by)
  VALUES (
    v_household_id,
    v_han_macbook_id,
    CURRENT_DATE - INTERVAL '1 day',
    '08:00:00',
    '18:00:00',
    ARRAY[v_han_id],
    v_han_id
  );
  
  -- Thuy Zenbook (evening work)
  INSERT INTO energy_logs (household_id, device_id, usage_date, start_time, end_time, assigned_users, created_by)
  VALUES (
    v_household_id,
    v_thuy_zenbook_id,
    CURRENT_DATE - INTERVAL '1 day',
    '20:00:00',
    '23:30:00',
    ARRAY[v_thuy_id],
    v_thuy_id
  );
  
  -- Today's logs
  -- Vu Tesla (morning charge)
  INSERT INTO energy_logs (household_id, device_id, usage_date, start_time, end_time, assigned_users, created_by)
  VALUES (
    v_household_id,
    v_vu_tesla_id,
    CURRENT_DATE,
    '07:00:00',
    '10:30:00',
    ARRAY[v_vu_id],
    v_vu_id
  );
  
  -- Han Macbook (today)
  INSERT INTO energy_logs (household_id, device_id, usage_date, start_time, end_time, assigned_users, created_by)
  VALUES (
    v_household_id,
    v_han_macbook_id,
    CURRENT_DATE,
    '09:00:00',
    '17:00:00',
    ARRAY[v_han_id],
    v_han_id
  );
  
  RAISE NOTICE '✅ Energy logs created successfully!';
  RAISE NOTICE 'Costs are auto-calculated by triggers!';
END $$;

-- ============================================
-- Step 4: Verify Everything
-- ============================================

-- View all devices
SELECT 
  name,
  device_type,
  wattage,
  is_shared,
  u.name as created_by
FROM devices d
JOIN users u ON d.created_by = u.id
ORDER BY is_shared DESC, name;

-- View all energy logs with calculated costs
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

-- Summary by user
SELECT 
  u.name,
  COUNT(el.id) as total_logs,
  ROUND(SUM(el.total_kwh), 2) as total_kwh,
  ROUND(SUM(el.calculated_cost), 2) as total_cost
FROM users u
LEFT JOIN energy_logs el ON u.id = ANY(el.assigned_users)
GROUP BY u.name
ORDER BY u.name;

-- ============================================
-- SUCCESS!
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Sample data added successfully!';
  RAISE NOTICE 'You now have:';
  RAISE NOTICE '  - 8 devices (4 personal, 4 shared)';
  RAISE NOTICE '  - 6 energy logs with auto-calculated costs';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Test your app by logging in!';
END $$;
