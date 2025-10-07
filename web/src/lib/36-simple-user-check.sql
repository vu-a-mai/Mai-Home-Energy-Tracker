-- Simple check: Get current user and their household_id
SELECT 
  id,
  email,
  name,
  household_id,
  created_at
FROM users
WHERE id = auth.uid();

-- Check all users
SELECT 
  id,
  email,
  name,
  household_id,
  created_at
FROM users
ORDER BY created_at DESC;

-- If your user doesn't exist or has NULL household_id, we need to fix it
-- First, let's see what auth user you are:
SELECT auth.uid() as my_user_id, auth.email() as my_email;
