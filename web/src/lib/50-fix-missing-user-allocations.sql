-- ============================================
-- Fix Missing User in Bill Splits
-- Purpose: Update all bill splits to include all 4 household members
-- ============================================

DO $$
DECLARE
  v_household_id UUID;
  v_user_ids UUID[];
  v_user_count INTEGER;
  v_split_record RECORD;
  v_even_split NUMERIC;
  v_user_allocations JSONB;
  v_user_id UUID;
BEGIN
  -- Get the household_id from the first user
  SELECT household_id INTO v_household_id FROM users LIMIT 1;
  
  -- Get all user IDs in the household
  SELECT ARRAY_AGG(id ORDER BY name) INTO v_user_ids 
  FROM users 
  WHERE household_id = v_household_id;
  
  -- Get user count
  v_user_count := array_length(v_user_ids, 1);
  
  RAISE NOTICE 'Found % users in household', v_user_count;
  
  -- Loop through all existing bill splits and update user_allocations
  FOR v_split_record IN 
    SELECT id, total_bill_amount 
    FROM bill_splits 
    WHERE split_method = 'even'
  LOOP
    -- Calculate even split
    v_even_split := v_split_record.total_bill_amount / v_user_count;
    
    -- Build user allocations for ALL users
    v_user_allocations := '{}'::jsonb;
    
    FOREACH v_user_id IN ARRAY v_user_ids
    LOOP
      v_user_allocations := v_user_allocations || jsonb_build_object(
        v_user_id::text,
        jsonb_build_object(
          'personalCost', 0,
          'sharedCost', v_even_split,
          'totalOwed', v_even_split
        )
      );
    END LOOP;
    
    -- Update the bill split with all users
    UPDATE bill_splits
    SET user_allocations = v_user_allocations
    WHERE id = v_split_record.id;
    
    RAISE NOTICE 'Updated bill split % with % users', v_split_record.id, v_user_count;
  END LOOP;
  
  RAISE NOTICE 'Successfully updated all bill splits with complete user allocations';
  
END $$;

-- Verify the fix
SELECT 
  billing_period_start,
  billing_period_end,
  total_bill_amount,
  jsonb_object_keys(user_allocations) as user_id,
  (user_allocations->jsonb_object_keys(user_allocations)->>'totalOwed')::numeric as amount_owed
FROM bill_splits
ORDER BY billing_period_start, user_id;

-- Show summary with user names
SELECT 
  bs.billing_period_start || ' to ' || bs.billing_period_end as period,
  bs.total_bill_amount,
  u.name as user_name,
  (bs.user_allocations->u.id::text->>'totalOwed')::numeric as amount_owed
FROM bill_splits bs
CROSS JOIN users u
WHERE u.household_id = (SELECT household_id FROM users LIMIT 1)
ORDER BY bs.billing_period_start, u.name;
