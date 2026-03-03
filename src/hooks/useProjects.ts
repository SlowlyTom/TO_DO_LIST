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

  async function updateProject(id: number, data: Partial<Omit<Project, 'id' | 'createdAt'>>) {
    const now = new Date().toISOString()
    const isFinishing = data.status === 'COMPLETED' || data.status === 'CANCELLED'

    if (isFinishing) {
      const cascade = window.confirm(
        '하위 EPIC / TASK / ACTION을 모두 완료 처리하시겠습니까?\n\n확인: 하위 항목 일괄 완료\n취소: 프로젝트 상태만 변경'
      )
      if (cascade) {
        await db.transaction('rw', db.projects, db.categories, db.subCategories, db.tasks, async () => {
          await db.projects.update(id, { ...data, updatedAt: now })
          await db.categories.where('projectId').equals(id).modify({ status: 'COMPLETED', updatedAt: now })
          await db.subCategories.where('projectId').equals(id).modify({ status: 'COMPLETED', updatedAt: now })
          await db.tasks.where('projectId').equals(id).filter((t) => t.archivedAt == null).modify({ status: 'DONE', updatedAt: now })
        })
        return
      }
    }

    return db.projects.update(id, { ...data, updatedAt: now })
  }

  async function archiveProject(id: number) {
    return db.projects.update(id, { archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
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
  return useLiveQuery(() => (id != null ? db.projects.get(id) : undefined), [id])
}
