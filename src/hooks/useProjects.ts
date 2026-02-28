import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { Project } from '../types'

export function useProjects() {
  const projects = useLiveQuery(() => db.projects.orderBy('createdAt').toArray(), [])

  async function createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    return db.projects.add({ ...data, createdAt: now, updatedAt: now })
  }

  async function updateProject(id: number, data: Partial<Omit<Project, 'id' | 'createdAt'>>) {
    return db.projects.update(id, { ...data, updatedAt: new Date().toISOString() })
  }

  async function deleteProject(id: number) {
    // Cascade delete: tasks → subCategories → categories → project
    const categories = await db.categories.where('projectId').equals(id).toArray()
    const catIds = categories.map((c) => c.id!)
    const subCats = await db.subCategories.where('projectId').equals(id).toArray()
    const subCatIds = subCats.map((s) => s.id!)
    const tasks = await db.tasks.where('projectId').equals(id).toArray()
    const taskIds = tasks.map((t) => t.id!)

    await db.transaction('rw', db.taskHistory, db.tasks, db.subCategories, db.categories, db.projects, async () => {
      for (const tid of taskIds) {
        await db.taskHistory.where('taskId').equals(tid).delete()
      }
      await db.tasks.where('projectId').equals(id).delete()
      if (subCatIds.length) await db.subCategories.bulkDelete(subCatIds)
      if (catIds.length) await db.categories.bulkDelete(catIds)
      await db.projects.delete(id)
    })
  }

  return { projects: projects ?? [], createProject, updateProject, deleteProject }
}

export function useProject(id: number | null) {
  return useLiveQuery(() => (id != null ? db.projects.get(id) : undefined), [id])
}
