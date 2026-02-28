import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { Category } from '../types'

export function useCategories(projectId: number | null) {
  const categories = useLiveQuery(
    () => projectId != null
      ? db.categories.where('projectId').equals(projectId).sortBy('order').then((cats) =>
          cats.filter((c) => c.archivedAt == null)
        )
      : Promise.resolve([] as Category[]),
    [projectId]
  )

  async function createCategory(data: Omit<Category, 'id' | 'status' | 'archivedAt' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    return db.categories.add({ ...data, status: 'ACTIVE', archivedAt: null, createdAt: now, updatedAt: now })
  }

  async function updateCategory(id: number, data: Partial<Omit<Category, 'id' | 'createdAt'>>) {
    return db.categories.update(id, { ...data, updatedAt: new Date().toISOString() })
  }

  async function archiveCategory(id: number) {
    const now = new Date().toISOString()
    // Also archive all subcategories and tasks under this category
    await db.transaction('rw', db.categories, db.subCategories, db.tasks, async () => {
      await db.categories.update(id, { archivedAt: now, updatedAt: now })
      await db.subCategories.where('categoryId').equals(id).modify({ archivedAt: now, updatedAt: now })
      await db.tasks.where('categoryId').equals(id).modify({ archivedAt: now, updatedAt: now })
    })
  }

  async function restoreCategory(id: number) {
    const now = new Date().toISOString()
    await db.transaction('rw', db.categories, db.subCategories, db.tasks, async () => {
      await db.categories.update(id, { archivedAt: null, status: 'ACTIVE', updatedAt: now })
      await db.subCategories.where('categoryId').equals(id).modify({ archivedAt: null, status: 'ACTIVE', updatedAt: now })
      await db.tasks.where('categoryId').equals(id).modify({ archivedAt: null, updatedAt: now })
    })
  }

  async function reopenCategory(id: number) {
    return db.categories.update(id, { status: 'ACTIVE', updatedAt: new Date().toISOString() })
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

  return { categories: categories ?? [], createCategory, updateCategory, archiveCategory, restoreCategory, reopenCategory, deleteCategory }
}
