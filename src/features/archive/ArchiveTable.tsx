import type { ArchiveItem, ArchiveItemType } from '../../hooks/useArchive'

const typeBadgeClass: Record<ArchiveItemType, string> = {
  PROJECT: 'bg-purple-100 text-purple-700',
  EPIC:    'bg-indigo-100 text-indigo-700',
  TASK:    'bg-blue-100 text-blue-700',
  ACTION:  'bg-teal-100 text-teal-700',
}

interface ArchiveTableProps {
  items: ArchiveItem[]
  onRestore: (item: ArchiveItem) => void
  onDelete: (item: ArchiveItem) => void
}

export function ArchiveTable({ items, onRestore, onDelete }: ArchiveTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        보관된 항목이 없습니다.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">유형</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">이름</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">프로젝트</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">보관일</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">작업</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((item) => (
            <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${typeBadgeClass[item.type]}`}>
                  {item.type}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{item.name}</td>
              <td className="px-4 py-3 text-xs text-gray-400">{item.projectName || '—'}</td>
              <td className="px-4 py-3 text-xs text-gray-400">{item.archivedAt.slice(0, 10)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onRestore(item)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    복원
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    title="영구 삭제"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
