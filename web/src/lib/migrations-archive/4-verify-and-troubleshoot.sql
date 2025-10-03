-- ============================================
-- VERIFICATION & TROUBLESHOOTING QUERIES
-- ============================================
-- Use these to check your database health
-- ============================================

-- ============================================
-- 1. CHECK AUTH USERS
-- ============================================
SELECT 
  '🔐 Auth Users' as section,
  COUNT(*) as count
FROM auth.users;

SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as confirmed,
  created_at
FROM auth.users
ORDER BY email;

-- ============================================
-- 2. CHECK DATABASE USERS
-- ============================================
SELECT 
  '👥 Database Users' as section,
  COUNT(*) as count
FROM users;

SELECT 
  id,
  email,
  name,
  household_id,
  created_at
FROM users
ORDER BY name;

-- ============================================
-- 3. CHECK DEVICES
-- ============================================
SELECT 
  '🔌 Devices' as section,
  COUNT(*) as count,
  SUM(CASE WHEN is_shared THEN 1 ELSE 0 END) as shared_count,
  SUM(CASE WHEN NOT is_shared THEN 1 ELSE 0 END) as personal_count
FROM devices;

SELECT 
  d.name,
  d.device_type,
  d.wattage,
  d.is_shared,
  u.name as owner
FROM devices d
LEFT JOIN users u ON d.created_by = u.id
ORDER BY d.is_shared DESC, d.name;

-- ============================================
-- 4. CHECK ENERGY LOGS
-- ============================================
SELECT 
  '⚡ Energy Logs' as section,
  COUNT(*) as count,
  ROUND(SUM(total_kwh), 2) as total_kwh,
  ROUND(SUM(calculated_cost), 2) as total_cost
FROM energy_logs;

SELECT 
  d.name as device,
  el.usage_date,
  el.start_time,
  el.end_time,
  el.total_kwh,
  el.calculated_cost,
  array_length(el.assigned_users, 1) as num_assigned_users
FROM energy_logs el
JOIN devices d ON el.device_id = d.id
ORDER BY el.usage_date DESC, el.start_time;

-- ============================================
-- 5. DATA HEALTH CHECK
-- ============================================
SELECT 
  '🏥 Data Health Check' as section;

SELECT * FROM data_health_check;

-- Should show 0 for all issue types!

-- ============================================
-- 6. RLS POLICY CHECK
-- ============================================
SELECT 
  '🔒 RLS Policies' as section;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 7. USER SUMMARY
-- ============================================
SELECT 
  '📊 User Summary' as section;

SELECT 
  u.name,
  COUNT(DISTINCT d.id) as devices_owned,
  COUNT(DISTINCT el.id) as energy_logs,
  ROUND(SUM(el.total_kwh), 2) as total_kwh,
  ROUND(SUM(el.calculated_cost), 2) as total_cost
FROM users u
LEFT JOIN devices d ON d.created_by = u.id
LEFT JOIN energy_logs el ON u.id = ANY(el.assigned_users)
GROUP BY u.id, u.name
ORDER BY u.name;

-- ============================================
-- 8. RECENT ACTIVITY
-- ============================================
SELECT 
  '📅 Recent Activity (Last 7 Days)' as section;

SELECT 
  el.usage_date,
  d.name as device,
  u.name as user,
  el.total_kwh,
  el.calculated_cost
FROM energy_logs el
JOIN devices d ON el.device_id = d.id
LEFT JOIN users u ON u.id = ANY(el.assigned_users)
WHERE el.usage_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY el.usage_date DESC, el.created_at DESC;

-- ============================================
-- 9. COST BREAKDOWN BY RATE PERIOD
-- ============================================
SELECT 
  '💰 Cost Breakdown by Rate Period' as section;

WITH rate_breakdown AS (
  SELECT 
    el.id,
    d.name as device,
    jsonb_array_elements(el.rate_breakdown) as period_data
  FROM energy_logs el
  JOIN devices d ON el.device_id = d.id
)
SELECT 
  period_data->>'period' as rate_period,
  COUNT(*) as occurrences,
  ROUND(SUM((period_data->>'kwh')::NUMERIC), 2) as total_kwh,
  ROUND(SUM((period_data->>'cost')::NUMERIC), 2) as total_cost,
  ROUND(AVG((period_data->>'rate')::NUMERIC), 3) as avg_rate
FROM rate_breakdown
GROUP BY period_data->>'period'
ORDER BY total_cost DESC;

-- ============================================
-- 10. TEST RLS (Run as authenticated user)
-- ============================================
SELECT 
  '🧪 Test RLS' as section;

-- This will show what the current authenticated user can see
-- Run this after logging into your app
SELECT 
  'Current User:' as label,
  auth.uid() as value;

SELECT 
  'Visible Users:' as label,
  COUNT(*) as value
FROM users;

SELECT 
  'Visible Devices:' as label,
  COUNT(*) as value
FROM devices;

SELECT 
  'Visible Energy Logs:' as label,
  COUNT(*) as value
FROM energy_logs;

-- ============================================
-- TROUBLESHOOTING QUERIES
-- ============================================

-- If you see "permission denied" errors, check:
-- 1. Is RLS enabled?
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Do policies exist?
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 3. Are auth users linked to database users?
SELECT 
  'Auth users not in database:' as issue,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;

-- ============================================
-- QUICK FIXES
-- ============================================

-- If you need to reset assigned_users on an energy log:
-- UPDATE energy_logs 
-- SET assigned_users = ARRAY['USER_ID_HERE']::UUID[]
-- WHERE id = 'LOG_ID_HERE';

-- If you need to recalculate costs (trigger will auto-run):
-- UPDATE energy_logs 
-- SET updated_at = NOW()
-- WHERE id = 'LOG_ID_HERE';

-- If you need to change a device's wattage:
-- UPDATE devices 
-- SET wattage = NEW_WATTAGE
-- WHERE id = 'DEVICE_ID_HERE';

-- ============================================
-- SUCCESS INDICATORS
-- ============================================
DO $$
DECLARE
  v_user_count INTEGER;
  v_device_count INTEGER;
  v_log_count INTEGER;
  v_health_issues INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_user_count FROM users;
  SELECT COUNT(*) INTO v_device_count FROM devices;
  SELECT COUNT(*) INTO v_log_count FROM energy_logs;
  SELECT SUM(count) INTO v_health_issues FROM data_health_check;
  
  RAISE NOTICE '================================';
  RAISE NOTICE '✅ DATABASE STATUS';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Users: %', v_user_count;
  RAISE NOTICE 'Devices: %', v_device_count;
  RAISE NOTICE 'Energy Logs: %', v_log_count;
  RAISE NOTICE 'Health Issues: %', COALESCE(v_health_issues, 0);
  RAISE NOTICE '================================';
  
  IF v_user_count = 4 AND v_device_count > 0 AND v_log_count > 0 AND COALESCE(v_health_issues, 0) = 0 THEN
    RAISE NOTICE '🎉 Everything looks great!';
  ELSE
    RAISE NOTICE '⚠️  Some issues detected. Review the queries above.';
  END IF;
END $$;
