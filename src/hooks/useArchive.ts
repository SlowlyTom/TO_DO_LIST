import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'

export type ArchiveItemType = 'PROJECT' | 'EPIC' | 'TASK' | 'ACTION'

export interface ArchiveItem {
  id: number
  type: ArchiveItemType
  name: string
  projectId: number | null
  projectName?: string
  parentArchivedAt: string | null  // whether the direct parent is also archived
  archivedAt: string
}

export function useArchivedItems() {
  return useLiveQuery(async () => {
    const [projects, categories, subCategories, tasks] = await Promise.all([
      db.projects.filter((p) => p.archivedAt != null).toArray(),
      db.categories.filter((c) => c.archivedAt != null).toArray(),
      db.subCategories.filter((s) => s.archivedAt != null).toArray(),
      db.tasks.filter((t) => t.archivedAt != null).toArray(),
    ])

    // Build project name map
    const allProjects = await db.projects.toArray()
    const projectNameMap = new Map(allProjects.map((p) => [p.id!, p.name]))

    const items: ArchiveItem[] = []

    for (const p of projects) {
      items.push({
        id: p.id!,
        type: 'PROJECT',
        name: p.name,
        projectId: p.id!,
        projectName: p.name,
        parentArchivedAt: null,
        archivedAt: p.archivedAt!,
      })
    }

    for (const c of categories) {
      const project = allProjects.find((p) => p.id === c.projectId)
      items.push({
        id: c.id!,
        type: 'EPIC',
        name: c.name,
        projectId: c.projectId,
        projectName: projectNameMap.get(c.projectId),
        parentArchivedAt: project?.archivedAt ?? null,
        archivedAt: c.archivedAt!,
      })
    }

    for (const s of subCategories) {
      const parentCat = await db.categories.get(s.categoryId)
      items.push({
        id: s.id!,
        type: 'TASK',
        name: s.name,
        projectId: s.projectId,
        projectName: projectNameMap.get(s.projectId),
        parentArchivedAt: parentCat?.archivedAt ?? null,
        archivedAt: s.archivedAt!,
      })
    }

    for (const t of tasks) {
      const parentSub = await db.subCategories.get(t.subCategoryId)
      items.push({
        id: t.id!,
        type: 'ACTION',
        name: t.title,
        projectId: t.projectId,
        projectName: projectNameMap.get(t.projectId),
        parentArchivedAt: parentSub?.archivedAt ?? null,
        archivedAt: t.archivedAt!,
      })
    }

    return items.sort((a, b) => b.archivedAt.localeCompare(a.archivedAt))
  }, []) ?? []
}

export function useArchiveMutations() {
  async function restoreItem(item: ArchiveItem) {
    const now = new Date().toISOString()
    if (item.type === 'PROJECT') {
      await db.projects.update(item.id, { archivedAt: null, updatedAt: now })
    } else if (item.type === 'EPIC') {
      await db.transaction('rw', db.categories, db.subCategories, db.tasks, async () => {
        await db.categories.update(item.id, { archivedAt: null, status: 'ACTIVE', updatedAt: now })
        // Restore subcategories and tasks that were archived at the same time (within 1 sec)
        const archivedTime = new Date(item.archivedAt).getTime()
        const subs = await db.subCategories.where('categoryId').equals(item.id).toArray()
        for (const s of subs) {
          if (s.archivedAt && Math.abs(new Date(s.archivedAt).getTime() - archivedTime) < 2000) {
            await db.subCategories.update(s.id!, { archivedAt: null, status: 'ACTIVE', updatedAt: now })
            const taskList = await db.tasks.where('subCategoryId').equals(s.id!).toArray()
            for (const t of taskList) {
              if (t.archivedAt && Math.abs(new Date(t.archivedAt).getTime() - archivedTime) < 2000) {
                await db.tasks.update(t.id!, { archivedAt: null, updatedAt: now })
              }
            }
          }
        }
      })
    } else if (item.type === 'TASK') {
      await db.transaction('rw', db.subCategories, db.tasks, async () => {
        await db.subCategories.update(item.id, { archivedAt: null, status: 'ACTIVE', updatedAt: now })
        const archivedTime = new Date(item.archivedAt).getTime()
        const taskList = await db.tasks.where('subCategoryId').equals(item.id).toArray()
        for (const t of taskList) {
          if (t.archivedAt && Math.abs(new Date(t.archivedAt).getTime() - archivedTime) < 2000) {
            await db.tasks.update(t.id!, { archivedAt: null, updatedAt: now })
          }
        }
      })
    } else if (item.type === 'ACTION') {
      await db.tasks.update(item.id, { archivedAt: null, updatedAt: now })
    }
  }

  async function permanentlyDelete(item: ArchiveItem) {
    if (item.type === 'PROJECT') {
      const cats = await db.categories.where('projectId').equals(item.id).toArray()
      const catIds = cats.map((c) => c.id!)
      const subs = await db.subCategories.where('projectId').equals(item.id).toArray()
      const subIds = subs.map((s) => s.id!)
      const tasks = await db.tasks.where('projectId').equals(item.id).toArray()
      const taskIds = tasks.map((t) => t.id!)

      await db.transaction('rw', db.taskHistory, db.tasks, db.subCategories, db.categories, db.projects, async () => {
        for (const tid of taskIds) await db.taskHistory.where('taskId').equals(tid).delete()
        await db.tasks.where('projectId').equals(item.id).delete()
        if (subIds.length) await db.subCategories.bulkDelete(subIds)
        if (catIds.length) await db.categories.bulkDelete(catIds)
        await db.projects.delete(item.id)
      })
    } else if (item.type === 'EPIC') {
      const subs = await db.subCategories.where('categoryId').equals(item.id).toArray()
      const subIds = subs.map((s) => s.id!)
      const tasks = await db.tasks.where('categoryId').equals(item.id).toArray()
      const taskIds = tasks.map((t) => t.id!)

      await db.transaction('rw', db.taskHistory, db.tasks, db.subCategories, db.categories, async () => {
        for (const tid of taskIds) await db.taskHistory.where('taskId').equals(tid).delete()
        await db.tasks.where('categoryId').equals(item.id).delete()
        if (subIds.length) await db.subCategories.bulkDelete(subIds)
        await db.categories.delete(item.id)
      })
    } else if (item.type === 'TASK') {
      const tasks = await db.tasks.where('subCategoryId').equals(item.id).toArray()
      const taskIds = tasks.map((t) => t.id!)

      await db.transaction('rw', db.taskHistory, db.tasks, db.subCategories, async () => {
        for (const tid of taskIds) await db.taskHistory.where('taskId').equals(tid).delete()
        await db.tasks.where('subCategoryId').equals(item.id).delete()
        await db.subCategories.delete(item.id)
      })
    } else if (item.type === 'ACTION') {
      await db.transaction('rw', db.tasks, db.taskHistory, async () => {
        await db.taskHistory.where('taskId').equals(item.id).delete()
        await db.tasks.delete(item.id)
      })
    }
  }

  async function bulkPermanentlyDelete(items: ArchiveItem[]) {
    for (const item of items) {
      await permanentlyDelete(item)
    }
  }

  return { restoreItem, permanentlyDelete, bulkPermanentlyDelete }
}
