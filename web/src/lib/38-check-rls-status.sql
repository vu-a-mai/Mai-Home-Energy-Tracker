-- Check if RLS is enabled on users table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Check RLS policies for users table
SELECT 
  policyname,
  cmd,
  qual as policy_condition,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;
