-- Check detailed SELECT policies for energy_logs
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as policy_condition,
  with_check
FROM pg_policies
WHERE tablename = 'energy_logs'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Also check if there are any restrictive policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'energy_logs'
ORDER BY cmd, policyname;
