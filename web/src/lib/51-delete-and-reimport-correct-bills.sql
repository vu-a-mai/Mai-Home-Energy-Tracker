-- ============================================
-- Delete Incorrect Bills and Reimport with Correct Dates
-- Purpose: Fix all bill dates to match the actual billing cycles
-- ============================================

-- Step 1: Delete all existing bill splits
DELETE FROM bill_splits;

-- Step 2: Reimport with CORRECT dates
DO $$
DECLARE
  v_household_id UUID;
  v_user_ids UUID[];
  v_user_count INTEGER;
  v_even_split NUMERIC;
  v_created_by UUID;
  v_user_allocations JSONB;
  v_user_id UUID;
  v_bill RECORD;
BEGIN
  -- Get the household_id from the first user
  SELECT household_id INTO v_household_id FROM users LIMIT 1;
  
  -- Get all user IDs in the household
  SELECT ARRAY_AGG(id ORDER BY name) INTO v_user_ids 
  FROM users 
  WHERE household_id = v_household_id;
  
  -- Get the first user as creator
  v_created_by := v_user_ids[1];
  
  -- Get user count
  v_user_count := array_length(v_user_ids, 1);
  
  RAISE NOTICE 'Importing bills for % users', v_user_count;
  
  -- Helper function to build user allocations
  CREATE TEMP TABLE IF NOT EXISTS temp_bills (
    start_date DATE,
    end_date DATE,
    amount NUMERIC,
    display_month INTEGER,
    display_year INTEGER
  );
  
  -- Insert all bills with correct dates
  INSERT INTO temp_bills VALUES
    ('2024-12-09', '2025-01-08', 512.74, 1, 2025),  -- January
    ('2025-01-09', '2025-02-06', 290.37, 2, 2025),  -- February
    ('2025-02-07', '2025-03-10', 315.63, 3, 2025),  -- March
    ('2025-03-11', '2025-04-08', 199.31, 4, 2025),  -- April
    ('2025-04-09', '2025-05-08', 272.19, 5, 2025),  -- May
    ('2025-05-09', '2025-06-09', 232.68, 6, 2025),  -- June
    ('2025-06-10', '2025-07-10', 232.70, 7, 2025),  -- July
    ('2025-07-11', '2025-08-10', 250.45, 8, 2025);  -- August
  
  -- Insert each bill
  FOR v_bill IN SELECT * FROM temp_bills LOOP
    v_even_split := v_bill.amount / v_user_count;
    
    -- Build user allocations for ALL users dynamically
    v_user_allocations := '{}'::jsonb;
    
    FOREACH v_user_id IN ARRAY v_user_ids LOOP
      v_user_allocations := v_user_allocations || jsonb_build_object(
        v_user_id::text,
        jsonb_build_object(
          'personalCost', 0,
          'sharedCost', v_even_split,
          'totalOwed', v_even_split
        )
      );
    END LOOP;
    
    -- Insert the bill split
    INSERT INTO bill_splits (
      household_id,
      billing_period_start,
      billing_period_end,
      month,
      year,
      total_bill_amount,
      split_method,
      user_allocations,
      created_by
    ) VALUES (
      v_household_id,
      v_bill.start_date,
      v_bill.end_date,
      v_bill.display_month,
      v_bill.display_year,
      v_bill.amount,
      'even',
      v_user_allocations,
      v_created_by
    );
    
    RAISE NOTICE 'Imported: % to % ($%)', v_bill.start_date, v_bill.end_date, v_bill.amount;
  END LOOP;
  
  DROP TABLE temp_bills;
  
  RAISE NOTICE 'Successfully imported 8 bills with correct dates';
  
END $$;

-- Verify the import
SELECT 
  billing_period_start,
  billing_period_end,
  month,
  year,
  total_bill_amount,
  split_method,
  jsonb_object_keys(user_allocations) as user_count
FROM bill_splits
ORDER BY billing_period_start;

-- Show summary
SELECT 
  CASE month
    WHEN 1 THEN 'January'
    WHEN 2 THEN 'February'
    WHEN 3 THEN 'March'
    WHEN 4 THEN 'April'
    WHEN 5 THEN 'May'
    WHEN 6 THEN 'June'
    WHEN 7 THEN 'July'
    WHEN 8 THEN 'August'
  END as display_month,
  billing_period_start || ' to ' || billing_period_end as billing_period,
  '$' || total_bill_amount as total,
  split_method
FROM bill_splits
ORDER BY billing_period_start;
