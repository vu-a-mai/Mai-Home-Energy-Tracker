-- ============================================
-- COMPLETE RLS RESET - Mai Home Energy Tracker
-- ============================================
-- This completely resets all RLS policies to fix infinite recursion
-- ============================================

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Disable RLS temporarily to clear everything
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE energy_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE bill_splits DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies completely (this will work even if RLS is disabled)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS get_user_household_id();

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_splits ENABLE ROW LEVEL SECURITY;

-- Create the security definer function
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

-- ============================================
-- SIMPLE, NON-RECURSIVE RLS POLICIES
-- ============================================

-- Users table: Allow users to see their own record and household members
CREATE POLICY "users_select_own" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_select_household" ON users FOR SELECT USING (household_id = get_user_household_id());
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (id = auth.uid());

-- Devices table: Household-based access
CREATE POLICY "devices_select" ON devices FOR SELECT USING (household_id = get_user_household_id());
CREATE POLICY "devices_insert" ON devices FOR INSERT WITH CHECK (household_id = get_user_household_id());
CREATE POLICY "devices_update_own" ON devices FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "devices_delete_own" ON devices FOR DELETE USING (created_by = auth.uid());

-- Energy logs table: Household-based access
CREATE POLICY "energy_logs_select" ON energy_logs FOR SELECT USING (household_id = get_user_household_id());
CREATE POLICY "energy_logs_insert" ON energy_logs FOR INSERT WITH CHECK (household_id = get_user_household_id());
CREATE POLICY "energy_logs_update_own" ON energy_logs FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "energy_logs_delete_own" ON energy_logs FOR DELETE USING (created_by = auth.uid());

-- Bill splits table: Household-based access
CREATE POLICY "bill_splits_select" ON bill_splits FOR SELECT USING (household_id = get_user_household_id());
CREATE POLICY "bill_splits_insert" ON bill_splits FOR INSERT WITH CHECK (household_id = get_user_household_id());
CREATE POLICY "bill_splits_delete_own" ON bill_splits FOR DELETE USING (created_by = auth.uid());

-- ============================================
-- VERIFY POLICIES
-- ============================================
SELECT 'FINAL POLICY CHECK' as status;
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Complete RLS reset completed successfully!';
  RAISE NOTICE 'All infinite recursion should now be resolved.';
END $$;
