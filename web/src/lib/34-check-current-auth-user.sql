-- Check the current authenticated user
SELECT auth.uid() as current_user_id;

-- Check if this user exists in users table
SELECT 
  id,
  email,
  name,
  household_id,
  created_at
FROM users
WHERE id = auth.uid();

-- Check all users and their households
SELECT 
  u.id,
  u.email,
  u.name,
  u.household_id,
  h.name as household_name,
  h.id as household_id_value
FROM users u
LEFT JOIN households h ON u.household_id = h.id
ORDER BY u.created_at DESC;

-- Check if household exists
SELECT * FROM households ORDER BY created_at DESC;
