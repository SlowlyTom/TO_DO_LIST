import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useUiStore } from '../stores/uiStore'
import type { Task, TaskHistory } from '../types'

export function useTasks(subCategoryId: number | null) {
  const tasks = useLiveQuery(
    () => subCategoryId != null
      ? db.tasks.where('subCategoryId').equals(subCategoryId).filter((t) => t.archivedAt == null).toArray()
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

export function useTaskMutations() {
  async function createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'>) {
    const now = new Date().toISOString()
    return db.tasks.add({ ...data, archivedAt: null, createdAt: now, updatedAt: now })
  }

  async function updateTask(id: number, data: Partial<Omit<Task, 'id' | 'createdAt'>>) {
    const existing = await db.tasks.get(id)
    if (!existing) return

    const now = new Date().toISOString()
    const fields = Object.keys(data) as (keyof typeof data)[]

    await db.transaction('rw', db.tasks, db.taskHistory, db.subCategories, db.categories, async () => {
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

      // Auto-complete logic: if status changed to/from DONE
      if ('status' in data) {
        const newStatus = data.status

        // Check parent subCategory auto-completion
        const subCat = await db.subCategories.get(existing.subCategoryId)
        if (subCat) {
          const siblingTasks = await db.tasks
            .where('subCategoryId').equals(existing.subCategoryId)
            .filter((t) => t.id !== id && t.archivedAt == null)
            .toArray()
          const allSiblingsDone = siblingTasks.every((t) => t.status === 'DONE')
          const anyDone = newStatus === 'DONE' || siblingTasks.some((t) => t.status === 'DONE')

          if (newStatus === 'DONE' && allSiblingsDone) {
            // All ACTIONs in this TASK are now DONE → auto-complete TASK
            if (subCat.status !== 'COMPLETED') {
              await db.subCategories.update(subCat.id!, { status: 'COMPLETED', updatedAt: now })

              // Toast notification with undo
              const subCatId = subCat.id!
              useUiStore.getState().addToast(
                `TASK "${subCat.name}" 자동 완료됨`,
                {
                  label: '다시 열기',
                  onClick: () => {
                    db.subCategories.update(subCatId, { status: 'ACTIVE', updatedAt: new Date().toISOString() })
                    const cat = db.categories.get(subCat.categoryId)
                    cat.then((c) => {
                      if (c && c.status === 'COMPLETED') {
                        db.categories.update(c.id!, { status: 'ACTIVE', updatedAt: new Date().toISOString() })
                      }
                    })
                  },
                }
              )

              // Check parent category auto-completion
              const cat = await db.categories.get(subCat.categoryId)
              if (cat) {
                const siblingSubCats = await db.subCategories
                  .where('categoryId').equals(subCat.categoryId)
                  .filter((s) => s.id !== subCat.id! && s.archivedAt == null)
                  .toArray()
                const allSubCatsDone = siblingSubCats.every((s) => s.status === 'COMPLETED')

                if (allSubCatsDone && cat.status !== 'COMPLETED') {
                  await db.categories.update(cat.id!, { status: 'COMPLETED', updatedAt: now })

                  const catId = cat.id!
                  useUiStore.getState().addToast(
                    `EPIC "${cat.name}" 자동 완료됨`,
                    {
                      label: '다시 열기',
                      onClick: () => {
                        db.categories.update(catId, { status: 'ACTIVE', updatedAt: new Date().toISOString() })
                      },
                    }
                  )
                }
              }
            }
          } else if (newStatus !== 'DONE') {
            // ACTION reverted from DONE → reopen parent TASK and EPIC if they were COMPLETED
            if (subCat.status === 'COMPLETED') {
              await db.subCategories.update(subCat.id!, { status: 'ACTIVE', updatedAt: now })
            }

            const cat = await db.categories.get(existing.categoryId)
            if (cat && cat.status === 'COMPLETED' && !anyDone) {
              await db.categories.update(cat.id!, { status: 'ACTIVE', updatedAt: now })
            } else if (cat && cat.status === 'COMPLETED') {
              await db.categories.update(cat.id!, { status: 'ACTIVE', updatedAt: now })
            }
          }
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

  async function archiveTask(id: number) {
    return db.tasks.update(id, { archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  }

  async function restoreTask(id: number) {
    return db.tasks.update(id, { archivedAt: null, updatedAt: new Date().toISOString() })
  }

  return { createTask, updateTask, deleteTask, archiveTask, restoreTask }
}
