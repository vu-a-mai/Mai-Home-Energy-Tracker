-- ============================================
-- FIX DELETE PERMISSION FOR ENERGY LOGS
-- ============================================
-- This fixes the issue where users can't delete their own energy logs
-- because the created_by field doesn't match their current user ID

-- Step 1: Check current user information
SELECT 
  'Current User Info' as check_type,
  auth.uid() as current_user_id,
  u.email,
  u.name,
  u.household_id
FROM users u
WHERE u.id = auth.uid();

-- Step 2: Check energy logs and their created_by values
SELECT 
  'Energy Logs Ownership' as check_type,
  el.id,
  el.device_id,
  el.usage_date,
  el.created_by,
  el.household_id,
  CASE 
    WHEN el.created_by = auth.uid() THEN '✅ Can Delete'
    ELSE '❌ Cannot Delete (created_by mismatch)'
  END as delete_permission,
  u.email as created_by_email,
  u.name as created_by_name
FROM energy_logs el
LEFT JOIN users u ON el.created_by = u.id
ORDER BY el.usage_date DESC;

-- Step 3: Check who can actually delete based on RLS
SELECT 
  'RLS Policy Check' as check_type,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'energy_logs' AND cmd = 'DELETE';

-- ============================================
-- OPTION 1: Update created_by to current user (for your household's logs)
-- ============================================
-- This updates all energy logs in your household to be owned by you
-- Uncomment to run:

/*
UPDATE energy_logs
SET created_by = auth.uid()
WHERE household_id IN (
  SELECT household_id FROM users WHERE id = auth.uid()
);

SELECT 'Updated ' || COUNT(*) || ' energy logs to current user' as result
FROM energy_logs
WHERE created_by = auth.uid();
*/

-- ============================================
-- OPTION 2: Create a more permissive delete policy
-- ============================================
-- This allows users to delete ANY energy log in their household, not just their own
-- Uncomment to run:

/*
-- Drop the restrictive policy
DROP POLICY IF EXISTS "energy_logs_delete_own" ON energy_logs;
DROP POLICY IF EXISTS "Users can delete energy logs they created" ON energy_logs;

-- Create a household-based delete policy
CREATE POLICY "energy_logs_delete_household" 
  ON energy_logs FOR DELETE 
  USING (
    household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

SELECT '✅ Updated delete policy - users can now delete any energy log in their household' as result;
*/

-- ============================================
-- VERIFICATION
-- ============================================
-- After running one of the options above, verify with:

SELECT 
  'Verification' as check_type,
  COUNT(*) as total_logs,
  COUNT(*) FILTER (WHERE created_by = auth.uid()) as logs_you_can_delete,
  COUNT(*) FILTER (WHERE created_by != auth.uid()) as logs_you_cannot_delete
FROM energy_logs
WHERE household_id IN (
  SELECT household_id FROM users WHERE id = auth.uid()
);

-- ============================================
-- RECOMMENDED SOLUTION
-- ============================================
-- For a household energy tracking app, it makes sense that any household member
-- can delete any energy log in their household (not just logs they created).
-- This is more user-friendly and matches the collaborative nature of the app.
-- 
-- Therefore, I recommend running OPTION 2 above.

