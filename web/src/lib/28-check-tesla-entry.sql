-- First, check the table schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'energy_logs' 
ORDER BY ordinal_position;

-- Check the Tesla entry from August 1st
SELECT *
FROM energy_logs 
WHERE usage_date = '2025-08-01'
ORDER BY created_at DESC;

-- Also check device info
SELECT id, name, wattage FROM devices WHERE name ILIKE '%tesla%';

-- Count total logs for August 2025
SELECT COUNT(*) as august_log_count FROM energy_logs WHERE usage_date >= '2025-08-01' AND usage_date <= '2025-08-31';
