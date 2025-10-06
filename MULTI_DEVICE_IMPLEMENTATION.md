# Multi-Device Selection Implementation

## Overview
This implementation adds multi-device selection capabilities to the Mai Home Energy Tracker, allowing users to log energy usage for multiple devices simultaneously with the same time range.

## Phase 1: Multi-Device Selection ✅

### What Was Implemented

#### 1. **Database Migration** (`16-add-device-groups.sql`)
- Created `device_groups` table for storing user-defined device groups
- Added RLS policies for household-level access control
- Includes indexes for performance optimization

#### 2. **Type Definitions** (`types/index.ts`)
- Added `DeviceGroup` interface
- Added `DeviceGroupFormData` interface
- Extended `TemplateFormData` with `device_ids?: string[]`
- Extended `ScheduleFormData` with `device_ids?: string[]`

#### 3. **Multi-Device Selector Component** (`components/MultiDeviceSelector.tsx`)
- Reusable component for selecting multiple devices
- Features:
  - **Search/Filter**: Search devices by name, type, or location
  - **Select All/Clear All**: Quick selection buttons
  - **Device Groups**: Quick-select predefined groups
  - **Visual Feedback**: Shows selected count and total wattage
  - **Save as Group**: Create device groups from current selection
  - **Responsive Design**: Works on mobile and desktop

#### 4. **Device Groups Hook** (`hooks/useDeviceGroups.ts`)
- CRUD operations for device groups
- Functions:
  - `fetchDeviceGroups()`: Load all groups for household
  - `addDeviceGroup()`: Create new group
  - `updateDeviceGroup()`: Update existing group
  - `deleteDeviceGroup()`: Remove group
  - `refreshDeviceGroups()`: Reload groups

#### 5. **Updated Templates Modal** (`components/TemplatesModal.tsx`)
- Added multi-device toggle checkbox
- Integrated `MultiDeviceSelector` component
- When multi-device mode is enabled:
  - Creates separate templates for each selected device
  - Auto-appends device name to template name for clarity
  - Shows success message with count of templates created
- Device groups integration with "Save as Group" functionality

### How It Works

#### Single Device Mode (Default)
1. User selects one device from dropdown
2. Sets time range and assigns users
3. Creates one template

#### Multi-Device Mode
1. User checks "Select multiple devices" checkbox
2. Multi-device selector appears with:
   - Search bar to filter devices
   - Checkboxes for each device
   - Quick select buttons (Select All, Clear All)
   - Device group quick-select buttons
   - Total wattage display
3. User selects multiple devices (e.g., Fan, TV, Computer)
4. Sets time range (applies to all devices)
5. Assigns users (applies to all devices)
6. Submits form
7. System creates **separate templates** for each device:
   - "Evening Routine - Fan"
   - "Evening Routine - TV"
   - "Evening Routine - Computer"

#### Device Groups
1. User selects multiple devices
2. Clicks "Save as Group" button
3. Enters group name (e.g., "Work Setup")
4. Group is saved and appears in quick-select buttons
5. Next time, user can click "Work Setup" to instantly select all devices in that group

### Benefits

✅ **Faster Logging**: Select 5 devices at once instead of creating 5 separate entries
✅ **No Database Changes to Core Tables**: Uses existing structure
✅ **Maintains Individual Device Tracking**: Each device gets its own template/log
✅ **Better Analytics**: Can still track individual device usage
✅ **Device Groups**: Save common combinations for even faster access
✅ **Flexible**: Can switch between single and multi-device modes

## Phase 2: Complete! ✅

### All Components Updated

1. **Recurring Schedules Modal** (`components/RecurringSchedulesModal.tsx`) ✅
   - Added multi-device toggle
   - Integrated MultiDeviceSelector
   - Creates multiple schedules (one per device)
   - Device groups support with "Save as Group"

2. **Energy Logs Form** (`pages/EnergyLogs.tsx`) ✅
   - Added multi-device toggle to main usage form
   - Integrated MultiDeviceSelector
   - Creates multiple logs (one per device) with same time range
   - Device groups support with "Save as Group"
   - Toggle only shows when creating new logs (not when editing)

3. **Templates Modal** (`components/TemplatesModal.tsx`) ✅
   - Added multi-device toggle
   - Integrated MultiDeviceSelector
   - Creates multiple templates (one per device)
   - Device groups support with "Save as Group"

### Device Groups Management UI (Future Enhancement)
- Add "Device Groups" section to Settings page
- Allow users to:
  - View all their device groups
  - Edit group names
  - Add/remove devices from groups
  - Delete groups
  - See which devices are in each group

## Database Schema

```sql
-- device_groups table
CREATE TABLE device_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id),
  group_name TEXT NOT NULL,
  device_ids UUID[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Usage Examples

### Example 1: Morning Routine
**Devices**: Coffee Maker, Toaster, Microwave
**Time**: 7:00 AM - 7:30 AM
**Result**: 3 templates created, can be used together or separately

### Example 2: Work From Home Setup
**Devices**: Computer, Monitor, Desk Lamp, Fan
**Time**: 9:00 AM - 5:00 PM
**Save as Group**: "Work Setup"
**Result**: 4 templates created + 1 device group saved for future use

### Example 3: Entertainment Night
**Devices**: TV, Sound System, Gaming Console
**Time**: 7:00 PM - 11:00 PM
**Save as Group**: "Entertainment"
**Result**: 3 templates created + 1 device group

## Technical Notes

### Type Safety
- Used flexible `DeviceItem` interface in MultiDeviceSelector to handle different Device type definitions
- Maintains compatibility with both DeviceContext and types/index Device interfaces

### Performance
- Device groups table has indexes on `household_id` and `created_by`
- Multi-device selector uses `useMemo` for filtered results
- Efficient batch creation of templates/logs

### Error Handling
- Validates at least one device is selected in multi-device mode
- Toast notifications for all operations
- Graceful fallback if device groups fail to load

## Migration Instructions

1. **Run Database Migration**:
   ```bash
   # Execute 16-add-device-groups.sql in Supabase SQL Editor
   ```

2. **No Code Changes Required for Existing Features**:
   - All existing single-device functionality remains unchanged
   - Multi-device is opt-in via checkbox

3. **Test Multi-Device Flow**:
   - Open Templates modal
   - Check "Select multiple devices"
   - Select 2-3 devices
   - Create template
   - Verify multiple templates are created

## Future Enhancements

1. **Smart Suggestions**: Suggest device groups based on usage patterns
2. **Time Offset**: Allow different start/end times for each device in a group
3. **Bulk Edit**: Edit multiple templates at once
4. **Import/Export**: Share device groups between households
5. **Analytics**: Show which device combinations are used most frequently
