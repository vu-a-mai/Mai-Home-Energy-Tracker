-- ============================================
-- Mai Home Energy Tracker - Complete Database Setup
-- ============================================
-- Run these scripts in order in your Supabase SQL Editor
-- Each step is numbered for clarity
-- ============================================

-- ============================================
-- STEP 1: CREATE TABLES
-- ============================================
-- Creates all necessary tables for the application

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  household_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  wattage INTEGER NOT NULL,
  location TEXT NOT NULL,
  is_shared BOOLEAN NOT NULL DEFAULT true,
  kwh_per_hour DECIMAL(10,4) NOT NULL,
  household_id UUID NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Energy logs table
CREATE TABLE IF NOT EXISTS energy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id),
  usage_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  calculated_cost DECIMAL(10,2),
  total_kwh DECIMAL(10,4),
  rate_breakdown JSONB,
  household_id UUID NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Energy log users junction table
CREATE TABLE IF NOT EXISTS energy_log_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  energy_log_id UUID REFERENCES energy_logs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  cost_share DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bill splits table
CREATE TABLE IF NOT EXISTS bill_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  user_allocations JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 2: UPDATE EXISTING DEVICES TABLE
-- ============================================
-- If you have an existing devices table with old schema, this will update it

-- Rename 'type' column to 'device_type' if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='devices' AND column_name='type') THEN
    ALTER TABLE devices RENAME COLUMN type TO device_type;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='devices' AND column_name='device_type') THEN
    ALTER TABLE devices ADD COLUMN device_type TEXT;
  END IF;
END $$;

-- Add is_shared boolean column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='devices' AND column_name='is_shared') THEN
    ALTER TABLE devices ADD COLUMN is_shared BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add kwh_per_hour calculated column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='devices' AND column_name='kwh_per_hour') THEN
    ALTER TABLE devices ADD COLUMN kwh_per_hour DECIMAL(10,4);
  END IF;
END $$;

-- Migrate data from sharing_type to is_shared if sharing_type exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='devices' AND column_name='sharing_type') THEN
    UPDATE devices SET is_shared = (sharing_type = 'shared');
    ALTER TABLE devices DROP COLUMN sharing_type;
  END IF;
END $$;

-- Update kwh_per_hour based on wattage for existing devices
UPDATE devices 
SET kwh_per_hour = wattage / 1000.0 
WHERE kwh_per_hour IS NULL;

-- Set default values for device_type if null
UPDATE devices 
SET device_type = 'Other' 
WHERE device_type IS NULL OR device_type = '';

-- Set default values for location if null
UPDATE devices 
SET location = 'Unknown' 
WHERE location IS NULL OR location = '';

-- Make columns NOT NULL after setting defaults
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='devices' AND column_name='device_type' AND is_nullable='YES') THEN
    ALTER TABLE devices ALTER COLUMN device_type SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='devices' AND column_name='location' AND is_nullable='YES') THEN
    ALTER TABLE devices ALTER COLUMN location SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='devices' AND column_name='is_shared' AND is_nullable='YES') THEN
    ALTER TABLE devices ALTER COLUMN is_shared SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='devices' AND column_name='kwh_per_hour' AND is_nullable='YES') THEN
    ALTER TABLE devices ALTER COLUMN kwh_per_hour SET NOT NULL;
  END IF;
END $$;

-- ============================================
-- STEP 3: DISABLE RLS (FOR DEVELOPMENT/TESTING)
-- ============================================
-- WARNING: Only for development! Re-enable with proper policies for production

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can delete household devices" ON devices;
DROP POLICY IF EXISTS "Users can insert household devices" ON devices;
DROP POLICY IF EXISTS "Users can update household devices" ON devices;
DROP POLICY IF EXISTS "Users can view household devices" ON devices;

-- Disable RLS on all tables (for testing)
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE energy_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE energy_log_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE bill_splits DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: CREATE RATE CALCULATION FUNCTION
-- ============================================
-- Function to calculate energy costs based on Time-of-Use rates

CREATE OR REPLACE FUNCTION calculate_energy_cost(
  wattage INTEGER,
  start_time TIME,
  end_time TIME,
  usage_date DATE
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total_cost DECIMAL(10,2) := 0;
  duration_hours DECIMAL(10,4);
  kwh DECIMAL(10,4);
  kwh_portion DECIMAL(10,4);
  month INTEGER;
  day_of_week INTEGER;
  rate DECIMAL(10,4);
BEGIN
  -- Calculate duration in hours
  duration_hours := EXTRACT(EPOCH FROM (end_time - start_time)) / 3600;
  
  -- If end_time is less than start_time, it crosses midnight
  IF end_time < start_time THEN
    duration_hours := duration_hours + 24;
  END IF;
  
  -- Calculate kWh
  kwh := (wattage / 1000.0) * duration_hours;
  
  -- Get month and day of week
  month := EXTRACT(MONTH FROM usage_date);
  day_of_week := EXTRACT(DOW FROM usage_date); -- 0 = Sunday, 6 = Saturday
  
  -- Determine rate based on date and time
  IF month BETWEEN 6 AND 9 THEN -- Summer rates (June - September)
    IF day_of_week BETWEEN 1 AND 5 THEN -- Weekday
      IF start_time >= '16:00' AND end_time <= '21:00' THEN
        rate := 0.55; -- On-Peak
      ELSE
        rate := 0.25; -- Off-Peak
      END IF;
    ELSE -- Weekend
      IF start_time >= '16:00' AND end_time <= '21:00' THEN
        rate := 0.37; -- Mid-Peak
      ELSE
        rate := 0.25; -- Off-Peak
      END IF;
    END IF;
  ELSE -- Winter rates (October - May)
    IF start_time >= '16:00' AND start_time < '21:00' THEN
      rate := 0.52; -- Mid-Peak
    ELSE
      rate := 0.24; -- Off-Peak or Super Off-Peak
    END IF;
  END IF;
  
  total_cost := rate * kwh;
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 5: SETUP USERS (OPTIONAL)
-- ============================================
-- Create users in your household
-- First create these users in Supabase Authentication dashboard
-- Then get their UUIDs and replace the placeholder values below

/*
-- Example household ID: 12345678-1234-5678-9012-123456789012

-- User 1
INSERT INTO users (id, email, name, household_id) 
VALUES (
  'USER_UUID_FROM_AUTH_1',  -- Replace with actual UUID from Supabase Auth
  'user1@example.com',
  'User One',
  '12345678-1234-5678-9012-123456789012'
);

-- User 2
INSERT INTO users (id, email, name, household_id) 
VALUES (
  'USER_UUID_FROM_AUTH_2',  -- Replace with actual UUID from Supabase Auth
  'user2@example.com',
  'User Two',
  '12345678-1234-5678-9012-123456789012'
);

-- Add more users as needed...
*/

-- ============================================
-- STEP 6: VERIFY SETUP
-- ============================================
-- Run these queries to verify everything is set up correctly

-- Check devices table schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY ordinal_position;

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('devices', 'users', 'energy_logs', 'energy_log_users', 'bill_splits')
ORDER BY tablename;

-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'calculate_energy_cost';

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Your database is now ready for the Mai Home Energy Tracker application
-- 
-- Next steps:
-- 1. Create users in Supabase Authentication
-- 2. Insert user records in the users table (Step 5)
-- 3. Configure environment variables in your application
-- 4. Start using the app!
--
-- For production, remember to:
-- - Re-enable RLS with proper policies
-- - Set up proper authentication rules
-- - Configure backup and monitoring
-- ============================================
