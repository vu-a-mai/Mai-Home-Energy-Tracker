-- Fix: Remove the circular RLS policy on users table
-- The users_select_household policy causes infinite recursion
-- because it calls get_user_household_id() which queries users table

-- Drop the problematic policy
DROP POLICY IF EXISTS "users_select_household" ON users;

-- Verify only the safe policy remains
SELECT 
  policyname,
  cmd,
  qual as policy_condition
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Test: This should now work
SELECT id, email, name, household_id 
FROM users 
WHERE id = auth.uid();
