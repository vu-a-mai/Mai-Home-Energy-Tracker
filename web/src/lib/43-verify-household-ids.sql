-- Check all users and their household_ids
SELECT 
  id,
  email,
  name,
  household_id,
  created_at
FROM users
ORDER BY household_id, name;

-- Count users per household
SELECT 
  household_id,
  COUNT(*) as user_count,
  STRING_AGG(name, ', ') as members
FROM users
GROUP BY household_id
ORDER BY user_count DESC;

-- Check if a user can see other users (test the RLS policy)
-- This should return all users in the user's household
SELECT 
  id,
  email,
  name,
  household_id
FROM users
WHERE household_id = (
  SELECT household_id 
  FROM users 
  WHERE email = 'user3@example.com'
);
