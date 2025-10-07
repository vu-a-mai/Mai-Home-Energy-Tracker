-- ============================================
-- Migration: Add Bill Split Enhancements
-- Purpose: Add split_method column and month/year fields for better bill cycle tracking
-- Date: 2025-01-06
-- ============================================

-- Add split_method column to track how the bill was split
ALTER TABLE bill_splits 
ADD COLUMN IF NOT EXISTS split_method VARCHAR(20) DEFAULT 'usage_based' CHECK (split_method IN ('even', 'usage_based'));

-- Add month and year columns for display purposes (derived from billing_period_end)
ALTER TABLE bill_splits 
ADD COLUMN IF NOT EXISTS month INTEGER CHECK (month >= 1 AND month <= 12),
ADD COLUMN IF NOT EXISTS year INTEGER CHECK (year >= 2000 AND year <= 2100);

-- Add updated_at column for tracking changes
ALTER TABLE bill_splits 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bill_splits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_bill_splits_timestamp ON bill_splits;
CREATE TRIGGER trigger_update_bill_splits_timestamp
  BEFORE UPDATE ON bill_splits
  FOR EACH ROW
  EXECUTE FUNCTION update_bill_splits_updated_at();

-- Backfill month and year from billing_period_end for existing records
-- This uses the END date of the billing period (when bill is received)
UPDATE bill_splits
SET 
  month = EXTRACT(MONTH FROM billing_period_end)::INTEGER,
  year = EXTRACT(YEAR FROM billing_period_end)::INTEGER,
  split_method = 'usage_based'  -- Assume existing records used usage-based split
WHERE month IS NULL OR year IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN bill_splits.split_method IS 'Method used for splitting: even (equal split) or usage_based (fair split based on usage)';
COMMENT ON COLUMN bill_splits.month IS 'Display month (1-12) derived from billing_period_end';
COMMENT ON COLUMN bill_splits.year IS 'Display year derived from billing_period_end';

-- Create index for faster queries by month/year
CREATE INDEX IF NOT EXISTS idx_bill_splits_month_year ON bill_splits(year DESC, month DESC);

-- Verify the migration
SELECT 
  id,
  billing_period_start,
  billing_period_end,
  month,
  year,
  split_method,
  total_bill_amount
FROM bill_splits
ORDER BY billing_period_end DESC
LIMIT 5;
