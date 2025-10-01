import { useState, useRef } from 'react'
import { Button } from './ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { 
  exportDataToJSON, 
  exportEnergyLogsToCSV, 
  exportDevicesToCSV,
  parseBackupFile,
  createAutoBackup,
  getAutoBackup,
  getAutoBackupTimestamp,
  clearAutoBackup,
  type BackupData
} from '../utils/dataBackup'
import type { Device } from '../contexts/DeviceContext'
import type { EnergyLog } from '../contexts/EnergyLogsContext'

interface BackupRestoreProps {
  devices: Device[]
  energyLogs: EnergyLog[]
  householdId: string
  onRestore: (data: BackupData) => Promise<void>
}

export function BackupRestore({ devices, energyLogs, householdId, onRestore }: BackupRestoreProps) {
  const [showBackupPanel, setShowBackupPanel] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const autoBackupTimestamp = getAutoBackupTimestamp()

  const handleExportJSON = () => {
    exportDataToJSON(devices, energyLogs, householdId)
  }

  const handleExportEnergyLogsCSV = () => {
    exportEnergyLogsToCSV(energyLogs)
  }

  const handleExportDevicesCSV = () => {
    exportDevicesToCSV(devices)
  }

  const handleCreateAutoBackup = () => {
    const result = createAutoBackup(devices, energyLogs, householdId)
    setRestoreMessage({ type: 'success', text: result })
    setTimeout(() => setRestoreMessage(null), 3000)
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setRestoring(true)
    setRestoreMessage(null)

    try {
      const backupData = await parseBackupFile(file)
      
      // Confirm before restoring
      const confirmed = window.confirm(
        `This will restore:\n` +
        `- ${backupData.devices.length} devices\n` +
        `- ${backupData.energyLogs.length} energy logs\n\n` +
        `From backup dated: ${new Date(backupData.timestamp).toLocaleString()}\n\n` +
        `Are you sure you want to proceed?`
      )

      if (!confirmed) {
        setRestoring(false)
        return
      }

      // Create auto-backup before restore
      createAutoBackup(devices, energyLogs, householdId)

      // Perform restore
      await onRestore(backupData)

      setRestoreMessage({
        type: 'success',
        text: `Successfully restored ${backupData.devices.length} devices and ${backupData.energyLogs.length} energy logs!`
      })
    } catch (error) {
      console.error('Restore error:', error)
      setRestoreMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to restore backup'
      })
    } finally {
      setRestoring(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRestoreAutoBackup = async () => {
    const backup = getAutoBackup()
    if (!backup) {
      setRestoreMessage({ type: 'error', text: 'No auto-backup found' })
      return
    }

    const confirmed = window.confirm(
      `Restore from auto-backup?\n\n` +
      `Created: ${new Date(backup.timestamp).toLocaleString()}\n` +
      `Devices: ${backup.devices.length}\n` +
      `Energy Logs: ${backup.energyLogs.length}`
    )

    if (!confirmed) return

    setRestoring(true)
    try {
      await onRestore(backup)
      setRestoreMessage({
        type: 'success',
        text: 'Successfully restored from auto-backup!'
      })
    } catch (error) {
      setRestoreMessage({
        type: 'error',
        text: 'Failed to restore from auto-backup'
      })
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="mb-4">
      <Button
        onClick={() => setShowBackupPanel(!showBackupPanel)}
        variant="outline"
        className="mb-4"
      >
        {showBackupPanel ? '🔽 Hide' : '💾 Backup & Restore'}
      </Button>

      {showBackupPanel && (
        <Card className="energy-card mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Data Backup & Restore</CardTitle>
            <CardDescription>
              Export your data to prevent loss, or restore from a previous backup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  📤 Export Data
                </h3>
                <div className="space-y-2">
                  <Button
                    onClick={handleExportJSON}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    📄 Export Complete Backup (JSON)
                  </Button>
                  <p className="text-xs text-muted-foreground ml-4">
                    Full backup including devices and energy logs. Use this for restore.
                  </p>

                  <Button
                    onClick={handleExportEnergyLogsCSV}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    📊 Export Energy Logs (CSV)
                  </Button>
                  <p className="text-xs text-muted-foreground ml-4">
                    Spreadsheet format for analysis in Excel/Google Sheets.
                  </p>

                  <Button
                    onClick={handleExportDevicesCSV}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    🔌 Export Devices (CSV)
                  </Button>
                  <p className="text-xs text-muted-foreground ml-4">
                    List of all devices in spreadsheet format.
                  </p>
                </div>
              </div>

              {/* Restore Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  📥 Restore Data
                </h3>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={restoring}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    {restoring ? '⏳ Restoring...' : '📂 Restore from File'}
                  </Button>
                  <p className="text-xs text-muted-foreground ml-4">
                    Upload a JSON backup file to restore your data.
                  </p>

                  {autoBackupTimestamp && (
                    <>
                      <Button
                        onClick={handleRestoreAutoBackup}
                        disabled={restoring}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        🔄 Restore Auto-Backup
                      </Button>
                      <p className="text-xs text-muted-foreground ml-4">
                        Last auto-backup: {new Date(autoBackupTimestamp).toLocaleString()}
                      </p>
                    </>
                  )}

                  <Button
                    onClick={handleCreateAutoBackup}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    💾 Create Auto-Backup
                  </Button>
                  <p className="text-xs text-muted-foreground ml-4">
                    Save a backup to browser storage for emergency recovery.
                  </p>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {restoreMessage && (
              <div className={`mt-4 p-3 rounded-lg ${
                restoreMessage.type === 'success' 
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                  : 'bg-red-500/20 border border-red-500/50 text-red-400'
              }`}>
                {restoreMessage.text}
              </div>
            )}

            {/* Warning */}
            <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <p className="text-xs text-yellow-400">
                ⚠️ <strong>Important:</strong> Restoring will replace your current data. 
                An auto-backup will be created before restore for safety.
              </p>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{devices.length}</div>
                <div className="text-xs text-muted-foreground">Devices</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{energyLogs.length}</div>
                <div className="text-xs text-muted-foreground">Energy Logs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
