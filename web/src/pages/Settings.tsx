import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useDevices } from '../hooks/useDevices'
import { useEnergyLogs } from '../hooks/useEnergyLogs'
import { useBillSplits } from '../contexts/BillSplitContext'
import { useTemplates } from '../hooks/useTemplates'
import { useRecurringSchedules } from '../hooks/useRecurringSchedules'
import { useHouseholdUsers } from '../hooks/useHouseholdUsers'
import { useHouseholdTimezone } from '../hooks/useHouseholdTimezone'
import { useHouseholdRole } from '../hooks/useHouseholdRole'
import { useDemoMode } from '../contexts/DemoContext'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import {
  exportDataToJSON,
  exportEnergyLogsToCSV,
  exportDevicesToCSV,
  parseBackupFile,
  importHouseholdBackup,
} from '../utils/dataBackup'
import {
  acceptHouseholdInvite,
  createHouseholdInvite,
  listHouseholdInvites,
  revokeHouseholdInvite,
  type HouseholdInvite,
} from '../services/inviteService'
import {
  invitePath,
  isValidInviteCodeFormat,
  normalizeInviteCode,
} from '../utils/householdAccess'
import {
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CircleStackIcon,
  UserCircleIcon,
  ChartBarIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CpuChipIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
  GlobeAmericasIcon,
  UserGroupIcon,
  LinkIcon,
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
  const { isDemoMode } = useDemoMode()
  const { devices, addDevice, refreshDevices } = useDevices()
  const { energyLogs, addEnergyLog, refreshEnergyLogs } = useEnergyLogs()
  const { billSplits } = useBillSplits()
  const { templates, addTemplate, refreshTemplates } = useTemplates()
  const { schedules, addSchedule, refreshSchedules } = useRecurringSchedules()
  const { users: householdUsers } = useHouseholdUsers()
  const {
    role,
    canEdit,
    isOwner,
    refresh: refreshRole,
  } = useHouseholdRole()
  const {
    timezone,
    browserTimezone,
    loading: timezoneLoading,
    saving: timezoneSaving,
    saveTimezone,
  } = useHouseholdTimezone()
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(null)
  const [showAbout, setShowAbout] = useState(false)
  const [importing, setImporting] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [invites, setInvites] = useState<HouseholdInvite[]>([])
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [loadingInvites, setLoadingInvites] = useState(false)

  const timezoneOptions = Array.from(
    new Set([browserTimezone, timezone, ...COMMON_TIMEZONES].filter(Boolean))
  )
  const draftTimezone = selectedTimezone ?? timezone
  const exportHouseholdId = devices[0]?.household_id || user?.id || 'unknown'

  const refreshInvites = useCallback(async () => {
    if (isDemoMode || !isOwner) {
      setInvites([])
      return
    }
    setLoadingInvites(true)
    try {
      const rows = await listHouseholdInvites()
      setInvites(rows.filter((row) => !row.revoked_at && new Date(row.expires_at) > new Date()))
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingInvites(false)
    }
  }, [isDemoMode, isOwner])

  useEffect(() => {
    void refreshInvites()
  }, [refreshInvites])

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      setJoinCode(normalizeInviteCode(code))
    }
  }, [searchParams])

  const handleJoinHousehold = async () => {
    const code = normalizeInviteCode(joinCode)
    if (!isValidInviteCodeFormat(code)) {
      toast.error('Enter a valid invite code')
      return
    }
    if (isDemoMode) {
      toast.error('Switch out of demo mode to join a live household')
      return
    }
    setJoining(true)
    try {
      const result = await acceptHouseholdInvite(code)
      if (result.joined) {
        toast.success(`Joined household as ${result.role}`)
      } else {
        toast.info('You are already in that household')
      }
      setJoinCode('')
      setSearchParams({})
      await refreshRole()
      window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join household')
    } finally {
      setJoining(false)
    }
  }

  const handleCreateInvite = async () => {
    if (isDemoMode) {
      toast.error('Invites are unavailable in demo mode')
      return
    }
    setCreatingInvite(true)
    try {
      const invite = await createHouseholdInvite({ role: inviteRole })
      const path = invitePath(invite.code)
      const shareUrl = `${window.location.origin}${path}`
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast.success(`Invite ${invite.code} created and link copied`)
      } catch {
        toast.success(`Invite created: ${invite.code}`)
      }
      await refreshInvites()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create invite')
    } finally {
      setCreatingInvite(false)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await revokeHouseholdInvite(inviteId)
      toast.success('Invite revoked')
      await refreshInvites()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke invite')
    }
  }

  const handleCopyInvite = async (code: string) => {
    const shareUrl = `${window.location.origin}${invitePath(code)}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Invite link copied')
    } catch {
      toast.info(shareUrl)
    }
  }

  const handleExportAll = () => {
    try {
      if (!user?.id) {
        toast.error('User not found')
        return
      }
      exportDataToJSON(devices, energyLogs, exportHouseholdId, {
        templates,
        schedules,
        billSplits,
      })
      toast.success('Household data exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export backup')
    }
  }

  const handleExportDevices = () => {
    try {
      exportDevicesToCSV(devices)
      toast.success('Devices exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export devices')
    }
  }

  const handleExportEnergyLogs = () => {
    try {
      if (!user?.id) {
        toast.error('User not found')
        return
      }
      exportDataToJSON([], energyLogs, user.id)
      toast.success('Energy logs exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export energy logs')
    }
  }

  const handleExportBillSplits = useCallback(() => {
    try {
      const dataStr = JSON.stringify(billSplits, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bill-splits-backup-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Bill splits exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export bill splits')
    }
  }, [billSplits])

  const handleExportCSV = () => {
    try {
      exportEnergyLogsToCSV(energyLogs)
      toast.success('CSV exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export CSV')
    }
  }

  const handleImportClick = () => {
    importInputRef.current?.click()
  }

  const handleImportFile = async (file: File | null) => {
    if (!file) return
    setImporting(true)
    try {
      const backup = await parseBackupFile(file)
      const deviceCount = backup.devices.length
      const logCount = backup.energyLogs.length
      const templateCount = Array.isArray(backup.templates) ? backup.templates.length : 0
      const scheduleCount = Array.isArray(backup.schedules) ? backup.schedules.length : 0
      const confirmed = window.confirm(
        `Merge import into this household?\n\n` +
          `Devices: ${deviceCount}\n` +
          `Logs: ${logCount}\n` +
          `Templates: ${templateCount}\n` +
          `Schedules: ${scheduleCount}\n\n` +
          `Matching devices are reused. Bill splits are not imported (user IDs differ across households).`
      )
      if (!confirmed) return

      const result = await importHouseholdBackup(backup, {
        existingDevices: devices,
        knownUserIds: householdUsers.map((u) => u.id),
        addDevice,
        addEnergyLog,
        addTemplate,
        addSchedule,
      })

      await Promise.all([
        refreshDevices(false),
        refreshEnergyLogs(),
        refreshTemplates(),
        refreshSchedules(),
      ])

      toast.success(
        `Imported ${result.devicesCreated} devices (${result.devicesReused} reused), ` +
          `${result.logsImported} logs, ${result.templatesImported} templates, ` +
          `${result.schedulesImported} schedules`
      )
      if (result.errors.length > 0) {
        toast.message(`${result.errors.length} item(s) had issues`, {
          description: result.errors.slice(0, 3).join(' · '),
        })
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import backup')
    } finally {
      setImporting(false)
      if (importInputRef.current) importInputRef.current.value = ''
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
          Household members, invites, timezone, and data export
        </p>
      </header>

      {!canEdit && !isDemoMode && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          You have <span className="font-semibold">viewer</span> access — you can browse data but not change devices, logs, or settings.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 slide-up">
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
              <span className="text-muted-foreground">Role</span>
              <span className="font-semibold text-foreground capitalize">{role || (isDemoMode ? 'owner' : '—')}</span>
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
              <UserGroupIcon className="w-5 h-5 text-violet-400" />
              Household
            </CardTitle>
            <CardDescription className="text-xs">
              Members, invite links, and joining another household.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Members</div>
              {householdUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members loaded.</p>
              ) : (
                householdUsers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">{member.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{member.email}</div>
                    </div>
                    <span className="shrink-0 text-xs font-medium capitalize rounded-full border border-border px-2 py-0.5">
                      {member.household_role || 'editor'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {isOwner && !isDemoMode && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5" />
                  Invite links
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                  <label className="flex-1 text-xs sm:text-sm">
                    <span className="text-muted-foreground mb-1 block">Role for invitees</span>
                    <select
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                    >
                      <option value="editor">Editor (can add logs &amp; devices)</option>
                      <option value="viewer">Viewer (read-only)</option>
                    </select>
                  </label>
                  <Button
                    type="button"
                    onClick={handleCreateInvite}
                    disabled={creatingInvite}
                    className="energy-action-btn"
                  >
                    {creatingInvite ? 'Creating…' : 'Create invite link'}
                  </Button>
                </div>
                {loadingInvites ? (
                  <p className="text-xs text-muted-foreground">Loading invites…</p>
                ) : invites.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No active invites.</p>
                ) : (
                  <div className="space-y-2">
                    {invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                      >
                        <div className="min-w-0 text-sm">
                          <div className="font-mono font-semibold tracking-wider">{invite.code}</div>
                          <div className="text-xs text-muted-foreground">
                            {invite.role} · {invite.use_count}/{invite.max_uses} uses · expires{' '}
                            {new Date(invite.expires_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button type="button" variant="outline" size="sm" onClick={() => handleCopyInvite(invite.code)}>
                            Copy link
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-500 hover:bg-red-500/10"
                            onClick={() => handleRevokeInvite(invite.id)}
                          >
                            Revoke
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 border-t border-border pt-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Join another household
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(normalizeInviteCode(e.target.value))}
                  placeholder="Invite code"
                  className="uppercase tracking-wider"
                  disabled={joining || isDemoMode}
                />
                <Button
                  type="button"
                  onClick={handleJoinHousehold}
                  disabled={joining || isDemoMode || !joinCode}
                  className="energy-action-btn shrink-0"
                >
                  {joining ? 'Joining…' : 'Join'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Solo owners can move freely. Owners of multi-member households must stay until ownership is sorted out.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

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
                  disabled={timezoneLoading || timezoneSaving || !canEdit}
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
                disabled={timezoneLoading || timezoneSaving || draftTimezone === timezone || !canEdit}
                className="energy-action-btn"
              >
                {timezoneSaving ? 'Saving…' : 'Save timezone'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground break-words">
              <span className="block sm:inline">
                Current: <span className="font-medium text-foreground">{timezoneLoading ? 'Loading…' : timezone}</span>
              </span>
              <span className="hidden sm:inline"> · </span>
              <span className="block sm:inline">
                Browser: <span className="font-medium text-foreground">{browserTimezone}</span>
              </span>
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="slide-up">
        <Card className="energy-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
              <CircleStackIcon className="w-5 h-5 text-blue-400" />
              Backup &amp; Export
            </CardTitle>
            <CardDescription className="text-xs">
              Export household JSON, then merge-import it later. Matching devices are reused; bill splits are skipped.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => handleImportFile(e.target.files?.[0] ?? null)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportAll}
                className="w-full group relative overflow-hidden bg-gradient-to-br from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/40 hover:border-green-500/60 rounded-lg p-4 transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-3">
                  <BriefcaseIcon className="w-8 h-8 text-green-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-foreground">Export household data</div>
                    <div className="text-xs text-green-400 mt-0.5 break-words">
                      JSON · devices, logs, templates, schedules, bill splits
                    </div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={handleImportClick}
                disabled={importing || !canEdit}
                className="w-full group relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/40 hover:border-blue-500/60 rounded-lg p-4 transition-all duration-300 text-left disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <ArrowUpTrayIcon className="w-8 h-8 text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-foreground">
                      {importing ? 'Importing…' : 'Import household data'}
                    </div>
                    <div className="text-xs text-blue-400 mt-0.5 break-words">
                      Merge JSON export into this household
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Other formats
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleExportDevices}
                className="group relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/40 hover:border-blue-500/60 rounded-lg p-3 transition-all duration-300"
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
                type="button"
                onClick={handleExportEnergyLogs}
                className="group relative overflow-hidden bg-gradient-to-br from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-500/40 hover:border-orange-500/60 rounded-lg p-3 transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <ClipboardDocumentListIcon className="w-6 h-6 text-orange-400" />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-xs text-foreground">Logs only</div>
                    <div className="text-[10px] text-orange-400">JSON</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportBillSplits}
                className="group relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/40 hover:border-purple-500/60 rounded-lg p-3 transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="w-6 h-6 text-purple-400" />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-xs text-foreground">Bills only</div>
                    <div className="text-[10px] text-purple-400">JSON</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="group relative overflow-hidden bg-gradient-to-br from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 border border-yellow-500/40 hover:border-yellow-500/60 rounded-lg p-3 transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-6 h-6 text-yellow-400" />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-xs text-foreground">Logs CSV</div>
                    <div className="text-[10px] text-yellow-400">Excel</div>
                  </div>
                </div>
              </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ArrowDownTrayIcon className="w-3.5 h-3.5 shrink-0" />
              Soft-deleted logs can be restored from Logs → Deleted Logs while they are in the recovery window.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setShowAbout((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
        >
          {showAbout ? 'Hide about' : 'About this app'}
        </button>
        {showAbout && (
          <div className="mt-3 text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1.5">
              <LightBulbIcon className="w-4 h-4 text-yellow-400" />
              Idea and design by <span className="font-semibold text-foreground">Vu Mai</span>
            </p>
            <p>React · TypeScript · Supabase · Tailwind · TOU-D-PRIME rates</p>
          </div>
        )}
      </section>
    </div>
  )
}
