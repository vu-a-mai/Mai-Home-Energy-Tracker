/**
 * Mai Energy Tracker - Heroicons Reference Guide
 * 
 * Complete list of available Heroicons for the application
 * All icons from @heroicons/react/24/outline
 * 
 * Usage:
 *   import { BoltIcon, CalendarIcon } from '@heroicons/react/24/outline'
 *   <BoltIcon className="w-5 h-5 text-primary" />
 */

// ⚡ ENERGY & POWER
export const ENERGY_ICONS = {
  BoltIcon: 'Lightning bolt - Main energy icon, power indicators',
  BoltSlashIcon: 'No power - Inactive devices, power off states',
}

// 📅 TIME & CALENDAR
export const TIME_ICONS = {
  CalendarIcon: 'Calendar - Date selection, scheduling',
  ClockIcon: 'Clock - Time indicators, duration',
  CalendarDaysIcon: 'Calendar with days - Multi-day periods, weekly views',
}

// 💰 MONEY & COST
export const MONEY_ICONS = {
  CurrencyDollarIcon: 'Dollar sign - Costs, billing, payments',
  BanknotesIcon: 'Money bills - Total costs, large amounts',
}

// ✏️ ACTIONS
export const ACTION_ICONS = {
  PlusIcon: 'Plus - Add new items, create actions',
  PencilIcon: 'Pencil - Edit, modify items',
  TrashIcon: 'Trash - Delete, remove items',
  ArrowDownTrayIcon: 'Download - Export data, save files',
  ArrowUpTrayIcon: 'Upload - Import data, load files',
  CheckCircleIcon: 'Check - Success, confirm, complete',
  XCircleIcon: 'X circle - Cancel, error, close',
}

// ⚠️ STATUS & ALERTS
export const STATUS_ICONS = {
  ExclamationTriangleIcon: 'Warning triangle - Alerts, warnings, high usage',
  CheckCircleIcon: 'Success - Completed actions, verified',
  XCircleIcon: 'Error - Failed actions, cancelled',
}

// 📊 DATA & CHARTS
export const CHART_ICONS = {
  ChartBarIcon: 'Bar chart - Usage statistics, comparisons',
  ChartPieIcon: 'Pie chart - Distribution, percentages',
  ArrowTrendingUpIcon: 'Trending up - Increasing usage, growth',
  ArrowTrendingDownIcon: 'Trending down - Decreasing usage, savings',
}

// 👥 USERS
export const USER_ICONS = {
  UserIcon: 'Single user - Individual profile, personal',
  UsersIcon: 'Multiple users - Group, shared',
  UserGroupIcon: 'User group - Household, team',
  UserCircleIcon: 'User avatar - Profile picture, account',
}

// 🏠 HOME & DEVICES
export const HOME_DEVICE_ICONS = {
  HomeIcon: 'House - Home, household summary',
  CpuChipIcon: 'Chip - Devices, electronics, tech',
  ComputerDesktopIcon: 'Desktop - Computers, workstations',
  DevicePhoneMobileIcon: 'Mobile - Phones, portable devices',
}

// 🛠️ SETTINGS & CONFIG
export const SETTINGS_ICONS = {
  Cog6ToothIcon: 'Settings gear - Configuration, preferences',
  AdjustmentsHorizontalIcon: 'Sliders - Adjustments, filters',
}

// 🗂️ DATA & STORAGE
export const DATA_ICONS = {
  CircleStackIcon: 'Database - Data storage, backups',
  FolderArrowDownIcon: 'Folder download - Save data',
  DocumentIcon: 'Document - Files, reports',
  ClipboardDocumentListIcon: 'Clipboard list - Logs, records',
}

// 🧭 NAVIGATION
export const NAVIGATION_ICONS = {
  Bars3Icon: 'Hamburger menu - Mobile navigation',
  XMarkIcon: 'X mark - Close, exit',
  ArrowRightOnRectangleIcon: 'Logout - Sign out, exit',
}

/**
 * USAGE EXAMPLES BY PAGE
 */

export const PAGE_USAGE_GUIDE = {
  Dashboard: [
    'HomeIcon - Total household usage',
    'UserGroupIcon - Personal analytics',
    'CpuChipIcon - Device analysis',
    'ChartBarIcon - Weekly trends',
    'ArrowTrendingUpIcon - Monthly trends',
    'ChartPieIcon - Usage distribution',
    'BoltIcon - Energy indicators',
  ],
  
  Devices: [
    'CpuChipIcon - Page header',
    'PlusIcon - Add new device',
    'PencilIcon - Edit device',
    'TrashIcon - Delete device',
    'CheckCircleIcon - Save changes',
    'BoltIcon - Power indicators',
    'ComputerDesktopIcon - Device types',
  ],
  
  EnergyLogs: [
    'ClipboardDocumentListIcon - Page header',
    'PlusIcon - Add new log',
    'PencilIcon - Edit log',
    'TrashIcon - Delete log',
    'CalendarIcon - Date selection',
    'ClockIcon - Time selection',
    'BoltIcon - Energy usage',
    'ExclamationTriangleIcon - High usage warning',
  ],
  
  BillSplit: [
    'CurrencyDollarIcon - Page header',
    'UsersIcon - User assignments',
    'ChartBarIcon - Usage breakdown',
    'CalendarIcon - Billing periods',
    'BanknotesIcon - Total costs',
  ],
  
  Settings: [
    'Cog6ToothIcon - Page header',
    'ArrowDownTrayIcon - Export data',
    'ArrowUpTrayIcon - Import data',
    'CircleStackIcon - Backup storage',
  ],
  
  Navigation: [
    'BoltIcon - App logo',
    'ChartBarIcon - Dashboard link',
    'CpuChipIcon - Devices link',
    'ClipboardDocumentListIcon - Logs link',
    'CurrencyDollarIcon - Bill Split link',
    'Cog6ToothIcon - Settings link',
    'ArrowRightOnRectangleIcon - Logout',
    'Bars3Icon/XMarkIcon - Mobile menu',
  ],
}

/**
 * COLOR SCHEME RECOMMENDATIONS
 */

export const COLOR_RECOMMENDATIONS = {
  primary: 'text-primary (emerald/green) - Main actions, active states',
  success: 'text-green-400 - Success states, positive trends',
  warning: 'text-yellow-400 - Warnings, mid-peak rates',
  danger: 'text-red-400 - Errors, high costs, delete actions',
  info: 'text-blue-400 - Information, neutral states',
  muted: 'text-muted-foreground - Secondary information',
}

/**
 * SIZE RECOMMENDATIONS
 */

export const SIZE_GUIDE = {
  'w-3 h-3': 'Extra small - Inline badges, small buttons',
  'w-4 h-4': 'Small - Button icons, compact UI',
  'w-5 h-5': 'Medium - Standard button icons, cards',
  'w-6 h-6': 'Large - Section headers, prominent icons',
  'w-7 h-7': 'Extra large - Page headers',
  'w-8 h-8': 'Huge - Main logo, hero sections',
}

export default {
  ENERGY_ICONS,
  TIME_ICONS,
  MONEY_ICONS,
  ACTION_ICONS,
  STATUS_ICONS,
  CHART_ICONS,
  USER_ICONS,
  HOME_DEVICE_ICONS,
  SETTINGS_ICONS,
  DATA_ICONS,
  NAVIGATION_ICONS,
  PAGE_USAGE_GUIDE,
  COLOR_RECOMMENDATIONS,
  SIZE_GUIDE,
}

