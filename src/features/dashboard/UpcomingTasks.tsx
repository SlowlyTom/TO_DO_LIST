import { useAllTasks } from '../../hooks/useTasks'
import { useUiStore } from '../../stores/uiStore'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge'

export function UpcomingTasks() {
  const tasks = useAllTasks()
  const { openTaskSlideover } = useUiStore()

  const today = new Date().toISOString().slice(0, 10)

  const upcoming = tasks
    .filter((t) => t.status !== 'DONE' && t.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 10)

  function dueDateClass(dueDate: string) {
    if (dueDate < today) return 'text-red-600 font-semibold'
    const diff = (new Date(dueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    if (diff <= 3) return 'text-orange-500 font-medium'
    return 'text-gray-400'
  }

  if (upcoming.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">기한 임박 태스크</h2>
        <p className="text-sm text-gray-400">기한이 설정된 미완료 태스크가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-800 mb-3">기한 임박 태스크</h2>
      <ul className="divide-y divide-gray-50">
        {upcoming.map((task) => (
          <li
            key={task.id}
            onClick={() => openTaskSlideover(task.id!)}
            className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-gray-50 rounded-lg px-1 -mx-1 transition-colors"
          >
            <StatusBadge status={task.status} />
            <span className="flex-1 text-sm text-gray-700 truncate">{task.title}</span>
            <PriorityBadge priority={task.priority} />
            <span className={`text-xs ${dueDateClass(task.dueDate)}`}>{task.dueDate}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
