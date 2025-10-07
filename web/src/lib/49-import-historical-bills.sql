-- ============================================
-- Import Historical Bills (2025)
-- Purpose: Import all historical bill splits with even split method
-- ============================================

-- First, get the household_id and user IDs
-- You'll need to replace these with your actual IDs from the database
-- Run this query first to get your IDs:
-- SELECT id, name FROM users ORDER BY name;
-- SELECT id FROM households LIMIT 1;

-- For this script, we'll use variables (you need to replace with actual UUIDs)
DO $$
DECLARE
  v_household_id UUID;
  v_user_ids UUID[];
  v_user_count INTEGER;
  v_even_split NUMERIC;
  v_created_by UUID;
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
  
  -- Insert historical bills with even split
  
  -- December 09, 2024 - January 08, 2025: $512.74
  v_even_split := 512.74 / v_user_count;
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
    '2024-12-09',
    '2025-01-08',
    1, -- January (end month)
    2025,
    512.74,
    'even',
    jsonb_build_object(
      v_user_ids[1]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[2]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[3]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split)
    ),
    v_created_by
  );
  
  -- January 09 - February 06, 2025: $290.37
  v_even_split := 290.37 / v_user_count;
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
    '2025-01-09',
    '2025-02-06',
    2, -- February (end month)
    2025,
    290.37,
    'even',
    jsonb_build_object(
      v_user_ids[1]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[2]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[3]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split)
    ),
    v_created_by
  );
  
  -- February 07 - March 10, 2025: $315.63
  v_even_split := 315.63 / v_user_count;
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
    '2025-02-07',
    '2025-03-10',
    3, -- March
    2025,
    315.63,
    'even',
    jsonb_build_object(
      v_user_ids[1]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[2]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[3]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split)
    ),
    v_created_by
  );
  
  -- March 11 - April 08, 2025: $199.31
  v_even_split := 199.31 / v_user_count;
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
    '2025-03-11',
    '2025-04-08',
    4, -- April
    2025,
    199.31,
    'even',
    jsonb_build_object(
      v_user_ids[1]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[2]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[3]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split)
    ),
    v_created_by
  );
  
  -- April 09 - May 08, 2025: $272.19
  v_even_split := 272.19 / v_user_count;
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
    '2025-04-09',
    '2025-05-08',
    5, -- May
    2025,
    272.19,
    'even',
    jsonb_build_object(
      v_user_ids[1]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[2]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[3]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split)
    ),
    v_created_by
  );
  
  -- May 09 - June 09, 2025: $232.68
  v_even_split := 232.68 / v_user_count;
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
    '2025-05-09',
    '2025-06-09',
    6, -- June
    2025,
    232.68,
    'even',
    jsonb_build_object(
      v_user_ids[1]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[2]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[3]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split)
    ),
    v_created_by
  );
  
  -- June 10 - July 10, 2025: $232.70
  v_even_split := 232.70 / v_user_count;
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
    '2025-06-10',
    '2025-07-10',
    7, -- July
    2025,
    232.70,
    'even',
    jsonb_build_object(
      v_user_ids[1]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[2]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[3]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split)
    ),
    v_created_by
  );
  
  -- July 11 - August 10, 2025: $250.45
  v_even_split := 250.45 / v_user_count;
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
    '2025-07-11',
    '2025-08-10',
    8, -- August
    2025,
    250.45,
    'even',
    jsonb_build_object(
      v_user_ids[1]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[2]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[3]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split)
    ),
    v_created_by
  );
  
  -- August 11 - September 09, 2025: $320.63
  v_even_split := 320.63 / v_user_count;
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
    '2025-08-11',
    '2025-09-09',
    9, -- September
    2025,
    320.63,
    'even',
    jsonb_build_object(
      v_user_ids[1]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[2]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split),
      v_user_ids[3]::text, jsonb_build_object('personalCost', 0, 'sharedCost', v_even_split, 'totalOwed', v_even_split)
    ),
    v_created_by
  );
  
  RAISE NOTICE 'Successfully imported 9 historical bills';
  
END $$;

-- Verify the import
SELECT 
  billing_period_start,
  billing_period_end,
  month,
  year,
  total_bill_amount,
  split_method,
  created_at
FROM bill_splits
ORDER BY billing_period_start;

-- Show summary
SELECT 
  TO_CHAR(DATE_TRUNC('month', billing_period_end), 'Month YYYY') as display_month,
  billing_period_start || ' to ' || billing_period_end as billing_period,
  '$' || total_bill_amount as total,
  split_method,
  '$' || ROUND(total_bill_amount / (SELECT COUNT(*) FROM users WHERE household_id = (SELECT household_id FROM bill_splits LIMIT 1)), 2) as per_person
FROM bill_splits
ORDER BY billing_period_start;
