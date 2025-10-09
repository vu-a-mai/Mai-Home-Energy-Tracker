# Multi-Device Template Testing Guide

## 🧪 Quick Test Scenarios

### **Test 1: Create Multi-Device Template**

**Steps:**
1. Open Templates modal
2. Click "Add Template"
3. Enable "Multi-Device Mode" checkbox
4. Enter template name: "Morning Routine"
5. Select devices: Coffee Maker, Toaster, Microwave
6. Set time: 7:00 AM - 7:30 AM
7. Assign users: Select yourself
8. Click "Create Template"

**Expected Result:**
```
✅ Template created with 3 device(s)!
```

**Verify:**
- Template card shows "[3 Devices]" badge
- Device names listed below badge
- Template appears in list

---

### **Test 2: Use Multi-Device Template (Single Date)**

**Steps:**
1. Find "Morning Routine" template
2. Click "Use Template" button
3. Select today's date
4. Click "Create Log"

**Expected Result:**
```
✅ Created 3 log(s) from template!
```

**Verify:**
- Go to Energy Logs page
- See 3 separate logs:
  - Coffee Maker 7:00-7:30
  - Toaster 7:00-7:30
  - Microwave 7:00-7:30
- All have same assigned users
- Each has individual cost

---

### **Test 3: Bulk Use Multi-Device Template**

**Steps:**
1. Find "Morning Routine" template
2. Click "Use Template"
3. Enable "Date Range" toggle
4. Select: Oct 1 - Oct 7
5. Select days: Mon, Wed, Fri
6. Click "Generate Logs"

**Expected Result:**
```
Generating 9 log(s) from template...
✅ Generated 9 log(s) from template!
```

**Calculation:** 3 dates × 3 devices = 9 logs

**Verify:**
- Go to Energy Logs page
- Filter by date range
- See 9 logs total (3 per day)

---

### **Test 4: Overlap Detection**

**Steps:**
1. Manually create log: Coffee Maker, 8:00-9:00 AM, today
2. Create template: "Coffee Break" with Coffee Maker, 8:30-9:30 AM
3. Use template for today

**Expected Result:**
```
✅ Created 1 log(s) from template!
⚠️ 1 log(s) may overlap with existing entries
```

**Verify:**
- Both logs exist in Energy Logs
- No duplicate (different times)
- Warning appeared

---

### **Test 5: Exact Duplicate Prevention**

**Steps:**
1. Create template: "Test" with Coffee Maker, 10:00-11:00 AM
2. Use template for today
3. Use same template for today again (without "Replace existing")

**Expected Result:**
```
⏭️ Skipped 1 duplicate(s)
```

**Verify:**
- Only 1 log exists
- Second attempt skipped

---

### **Test 6: Edit Multi-Device Template**

**Steps:**
1. Find "Morning Routine" template
2. Click "Edit" button
3. Verify "Multi-Device Mode" is checked
4. Verify all 3 devices are selected
5. Change time to 7:30-8:00 AM
6. Click "Update Template"

**Expected Result:**
```
✅ Template updated successfully!
```

**Verify:**
- Template shows new time
- Device list unchanged
- Can still use template

---

### **Test 7: Bill Splitting with Multi-Device**

**Steps:**
1. Create logs using multi-device template
2. Go to Bill Split page
3. Enter billing period covering the logs
4. Click "Calculate Split"

**Expected Result:**
- Each device log counted separately
- Costs split among assigned users
- Total matches sum of individual logs

**Example:**
```
Coffee Maker: $0.15 → Vu: $0.075, Thuy: $0.075
Toaster: $0.10 → Vu: $0.05, Thuy: $0.05
Microwave: $0.12 → Vu: $0.06, Thuy: $0.06
---
Total: Vu: $0.185, Thuy: $0.185
```

---

### **Test 8: Dashboard Statistics**

**Steps:**
1. Create logs using multi-device template
2. Go to Dashboard
3. Check device usage breakdown

**Expected Result:**
- Each device shows correct kWh and cost
- Coffee Maker, Toaster, Microwave all listed separately
- Personal vs household stats accurate

---

### **Test 9: Backward Compatibility (Single Device)**

**Steps:**
1. Create template WITHOUT multi-device mode
2. Select single device: TV
3. Set time: 8:00 PM - 10:00 PM
4. Use template

**Expected Result:**
```
✅ Template created with 1 device(s)!
✅ Created 1 log(s) from template!
```

**Verify:**
- Old single-device templates still work
- No breaking changes

---

### **Test 10: Replace Existing Logs**

**Steps:**
1. Use multi-device template for Oct 5
2. Use same template for Oct 5 again
3. Enable "Replace existing logs" checkbox
4. Click "Generate Logs"

**Expected Result:**
```
✅ Generated 3 log(s) from template!
```

**Verify:**
- Old logs deleted
- New logs created
- No duplicates

---

## 🐛 Common Issues & Solutions

### **Issue: "device_ids column not found"**

**Solution:**
```sql
-- Run migration again
-- Copy contents of 52-add-multi-device-templates.sql
-- Paste in Supabase SQL Editor
-- Execute
```

---

### **Issue: Template not creating logs**

**Check:**
1. Browser console for errors
2. Supabase logs
3. RLS policies enabled
4. User authenticated

---

### **Issue: Overlap warning not showing**

**Check:**
1. Console logs show overlap detection running
2. Times actually overlap (not just same day)
3. Same device in both logs

---

### **Issue: Bill split incorrect**

**Check:**
1. Each device has separate log
2. Assigned users correct
3. Costs calculated individually
4. No duplicate logs

---

## ✅ Success Criteria

All tests pass if:

- ✅ Multi-device templates create multiple logs
- ✅ Overlap detection warns appropriately
- ✅ Exact duplicates are skipped
- ✅ Bill splitting counts each log separately
- ✅ Dashboard shows correct statistics
- ✅ Single-device templates still work
- ✅ Edit functionality works for both types
- ✅ Bulk creation works correctly
- ✅ Replace existing logs works
- ✅ No errors in console or Supabase logs

---

## 📊 Performance Check

After testing, verify:

- [ ] Template list loads quickly
- [ ] Creating logs is fast (< 2 seconds for 10 logs)
- [ ] No lag when using templates
- [ ] Dashboard renders smoothly
- [ ] Bill split calculates quickly

---

## 🎯 Next Steps After Testing

1. **If all tests pass:**
   - Deploy to production
   - Monitor for issues
   - Gather user feedback

2. **If tests fail:**
   - Check error messages
   - Review implementation
   - Consult MULTI_DEVICE_TEMPLATE_IMPLEMENTATION.md
   - Fix issues and retest

---

**Happy Testing! 🚀**
