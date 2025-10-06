import { useState, useMemo } from 'react'
import { 
  BoltIcon, 
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

// Accept any device object with these minimum properties
interface DeviceItem {
  id: string
  name: string
  wattage: number
  location: string
  device_type?: string
  type?: string
}

interface MultiDeviceSelectorProps {
  devices: DeviceItem[]
  selectedDeviceIds: string[]
  onSelectionChange: (deviceIds: string[]) => void
  deviceGroups?: Array<{ id: string; group_name: string; device_ids: string[] }>
  onSaveAsGroup?: (deviceIds: string[]) => void
  className?: string
}

export function MultiDeviceSelector({
  devices,
  selectedDeviceIds,
  onSelectionChange,
  deviceGroups = [],
  onSaveAsGroup,
  className = ''
}: MultiDeviceSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDevices = useMemo(() => {
    if (!searchQuery) return devices
    const query = searchQuery.toLowerCase()
    return devices.filter(device => 
      device.name.toLowerCase().includes(query) ||
      (device.device_type || device.type || '').toLowerCase().includes(query) ||
      device.location.toLowerCase().includes(query)
    )
  }, [devices, searchQuery])

  const toggleDevice = (deviceId: string) => {
    if (selectedDeviceIds.includes(deviceId)) {
      onSelectionChange(selectedDeviceIds.filter(id => id !== deviceId))
    } else {
      onSelectionChange([...selectedDeviceIds, deviceId])
    }
  }

  const selectAll = () => {
    onSelectionChange(filteredDevices.map(d => d.id))
  }

  const clearAll = () => {
    onSelectionChange([])
  }

  const selectGroup = (deviceIds: string[]) => {
    onSelectionChange(deviceIds)
  }

  const totalWattage = useMemo(() => {
    return devices
      .filter(d => selectedDeviceIds.includes(d.id))
      .reduce((sum, d) => sum + d.wattage, 0)
  }, [devices, selectedDeviceIds])

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search and Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search devices..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-background text-foreground border-border focus:border-primary/50 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={selectAll}
          className="px-3 py-2 text-xs font-semibold bg-blue-500/20 border border-blue-500/40 text-blue-300 rounded-md hover:bg-blue-500/30 transition-all"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="px-3 py-2 text-xs font-semibold bg-red-500/20 border border-red-500/40 text-red-300 rounded-md hover:bg-red-500/30 transition-all"
        >
          Clear All
        </button>
      </div>

      {/* Device Groups Quick Select */}
      {deviceGroups.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Quick Select Groups:</label>
          <div className="flex flex-wrap gap-2">
            {deviceGroups.map(group => (
              <button
                key={group.id}
                type="button"
                onClick={() => selectGroup(group.device_ids)}
                className="px-3 py-1.5 text-xs font-semibold bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-md hover:bg-purple-500/30 transition-all flex items-center gap-1"
              >
                <BoltIcon className="w-3 h-3" />
                {group.group_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Count and Total Wattage */}
      {selectedDeviceIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-400 font-semibold">
              {selectedDeviceIds.length} device{selectedDeviceIds.length !== 1 ? 's' : ''} selected
            </span>
            <span className="text-orange-400 font-semibold flex items-center gap-1">
              <BoltIcon className="w-4 h-4" />
              {totalWattage}W total
            </span>
          </div>
          {onSaveAsGroup && selectedDeviceIds.length > 1 && (
            <button
              type="button"
              onClick={() => onSaveAsGroup(selectedDeviceIds)}
              className="px-3 py-1 text-xs font-semibold bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded hover:bg-purple-500/30 transition-all"
            >
              Save as Group
            </button>
          )}
        </div>
      )}

      {/* Device List */}
      <div className="max-h-[300px] overflow-y-auto border border-border rounded-lg bg-muted/20">
        {filteredDevices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {searchQuery ? 'No devices found matching your search' : 'No devices available'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredDevices.map(device => {
              const isSelected = selectedDeviceIds.includes(device.id)
              return (
                <label
                  key={device.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    isSelected ? 'bg-blue-500/10' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleDevice(device.id)}
                      className="w-5 h-5 rounded border-2 border-border checked:bg-blue-500 checked:border-blue-500 cursor-pointer"
                    />
                    {isSelected && (
                      <CheckIcon className="w-3 h-3 absolute top-1 left-1 text-white pointer-events-none" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">{device.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full flex-shrink-0">
                        {device.wattage}W
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {device.device_type || device.type} • {device.location}
                    </div>
                  </div>
                  <BoltIcon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-blue-400' : 'text-muted-foreground'}`} />
                </label>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
