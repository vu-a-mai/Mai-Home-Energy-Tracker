-- ============================================
-- FINAL VERIFICATION - App Ready Check
-- ============================================
-- Run this to confirm your app is ready to use
-- ============================================

-- 1. Check Users
SELECT '👥 USERS' as check_type;
SELECT 
  id,
  email,
  name,
  household_id
FROM users
ORDER BY name;

-- 2. Check Devices
SELECT '🔌 DEVICES' as check_type;
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN is_shared THEN 1 ELSE 0 END) as shared,
  SUM(CASE WHEN NOT is_shared THEN 1 ELSE 0 END) as personal
FROM devices;

-- 3. Check Energy Logs with Costs
SELECT '⚡ ENERGY LOGS' as check_type;
SELECT 
  d.name as device,
  el.total_kwh,
  el.calculated_cost,
  u.name as user
FROM energy_logs el
JOIN devices d ON el.device_id = d.id
LEFT JOIN users u ON u.id = ANY(el.assigned_users)
ORDER BY el.usage_date DESC;

-- 4. Cost Summary by User
SELECT '💰 COST SUMMARY' as check_type;
SELECT 
  u.name,
  COUNT(el.id) as logs,
  ROUND(SUM(el.total_kwh), 2) as total_kwh,
  ROUND(SUM(el.calculated_cost), 2) as total_cost
FROM users u
LEFT JOIN energy_logs el ON u.id = ANY(el.assigned_users)
GROUP BY u.name
ORDER BY total_cost DESC;

-- 5. Data Health Check
SELECT '🏥 HEALTH CHECK' as check_type;
SELECT * FROM data_health_check;

-- 6. RLS Status
SELECT '🔒 SECURITY' as check_type;
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- FINAL STATUS
-- ============================================
DO $$
DECLARE
  v_users INTEGER;
  v_devices INTEGER;
  v_logs INTEGER;
  v_logs_with_cost INTEGER;
  v_health_issues INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_users FROM users;
  SELECT COUNT(*) INTO v_devices FROM devices;
  SELECT COUNT(*) INTO v_logs FROM energy_logs;
  SELECT COUNT(*) INTO v_logs_with_cost FROM energy_logs WHERE calculated_cost > 0;
  SELECT COALESCE(SUM(count), 0) INTO v_health_issues FROM data_health_check;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ FINAL STATUS CHECK';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Users: % (expected: 4)', v_users;
  RAISE NOTICE 'Devices: % (expected: 12)', v_devices;
  RAISE NOTICE 'Energy Logs: % (expected: 4)', v_logs;
  RAISE NOTICE 'Logs with Costs: % (expected: 4)', v_logs_with_cost;
  RAISE NOTICE 'Health Issues: % (expected: 0)', v_health_issues;
  RAISE NOTICE '================================================';
  
  IF v_users = 4 AND v_devices = 12 AND v_logs = 4 AND v_logs_with_cost = 4 AND v_health_issues = 0 THEN
    RAISE NOTICE '🎉 DATABASE IS READY!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Next Steps:';
    RAISE NOTICE '1. Make sure demo mode is OFF in your app';
    RAISE NOTICE '2. Login with: vu@maihome.com (or any user)';
    RAISE NOTICE '3. Check that you see your 12 devices';
    RAISE NOTICE '4. Check that you see your 4 energy logs with costs';
    RAISE NOTICE '5. Verify Dashboard shows correct usage stats';
  ELSE
    RAISE NOTICE '⚠️  ISSUES DETECTED - Review the checks above';
  END IF;
  
  RAISE NOTICE '================================================';
END $$;
