-- Fix Missing Assigned Users in Energy Logs
-- Step 1: Add the assigned_users column if it doesn't exist
-- Step 2: Populate it based on device names

-- ============================================
-- STEP 1: Add the column
-- ============================================

-- Add assigned_users column to energy_logs table
ALTER TABLE energy_logs 
ADD COLUMN IF NOT EXISTS assigned_users UUID[];

-- ============================================
-- STEP 2: Populate assigned_users
-- ============================================

-- For Han's devices
UPDATE energy_logs
SET assigned_users = ARRAY[
  (SELECT id FROM users WHERE name ILIKE '%Han%' LIMIT 1)
]
WHERE (assigned_users IS NULL OR assigned_users = '{}')
  AND device_id IN (
    SELECT id FROM devices WHERE name ILIKE '%Han%'
  );

-- For Vu's devices
UPDATE energy_logs
SET assigned_users = ARRAY[
  (SELECT id FROM users WHERE name ILIKE '%Vu%' AND name NOT ILIKE '%Thuy%' LIMIT 1)
]
WHERE (assigned_users IS NULL OR assigned_users = '{}')
  AND device_id IN (
    SELECT id FROM devices WHERE name ILIKE '%Vu%'
  );

-- For Thuy's devices
UPDATE energy_logs
SET assigned_users = ARRAY[
  (SELECT id FROM users WHERE name ILIKE '%Thuy%' LIMIT 1)
]
WHERE (assigned_users IS NULL OR assigned_users = '{}')
  AND device_id IN (
    SELECT id FROM devices WHERE name ILIKE '%Thuy%'
  );

-- For Vy's devices
UPDATE energy_logs
SET assigned_users = ARRAY[
  (SELECT id FROM users WHERE name ILIKE '%Vy%' LIMIT 1)
]
WHERE (assigned_users IS NULL OR assigned_users = '{}')
  AND device_id IN (
    SELECT id FROM devices WHERE name ILIKE '%Vy%'
  );

-- ============================================
-- STEP 3: Verify the changes
-- ============================================

SELECT 
  d.name as device_name,
  u.name as assigned_to,
  el.calculated_cost,
  el.usage_date
FROM energy_logs el
JOIN devices d ON el.device_id = d.id
LEFT JOIN users u ON u.id = ANY(el.assigned_users)
ORDER BY el.created_at DESC
LIMIT 10;
