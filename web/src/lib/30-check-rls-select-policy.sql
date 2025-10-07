-- Check RLS policies for energy_logs SELECT
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'energy_logs'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'energy_logs';
