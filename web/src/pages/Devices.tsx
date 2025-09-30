import { useState } from 'react'
import { useDevices } from '../hooks/useDevices'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/badge'

// Helper function to get device-specific icon
const getDeviceIcon = (deviceName: string, deviceType: string): string => {
  const name = deviceName.toLowerCase()
  const type = deviceType.toLowerCase()
  
  // Alphabetically organized for easy maintenance
  if (type.includes('air conditioner') || name.includes('ac')) return '❄️'
  if (type.includes('air purifier')) return '🌬️'
  if (type.includes('coffee maker') || name.includes('coffee')) return '☕'
  if (type.includes('computer') || name.includes('laptop') || name.includes('pc')) return '💻'
  if (type.includes('dehumidifier')) return '💧'
  if (type.includes('dishwasher')) return '🍽️'
  if (type.includes('dryer') && !name.includes('hair')) return '🧺'
  if (type.includes('ev charger') || name.includes('tesla') || name.includes('ev')) return '🔋'
  if (type.includes('fan')) return '🌀'
  if (type.includes('freezer')) return '🧊'
  if (type.includes('gaming console') || name.includes('gaming')) return '🎮'
  if (type.includes('hair dryer') || name.includes('hair dryer')) return '💨'
  if (type.includes('heater') || type.includes('space heater')) return '🌡️'
  if (type.includes('humidifier')) return '💦'
  if (type.includes('iron')) return '👔'
  if (type.includes('kettle')) return '🫖'
  if (type.includes('light')) return '💡'
  if (type.includes('microwave')) return '🔥'
  if (type.includes('oven')) return '🍳'
  if (type.includes('printer')) return '🖨️'
  if (type.includes('refrigerator') || name.includes('fridge')) return '🧊'
  if (type.includes('router')) return '📡'
  if (type.includes('toaster')) return '🍞'
  if (type.includes('tv') || name.includes('tv')) return '📺'
  if (type.includes('vacuum')) return '🧹'
  if (type.includes('washing machine')) return '🧺'
  if (type.includes('water heater')) return '🚿'
  return '🔌'
}

interface DeviceFormData {
  name: string
  device_type: string
  location: string
  wattage: number
  is_shared: boolean
}

const DEVICE_TYPES = [
  'Air Conditioner',
  'Air Purifier',
  'Coffee Maker',
  'Computer',
  'Dehumidifier',
  'Dishwasher',
  'Dryer',
  'EV Charger',
  'Fan',
  'Freezer',
  'Gaming Console',
  'Hair Dryer',
  'Heater',
  'Humidifier',
  'Iron',
  'Kettle',
  'Light',
  'Microwave',
  'Oven',
  'Printer',
  'Refrigerator',
  'Router',
  'Space Heater',
  'Toaster',
  'TV',
  'Vacuum Cleaner',
  'Washing Machine',
  'Water Heater',
  'Other'
].sort() // Alphabetically sorted

const LOCATIONS = [
  'Attic',
  'Backyard',
  'Basement',
  'Bathroom',
  'Bedroom 1',
  'Bedroom 2',
  'Bedroom 3',
  'Bedroom 4',
  'Dining Room',
  'Entryway',
  'Garage',
  'Guest Room',
  'Gym',
  'Hallway',
  'Kitchen',
  'Laundry Room',
  'Living Room',
  'Master Bedroom',
  'Office',
  'Outdoor',
  'Patio',
  'Utility Room',
  'Other'
].sort() // Alphabetically sorted

export default function Devices() {
  const { devices, loading, error, addDevice, updateDevice, deleteDevice } = useDevices()
  const [showForm, setShowForm] = useState(false)
  const [editingDevice, setEditingDevice] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showCustomLocation, setShowCustomLocation] = useState(false)
  const [customLocation, setCustomLocation] = useState('')
  const [formData, setFormData] = useState<DeviceFormData>({
    name: '',
    device_type: '',
    location: '',
    wattage: 0,
    is_shared: true
  })
  const [formErrors, setFormErrors] = useState<Partial<DeviceFormData>>({})

  const validateForm = (): boolean => {
    const errors: Partial<DeviceFormData> = {}
    
    if (!formData.name.trim()) errors.name = 'Device name is required'
    if (!formData.device_type) errors.device_type = 'Device type is required'
    if (!formData.location) errors.location = 'Location is required'
    if (formData.wattage <= 0) errors.wattage = 'Wattage must be greater than 0' as any
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const finalData = {
        ...formData,
        location: showCustomLocation ? customLocation : formData.location
      }
      if (editingDevice) {
        await updateDevice(editingDevice, finalData)
      } else {
        await addDevice(finalData)
      }
      resetForm()
    } catch (err) {
      console.error('Error saving device:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      device_type: '',
      location: '',
      wattage: 0,
      is_shared: true
    })
    setFormErrors({})
    setShowForm(false)
    setEditingDevice(null)
    setShowCustomLocation(false)
    setCustomLocation('')
  }

  const handleEdit = (device: any) => {
    const isCustomLocation = !LOCATIONS.includes(device.location)
    setFormData({
      name: device.name,
      device_type: device.device_type,
      location: isCustomLocation ? 'Custom' : device.location,
      wattage: device.wattage,
      is_shared: device.is_shared
    })
    if (isCustomLocation) {
      setShowCustomLocation(true)
      setCustomLocation(device.location)
    }
    setEditingDevice(device.id)
    setShowForm(true)
  }

  const handleDelete = async (deviceId: string) => {
    try {
      await deleteDevice(deviceId)
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Error deleting device:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 text-xl text-muted-foreground">
        <div className="energy-pulse">Loading devices...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-5 min-h-screen bg-background text-foreground font-sans fade-in">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 p-6 energy-header-gradient rounded-2xl text-white shadow-xl energy-glow">
        <div>
          <h1 className="text-3xl font-bold mb-2 energy-pulse">
            🔌 Device Management
          </h1>
          <p className="opacity-90">
            Manage household devices and track energy consumption
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="energy-action-btn px-6 py-3 text-lg font-semibold"
        >
          + Add Device
        </Button>
      </header>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-600 p-4 rounded-lg mb-6 slide-up">
          {error}
        </div>
      )}

      {/* Device Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="energy-card w-full max-w-lg max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle className="text-xl text-foreground flex items-center gap-2">
                {editingDevice ? '✏️ Edit Device' : '➕ Add New Device'}
              </CardTitle>
              <CardDescription>
                {editingDevice ? 'Update device information' : 'Add a new household device to track energy usage'}
              </CardDescription>
            </CardHeader>
            <CardContent>
            
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Device Name */}
                <div>
                  <label className="block mb-2 font-semibold text-foreground">
                    Device Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Living Room TV"
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <div className="text-red-500 text-sm mt-1">
                      {formErrors.name}
                    </div>
                  )}
                </div>

                {/* Device Type */}
                <div>
                  <label className="block mb-2 font-semibold text-foreground">
                    Device Type *
                  </label>
                  <select
                    value={formData.device_type}
                    onChange={(e) => setFormData({...formData, device_type: e.target.value})}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${formErrors.device_type ? 'border-red-500' : 'border-border'}`}
                  >
                    <option value="">Select device type</option>
                    {DEVICE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {formErrors.device_type && (
                    <div className="text-red-500 text-sm mt-1">
                      {formErrors.device_type}
                    </div>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block mb-2 font-semibold text-foreground">
                    Location *
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData({...formData, location: value})
                      setShowCustomLocation(value === 'Custom')
                      if (value !== 'Custom') {
                        setCustomLocation('')
                      }
                    }}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${formErrors.location ? 'border-red-500' : 'border-border'}`}
                  >
                    <option value="">Select location</option>
                    {LOCATIONS.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                    <option value="Custom">✏️ Custom Location...</option>
                  </select>
                  {formErrors.location && (
                    <div className="text-red-500 text-sm mt-1">
                      {formErrors.location}
                    </div>
                  )}
                  
                  {/* Custom Location Input */}
                  {showCustomLocation && (
                    <div className="mt-3">
                      <Input
                        type="text"
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                        placeholder="Enter custom location (e.g., Backyard, Patio, Guest Room)"
                        className="w-full"
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        Enter a custom location name
                      </div>
                    </div>
                  )}
                </div>

                {/* Wattage */}
                <div>
                  <label className="block mb-2 font-semibold text-foreground">
                    Power Consumption (Watts) *
                  </label>
                  <Input
                    type="number"
                    value={formData.wattage || ''}
                    onChange={(e) => setFormData({...formData, wattage: parseInt(e.target.value) || 0})}
                    placeholder="e.g., 150"
                    min="1"
                    className={formErrors.wattage ? 'border-red-500' : ''}
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    Auto-calculated: {(formData.wattage / 1000).toFixed(3)} kWh/hour
                  </div>
                  {formErrors.wattage && (
                    <div className="text-red-500 text-sm mt-1">
                      {formErrors.wattage}
                    </div>
                  )}
                </div>

                {/* Shared/Personal Toggle */}
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_shared}
                      onChange={(e) => setFormData({...formData, is_shared: e.target.checked})}
                      className="mr-3 w-4 h-4"
                    />
                    <span className="font-semibold text-foreground">
                      Shared Device (can be used by multiple family members)
                    </span>
                  </label>
                  <div className="text-sm text-muted-foreground mt-2 ml-7">
                    {formData.is_shared ? 'Costs will be split among users who actually used it in each session' : 'Costs will be assigned to you only'}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    type="button"
                    onClick={resetForm}
                    variant="outline"
                    className="px-6 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="energy-action-btn px-6 py-2"
                  >
                    {editingDevice ? 'Update Device' : 'Add Device'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="energy-card w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl text-red-600 flex items-center gap-2">
                🗑️ Delete Device
              </CardTitle>
              <CardDescription>
                Are you sure you want to delete this device? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setDeleteConfirm(null)}
                  variant="outline"
                  className="px-6 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Device List - Compact Design */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 slide-up">
        {devices.map(device => (
          <Card key={device.id} className="energy-card hover:border-primary/50 transition-all">
            <CardContent className="p-4">
              {/* Header with Icon and Actions */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getDeviceIcon(device.name, device.device_type)}</span>
                    <h3 
                      className="font-bold text-foreground" 
                      title={device.name}
                    >
                      {device.name}
                    </h3>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleEdit(device)}
                      variant="outline"
                      size="sm"
                      className="p-2 h-8 w-8 border-blue-300 text-blue-500 hover:bg-blue-500/10"
                      title="Edit device"
                    >
                      ✏️
                    </Button>
                    <Button
                      onClick={() => setDeleteConfirm(device.id)}
                      variant="outline"
                      size="sm"
                      className="p-2 h-8 w-8 border-red-300 text-red-500 hover:bg-red-500/10"
                      title="Delete device"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
                <Badge 
                  variant={device.is_shared ? 'info' : 'warning'}
                  className="text-xs"
                >
                  {device.is_shared ? '🏠 Shared' : '👤 Personal'}
                </Badge>
              </div>

              {/* Device Info - Compact Grid */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">📦 Type:</span>
                  <span className="font-semibold text-foreground">{device.device_type}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">📍 Location:</span>
                  <span className="font-semibold text-foreground">{device.location}</span>
                </div>
              </div>

              {/* Power Consumption - Highlighted */}
              <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 p-3 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">⚡ Power</span>
                  <span className="font-bold text-blue-400 text-lg">
                    {device.wattage}W
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Per Hour</span>
                  <span className="font-semibold text-green-400 text-sm">
                    {device.kwh_per_hour.toFixed(3)} kWh/h
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-xs text-muted-foreground text-center mt-3 pt-3 border-t border-border">
                Added {new Date(device.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Empty State */}
      {devices.length === 0 && !loading && (
        <section className="text-center py-20 slide-up">
          <div className="text-6xl mb-4 energy-pulse">🔌</div>
          <h3 className="text-xl font-bold text-foreground mb-2">No devices yet</h3>
          <p className="text-muted-foreground mb-6">
            Add your first household device to start tracking energy usage
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="energy-action-btn px-6 py-3 text-lg font-semibold"
          >
            Add Your First Device
          </Button>
        </section>
      )}
    </div>
  )
}
