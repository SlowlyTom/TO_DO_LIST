import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { SubCategory } from '../types'

export function useSubCategories(categoryId: number | null) {
  const subCategories = useLiveQuery(
    () => categoryId != null
      ? db.subCategories.where('categoryId').equals(categoryId).sortBy('order')
      : Promise.resolve([] as SubCategory[]),
    [categoryId]
  )

  async function createSubCategory(data: Omit<SubCategory, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    return db.subCategories.add({ ...data, createdAt: now, updatedAt: now })
  }

  async function updateSubCategory(id: number, data: Partial<Omit<SubCategory, 'id' | 'createdAt'>>) {
    return db.subCategories.update(id, { ...data, updatedAt: new Date().toISOString() })
  }

  async function deleteSubCategory(id: number) {
    const tasks = await db.tasks.where('subCategoryId').equals(id).toArray()
    const taskIds = tasks.map((t) => t.id!)

    await db.transaction('rw', db.taskHistory, db.tasks, db.subCategories, async () => {
      for (const tid of taskIds) {
        await db.taskHistory.where('taskId').equals(tid).delete()
      }
      await db.tasks.where('subCategoryId').equals(id).delete()
      await db.subCategories.delete(id)
    })
  }

  return { subCategories: subCategories ?? [], createSubCategory, updateSubCategory, deleteSubCategory }
}

export function useSubCategoriesByProject(projectId: number | null) {
  return useLiveQuery(
    () => projectId != null
      ? db.subCategories.where('projectId').equals(projectId).toArray()
      : Promise.resolve([] as SubCategory[]),
    [projectId]
  ) ?? []
}
