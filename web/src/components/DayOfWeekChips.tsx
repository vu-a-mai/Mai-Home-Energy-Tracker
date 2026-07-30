export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
] as const

interface DayOfWeekChipsProps {
  value: number[]
  onChange: (days: number[]) => void
  label?: string
}

export function DayOfWeekChips({ value, onChange, label = 'Days of Week *' }: DayOfWeekChipsProps) {
  const toggleDay = (day: number) => {
    onChange(
      value.includes(day)
        ? value.filter((d) => d !== day)
        : [...value, day].sort((a, b) => a - b)
    )
  }

  return (
    <div>
      <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {DAYS_OF_WEEK.map((day) => (
          <button
            key={day.value}
            type="button"
            onClick={() => toggleDay(day.value)}
            className={`px-3 sm:px-4 py-2 rounded-lg border-2 transition-all font-bold text-sm ${
              value.includes(day.value)
                ? 'bg-cyan-500 border-cyan-400 text-white shadow-xl shadow-cyan-500/60 scale-105'
                : 'bg-slate-900/80 border-slate-700/50 text-slate-500 hover:bg-slate-800 hover:border-slate-600 hover:text-slate-300'
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>
      <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => onChange([1, 2, 3, 4, 5])}
          className="px-3 py-1.5 text-xs font-semibold bg-blue-500/20 border border-blue-500/40 text-blue-300 rounded-md hover:bg-blue-500/30 hover:border-blue-500/60 transition-all"
        >
          Weekdays
        </button>
        <button
          type="button"
          onClick={() => onChange([0, 6])}
          className="px-3 py-1.5 text-xs font-semibold bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-md hover:bg-purple-500/30 hover:border-purple-500/60 transition-all"
        >
          Weekends
        </button>
        <button
          type="button"
          onClick={() => onChange([0, 1, 2, 3, 4, 5, 6])}
          className="px-3 py-1.5 text-xs font-semibold bg-green-500/20 border border-green-500/40 text-green-300 rounded-md hover:bg-green-500/30 hover:border-green-500/60 transition-all"
        >
          Every Day
        </button>
      </div>
    </div>
  )
}
