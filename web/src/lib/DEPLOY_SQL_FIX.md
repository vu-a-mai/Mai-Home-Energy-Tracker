# Deploy SQL Rate Calculation Fix

## ⚠️ CRITICAL: This fixes a major bug in cost calculations

### Step 1: Backup Current Function (Optional but Recommended)

```sql
-- Run this in Supabase SQL Editor to save current function
SELECT pg_get_functiondef('calculate_energy_cost(integer, time, time, date)'::regprocedure);
```

### Step 2: Deploy the Fixed Function

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `rateCalculationFunction-fixed.sql`
3. Paste into SQL Editor
4. Click **Run** or press Ctrl+Enter

### Step 3: Verify the Fix

Run these test queries:

```sql
-- Test 1: Summer weekday crossing boundary
SELECT calculate_energy_cost(100, '15:00', '17:00', '2025-07-15'::DATE) as cost;
-- Expected: 0.08

-- Test 2: Winter multi-period (THIS WAS BROKEN)
SELECT calculate_energy_cost(100, '07:00', '17:00', '2025-01-15'::DATE) as cost;
-- Expected: 0.27

-- Test 3: Overnight
SELECT calculate_energy_cost(100, '23:00', '02:00', '2025-07-15'::DATE) as cost;
-- Expected: 0.08
```

### Step 4: Recalculate Existing Logs (Optional)

**⚠️ WARNING: This will update all existing energy log costs**

```sql
-- First, check how many logs will be affected
SELECT COUNT(*) FROM energy_logs WHERE calculated_cost IS NOT NULL;

-- If you want to proceed, run this:
UPDATE energy_logs
SET calculated_cost = calculate_energy_cost(
  (SELECT wattage FROM devices WHERE id = energy_logs.device_id),
  start_time,
  end_time,
  usage_date
)
WHERE calculated_cost IS NOT NULL;
```

### ✅ Success Criteria

- All test queries return expected values
- New energy logs calculate correctly
- No errors in Supabase logs

---

**After deploying, mark this as complete and move to next priority fix.**
