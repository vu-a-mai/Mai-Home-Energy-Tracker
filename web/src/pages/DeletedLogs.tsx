import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { useDemoMode } from '../contexts/DemoContext'
import { supabase } from '../lib/supabase'
import type { EnergyLog } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  TrashIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { parseLocalDate } from '../utils/dateUtils'

type DeletedLog = EnergyLog & {
  devices?: { name?: string; wattage?: number } | null
}

export default function DeletedLogs() {
  const { isDemoMode } = useDemoMode()
  const [logs, setLogs] = useState<DeletedLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (isDemoMode) {
      setLogs([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('energy_logs')
        .select(`
          *,
          devices:device_id (
            name,
            wattage
          )
        `)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

      if (error) throw error

      setLogs(
        (data || []).map((log) => ({
          ...log,
          device_name: log.devices?.name,
          device_wattage: log.devices?.wattage,
        }))
      )
      setSelected(new Set())
    } catch (err) {
      console.error('Failed to load deleted logs:', err)
      toast.error('Failed to load deleted logs')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [isDemoMode])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === logs.length) setSelected(new Set())
    else setSelected(new Set(logs.map((l) => l.id)))
  }

  const handleRestore = async () => {
    if (selected.size === 0) return
    try {
      setBusy(true)
      const { data, error } = await supabase.rpc('restore_energy_logs', {
        p_log_ids: Array.from(selected),
      })
      if (error) throw error
      const count = Array.isArray(data)
        ? data[0]?.restored_count ?? selected.size
        : (data as { restored_count?: number } | null)?.restored_count ?? selected.size
      toast.success(`Restored ${count} log(s)`)
      await refresh()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to restore logs')
    } finally {
      setBusy(false)
    }
  }

  const handlePermanentDelete = async () => {
    if (selected.size === 0) return
    if (!window.confirm(`Permanently delete ${selected.size} log(s)? This cannot be undone.`)) {
      return
    }
    try {
      setBusy(true)
      const { error } = await supabase.rpc('permanent_delete_energy_logs', {
        p_log_ids: Array.from(selected),
      })
      if (error) throw error
      toast.success(`Permanently deleted ${selected.size} log(s)`)
      await refresh()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to permanently delete')
    } finally {
      setBusy(false)
    }
  }

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return parseLocalDate(value).toLocaleDateString()
    }
    return new Date(value).toLocaleString()
  }

  return (
    <div className="max-w-7xl mx-auto min-h-dvh bg-background text-foreground font-sans fade-in">
      <header className="mb-4 p-3 md:p-4 energy-header-gradient rounded-xl text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <TrashIcon className="w-7 h-7 text-orange-300" />
              Deleted Logs
            </h1>
            <p className="opacity-90 text-xs md:text-sm mt-1">
              Soft-deleted sessions available for restore until their recovery window ends.
            </p>
          </div>
          <Link
            to="/logs"
            className="inline-flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Logs
          </Link>
        </div>
      </header>

      {isDemoMode ? (
        <Card className="energy-card">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Demo mode hard-deletes logs immediately, so there is nothing to restore here.
            Exit demo and use a live account to try soft-delete recovery.
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="text-muted-foreground p-8 text-center">Loading deleted logs…</div>
      ) : logs.length === 0 ? (
        <Card className="energy-card">
          <CardContent className="p-6 text-sm text-muted-foreground text-center">
            No deleted logs in the recovery window.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
              {selected.size === logs.length ? 'Clear selection' : 'Select all'}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleRestore}
              disabled={busy || selected.size === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Restore ({selected.size})
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handlePermanentDelete}
              disabled={busy || selected.size === 0}
              className="border-red-500/50 text-red-300 hover:bg-red-500/10"
            >
              <TrashIcon className="w-4 h-4 mr-1" />
              Delete forever
            </Button>
          </div>

          <div className="space-y-2">
            {logs.map((log) => (
              <Card key={log.id} className="energy-card">
                <CardContent className="p-3 sm:p-4 flex gap-3 items-start">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected.has(log.id)}
                    onChange={() => toggle(log.id)}
                    aria-label={`Select ${log.device_name || 'log'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm sm:text-base truncate">
                      {log.device_name || 'Unknown device'}
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mt-1">
                      <span>Used {formatDate(log.usage_date)}</span>
                      <span>
                        {log.start_time}–{log.end_time}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        Deleted {formatDate(log.deleted_at)}
                      </span>
                      {log.permanent_delete_at && (
                        <span>
                          Permanent after {formatDate(log.permanent_delete_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs sm:text-sm shrink-0">
                    <div>{(log.total_kwh ?? 0).toFixed(2)} kWh</div>
                    <div className="text-muted-foreground">
                      ${(log.calculated_cost ?? 0).toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
