# Duplicate Data Cleanup Guide

## Issue Identified

Your energy logs were showing duplicate data because the application was **not filtering by household_id**. This meant:

1. You were seeing ALL energy logs from the entire database (including other users/households)
2. You might have actual duplicate entries in your database

## Fixes Applied

### 1. Fixed EnergyLogsContext.tsx
- **Added household_id filtering** to only fetch logs for your household
- Now queries: `.eq('household_id', userData.household_id)`

### 2. Fixed DeviceContext.tsx  
- **Added household_id filtering** to only fetch devices for your household
- Now queries: `.eq('household_id', userData.household_id)`

## Steps to Clean Up Your Data

### Step 1: Refresh Your Browser
1. Close and reopen your browser
2. Clear the application cache (Ctrl+Shift+R or Cmd+Shift+R)
3. Log back into the application

**Expected Result:** You should now see ONLY your household's energy logs and devices.

### Step 2: Check for Actual Duplicates

If you still see duplicate entries after Step 1, you have actual duplicate records in the database. Follow these steps:

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to **SQL Editor**
4. Run the first query from `web/src/lib/12-identify-and-remove-duplicates.sql`:

```sql
-- Step 1: Identify duplicate energy logs
SELECT 
  device_id,
  usage_date,
  start_time,
  end_time,
  household_id,
  COUNT(*) as duplicate_count,
  array_agg(id) as duplicate_ids,
  array_agg(created_at) as created_dates
FROM energy_logs
GROUP BY device_id, usage_date, start_time, end_time, household_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, usage_date DESC;
```

**What to look for:**
- If this query returns **no rows** → No duplicates! ✅
- If it returns rows → You have duplicates that need cleanup

### Step 3: View Duplicate Details

If you have duplicates, run this query to see detailed information:

```sql
SELECT 
  el.*,
  d.name as device_name,
  d.wattage as device_wattage
FROM energy_logs el
LEFT JOIN devices d ON el.device_id = d.id
WHERE (el.device_id, el.usage_date, el.start_time, el.end_time, el.household_id) IN (
  SELECT device_id, usage_date, start_time, end_time, household_id
  FROM energy_logs
  GROUP BY device_id, usage_date, start_time, end_time, household_id
  HAVING COUNT(*) > 1
)
ORDER BY el.usage_date DESC, el.start_time DESC, el.created_at ASC;
```

### Step 4: Remove Duplicates (If Found)

**⚠️ WARNING: This will DELETE data. Make sure to review Step 2 & 3 results first!**

This query keeps the **oldest** entry (by `created_at`) and removes newer duplicates:

```sql
DELETE FROM energy_logs
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY device_id, usage_date, start_time, end_time, household_id 
        ORDER BY created_at ASC
      ) AS row_num
    FROM energy_logs
  ) t
  WHERE row_num > 1
);
```

### Step 5: Verify Cleanup

Run this to confirm all duplicates are removed:

```sql
SELECT 
  device_id,
  usage_date,
  start_time,
  end_time,
  household_id,
  COUNT(*) as count
FROM energy_logs
GROUP BY device_id, usage_date, start_time, end_time, household_id
HAVING COUNT(*) > 1;
```

**Expected Result:** This should return **no rows**.

### Step 6: Check Summary Statistics

```sql
SELECT 
  COUNT(*) as total_energy_logs,
  COUNT(DISTINCT household_id) as total_households,
  COUNT(DISTINCT device_id) as total_devices,
  MIN(usage_date) as earliest_log,
  MAX(usage_date) as latest_log
FROM energy_logs;
```

This shows your database health after cleanup.

## Verify in Application

After cleanup:
1. Refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Go to the Energy Logs page
3. Verify:
   - ✅ No duplicate entries
   - ✅ Only YOUR household's data is showing
   - ✅ Total counts are accurate

## What Changed in the Code

### Before (Problematic):
```typescript
// This fetched ALL energy logs from ALL households
const { data, error } = await supabase
  .from('energy_logs')
  .select('*')
  .order('usage_date', { ascending: false })
```

### After (Fixed):
```typescript
// This fetches ONLY your household's energy logs
const { data: userData } = await supabase
  .from('users')
  .select('household_id')
  .eq('id', user.id)
  .maybeSingle()

const { data, error } = await supabase
  .from('energy_logs')
  .select('*')
  .eq('household_id', userData.household_id)  // ← KEY FIX
  .order('usage_date', { ascending: false })
```

## Prevention

These fixes ensure:
- ✅ Users only see their own household's data
- ✅ Proper data isolation between households
- ✅ Accurate totals and statistics
- ✅ No cross-contamination of data

## Need Help?

If you encounter any issues:
1. Check the browser console (F12) for errors
2. Verify you're logged in correctly
3. Check that your user has a `household_id` in the database
4. Run the diagnostic queries above

## Summary

| Issue | Status | Fix |
|-------|--------|-----|
| Missing household_id filter in EnergyLogsContext | ✅ Fixed | Added `.eq('household_id', userData.household_id)` |
| Missing household_id filter in DeviceContext | ✅ Fixed | Added `.eq('household_id', userData.household_id)` |
| Potential duplicate records in database | 🔍 Check Required | Use SQL cleanup script |
| Data accuracy | ✅ Will be accurate | After applying all fixes |

Your application should now show accurate, household-specific data with no duplicates!

