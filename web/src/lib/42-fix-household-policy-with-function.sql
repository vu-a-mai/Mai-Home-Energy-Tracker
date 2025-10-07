-- First, check if the get_user_household_id function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_user_household_id';

-- If it doesn't exist, create it
CREATE OR REPLACE FUNCTION get_user_household_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT household_id FROM users WHERE id = auth.uid() LIMIT 1;
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "users_select_household_members" ON users;

-- Create new policy using the security definer function
CREATE POLICY "users_select_household_members"
ON users FOR SELECT
TO authenticated
USING (household_id = get_user_household_id());

-- Verify policies
SELECT 
  policyname,
  cmd,
  qual as policy_condition
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;
