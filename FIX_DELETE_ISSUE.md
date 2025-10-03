# Fix: Energy Logs Won't Delete

## 🔴 Problem

You're trying to delete energy logs, but they come back after refreshing because the **RLS (Row Level Security) policy is blocking the deletion**.

The current policy only allows you to delete logs where `created_by` matches your user ID. But your existing logs have a different `created_by` value, so the delete fails silently.

## ✅ Quick Fix (Recommended)

Run this in **Supabase SQL Editor**:

```sql
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "energy_logs_delete_own" ON energy_logs;
DROP POLICY IF EXISTS "Users can delete energy logs they created" ON energy_logs;

-- Create a household-based delete policy
-- This allows ANY household member to delete ANY log in their household
CREATE POLICY "energy_logs_delete_household" 
  ON energy_logs FOR DELETE 
  USING (
    household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );
```

### Why This Works

- **Before:** You could only delete logs YOU created (`created_by = your_id`)
- **After:** You can delete ANY log in YOUR household (more user-friendly)

This makes sense for a household energy tracker where family members should be able to manage all household data.

## 🔧 Alternative Fix (If You Still Can't Delete)

If the above doesn't work, also update the `created_by` field for existing logs:

```sql
-- Update all existing logs in your household to be owned by you
UPDATE energy_logs
SET created_by = auth.uid()
WHERE household_id IN (
  SELECT household_id FROM users WHERE id = auth.uid()
);
```

## 📋 Step-by-Step Instructions

1. Open **Supabase Dashboard**: https://supabase.com/dashboard
2. Go to your project
3. Click **SQL Editor** in the left menu
4. Click **+ New Query**
5. Copy and paste the "Quick Fix" SQL above
6. Click **Run** (or press `Ctrl+Enter`)
7. Go back to your app and **refresh** (`Ctrl+Shift+R`)
8. Try deleting the logs again

## ✅ Verification

After running the fix, you should see:
- ✅ Energy logs delete successfully
- ✅ After refresh, deleted logs stay gone
- ✅ No errors in browser console

## 🔍 Diagnostic (Optional)

To check what's causing the issue, run this first:

```sql
-- Check current user and energy logs ownership
SELECT 
  el.id,
  el.usage_date,
  el.created_by,
  CASE 
    WHEN el.created_by = auth.uid() THEN '✅ Can Delete'
    ELSE '❌ Cannot Delete'
  END as delete_permission,
  u.email as created_by_email
FROM energy_logs el
LEFT JOIN users u ON el.created_by = u.id
WHERE el.household_id IN (
  SELECT household_id FROM users WHERE id = auth.uid()
)
ORDER BY el.usage_date DESC;
```

This will show you which logs you can/can't delete and why.

## 🎯 Summary

The issue is **RLS policies**, not your application code. Once you update the policy in Supabase, deletion will work perfectly!

---

**Need Help?** If you're still having issues after running the fix, let me know and I'll investigate further.


