# Mai Home Energy Tracker - Comprehensive Audit Report
**Date:** September 30, 2025
**Status:** In Progress

## Executive Summary
This audit examines calculation accuracy, data display consistency, and missing implementations across the entire application.

---

## 🔴 CRITICAL ISSUES FOUND

### 1. **Duplicate Rate Calculation Logic**
**Severity:** HIGH  
**Location:** `utils/rateCalculator.ts` vs `utils/rateCalculations.ts`

**Problem:**
- Two separate rate calculation files exist with different implementations
- `rateCalculator.ts` is used by `EnergyLogs.tsx` for UI display
- `rateCalculations.ts` has tests but may not be used
- The actual cost calculation uses Supabase RPC function `calculate_energy_cost`

**Impact:**
- UI display calculations may differ from database calculations
- Maintenance nightmare - updates need to be made in multiple places
- Potential for calculation discrepancies

**Recommendation:**
- Consolidate into single source of truth
- Use the same calculation logic for both UI preview and database storage
- Remove unused code

---

### 2. **Incomplete SQL Rate Calculation Function**
**Severity:** MEDIUM  
**Location:** `lib/rateCalculationFunction.sql`

**Problems Found:**

#### a) **Winter Rate Logic Incomplete (Lines 104-126)**
```sql
-- Complex case - need to split across multiple periods
-- This is a simplified approximation for now
```
- Comment admits this is "simplified approximation"
- Does NOT properly split usage across multiple rate periods
- Uses start time only, ignoring proper period boundaries

**Example Bug:**
- Usage from 7:00 AM to 5:00 PM (crosses 3 rate periods)
- Current logic: Uses rate based on start time (7 AM = Off-Peak $0.24)
- Correct logic: Should split:
  - 7:00-8:00 AM: Off-Peak ($0.24)
  - 8:00-4:00 PM: Super Off-Peak ($0.24)  
  - 4:00-5:00 PM: Mid-Peak ($0.52)

#### b) **Overnight Usage Not Handled Properly**
- Lines 22-25 add 24 hours for overnight usage
- But rate period logic doesn't account for crossing midnight
- Example: 11 PM to 2 AM usage may calculate incorrectly

#### c) **Summer Weekend Rate Boundaries**
- Lines 69-100: Weekend logic has same issues as weekday
- Doesn't properly handle edge cases like 3:59 PM to 4:01 PM

---

### 3. **Date/Time Timezone Issues**
**Severity:** MEDIUM (Partially Fixed)  
**Status:** ✅ Fixed in EnergyLogs display, ⚠️ May exist elsewhere

**Fixed:**
- `EnergyLogs.tsx` lines 727, 790: Now uses `new Date(log.usage_date + 'T00:00:00')`

**Potential Issues:**
- Dashboard.tsx: Check if date calculations are timezone-safe
- BillSplit.tsx: Verify date range filtering
- Any date comparisons using `new Date(dateString)` without timezone

---

### 4. **Bill Split Calculation - Shared Device Costs**
**Severity:** MEDIUM  
**Location:** `pages/BillSplit.tsx` lines 130-142

**Current Logic:**
```typescript
if (device && isSharedDevice) {
  // Shared device - track the cost but don't assign to personal
  // This will be part of the shared amount that gets split evenly
  totalTrackedCosts += log.calculated_cost
}
```

**Problem:**
- Shared device costs are added to `totalTrackedCosts`
- Then `remainingAmount = totalBillAmount - totalTrackedCosts`
- Shared costs become part of "remaining" which includes base charges
- This may not accurately represent actual shared device usage

**Question:** Should shared devices:
1. Be split evenly among ALL users? (current behavior)
2. Be split only among users who actually used it? (assigned_users)
3. Have a different allocation method?

---

## ⚠️ MEDIUM PRIORITY ISSUES

### 5. **Missing User Assignment Logic in Bill Split**
**Location:** `pages/BillSplit.tsx`

**Current:** Bill split doesn't use `assigned_users` from energy logs  
**Expected:** Shared device costs should be split only among users who used it

**Example:**
- Samsung TV used by Thuy & Han only
- Current: Cost split among all 4 family members
- Expected: Cost split between Thuy & Han only

---

### 6. **Dashboard Calculations May Be Stale**
**Location:** `pages/Dashboard.tsx` lines 92-200

**Issues:**
- Calculates stats from `energyLogs` array
- No indication if calculations match database totals
- Personal vs shared device logic at line 187 may not match BillSplit logic

---

### 7. **Energy Log Update - Missing Assigned Users Update**
**Location:** `contexts/EnergyLogsContext.tsx` line 250

**Current:** `updateEnergyLog` recalculates cost when device/time changes  
**Missing:** Doesn't handle `assigned_users` updates properly

---

## ✅ RECENTLY FIXED ISSUES

1. ✅ **Bill Split Device Detection** - Now checks both `is_shared` and `sharing_type`
2. ✅ **Edit Log Creating Duplicate** - Now properly updates instead of creating new
3. ✅ **Update Error on Device Change** - Now recalculates cost with new device
4. ✅ **Date Display Timezone** - Fixed in EnergyLogs.tsx

---

## 📋 MISSING IMPLEMENTATIONS

### 1. **Energy Log User Assignments**
**Table:** `energy_log_users` exists in schema  
**Status:** ❌ Not fully implemented

**Missing:**
- UI to view which users were assigned to a log
- Cost split calculation per user for shared devices
- Filtering logs by assigned user

---

### 2. **Bill Splits Persistence**
**Table:** `bill_splits` exists in schema  
**Status:** ⚠️ Partially implemented

**Current:** BillSplit.tsx saves to local state only  
**Missing:** 
- Save to database
- View historical bill splits
- Export functionality (exists but only exports current)

---

### 3. **Rate Period Visualization**
**Missing:** 
- Visual timeline showing current rate period
- Optimal usage time recommendations
- Rate period calendar view

---

### 4. **Device Usage Analytics**
**Missing:**
- Cost per device over time
- Most expensive devices ranking
- Usage pattern analysis
- Peak vs off-peak usage breakdown per device

---

### 5. **Budget & Alerts**
**Missing:**
- Set monthly budget
- Usage alerts when approaching budget
- Cost projections based on current usage

---

## 🔍 EDGE CASES TO TEST

### Calculation Edge Cases:
1. ⚠️ **Overnight usage** (11 PM to 2 AM)
2. ⚠️ **Exactly at rate boundary** (4:00 PM start/end)
3. ⚠️ **Multi-day usage** (should this be allowed?)
4. ⚠️ **Zero duration** (start = end time)
5. ⚠️ **Season boundary** (May 31 to June 1)
6. ⚠️ **Daylight saving time** transitions

### Data Edge Cases:
1. ⚠️ **No energy logs** - Dashboard should show empty state
2. ⚠️ **No devices** - Energy log form should handle gracefully
3. ⚠️ **Single user household** - Bill split should work
4. ⚠️ **All shared devices** - Bill split should split evenly
5. ⚠️ **All personal devices** - Bill split should assign correctly

---

## 🎯 RECOMMENDED FIXES (Priority Order)

### Priority 1: Critical Calculation Fixes
1. **Fix SQL rate calculation function** - Properly split usage across rate periods
2. **Consolidate rate calculation logic** - Single source of truth
3. **Add comprehensive calculation tests** - Cover all edge cases

### Priority 2: Data Accuracy
4. **Implement proper shared device cost allocation** - Use assigned_users
5. **Fix all timezone issues** - Audit entire codebase
6. **Verify Dashboard calculations** - Match database totals

### Priority 3: Missing Features
7. **Implement bill splits persistence** - Save to database
8. **Complete energy_log_users implementation** - Full user assignment flow
9. **Add device analytics** - Cost per device tracking

### Priority 4: User Experience
10. **Add rate period visualization** - Help users optimize usage
11. **Implement budget tracking** - Monthly budget & alerts
12. **Add data export** - CSV/PDF export for all data

---

## 📊 CALCULATION ACCURACY VERIFICATION

### Test Cases Needed:

#### Summer Weekday:
- [ ] 12:00 AM - 4:00 PM (Off-Peak $0.25)
- [ ] 4:00 PM - 9:00 PM (On-Peak $0.55)
- [ ] 9:00 PM - 11:59 PM (Off-Peak $0.25)
- [ ] 3:00 PM - 5:00 PM (crosses boundary)
- [ ] 8:00 PM - 10:00 PM (crosses boundary)

#### Summer Weekend:
- [ ] 12:00 AM - 4:00 PM (Off-Peak $0.25)
- [ ] 4:00 PM - 9:00 PM (Mid-Peak $0.37)
- [ ] 9:00 PM - 11:59 PM (Off-Peak $0.25)

#### Winter (All Days):
- [ ] 9:00 PM - 7:59 AM (Off-Peak $0.24)
- [ ] 8:00 AM - 3:59 PM (Super Off-Peak $0.24)
- [ ] 4:00 PM - 8:59 PM (Mid-Peak $0.52)
- [ ] 7:00 AM - 5:00 PM (crosses 3 periods) ⚠️ KNOWN BUG

---

## 🔧 NEXT STEPS

1. **Immediate:** Fix SQL calculation function for winter multi-period usage
2. **Short-term:** Add calculation tests and verify accuracy
3. **Medium-term:** Implement missing features (bill split persistence, user assignments)
4. **Long-term:** Add analytics and budget tracking

---

## 📝 NOTES

- Demo mode works well but uses simplified calculations
- Real-time subscriptions are commented out in some contexts
- Cache implementation exists but may need tuning
- Error handling is generally good but could be more specific

