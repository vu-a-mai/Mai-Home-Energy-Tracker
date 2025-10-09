# Multi-Device Template & Overlap Detection Implementation

## 🎯 Overview

This implementation adds two major features to the Mai Home Energy Tracker:

1. **Multi-Device Templates**: Store multiple devices in a single template
2. **Overlap Detection**: Warn users when creating logs that overlap with existing entries

---

## 📋 Changes Made

### **Phase 1: Database Migration** ✅

**File:** `web/src/lib/52-add-multi-device-templates.sql`

- Added `device_ids UUID[]` column to `energy_log_templates` table
- Made `device_id` nullable for backward compatibility
- Added check constraint to ensure either `device_id` OR `device_ids` is populated
- Created GIN index for performance on `device_ids` array queries

**To Deploy:**
```sql
-- Run in Supabase SQL Editor
-- Copy and paste contents of 52-add-multi-device-templates.sql
```

---

### **Phase 2: TypeScript Types** ✅

**File:** `web/src/types/index.ts`

Updated `EnergyLogTemplate` interface:
```typescript
export interface EnergyLogTemplate {
  device_id: string | null  // Now nullable
  device_ids: string[] | null  // New: array of device IDs
  devices?: Device[]  // New: joined device info for multi-device templates
  // ... other fields
}
```

---

### **Phase 3: Template Hooks** ✅

**File:** `web/src/hooks/useTemplates.ts`

**New Helper Functions:**
- `checkForOverlap()`: Detects time overlaps between logs
- `getTemplateDeviceIds()`: Handles both old (single) and new (multi) template formats

**Updated Functions:**
- `fetchTemplates()`: Fetches device info for multi-device templates
- `addTemplate()`: Stores templates with `device_ids` array
- `useTemplate()`: Creates logs for all devices with overlap warnings
- `bulkUseTemplate()`: Handles multi-device bulk creation with overlap detection

---

### **Phase 4: UI Components** ✅

**File:** `web/src/components/TemplatesModal.tsx`

**Changes:**
1. Simplified `handleSubmit()` - hook now handles single vs multi-device logic
2. Updated `handleEdit()` - properly loads multi-device templates for editing
3. Enhanced template cards - shows device count badge and device list
4. Updated "Use Template" modal - displays multi-device info

---

## 🚀 How It Works

### **Creating a Multi-Device Template**

1. User enables "Multi-Device Mode" checkbox
2. Selects multiple devices (e.g., Coffee Maker, Toaster, Microwave)
3. Sets time range (e.g., 7:00 AM - 7:30 AM)
4. Assigns users
5. Clicks "Create Template"

**Database Storage:**
```json
{
  "template_name": "Morning Routine",
  "device_id": null,
  "device_ids": ["coffee-uuid", "toaster-uuid", "microwave-uuid"],
  "default_start_time": "07:00:00",
  "default_end_time": "07:30:00",
  "assigned_users": ["user1-uuid", "user2-uuid"]
}
```

### **Using a Multi-Device Template**

1. User clicks "Use Template" on "Morning Routine"
2. Selects date (e.g., 2025-10-09)
3. System creates **3 separate energy logs**:
   - Coffee Maker: 7:00-7:30 AM
   - Toaster: 7:00-7:30 AM
   - Microwave: 7:00-7:30 AM

**Each log is independent:**
- Separate `device_id`
- Same time range
- Same assigned users
- Individual cost calculations

---

## ⚠️ Overlap Detection

### **How It Works**

When creating logs, the system checks for overlapping time periods:

```typescript
// Overlap logic: (StartA < EndB) AND (EndA > StartB)
Existing log: 7:00 AM - 8:00 AM
New log:      7:30 AM - 8:30 AM
Result:       ⚠️ OVERLAP detected (7:30-8:00 overlaps)
```

### **User Experience**

**Exact Duplicate:**
```
✅ Skipped 1 duplicate log
```

**Time Overlap:**
```
⚠️ 1 log may overlap with existing entries
(Still creates the log, but warns user)
```

**No Issues:**
```
✅ Created 3 logs from template!
```

---

## 🧪 Testing Checklist

### **1. Database Migration**
- [ ] Run `52-add-multi-device-templates.sql` in Supabase
- [ ] Verify `device_ids` column exists
- [ ] Check constraint is active

### **2. Single-Device Templates (Backward Compatibility)**
- [ ] Create new single-device template
- [ ] Edit existing single-device template
- [ ] Use single-device template
- [ ] Verify logs created correctly

### **3. Multi-Device Templates**
- [ ] Create multi-device template (3+ devices)
- [ ] Template card shows device count badge
- [ ] Template card lists all devices
- [ ] Edit multi-device template
- [ ] Use multi-device template on single date
- [ ] Verify 3 separate logs created

### **4. Bulk Template Usage**
- [ ] Use multi-device template for date range
- [ ] Verify logs created for all dates × all devices
- [ ] Check "Replace existing" option works

### **5. Overlap Detection**
- [ ] Create manual log: Coffee Maker 8:00-9:00 AM
- [ ] Use template: Coffee Maker 8:30-9:30 AM
- [ ] Verify overlap warning appears
- [ ] Both logs should exist

### **6. Bill Splitting**
- [ ] Create logs with multi-device template
- [ ] Go to Bill Split page
- [ ] Verify each device log is counted separately
- [ ] Verify costs are correct

### **7. Dashboard Statistics**
- [ ] Check device usage totals
- [ ] Verify multi-device logs counted correctly
- [ ] Check personal vs household stats

---

## 📊 Example Scenarios

### **Scenario 1: Morning Routine**

**Template:**
- Devices: Coffee Maker, Toaster, Microwave
- Time: 7:00-7:30 AM
- Users: Vu, Thuy

**Using template on Oct 9:**
```
Creates 3 logs:
1. Coffee Maker: 7:00-7:30 AM, assigned to [Vu, Thuy]
2. Toaster: 7:00-7:30 AM, assigned to [Vu, Thuy]
3. Microwave: 7:00-7:30 AM, assigned to [Vu, Thuy]
```

**Bill Split Result:**
```
Coffee cost: $0.15 → Vu: $0.075, Thuy: $0.075
Toaster cost: $0.10 → Vu: $0.05, Thuy: $0.05
Microwave cost: $0.12 → Vu: $0.06, Thuy: $0.06
Total: Vu owes $0.185, Thuy owes $0.185
```

---

### **Scenario 2: Overlap Warning**

**Existing log:**
- Coffee Maker: 8:00-9:00 AM (manual entry)

**Using template:**
- Coffee Maker: 8:30-9:30 AM (from template)

**Result:**
```
⚠️ Warning: Coffee Maker already has a log from 8:00-9:00
✅ Log created anyway (user can delete if needed)
```

**Why both logs exist:**
- Different times = different usage sessions
- User may have actually used it twice
- System warns but doesn't block

---

## 🔧 Troubleshooting

### **Issue: Template not creating logs**

**Check:**
1. Database migration ran successfully
2. `device_ids` column exists and has data
3. Browser console for errors
4. Supabase logs for RLS policy errors

### **Issue: Overlap detection not working**

**Check:**
1. `checkForOverlap()` function is being called
2. Console logs show overlap detection running
3. Toast notifications appear

### **Issue: Bill split incorrect**

**Check:**
1. Each device has separate log entry
2. `device_id` is set correctly (not null)
3. `assigned_users` array is populated
4. Costs calculated per log

---

## 🎨 UI Changes

### **Template Card - Single Device**
```
┌─────────────────────────────┐
│ Morning Coffee              │
│ ⚡ Coffee Maker (1200W)     │
│ 🕐 7:00 - 7:30             │
│ 👤 Vu, Thuy                │
└─────────────────────────────┘
```

### **Template Card - Multi Device**
```
┌─────────────────────────────┐
│ Morning Routine             │
│ ⚡ [3 Devices]              │
│ 🕐 7:00 - 7:30             │
│ Coffee Maker, Toaster,      │
│ Microwave                   │
│ 👤 Vu, Thuy                │
└─────────────────────────────┘
```

---

## 📝 Migration Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Remove new columns
ALTER TABLE energy_log_templates 
  DROP COLUMN IF EXISTS device_ids;

-- Make device_id required again
ALTER TABLE energy_log_templates 
  ALTER COLUMN device_id SET NOT NULL;

-- Drop constraint
ALTER TABLE energy_log_templates
  DROP CONSTRAINT IF EXISTS check_device_selection;
```

---

## ✅ Deployment Steps

1. **Backup Database**
   ```bash
   # In Supabase Dashboard > Database > Backups
   # Create manual backup
   ```

2. **Run Migration**
   ```sql
   -- In Supabase SQL Editor
   -- Paste contents of 52-add-multi-device-templates.sql
   -- Execute
   ```

3. **Deploy Frontend**
   ```bash
   npm run build
   # Deploy to your hosting platform
   ```

4. **Test in Production**
   - Create test multi-device template
   - Use template
   - Verify logs created
   - Check bill splitting

5. **Monitor**
   - Watch Supabase logs for errors
   - Check user feedback
   - Monitor performance

---

## 🎉 Benefits

✅ **User Experience:**
- Create templates faster (one template for multiple devices)
- Less clutter in template list
- Semantic grouping (e.g., "Morning Routine")

✅ **Data Integrity:**
- Overlap warnings prevent double-counting
- Each log is separate (correct billing)
- Backward compatible with existing templates

✅ **Performance:**
- GIN index on `device_ids` for fast queries
- Efficient bulk log creation
- Minimal database queries

---

## 📚 Related Files

- `web/src/lib/52-add-multi-device-templates.sql` - Database migration
- `web/src/types/index.ts` - TypeScript interfaces
- `web/src/hooks/useTemplates.ts` - Template logic
- `web/src/components/TemplatesModal.tsx` - UI component

---

## 🆘 Support

If you encounter issues:

1. Check browser console for errors
2. Check Supabase logs
3. Verify migration ran successfully
4. Test with single-device template first
5. Review this document for troubleshooting steps

---

**Implementation Date:** 2025-10-09  
**Version:** 1.0.0  
**Status:** ✅ Ready for Testing
