import type { RecurrenceConfig, RecurrenceType } from '../../types'

const recurrenceOptions: { value: RecurrenceType; label: string }[] = [
  { value: 'WEEKLY', label: '매주' },
  { value: 'BIWEEKLY', label: '격주' },
  { value: 'MONTHLY', label: '매월' },
  { value: 'CUSTOM', label: '직접입력' },
]

interface RecurrenceSectionProps {
  value: RecurrenceConfig | null
  onChange: (v: RecurrenceConfig | null) => void
}

function getIntervalDays(cfg: RecurrenceConfig | null): number {
  if (!cfg) return 7
  if (cfg.type === 'CUSTOM') return cfg.intervalDays
  return 7
}

export function RecurrenceSection({ value, onChange }: RecurrenceSectionProps) {
  const enabled = value !== null
  const selectedType = value?.type ?? 'WEEKLY'
  const intervalDays = getIntervalDays(value)

  function handleToggle() {
    if (enabled) {
      onChange(null)
    } else {
      onChange({ type: 'WEEKLY' })
    }
  }

  function handleTypeChange(type: RecurrenceType) {
    if (type === 'CUSTOM') {
      onChange({ type: 'CUSTOM', intervalDays: intervalDays > 0 ? intervalDays : 1 })
    } else {
      onChange({ type } as RecurrenceConfig)
    }
  }

  function handleCustomDays(days: number) {
    if (days < 1) return
    onChange({ type: 'CUSTOM', intervalDays: days })
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={handleToggle}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">반복 설정</span>
      </label>
      {enabled && (
        <div className="pl-6 space-y-2">
          <select
            value={selectedType}
            onChange={(e) => handleTypeChange(e.target.value as RecurrenceType)}
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
          >
            {recurrenceOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {selectedType === 'CUSTOM' && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={intervalDays}
                onChange={(e) => handleCustomDays(Number(e.target.value))}
                className="w-20 text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">일마다</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function recurrenceLabel(cfg: RecurrenceConfig): string {
  switch (cfg.type) {
    case 'WEEKLY': return '매주 반복'
    case 'BIWEEKLY': return '격주 반복'
    case 'MONTHLY': return '매월 반복'
    case 'CUSTOM': return `${cfg.intervalDays}일마다 반복`
  }
}
