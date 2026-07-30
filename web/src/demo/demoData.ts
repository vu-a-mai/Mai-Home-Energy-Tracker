/**
 * Isolated fictional demo household: the Park family.
 * Distinct from any real Supabase household data.
 * Dated for June–July 2026 so Dashboard "This Month" / Bill Split current period are populated.
 */
import type { User, Device, EnergyLog, BillSplit } from '../lib/supabase'
import type { EnergyLogTemplate, RecurringSchedule, DeviceGroup } from '../types'

export const DEMO_HOUSEHOLD_ID = "demo-hh-park-family-0001"
export const DEMO_CURRENT_USER_ID = "demo-user-alex"

export const demoUsers: User[] = [
  {
    "id": "demo-user-alex",
    "email": "alex@park-demo.example",
    "name": "Alex",
    "household_id": "demo-hh-park-family-0001",
    "household_role": "owner",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": "demo-user-mia",
    "email": "mia@park-demo.example",
    "name": "Mia",
    "household_id": "demo-hh-park-family-0001",
    "household_role": "editor",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": "demo-user-noah",
    "email": "noah@park-demo.example",
    "name": "Noah",
    "household_id": "demo-hh-park-family-0001",
    "household_role": "editor",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": "demo-user-sofia",
    "email": "sofia@park-demo.example",
    "name": "Sofia",
    "household_id": "demo-hh-park-family-0001",
    "household_role": "viewer",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
]

export const demoDevices: Device[] = [
  {
    "id": "demo-dev-living-tv",
    "name": "Living Room TV",
    "wattage": 120,
    "device_type": "TV",
    "location": "Living Room",
    "is_shared": true,
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": "demo-dev-fridge",
    "name": "Kitchen Fridge",
    "wattage": 180,
    "device_type": "Refrigerator",
    "location": "Kitchen",
    "is_shared": true,
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": "demo-dev-washer",
    "name": "Washer",
    "wattage": 500,
    "device_type": "Washing Machine",
    "location": "Laundry Room",
    "is_shared": true,
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": "demo-dev-dryer",
    "name": "Dryer",
    "wattage": 3000,
    "device_type": "Dryer",
    "location": "Laundry Room",
    "is_shared": true,
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": "demo-dev-dishwasher",
    "name": "Dishwasher",
    "wattage": 1800,
    "device_type": "Dishwasher",
    "location": "Kitchen",
    "is_shared": true,
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": "demo-dev-heatpump",
    "name": "Whole-Home Heat Pump",
    "wattage": 2500,
    "device_type": "Air Conditioner",
    "location": "Utility Room",
    "is_shared": true,
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": "demo-dev-alex-pc",
    "name": "Alex's Desktop PC",
    "wattage": 450,
    "device_type": "Computer",
    "location": "Office",
    "is_shared": false,
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": "demo-dev-mia-laptop",
    "name": "Mia's Laptop",
    "wattage": 65,
    "device_type": "Laptop",
    "location": "Office",
    "is_shared": false,
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": "demo-dev-noah-console",
    "name": "Noah's Game Console",
    "wattage": 200,
    "device_type": "Gaming Console",
    "location": "Bedroom 2",
    "is_shared": false,
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-noah",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": "demo-dev-sofia-lamp",
    "name": "Sofia's Desk Lamp",
    "wattage": 40,
    "device_type": "Light",
    "location": "Bedroom 3",
    "is_shared": false,
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-sofia",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": "demo-dev-alex-ev",
    "name": "Alex's EV Charger",
    "wattage": 7200,
    "device_type": "EV Charger",
    "location": "Garage",
    "is_shared": false,
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": "demo-dev-coffee",
    "name": "Espresso Machine",
    "wattage": 1000,
    "device_type": "Coffee Maker",
    "location": "Kitchen",
    "is_shared": true,
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
]

/** 101 usage logs across June–July 2026 (summer TOU). Totals ~328.5 kWh / $140.89 tracked. */
export const demoEnergyLogs: EnergyLog[] = [
  {
    "id": "jul-hp-1",
    "device_id": "demo-dev-heatpump",
    "start_time": "17:00:00",
    "end_time": "21:00:00",
    "usage_date": "2026-07-01",
    "calculated_cost": 5.5,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.55,
        "cost": 5.5,
        "startTime": "17:00",
        "endTime": "21:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-01T21:00:00Z",
    "updated_at": "2026-07-01T21:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-pc-1",
    "device_id": "demo-dev-alex-pc",
    "start_time": "19:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-07-01",
    "calculated_cost": 0.72,
    "total_kwh": 1.8,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 2,
        "kwh": 0.91,
        "rate": 0.55,
        "cost": 0.5,
        "startTime": "19:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-01T23:00:00Z",
    "updated_at": "2026-07-01T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-mia-1",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-07-01",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-01T17:00:00Z",
    "updated_at": "2026-07-01T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jul-fridge-1",
    "device_id": "demo-dev-fridge",
    "start_time": "00:00:00",
    "end_time": "23:59:00",
    "usage_date": "2026-07-01",
    "calculated_cost": 1.35,
    "total_kwh": 4.32,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 19,
        "kwh": 3.42,
        "rate": 0.25,
        "cost": 0.85,
        "startTime": "00:00",
        "endTime": "23:59"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 5,
        "kwh": 0.9,
        "rate": 0.55,
        "cost": 0.49,
        "startTime": "16:01",
        "endTime": "21:01"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-01T23:59:00Z",
    "updated_at": "2026-07-01T23:59:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-mia-2",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-07-02",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-02T17:00:00Z",
    "updated_at": "2026-07-02T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jul-tv-2",
    "device_id": "demo-dev-living-tv",
    "start_time": "19:30:00",
    "end_time": "22:00:00",
    "usage_date": "2026-07-02",
    "calculated_cost": 0.13,
    "total_kwh": 0.3,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1.5,
        "kwh": 0.18,
        "rate": 0.55,
        "cost": 0.1,
        "startTime": "19:30",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 1,
        "kwh": 0.12,
        "rate": 0.25,
        "cost": 0.03,
        "startTime": "21:01",
        "endTime": "22:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-02T22:00:00Z",
    "updated_at": "2026-07-02T22:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-coffee-2",
    "device_id": "demo-dev-coffee",
    "start_time": "07:00:00",
    "end_time": "07:20:00",
    "usage_date": "2026-07-02",
    "calculated_cost": 0.08,
    "total_kwh": 0.33,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.3,
        "kwh": 0.33,
        "rate": 0.25,
        "cost": 0.08,
        "startTime": "07:00",
        "endTime": "07:20"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-02T07:20:00Z",
    "updated_at": "2026-07-02T07:20:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia"
    ],
    "source_type": "template",
    "source_id": "demo-tmpl-coffee"
  },
  {
    "id": "jul-ev-2",
    "device_id": "demo-dev-alex-ev",
    "start_time": "22:00:00",
    "end_time": "05:00:00",
    "usage_date": "2026-07-02",
    "calculated_cost": 12.6,
    "total_kwh": 50.4,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 50.4,
        "rate": 0.25,
        "cost": 12.6,
        "startTime": "22:00",
        "endTime": "05:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-02T05:00:00Z",
    "updated_at": "2026-07-02T05:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-hp-3",
    "device_id": "demo-dev-heatpump",
    "start_time": "17:00:00",
    "end_time": "21:00:00",
    "usage_date": "2026-07-03",
    "calculated_cost": 5.5,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.55,
        "cost": 5.5,
        "startTime": "17:00",
        "endTime": "21:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-03T21:00:00Z",
    "updated_at": "2026-07-03T21:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-pc-3",
    "device_id": "demo-dev-alex-pc",
    "start_time": "19:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-07-03",
    "calculated_cost": 0.72,
    "total_kwh": 1.8,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 2,
        "kwh": 0.91,
        "rate": 0.55,
        "cost": 0.5,
        "startTime": "19:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-03T23:00:00Z",
    "updated_at": "2026-07-03T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-mia-3",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-07-03",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-03T17:00:00Z",
    "updated_at": "2026-07-03T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jul-sofia-3",
    "device_id": "demo-dev-sofia-lamp",
    "start_time": "20:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-07-03",
    "calculated_cost": 0.04,
    "total_kwh": 0.12,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.04,
        "rate": 0.55,
        "cost": 0.02,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.08,
        "rate": 0.25,
        "cost": 0.02,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-sofia",
    "created_at": "2026-07-03T23:00:00Z",
    "updated_at": "2026-07-03T23:00:00Z",
    "assigned_users": [
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-dw-3",
    "device_id": "demo-dev-dishwasher",
    "start_time": "20:00:00",
    "end_time": "21:30:00",
    "usage_date": "2026-07-03",
    "calculated_cost": 1.22,
    "total_kwh": 2.7,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 1.83,
        "rate": 0.55,
        "cost": 1.01,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.5,
        "kwh": 0.87,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "21:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-03T21:30:00Z",
    "updated_at": "2026-07-03T21:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-hp-5",
    "device_id": "demo-dev-heatpump",
    "start_time": "17:00:00",
    "end_time": "21:00:00",
    "usage_date": "2026-07-05",
    "calculated_cost": 3.7,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "Mid-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.37,
        "cost": 3.7,
        "startTime": "17:00",
        "endTime": "21:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-05T21:00:00Z",
    "updated_at": "2026-07-05T21:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-pc-5",
    "device_id": "demo-dev-alex-pc",
    "start_time": "19:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-07-05",
    "calculated_cost": 0.56,
    "total_kwh": 1.8,
    "rate_breakdown": [
      {
        "ratePeriod": "Mid-Peak",
        "hours": 2,
        "kwh": 0.91,
        "rate": 0.37,
        "cost": 0.34,
        "startTime": "19:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-05T23:00:00Z",
    "updated_at": "2026-07-05T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-noah-5",
    "device_id": "demo-dev-noah-console",
    "start_time": "14:00:00",
    "end_time": "18:00:00",
    "usage_date": "2026-07-05",
    "calculated_cost": 0.25,
    "total_kwh": 0.8,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.4,
        "rate": 0.25,
        "cost": 0.1,
        "startTime": "14:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "Mid-Peak",
        "hours": 2,
        "kwh": 0.4,
        "rate": 0.37,
        "cost": 0.15,
        "startTime": "16:01",
        "endTime": "18:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-noah",
    "created_at": "2026-07-05T18:00:00Z",
    "updated_at": "2026-07-05T18:00:00Z",
    "assigned_users": [
      "demo-user-noah"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-hp-7",
    "device_id": "demo-dev-heatpump",
    "start_time": "17:00:00",
    "end_time": "21:00:00",
    "usage_date": "2026-07-07",
    "calculated_cost": 5.5,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.55,
        "cost": 5.5,
        "startTime": "17:00",
        "endTime": "21:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-07T21:00:00Z",
    "updated_at": "2026-07-07T21:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-mia-7",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-07-07",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-07T17:00:00Z",
    "updated_at": "2026-07-07T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jul-tv-7",
    "device_id": "demo-dev-living-tv",
    "start_time": "19:30:00",
    "end_time": "22:00:00",
    "usage_date": "2026-07-07",
    "calculated_cost": 0.13,
    "total_kwh": 0.3,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1.5,
        "kwh": 0.18,
        "rate": 0.55,
        "cost": 0.1,
        "startTime": "19:30",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 1,
        "kwh": 0.12,
        "rate": 0.25,
        "cost": 0.03,
        "startTime": "21:01",
        "endTime": "22:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-07T22:00:00Z",
    "updated_at": "2026-07-07T22:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-pc-8",
    "device_id": "demo-dev-alex-pc",
    "start_time": "19:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-07-08",
    "calculated_cost": 0.72,
    "total_kwh": 1.8,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 2,
        "kwh": 0.91,
        "rate": 0.55,
        "cost": 0.5,
        "startTime": "19:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-08T23:00:00Z",
    "updated_at": "2026-07-08T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-mia-8",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-07-08",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-08T17:00:00Z",
    "updated_at": "2026-07-08T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jul-dw-8",
    "device_id": "demo-dev-dishwasher",
    "start_time": "20:00:00",
    "end_time": "21:30:00",
    "usage_date": "2026-07-08",
    "calculated_cost": 1.22,
    "total_kwh": 2.7,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 1.83,
        "rate": 0.55,
        "cost": 1.01,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.5,
        "kwh": 0.87,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "21:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-08T21:30:00Z",
    "updated_at": "2026-07-08T21:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-coffee-8",
    "device_id": "demo-dev-coffee",
    "start_time": "07:00:00",
    "end_time": "07:20:00",
    "usage_date": "2026-07-08",
    "calculated_cost": 0.08,
    "total_kwh": 0.33,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.3,
        "kwh": 0.33,
        "rate": 0.25,
        "cost": 0.08,
        "startTime": "07:00",
        "endTime": "07:20"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-08T07:20:00Z",
    "updated_at": "2026-07-08T07:20:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia"
    ],
    "source_type": "template",
    "source_id": "demo-tmpl-coffee"
  },
  {
    "id": "jul-fridge-8",
    "device_id": "demo-dev-fridge",
    "start_time": "00:00:00",
    "end_time": "23:59:00",
    "usage_date": "2026-07-08",
    "calculated_cost": 1.35,
    "total_kwh": 4.32,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 19,
        "kwh": 3.42,
        "rate": 0.25,
        "cost": 0.85,
        "startTime": "00:00",
        "endTime": "23:59"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 5,
        "kwh": 0.9,
        "rate": 0.55,
        "cost": 0.49,
        "startTime": "16:01",
        "endTime": "21:01"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-08T23:59:00Z",
    "updated_at": "2026-07-08T23:59:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-pc-10",
    "device_id": "demo-dev-alex-pc",
    "start_time": "19:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-07-10",
    "calculated_cost": 0.72,
    "total_kwh": 1.8,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 2,
        "kwh": 0.91,
        "rate": 0.55,
        "cost": 0.5,
        "startTime": "19:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-10T23:00:00Z",
    "updated_at": "2026-07-10T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-mia-10",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-07-10",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-10T17:00:00Z",
    "updated_at": "2026-07-10T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jul-coffee-10",
    "device_id": "demo-dev-coffee",
    "start_time": "07:00:00",
    "end_time": "07:20:00",
    "usage_date": "2026-07-10",
    "calculated_cost": 0.08,
    "total_kwh": 0.33,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.3,
        "kwh": 0.33,
        "rate": 0.25,
        "cost": 0.08,
        "startTime": "07:00",
        "endTime": "07:20"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-10T07:20:00Z",
    "updated_at": "2026-07-10T07:20:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia"
    ],
    "source_type": "template",
    "source_id": "demo-tmpl-coffee"
  },
  {
    "id": "jul-noah-12",
    "device_id": "demo-dev-noah-console",
    "start_time": "14:00:00",
    "end_time": "18:00:00",
    "usage_date": "2026-07-12",
    "calculated_cost": 0.25,
    "total_kwh": 0.8,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.4,
        "rate": 0.25,
        "cost": 0.1,
        "startTime": "14:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "Mid-Peak",
        "hours": 2,
        "kwh": 0.4,
        "rate": 0.37,
        "cost": 0.15,
        "startTime": "16:01",
        "endTime": "18:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-noah",
    "created_at": "2026-07-12T18:00:00Z",
    "updated_at": "2026-07-12T18:00:00Z",
    "assigned_users": [
      "demo-user-noah"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-sofia-12",
    "device_id": "demo-dev-sofia-lamp",
    "start_time": "20:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-07-12",
    "calculated_cost": 0.03,
    "total_kwh": 0.12,
    "rate_breakdown": [
      {
        "ratePeriod": "Mid-Peak",
        "hours": 1,
        "kwh": 0.04,
        "rate": 0.37,
        "cost": 0.02,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.08,
        "rate": 0.25,
        "cost": 0.02,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-sofia",
    "created_at": "2026-07-12T23:00:00Z",
    "updated_at": "2026-07-12T23:00:00Z",
    "assigned_users": [
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-tv-12",
    "device_id": "demo-dev-living-tv",
    "start_time": "19:30:00",
    "end_time": "22:00:00",
    "usage_date": "2026-07-12",
    "calculated_cost": 0.1,
    "total_kwh": 0.3,
    "rate_breakdown": [
      {
        "ratePeriod": "Mid-Peak",
        "hours": 1.5,
        "kwh": 0.18,
        "rate": 0.37,
        "cost": 0.07,
        "startTime": "19:30",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 1,
        "kwh": 0.12,
        "rate": 0.25,
        "cost": 0.03,
        "startTime": "21:01",
        "endTime": "22:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-12T22:00:00Z",
    "updated_at": "2026-07-12T22:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-coffee-12",
    "device_id": "demo-dev-coffee",
    "start_time": "07:00:00",
    "end_time": "07:20:00",
    "usage_date": "2026-07-12",
    "calculated_cost": 0.08,
    "total_kwh": 0.33,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.3,
        "kwh": 0.33,
        "rate": 0.25,
        "cost": 0.08,
        "startTime": "07:00",
        "endTime": "07:20"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-12T07:20:00Z",
    "updated_at": "2026-07-12T07:20:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia"
    ],
    "source_type": "template",
    "source_id": "demo-tmpl-coffee"
  },
  {
    "id": "jul-pc-14",
    "device_id": "demo-dev-alex-pc",
    "start_time": "19:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-07-14",
    "calculated_cost": 0.72,
    "total_kwh": 1.8,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 2,
        "kwh": 0.91,
        "rate": 0.55,
        "cost": 0.5,
        "startTime": "19:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-14T23:00:00Z",
    "updated_at": "2026-07-14T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-mia-14",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-07-14",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-14T17:00:00Z",
    "updated_at": "2026-07-14T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jul-dw-14",
    "device_id": "demo-dev-dishwasher",
    "start_time": "20:00:00",
    "end_time": "21:30:00",
    "usage_date": "2026-07-14",
    "calculated_cost": 1.22,
    "total_kwh": 2.7,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 1.83,
        "rate": 0.55,
        "cost": 1.01,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.5,
        "kwh": 0.87,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "21:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-14T21:30:00Z",
    "updated_at": "2026-07-14T21:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-coffee-14",
    "device_id": "demo-dev-coffee",
    "start_time": "07:00:00",
    "end_time": "07:20:00",
    "usage_date": "2026-07-14",
    "calculated_cost": 0.08,
    "total_kwh": 0.33,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.3,
        "kwh": 0.33,
        "rate": 0.25,
        "cost": 0.08,
        "startTime": "07:00",
        "endTime": "07:20"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-14T07:20:00Z",
    "updated_at": "2026-07-14T07:20:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia"
    ],
    "source_type": "template",
    "source_id": "demo-tmpl-coffee"
  },
  {
    "id": "jul-hp-15",
    "device_id": "demo-dev-heatpump",
    "start_time": "17:00:00",
    "end_time": "21:00:00",
    "usage_date": "2026-07-15",
    "calculated_cost": 5.5,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.55,
        "cost": 5.5,
        "startTime": "17:00",
        "endTime": "21:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-15T21:00:00Z",
    "updated_at": "2026-07-15T21:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-mia-15",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-07-15",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-15T17:00:00Z",
    "updated_at": "2026-07-15T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jul-sofia-15",
    "device_id": "demo-dev-sofia-lamp",
    "start_time": "20:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-07-15",
    "calculated_cost": 0.04,
    "total_kwh": 0.12,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.04,
        "rate": 0.55,
        "cost": 0.02,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.08,
        "rate": 0.25,
        "cost": 0.02,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-sofia",
    "created_at": "2026-07-15T23:00:00Z",
    "updated_at": "2026-07-15T23:00:00Z",
    "assigned_users": [
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-tv-15",
    "device_id": "demo-dev-living-tv",
    "start_time": "19:30:00",
    "end_time": "22:00:00",
    "usage_date": "2026-07-15",
    "calculated_cost": 0.13,
    "total_kwh": 0.3,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1.5,
        "kwh": 0.18,
        "rate": 0.55,
        "cost": 0.1,
        "startTime": "19:30",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 1,
        "kwh": 0.12,
        "rate": 0.25,
        "cost": 0.03,
        "startTime": "21:01",
        "endTime": "22:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-15T22:00:00Z",
    "updated_at": "2026-07-15T22:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-fridge-15",
    "device_id": "demo-dev-fridge",
    "start_time": "00:00:00",
    "end_time": "23:59:00",
    "usage_date": "2026-07-15",
    "calculated_cost": 1.35,
    "total_kwh": 4.32,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 19,
        "kwh": 3.42,
        "rate": 0.25,
        "cost": 0.85,
        "startTime": "00:00",
        "endTime": "23:59"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 5,
        "kwh": 0.9,
        "rate": 0.55,
        "cost": 0.49,
        "startTime": "16:01",
        "endTime": "21:01"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-15T23:59:00Z",
    "updated_at": "2026-07-15T23:59:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-hp-17",
    "device_id": "demo-dev-heatpump",
    "start_time": "17:00:00",
    "end_time": "21:00:00",
    "usage_date": "2026-07-17",
    "calculated_cost": 5.5,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.55,
        "cost": 5.5,
        "startTime": "17:00",
        "endTime": "21:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-17T21:00:00Z",
    "updated_at": "2026-07-17T21:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-pc-17",
    "device_id": "demo-dev-alex-pc",
    "start_time": "19:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-07-17",
    "calculated_cost": 0.72,
    "total_kwh": 1.8,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 2,
        "kwh": 0.91,
        "rate": 0.55,
        "cost": 0.5,
        "startTime": "19:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-17T23:00:00Z",
    "updated_at": "2026-07-17T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-mia-17",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-07-17",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-17T17:00:00Z",
    "updated_at": "2026-07-17T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jul-hp-19",
    "device_id": "demo-dev-heatpump",
    "start_time": "17:00:00",
    "end_time": "21:00:00",
    "usage_date": "2026-07-19",
    "calculated_cost": 3.7,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "Mid-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.37,
        "cost": 3.7,
        "startTime": "17:00",
        "endTime": "21:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-19T21:00:00Z",
    "updated_at": "2026-07-19T21:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-noah-19",
    "device_id": "demo-dev-noah-console",
    "start_time": "14:00:00",
    "end_time": "18:00:00",
    "usage_date": "2026-07-19",
    "calculated_cost": 0.25,
    "total_kwh": 0.8,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.4,
        "rate": 0.25,
        "cost": 0.1,
        "startTime": "14:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "Mid-Peak",
        "hours": 2,
        "kwh": 0.4,
        "rate": 0.37,
        "cost": 0.15,
        "startTime": "16:01",
        "endTime": "18:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-noah",
    "created_at": "2026-07-19T18:00:00Z",
    "updated_at": "2026-07-19T18:00:00Z",
    "assigned_users": [
      "demo-user-noah"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-tv-19",
    "device_id": "demo-dev-living-tv",
    "start_time": "19:30:00",
    "end_time": "22:00:00",
    "usage_date": "2026-07-19",
    "calculated_cost": 0.1,
    "total_kwh": 0.3,
    "rate_breakdown": [
      {
        "ratePeriod": "Mid-Peak",
        "hours": 1.5,
        "kwh": 0.18,
        "rate": 0.37,
        "cost": 0.07,
        "startTime": "19:30",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 1,
        "kwh": 0.12,
        "rate": 0.25,
        "cost": 0.03,
        "startTime": "21:01",
        "endTime": "22:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-19T22:00:00Z",
    "updated_at": "2026-07-19T22:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-hp-21",
    "device_id": "demo-dev-heatpump",
    "start_time": "17:00:00",
    "end_time": "21:00:00",
    "usage_date": "2026-07-21",
    "calculated_cost": 5.5,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.55,
        "cost": 5.5,
        "startTime": "17:00",
        "endTime": "21:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-21T21:00:00Z",
    "updated_at": "2026-07-21T21:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-pc-21",
    "device_id": "demo-dev-alex-pc",
    "start_time": "19:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-07-21",
    "calculated_cost": 0.72,
    "total_kwh": 1.8,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 2,
        "kwh": 0.91,
        "rate": 0.55,
        "cost": 0.5,
        "startTime": "19:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-21T23:00:00Z",
    "updated_at": "2026-07-21T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-mia-21",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-07-21",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-21T17:00:00Z",
    "updated_at": "2026-07-21T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jul-sofia-21",
    "device_id": "demo-dev-sofia-lamp",
    "start_time": "20:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-07-21",
    "calculated_cost": 0.04,
    "total_kwh": 0.12,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.04,
        "rate": 0.55,
        "cost": 0.02,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.08,
        "rate": 0.25,
        "cost": 0.02,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-sofia",
    "created_at": "2026-07-21T23:00:00Z",
    "updated_at": "2026-07-21T23:00:00Z",
    "assigned_users": [
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-dw-21",
    "device_id": "demo-dev-dishwasher",
    "start_time": "20:00:00",
    "end_time": "21:30:00",
    "usage_date": "2026-07-21",
    "calculated_cost": 1.22,
    "total_kwh": 2.7,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 1.83,
        "rate": 0.55,
        "cost": 1.01,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.5,
        "kwh": 0.87,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "21:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-21T21:30:00Z",
    "updated_at": "2026-07-21T21:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-mia-22",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-07-22",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-22T17:00:00Z",
    "updated_at": "2026-07-22T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jul-tv-22",
    "device_id": "demo-dev-living-tv",
    "start_time": "19:30:00",
    "end_time": "22:00:00",
    "usage_date": "2026-07-22",
    "calculated_cost": 0.13,
    "total_kwh": 0.3,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1.5,
        "kwh": 0.18,
        "rate": 0.55,
        "cost": 0.1,
        "startTime": "19:30",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 1,
        "kwh": 0.12,
        "rate": 0.25,
        "cost": 0.03,
        "startTime": "21:01",
        "endTime": "22:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-22T22:00:00Z",
    "updated_at": "2026-07-22T22:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-coffee-22",
    "device_id": "demo-dev-coffee",
    "start_time": "07:00:00",
    "end_time": "07:20:00",
    "usage_date": "2026-07-22",
    "calculated_cost": 0.08,
    "total_kwh": 0.33,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.3,
        "kwh": 0.33,
        "rate": 0.25,
        "cost": 0.08,
        "startTime": "07:00",
        "endTime": "07:20"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-22T07:20:00Z",
    "updated_at": "2026-07-22T07:20:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia"
    ],
    "source_type": "template",
    "source_id": "demo-tmpl-coffee"
  },
  {
    "id": "jul-fridge-22",
    "device_id": "demo-dev-fridge",
    "start_time": "00:00:00",
    "end_time": "23:59:00",
    "usage_date": "2026-07-22",
    "calculated_cost": 1.35,
    "total_kwh": 4.32,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 19,
        "kwh": 3.42,
        "rate": 0.25,
        "cost": 0.85,
        "startTime": "00:00",
        "endTime": "23:59"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 5,
        "kwh": 0.9,
        "rate": 0.55,
        "cost": 0.49,
        "startTime": "16:01",
        "endTime": "21:01"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-22T23:59:00Z",
    "updated_at": "2026-07-22T23:59:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-pc-24",
    "device_id": "demo-dev-alex-pc",
    "start_time": "19:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-07-24",
    "calculated_cost": 0.72,
    "total_kwh": 1.8,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 2,
        "kwh": 0.91,
        "rate": 0.55,
        "cost": 0.5,
        "startTime": "19:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-24T23:00:00Z",
    "updated_at": "2026-07-24T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-mia-24",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-07-24",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-24T17:00:00Z",
    "updated_at": "2026-07-24T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jul-sofia-24",
    "device_id": "demo-dev-sofia-lamp",
    "start_time": "20:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-07-24",
    "calculated_cost": 0.04,
    "total_kwh": 0.12,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.04,
        "rate": 0.55,
        "cost": 0.02,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.08,
        "rate": 0.25,
        "cost": 0.02,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-sofia",
    "created_at": "2026-07-24T23:00:00Z",
    "updated_at": "2026-07-24T23:00:00Z",
    "assigned_users": [
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-coffee-24",
    "device_id": "demo-dev-coffee",
    "start_time": "07:00:00",
    "end_time": "07:20:00",
    "usage_date": "2026-07-24",
    "calculated_cost": 0.08,
    "total_kwh": 0.33,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.3,
        "kwh": 0.33,
        "rate": 0.25,
        "cost": 0.08,
        "startTime": "07:00",
        "endTime": "07:20"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-24T07:20:00Z",
    "updated_at": "2026-07-24T07:20:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia"
    ],
    "source_type": "template",
    "source_id": "demo-tmpl-coffee"
  },
  {
    "id": "jul-noah-26",
    "device_id": "demo-dev-noah-console",
    "start_time": "14:00:00",
    "end_time": "18:00:00",
    "usage_date": "2026-07-26",
    "calculated_cost": 0.25,
    "total_kwh": 0.8,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.4,
        "rate": 0.25,
        "cost": 0.1,
        "startTime": "14:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "Mid-Peak",
        "hours": 2,
        "kwh": 0.4,
        "rate": 0.37,
        "cost": 0.15,
        "startTime": "16:01",
        "endTime": "18:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-noah",
    "created_at": "2026-07-26T18:00:00Z",
    "updated_at": "2026-07-26T18:00:00Z",
    "assigned_users": [
      "demo-user-noah"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-tv-26",
    "device_id": "demo-dev-living-tv",
    "start_time": "19:30:00",
    "end_time": "22:00:00",
    "usage_date": "2026-07-26",
    "calculated_cost": 0.1,
    "total_kwh": 0.3,
    "rate_breakdown": [
      {
        "ratePeriod": "Mid-Peak",
        "hours": 1.5,
        "kwh": 0.18,
        "rate": 0.37,
        "cost": 0.07,
        "startTime": "19:30",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 1,
        "kwh": 0.12,
        "rate": 0.25,
        "cost": 0.03,
        "startTime": "21:01",
        "endTime": "22:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-26T22:00:00Z",
    "updated_at": "2026-07-26T22:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-coffee-26",
    "device_id": "demo-dev-coffee",
    "start_time": "07:00:00",
    "end_time": "07:20:00",
    "usage_date": "2026-07-26",
    "calculated_cost": 0.08,
    "total_kwh": 0.33,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.3,
        "kwh": 0.33,
        "rate": 0.25,
        "cost": 0.08,
        "startTime": "07:00",
        "endTime": "07:20"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-26T07:20:00Z",
    "updated_at": "2026-07-26T07:20:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia"
    ],
    "source_type": "template",
    "source_id": "demo-tmpl-coffee"
  },
  {
    "id": "jul-pc-28",
    "device_id": "demo-dev-alex-pc",
    "start_time": "19:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-07-28",
    "calculated_cost": 0.72,
    "total_kwh": 1.8,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 2,
        "kwh": 0.91,
        "rate": 0.55,
        "cost": 0.5,
        "startTime": "19:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-28T23:00:00Z",
    "updated_at": "2026-07-28T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-mia-28",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-07-28",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-28T17:00:00Z",
    "updated_at": "2026-07-28T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jul-dw-28",
    "device_id": "demo-dev-dishwasher",
    "start_time": "20:00:00",
    "end_time": "21:30:00",
    "usage_date": "2026-07-28",
    "calculated_cost": 1.22,
    "total_kwh": 2.7,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 1.83,
        "rate": 0.55,
        "cost": 1.01,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.5,
        "kwh": 0.87,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "21:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-28T21:30:00Z",
    "updated_at": "2026-07-28T21:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-coffee-28",
    "device_id": "demo-dev-coffee",
    "start_time": "07:00:00",
    "end_time": "07:20:00",
    "usage_date": "2026-07-28",
    "calculated_cost": 0.08,
    "total_kwh": 0.33,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.3,
        "kwh": 0.33,
        "rate": 0.25,
        "cost": 0.08,
        "startTime": "07:00",
        "endTime": "07:20"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-28T07:20:00Z",
    "updated_at": "2026-07-28T07:20:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia"
    ],
    "source_type": "template",
    "source_id": "demo-tmpl-coffee"
  },
  {
    "id": "jul-hp-29",
    "device_id": "demo-dev-heatpump",
    "start_time": "17:00:00",
    "end_time": "21:00:00",
    "usage_date": "2026-07-29",
    "calculated_cost": 5.5,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.55,
        "cost": 5.5,
        "startTime": "17:00",
        "endTime": "21:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-29T21:00:00Z",
    "updated_at": "2026-07-29T21:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-mia-29",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-07-29",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-29T17:00:00Z",
    "updated_at": "2026-07-29T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jul-tv-29",
    "device_id": "demo-dev-living-tv",
    "start_time": "19:30:00",
    "end_time": "22:00:00",
    "usage_date": "2026-07-29",
    "calculated_cost": 0.13,
    "total_kwh": 0.3,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1.5,
        "kwh": 0.18,
        "rate": 0.55,
        "cost": 0.1,
        "startTime": "19:30",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 1,
        "kwh": 0.12,
        "rate": 0.25,
        "cost": 0.03,
        "startTime": "21:01",
        "endTime": "22:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-07-29T22:00:00Z",
    "updated_at": "2026-07-29T22:00:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jul-fridge-29",
    "device_id": "demo-dev-fridge",
    "start_time": "00:00:00",
    "end_time": "23:59:00",
    "usage_date": "2026-07-29",
    "calculated_cost": 1.35,
    "total_kwh": 4.32,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 19,
        "kwh": 3.42,
        "rate": 0.25,
        "cost": 0.85,
        "startTime": "00:00",
        "endTime": "23:59"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 5,
        "kwh": 0.9,
        "rate": 0.55,
        "cost": 0.49,
        "startTime": "16:01",
        "endTime": "21:01"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-07-29T23:59:00Z",
    "updated_at": "2026-07-29T23:59:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-hp-2",
    "device_id": "demo-dev-heatpump",
    "start_time": "16:30:00",
    "end_time": "20:30:00",
    "usage_date": "2026-06-02",
    "calculated_cost": 5.5,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.55,
        "cost": 5.5,
        "startTime": "16:30",
        "endTime": "20:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-02T20:30:00Z",
    "updated_at": "2026-06-02T20:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-pc-2",
    "device_id": "demo-dev-alex-pc",
    "start_time": "20:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-06-02",
    "calculated_cost": 0.47,
    "total_kwh": 1.35,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.46,
        "rate": 0.55,
        "cost": 0.25,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-02T23:00:00Z",
    "updated_at": "2026-06-02T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-mia-2",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-06-02",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-06-02T17:00:00Z",
    "updated_at": "2026-06-02T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jun-hp-5",
    "device_id": "demo-dev-heatpump",
    "start_time": "16:30:00",
    "end_time": "20:30:00",
    "usage_date": "2026-06-05",
    "calculated_cost": 5.5,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.55,
        "cost": 5.5,
        "startTime": "16:30",
        "endTime": "20:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-05T20:30:00Z",
    "updated_at": "2026-06-05T20:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-pc-5",
    "device_id": "demo-dev-alex-pc",
    "start_time": "20:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-06-05",
    "calculated_cost": 0.47,
    "total_kwh": 1.35,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.46,
        "rate": 0.55,
        "cost": 0.25,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-05T23:00:00Z",
    "updated_at": "2026-06-05T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-mia-5",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-06-05",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-06-05T17:00:00Z",
    "updated_at": "2026-06-05T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jun-tv-5",
    "device_id": "demo-dev-living-tv",
    "start_time": "19:00:00",
    "end_time": "21:30:00",
    "usage_date": "2026-06-05",
    "calculated_cost": 0.15,
    "total_kwh": 0.3,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 2,
        "kwh": 0.24,
        "rate": 0.55,
        "cost": 0.13,
        "startTime": "19:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.5,
        "kwh": 0.06,
        "rate": 0.25,
        "cost": 0.01,
        "startTime": "21:01",
        "endTime": "21:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-noah",
    "created_at": "2026-06-05T21:30:00Z",
    "updated_at": "2026-06-05T21:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-hp-8",
    "device_id": "demo-dev-heatpump",
    "start_time": "16:30:00",
    "end_time": "20:30:00",
    "usage_date": "2026-06-08",
    "calculated_cost": 5.5,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.55,
        "cost": 5.5,
        "startTime": "16:30",
        "endTime": "20:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-08T20:30:00Z",
    "updated_at": "2026-06-08T20:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-pc-8",
    "device_id": "demo-dev-alex-pc",
    "start_time": "20:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-06-08",
    "calculated_cost": 0.47,
    "total_kwh": 1.35,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.46,
        "rate": 0.55,
        "cost": 0.25,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-08T23:00:00Z",
    "updated_at": "2026-06-08T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-mia-8",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-06-08",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-06-08T17:00:00Z",
    "updated_at": "2026-06-08T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jun-hp-11",
    "device_id": "demo-dev-heatpump",
    "start_time": "16:30:00",
    "end_time": "20:30:00",
    "usage_date": "2026-06-11",
    "calculated_cost": 5.5,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.55,
        "cost": 5.5,
        "startTime": "16:30",
        "endTime": "20:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-11T20:30:00Z",
    "updated_at": "2026-06-11T20:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-pc-11",
    "device_id": "demo-dev-alex-pc",
    "start_time": "20:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-06-11",
    "calculated_cost": 0.47,
    "total_kwh": 1.35,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.46,
        "rate": 0.55,
        "cost": 0.25,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-11T23:00:00Z",
    "updated_at": "2026-06-11T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-mia-11",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-06-11",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-06-11T17:00:00Z",
    "updated_at": "2026-06-11T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jun-hp-14",
    "device_id": "demo-dev-heatpump",
    "start_time": "16:30:00",
    "end_time": "20:30:00",
    "usage_date": "2026-06-14",
    "calculated_cost": 3.7,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "Mid-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.37,
        "cost": 3.7,
        "startTime": "16:30",
        "endTime": "20:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-14T20:30:00Z",
    "updated_at": "2026-06-14T20:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-pc-14",
    "device_id": "demo-dev-alex-pc",
    "start_time": "20:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-06-14",
    "calculated_cost": 0.39,
    "total_kwh": 1.35,
    "rate_breakdown": [
      {
        "ratePeriod": "Mid-Peak",
        "hours": 1,
        "kwh": 0.46,
        "rate": 0.37,
        "cost": 0.17,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-14T23:00:00Z",
    "updated_at": "2026-06-14T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-tv-14",
    "device_id": "demo-dev-living-tv",
    "start_time": "19:00:00",
    "end_time": "21:30:00",
    "usage_date": "2026-06-14",
    "calculated_cost": 0.1,
    "total_kwh": 0.3,
    "rate_breakdown": [
      {
        "ratePeriod": "Mid-Peak",
        "hours": 2,
        "kwh": 0.24,
        "rate": 0.37,
        "cost": 0.09,
        "startTime": "19:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.5,
        "kwh": 0.06,
        "rate": 0.25,
        "cost": 0.01,
        "startTime": "21:01",
        "endTime": "21:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-noah",
    "created_at": "2026-06-14T21:30:00Z",
    "updated_at": "2026-06-14T21:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-hp-17",
    "device_id": "demo-dev-heatpump",
    "start_time": "16:30:00",
    "end_time": "20:30:00",
    "usage_date": "2026-06-17",
    "calculated_cost": 5.5,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.55,
        "cost": 5.5,
        "startTime": "16:30",
        "endTime": "20:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-17T20:30:00Z",
    "updated_at": "2026-06-17T20:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-pc-17",
    "device_id": "demo-dev-alex-pc",
    "start_time": "20:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-06-17",
    "calculated_cost": 0.47,
    "total_kwh": 1.35,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.46,
        "rate": 0.55,
        "cost": 0.25,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-17T23:00:00Z",
    "updated_at": "2026-06-17T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-mia-17",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-06-17",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-06-17T17:00:00Z",
    "updated_at": "2026-06-17T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jun-hp-20",
    "device_id": "demo-dev-heatpump",
    "start_time": "16:30:00",
    "end_time": "20:30:00",
    "usage_date": "2026-06-20",
    "calculated_cost": 3.7,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "Mid-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.37,
        "cost": 3.7,
        "startTime": "16:30",
        "endTime": "20:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-20T20:30:00Z",
    "updated_at": "2026-06-20T20:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-pc-20",
    "device_id": "demo-dev-alex-pc",
    "start_time": "20:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-06-20",
    "calculated_cost": 0.39,
    "total_kwh": 1.35,
    "rate_breakdown": [
      {
        "ratePeriod": "Mid-Peak",
        "hours": 1,
        "kwh": 0.46,
        "rate": 0.37,
        "cost": 0.17,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-20T23:00:00Z",
    "updated_at": "2026-06-20T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-hp-23",
    "device_id": "demo-dev-heatpump",
    "start_time": "16:30:00",
    "end_time": "20:30:00",
    "usage_date": "2026-06-23",
    "calculated_cost": 5.5,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.55,
        "cost": 5.5,
        "startTime": "16:30",
        "endTime": "20:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-23T20:30:00Z",
    "updated_at": "2026-06-23T20:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-pc-23",
    "device_id": "demo-dev-alex-pc",
    "start_time": "20:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-06-23",
    "calculated_cost": 0.47,
    "total_kwh": 1.35,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.46,
        "rate": 0.55,
        "cost": 0.25,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-23T23:00:00Z",
    "updated_at": "2026-06-23T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-mia-23",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-06-23",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-06-23T17:00:00Z",
    "updated_at": "2026-06-23T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jun-tv-23",
    "device_id": "demo-dev-living-tv",
    "start_time": "19:00:00",
    "end_time": "21:30:00",
    "usage_date": "2026-06-23",
    "calculated_cost": 0.15,
    "total_kwh": 0.3,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 2,
        "kwh": 0.24,
        "rate": 0.55,
        "cost": 0.13,
        "startTime": "19:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 0.5,
        "kwh": 0.06,
        "rate": 0.25,
        "cost": 0.01,
        "startTime": "21:01",
        "endTime": "21:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-noah",
    "created_at": "2026-06-23T21:30:00Z",
    "updated_at": "2026-06-23T21:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-hp-26",
    "device_id": "demo-dev-heatpump",
    "start_time": "16:30:00",
    "end_time": "20:30:00",
    "usage_date": "2026-06-26",
    "calculated_cost": 5.5,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.55,
        "cost": 5.5,
        "startTime": "16:30",
        "endTime": "20:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-26T20:30:00Z",
    "updated_at": "2026-06-26T20:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-pc-26",
    "device_id": "demo-dev-alex-pc",
    "start_time": "20:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-06-26",
    "calculated_cost": 0.47,
    "total_kwh": 1.35,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.46,
        "rate": 0.55,
        "cost": 0.25,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-26T23:00:00Z",
    "updated_at": "2026-06-26T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-mia-26",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-06-26",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-06-26T17:00:00Z",
    "updated_at": "2026-06-26T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  },
  {
    "id": "jun-hp-29",
    "device_id": "demo-dev-heatpump",
    "start_time": "16:30:00",
    "end_time": "20:30:00",
    "usage_date": "2026-06-29",
    "calculated_cost": 5.5,
    "total_kwh": 10,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 4,
        "kwh": 10,
        "rate": 0.55,
        "cost": 5.5,
        "startTime": "16:30",
        "endTime": "20:30"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-29T20:30:00Z",
    "updated_at": "2026-06-29T20:30:00Z",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-pc-29",
    "device_id": "demo-dev-alex-pc",
    "start_time": "20:00:00",
    "end_time": "23:00:00",
    "usage_date": "2026-06-29",
    "calculated_cost": 0.47,
    "total_kwh": 1.35,
    "rate_breakdown": [
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.46,
        "rate": 0.55,
        "cost": 0.25,
        "startTime": "20:00",
        "endTime": "21:01"
      },
      {
        "ratePeriod": "Off-Peak",
        "hours": 2,
        "kwh": 0.89,
        "rate": 0.25,
        "cost": 0.22,
        "startTime": "21:01",
        "endTime": "23:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-alex",
    "created_at": "2026-06-29T23:00:00Z",
    "updated_at": "2026-06-29T23:00:00Z",
    "assigned_users": [
      "demo-user-alex"
    ],
    "source_type": "manual"
  },
  {
    "id": "jun-mia-29",
    "device_id": "demo-dev-mia-laptop",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "usage_date": "2026-06-29",
    "calculated_cost": 0.15,
    "total_kwh": 0.52,
    "rate_breakdown": [
      {
        "ratePeriod": "Off-Peak",
        "hours": 7,
        "kwh": 0.46,
        "rate": 0.25,
        "cost": 0.11,
        "startTime": "09:00",
        "endTime": "16:01"
      },
      {
        "ratePeriod": "On-Peak",
        "hours": 1,
        "kwh": 0.06,
        "rate": 0.55,
        "cost": 0.04,
        "startTime": "16:01",
        "endTime": "17:00"
      }
    ],
    "household_id": "demo-hh-park-family-0001",
    "created_by": "demo-user-mia",
    "created_at": "2026-06-29T17:00:00Z",
    "updated_at": "2026-06-29T17:00:00Z",
    "assigned_users": [
      "demo-user-mia"
    ],
    "source_type": "recurring",
    "source_id": "demo-sched-mia-work"
  }
]

export const demoTemplates: EnergyLogTemplate[] = [
  {
    "id": "demo-tmpl-coffee",
    "household_id": "demo-hh-park-family-0001",
    "template_name": "Morning Espresso",
    "device_id": "demo-dev-coffee",
    "device_ids": [
      "demo-dev-coffee"
    ],
    "default_start_time": "07:00:00",
    "default_end_time": "07:20:00",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia"
    ],
    "created_by": "demo-user-alex",
    "created_at": "2026-06-01T00:00:00Z",
    "updated_at": "2026-06-01T00:00:00Z",
    "device_name": "Espresso Machine",
    "device_wattage": 1000
  },
  {
    "id": "demo-tmpl-laundry",
    "household_id": "demo-hh-park-family-0001",
    "template_name": "Laundry Pair",
    "device_id": null,
    "device_ids": [
      "demo-dev-washer",
      "demo-dev-dryer"
    ],
    "default_start_time": "10:00:00",
    "default_end_time": "12:00:00",
    "assigned_users": [
      "demo-user-mia",
      "demo-user-alex"
    ],
    "created_by": "demo-user-mia",
    "created_at": "2026-06-01T00:00:00Z",
    "updated_at": "2026-06-01T00:00:00Z",
    "device_name": "Washer, Dryer"
  },
  {
    "id": "demo-tmpl-movie",
    "household_id": "demo-hh-park-family-0001",
    "template_name": "Family Movie Night",
    "device_id": "demo-dev-living-tv",
    "device_ids": [
      "demo-dev-living-tv"
    ],
    "default_start_time": "19:30:00",
    "default_end_time": "22:00:00",
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "created_by": "demo-user-mia",
    "created_at": "2026-06-01T00:00:00Z",
    "updated_at": "2026-06-01T00:00:00Z",
    "device_name": "Living Room TV",
    "device_wattage": 120
  },
  {
    "id": "demo-tmpl-gaming",
    "household_id": "demo-hh-park-family-0001",
    "template_name": "Noah's Afternoon Gaming",
    "device_id": "demo-dev-noah-console",
    "device_ids": [
      "demo-dev-noah-console"
    ],
    "default_start_time": "14:00:00",
    "default_end_time": "18:00:00",
    "assigned_users": [
      "demo-user-noah"
    ],
    "created_by": "demo-user-noah",
    "created_at": "2026-06-01T00:00:00Z",
    "updated_at": "2026-06-01T00:00:00Z",
    "device_name": "Noah's Game Console",
    "device_wattage": 200
  },
  {
    "id": "demo-tmpl-study",
    "household_id": "demo-hh-park-family-0001",
    "template_name": "Sofia's Study Lights",
    "device_id": "demo-dev-sofia-lamp",
    "device_ids": [
      "demo-dev-sofia-lamp"
    ],
    "default_start_time": "20:00:00",
    "default_end_time": "23:00:00",
    "assigned_users": [
      "demo-user-sofia"
    ],
    "created_by": "demo-user-sofia",
    "created_at": "2026-06-01T00:00:00Z",
    "updated_at": "2026-06-01T00:00:00Z",
    "device_name": "Sofia's Desk Lamp",
    "device_wattage": 40
  }
]

export const demoSchedules: RecurringSchedule[] = [
  {
    "id": "demo-sched-mia-work",
    "household_id": "demo-hh-park-family-0001",
    "schedule_name": "Mia Remote Workdays",
    "device_id": "demo-dev-mia-laptop",
    "recurrence_type": "weekly",
    "days_of_week": [
      1,
      2,
      3,
      4,
      5
    ],
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "schedule_start_date": "2026-06-01",
    "schedule_end_date": null,
    "assigned_users": [
      "demo-user-mia"
    ],
    "is_active": true,
    "auto_create": true,
    "created_by": "demo-user-mia",
    "created_at": "2026-06-01T00:00:00Z",
    "updated_at": "2026-06-01T00:00:00Z",
    "device_name": "Mia's Laptop",
    "device_wattage": 65
  },
  {
    "id": "demo-sched-alex-pc",
    "household_id": "demo-hh-park-family-0001",
    "schedule_name": "Alex Evening Coding",
    "device_id": "demo-dev-alex-pc",
    "recurrence_type": "weekly",
    "days_of_week": [
      1,
      2,
      3,
      4
    ],
    "start_time": "19:00:00",
    "end_time": "23:00:00",
    "schedule_start_date": "2026-06-01",
    "schedule_end_date": null,
    "assigned_users": [
      "demo-user-alex"
    ],
    "is_active": true,
    "auto_create": true,
    "created_by": "demo-user-alex",
    "created_at": "2026-06-01T00:00:00Z",
    "updated_at": "2026-06-01T00:00:00Z",
    "device_name": "Alex's Desktop PC",
    "device_wattage": 450
  },
  {
    "id": "demo-sched-noah-weekend",
    "household_id": "demo-hh-park-family-0001",
    "schedule_name": "Noah Weekend Console",
    "device_id": "demo-dev-noah-console",
    "recurrence_type": "weekly",
    "days_of_week": [
      0,
      6
    ],
    "start_time": "14:00:00",
    "end_time": "18:00:00",
    "schedule_start_date": "2026-06-01",
    "schedule_end_date": null,
    "assigned_users": [
      "demo-user-noah"
    ],
    "is_active": true,
    "auto_create": true,
    "created_by": "demo-user-noah",
    "created_at": "2026-06-01T00:00:00Z",
    "updated_at": "2026-06-01T00:00:00Z",
    "device_name": "Noah's Game Console",
    "device_wattage": 200
  },
  {
    "id": "demo-sched-sofia-study",
    "household_id": "demo-hh-park-family-0001",
    "schedule_name": "Sofia Weeknight Study",
    "device_id": "demo-dev-sofia-lamp",
    "recurrence_type": "weekly",
    "days_of_week": [
      1,
      2,
      3,
      4,
      5
    ],
    "start_time": "20:00:00",
    "end_time": "23:00:00",
    "schedule_start_date": "2026-06-01",
    "schedule_end_date": "2026-08-31",
    "assigned_users": [
      "demo-user-sofia"
    ],
    "is_active": true,
    "auto_create": false,
    "created_by": "demo-user-sofia",
    "created_at": "2026-06-01T00:00:00Z",
    "updated_at": "2026-06-01T00:00:00Z",
    "device_name": "Sofia's Desk Lamp",
    "device_wattage": 40
  },
  {
    "id": "demo-sched-dishwasher",
    "household_id": "demo-hh-park-family-0001",
    "schedule_name": "Evening Dishwasher",
    "device_id": "demo-dev-dishwasher",
    "recurrence_type": "weekly",
    "days_of_week": [
      1,
      3,
      5
    ],
    "start_time": "20:00:00",
    "end_time": "21:30:00",
    "schedule_start_date": "2026-06-01",
    "schedule_end_date": null,
    "assigned_users": [
      "demo-user-alex",
      "demo-user-mia",
      "demo-user-noah",
      "demo-user-sofia"
    ],
    "is_active": true,
    "auto_create": true,
    "created_by": "demo-user-alex",
    "created_at": "2026-06-01T00:00:00Z",
    "updated_at": "2026-06-01T00:00:00Z",
    "device_name": "Dishwasher",
    "device_wattage": 1800
  }
]

export const demoDeviceGroups: DeviceGroup[] = [
  {
    "id": "demo-group-laundry",
    "household_id": "demo-hh-park-family-0001",
    "group_name": "Laundry Pair",
    "device_ids": [
      "demo-dev-washer",
      "demo-dev-dryer"
    ],
    "created_by": "demo-user-mia",
    "created_at": "2026-06-01T00:00:00Z",
    "updated_at": "2026-06-01T00:00:00Z"
  },
  {
    "id": "demo-group-kitchen",
    "household_id": "demo-hh-park-family-0001",
    "group_name": "Kitchen Essentials",
    "device_ids": [
      "demo-dev-fridge",
      "demo-dev-dishwasher",
      "demo-dev-coffee"
    ],
    "created_by": "demo-user-alex",
    "created_at": "2026-06-01T00:00:00Z",
    "updated_at": "2026-06-01T00:00:00Z"
  },
  {
    "id": "demo-group-personal",
    "household_id": "demo-hh-park-family-0001",
    "group_name": "Personal Workstations",
    "device_ids": [
      "demo-dev-alex-pc",
      "demo-dev-mia-laptop",
      "demo-dev-noah-console",
      "demo-dev-sofia-lamp"
    ],
    "created_by": "demo-user-alex",
    "created_at": "2026-06-01T00:00:00Z",
    "updated_at": "2026-06-01T00:00:00Z"
  }
]

export const demoBillSplits: (BillSplit & { split_method?: "even" | "usage_based" })[] = [
  {
    "id": "demo-bill-june-2026",
    "household_id": "demo-hh-park-family-0001",
    "month": 6,
    "year": 2026,
    "billing_period_start": "2026-06-01",
    "billing_period_end": "2026-06-30",
    "total_bill_amount": 102.54,
    "split_method": "usage_based",
    "user_allocations": {
      "demo-user-alex": {
        "personalCost": 20.26,
        "sharedCost": 8.97,
        "totalOwed": 29.23
      },
      "demo-user-mia": {
        "personalCost": 16.39,
        "sharedCost": 8.97,
        "totalOwed": 25.36
      },
      "demo-user-noah": {
        "personalCost": 15,
        "sharedCost": 8.97,
        "totalOwed": 23.97
      },
      "demo-user-sofia": {
        "personalCost": 15,
        "sharedCost": 8.97,
        "totalOwed": 23.97
      }
    },
    "created_by": "demo-user-alex",
    "created_at": "2026-07-02T00:00:00Z",
    "updated_at": "2026-07-02T00:00:00Z"
  }
]

/** Legacy chart placeholders (Dashboard derives live from energy logs). */
export const demoDashboardStats = {
  personalUsage: { daily: { kwh: 8.2, cost: 2.4 }, weekly: { kwh: 54, cost: 16.1 }, monthly: { kwh: 210.0, cost: 83.35 } },
  householdUsage: {
    total: { kwh: 328.5, cost: 140.89 },
    members: [
      { name: "Alex", kwh: 0, cost: 0 },
      { name: "Mia", kwh: 0, cost: 0 },
      { name: "Noah", kwh: 0, cost: 0 },
      { name: "Sofia", kwh: 0, cost: 0 }
    ]
  },
  ratePeriods: { offPeak: { kwh: 0, cost: 0 }, midPeak: { kwh: 0, cost: 0 }, onPeak: { kwh: 0, cost: 0 }, superOffPeak: { kwh: 0, cost: 0 } },
  topDevices: [] as { name: string; kwh: number; cost: number; type?: string }[]
}

export const demoWeeklyUsageData = [
  { day: "Mon", Alex: 12, Mia: 5, Noah: 2, Sofia: 1 },
  { day: "Tue", Alex: 11, Mia: 5, Noah: 1, Sofia: 1 },
  { day: "Wed", Alex: 13, Mia: 5, Noah: 2, Sofia: 1 },
  { day: "Thu", Alex: 12, Mia: 5, Noah: 1, Sofia: 1 },
  { day: "Fri", Alex: 14, Mia: 5, Noah: 3, Sofia: 1 },
  { day: "Sat", Alex: 10, Mia: 3, Noah: 6, Sofia: 2 },
  { day: "Sun", Alex: 9, Mia: 3, Noah: 5, Sofia: 2 }
]

export const demoMonthlyTrendData = [
  { month: "Jan", usage: 980, cost: 268 },
  { month: "Feb", usage: 920, cost: 251 },
  { month: "Mar", usage: 1010, cost: 276 },
  { month: "Apr", usage: 1080, cost: 295 },
  { month: "May", usage: 1180, cost: 322 },
  { month: "Jun", usage: 119, cost: 57.5 },
  { month: "Jul", usage: 210, cost: 83.3 },
  { month: "Aug", usage: 0, cost: 0 },
  { month: "Sep", usage: 0, cost: 0 },
  { month: "Oct", usage: 0, cost: 0 },
  { month: "Nov", usage: 0, cost: 0 },
  { month: "Dec", usage: 0, cost: 0 }
]

export const demoDeviceUsageData = [
  { name: "Whole-Home Heat Pump", usage: 80, cost: 40 },
  { name: "Alex's EV Charger", usage: 120, cost: 30 },
  { name: "Alex's Desktop PC", usage: 20, cost: 8 },
  { name: "Mia's Laptop", usage: 12, cost: 3 }
]
