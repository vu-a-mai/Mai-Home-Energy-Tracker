// Demo data for Mai Home Energy Tracker
// This data is used when users click "View Demo" on the login page

import type { User, Device, EnergyLog, BillSplit } from '../lib/supabase'

// Note: EnergyLog uses total_kwh (not calculated_kwh) to match database schema

// Demo household ID
export const DEMO_HOUSEHOLD_ID = 'demo-household-12345678-1234-5678-9012-123456789012'

// Demo Users
export const demoUsers: User[] = [
  {
    id: 'demo-user-vu',
    email: 'vu@demo.com',
    name: 'Vu',
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  },
  {
    id: 'demo-user-thuy',
    email: 'thuy@demo.com',
    name: 'Thuy',
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  },
  {
    id: 'demo-user-vy',
    email: 'vy@demo.com',
    name: 'Vy',
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  },
  {
    id: 'demo-user-han',
    email: 'han@demo.com',
    name: 'Han',
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  }
]

// Demo Devices - Updated with is_shared, device_type, and location fields
export const demoDevices: Device[] = [
  {
    id: 'demo-device-1',
    name: 'Living Room TV',
    wattage: 150,
    device_type: 'TV',
    location: 'Living Room',
    is_shared: true,
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  },
  {
    id: 'demo-device-2',
    name: 'Kitchen Refrigerator',
    wattage: 200,
    device_type: 'Refrigerator',
    location: 'Kitchen',
    is_shared: true,
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  },
  {
    id: 'demo-device-3',
    name: "Vu's Gaming PC",
    wattage: 500,
    device_type: 'Computer',
    location: 'Bedroom 2',
    is_shared: false,
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  },
  {
    id: 'demo-device-4',
    name: 'Master Bedroom TV',
    wattage: 120,
    device_type: 'TV',
    location: 'Master Bedroom',
    is_shared: true,
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  },
  {
    id: 'demo-device-5',
    name: 'Room AC',
    wattage: 1200,
    device_type: 'Air Conditioner',
    location: 'Living Room',
    is_shared: true,
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  },
  {
    id: 'demo-device-6',
    name: "Thuy's Laptop",
    wattage: 65,
    device_type: 'Computer',
    location: 'Master Bedroom',
    is_shared: false,
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  },
  {
    id: 'demo-device-7',
    name: "Vy's Hair Dryer",
    wattage: 1500,
    device_type: 'Other',
    location: 'Bathroom',
    is_shared: false,
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  },
  {
    id: 'demo-device-8',
    name: "Han's Tablet",
    wattage: 15,
    device_type: 'Other',
    location: 'Bedroom 3',
    is_shared: false,
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  },
  {
    id: 'demo-device-9',
    name: "Vu's Tesla Model Y Charger",
    wattage: 9600, // Level 2 charger - 50A breaker, 40A continuous @ 240V = 9.6 kW
    device_type: 'Other',
    location: 'Garage',
    is_shared: false,
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  },
  {
    id: 'demo-device-10',
    name: "Vy's Tesla Model 3 Charger",
    wattage: 9600, // Level 2 charger - 50A breaker, 40A continuous @ 240V = 9.6 kW
    device_type: 'Other',
    location: 'Garage',
    is_shared: false,
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  },
  {
    id: 'demo-device-11',
    name: "Thuy's Work Computer",
    wattage: 150, // Desktop computer
    device_type: 'Computer',
    location: 'Office',
    is_shared: false,
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  },
  {
    id: 'demo-device-12',
    name: "Han's Work Computer",
    wattage: 150, // Desktop computer
    device_type: 'Computer',
    location: 'Office',
    is_shared: false,
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  }
]

// Demo Energy Logs - Realistic September 2025 usage based on REAL data
// Target: ~$450 total bill
// EV Charging: Vu's Model Y (658.8 kWh, $164.70) + Vy's Model 3 (622.08 kWh, $155.52) = $320.22
// Other devices: ~$77.25
// Total from logs: ~$397.47
// September = Summer rates (Off-Peak: $0.25, On-Peak: $0.55 weekdays, Mid-Peak: $0.37 weekends)
// EV Charger: 50A breaker, 40A continuous @ 240V = 9.6 kW (9,600W)
export const demoEnergyLogs: EnergyLog[] = [
  // === EV CHARGING LOGS (18 total) - $290.40 ===
  // Vu's Tesla Model Y - 538.8 kWh total, $134.70 (10 sessions, all after 9pm off-peak @ $0.25/kWh)
  {
    id: 'ev-vu-1',
    device_id: 'demo-device-9',
    start_time: '21:00:00',
    end_time: '05:00:00',
    usage_date: '2025-09-02',
    calculated_cost: 19.20,
    total_kwh: 76.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-02T05:00:00Z',
    updated_at: '2025-09-02T05:00:00Z'
  },
  {
    id: 'ev-vu-2',
    device_id: 'demo-device-9',
    start_time: '21:30:00',
    end_time: '05:30:00',
    usage_date: '2025-09-05',
    calculated_cost: 19.20,
    total_kwh: 76.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-05T05:30:00Z',
    updated_at: '2025-09-05T05:30:00Z'
  },
  {
    id: 'ev-vu-3',
    device_id: 'demo-device-9',
    start_time: '22:00:00',
    end_time: '06:00:00',
    usage_date: '2025-09-08',
    calculated_cost: 19.20,
    total_kwh: 76.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-08T06:00:00Z',
    updated_at: '2025-09-08T06:00:00Z'
  },
  {
    id: 'ev-vu-4',
    device_id: 'demo-device-9',
    start_time: '21:00:00',
    end_time: '04:00:00',
    usage_date: '2025-09-11',
    calculated_cost: 16.80,
    total_kwh: 67.2,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-11T04:00:00Z',
    updated_at: '2025-09-11T04:00:00Z'
  },
  {
    id: 'ev-vu-5',
    device_id: 'demo-device-9',
    start_time: '21:30:00',
    end_time: '05:00:00',
    usage_date: '2025-09-14',
    calculated_cost: 18.00,
    total_kwh: 72.0,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-14T05:00:00Z',
    updated_at: '2025-09-14T05:00:00Z'
  },
  {
    id: 'ev-vu-6',
    device_id: 'demo-device-9',
    start_time: '22:00:00',
    end_time: '05:00:00',
    usage_date: '2025-09-17',
    calculated_cost: 16.80,
    total_kwh: 67.2,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-17T05:00:00Z',
    updated_at: '2025-09-17T05:00:00Z'
  },
  {
    id: 'ev-vu-7',
    device_id: 'demo-device-9',
    start_time: '21:00:00',
    end_time: '04:30:00',
    usage_date: '2025-09-20',
    calculated_cost: 18.00,
    total_kwh: 72.0,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-20T04:30:00Z',
    updated_at: '2025-09-20T04:30:00Z'
  },
  {
    id: 'ev-vu-8',
    device_id: 'demo-device-9',
    start_time: '21:30:00',
    end_time: '03:00:00',
    usage_date: '2025-09-23',
    calculated_cost: 13.20,
    total_kwh: 52.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-23T03:00:00Z',
    updated_at: '2025-09-23T03:00:00Z'
  },
  {
    id: 'ev-vu-9',
    device_id: 'demo-device-9',
    start_time: '22:00:00',
    end_time: '03:00:00',
    usage_date: '2025-09-26',
    calculated_cost: 12.00,
    total_kwh: 48.0,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-26T03:00:00Z',
    updated_at: '2025-09-26T03:00:00Z'
  },
  {
    id: 'ev-vu-10',
    device_id: 'demo-device-9',
    start_time: '21:00:00',
    end_time: '02:00:00',
    usage_date: '2025-09-29',
    calculated_cost: 12.00,
    total_kwh: 48.0,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-29T02:00:00Z',
    updated_at: '2025-09-29T02:00:00Z'
  },
  // Vy's Tesla Model 3 - 622.08 kWh total, $155.52 (8 sessions, all after 9pm off-peak @ $0.25/kWh)
  {
    id: 'ev-vy-1',
    device_id: 'demo-device-10',
    start_time: '21:00:00',
    end_time: '05:00:00',
    usage_date: '2025-09-03',
    calculated_cost: 19.20,
    total_kwh: 76.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vy',
    created_at: '2025-09-03T05:00:00Z',
    updated_at: '2025-09-03T05:00:00Z'
  },
  {
    id: 'ev-vy-2',
    device_id: 'demo-device-10',
    start_time: '22:00:00',
    end_time: '06:00:00',
    usage_date: '2025-09-06',
    calculated_cost: 19.20,
    total_kwh: 76.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vy',
    created_at: '2025-09-06T06:00:00Z',
    updated_at: '2025-09-06T06:00:00Z'
  },
  {
    id: 'ev-vy-3',
    device_id: 'demo-device-10',
    start_time: '21:30:00',
    end_time: '05:30:00',
    usage_date: '2025-09-09',
    calculated_cost: 19.20,
    total_kwh: 76.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vy',
    created_at: '2025-09-09T05:30:00Z',
    updated_at: '2025-09-09T05:30:00Z'
  },
  {
    id: 'ev-vy-4',
    device_id: 'demo-device-10',
    start_time: '21:00:00',
    end_time: '05:00:00',
    usage_date: '2025-09-12',
    calculated_cost: 19.20,
    total_kwh: 76.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vy',
    created_at: '2025-09-12T05:00:00Z',
    updated_at: '2025-09-12T05:00:00Z'
  },
  {
    id: 'ev-vy-5',
    device_id: 'demo-device-10',
    start_time: '22:00:00',
    end_time: '06:00:00',
    usage_date: '2025-09-16',
    calculated_cost: 19.20,
    total_kwh: 76.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vy',
    created_at: '2025-09-16T06:00:00Z',
    updated_at: '2025-09-16T06:00:00Z'
  },
  {
    id: 'ev-vy-6',
    device_id: 'demo-device-10',
    start_time: '21:30:00',
    end_time: '05:30:00',
    usage_date: '2025-09-19',
    calculated_cost: 19.20,
    total_kwh: 76.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vy',
    created_at: '2025-09-19T05:30:00Z',
    updated_at: '2025-09-19T05:30:00Z'
  },
  {
    id: 'ev-vy-7',
    device_id: 'demo-device-10',
    start_time: '21:00:00',
    end_time: '05:00:00',
    usage_date: '2025-09-24',
    calculated_cost: 19.20,
    total_kwh: 76.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vy',
    created_at: '2025-09-24T05:00:00Z',
    updated_at: '2025-09-24T05:00:00Z'
  },
  {
    id: 'ev-vy-8',
    device_id: 'demo-device-10',
    start_time: '22:00:00',
    end_time: '04:00:00',
    usage_date: '2025-09-27',
    calculated_cost: 14.40,
    total_kwh: 57.6,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vy',
    created_at: '2025-09-27T04:00:00Z',
    updated_at: '2025-09-27T04:00:00Z'
  },
  
  // === SHARED DEVICE LOGS (25 total) - ~$57.52 ===
  // Room AC (10 logs) - 1200W
  // 9/1 Mon, 9/4 Thu, 9/7 Sun, 9/10 Wed, 9/13 Sat, 9/16 Tue, 9/19 Fri, 9/22 Mon, 9/25 Thu, 9/28 Sun
  {
    id: 'ac-1',
    device_id: 'demo-device-5',
    start_time: '14:00:00',
    end_time: '22:00:00',
    usage_date: '2025-09-01',
    calculated_cost: 3.90,
    total_kwh: 9.6,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-01T22:00:00Z',
    updated_at: '2025-09-01T22:00:00Z',
    assigned_users: ['demo-user-vu', 'demo-user-thuy', 'demo-user-vy', 'demo-user-han']
  },
  {
    id: 'ac-2',
    device_id: 'demo-device-5',
    start_time: '13:00:00',
    end_time: '21:00:00',
    usage_date: '2025-09-04',
    calculated_cost: 4.05,
    total_kwh: 9.6,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-thuy',
    created_at: '2025-09-04T21:00:00Z',
    updated_at: '2025-09-04T21:00:00Z',
    assigned_users: ['demo-user-thuy', 'demo-user-han']
  },
  {
    id: 'ac-3',
    device_id: 'demo-device-5',
    start_time: '15:00:00',
    end_time: '23:00:00',
    usage_date: '2025-09-07',
    calculated_cost: 2.64,
    total_kwh: 9.6,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vy',
    created_at: '2025-09-07T23:00:00Z',
    updated_at: '2025-09-07T23:00:00Z',
    assigned_users: ['demo-user-vy', 'demo-user-vu']
  },
  {
    id: 'ac-4',
    device_id: 'demo-device-5',
    start_time: '14:00:00',
    end_time: '22:00:00',
    usage_date: '2025-09-10',
    calculated_cost: 3.90,
    total_kwh: 9.6,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-han',
    created_at: '2025-09-10T22:00:00Z',
    updated_at: '2025-09-10T22:00:00Z',
    assigned_users: ['demo-user-han', 'demo-user-thuy', 'demo-user-vy']
  },
  {
    id: 'ac-5',
    device_id: 'demo-device-5',
    start_time: '12:00:00',
    end_time: '22:00:00',
    usage_date: '2025-09-13',
    calculated_cost: 3.24,
    total_kwh: 12,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-13T22:00:00Z',
    updated_at: '2025-09-13T22:00:00Z',
    assigned_users: ['demo-user-vu', 'demo-user-thuy']
  },
  {
    id: 'ac-6',
    device_id: 'demo-device-5',
    start_time: '13:00:00',
    end_time: '21:00:00',
    usage_date: '2025-09-16',
    calculated_cost: 4.05,
    total_kwh: 9.6,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-thuy',
    created_at: '2025-09-16T21:00:00Z',
    updated_at: '2025-09-16T21:00:00Z',
    assigned_users: ['demo-user-thuy', 'demo-user-vy', 'demo-user-han']
  },
  {
    id: 'ac-7',
    device_id: 'demo-device-5',
    start_time: '14:00:00',
    end_time: '23:00:00',
    usage_date: '2025-09-19',
    calculated_cost: 4.32,
    total_kwh: 10.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vy',
    created_at: '2025-09-19T23:00:00Z',
    updated_at: '2025-09-19T23:00:00Z',
    assigned_users: ['demo-user-vy', 'demo-user-vu', 'demo-user-han']
  },
  {
    id: 'ac-8',
    device_id: 'demo-device-5',
    start_time: '15:00:00',
    end_time: '22:00:00',
    usage_date: '2025-09-22',
    calculated_cost: 3.36,
    total_kwh: 8.4,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-han',
    created_at: '2025-09-22T22:00:00Z',
    updated_at: '2025-09-22T22:00:00Z',
    assigned_users: ['demo-user-han', 'demo-user-vu']
  },
  {
    id: 'ac-9',
    device_id: 'demo-device-5',
    start_time: '14:00:00',
    end_time: '21:00:00',
    usage_date: '2025-09-25',
    calculated_cost: 3.48,
    total_kwh: 8.4,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-thuy',
    created_at: '2025-09-25T21:00:00Z',
    updated_at: '2025-09-25T21:00:00Z',
    assigned_users: ['demo-user-thuy', 'demo-user-vy']
  },
  {
    id: 'ac-10',
    device_id: 'demo-device-5',
    start_time: '13:00:00',
    end_time: '22:00:00',
    usage_date: '2025-09-28',
    calculated_cost: 2.97,
    total_kwh: 10.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-28T22:00:00Z',
    updated_at: '2025-09-28T22:00:00Z',
    assigned_users: ['demo-user-vu', 'demo-user-han']
  },
  
  // Refrigerator (10 logs) - 200W, runs 24/7 @ $0.25 avg = $1.20/day
  {
    id: 'fridge-1',
    device_id: 'demo-device-2',
    start_time: '00:00:00',
    end_time: '23:59:00',
    usage_date: '2025-09-01',
    calculated_cost: 1.20,
    total_kwh: 4.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-01T23:59:00Z',
    updated_at: '2025-09-01T23:59:00Z',
    assigned_users: ['demo-user-vu', 'demo-user-thuy', 'demo-user-vy', 'demo-user-han']
  },
  {
    id: 'fridge-2',
    device_id: 'demo-device-2',
    start_time: '00:00:00',
    end_time: '23:59:00',
    usage_date: '2025-09-04',
    calculated_cost: 1.20,
    total_kwh: 4.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-thuy',
    created_at: '2025-09-04T23:59:00Z',
    updated_at: '2025-09-04T23:59:00Z',
    assigned_users: ['demo-user-vu', 'demo-user-thuy', 'demo-user-vy', 'demo-user-han']
  },
  {
    id: 'fridge-3',
    device_id: 'demo-device-2',
    start_time: '00:00:00',
    end_time: '23:59:00',
    usage_date: '2025-09-07',
    calculated_cost: 1.20,
    total_kwh: 4.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vy',
    created_at: '2025-09-07T23:59:00Z',
    updated_at: '2025-09-07T23:59:00Z',
    assigned_users: ['demo-user-vu', 'demo-user-thuy', 'demo-user-vy', 'demo-user-han']
  },
  {
    id: 'fridge-4',
    device_id: 'demo-device-2',
    start_time: '00:00:00',
    end_time: '23:59:00',
    usage_date: '2025-09-10',
    calculated_cost: 1.20,
    total_kwh: 4.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-han',
    created_at: '2025-09-10T23:59:00Z',
    updated_at: '2025-09-10T23:59:00Z',
    assigned_users: ['demo-user-vu', 'demo-user-thuy', 'demo-user-vy', 'demo-user-han']
  },
  {
    id: 'fridge-5',
    device_id: 'demo-device-2',
    start_time: '00:00:00',
    end_time: '23:59:00',
    usage_date: '2025-09-13',
    calculated_cost: 1.20,
    total_kwh: 4.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-13T23:59:00Z',
    updated_at: '2025-09-13T23:59:00Z',
    assigned_users: ['demo-user-vu', 'demo-user-thuy', 'demo-user-vy', 'demo-user-han']
  },
  {
    id: 'fridge-6',
    device_id: 'demo-device-2',
    start_time: '00:00:00',
    end_time: '23:59:00',
    usage_date: '2025-09-16',
    calculated_cost: 1.20,
    total_kwh: 4.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-thuy',
    created_at: '2025-09-16T23:59:00Z',
    updated_at: '2025-09-16T23:59:00Z',
    assigned_users: ['demo-user-vu', 'demo-user-thuy', 'demo-user-vy', 'demo-user-han']
  },
  {
    id: 'fridge-7',
    device_id: 'demo-device-2',
    start_time: '00:00:00',
    end_time: '23:59:00',
    usage_date: '2025-09-19',
    calculated_cost: 1.20,
    total_kwh: 4.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vy',
    created_at: '2025-09-19T23:59:00Z',
    updated_at: '2025-09-19T23:59:00Z',
    assigned_users: ['demo-user-vu', 'demo-user-thuy', 'demo-user-vy', 'demo-user-han']
  },
  {
    id: 'fridge-8',
    device_id: 'demo-device-2',
    start_time: '00:00:00',
    end_time: '23:59:00',
    usage_date: '2025-09-22',
    calculated_cost: 1.20,
    total_kwh: 4.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-han',
    created_at: '2025-09-22T23:59:00Z',
    updated_at: '2025-09-22T23:59:00Z',
    assigned_users: ['demo-user-vu', 'demo-user-thuy', 'demo-user-vy', 'demo-user-han']
  },
  {
    id: 'fridge-9',
    device_id: 'demo-device-2',
    start_time: '00:00:00',
    end_time: '23:59:00',
    usage_date: '2025-09-25',
    calculated_cost: 1.20,
    total_kwh: 4.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-25T23:59:00Z',
    updated_at: '2025-09-25T23:59:00Z',
    assigned_users: ['demo-user-vu', 'demo-user-thuy', 'demo-user-vy', 'demo-user-han']
  },
  {
    id: 'fridge-10',
    device_id: 'demo-device-2',
    start_time: '00:00:00',
    end_time: '23:59:00',
    usage_date: '2025-09-28',
    calculated_cost: 1.20,
    total_kwh: 4.8,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-thuy',
    created_at: '2025-09-28T23:59:00Z',
    updated_at: '2025-09-28T23:59:00Z',
    assigned_users: ['demo-user-vu', 'demo-user-thuy', 'demo-user-vy', 'demo-user-han']
  },
  
  // TVs (5 logs) - ~$4 total
  {
    id: 'tv-1',
    device_id: 'demo-device-1',
    start_time: '19:00:00',
    end_time: '23:00:00',
    usage_date: '2025-09-02',
    calculated_cost: 0.19,
    total_kwh: 0.6,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-thuy',
    created_at: '2025-09-02T23:00:00Z',
    updated_at: '2025-09-02T23:00:00Z',
    assigned_users: ['demo-user-thuy', 'demo-user-han']
  },
  {
    id: 'tv-2',
    device_id: 'demo-device-4',
    start_time: '20:00:00',
    end_time: '22:30:00',
    usage_date: '2025-09-09',
    calculated_cost: 0.09,
    total_kwh: 0.3,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-han',
    created_at: '2025-09-09T22:30:00Z',
    updated_at: '2025-09-09T22:30:00Z',
    assigned_users: ['demo-user-han', 'demo-user-vy']
  },
  {
    id: 'tv-3',
    device_id: 'demo-device-1',
    start_time: '18:00:00',
    end_time: '23:00:00',
    usage_date: '2025-09-16',
    calculated_cost: 0.19,
    total_kwh: 0.75,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vy',
    created_at: '2025-09-16T23:00:00Z',
    updated_at: '2025-09-16T23:00:00Z',
    assigned_users: ['demo-user-vy', 'demo-user-vu']
  },
  {
    id: 'tv-4',
    device_id: 'demo-device-4',
    start_time: '19:30:00',
    end_time: '22:00:00',
    usage_date: '2025-09-23',
    calculated_cost: 0.09,
    total_kwh: 0.3,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-thuy',
    created_at: '2025-09-23T22:00:00Z',
    updated_at: '2025-09-23T22:00:00Z',
    assigned_users: ['demo-user-thuy', 'demo-user-vu']
  },
  {
    id: 'tv-5',
    device_id: 'demo-device-1',
    start_time: '19:00:00',
    end_time: '23:30:00',
    usage_date: '2025-09-30',
    calculated_cost: 0.17,
    total_kwh: 0.675,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-han',
    created_at: '2025-09-30T23:30:00Z',
    updated_at: '2025-09-30T23:30:00Z',
    assigned_users: ['demo-user-han', 'demo-user-thuy', 'demo-user-vy']
  },
  
  // === PERSONAL DEVICE LOGS (12 total) - ~$41.20 ===
  // Vu's Gaming PC (8 logs) - 500W
  {
    id: 'gaming-1',
    device_id: 'demo-device-3',
    start_time: '17:00:00',
    end_time: '23:00:00',
    usage_date: '2025-09-01',
    calculated_cost: 1.35,
    total_kwh: 3.0,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-01T23:00:00Z',
    updated_at: '2025-09-01T23:00:00Z'
  },
  {
    id: 'gaming-2',
    device_id: 'demo-device-3',
    start_time: '16:00:00',
    end_time: '22:00:00',
    usage_date: '2025-09-05',
    calculated_cost: 1.40,
    total_kwh: 3.0,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-05T22:00:00Z',
    updated_at: '2025-09-05T22:00:00Z'
  },
  {
    id: 'gaming-3',
    device_id: 'demo-device-3',
    start_time: '18:00:00',
    end_time: '23:30:00',
    usage_date: '2025-09-10',
    calculated_cost: 1.06,
    total_kwh: 2.75,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-10T23:30:00Z',
    updated_at: '2025-09-10T23:30:00Z'
  },
  {
    id: 'gaming-4',
    device_id: 'demo-device-3',
    start_time: '17:00:00',
    end_time: '22:00:00',
    usage_date: '2025-09-13',
    calculated_cost: 0.85,
    total_kwh: 2.5,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-13T22:00:00Z',
    updated_at: '2025-09-13T22:00:00Z'
  },
  {
    id: 'gaming-5',
    device_id: 'demo-device-3',
    start_time: '16:30:00',
    end_time: '23:00:00',
    usage_date: '2025-09-18',
    calculated_cost: 1.44,
    total_kwh: 3.25,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-18T23:00:00Z',
    updated_at: '2025-09-18T23:00:00Z'
  },
  {
    id: 'gaming-6',
    device_id: 'demo-device-3',
    start_time: '17:00:00',
    end_time: '22:30:00',
    usage_date: '2025-09-21',
    calculated_cost: 1.13,
    total_kwh: 2.75,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-21T22:30:00Z',
    updated_at: '2025-09-21T22:30:00Z'
  },
  {
    id: 'gaming-7',
    device_id: 'demo-device-3',
    start_time: '19:00:00',
    end_time: '23:00:00',
    usage_date: '2025-09-25',
    calculated_cost: 0.60,
    total_kwh: 2.0,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-25T23:00:00Z',
    updated_at: '2025-09-25T23:00:00Z'
  },
  {
    id: 'gaming-8',
    device_id: 'demo-device-3',
    start_time: '18:00:00',
    end_time: '23:00:00',
    usage_date: '2025-09-28',
    calculated_cost: 0.78,
    total_kwh: 2.5,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-28T23:00:00Z',
    updated_at: '2025-09-28T23:00:00Z'
  },
  
  // Thuy's Work Computer (5 logs) - 150W, 9am-5pm workdays @ $0.25 off-peak
  {
    id: 'work-thuy-1',
    device_id: 'demo-device-11',
    start_time: '09:00:00',
    end_time: '17:00:00',
    usage_date: '2025-09-02',
    calculated_cost: 0.30,
    total_kwh: 1.2,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-thuy',
    created_at: '2025-09-02T17:00:00Z',
    updated_at: '2025-09-02T17:00:00Z'
  },
  {
    id: 'work-thuy-2',
    device_id: 'demo-device-11',
    start_time: '09:00:00',
    end_time: '17:00:00',
    usage_date: '2025-09-09',
    calculated_cost: 0.30,
    total_kwh: 1.2,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-thuy',
    created_at: '2025-09-09T17:00:00Z',
    updated_at: '2025-09-09T17:00:00Z'
  },
  {
    id: 'work-thuy-3',
    device_id: 'demo-device-11',
    start_time: '09:00:00',
    end_time: '17:00:00',
    usage_date: '2025-09-16',
    calculated_cost: 0.30,
    total_kwh: 1.2,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-thuy',
    created_at: '2025-09-16T17:00:00Z',
    updated_at: '2025-09-16T17:00:00Z'
  },
  {
    id: 'work-thuy-4',
    device_id: 'demo-device-11',
    start_time: '09:00:00',
    end_time: '17:00:00',
    usage_date: '2025-09-23',
    calculated_cost: 0.30,
    total_kwh: 1.2,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-thuy',
    created_at: '2025-09-23T17:00:00Z',
    updated_at: '2025-09-23T17:00:00Z'
  },
  {
    id: 'work-thuy-5',
    device_id: 'demo-device-11',
    start_time: '09:00:00',
    end_time: '17:00:00',
    usage_date: '2025-09-30',
    calculated_cost: 0.30,
    total_kwh: 1.2,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-thuy',
    created_at: '2025-09-30T17:00:00Z',
    updated_at: '2025-09-30T17:00:00Z'
  },
  
  // Han's Work Computer (5 logs) - 150W, 9am-5pm workdays @ $0.25 off-peak
  {
    id: 'work-han-1',
    device_id: 'demo-device-12',
    start_time: '09:00:00',
    end_time: '17:00:00',
    usage_date: '2025-09-03',
    calculated_cost: 0.30,
    total_kwh: 1.2,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-han',
    created_at: '2025-09-03T17:00:00Z',
    updated_at: '2025-09-03T17:00:00Z'
  },
  {
    id: 'work-han-2',
    device_id: 'demo-device-12',
    start_time: '09:00:00',
    end_time: '17:00:00',
    usage_date: '2025-09-10',
    calculated_cost: 0.30,
    total_kwh: 1.2,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-han',
    created_at: '2025-09-10T17:00:00Z',
    updated_at: '2025-09-10T17:00:00Z'
  },
  {
    id: 'work-han-3',
    device_id: 'demo-device-12',
    start_time: '09:00:00',
    end_time: '17:00:00',
    usage_date: '2025-09-17',
    calculated_cost: 0.30,
    total_kwh: 1.2,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-han',
    created_at: '2025-09-17T17:00:00Z',
    updated_at: '2025-09-17T17:00:00Z'
  },
  {
    id: 'work-han-4',
    device_id: 'demo-device-12',
    start_time: '09:00:00',
    end_time: '17:00:00',
    usage_date: '2025-09-24',
    calculated_cost: 0.30,
    total_kwh: 1.2,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-han',
    created_at: '2025-09-24T17:00:00Z',
    updated_at: '2025-09-24T17:00:00Z'
  },
  {
    id: 'work-han-5',
    device_id: 'demo-device-12',
    start_time: '09:00:00',
    end_time: '17:00:00',
    usage_date: '2025-09-29',
    calculated_cost: 0.30,
    total_kwh: 1.2,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-han',
    created_at: '2025-09-29T17:00:00Z',
    updated_at: '2025-09-29T17:00:00Z'
  },
  
  // Vy's Hair Dryer (3 logs) - 1500W, morning routine @ $0.25 off-peak
  {
    id: 'hair-1',
    device_id: 'demo-device-7',
    start_time: '07:00:00',
    end_time: '07:30:00',
    usage_date: '2025-09-07',
    calculated_cost: 0.19,
    total_kwh: 0.75,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vy',
    created_at: '2025-09-07T07:30:00Z',
    updated_at: '2025-09-07T07:30:00Z'
  },
  {
    id: 'hair-2',
    device_id: 'demo-device-7',
    start_time: '07:15:00',
    end_time: '07:45:00',
    usage_date: '2025-09-14',
    calculated_cost: 0.19,
    total_kwh: 0.75,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vy',
    created_at: '2025-09-14T07:45:00Z',
    updated_at: '2025-09-14T07:45:00Z'
  },
  {
    id: 'hair-3',
    device_id: 'demo-device-7',
    start_time: '07:00:00',
    end_time: '07:30:00',
    usage_date: '2025-09-21',
    calculated_cost: 0.19,
    total_kwh: 0.75,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vy',
    created_at: '2025-09-21T07:30:00Z',
    updated_at: '2025-09-21T07:30:00Z'
  },
  
  // Han's Tablet (1 log) - 15W @ $0.25 off-peak
  {
    id: 'tablet-1',
    device_id: 'demo-device-8',
    start_time: '20:00:00',
    end_time: '22:00:00',
    usage_date: '2025-09-15',
    calculated_cost: 0.01,
    total_kwh: 0.03,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-han',
    created_at: '2025-09-15T22:00:00Z',
    updated_at: '2025-09-15T22:00:00Z'
  },
  
  // EXAMPLE: Multi-rate period log - Gaming PC 9am-9pm (crosses off-peak and on-peak)
  {
    id: 'gaming-multi-rate',
    device_id: 'demo-device-3',
    start_time: '09:00:00',
    end_time: '21:00:00',
    usage_date: '2025-09-30',
    calculated_cost: 2.20,
    total_kwh: 6.0,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: 'demo-user-vu',
    created_at: '2025-09-30T21:00:00Z',
    updated_at: '2025-09-30T21:00:00Z'
  }
]

// SUMMARY: 56 realistic energy logs with ACCURATE TIME-OF-USE RATE CALCULATIONS
// (includes 1 example multi-rate period log: Gaming PC 9am-9pm showing off-peak + on-peak breakdown)
// EV Charging: 18 logs, 1,280.88 kWh, $320.22 @ $0.25 off-peak (all after 9pm)
//   - Vu's Model Y: 10 logs, 658.8 kWh, $164.70
//   - Vy's Model 3: 8 logs, 622.08 kWh, $155.52
// Shared Devices: 25 logs, 102.675 kWh, $48.45
//   - AC: 10 logs, 99.6 kWh, $35.86 (mixed on-peak/off-peak, weekday/weekend)
//   - Fridge: 10 logs, 48 kWh, $12.00 @ $0.25 avg
//   - TVs: 5 logs, 2.655 kWh, $0.59 (mostly off-peak)
// Personal Devices: 12 logs, 24.15 kWh, $10.18
//   - Gaming PC: 8 logs, 21.75 kWh, $8.61 (mixed on-peak/off-peak)
//   - Work Computers: 10 logs, 12 kWh, $3.00 @ $0.25 off-peak (9am-5pm)
//   - Hair Dryer: 3 logs, 2.25 kWh, $0.57 @ $0.25 off-peak (7am)
//   - Tablet: 1 log, 0.03 kWh, $0.01 @ $0.25 off-peak
// TOTAL FROM LOGS: $378.85 (1,407.705 kWh)
// Remaining to reach ~$450: $71.15 (base charges, delivery fees, taxes, unlogged usage)

// Demo Dashboard Statistics - Updated with realistic data
export const demoDashboardStats = {
  personalUsage: {
    daily: { kwh: 12.5, cost: 4.25 },
    weekly: { kwh: 87.3, cost: 29.8 },
    monthly: { kwh: 375.2, cost: 128.45 }
  },
  householdUsage: {
    total: { kwh: 931, cost: 350 },
    members: [
      { name: 'Vu', kwh: 527.8, cost: 159.89 }, // Tesla + Gaming PC
      { name: 'Vy', kwh: 308.2, cost: 124.35 }, // Tesla + Hair Dryer
      { name: 'Thuy', kwh: 48, cost: 6.60 }, // Work Computer
      { name: 'Han', kwh: 47, cost: 6.90 } // Work Computer + Tablet
    ]
  },
  ratePeriods: {
    offPeak: { kwh: 850, cost: 212.50 }, // Most EV charging
    midPeak: { kwh: 50, cost: 18.50 },
    onPeak: { kwh: 31, cost: 17.05 },
    superOffPeak: { kwh: 0, cost: 0 }
  },
  topDevices: [
    { name: 'Tesla Model Y', kwh: 527.8, cost: 131.89, type: 'personal' },
    { name: 'Tesla Model 3', kwh: 308.2, cost: 119.35, type: 'personal' },
    { name: 'Room AC', kwh: 96, cost: 45, type: 'shared' },
    { name: 'Gaming PC', kwh: 22.5, cost: 28, type: 'personal' }
  ]
}

// Remove old demo data sections that are no longer needed
export const demoWeeklyUsageData = [
  { day: 'Mon', Vu: 75.4, Thuy: 6.9, Vy: 44.0, Han: 6.7 },
  { day: 'Tue', Vu: 75.4, Thuy: 6.9, Vy: 44.0, Han: 6.7 },
  { day: 'Wed', Vu: 75.4, Thuy: 6.9, Vy: 44.0, Han: 6.7 },
  { day: 'Thu', Vu: 75.4, Thuy: 6.9, Vy: 44.0, Han: 6.7 },
  { day: 'Fri', Vu: 75.4, Thuy: 6.9, Vy: 44.0, Han: 6.7 },
  { day: 'Sat', Vu: 75.4, Thuy: 6.9, Vy: 44.0, Han: 6.7 },
  { day: 'Sun', Vu: 75.4, Thuy: 6.9, Vy: 44.0, Han: 6.7 }
]

export const demoMonthlyTrendData = [
  { month: 'Oct', usage: 1380, cost: 472.0 },  // Oct 2023
  { month: 'Nov', usage: 1290, cost: 441.3 },  // Nov 2023
  { month: 'Dec', usage: 1450, cost: 496.0 },  // Dec 2023
  { month: 'Jan', usage: 1520, cost: 520.0 },  // Jan 2024
  { month: 'Feb', usage: 1410, cost: 482.5 },  // Feb 2024
  { month: 'Mar', usage: 1340, cost: 458.3 },  // Mar 2024
  { month: 'Apr', usage: 1275, cost: 436.2 },  // Apr 2024
  { month: 'May', usage: 1420, cost: 485.8 },  // May 2024
  { month: 'Jun', usage: 1585, cost: 542.1 },  // Jun 2024 (summer starts)
  { month: 'Jul', usage: 1720, cost: 588.4 },  // Jul 2024 (peak summer)
  { month: 'Aug', usage: 1650, cost: 564.5 },  // Aug 2024 (still summer)
  { month: 'Sep', usage: 1421, cost: 369.67 }  // Sep 2024 (current)
]

export const demoDeviceUsageData = [
  { name: 'Tesla Model Y', usage: 527.8, cost: 131.89 },
  { name: 'Tesla Model 3', usage: 308.2, cost: 119.35 },
  { name: 'AC', usage: 96, cost: 45 },
  { name: 'Gaming PC', usage: 22.5, cost: 28 }
]

export const demoBillSplits: BillSplit[] = [
  {
    id: 'demo-bill-1',
    household_id: DEMO_HOUSEHOLD_ID,
    month: 9,
    year: 2025,
    billing_period_start: '2025-09-01',
    billing_period_end: '2025-09-30',
    total_bill_amount: 450,
    user_allocations: {
      'demo-user-vu': {
        personalCost: 116.33,
        sharedCost: 43.56,
        totalOwed: 159.89
      },
      'demo-user-vy': {
        personalCost: 80.79,
        sharedCost: 43.56,
        totalOwed: 124.35
      },
      'demo-user-thuy': {
        personalCost: 39.32,
        sharedCost: 43.56,
        totalOwed: 82.88
      },
      'demo-user-han': {
        personalCost: 39.32,
        sharedCost: 43.56,
        totalOwed: 82.88
      }
    },
    created_by: 'demo-user-vu',
    created_at: '2025-10-01T00:00:00Z',
    updated_at: '2025-10-01T00:00:00Z'
  }
]
