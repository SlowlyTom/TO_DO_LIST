import { useState, useMemo } from 'react'
import { useArchivedItems, useArchiveMutations } from '../hooks/useArchive'
import { ArchiveFilters } from '../features/archive/ArchiveFilters'
import { ArchiveTable } from '../features/archive/ArchiveTable'
import { db } from '../db/database'
import { useLiveQuery } from 'dexie-react-hooks'
import type { ArchiveItem, ArchiveItemType } from '../hooks/useArchive'

export default function ArchivePage() {
  const items = useArchivedItems()
  const { restoreItem, permanentlyDelete, bulkPermanentlyDelete } = useArchiveMutations()

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ArchiveItemType | ''>('')
  const [projectFilter, setProjectFilter] = useState<number | ''>('')
  const [sortBy, setSortBy] = useState('archivedAt_desc')

  // Restore confirm state (parent archived scenario)
  const [restoreConfirm, setRestoreConfirm] = useState<ArchiveItem | null>(null)

  // Bulk delete double-confirm
  const [deleteAllStep, setDeleteAllStep] = useState(0)

  // Project list for filter dropdown
  const allProjects = useLiveQuery(() => db.projects.toArray(), []) ?? []

  const filtered = useMemo(() => {
    let result = [...items]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((i) => i.name.toLowerCase().includes(q) || (i.projectName ?? '').toLowerCase().includes(q))
    }
    if (typeFilter) result = result.filter((i) => i.type === typeFilter)
    if (projectFilter !== '') result = result.filter((i) => i.projectId === projectFilter)

    result.sort((a, b) => {
      if (sortBy === 'archivedAt_asc') return a.archivedAt.localeCompare(b.archivedAt)
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
      return b.archivedAt.localeCompare(a.archivedAt) // desc default
    })

    return result
  }, [items, search, typeFilter, projectFilter, sortBy])

  async function handleRestore(item: ArchiveItem) {
    if (item.parentArchivedAt) {
      // Parent is also archived — show confirmation modal
      setRestoreConfirm(item)
    } else {
      await restoreItem(item)
    }
  }

  async function handleDelete(item: ArchiveItem) {
    if (!confirm(`"${item.name}"을(를) 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return
    await permanentlyDelete(item)
  }

  async function handleDeleteAll() {
    if (deleteAllStep === 0) {
      setDeleteAllStep(1)
      return
    }
    if (deleteAllStep === 1) {
      await bulkPermanentlyDelete(filtered)
      setDeleteAllStep(0)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">보관함</h1>
          <p className="text-sm text-gray-500 mt-0.5">완료 및 보관된 항목을 관리합니다.</p>
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center gap-2">
            {deleteAllStep === 1 && (
              <span className="text-xs text-red-500">한 번 더 클릭하면 {filtered.length}개 영구 삭제</span>
            )}
            <button
              onClick={handleDeleteAll}
              onBlur={() => setDeleteAllStep(0)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                deleteAllStep === 1
                  ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                  : 'text-red-500 border-red-200 hover:bg-red-50'
              }`}
            >
              {deleteAllStep === 1 ? '확인: 전체 영구 삭제' : '전체 삭제'}
            </button>
          </div>
        )}
      </div>

      <ArchiveFilters
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        projectFilter={projectFilter}
        onProjectChange={setProjectFilter}
        projectOptions={allProjects.map((p) => ({ id: p.id!, name: p.name }))}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <p className="text-xs text-gray-400 mb-3">{filtered.length}개 항목</p>

      <ArchiveTable
        items={filtered}
        onRestore={handleRestore}
        onDelete={handleDelete}
      />

      {/* Restore confirmation modal for archived parent */}
      {restoreConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-gray-900 mb-2">상위 항목도 보관 중</h3>
            <p className="text-sm text-gray-500 mb-4">
              이 항목의 상위 항목도 보관함에 있습니다. 어떻게 복원하시겠습니까?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  // Restore only this item
                  await restoreItem(restoreConfirm)
                  setRestoreConfirm(null)
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                이 항목만 복원
              </button>
              <button
                onClick={() => setRestoreConfirm(null)}
                className="w-full px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
