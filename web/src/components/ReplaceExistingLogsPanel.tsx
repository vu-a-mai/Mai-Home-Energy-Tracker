interface ExistingLogPreview {
  usage_date: string
  start_time?: string
  end_time?: string
}

interface ReplaceExistingLogsPanelProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  loading?: boolean
  existingLogs?: ExistingLogPreview[]
}

export function ReplaceExistingLogsPanel({
  checked,
  onCheckedChange,
  loading = false,
  existingLogs = [],
}: ReplaceExistingLogsPanelProps) {
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="mt-0.5 w-4 h-4 cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-yellow-300 group-hover:text-yellow-200 transition-colors">
            Replace existing logs
          </div>
          <div className="text-xs text-yellow-400 mt-1">
            This will delete and recreate any logs that already exist for these dates.
          </div>
        </div>
      </label>

      {checked && (
        <div className="mt-3">
          {loading ? (
            <div className="text-xs text-yellow-300">Loading existing logs…</div>
          ) : existingLogs.length === 0 ? (
            <div className="text-xs text-slate-400">No matching existing logs found.</div>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              <div className="text-xs text-yellow-300 mb-1">
                {existingLogs.length} existing log{existingLogs.length === 1 ? '' : 's'} will be replaced:
              </div>
              {existingLogs.map((log, index) => (
                <div
                  key={`${log.usage_date}-${log.start_time}-${index}`}
                  className="text-xs text-slate-300 bg-slate-900/60 border border-slate-700 rounded px-2 py-1"
                >
                  {log.usage_date}
                  {log.start_time && log.end_time ? ` · ${log.start_time}–${log.end_time}` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
