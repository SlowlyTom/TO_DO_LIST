import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { Project } from '../types'

export function useProjects() {
  const projects = useLiveQuery(
    () => db.projects.orderBy('createdAt').filter((p) => p.archivedAt == null).toArray(),
    []
  )

  async function createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'>) {
    const now = new Date().toISOString()
    return db.projects.add({ ...data, archivedAt: null, createdAt: now, updatedAt: now })
  }

  async function updateProject(id: number, data: Partial<Omit<Project, 'id' | 'createdAt'>>, cascade?: boolean) {
    const now = new Date().toISOString()
    const isFinishing = data.status === 'COMPLETED' || data.status === 'CANCELLED'

    if (isFinishing && cascade) {
      await db.transaction('rw', db.projects, db.categories, db.subCategories, db.tasks, async () => {
        await db.projects.update(id, { ...data, updatedAt: now })
        await db.categories.where('projectId').equals(id).modify({ status: 'COMPLETED', updatedAt: now })
        await db.subCategories.where('projectId').equals(id).modify({ status: 'COMPLETED', updatedAt: now })
        await db.tasks.where('projectId').equals(id).filter((t) => t.archivedAt == null).modify({ status: 'DONE', updatedAt: now })
      })
      return
    }

    return db.projects.update(id, { ...data, updatedAt: now })
  }

  async function archiveProject(id: number) {
    const now = new Date().toISOString()
    await db.transaction('rw', db.projects, db.categories, db.subCategories, db.tasks, async () => {
      await db.projects.update(id, { archivedAt: now, updatedAt: now })
      await db.categories.where('projectId').equals(id).modify({ archivedAt: now, updatedAt: now })
      await db.subCategories.where('projectId').equals(id).modify({ archivedAt: now, updatedAt: now })
      await db.tasks.where('projectId').equals(id).modify({ archivedAt: now, updatedAt: now })
    })
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

  return { projects: projects ?? [], createProject, updateProject, archiveProject, deleteProject }
}

export function useProject(id: number | null) {
  return useLiveQuery(
    async () => {
      if (id == null) return null
      const p = await db.projects.get(id)
      return p ?? null
    },
    [id]
  )
}
