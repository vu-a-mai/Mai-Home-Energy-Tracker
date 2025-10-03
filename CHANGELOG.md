# Changelog

All notable changes to Mai Home Energy Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Logger utility (`utils/logger.ts`) for production-safe logging
  - Development mode: All logs visible
  - Production mode: Only errors visible
  - Prevents sensitive data leaks in production console
- Comprehensive SQL migration documentation in `lib/README.md`
- Security fixes SQL script (`lib/14-fix-security-warnings.sql`)
- Option 3 navigation design (Bold Indicator Bar) with glowing accent
- SQL migrations archive folder for historical debugging files
- Professional Heroicon system replacing all emojis (~320+ icons)
- Comprehensive color-coding system for icons (by function)
- Icon reference guide in `utils/iconReference.ts`
- Device type and location icons (`TagIcon`, `MapPinIcon`) to device cards

### Changed
- **BREAKING**: Removed `supabaseService.ts` (179 lines) - functionality moved to contexts
- **BREAKING**: Removed `BackupRestore.tsx` component - functionality moved to Settings page
- Consolidated rate calculators (`rateCalculator.ts` + `getSeason` → `rateCalculatorFixed.ts`)
- Updated logger in `userService.ts`, `database.ts`, `DeviceContext.tsx`, and `EnergyLogsContext.tsx`
- Reorganized SQL migrations (moved scripts 2-13 to `migrations-archive/`)
- Improved navigation tab styling with multiple design iterations
- Enhanced Dashboard data accuracy by using shared hooks and consistent calculations
- Replaced all emojis with professional Heroicons across all pages
- Implemented consistent color-coding system for icons:
  - 🟦 Blue/Cyan: Information, Data, Users, Filters
  - 🟩 Green: Money, Success, Export, Growth
  - 🟠 Orange: Energy, Power, Logs, Activity
  - 🟣 Purple: Account, Settings, User-specific
  - 🟡 Yellow: Warnings, Folders, Alerts
  - 🔴 Red: Delete, Errors, Critical Actions

### Removed
- Unused `button-new.tsx` component (never imported)
- Old `rateCalculator.ts` (bugs fixed in `rateCalculatorFixed.ts`)
- Outdated test file `deviceManagement.test.tsx` (referenced deleted file)
- Root-level duplicate documentation files
- ~1,350 lines of code removed in cleanup

### Fixed
- Dashboard realtime synchronization - now updates when energy logs change
- Personal Usage Analytics now displays current day/week/month data correctly
- Monthly trend chart restored and implemented with correct calculations
- Personal badge readability with improved amber color and opacity
- Device usage distribution combined with usage list for better UX
- Tooltip text readability in pie charts (fixed black text on dark background)
- Active navigation tab visibility and contrast
- Bill split month extraction to avoid timezone issues (direct string parsing)
- Energy log calculation accuracy by using consistent `calculateUsageCost` function
- RLS policy security warnings in Supabase functions

### Security
- Added logger utility to prevent sensitive data exposure in production
- Fixed `search_path` security warnings in Supabase functions
- Updated function definitions to use `SET search_path = public, pg_temp`
- Documented HaveIBeenPwned and MFA security recommendations

---

## [1.0.0] - 2024-10-03

### Added
- **Core Features**:
  - Energy tracking system with time-of-use rate calculation
  - Device management for household appliances
  - Bill splitting functionality for shared households
  - Real-time dashboard with usage analytics
  - Data backup and restore functionality in Settings page

- **User Interface**:
  - Modern responsive design for desktop, tablet, and mobile
  - Dark theme with emerald/green accent colors
  - Interactive charts and visualizations (Recharts)
  - Calendar-style bill split history view
  - Year filtering for bill split records

- **Authentication & Security**:
  - Supabase Auth integration
  - Row Level Security (RLS) policies
  - Household-based data isolation
  - Protected routes and authentication context

- **Data Management**:
  - Export/import functionality (JSON, CSV)
  - Browser auto-backup every 10 minutes
  - Comprehensive database schema with triggers
  - Automatic cost calculation on energy log changes

### Technical Details

#### Database Schema
- **Tables**: `users`, `devices`, `energy_logs`, `bill_splits`
- **Functions**: `calculate_energy_cost()` for TOU rate calculation
- **Triggers**: Auto-calculate costs on insert/update
- **RLS Policies**: Household-level data security
- **Indexes**: Optimized for common queries

#### Time-of-Use Rates
**Summer (June-September)**:
- Weekday: Off-Peak $0.25/kWh, On-Peak $0.55/kWh (4pm-9pm)
- Weekend: Off-Peak $0.25/kWh, Mid-Peak $0.37/kWh (4pm-9pm)

**Winter (October-May)**:
- Off-Peak: $0.24/kWh (9pm-8am)
- Super Off-Peak: $0.24/kWh (8am-4pm)
- Mid-Peak: $0.52/kWh (4pm-9pm)

#### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Charts**: Recharts
- **State Management**: React Context API
- **Routing**: React Router v6
- **Notifications**: Sonner (toast notifications)

### Pages & Features

#### Dashboard
- Total household usage with kWh and cost
- Individual user breakdown with progress bars
- Weekly usage trend chart (last 7 days)
- Monthly usage trend chart (last 12 months)
- Device usage distribution (pie chart + detailed list)
- Personal usage analytics (daily/weekly/monthly)

#### Devices
- Add/edit/delete household devices
- Device types and locations management
- Wattage to kWh/hour auto-calculation
- Personal vs shared device designation
- Real-time device list updates

#### Energy Logs
- Track device usage with start/end times
- Automatic TOU rate calculation
- Summer/winter season detection
- User assignment for cost splitting
- Edit and delete existing logs
- Comprehensive usage history

#### Bill Split
- Calculate monthly bill splits
- 12-month calendar view
- Year filtering for historical data
- Detailed breakdown by rate period (off-peak, on-peak, mid-peak, super off-peak)
- Individual user cost breakdowns
- Save and view bill split history
- Export bill split data

#### Settings
- Export all data (JSON)
- Export devices (CSV/JSON)
- Export energy logs (CSV/JSON)
- Export bill splits (JSON)
- Import from backup file
- Browser auto-backup management
- Restore functionality

### Development Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Set up Supabase project
4. Run database migrations (see `lib/README.md`)
5. Configure environment variables (`.env.local`)
6. Start development server: `npm run dev`

### Deployment
- Optimized for Vercel deployment
- Environment variables required:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Build command: `npm run build`
- Output directory: `web/dist`

---

## Project Information

### Repository
- **Name**: Mai Home Energy Tracker
- **Purpose**: Track household energy usage, calculate costs with time-of-use rates, and split bills among household members
- **License**: [Your License Here]
- **Author**: [Your Name Here]

### Documentation
- `README.md` - Project overview and getting started
- `docs/` - Detailed documentation and guides
- `lib/README.md` - Database setup and SQL migrations
- `docs/DEPLOYMENT_GUIDE.md` - Deployment instructions
- `docs/TROUBLESHOOTING.md` - Common issues and solutions

### Contributing
[Add contribution guidelines here]

### Support
[Add support information here]

---

**Legend:**
- `Added` - New features
- `Changed` - Changes in existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security improvements or fixes

