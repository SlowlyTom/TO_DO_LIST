import type { ArchiveItemType } from '../../hooks/useArchive'

interface ArchiveFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  typeFilter: ArchiveItemType | ''
  onTypeChange: (v: ArchiveItemType | '') => void
  projectFilter: number | ''
  onProjectChange: (v: number | '') => void
  projectOptions: { id: number; name: string }[]
  sortBy: string
  onSortChange: (v: string) => void
}

const typeOptions: { value: ArchiveItemType | ''; label: string }[] = [
  { value: '', label: '전체 유형' },
  { value: 'PROJECT', label: 'PROJECT' },
  { value: 'EPIC', label: 'EPIC' },
  { value: 'TASK', label: 'TASK' },
  { value: 'ACTION', label: 'ACTION' },
]

const sortOptions = [
  { value: 'archivedAt_desc', label: '최신 보관순' },
  { value: 'archivedAt_asc', label: '오래된 보관순' },
  { value: 'name_asc', label: '이름순' },
]

export function ArchiveFilters({
  search, onSearchChange,
  typeFilter, onTypeChange,
  projectFilter, onProjectChange,
  projectOptions,
  sortBy, onSortChange,
}: ArchiveFiltersProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="검색..."
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
        />
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value as ArchiveItemType | '')}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        >
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={projectFilter}
          onChange={(e) => onProjectChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="">전체 프로젝트</option>
          {projectOptions.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="ml-auto">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
