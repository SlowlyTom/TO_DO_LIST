import { useAllTasks } from '../../hooks/useTasks'
import { useProjects } from '../../hooks/useProjects'
import { useUiStore } from '../../stores/uiStore'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge'

export function UpcomingTasks() {
  const tasks = useAllTasks()
  const { projects } = useProjects()
  const { openTaskSlideover } = useUiStore()

  const today = new Date().toISOString().slice(0, 10)

  const projectMap = new Map(projects.map((p) => [p.id!, p.name]))

  const upcoming = tasks
    .filter((t) => t.status !== 'DONE' && t.dueDate != null)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 10)

  function dueDateClass(dueDate: string | null) {
    if (!dueDate) return 'text-gray-400'
    if (dueDate < today) return 'text-red-600 dark:text-red-400 font-semibold'
    const diff = (new Date(dueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    if (diff <= 3) return 'text-orange-500 dark:text-orange-400 font-medium'
    return 'text-gray-400 dark:text-gray-500'
  }

  if (upcoming.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">기한 임박 태스크</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500">기한이 설정된 미완료 태스크가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">기한 임박 태스크</h2>
      <ul className="divide-y divide-gray-50 dark:divide-gray-700">
        {upcoming.map((task) => (
          <li
            key={task.id}
            onClick={() => openTaskSlideover(task.id!)}
            className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-1 -mx-1 transition-colors"
          >
            <StatusBadge status={task.status} />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-700 dark:text-gray-200 truncate block">{task.title}</span>
              {projectMap.has(task.projectId) && (
                <span className="text-xs text-gray-400 dark:text-gray-500 truncate block">
                  {projectMap.get(task.projectId)}
                </span>
              )}
            </div>
            <PriorityBadge priority={task.priority} />
            <span className={`text-xs flex-shrink-0 ${dueDateClass(task.dueDate)}`}>{task.dueDate ?? '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
