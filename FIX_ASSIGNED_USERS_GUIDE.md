# Fix Assigned Users in Energy Logs

## 🔴 Problem Identified

The energy logs in your database have `assigned_users = NULL`, which causes:
- All usage credited to the log creator (Vu)
- Personal Usage showing total household usage
- Bill Split showing incorrect allocations

## 🔧 Solution

You need to update the existing energy logs to populate the `assigned_users` field.

---

## Option 1: Quick Fix via Supabase SQL Editor

### Step 1: Get User IDs

Run this query to get all user IDs:

```sql
SELECT id, name FROM users ORDER BY name;
```

**Copy the IDs** - you'll need them for the next step.

Example output:
```
id: 5c2152ee-6cd0-4d9a-abaf-60217a3d4b10  name: Vu Mai
id: abc123...                              name: Thuy Mai
id: def456...                              name: Vy Mai
id: ghi789...                              name: Han Mai
```

---

### Step 2: Update Energy Logs Based on Device Names

Replace the UUIDs below with your actual user IDs from Step 1:

```sql
-- Update Han's devices
UPDATE energy_logs
SET assigned_users = ARRAY['<HAN_USER_ID>']::uuid[]
WHERE assigned_users IS NULL
  AND device_id IN (
    SELECT id FROM devices WHERE name ILIKE '%Han%'
  );

-- Update Vu's devices
UPDATE energy_logs
SET assigned_users = ARRAY['<VU_USER_ID>']::uuid[]
WHERE assigned_users IS NULL
  AND device_id IN (
    SELECT id FROM devices WHERE name ILIKE '%Vu%'
  );

-- Update Thuy's devices
UPDATE energy_logs
SET assigned_users = ARRAY['<THUY_USER_ID>']::uuid[]
WHERE assigned_users IS NULL
  AND device_id IN (
    SELECT id FROM devices WHERE name ILIKE '%Thuy%'
  );

-- Update Vy's devices
UPDATE energy_logs
SET assigned_users = ARRAY['<VY_USER_ID>']::uuid[]
WHERE assigned_users IS NULL
  AND device_id IN (
    SELECT id FROM devices WHERE name ILIKE '%Vy%'
  );
```

---

### Step 3: Verify the Fix

```sql
SELECT 
  d.name as device_name,
  el.assigned_users,
  u.name as assigned_to,
  el.calculated_cost
FROM energy_logs el
JOIN devices d ON el.device_id = d.id
LEFT JOIN users u ON u.id = ANY(el.assigned_users)
ORDER BY el.created_at DESC
LIMIT 10;
```

You should see the assigned users populated correctly!

---

## Option 2: Manual Fix (If Device Names Don't Match)

If your device names don't contain user names, you'll need to update each log manually:

```sql
-- Find the log IDs and device names
SELECT el.id, d.name, el.calculated_cost
FROM energy_logs el
JOIN devices d ON el.device_id = d.id
WHERE el.assigned_users IS NULL;

-- Then update each one
UPDATE energy_logs
SET assigned_users = ARRAY['<USER_ID>']::uuid[]
WHERE id = '<LOG_ID>';
```

---

## ✅ After Running the Fix

1. **Refresh your Dashboard** - Personal Usage should now show correct values
2. **Check Bill Split** - Should show proper per-person allocations
3. **Verify Energy Logs** - Should still show the user badges

---

## 🎯 Expected Results

**Before:**
- Personal Usage (Vu): $39.56 (wrong - total household)
- Bill Split Vu: $39.26 (wrong)

**After:**
- Personal Usage (Vu): $5.68 (correct - only Vu's usage)
- Personal Usage (Vy): $26.94 (correct)
- Personal Usage (Han): $0.30 (correct)
- Personal Usage (Thuy): $0.04 (correct)
- Bill Split: Correct allocations for each person

---

## 🔮 Prevent Future Issues

The code is already fixed to save `assigned_users` when creating new logs. This issue only affects **existing logs** that were created before the feature was implemented.

Going forward, when you create a new energy log:
1. Select the device
2. Assign users (if it's a shared device)
3. The `assigned_users` field will be saved automatically

---

## 📝 Quick Copy-Paste Template

Here's a template you can use (replace the IDs):

```sql
-- Get user IDs first
SELECT id, name FROM users ORDER BY name;

-- Then run these updates (replace <USER_ID> with actual IDs)
UPDATE energy_logs SET assigned_users = ARRAY['<HAN_ID>']::uuid[] WHERE assigned_users IS NULL AND device_id IN (SELECT id FROM devices WHERE name ILIKE '%Han%');
UPDATE energy_logs SET assigned_users = ARRAY['<VU_ID>']::uuid[] WHERE assigned_users IS NULL AND device_id IN (SELECT id FROM devices WHERE name ILIKE '%Vu%');
UPDATE energy_logs SET assigned_users = ARRAY['<THUY_ID>']::uuid[] WHERE assigned_users IS NULL AND device_id IN (SELECT id FROM devices WHERE name ILIKE '%Thuy%');
UPDATE energy_logs SET assigned_users = ARRAY['<VY_ID>']::uuid[] WHERE assigned_users IS NULL AND device_id IN (SELECT id FROM devices WHERE name ILIKE '%Vy%');

-- Verify
SELECT d.name, el.assigned_users, el.calculated_cost FROM energy_logs el JOIN devices d ON el.device_id = d.id ORDER BY el.created_at DESC LIMIT 10;
```

---

**After running this, your Dashboard and Bill Split will show accurate data!** ✅
