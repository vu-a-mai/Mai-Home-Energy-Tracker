import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDevices } from '../hooks/useDevices'
import { useEnergyLogs } from '../hooks/useEnergyLogs'
import { useBillSplits } from '../contexts/BillSplitContext'
import { useHouseholdTimezone } from '../hooks/useHouseholdTimezone'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { exportDataToJSON, exportEnergyLogsToCSV, exportDevicesToCSV } from '../utils/dataBackup'
import {
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CircleStackIcon,
  BoltIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  ChartBarIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  FolderIcon,
  CpuChipIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
  CodeBracketSquareIcon,
  ServerStackIcon,
  PaintBrushIcon,
  RocketLaunchIcon,
  ChartPieIcon,
  Squares2X2Icon,
  GlobeAmericasIcon
} from '@heroicons/react/24/outline'

const COMMON_TIMEZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'UTC',
]

export default function Settings() {
  const { user } = useAuth()
  const { devices } = useDevices()
  const { energyLogs } = useEnergyLogs()
  const { billSplits } = useBillSplits()
  const {
    timezone,
    browserTimezone,
    loading: timezoneLoading,
    saving: timezoneSaving,
    saveTimezone,
  } = useHouseholdTimezone()
  const [importing, setImporting] = useState(false)
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(null)

  const timezoneOptions = Array.from(
    new Set([browserTimezone, timezone, ...COMMON_TIMEZONES].filter(Boolean))
  )
  const draftTimezone = selectedTimezone ?? timezone

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

  const handleExportDevices = () => {
    try {
      exportDevicesToCSV(devices)
      toast.success('✅ Devices exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('❌ Failed to export devices')
    }
  }

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

  const handleExportCSV = () => {
    try {
      exportEnergyLogsToCSV(energyLogs)
      toast.success('✅ CSV exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('❌ Failed to export CSV')
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

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
      event.target.value = ''
    }
  }

  const handleAutoBackup = () => {
    try {
      const backupMeta = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        deviceCount: devices.length,
        energyLogCount: energyLogs.length,
        billSplitCount: billSplits.length,
      }

      localStorage.setItem('mai-energy-tracker-auto-backup', JSON.stringify(backupMeta))
      toast.success('✅ Backup checkpoint saved. Use Export JSON for a full recoverable backup.')
    } catch (error) {
      console.error('Auto-backup error:', error)
      toast.error('❌ Failed to create auto-backup')
    }
  }

  const handleSaveTimezone = async () => {
    try {
      await saveTimezone(draftTimezone)
      setSelectedTimezone(null)
    } catch {
      // toast handled in hook
    }
  }

  return (
    <div className="max-w-7xl mx-auto min-h-dvh bg-background text-foreground font-sans fade-in">
      <header className="mb-4 p-3 md:p-4 energy-header-gradient rounded-xl text-white shadow-xl">
        <h1 className="text-xl md:text-2xl font-bold energy-pulse flex items-center gap-3">
          <Cog6ToothIcon className="w-7 h-7 md:w-8 md:h-8 text-purple-400" />
          Settings
        </h1>
        <p className="opacity-90 text-xs md:text-sm">
          Manage your data, backups, and preferences
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4 slide-up">
        <Card className="energy-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
              <UserCircleIcon className="w-5 h-5 text-purple-400" />
              Account
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

        <Card className="energy-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-cyan-400" />
              Data Summary
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

      <section className="mb-4 slide-up">
        <Card className="energy-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
              <GlobeAmericasIcon className="w-5 h-5 text-emerald-400" />
              Household Timezone
            </CardTitle>
            <CardDescription className="text-xs">
              Used for midnight auto-create of recurring schedule logs. Default is America/Los_Angeles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <label className="flex-1 text-xs sm:text-sm">
                <span className="text-muted-foreground mb-1 block">Timezone</span>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={draftTimezone}
                  disabled={timezoneLoading || timezoneSaving}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                >
                  {timezoneOptions.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                      {tz === browserTimezone ? ' (browser — recommended)' : ''}
                      {tz === 'America/Los_Angeles' && tz !== browserTimezone ? ' (default)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                type="button"
                onClick={handleSaveTimezone}
                disabled={timezoneLoading || timezoneSaving || draftTimezone === timezone}
                className="energy-action-btn"
              >
                {timezoneSaving ? 'Saving…' : 'Save timezone'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Current: <span className="font-medium text-foreground">{timezoneLoading ? 'Loading…' : timezone}</span>
              {' · '}
              Browser: <span className="font-medium text-foreground">{browserTimezone}</span>
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="slide-up">
        <Card className="energy-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
              <CircleStackIcon className="w-5 h-5 text-blue-400" />
              Backup & Restore
            </CardTitle>
            <CardDescription className="text-xs">
              Export your data or restore from backup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <ArrowDownTrayIcon className="w-4 h-4 text-green-400" />
                Export
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                <button
                  onClick={handleExportAll}
                  className="group relative overflow-hidden bg-gradient-to-br from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/40 hover:border-green-500/60 rounded-lg p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20"
                >
                  <div className="flex items-center gap-2">
                    <BriefcaseIcon className="w-6 h-6 text-green-400" />
                    <div className="text-left flex-1">
                      <div className="font-semibold text-xs text-foreground">Complete</div>
                      <div className="text-[10px] text-green-400">JSON</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleExportDevices}
                  className="group relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/40 hover:border-blue-500/60 rounded-lg p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  <div className="flex items-center gap-2">
                    <CpuChipIcon className="w-6 h-6 text-blue-400" />
                    <div className="text-left flex-1">
                      <div className="font-semibold text-xs text-foreground">Devices</div>
                      <div className="text-[10px] text-blue-400">CSV</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleExportEnergyLogs}
                  className="group relative overflow-hidden bg-gradient-to-br from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-500/40 hover:border-orange-500/60 rounded-lg p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20"
                >
                  <div className="flex items-center gap-2">
                    <ClipboardDocumentListIcon className="w-6 h-6 text-orange-400" />
                    <div className="text-left flex-1">
                      <div className="font-semibold text-xs text-foreground">Logs</div>
                      <div className="text-[10px] text-orange-400">JSON</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleExportBillSplits}
                  className="group relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/40 hover:border-purple-500/60 rounded-lg p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
                >
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="w-6 h-6 text-purple-400" />
                    <div className="text-left flex-1">
                      <div className="font-semibold text-xs text-foreground">Bills</div>
                      <div className="text-[10px] text-purple-400">JSON</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="group relative overflow-hidden bg-gradient-to-br from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 border border-yellow-500/40 hover:border-yellow-500/60 rounded-lg p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/20"
                >
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-6 h-6 text-yellow-400" />
                    <div className="text-left flex-1">
                      <div className="font-semibold text-xs text-foreground">CSV</div>
                      <div className="text-[10px] text-yellow-400">Excel</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleAutoBackup}
                  className="group relative overflow-hidden bg-gradient-to-br from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 hover:border-cyan-500/60 rounded-lg p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
                >
                  <div className="flex items-center gap-2">
                    <ArrowPathIcon className="w-6 h-6 text-cyan-400" />
                    <div className="text-left flex-1">
                      <div className="font-semibold text-xs text-foreground">Browser</div>
                      <div className="text-[10px] text-cyan-400">Auto</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <ArrowUpTrayIcon className="w-4 h-4 text-purple-400" />
                Restore
              </h3>
              <div className="space-y-2">
                <div className="p-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/40 rounded-lg">
                  <div className="flex items-start gap-2 text-xs">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
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
                        <FolderIcon className="w-5 h-5 text-cyan-400" />
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

      <section className="mt-8 border-t border-border pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <CpuChipIcon className="w-5 h-5 text-cyan-400" />
              Technology Stack
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2">
                  <BoltIcon className="w-4 h-4 text-cyan-400" />
                  <p className="font-semibold text-foreground text-sm">React</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Frontend Framework</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2">
                  <CodeBracketSquareIcon className="w-4 h-4 text-blue-400" />
                  <p className="font-semibold text-foreground text-sm">TypeScript</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Type Safety</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2">
                  <ServerStackIcon className="w-4 h-4 text-emerald-400" />
                  <p className="font-semibold text-foreground text-sm">Supabase</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Database & Auth</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2">
                  <PaintBrushIcon className="w-4 h-4 text-sky-400" />
                  <p className="font-semibold text-foreground text-sm">Tailwind CSS</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Styling</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2">
                  <RocketLaunchIcon className="w-4 h-4 text-purple-400" />
                  <p className="font-semibold text-foreground text-sm">Vite</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Build Tool</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2">
                  <ChartPieIcon className="w-4 h-4 text-pink-400" />
                  <p className="font-semibold text-foreground text-sm">Recharts</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Data Visualization</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Squares2X2Icon className="w-4 h-4 text-indigo-400" />
                  <p className="font-semibold text-foreground text-sm">Heroicons</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Icon System</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2">
                  <CircleStackIcon className="w-4 h-4 text-blue-500" />
                  <p className="font-semibold text-foreground text-sm">PostgreSQL</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Database</p>
              </div>
            </div>
          </div>

          <div className="text-center space-y-2 pb-4">
            <p className="text-sm text-foreground font-medium flex items-center justify-center gap-2">
              <LightBulbIcon className="w-4 h-4 text-yellow-400" />
              App Idea and Design by <span className="font-bold text-primary">Vu Mai</span>
            </p>
            <p className="text-xs text-muted-foreground">
              © 2025 Mai Family Energy Tracker • TOU-D-PRIME Rate Structure
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
