import { useState, useMemo } from 'react'
import { useAllTasks } from '../hooks/useTasks'
import { useUiStore } from '../stores/uiStore'
import { TaskSlideover } from '../features/tasks/TaskSlideover'
import { StatusBadge, PriorityBadge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'
import { ProgressBar } from '../components/ui/ProgressBar'
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
]

const priorityOrder: Record<TaskPriority, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

export default function MyTasksPage() {
  const tasks = useAllTasks()
  const { openTaskSlideover } = useUiStore()
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('')
  const [sortBy, setSortBy] = useState('dueDate')
  const [dueDateFilter, setDueDateFilter] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  const filtered = useMemo(() => {
    let result = [...tasks]

    if (statusFilter) result = result.filter((t) => t.status === statusFilter)
    if (priorityFilter) result = result.filter((t) => t.priority === priorityFilter)
    if (dueDateFilter === 'overdue') result = result.filter((t) => t.dueDate && t.dueDate < today)
    else if (dueDateFilter === 'today') result = result.filter((t) => t.dueDate === today)
    else if (dueDateFilter === 'week') {
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      result = result.filter((t) => t.dueDate >= today && t.dueDate <= nextWeek)
    }

    result.sort((a, b) => {
      if (sortBy === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority]
      if (sortBy === 'progress') return b.progress - a.progress
      if (sortBy === 'createdAt') return b.createdAt.localeCompare(a.createdAt)
      // dueDate — tasks without dueDate go last
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    })

    return result
  }, [tasks, statusFilter, priorityFilter, sortBy, dueDateFilter, today])

  function dueDateClass(dueDate: string) {
    if (!dueDate) return 'text-gray-400'
    if (dueDate < today) return 'text-red-600 font-medium'
    const diff = (new Date(dueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    if (diff <= 3) return 'text-orange-500 font-medium'
    return 'text-gray-400'
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5">내 태스크</h1>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
        <div className="flex flex-wrap gap-3">
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
          <div className="ml-auto">
            <Select
              value={sortBy}
              options={sortOptions}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-36"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">{filtered.length}개 태스크</p>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          해당하는 태스크가 없습니다.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">상태</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">제목</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">우선순위</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">마감일</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">진척율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => openTaskSlideover(task.id!)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-800 max-w-xs truncate">{task.title}</td>
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
