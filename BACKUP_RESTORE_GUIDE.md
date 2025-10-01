# Data Backup & Restore Guide

## 🛡️ Protect Your Data from Loss or Corruption

The Mai Home Energy Tracker now includes comprehensive backup and restore functionality to protect your valuable energy tracking data.

---

## 📤 How to Backup Your Data

### **Option 1: Complete JSON Backup (Recommended)**

1. Go to **Energy Logs** page
2. Click **"💾 Backup & Restore"** button
3. Click **"📄 Export Complete Backup (JSON)"**
4. Save the file to a safe location (cloud storage, external drive, etc.)

**What's included:**
- All devices
- All energy logs
- Metadata (counts, date ranges)
- Timestamp of backup

**Use this for:** Full restore capability

---

### **Option 2: CSV Export (For Analysis)**

**Export Energy Logs:**
1. Click **"📊 Export Energy Logs (CSV)"**
2. Open in Excel/Google Sheets for analysis

**Export Devices:**
1. Click **"🔌 Export Devices (CSV)"**
2. View/edit device list in spreadsheet

**Use this for:** Data analysis, reporting, sharing

---

### **Option 3: Auto-Backup (Emergency)**

1. Click **"💾 Create Auto-Backup"**
2. Backup saved to browser's localStorage
3. Available for quick emergency recovery

**Note:** Auto-backup is stored in your browser and will be lost if you clear browser data

---

## 📥 How to Restore Your Data

### **From JSON Backup File:**

1. Go to **Energy Logs** page
2. Click **"💾 Backup & Restore"**
3. Click **"📂 Restore from File"**
4. Select your JSON backup file
5. Review the confirmation dialog:
   - Number of devices to restore
   - Number of energy logs to restore
   - Backup date/time
6. Click **OK** to confirm

**What happens:**
- ✅ Automatic backup created before restore
- ✅ Data validated before import
- ✅ Existing data updated (upsert operation)
- ✅ New data added
- ✅ Page refreshes with restored data

---

### **From Auto-Backup:**

1. Click **"🔄 Restore Auto-Backup"**
2. Review backup info
3. Confirm restore

**When to use:** Emergency recovery if data gets corrupted

---

## 🔒 Safety Features

### **Automatic Protection:**
- ✅ **Pre-restore backup:** Auto-backup created before every restore
- ✅ **Data validation:** Backup files validated before import
- ✅ **Confirmation dialogs:** Must confirm before restoring
- ✅ **Error handling:** Clear error messages if something goes wrong

### **What Gets Backed Up:**
```json
{
  "version": "1.0",
  "timestamp": "2025-09-30T23:00:00.000Z",
  "household_id": "user-id",
  "devices": [...],
  "energyLogs": [...],
  "metadata": {
    "deviceCount": 12,
    "energyLogCount": 145,
    "dateRange": {
      "earliest": "2025-01-01",
      "latest": "2025-09-30"
    }
  }
}
```

---

## 📋 Best Practices

### **Regular Backups:**
- ✅ **Weekly:** Export JSON backup every week
- ✅ **Before major changes:** Backup before bulk operations
- ✅ **After significant data entry:** Backup after logging many entries
- ✅ **Store safely:** Keep backups in cloud storage (Google Drive, Dropbox, etc.)

### **Backup Storage Recommendations:**
1. **Primary:** Cloud storage (Google Drive, OneDrive, iCloud)
2. **Secondary:** External hard drive
3. **Emergency:** Auto-backup in browser

### **File Naming:**
Backups are automatically named with date:
```
mai-energy-backup-2025-09-30.json
energy-logs-2025-09-30.csv
devices-2025-09-30.csv
```

---

## 🚨 Emergency Recovery Scenarios

### **Scenario 1: Accidentally Deleted Data**

1. **Don't panic!** Auto-backup may have your data
2. Click **"🔄 Restore Auto-Backup"**
3. Check if the backup has your data
4. If not, use your latest JSON backup file

---

### **Scenario 2: Database Corruption**

1. Go to **Energy Logs** page
2. Click **"📂 Restore from File"**
3. Select your most recent JSON backup
4. Confirm restore
5. Data will be restored from backup

---

### **Scenario 3: Switching Devices/Browsers**

1. Export JSON backup from old device/browser
2. On new device/browser, go to Energy Logs
3. Click **"📂 Restore from File"**
4. Select the backup file
5. All your data is now on the new device!

---

## ⚠️ Important Notes

### **What Restore Does:**
- ✅ **Upserts data:** Updates existing records, adds new ones
- ✅ **Preserves IDs:** Maintains device and log IDs
- ✅ **Updates timestamps:** Some timestamps may change

### **What Restore Doesn't Do:**
- ❌ **Delete existing data:** Restore adds/updates, doesn't delete
- ❌ **Merge conflicts:** If IDs conflict, newer data wins
- ❌ **Restore bill splits:** Bill splits are separate (not yet included)

### **Limitations:**
- Auto-backup stored in browser (cleared if you clear browser data)
- CSV exports are for analysis only (can't restore from CSV)
- Backup file size depends on data volume

---

## 🔧 Troubleshooting

### **"Invalid backup file" error:**
- Make sure you're uploading a JSON file (not CSV)
- File must be from Mai Energy Tracker
- Check file isn't corrupted

### **"Failed to restore" error:**
- Check your internet connection
- Verify you're logged in
- Try refreshing the page and trying again

### **Auto-backup not found:**
- Auto-backup may have been cleared
- Use your JSON backup file instead
- Create a new auto-backup after restoring

### **Restore seems incomplete:**
- Check the confirmation dialog for counts
- Verify the backup file has all your data
- Try exporting a new backup and comparing

---

## 💡 Pro Tips

1. **Set a reminder:** Backup weekly on the same day
2. **Version control:** Keep multiple backup files with dates
3. **Test restores:** Occasionally test restoring to verify backups work
4. **Before updates:** Always backup before app updates
5. **Share backups:** Email backup to yourself for extra safety

---

## 📊 What's in Each Export Format

### **JSON Backup (Complete):**
- ✅ All device details
- ✅ All energy log details
- ✅ User assignments
- ✅ Calculated costs
- ✅ Timestamps
- ✅ Metadata
- **Use for:** Full restore

### **Energy Logs CSV:**
- ✅ Date, device name, times
- ✅ Duration, energy (kWh), cost
- ✅ Created by, assigned users
- **Use for:** Analysis in Excel

### **Devices CSV:**
- ✅ Name, type, location
- ✅ Wattage, sharing status
- ✅ Created date
- **Use for:** Device inventory

---

## 🎯 Quick Reference

| Action | When to Use | Format |
|--------|-------------|--------|
| Export JSON | Weekly backup | `.json` |
| Export CSV | Data analysis | `.csv` |
| Auto-Backup | Before risky operations | Browser storage |
| Restore JSON | Data loss/corruption | `.json` |
| Restore Auto | Emergency recovery | Browser storage |

---

## ✅ Backup Checklist

- [ ] Export JSON backup weekly
- [ ] Store backup in cloud storage
- [ ] Create auto-backup before bulk operations
- [ ] Test restore occasionally
- [ ] Keep multiple backup versions
- [ ] Backup before app updates

---

**Remember:** Your data is valuable! Regular backups ensure you never lose your energy tracking history.

