import type { RecurrenceConfig, RecurrenceType } from '../../types'

const recurrenceOptions: { value: RecurrenceType; label: string; intervalDays: number }[] = [
  { value: 'WEEKLY', label: '매주', intervalDays: 7 },
  { value: 'BIWEEKLY', label: '격주', intervalDays: 14 },
  { value: 'MONTHLY', label: '매월', intervalDays: 30 },
  { value: 'CUSTOM', label: '직접입력', intervalDays: 1 },
]

interface RecurrenceSectionProps {
  value: RecurrenceConfig | null
  onChange: (v: RecurrenceConfig | null) => void
}

export function RecurrenceSection({ value, onChange }: RecurrenceSectionProps) {
  const enabled = value !== null
  const selectedType = value?.type ?? 'WEEKLY'
  const intervalDays = value?.intervalDays ?? 7

  function handleToggle() {
    if (enabled) {
      onChange(null)
    } else {
      onChange({ type: 'WEEKLY', intervalDays: 7 })
    }
  }

  function handleTypeChange(type: RecurrenceType) {
    const preset = recurrenceOptions.find((o) => o.value === type)
    if (!preset) return
    if (type === 'CUSTOM') {
      onChange({ type: 'CUSTOM', intervalDays: intervalDays })
    } else {
      onChange({ type, intervalDays: preset.intervalDays })
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
        <span className="text-sm font-medium text-gray-700">반복 설정</span>
      </label>
      {enabled && (
        <div className="pl-6 space-y-2">
          <select
            value={selectedType}
            onChange={(e) => handleTypeChange(e.target.value as RecurrenceType)}
            className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
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
                className="w-20 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">일마다</span>
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
