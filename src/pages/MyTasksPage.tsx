import { useState, useMemo } from 'react'
import { useAllTasks, useTaskMutations } from '../hooks/useTasks'
import { useAppSettings } from '../hooks/useAppSettings'
import { useUiStore } from '../stores/uiStore'
import { TaskSlideover } from '../features/tasks/TaskSlideover'
import { StatusBadge, PriorityBadge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'
import { ProgressBar } from '../components/ui/ProgressBar'
import { ShowCompletedToggle } from '../components/ui/ShowCompletedToggle'
import { sortTasks } from '../utils/taskSort'
import type { TaskStatus, TaskPriority } from '../types'

const statusFilterOptions = [
  { value: '', label: '전체 상태' },
  { value: 'TODO', label: 'TODO' },
  { value: 'IN_PROGRESS', label: '진행중' },
  { value: 'DONE', label: '완료' },
]

const priorityFilterOptions = [
  { value: '', label: '전체 우선순위' },
  { value: 'CRITICAL', label: '긴급' },
  { value: 'HIGH', label: '높음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'LOW', label: '낮음' },
]

const sortOptions = [
  { value: 'dueDate', label: '마감일 순' },
  { value: 'priority', label: '우선순위 순' },
  { value: 'createdAt', label: '생성일 순' },
  { value: 'progress', label: '진척율 순' },
  { value: 'title', label: '제목 순' },
]

const bulkStatusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'TODO로 변경' },
  { value: 'IN_PROGRESS', label: '진행중으로 변경' },
  { value: 'DONE', label: '완료로 변경' },
]

const bulkPriorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'CRITICAL', label: '긴급으로 변경' },
  { value: 'HIGH', label: '높음으로 변경' },
  { value: 'MEDIUM', label: '보통으로 변경' },
  { value: 'LOW', label: '낮음으로 변경' },
]

export default function MyTasksPage() {
  const tasks = useAllTasks()
  const { openTaskSlideover, showCompleted, selectedTaskIds, toggleSelectedTask, clearSelectedTasks, selectAllTasks } = useUiStore()
  const { bulkUpdateTasks, bulkArchiveTasks, bulkDeleteTasks, restoreTask } = useTaskMutations()
  const { addToast } = useUiStore()
  const { currentUserName } = useAppSettings()

  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('')
  const [sortBy, setSortBy] = useState('dueDate')
  const [dueDateFilter, setDueDateFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [myTasksOnly, setMyTasksOnly] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const t of tasks) {
      for (const tag of (t.tags ?? [])) set.add(tag)
    }
    return [...set].sort()
  }, [tasks])

  const filtered = useMemo(() => {
    let result = [...tasks]

    if (!showCompleted && !statusFilter) result = result.filter((t) => t.status !== 'DONE')
    if (statusFilter) result = result.filter((t) => t.status === statusFilter)
    if (priorityFilter) result = result.filter((t) => t.priority === priorityFilter)

    if (dueDateFilter === 'overdue') result = result.filter((t) => t.dueDate != null && t.dueDate < today)
    else if (dueDateFilter === 'today') result = result.filter((t) => t.dueDate === today)
    else if (dueDateFilter === 'week') {
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      result = result.filter((t) => t.dueDate != null && t.dueDate >= today && t.dueDate <= nextWeek)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      )
    }

    if (tagFilter) {
      result = result.filter((t) => (t.tags ?? []).includes(tagFilter))
    }

    if (myTasksOnly && currentUserName) {
      result = result.filter((t) => t.assignee === currentUserName)
    }

    return sortTasks(result, sortBy)
  }, [tasks, statusFilter, priorityFilter, sortBy, dueDateFilter, today, showCompleted, searchQuery, tagFilter, myTasksOnly, currentUserName])

  function dueDateClass(dueDate: string | null) {
    if (!dueDate) return 'text-gray-400'
    if (dueDate < today) return 'text-red-600 font-medium'
    const diff = (new Date(dueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    if (diff <= 3) return 'text-orange-500 font-medium'
    return 'text-gray-400'
  }

  const selectedCount = selectedTaskIds.length
  const allFilteredIds = filtered.map((t) => t.id!)
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedTaskIds.includes(id))

  async function handleBulkStatus(status: TaskStatus) {
    await bulkUpdateTasks(selectedTaskIds, { status })
    clearSelectedTasks()
  }

  async function handleBulkPriority(priority: TaskPriority) {
    await bulkUpdateTasks(selectedTaskIds, { priority })
    clearSelectedTasks()
  }

  async function handleBulkArchive() {
    const ids = [...selectedTaskIds]
    await bulkArchiveTasks(ids)
    clearSelectedTasks()
    addToast(`${ids.length}개 ACTION을 보관했습니다.`, {
      label: '되돌리기',
      onClick: async () => { await Promise.all(ids.map((id) => restoreTask(id))) },
    })
  }

  async function handleBulkDelete() {
    const ids = [...selectedTaskIds]
    await bulkDeleteTasks(ids)
    clearSelectedTasks()
    addToast(`${ids.length}개 ACTION을 삭제했습니다.`)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">내 ACTION</h1>
        <ShowCompletedToggle />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-5">
        <div className="flex flex-wrap gap-3 mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제목/설명 검색..."
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
          />
          <Select
            value={statusFilter}
            options={statusFilterOptions}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
            className="w-36"
          />
          <Select
            value={priorityFilter}
            options={priorityFilterOptions}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
            className="w-40"
          />
          <Select
            value={dueDateFilter}
            options={[
              { value: '', label: '전체 기간' },
              { value: 'overdue', label: '기한 초과' },
              { value: 'today', label: '오늘 마감' },
              { value: 'week', label: '이번 주' },
            ]}
            onChange={(e) => setDueDateFilter(e.target.value)}
            className="w-36"
          />
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="">전체 태그</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
          {currentUserName && (
            <button
              onClick={() => setMyTasksOnly(!myTasksOnly)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                myTasksOnly
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              내 ACTION만
            </button>
          )}
          <div className="ml-auto">
            <Select
              value={sortBy}
              options={sortOptions}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-36"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400">
          {filtered.length}개 ACTION
          {myTasksOnly && currentUserName && <span className="ml-1 text-blue-500">· {currentUserName}</span>}
        </p>
      </div>

      {/* Bulk action toolbar */}
      {selectedCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-blue-700">{selectedCount}개 선택됨</span>
          <div className="flex flex-wrap gap-2">
            <select
              className="text-xs border border-blue-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              defaultValue=""
              onChange={(e) => { if (e.target.value) handleBulkStatus(e.target.value as TaskStatus) }}
            >
              <option value="" disabled>상태 변경</option>
              {bulkStatusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              className="text-xs border border-blue-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              defaultValue=""
              onChange={(e) => { if (e.target.value) handleBulkPriority(e.target.value as TaskPriority) }}
            >
              <option value="" disabled>우선순위 변경</option>
              {bulkPriorityOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              onClick={handleBulkArchive}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
            >
              보관
            </button>
            <button
              onClick={handleBulkDelete}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 transition-colors"
            >
              삭제
            </button>
          </div>
          <button onClick={clearSelectedTasks} className="ml-auto text-xs text-blue-500 hover:text-blue-700">
            선택 해제
          </button>
        </div>
      )}

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          해당하는 ACTION이 없습니다.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                <th className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => allSelected ? clearSelectedTasks() : selectAllTasks(allFilteredIds)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">상태</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">제목</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">우선순위</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">마감일</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-32">진척율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filtered.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => openTaskSlideover(task.id!)}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${task.status === 'DONE' ? 'opacity-60' : ''} ${selectedTaskIds.includes(task.id!) ? 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40' : ''}`}
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.includes(task.id!)}
                      onChange={() => toggleSelectedTask(task.id!)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                  <td className={`px-4 py-3 text-sm text-gray-800 dark:text-gray-200 max-w-xs ${task.status === 'DONE' ? 'line-through text-gray-400' : ''}`}>
                    <div className="truncate">{task.title}</div>
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {task.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                  <td className={`px-4 py-3 text-xs ${dueDateClass(task.dueDate)}`}>
                    {task.dueDate || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <ProgressBar value={task.progress} showLabel size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskSlideover />
    </div>
  )
}
