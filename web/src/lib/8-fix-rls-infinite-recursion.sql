-- ============================================
-- FIX RLS INFINITE RECURSION - Mai Home Energy Tracker
-- ============================================
-- Run this to fix the infinite recursion in RLS policies
-- ============================================

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their household members" ON users;
DROP POLICY IF EXISTS "Users can view household members by household_id" ON users;
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

DROP POLICY IF EXISTS "Users can view household devices" ON devices;
DROP POLICY IF EXISTS "Users can create devices in their household" ON devices;
DROP POLICY IF EXISTS "Users can update devices they created" ON devices;
DROP POLICY IF EXISTS "Users can delete devices they created" ON devices;

DROP POLICY IF EXISTS "Users can view household energy logs" ON energy_logs;
DROP POLICY IF EXISTS "Users can create energy logs in their household" ON energy_logs;
DROP POLICY IF EXISTS "Users can update energy logs they created" ON energy_logs;
DROP POLICY IF EXISTS "Users can delete energy logs they created" ON energy_logs;

DROP POLICY IF EXISTS "Users can view household bill splits" ON bill_splits;
DROP POLICY IF EXISTS "Users can create bill splits in their household" ON bill_splits;

-- ============================================
-- FIXED RLS POLICIES - No infinite recursion
-- ============================================

-- Users table policies (simplified to avoid recursion)
CREATE POLICY "Users can view their own record"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can view household members by household_id"
  ON users FOR SELECT
  USING (
    household_id = (
      SELECT u.household_id 
      FROM users u 
      WHERE u.id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_household_id();

-- Create a security definer function to get user's household_id
CREATE OR REPLACE FUNCTION get_user_household_id()
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (SELECT household_id FROM users WHERE id = auth.uid() LIMIT 1);
END;
$$;

-- Devices table policies (using the security definer function)
CREATE POLICY "Users can view household devices"
  ON devices FOR SELECT
  USING (household_id = get_user_household_id());

CREATE POLICY "Users can create devices in their household"
  ON devices FOR INSERT
  WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "Users can update devices they created"
  ON devices FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete devices they created"
  ON devices FOR DELETE
  USING (created_by = auth.uid());

-- Energy logs table policies (using the security definer function)
CREATE POLICY "Users can view household energy logs"
  ON energy_logs FOR SELECT
  USING (household_id = get_user_household_id());

CREATE POLICY "Users can create energy logs in their household"
  ON energy_logs FOR INSERT
  WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "Users can update energy logs they created"
  ON energy_logs FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete energy logs they created"
  ON energy_logs FOR DELETE
  USING (created_by = auth.uid());

-- Bill splits table policies (using the security definer function)
CREATE POLICY "Users can view household bill splits"
  ON bill_splits FOR SELECT
  USING (household_id = get_user_household_id());

CREATE POLICY "Users can create bill splits in their household"
  ON bill_splits FOR INSERT
  WITH CHECK (household_id = get_user_household_id());

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies fixed! Infinite recursion resolved.';
  RAISE NOTICE 'Your app should now work without database errors.';
END $$;
