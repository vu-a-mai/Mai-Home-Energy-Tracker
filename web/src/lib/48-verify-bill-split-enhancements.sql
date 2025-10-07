-- ============================================
-- Verification: Bill Split Enhancements
-- Purpose: Verify the new columns and structure
-- ============================================

-- 1. Check table structure
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'bill_splits'
ORDER BY ordinal_position;

-- 2. Check existing bill splits (if any)
SELECT 
  id,
  billing_period_start,
  billing_period_end,
  month,
  year,
  split_method,
  total_bill_amount,
  created_at,
  updated_at
FROM bill_splits
ORDER BY billing_period_end DESC
LIMIT 10;

-- 3. Verify indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'bill_splits'
ORDER BY indexname;

-- 4. Check trigger
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'bill_splits';
