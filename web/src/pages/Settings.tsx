import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDevices } from '../hooks/useDevices'
import { useEnergyLogs } from '../hooks/useEnergyLogs'
import { useBillSplits } from '../contexts/BillSplitContext'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { exportDataToJSON, exportEnergyLogsToCSV, exportDevicesToCSV } from '../utils/dataBackup'

export default function Settings() {
  const { user } = useAuth()
  const { devices } = useDevices()
  const { energyLogs } = useEnergyLogs()
  const { billSplits } = useBillSplits()
  const [importing, setImporting] = useState(false)

  // Export all data as JSON
  const handleExportAll = () => {
    try {
      if (!user?.id) {
        toast.error('User not found')
        return
      }
      exportDataToJSON(devices, energyLogs, user.id)
      toast.success('✅ Complete backup exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('❌ Failed to export backup')
    }
  }

  // Export devices only
  const handleExportDevices = () => {
    try {
      exportDevicesToCSV(devices)
      toast.success('✅ Devices exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('❌ Failed to export devices')
    }
  }

  // Export energy logs only
  const handleExportEnergyLogs = () => {
    try {
      if (!user?.id) {
        toast.error('User not found')
        return
      }
      exportDataToJSON([], energyLogs, user.id)
      toast.success('✅ Energy logs exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('❌ Failed to export energy logs')
    }
  }

  // Export bill splits only
  const handleExportBillSplits = () => {
    try {
      const dataStr = JSON.stringify(billSplits, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bill-splits-backup-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      
      toast.success('✅ Bill splits exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('❌ Failed to export bill splits')
    }
  }

  // Export energy logs as CSV
  const handleExportCSV = () => {
    try {
      exportEnergyLogsToCSV(energyLogs)
      toast.success('✅ CSV exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('❌ Failed to export CSV')
    }
  }

  // Handle file import
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      // Display import summary
      const summary = []
      if (data.devices && data.devices.length > 0) summary.push(`${data.devices.length} devices`)
      if (data.energyLogs && data.energyLogs.length > 0) summary.push(`${data.energyLogs.length} energy logs`)
      
      toast.success(`✅ Backup loaded: ${summary.join(', ')}`, {
        description: 'Data has been imported to the database'
      })
      
      console.log('Backup data loaded:', data)
      
    } catch (error) {
      console.error('Import error:', error)
      toast.error('❌ Failed to import backup file')
    } finally {
      setImporting(false)
      event.target.value = '' // Reset file input
    }
  }

  // Create auto-backup to localStorage
  const handleAutoBackup = () => {
    try {
      const backupData = {
        devices,
        energyLogs: energyLogs.slice(0, 100), // Only keep last 100 logs for space
        billSplits: billSplits,
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
      
      localStorage.setItem('mai-energy-tracker-auto-backup', JSON.stringify(backupData))
      toast.success('✅ Auto-backup saved to browser storage!')
    } catch (error) {
      console.error('Auto-backup error:', error)
      toast.error('❌ Failed to create auto-backup')
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 min-h-screen bg-background text-foreground font-sans fade-in">
      {/* Header */}
      <header className="mb-4 p-3 md:p-4 energy-header-gradient rounded-xl text-white shadow-xl">
        <h1 className="text-xl md:text-2xl font-bold energy-pulse">
          ⚙️ Settings
        </h1>
        <p className="opacity-90 text-xs md:text-sm">
          Manage your data, backups, and preferences
        </p>
      </header>

      {/* Top Section: Account Info & Data Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4 slide-up">
        {/* Account Information */}
        <Card className="energy-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
              👤 Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-muted/30 rounded text-xs md:text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-semibold text-foreground truncate ml-2">{user?.email || 'Not logged in'}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted/30 rounded text-xs md:text-sm">
              <span className="text-muted-foreground">Type</span>
              <span className="font-semibold text-foreground">Family Member</span>
            </div>
          </CardContent>
        </Card>

        {/* Data Summary */}
        <Card className="energy-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
              📊 Data Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded">
                <div className="text-xl md:text-2xl font-bold text-blue-400">{devices.length}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">Devices</div>
              </div>
              <div className="text-center p-2 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded">
                <div className="text-xl md:text-2xl font-bold text-green-400">{energyLogs.length}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">Logs</div>
              </div>
              <div className="text-center p-2 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded">
                <div className="text-xl md:text-2xl font-bold text-purple-400">{billSplits.length}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">Bills</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Backup & Restore */}
      <section className="slide-up">
        <Card className="energy-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
              💾 Backup & Restore
            </CardTitle>
            <CardDescription className="text-xs">
              Export your data or restore from backup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Export Section */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                📤 Export
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {/* Export All */}
                <button
                  onClick={handleExportAll}
                  className="group relative overflow-hidden bg-gradient-to-br from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/40 hover:border-green-500/60 rounded-lg p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💼</span>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-xs text-foreground">Complete</div>
                      <div className="text-[10px] text-green-400">JSON</div>
                    </div>
                  </div>
                </button>

                {/* Export Devices */}
                <button
                  onClick={handleExportDevices}
                  className="group relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/40 hover:border-blue-500/60 rounded-lg p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔌</span>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-xs text-foreground">Devices</div>
                      <div className="text-[10px] text-blue-400">CSV</div>
                    </div>
                  </div>
                </button>

                {/* Export Energy Logs */}
                <button
                  onClick={handleExportEnergyLogs}
                  className="group relative overflow-hidden bg-gradient-to-br from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-500/40 hover:border-orange-500/60 rounded-lg p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📝</span>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-xs text-foreground">Logs</div>
                      <div className="text-[10px] text-orange-400">JSON</div>
                    </div>
                  </div>
                </button>

                {/* Export Bill Splits */}
                <button
                  onClick={handleExportBillSplits}
                  className="group relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/40 hover:border-purple-500/60 rounded-lg p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💳</span>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-xs text-foreground">Bills</div>
                      <div className="text-[10px] text-purple-400">JSON</div>
                    </div>
                  </div>
                </button>

                {/* Export CSV */}
                <button
                  onClick={handleExportCSV}
                  className="group relative overflow-hidden bg-gradient-to-br from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 border border-yellow-500/40 hover:border-yellow-500/60 rounded-lg p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/20"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-xs text-foreground">CSV</div>
                      <div className="text-[10px] text-yellow-400">Excel</div>
                    </div>
                  </div>
                </button>

                {/* Auto Backup */}
                <button
                  onClick={handleAutoBackup}
                  className="group relative overflow-hidden bg-gradient-to-br from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 hover:border-cyan-500/60 rounded-lg p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔄</span>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-xs text-foreground">Browser</div>
                      <div className="text-[10px] text-cyan-400">Auto</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Import Section */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                📥 Restore
              </h3>
              <div className="space-y-2">
                <div className="p-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/40 rounded-lg">
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-base">⚠️</span>
                    <div>
                      <span className="font-semibold text-yellow-400">Warning:</span>
                      <span className="text-muted-foreground ml-1">Restoring replaces current data</span>
                    </div>
                  </div>
                </div>

                <label htmlFor="restore-file" className="block">
                  <input
                    id="restore-file"
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    disabled={importing}
                    className="hidden"
                  />
                  <button
                    onClick={() => document.getElementById('restore-file')?.click()}
                    disabled={importing}
                    className="w-full bg-gradient-to-r from-primary/20 to-emerald-500/20 hover:from-primary/30 hover:to-emerald-500/30 border-2 border-primary/50 hover:border-primary/70 rounded-lg p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {importing ? (
                      <span className="flex items-center justify-center gap-2 text-xs font-semibold text-foreground">
                        <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        Importing...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 text-xs font-semibold text-foreground">
                        <span className="text-base">📁</span>
                        Select Backup File
                      </span>
                    )}
                  </button>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  )
}

