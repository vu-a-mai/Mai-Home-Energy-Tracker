-- ============================================
-- IDENTIFY AND REMOVE DUPLICATE ENERGY LOGS
-- ============================================
-- This script helps identify and remove duplicate energy log entries
-- Run this in the Supabase SQL Editor

-- Step 1: Identify duplicate energy logs
-- Duplicates are defined as logs with the same:
-- - device_id, usage_date, start_time, end_time, household_id

SELECT 
  device_id,
  usage_date,
  start_time,
  end_time,
  household_id,
  COUNT(*) as duplicate_count,
  array_agg(id) as duplicate_ids,
  array_agg(created_at) as created_dates
FROM energy_logs
GROUP BY device_id, usage_date, start_time, end_time, household_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, usage_date DESC;

-- Step 2: Show detailed information about duplicates
SELECT 
  el.*,
  d.name as device_name,
  d.wattage as device_wattage
FROM energy_logs el
LEFT JOIN devices d ON el.device_id = d.id
WHERE (el.device_id, el.usage_date, el.start_time, el.end_time, el.household_id) IN (
  SELECT device_id, usage_date, start_time, end_time, household_id
  FROM energy_logs
  GROUP BY device_id, usage_date, start_time, end_time, household_id
  HAVING COUNT(*) > 1
)
ORDER BY el.usage_date DESC, el.start_time DESC, el.created_at ASC;

-- Step 3: Remove duplicates (keeps the oldest entry based on created_at)
-- CAUTION: This will DELETE duplicate records. Review the above queries first!
-- Uncomment the following section to actually delete duplicates:

/*
DELETE FROM energy_logs
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY device_id, usage_date, start_time, end_time, household_id 
        ORDER BY created_at ASC
      ) AS row_num
    FROM energy_logs
  ) t
  WHERE row_num > 1
);
*/

-- Step 4: Verify no duplicates remain
SELECT 
  device_id,
  usage_date,
  start_time,
  end_time,
  household_id,
  COUNT(*) as count
FROM energy_logs
GROUP BY device_id, usage_date, start_time, end_time, household_id
HAVING COUNT(*) > 1;

-- If the above query returns no rows, all duplicates have been removed!

-- Step 5: Show summary statistics after cleanup
SELECT 
  COUNT(*) as total_energy_logs,
  COUNT(DISTINCT household_id) as total_households,
  COUNT(DISTINCT device_id) as total_devices,
  MIN(usage_date) as earliest_log,
  MAX(usage_date) as latest_log
FROM energy_logs;

