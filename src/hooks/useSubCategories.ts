import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { SubCategory } from '../types'

export function useSubCategories(categoryId: number | null) {
  const subCategories = useLiveQuery(
    () => categoryId != null
      ? db.subCategories.where('categoryId').equals(categoryId).sortBy('order').then((subs) =>
          subs.filter((s) => s.archivedAt == null)
        )
      : Promise.resolve([] as SubCategory[]),
    [categoryId]
  )

  async function createSubCategory(data: Omit<SubCategory, 'id' | 'status' | 'archivedAt' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    return db.subCategories.add({ ...data, status: 'ACTIVE', archivedAt: null, createdAt: now, updatedAt: now })
  }

  async function updateSubCategory(id: number, data: Partial<Omit<SubCategory, 'id' | 'createdAt'>>) {
    return db.subCategories.update(id, { ...data, updatedAt: new Date().toISOString() })
  }

  async function archiveSubCategory(id: number) {
    const now = new Date().toISOString()
    await db.transaction('rw', db.subCategories, db.tasks, async () => {
      await db.subCategories.update(id, { archivedAt: now, updatedAt: now })
      await db.tasks.where('subCategoryId').equals(id).modify({ archivedAt: now, updatedAt: now })
    })
  }

  async function restoreSubCategory(id: number) {
    const now = new Date().toISOString()
    await db.transaction('rw', db.subCategories, db.tasks, async () => {
      await db.subCategories.update(id, { archivedAt: null, status: 'ACTIVE', updatedAt: now })
      await db.tasks.where('subCategoryId').equals(id).modify({ archivedAt: null, updatedAt: now })
    })
  }

  async function reopenSubCategory(id: number) {
    return db.subCategories.update(id, { status: 'ACTIVE', updatedAt: new Date().toISOString() })
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

  return { subCategories: subCategories ?? [], createSubCategory, updateSubCategory, archiveSubCategory, restoreSubCategory, reopenSubCategory, deleteSubCategory }
}

export function useSubCategoriesByProject(projectId: number | null) {
  return useLiveQuery(
    () => projectId != null
      ? db.subCategories.where('projectId').equals(projectId).toArray()
      : Promise.resolve([] as SubCategory[]),
    [projectId]
  ) ?? []
}
