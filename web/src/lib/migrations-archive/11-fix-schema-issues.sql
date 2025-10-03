-- ============================================
-- FIX SCHEMA ISSUES - Mai Home Energy Tracker
-- ============================================
-- Run this to fix all schema mismatches
-- ============================================

-- 1. Add missing kwh_per_hour column to devices
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS kwh_per_hour NUMERIC(10, 6);

-- Update existing devices to calculate kwh_per_hour
UPDATE devices 
SET kwh_per_hour = wattage / 1000.0 
WHERE kwh_per_hour IS NULL;

-- 2. Fix bill_splits table structure
-- Add missing columns
ALTER TABLE bill_splits 
ADD COLUMN IF NOT EXISTS month INTEGER,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Migrate existing data from date columns to month/year
UPDATE bill_splits 
SET 
  month = EXTRACT(MONTH FROM billing_period_start),
  year = EXTRACT(YEAR FROM billing_period_start)
WHERE month IS NULL OR year IS NULL;

-- Make month and year NOT NULL after migration
ALTER TABLE bill_splits 
ALTER COLUMN month SET NOT NULL,
ALTER COLUMN year SET NOT NULL;

-- Add updated_at trigger for bill_splits
CREATE TRIGGER bill_splits_updated_at
  BEFORE UPDATE ON bill_splits
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- 3. Verify the schema is correct
SELECT 'DEVICES TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'devices' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'BILL_SPLITS TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bill_splits' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Schema issues fixed successfully!';
  RAISE NOTICE 'Your database now matches what the app expects.';
END $$;
