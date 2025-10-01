-- Fix Bill Splits Table Schema
-- This updates the bill_splits table to match the BillSplitContext interface

-- Drop the old table (WARNING: This will delete existing bill split data)
-- If you have important data, export it first!
DROP TABLE IF EXISTS bill_splits CASCADE;

-- Create new table with correct schema
CREATE TABLE bill_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  total_bill_amount DECIMAL(10,2) NOT NULL,
  user_allocations JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_bill_splits_household ON bill_splits(household_id);
CREATE INDEX idx_bill_splits_period ON bill_splits(billing_period_start, billing_period_end);

-- Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bill_splits'
ORDER BY ordinal_position;
