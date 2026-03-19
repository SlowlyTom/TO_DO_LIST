import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { Task, TaskHistory } from '../types'

export type AutoCompleteResult = {
  autoCompletedSubCat?: { id: number; name: string; categoryId: number }
  autoCompletedCat?: { id: number; name: string }
}

export function useTasks(subCategoryId: number | null) {
  const tasks = useLiveQuery(
    () => subCategoryId != null
      ? db.tasks.where('subCategoryId').equals(subCategoryId).filter((t) => t.archivedAt == null).sortBy('order')
      : Promise.resolve([] as Task[]),
    [subCategoryId]
  )
  return tasks ?? []
}

export function useTasksByProject(projectId: number | null) {
  return useLiveQuery(
    () => projectId != null
      ? db.tasks.where('projectId').equals(projectId).filter((t) => t.archivedAt == null).toArray()
      : Promise.resolve([] as Task[]),
    [projectId]
  ) ?? []
}

export function useAllTasks() {
  return useLiveQuery(
    () => db.tasks.orderBy('createdAt').filter((t) => t.archivedAt == null).toArray(),
    []
  ) ?? []
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

function computeNextDueDate(currentDueDate: string | null, intervalDays: number): string | null {
  if (!currentDueDate) return null
  const d = new Date(currentDueDate)
  d.setDate(d.getDate() + intervalDays)
  return d.toISOString().split('T')[0]
}

function getRecurrenceIntervalDays(cfg: import('../types').RecurrenceConfig): number {
  switch (cfg.type) {
    case 'WEEKLY': return 7
    case 'BIWEEKLY': return 14
    case 'MONTHLY': return 30
    case 'CUSTOM': return cfg.intervalDays
  }
}

export function useTaskMutations() {
  async function createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'issueUrl' | 'order'> & { issueUrl?: string; order?: number }) {
    const now = new Date().toISOString()
    let order = data.order
    if (order === undefined) {
      const count = await db.tasks.where('subCategoryId').equals(data.subCategoryId).filter((t) => t.archivedAt == null).count()
      order = count
    }
    const normalized: Omit<Task, 'id'> = {
      ...data,
      dueDate: data.dueDate ?? null,
      issueUrl: data.issueUrl ?? '',
      order,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    }
    return db.tasks.add(normalized)
  }

  async function updateTask(id: number, data: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<AutoCompleteResult> {
    const existing = await db.tasks.get(id)
    if (!existing) return {}

    const now = new Date().toISOString()
    const fields = Object.keys(data) as (keyof typeof data)[]
    let result: AutoCompleteResult = {}

    await db.transaction('rw', db.tasks, db.taskHistory, db.subCategories, db.categories, async () => {
      await db.tasks.update(id, { ...data, updatedAt: now })

      // 반복 태스크: DONE으로 변경되면 다음 회차 자동 생성
      if (data.status === 'DONE' && existing.recurrence) {
        const cfg = existing.recurrence
        await db.tasks.add({
          ...existing,
          id: undefined,
          status: 'TODO',
          progress: 0,
          checklist: existing.checklist.map((item) => ({ ...item, done: false })),
          blockedBy: [],
          dueDate: computeNextDueDate(existing.dueDate, getRecurrenceIntervalDays(cfg)),
          archivedAt: null,
          createdAt: now,
          updatedAt: now,
        })
      }

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

      // Auto-complete logic: if status changed to/from DONE
      if ('status' in data) {
        const newStatus = data.status

        const subCat = await db.subCategories.get(existing.subCategoryId)
        if (subCat) {
          const siblingTasks = await db.tasks
            .where('subCategoryId').equals(existing.subCategoryId)
            .filter((t) => t.id !== id && t.archivedAt == null)
            .toArray()
          const allSiblingsDone = siblingTasks.every((t) => t.status === 'DONE')

          if (newStatus === 'DONE' && allSiblingsDone && subCat.status !== 'COMPLETED') {
            await db.subCategories.update(subCat.id!, { status: 'COMPLETED', updatedAt: now })
            result.autoCompletedSubCat = { id: subCat.id!, name: subCat.name, categoryId: subCat.categoryId }

            const cat = await db.categories.get(subCat.categoryId)
            if (cat) {
              const siblingSubCats = await db.subCategories
                .where('categoryId').equals(subCat.categoryId)
                .filter((s) => s.id !== subCat.id! && s.archivedAt == null)
                .toArray()
              const allSubCatsDone = siblingSubCats.every((s) => s.status === 'COMPLETED')

              if (allSubCatsDone && cat.status !== 'COMPLETED') {
                await db.categories.update(cat.id!, { status: 'COMPLETED', updatedAt: now })
                result.autoCompletedCat = { id: cat.id!, name: cat.name }
              }
            }
          } else if (newStatus !== 'DONE') {
            if (subCat.status === 'COMPLETED') {
              await db.subCategories.update(subCat.id!, { status: 'ACTIVE', updatedAt: now })
            }
            const cat = await db.categories.get(existing.categoryId)
            if (cat && cat.status === 'COMPLETED') {
              await db.categories.update(cat.id!, { status: 'ACTIVE', updatedAt: now })
            }
          }
        }
      }
    })

    return result
  }

  async function deleteTask(id: number) {
    await db.transaction('rw', db.tasks, db.taskHistory, async () => {
      await db.taskHistory.where('taskId').equals(id).delete()
      await db.tasks.delete(id)
    })
  }

  async function archiveTask(id: number) {
    return db.tasks.update(id, { archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  }

  async function restoreTask(id: number) {
    return db.tasks.update(id, { archivedAt: null, updatedAt: new Date().toISOString() })
  }

  async function bulkUpdateTasks(ids: number[], data: Partial<Omit<Task, 'id' | 'createdAt'>>) {
    const now = new Date().toISOString()
    await db.transaction('rw', db.tasks, async () => {
      for (const id of ids) {
        await db.tasks.update(id, { ...data, updatedAt: now })
      }
    })
  }

  async function bulkArchiveTasks(ids: number[]) {
    const now = new Date().toISOString()
    await db.transaction('rw', db.tasks, async () => {
      for (const id of ids) {
        await db.tasks.update(id, { archivedAt: now, updatedAt: now })
      }
    })
  }

  async function bulkDeleteTasks(ids: number[]) {
    await db.transaction('rw', db.tasks, db.taskHistory, async () => {
      for (const id of ids) {
        await db.taskHistory.where('taskId').equals(id).delete()
        await db.tasks.delete(id)
      }
    })
  }

  async function reorderTasks(orderedIds: number[]) {
    const now = new Date().toISOString()
    await db.transaction('rw', db.tasks, async () => {
      await Promise.all(orderedIds.map((id, i) => db.tasks.update(id, { order: i, updatedAt: now })))
    })
  }

  return { createTask, updateTask, deleteTask, archiveTask, restoreTask, bulkUpdateTasks, bulkArchiveTasks, bulkDeleteTasks, reorderTasks }
}
