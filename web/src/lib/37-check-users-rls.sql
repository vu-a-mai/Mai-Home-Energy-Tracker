-- Check RLS policies for users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as policy_condition
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Check if RLS is enabled on users table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Try to select as Thuy (replace with actual user ID)
SELECT * FROM users WHERE id = 'ef70edaf-ef4d-4408-8266-9a91aea4fc76';
