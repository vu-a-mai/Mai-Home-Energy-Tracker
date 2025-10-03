-- ============================================
-- SYNC AUTH USERS TO DATABASE
-- ============================================
-- Run this AFTER creating the schema
-- This links your existing Supabase Auth users to the database
-- ============================================

-- Step 1: View your auth users
SELECT 
  id as auth_user_id,
  email,
  created_at
FROM auth.users
ORDER BY email;

-- ============================================
-- Step 2: Create household and database users
-- ============================================

DO $$
DECLARE
  household_uuid UUID := gen_random_uuid();
  vu_auth_id UUID;
  vy_auth_id UUID;
  thuy_auth_id UUID;
  han_auth_id UUID;
BEGIN
  -- Get auth user IDs by email
  SELECT id INTO vu_auth_id FROM auth.users WHERE email = 'vu@maihome.com';
  SELECT id INTO vy_auth_id FROM auth.users WHERE email = 'vy@maihome.com';
  SELECT id INTO thuy_auth_id FROM auth.users WHERE email = 'thuy@maihome.com';
  SELECT id INTO han_auth_id FROM auth.users WHERE email = 'han@maihome.com';
  
  -- Check if all users exist
  IF vu_auth_id IS NULL THEN
    RAISE EXCEPTION 'Auth user vu@maihome.com not found';
  END IF;
  IF vy_auth_id IS NULL THEN
    RAISE EXCEPTION 'Auth user vy@maihome.com not found';
  END IF;
  IF thuy_auth_id IS NULL THEN
    RAISE EXCEPTION 'Auth user thuy@maihome.com not found';
  END IF;
  IF han_auth_id IS NULL THEN
    RAISE EXCEPTION 'Auth user han@maihome.com not found';
  END IF;
  
  -- Insert users with auth IDs
  INSERT INTO users (id, email, name, household_id) VALUES
    (vu_auth_id, 'vu@maihome.com', 'Vu Mai', household_uuid),
    (vy_auth_id, 'vy@maihome.com', 'Vy Mai', household_uuid),
    (thuy_auth_id, 'thuy@maihome.com', 'Thuy Mai', household_uuid),
    (han_auth_id, 'han@maihome.com', 'Han Mai', household_uuid);
  
  RAISE NOTICE '✅ Users created successfully!';
  RAISE NOTICE 'Household ID: %', household_uuid;
  RAISE NOTICE 'Vu ID: %', vu_auth_id;
  RAISE NOTICE 'Vy ID: %', vy_auth_id;
  RAISE NOTICE 'Thuy ID: %', thuy_auth_id;
  RAISE NOTICE 'Han ID: %', han_auth_id;
END $$;

-- ============================================
-- Step 3: Verify users were created
-- ============================================
SELECT 
  id,
  email,
  name,
  household_id,
  created_at
FROM users
ORDER BY name;

-- ============================================
-- SAVE THESE IDs!
-- ============================================
-- Copy the household_id and user IDs from above
-- You'll need them for the next step
-- ============================================
