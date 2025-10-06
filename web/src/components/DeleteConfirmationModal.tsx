import { useState } from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { 
  ExclamationTriangleIcon, 
  TrashIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  CheckCircleIcon,
  ChevronDownIcon as ChevronDownIconOutline
} from '@heroicons/react/24/outline'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  logsToDelete: any[]
  totalKwh?: number
  totalCost?: number
  onConfirm: (options: DeleteOptions) => void
  onCancel: () => void
  onExport?: () => void
  calculateCost?: (log: any) => number // Function to calculate individual log cost
}

export interface DeleteOptions {
  mode: 'soft' | 'permanent'
  recoveryDays: number
  skipRecovery: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  logsToDelete,
  totalKwh: propTotalKwh,
  totalCost: propTotalCost,
  onConfirm,
  onCancel,
  onExport,
  calculateCost
}: DeleteConfirmationModalProps) {
  const [deletionMode, setDeletionMode] = useState<'soft' | 'permanent'>('soft')
  const [recoveryDays, setRecoveryDays] = useState(30)
  const [skipRecovery, setSkipRecovery] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [showDeviceBreakdown, setShowDeviceBreakdown] = useState(false)

  if (!isOpen) return null

  // Use passed totals if available (accurate from filter), otherwise calculate
  const totalKwh = propTotalKwh ?? logsToDelete.reduce((sum, log) => sum + (log.total_kwh || 0), 0)
  const totalCost = propTotalCost ?? logsToDelete.reduce((sum, log) => sum + (log.total_cost || log.calculated_cost || 0), 0)
  const logCount = logsToDelete.length

  // Calculate device breakdown
  type DeviceStats = { count: number; kwh: number; cost: number }
  const deviceBreakdown = logsToDelete.reduce((acc, log) => {
    const deviceName = log.device_name || 'Unknown Device'
    if (!acc[deviceName]) {
      acc[deviceName] = { count: 0, kwh: 0, cost: 0 }
    }
    acc[deviceName].count++
    acc[deviceName].kwh += log.total_kwh || 0
    // Use calculateCost function if provided, otherwise try stored values
    acc[deviceName].cost += calculateCost ? calculateCost(log) : (log.total_cost || log.calculated_cost || 0)
    return acc
  }, {} as Record<string, DeviceStats>)

  const deviceBreakdownArray = Object.entries(deviceBreakdown).sort((a, b) => (b[1] as DeviceStats).count - (a[1] as DeviceStats).count)

  const requiresTyping = deletionMode === 'permanent' || skipRecovery || logCount > 50
  const requiredText = deletionMode === 'permanent' || skipRecovery ? 'PERMANENT DELETE' : 'DELETE'
  const isConfirmValid = !requiresTyping || confirmText === requiredText

  const handleConfirm = () => {
    if (!isConfirmValid) return

    onConfirm({
      mode: deletionMode,
      recoveryDays: skipRecovery ? 0 : recoveryDays,
      skipRecovery
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="energy-card bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-red-500/50 rounded-2xl shadow-2xl shadow-red-500/20 max-w-2xl w-full my-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 p-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Delete Confirmation</h3>
              <p className="text-sm text-slate-400">Review before deleting</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-6">
        
        {/* Filter Match Confirmation */}
        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl mb-4">
          <div className="text-sm text-blue-300 mb-3 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5" />
            ✓ Matches your filtered selection
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-400">Logs</div>
              <div className="text-2xl font-bold text-red-400">{logCount}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Energy</div>
              <div className="text-xl font-bold text-orange-400">{totalKwh.toFixed(1)} kWh</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Cost</div>
              <div className="text-xl font-bold text-green-400">${totalCost.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Device Breakdown */}
        {deviceBreakdownArray.length >= 1 && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowDeviceBreakdown(!showDeviceBreakdown)}
              className="flex items-center justify-between w-full text-sm font-semibold text-slate-300 hover:text-slate-200 mb-2"
            >
              <span className="flex items-center gap-2">
                {deviceBreakdownArray.length === 1 
                  ? `📊 Device Details (${deviceBreakdownArray[0][0]})`
                  : `📊 Breakdown by Device (${deviceBreakdownArray.length} devices)`
                }
              </span>
              <ChevronDownIconOutline className={`w-4 h-4 transition-transform ${showDeviceBreakdown ? 'rotate-180' : ''}`} />
            </button>

            {showDeviceBreakdown && (
              <div className="bg-slate-800/50 border border-slate-600 p-4 rounded-lg space-y-2">
                {deviceBreakdownArray.map(([deviceName, stats]) => {
                  const deviceStats = stats as DeviceStats
                  return (
                    <div key={deviceName} className="flex items-center justify-between text-sm py-2 border-b border-slate-700 last:border-0">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-200">{deviceName}</div>
                        <div className="text-xs text-slate-400">{deviceStats.count} log{deviceStats.count > 1 ? 's' : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-orange-400 font-mono">{deviceStats.kwh.toFixed(2)} kWh</div>
                        <div className="text-green-400 font-mono text-xs">${deviceStats.cost.toFixed(2)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Deletion Mode */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-3">Deletion Mode</label>
          <div className="space-y-3">
            <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              deletionMode === 'soft' 
                ? 'bg-blue-500/20 border-blue-400 shadow-lg shadow-blue-500/20' 
                : 'bg-slate-800/50 border-slate-600 hover:border-slate-500'
            }`}>
              <input
                type="radio"
                checked={deletionMode === 'soft'}
                onChange={() => {
                  setDeletionMode('soft')
                  setSkipRecovery(false)
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-blue-400" />
                  Soft Delete (Recoverable)
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  Logs will be hidden but can be restored within the recovery period
                </div>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              deletionMode === 'permanent' 
                ? 'bg-red-500/20 border-red-400 shadow-lg shadow-red-500/20' 
                : 'bg-slate-800/50 border-slate-600 hover:border-slate-500'
            }`}>
              <input
                type="radio"
                checked={deletionMode === 'permanent'}
                onChange={() => setDeletionMode('permanent')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <TrashIcon className="w-5 h-5 text-red-400" />
                  Permanent Delete
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  ⚠️ Logs will be deleted immediately and CANNOT be recovered
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Advanced Options for Soft Delete */}
        {deletionMode === 'soft' && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-400 hover:text-blue-300 font-semibold mb-3"
            >
              {showAdvanced ? '▼' : '▶'} Advanced Options
            </button>

            {showAdvanced && (
              <div className="bg-slate-800/50 border border-slate-600 p-4 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Recovery Period
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 7, 30, 90].map(days => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setRecoveryDays(days)}
                        className={`px-3 py-2 rounded-lg border-2 transition-all font-bold text-sm ${
                          recoveryDays === days
                            ? 'bg-blue-500 border-blue-400 text-white'
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {days} day{days > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Input
                      type="number"
                      value={recoveryDays}
                      onChange={(e) => setRecoveryDays(parseInt(e.target.value) || 30)}
                      min={1}
                      max={365}
                      className="w-full"
                      placeholder="Custom days"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipRecovery}
                    onChange={(e) => setSkipRecovery(e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-yellow-300">Skip recovery period (delete immediately)</div>
                    <div className="text-xs text-yellow-400">⚠️ This will permanently delete logs now</div>
                  </div>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Export Option */}
        {onExport && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-blue-300">💾 Backup before deleting?</div>
                <div className="text-sm text-blue-400">Export these logs to CSV first</div>
              </div>
              <Button
                onClick={onExport}
                variant="outline"
                className="border-blue-400 text-blue-300 hover:bg-blue-500/20"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-slate-400 hover:text-slate-300 font-semibold mb-2"
          >
            {showDetails ? '▼' : '▶'} Show Details ({logCount} logs)
            {logCount > 100 && <span className="text-xs text-yellow-400 ml-2">(showing first 100)</span>}
          </button>

          {showDetails && (
            <div className="bg-slate-800/50 border border-slate-600 p-4 rounded-lg max-h-60 overflow-y-auto">
              <div className="space-y-2">
                {logsToDelete.slice(0, 100).map((log, idx) => (
                  <div key={idx} className="text-xs text-slate-300 flex items-center gap-2 py-1">
                    <span>{log.usage_date}</span>
                    <span>•</span>
                    <span>{log.device_name || 'Unknown Device'}</span>
                    <span>•</span>
                    <span>{log.total_kwh?.toFixed(2)} kWh</span>
                    <span>•</span>
                    <span>${calculateCost ? calculateCost(log).toFixed(2) : '0.00'}</span>
                  </div>
                ))}
                {logCount > 100 && (
                  <div className="text-xs text-yellow-400 text-center pt-2 border-t border-slate-600">
                    ... and {logCount - 100} more logs
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Input */}
        {requiresTyping && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
            <label className="block text-sm font-semibold text-yellow-300 mb-2">
              Type "{requiredText}" to confirm:
            </label>
            <Input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={requiredText}
              className="w-full font-mono"
            />
          </div>
        )}

        {/* Warning */}
        <div className="mb-6 bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
          <div className="text-sm text-red-300 font-semibold">
            {deletionMode === 'permanent' || skipRecovery
              ? '⚠️ THIS ACTION CANNOT BE UNDONE'
              : `ℹ️ Logs can be restored from "Deleted Logs" page within ${recoveryDays} days`
            }
          </div>
        </div>
        </div>

        {/* Actions - Sticky Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-700 flex-shrink-0 bg-slate-900/50">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmValid}
            className={`flex-1 font-bold ${
              deletionMode === 'permanent' || skipRecovery
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
            } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {deletionMode === 'permanent' || skipRecovery
              ? `🗑️ Permanently Delete ${logCount} Logs`
              : `🕒 Soft Delete ${logCount} Logs`
            }
          </Button>
        </div>
      </div>
    </div>
  )
}
