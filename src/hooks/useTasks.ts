import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { Task, TaskHistory } from '../types'

export function useTasks(subCategoryId: number | null) {
  const tasks = useLiveQuery(
    () => subCategoryId != null
      ? db.tasks.where('subCategoryId').equals(subCategoryId).toArray()
      : Promise.resolve([] as Task[]),
    [subCategoryId]
  )
  return tasks ?? []
}

export function useTasksByProject(projectId: number | null) {
  return useLiveQuery(
    () => projectId != null
      ? db.tasks.where('projectId').equals(projectId).toArray()
      : Promise.resolve([] as Task[]),
    [projectId]
  ) ?? []
}

export function useAllTasks() {
  return useLiveQuery(() => db.tasks.orderBy('createdAt').toArray(), []) ?? []
}

export function useTask(taskId: number | null) {
  return useLiveQuery(
    () => taskId != null ? db.tasks.get(taskId) : undefined,
    [taskId]
  )
}

export function useTaskHistory(taskId: number | null) {
  return useLiveQuery(
    () => taskId != null
      ? db.taskHistory.where('taskId').equals(taskId).reverse().sortBy('changedAt')
      : Promise.resolve([] as TaskHistory[]),
    [taskId]
  ) ?? []
}

export function useTaskMutations() {
  async function createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    return db.tasks.add({ ...data, createdAt: now, updatedAt: now })
  }

  async function updateTask(id: number, data: Partial<Omit<Task, 'id' | 'createdAt'>>) {
    const existing = await db.tasks.get(id)
    if (!existing) return

    const now = new Date().toISOString()
    const fields = Object.keys(data) as (keyof typeof data)[]

    await db.transaction('rw', db.tasks, db.taskHistory, async () => {
      await db.tasks.update(id, { ...data, updatedAt: now })

      for (const field of fields) {
        if (field === 'updatedAt') continue
        const oldVal = existing[field as keyof Task]
        const newVal = data[field as keyof typeof data]
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          await db.taskHistory.add({
            taskId: id,
            field: field as string,
            oldValue: JSON.stringify(oldVal),
            newValue: JSON.stringify(newVal),
            changedAt: now,
          })
        }
      }
    })
  }

  async function deleteTask(id: number) {
    await db.transaction('rw', db.tasks, db.taskHistory, async () => {
      await db.taskHistory.where('taskId').equals(id).delete()
      await db.tasks.delete(id)
    })
  }

  return { createTask, updateTask, deleteTask }
}
