# 📁 SQL Scripts - Database Setup

This folder contains all SQL scripts needed to set up your Mai Home Energy Tracker database.

---

## 🗂️ Files Overview

### Core Setup Scripts (Run in Order)

| # | File | Purpose | When to Use |
|---|------|---------|-------------|
| 1 | `1-fresh-database-schema.sql` | Creates all tables, triggers, RLS policies | **Always run first** on empty database |
| 2 | `2-sync-auth-users.sql` | Links Supabase Auth users to database | **Always run second** after creating auth users |
| 3 | `3-add-sample-data.sql` | Adds 8 sample devices + 6 energy logs | Optional: Use for testing/demo |
| 4 | `4-verify-and-troubleshoot.sql` | Health checks and diagnostics | Run anytime to verify database |
| 5 | `5-restore-backup-data.sql` | Restores your 12 devices + 4 energy logs | **Use this to restore your backup** |

---

## 🚀 Quick Setup Guide

### For Fresh Start with Your Backup Data:

```
1. Run: 1-fresh-database-schema.sql
2. Run: 2-sync-auth-users.sql
3. Run: 5-restore-backup-data.sql ⭐
4. Run: 4-verify-and-troubleshoot.sql
```

### For Fresh Start with Sample Data:

```
1. Run: 1-fresh-database-schema.sql
2. Run: 2-sync-auth-users.sql
3. Run: 3-add-sample-data.sql
4. Run: 4-verify-and-troubleshoot.sql
```

---

## 📝 Script Details

### 1️⃣ `1-fresh-database-schema.sql`

**Creates:**
- Tables: `users`, `devices`, `energy_logs`, `bill_splits`
- Function: `calculate_energy_cost()` - Auto-calculates costs with time-of-use rates
- Triggers: Auto-calculate costs on insert/update
- RLS Policies: Secure access control
- Indexes: Performance optimization
- View: `data_health_check` - Monitor data integrity

**Time-of-Use Rates:**
- Off-Peak: $0.082/kWh (weekends, weekday 7pm-7am)
- Mid-Peak: $0.113/kWh (weekday 11am-5pm)
- On-Peak: $0.151/kWh (weekday 7-11am, 5-7pm)

---

### 2️⃣ `2-sync-auth-users.sql`

**Links:**
- Your 4 Supabase Auth users to the database
- Creates a shared household for all users
- Maps auth user IDs to database user records

**Users:**
- vu@maihome.com → Vu Mai
- vy@maihome.com → Vy Mai
- thuy@maihome.com → Thuy Mai
- han@maihome.com → Han Mai

---

### 3️⃣ `3-add-sample-data.sql`

**Creates:**
- 8 devices (2 Teslas, 2 laptops, 4 appliances)
- 6 energy logs with various usage patterns
- Demonstrates different rate periods

**Use Case:**
- Testing the app
- Demo purposes
- Learning how the system works

---

### 4️⃣ `4-verify-and-troubleshoot.sql`

**Checks:**
- User counts and details
- Device counts (shared vs personal)
- Energy log counts and costs
- Data health (orphaned records)
- RLS policy status
- Recent activity
- Cost breakdown by rate period

**Use Case:**
- After setup to verify everything works
- Troubleshooting issues
- Monitoring database health

---

### 5️⃣ `5-restore-backup-data.sql` ⭐

**Restores from backup:**
- 12 devices from your previous database
- 4 energy logs with your actual usage data
- Preserves device IDs for consistency
- Maps old user IDs to new auth user IDs
- Recalculates all costs with new rates

**Your Devices:**
- 2 Tesla EV Chargers (Vu's Model Y, Vy's Model 3)
- 5 Han's devices (Macbook, Monitor, Lamp, Chargers)
- 3 Thuy's devices (Zenbook, Monitor, Oven)
- 2 Shared devices (Samsung TV, Lasko Fan)

**Your Energy Logs:**
- Han Macbook Pro: Oct 1, 2025
- Vu Tesla: Sep 29, 2025 (overnight)
- Thuy Zenbook: Sep 29, 2025 (22 hours)
- Vy Tesla: Sep 29, 2025 (evening)

---

## 🎯 Recommended Setup Path

Since you have a backup file, **use this path:**

1. ✅ Create schema (script #1)
2. ✅ Link auth users (script #2)
3. ⭐ **Restore your backup (script #5)**
4. ✅ Verify everything (script #4)

This gives you all your real devices and data back!

---

## 🔧 Common Tasks

### Check Database Status
```sql
-- Run script #4 or just this query:
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM devices) as devices,
  (SELECT COUNT(*) FROM energy_logs) as logs,
  (SELECT COALESCE(SUM(count), 0) FROM data_health_check) as issues;
```

### Recalculate All Costs
```sql
-- Trigger will auto-run on update:
UPDATE energy_logs SET updated_at = NOW();
```

### View Cost Summary
```sql
SELECT 
  u.name,
  COUNT(el.id) as logs,
  ROUND(SUM(el.total_kwh), 2) as kwh,
  ROUND(SUM(el.calculated_cost), 2) as cost
FROM users u
LEFT JOIN energy_logs el ON u.id = ANY(el.assigned_users)
GROUP BY u.name
ORDER BY cost DESC;
```

---

## 📚 Additional Resources

- **SETUP_INSTRUCTIONS.md** - Detailed step-by-step guide
- **QUICK_START.md** - Fast setup reference
- **FRESH_START_GUIDE.md** - Original setup guide

---

## 💡 Tips

1. **Always run scripts in order** (1 → 2 → 3 or 5 → 4)
2. **Script #4 is your friend** - Run it anytime to check status
3. **Costs auto-calculate** - No manual calculation needed
4. **RLS is enabled** - Users can only see their household data
5. **Backup your data** - The app has export functionality

---

## 🆘 Troubleshooting

### "Permission denied" errors
- Check RLS policies are enabled
- Verify you're logged in as one of the 4 users
- Run script #4 to diagnose

### Costs not calculating
- Check device has valid wattage
- Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'energy_logs_calculate_cost';`
- Try updating the log: `UPDATE energy_logs SET updated_at = NOW() WHERE id = 'LOG_ID';`

### Need to start over
```sql
DROP TABLE IF EXISTS bill_splits CASCADE;
DROP TABLE IF EXISTS energy_logs CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS users CASCADE;
-- Then run scripts 1, 2, and 5 again
```

---

**Questions?** Check the main documentation files or run script #4 for diagnostics.
