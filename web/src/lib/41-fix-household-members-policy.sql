-- Fix: Allow users to read other members in their household
-- Currently users_select_own only allows reading own data
-- We need to also allow reading household members

-- Add policy to read household members
CREATE POLICY "users_select_household_members"
ON users FOR SELECT
TO authenticated
USING (
  household_id IN (
    SELECT household_id 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- Verify policies
SELECT 
  policyname,
  cmd,
  qual as policy_condition
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;
