-- ============================================
-- ADD MISSING COLUMNS - Mai Home Energy Tracker
-- ============================================
-- Run this to add missing columns that the app expects
-- ============================================

-- Add kwh_per_hour column to devices table
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS kwh_per_hour NUMERIC(10, 6) 
GENERATED ALWAYS AS (wattage / 1000.0) STORED;

-- Update existing devices to have kwh_per_hour calculated
UPDATE devices 
SET kwh_per_hour = wattage / 1000.0 
WHERE kwh_per_hour IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN devices.kwh_per_hour IS 'Kilowatt-hours per hour, automatically calculated from wattage';

-- ============================================
-- VERIFY THE CHANGES
-- ============================================
SELECT 'DEVICES TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'devices' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Missing columns added successfully!';
  RAISE NOTICE 'The kwh_per_hour column is now available in the devices table.';
END $$;
