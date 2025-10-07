-- Check current user's household_id
SELECT 
  id,
  email,
  name,
  household_id,
  created_at
FROM users
WHERE email = 'your-email@example.com'; -- Replace with your actual email

-- Check if household exists
SELECT * FROM households;

-- Check if user is in a household
SELECT 
  u.id as user_id,
  u.email,
  u.name,
  u.household_id,
  h.id as household_id_exists,
  h.name as household_name
FROM users u
LEFT JOIN households h ON u.household_id = h.id
WHERE u.email = 'your-email@example.com'; -- Replace with your actual email
