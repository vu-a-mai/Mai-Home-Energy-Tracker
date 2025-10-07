-- Fix: Assign user to household
-- Step 1: Check if household exists
SELECT * FROM households WHERE name = 'Mai Family';

-- Step 2: If no household exists, create one (replace UUID with actual household ID if it exists)
-- INSERT INTO households (id, name) 
-- VALUES ('your-household-id-here', 'Mai Family');

-- Step 3: Update user to have household_id (replace with your email and household ID)
-- UPDATE users 
-- SET household_id = 'your-household-id-here'
-- WHERE email = 'your-email@example.com';

-- Step 4: Verify the fix
SELECT 
  u.id,
  u.email,
  u.name,
  u.household_id,
  h.name as household_name
FROM users u
LEFT JOIN households h ON u.household_id = h.id
WHERE u.email = 'your-email@example.com';
