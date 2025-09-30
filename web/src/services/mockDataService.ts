// Mock data service for development when Supabase is not available
export interface MockDevice {
  id: string
  name: string
  device_type: string
  location: string
  wattage: number
  is_shared: boolean
  created_at: string
  user_id: string
}

export interface MockEnergyLog {
  id: string
  device_id: string
  usage_date: string
  start_time: string
  end_time: string
  assigned_users: string[]
  created_at: string
  devices?: {
    name: string
    wattage: number
  }
}

export const mockDevices: MockDevice[] = [
  {
    id: '1',
    name: 'Living Room TV',
    device_type: 'TV',
    location: 'Living Room',
    wattage: 150,
    is_shared: true,
    created_at: '2024-01-01T00:00:00Z',
    user_id: 'user1'
  },
  {
    id: '2',
    name: 'Kitchen Refrigerator',
    device_type: 'Refrigerator',
    location: 'Kitchen',
    wattage: 200,
    is_shared: true,
    created_at: '2024-01-01T00:00:00Z',
    user_id: 'user1'
  },
  {
    id: '3',
    name: 'Vu\'s Gaming PC',
    device_type: 'Computer',
    location: 'Bedroom 2',
    wattage: 500,
    is_shared: false,
    created_at: '2024-01-01T00:00:00Z',
    user_id: 'user1'
  },
  {
    id: '4',
    name: 'Master Bedroom TV',
    device_type: 'TV',
    location: 'Master Bedroom',
    wattage: 120,
    is_shared: true,
    created_at: '2024-01-01T00:00:00Z',
    user_id: 'user2'
  }
]

export const mockEnergyLogs: MockEnergyLog[] = [
  {
    id: '1',
    device_id: '1',
    usage_date: '2024-01-15',
    start_time: '19:00',
    end_time: '22:00',
    assigned_users: ['Vu', 'Thuy'],
    created_at: '2024-01-15T19:00:00Z',
    devices: {
      name: 'Living Room TV',
      wattage: 150
    }
  },
  {
    id: '2',
    device_id: '3',
    usage_date: '2024-01-15',
    start_time: '20:00',
    end_time: '23:30',
    assigned_users: ['Vu'],
    created_at: '2024-01-15T20:00:00Z',
    devices: {
      name: 'Vu\'s Gaming PC',
      wattage: 500
    }
  },
  {
    id: '3',
    device_id: '2',
    usage_date: '2024-01-15',
    start_time: '00:00',
    end_time: '23:59',
    assigned_users: ['Vu', 'Thuy', 'Vy', 'Han'],
    created_at: '2024-01-15T00:00:00Z',
    devices: {
      name: 'Kitchen Refrigerator',
      wattage: 200
    }
  }
]

export class MockDataService {
  static async getDevices(): Promise<MockDevice[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockDevices
  }

  static async getEnergyLogs(): Promise<MockEnergyLog[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockEnergyLogs
  }

  static async addDevice(device: Omit<MockDevice, 'id' | 'created_at'>): Promise<MockDevice> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const newDevice: MockDevice = {
      ...device,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }
    mockDevices.push(newDevice)
    return newDevice
  }

  static async addEnergyLog(log: Omit<MockEnergyLog, 'id' | 'created_at' | 'devices'>): Promise<MockEnergyLog> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const device = mockDevices.find(d => d.id === log.device_id)
    const newLog: MockEnergyLog = {
      ...log,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      devices: device ? { name: device.name, wattage: device.wattage } : undefined
    }
    mockEnergyLogs.push(newLog)
    return newLog
  }

  static async deleteDevice(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const index = mockDevices.findIndex(d => d.id === id)
    if (index > -1) {
      mockDevices.splice(index, 1)
    }
  }
}
