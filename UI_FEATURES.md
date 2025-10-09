# 🎨 UI Features - Multi-Device Templates

## 📋 **Template Modal**

### **Single Device Mode (Default):**
```
┌─────────────────────────────────────┐
│ ➕ Add New Template                 │
├─────────────────────────────────────┤
│ Template Name: Morning Coffee       │
│                                     │
│ ☐ Multi-Device Mode                │
│                                     │
│ Device: [Coffee Maker ▼]           │
│                                     │
│ Start Time: [07:00]                │
│ End Time:   [07:30]                │
│                                     │
│ Assign Users: [Vu] [Thuy]         │
│                                     │
│ [Cancel]  [Create Template]        │
└─────────────────────────────────────┘
```

### **Multi-Device Mode (Enabled):**
```
┌─────────────────────────────────────┐
│ ➕ Add New Template                 │
├─────────────────────────────────────┤
│ Template Name: Morning Routine      │
│                                     │
│ ☑ Multi-Device Mode                │
│ ✓ Select multiple devices at once  │
│                                     │
│ Devices:                            │
│ ☑ Coffee Maker (1200W)             │
│ ☑ Toaster (800W)                   │
│ ☑ Microwave (1000W)                │
│ ☐ Refrigerator (150W)              │
│ ☐ TV (100W)                        │
│                                     │
│ Start Time: [07:00]                │
│ End Time:   [07:30]                │
│                                     │
│ Assign Users: [Vu] [Thuy]         │
│                                     │
│ [Cancel]  [Create Template]        │
└─────────────────────────────────────┘
```

---

## 📑 **Template List**

### **Single Device Template:**
```
┌─────────────────────────────────────┐
│ Morning Coffee                      │
│ ⚡ Coffee Maker (1200W)            │
│ 🕐 7:00 - 7:30                     │
│ 👤 Vu, Thuy                        │
│                                     │
│ [Use Template] [Edit] [Delete]     │
└─────────────────────────────────────┘
```

### **Multi-Device Template:**
```
┌─────────────────────────────────────┐
│ Morning Routine                     │
│ ⚡ [3 Devices] 🔵                  │
│ 🕐 7:00 - 7:30                     │
│                                     │
│ Coffee Maker, Toaster, Microwave    │
│                                     │
│ 👤 Vu, Thuy                        │
│                                     │
│ [Use Template] [Edit] [Delete]     │
└─────────────────────────────────────┘
```

---

## 📊 **Energy Logs Page**

### **Single Log (Manual):**
```
┌─────────────────────────────────────┐
│ ☕ Coffee Maker                     │
│ 📅 Oct 9, 2025 | ⏰ 8:00-8:30 AM   │
│ ⚡ 0.60 kWh | 💰 $0.09             │
│ 👤 Vu                              │
│                                     │
│ [Edit] [Delete] [Save as Template] │
└─────────────────────────────────────┘
```

### **Log from Template (with Badge):**
```
┌─────────────────────────────────────┐
│ ☕ Coffee Maker  [📋 Template]     │
│ 📅 Oct 9, 2025 | ⏰ 7:00-7:30 AM   │
│ ⚡ 0.60 kWh | 💰 $0.09             │
│ 👤 Vu, Thuy                        │
│                                     │
│ [Edit] [Delete] [Save as Template] │
└─────────────────────────────────────┘
```

### **Multiple Logs from Same Template:**
```
┌─────────────────────────────────────┐
│ ☕ Coffee Maker  [📋 Template]     │
│ 📅 Oct 9, 2025 | ⏰ 7:00-7:30 AM   │
│ ⚡ 0.60 kWh | 💰 $0.09             │
│ 👤 Vu, Thuy                        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🍞 Toaster  [📋 Template]          │
│ 📅 Oct 9, 2025 | ⏰ 7:00-7:30 AM   │
│ ⚡ 0.30 kWh | 💰 $0.05             │
│ 👤 Vu, Thuy                        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🔥 Microwave  [📋 Template]        │
│ 📅 Oct 9, 2025 | ⏰ 7:00-7:30 AM   │
│ ⚡ 0.45 kWh | 💰 $0.07             │
│ 👤 Vu, Thuy                        │
└─────────────────────────────────────┘
```

**Note:** All 3 logs have:
- Same date & time (7:00-7:30 AM)
- Same assigned users (Vu, Thuy)
- "Template" badge for easy identification

---

## 🔔 **Toast Notifications**

### **Creating Template:**
```
✅ Template created with 3 device(s)!
```

### **Using Template:**
```
✅ Created 3 log(s) from template!
```

### **Overlap Warning:**
```
⚠️ 1 log(s) may overlap with existing entries
```

### **Duplicate Skipped:**
```
⏭️ Skipped 1 duplicate(s)
```

### **Bulk Creation:**
```
Generating 9 log(s) from template...
✅ Generated 9 log(s) from template!
⏭️ Skipped 2 existing log(s)
⚠️ 1 log(s) may overlap with existing entries
```

---

## 🎯 **Use Template Modal**

### **Single Date:**
```
┌─────────────────────────────────────┐
│ Use Template: Morning Routine       │
├─────────────────────────────────────┤
│ Device: [3 Devices]                 │
│ Coffee Maker, Toaster, Microwave    │
│                                     │
│ Time: 7:00 - 7:30                  │
│                                     │
│ ○ Single Date                      │
│ Date: [Oct 9, 2025 ▼]             │
│                                     │
│ [Cancel]  [Create Log]             │
└─────────────────────────────────────┘
```

### **Date Range:**
```
┌─────────────────────────────────────┐
│ Use Template: Morning Routine       │
├─────────────────────────────────────┤
│ Device: [3 Devices]                 │
│ Coffee Maker, Toaster, Microwave    │
│                                     │
│ Time: 7:00 - 7:30                  │
│                                     │
│ ● Date Range                       │
│ Start: [Oct 1, 2025 ▼]            │
│ End:   [Oct 7, 2025 ▼]            │
│                                     │
│ Days: [M][T][W][T][F][S][S]        │
│       ✓  ✓  ✓  ✓  ✓  ☐  ☐        │
│                                     │
│ ☐ Replace existing logs            │
│                                     │
│ Will create: 15 logs                │
│ (5 dates × 3 devices)              │
│                                     │
│ [Cancel]  [Generate Logs]          │
└─────────────────────────────────────┘
```

---

## 📱 **Mobile View**

### **Template Card (Mobile):**
```
┌───────────────────────┐
│ Morning Routine       │
│ [3 Devices] 🔵       │
│ 7:00 - 7:30          │
│ Coffee Maker,         │
│ Toaster, Microwave    │
│ Vu, Thuy             │
│                       │
│ [Use] [Edit] [Del]   │
└───────────────────────┘
```

### **Energy Log (Mobile):**
```
┌───────────────────────┐
│ ☕ Coffee Maker       │
│ [Template] 🔵        │
│ Oct 9 | 7:00-7:30    │
│ 0.60 kWh | $0.09     │
│ Vu, Thuy             │
│                       │
│ [Edit] [Del] [Save]  │
└───────────────────────┘
```

---

## 🎨 **Color Scheme**

### **Badges:**
- 🔵 **Template Badge:** Blue (`bg-blue-500/20 text-blue-400`)
- 🟢 **Shared Device:** Green (`bg-green-500/20 text-green-400`)
- 🟡 **Personal Device:** Yellow (`bg-yellow-500/20 text-yellow-400`)
- 🟠 **Device Count:** Orange (`bg-orange-500/20 text-orange-400`)

### **Icons:**
- 📋 **Template:** `DocumentDuplicateIcon`
- ⚡ **Energy:** `BoltIcon`
- 🕐 **Time:** `ClockIcon`
- 📅 **Date:** `CalendarIcon`
- 👤 **User:** `UserIcon`

---

## ✨ **Visual Indicators**

### **Template Badge Benefits:**
1. **Easy Identification:** Instantly see which logs came from templates
2. **Consistency:** Same badge style across mobile and desktop
3. **Grouping:** Logs with same date/time/badge are from same template
4. **Filtering:** Can filter by source_type in future

### **Device Count Badge:**
1. **Quick Info:** See number of devices at a glance
2. **Space Efficient:** Doesn't clutter the UI
3. **Expandable:** Click to see full device list

---

## 🎯 **User Experience Flow**

### **Creating Multi-Device Template:**
1. Click "Templates" button
2. Click "Add Template"
3. Enable "Multi-Device Mode" ✓
4. Select 3+ devices
5. Set time range
6. Assign users
7. Click "Create Template"
8. See success toast: "Template created with 3 device(s)!"

### **Using Template:**
1. Find template in list
2. Click "Use Template"
3. Select date or date range
4. Click "Create Log" or "Generate Logs"
5. See success toast: "Created 3 log(s) from template!"
6. Go to Energy Logs page
7. See 3 logs with "Template" badges

### **Identifying Template Logs:**
1. Look for blue "Template" badge
2. Same date & time = from same template
3. Can edit/delete individually
4. Bill split counts each separately

---

## 📊 **Dashboard Integration**

Template-created logs appear in:
- ✅ **Device Usage Chart:** Each device counted separately
- ✅ **Personal vs Household:** Split correctly
- ✅ **Rate Period Breakdown:** Calculated per log
- ✅ **Top Devices:** Ranked by total usage
- ✅ **Cost Analysis:** Accurate per-device costs

---

## 🎉 **Complete Feature Set**

✅ Multi-device template creation  
✅ Visual device count badge  
✅ Template badge on logs  
✅ Mobile-responsive design  
✅ Consistent color scheme  
✅ Clear toast notifications  
✅ Intuitive user flow  
✅ Dashboard integration  

**Status:** All UI features implemented and ready! 🚀
