-- Fix: Mark Tesla devices as shared
-- The Tesla Model 3 and Model Y should be shared devices since multiple people use them

-- First, check current device sharing status
SELECT id, name, is_shared FROM devices ORDER BY name;

-- Update Tesla devices to be shared
UPDATE devices
SET is_shared = true
WHERE name ILIKE '%Tesla%';

-- Update other devices that should be shared (if any)
-- Uncomment and modify as needed:
-- UPDATE devices SET is_shared = true WHERE name ILIKE '%TV%';
-- UPDATE devices SET is_shared = true WHERE name ILIKE '%Kitchen%';

-- Verify the changes
SELECT id, name, is_shared FROM devices ORDER BY name;
