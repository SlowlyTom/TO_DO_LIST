import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { Category } from '../types'

export function useCategories(projectId: number | null) {
  const categories = useLiveQuery(
    () => projectId != null
      ? db.categories.where('projectId').equals(projectId).sortBy('order')
      : Promise.resolve([] as Category[]),
    [projectId]
  )

  async function createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    return db.categories.add({ ...data, createdAt: now, updatedAt: now })
  }

  async function updateCategory(id: number, data: Partial<Omit<Category, 'id' | 'createdAt'>>) {
    return db.categories.update(id, { ...data, updatedAt: new Date().toISOString() })
  }

  async function deleteCategory(id: number) {
    const subCats = await db.subCategories.where('categoryId').equals(id).toArray()
    const subCatIds = subCats.map((s) => s.id!)
    const tasks = await db.tasks.where('categoryId').equals(id).toArray()
    const taskIds = tasks.map((t) => t.id!)

    await db.transaction('rw', db.taskHistory, db.tasks, db.subCategories, db.categories, async () => {
      for (const tid of taskIds) {
        await db.taskHistory.where('taskId').equals(tid).delete()
      }
      await db.tasks.where('categoryId').equals(id).delete()
      if (subCatIds.length) await db.subCategories.bulkDelete(subCatIds)
      await db.categories.delete(id)
    })
  }

  return { categories: categories ?? [], createCategory, updateCategory, deleteCategory }
}
