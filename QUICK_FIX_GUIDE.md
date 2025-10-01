# Quick Fix Guide - Immediate Actions

## 🔥 CRITICAL: Fix SQL Rate Calculation (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Fixed Function
1. Open file: `web/src/lib/rateCalculationFunction-fixed.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. You should see: "Success. No rows returned"

### Step 3: Test the Fix
Run these test queries to verify:

```sql
-- Test 1: Summer weekday crossing On-Peak
SELECT calculate_energy_cost(100, '15:00', '17:00', '2025-07-15'::DATE);
-- Expected: ~$0.08

-- Test 2: Winter crossing 3 periods (THIS WAS BROKEN BEFORE)
SELECT calculate_energy_cost(100, '07:00', '17:00', '2025-01-15'::DATE);
-- Expected: ~$0.27

-- Test 3: Overnight usage
SELECT calculate_energy_cost(100, '23:00', '02:00', '2025-07-15'::DATE);
-- Expected: ~$0.08
```

### Step 4: Verify in Your App
1. Go to Energy Logs page
2. Create a new log with: 7:00 AM - 5:00 PM in January
3. Check that the cost is calculated correctly (should split across 3 rate periods)

---

## 📝 Optional: Recalculate Existing Logs

If you want to fix costs for existing energy logs:

```sql
-- WARNING: This will recalculate ALL energy log costs
-- Make a backup first!

UPDATE energy_logs
SET calculated_cost = calculate_energy_cost(
  (SELECT wattage FROM devices WHERE id = energy_logs.device_id),
  start_time,
  end_time,
  usage_date
)
WHERE calculated_cost IS NOT NULL;

-- Check how many were updated
SELECT COUNT(*) FROM energy_logs WHERE calculated_cost IS NOT NULL;
```

---

## 🎯 Quick Wins (Optional, but Recommended)

### Fix 1: Remove Unused Rate Calculation File (2 minutes)

```bash
# This file has tests but isn't actually used
rm web/src/utils/rateCalculations.ts
rm web/src/utils/__tests__/rateCalculations.test.ts
```

### Fix 2: Add Timezone Safety to Dashboard (5 minutes)

Search for any `new Date(dateString)` in Dashboard.tsx and replace with:
```typescript
// Before (BAD - timezone issues)
new Date(log.usage_date)

// After (GOOD - timezone safe)
new Date(log.usage_date + 'T00:00:00')
```

---

## 📊 Verify Everything Works

### Checklist:
- [ ] SQL function replaced successfully
- [ ] Test queries return expected values
- [ ] New energy logs calculate correctly
- [ ] Bill split shows proper device categorization
- [ ] Edit log updates instead of creating duplicate
- [ ] Dates display correctly (no day-off errors)

---

## 🚨 If Something Breaks

### Rollback SQL Function:
If the new function causes issues, you can restore the old one from:
`web/src/lib/rateCalculationFunction.sql`

### Check Logs:
- Browser Console (F12) for frontend errors
- Supabase Logs for backend errors

### Common Issues:
1. **"Function does not exist"** - Make sure you ran the CREATE OR REPLACE command
2. **"Permission denied"** - Check your Supabase role has permission to create functions
3. **Costs seem wrong** - Verify the test cases return expected values

---

## 📞 Need Help?

Refer to:
- **AUDIT_SUMMARY.md** - High-level overview
- **AUDIT_FINDINGS.md** - Detailed technical findings
- **rateCalculationFunction-fixed.sql** - The fixed SQL with comments

---

## ✅ Success Criteria

You'll know everything is working when:
1. ✅ Test queries return expected values
2. ✅ New energy logs show accurate costs
3. ✅ Bill split correctly categorizes personal vs shared devices
4. ✅ Editing logs updates them instead of duplicating
5. ✅ Dates display correctly without timezone shifts

---

**Estimated Time:** 10-15 minutes for critical fix  
**Risk Level:** Low (can rollback if needed)  
**Impact:** High (fixes all cost calculations)

