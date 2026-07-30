# 📁 SQL Scripts - Database Setup

This folder contains SQL scripts for Mai Home Energy Tracker database setup and maintenance.

---

## 🗂️ Current Structure

### Active Scripts

| File | Purpose | When to Use |
|------|---------|-------------|
| `1-fresh-database-schema.sql` | Complete database schema (tables, triggers, RLS policies, indexes) | **Always run first** on new/empty database |
| `14-fix-security-warnings.sql` | Security fixes for functions (search_path) | Run on existing database to fix security warnings |
| `53-align-tou-cost-calculator.sql` | Align `calculate_energy_cost` with app TOU-D-PRIME rates; overnight/day boundaries | **Run on existing projects** after the July 2026 cost-hardening release |
| `54-secure-recurring-and-cleanup-rpcs.sql` | Household-scope recurring RPCs; revoke client cleanup | **Run on existing projects** to close cross-tenant RPC gaps |

### Archived Scripts

The `migrations-archive/` folder contains historical debugging and migration files (scripts 2-13). These were used during development and troubleshooting but are not needed for normal setup or maintenance.

---

## 🚀 Quick Setup Guide

### For New Database:

```bash
1. Run: 1-fresh-database-schema.sql
   - Creates all tables, functions, triggers
   - Sets up RLS policies
   - Configures time-of-use rate calculation

2. Run: 53-align-tou-cost-calculator.sql
   - Ensures DB cost calculator matches the app (overnight + season boundaries)

3. Optional: Run 14-fix-security-warnings.sql
   - Fixes Supabase security warnings
   - Adds search_path to functions
```

### For Existing Database (cost hardening):

```bash
Run: 53-align-tou-cost-calculator.sql
```

In Supabase Dashboard → **SQL Editor** → New query → paste the file → **Run**.

### For Existing Database (RPC security hardening):

```bash
Run: 54-secure-recurring-and-cleanup-rpcs.sql
```

Scopes recurring log generation to the caller's household and removes client execute rights on global cleanup.

### For Existing Database with Security Warnings:

```bash
Run: 14-fix-security-warnings.sql
```

---

## 📝 Script Details

### 1️⃣ `1-fresh-database-schema.sql`

**Creates:**
- **Tables:** `users`, `devices`, `energy_logs`, `bill_splits`
- **Function:** `calculate_energy_cost()` - Auto-calculates costs with time-of-use rates
- **Triggers:** Auto-calculate costs on insert/update
- **RLS Policies:** Secure access control (users only see their household data)
- **Indexes:** Performance optimization
- **View:** `data_health_check` - Monitor data integrity

**Time-of-Use Rates:**
- **Summer (June-September):**
  - Weekday: Off-Peak $0.25/kWh, On-Peak $0.55/kWh (4pm-9pm)
  - Weekend: Off-Peak $0.25/kWh, Mid-Peak $0.37/kWh (4pm-9pm)
- **Winter (October-May):**
  - Off-Peak: $0.24/kWh (9pm-8am)
  - Super Off-Peak: $0.24/kWh (8am-4pm)
  - Mid-Peak: $0.52/kWh (4pm-9pm)

---

### 1️⃣4️⃣ `14-fix-security-warnings.sql`

**Fixes:**
- Adds `SET search_path = public, pg_temp` to:
  - `calculate_energy_cost()`
  - `trigger_calculate_energy_cost()`
  - `trigger_set_updated_at()`
- Addresses Supabase "role mutable search_path" security warnings
- No data changes, only function definitions

**When to Run:**
- After seeing security warnings in Supabase Dashboard
- Safe to run multiple times (uses `CREATE OR REPLACE`)
- Does not affect existing data

---

### 5️⃣3️⃣ `53-align-tou-cost-calculator.sql`

**Updates:**
- Replaces `calculate_energy_cost()` with minute-level TOU-D-PRIME math matching `rateCalculatorFixed.ts`
- Handles overnight sessions and day/season boundaries
- Keeps manual bulk entries (`source_type = 'manual'` with pre-set kWh/cost)
- Recalculates timed / template / recurring inserts via the trigger

**When to Run:**
- On every existing Supabase project after deploying the cost-hardening app changes
- Safe to re-run (`CREATE OR REPLACE` + trigger recreate)
- Does **not** rewrite historical rows automatically; new inserts/updates use the aligned rates

**Verify after running:**

```sql
SELECT * FROM calculate_energy_cost(
  1000,           -- 1 kW device
  '17:00'::time,  -- summer weekday on-peak
  '18:00'::time,
  '2026-07-15'::date
);
-- Expect total_cost ≈ 0.55, total_kwh ≈ 1.00
```

---

## 🔧 Common Tasks

### Check Database Status

```sql
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM devices) as devices,
  (SELECT COUNT(*) FROM energy_logs) as logs,
  (SELECT COUNT(*) FROM bill_splits) as bill_splits;
```

### View Data Health

```sql
SELECT * FROM data_health_check;
```

### Recalculate All Energy Log Costs

```sql
-- Trigger will auto-run on update:
UPDATE energy_logs SET updated_at = NOW();
```

### View Cost Summary by User

```sql
SELECT 
  u.name,
  u.email,
  COUNT(el.id) as total_logs,
  ROUND(SUM(el.total_kwh), 2) as total_kwh,
  ROUND(SUM(el.calculated_cost), 2) as total_cost
FROM users u
LEFT JOIN energy_logs el ON u.id = ANY(el.assigned_users)
GROUP BY u.name, u.email
ORDER BY total_cost DESC;
```

---

## 🛡️ Security Features

### Row Level Security (RLS)

- ✅ Enabled on all tables
- ✅ Users can only access their household's data
- ✅ Enforces user authentication
- ✅ Automatic user filtering

### Function Security

- ✅ Functions use `SECURITY DEFINER` for proper permissions
- ✅ `search_path` set to prevent security issues
- ✅ Cost calculation isolated from user input

---

## 🆘 Troubleshooting

### "Permission denied" errors

- Verify RLS policies exist: 
  ```sql
  SELECT * FROM pg_policies WHERE tablename IN ('users', 'devices', 'energy_logs', 'bill_splits');
  ```
- Ensure user is authenticated
- Check user has `household_id` set

### Costs not calculating automatically

- Verify trigger exists:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'energy_logs_calculate_cost';
  ```
- Check device has valid wattage > 0
- Manually trigger recalculation:
  ```sql
  UPDATE energy_logs SET updated_at = NOW() WHERE id = 'LOG_ID';
  ```

### Security warnings in Supabase

- Run `14-fix-security-warnings.sql`
- Enable HaveIBeenPwned in Auth settings
- Enable additional MFA options in Auth settings

### Need to start completely over

```sql
-- Drop all tables (WARNING: Deletes all data!)
DROP TABLE IF EXISTS bill_splits CASCADE;
DROP TABLE IF EXISTS energy_logs CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP VIEW IF EXISTS data_health_check CASCADE;

-- Then run: 1-fresh-database-schema.sql
```

---

## 📚 Additional Features

### Auto-Backup

The app includes browser-based auto-backup:
- Saves to `localStorage` every 10 minutes
- Includes devices, energy logs, and bill splits
- Access from Settings page

### Export/Import

Settings page provides:
- Export all data (JSON)
- Export devices only (CSV/JSON)
- Export energy logs (CSV/JSON)
- Export bill splits (JSON)
- Import from backup file

---

## 💡 Best Practices

1. **Always run script #1 first** on new database
2. **Run script #14** if you see security warnings
3. **Use app's export feature** for regular backups
4. **Test RLS policies** with different users
5. **Monitor** `data_health_check` view periodically
6. **Keep archived scripts** for historical reference

---

## 📦 Archived Migrations

The `migrations-archive/` folder contains:
- Scripts 2-13: Historical fixes and debugging
- Old sample data generators
- Development troubleshooting scripts

These are kept for reference but not needed for normal operation.

---

**Questions?** Check the main documentation in `/docs` or use the app's built-in help features.
