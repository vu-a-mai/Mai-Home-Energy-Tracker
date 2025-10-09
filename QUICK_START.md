# 🚀 Quick Start - Multi-Device Templates

## Step 1: Run Database Migration

**In Supabase SQL Editor:**

1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy and paste the entire contents of:
   ```
   web/src/lib/52-add-multi-device-templates.sql
   ```
4. Click "Run" or press `Ctrl+Enter`
5. Wait for success message:
   ```
   ✅ Migration completed successfully!
   ```

---

## Step 2: Verify Migration

**Run this query to verify:**

```sql
-- Check if device_ids column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'energy_log_templates'
  AND column_name IN ('device_id', 'device_ids');

-- Expected output:
-- device_id    | uuid   | YES
-- device_ids   | ARRAY  | YES
```

---

## Step 3: Test Multi-Device Template

### **Create Template:**

1. Open your app
2. Go to Energy Logs page
3. Click "Templates" button
4. Click "Add Template"
5. Check "Multi-Device Mode" ✅
6. Enter name: `Test Multi-Device`
7. Select 3 devices (e.g., Coffee Maker, Toaster, Microwave)
8. Set time: `07:00` - `07:30`
9. Select yourself as assigned user
10. Click "Create Template"

**Expected:** Toast shows "Template created with 3 device(s)!"

### **Use Template:**

1. Find "Test Multi-Device" template
2. Click "Use Template"
3. Select today's date
4. Click "Create Log"

**Expected:** 
- Toast shows "✅ Created 3 log(s) from template!"
- Go to Energy Logs page
- See 3 separate logs (one per device)

---

## Step 4: Test Overlap Detection

### **Create Overlap:**

1. Manually create log: Coffee Maker, 08:00-09:00, today
2. Create template: "Overlap Test", Coffee Maker, 08:30-09:30
3. Use template for today

**Expected:**
- Toast shows "✅ Created 1 log(s) from template!"
- Toast shows "⚠️ 1 log(s) may overlap with existing entries"
- Both logs exist in Energy Logs

---

## Step 5: Verify Bill Splitting

1. Go to Bill Split page
2. Enter billing period covering your test logs
3. Click "Calculate Split"

**Expected:**
- Each device log counted separately
- Coffee Maker: $X.XX
- Toaster: $X.XX
- Microwave: $X.XX
- Total adds up correctly

---

## 🐛 Troubleshooting

### **Migration Failed**

**Error:** `column "device_ids" already exists`

**Solution:** Column already added, you're good! Skip to Step 3.

---

### **Template Not Creating Logs**

**Check:**
1. Browser Console (F12) for errors
2. Supabase Dashboard → Logs → Recent Logs
3. Verify you're authenticated
4. Try single-device template first

---

### **Overlap Warning Not Showing**

**Check:**
1. Times actually overlap (not just same day)
2. Same device in both logs
3. Console shows overlap detection running

---

## ✅ Success Checklist

- [ ] Migration ran successfully
- [ ] Can create multi-device template
- [ ] Template shows "[3 Devices]" badge
- [ ] Using template creates 3 logs
- [ ] Overlap detection warns appropriately
- [ ] Bill splitting counts each log separately
- [ ] Dashboard shows correct statistics
- [ ] Old single-device templates still work

---

## 📊 Expected Behavior Summary

| Action | Result |
|--------|--------|
| Create multi-device template | 1 template with device_ids array |
| Use template (single date) | N logs (N = number of devices) |
| Use template (date range) | N × D logs (D = number of dates) |
| Exact duplicate | Skipped with toast notification |
| Time overlap | Warning toast, log still created |
| Bill split | Each log counted separately |
| Dashboard | Each device shows correct totals |

---

## 🎯 Next Steps

Once all tests pass:

1. **Create Real Templates:**
   - Morning Routine (Coffee, Toaster, Microwave)
   - Evening Entertainment (TV, Sound System, Lights)
   - Work Setup (Computer, Monitor, Printer)

2. **Use Bulk Creation:**
   - Select date range (e.g., last 30 days)
   - Select days of week (e.g., Mon-Fri)
   - Generate historical logs

3. **Monitor Performance:**
   - Check load times
   - Verify no errors in console
   - Ensure smooth user experience

---

## 📞 Need Help?

Refer to detailed documentation:
- `MULTI_DEVICE_TEMPLATE_IMPLEMENTATION.md` - Full implementation guide
- `TEST_MULTI_DEVICE_TEMPLATES.md` - Detailed test scenarios

---

**Happy Testing! 🎉**
