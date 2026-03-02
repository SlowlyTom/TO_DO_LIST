import type { Task, TaskPriority } from '../types'

export const priorityOrder: Record<TaskPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
}

export function sortTasks(tasks: Task[], sortBy: string): Task[] {
  return [...tasks].sort((a, b) => {
    if (sortBy === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority]
    if (sortBy === 'progress') return b.progress - a.progress
    if (sortBy === 'createdAt') return b.createdAt.localeCompare(a.createdAt)
    if (sortBy === 'title') return a.title.localeCompare(b.title)
    // dueDate — tasks without dueDate go last
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return a.dueDate.localeCompare(b.dueDate)
  })
}
