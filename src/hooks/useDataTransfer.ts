import { db } from '../db/database'
import type { BackupData } from '../types'

export function useDataTransfer() {
  async function exportData() {
    const [projects, categories, subCategories, tasks, taskHistory] = await Promise.all([
      db.projects.toArray(),
      db.categories.toArray(),
      db.subCategories.toArray(),
      db.tasks.toArray(),
      db.taskHistory.toArray(),
    ])

    const backup: BackupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      projects,
      categories,
      subCategories,
      tasks,
      taskHistory,
    }

    const json = JSON.stringify(backup, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `pmc-backup-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importData(file: File, mode: 'overwrite' | 'merge') {
    const text = await file.text()
    const backup: BackupData = JSON.parse(text)

    if (!backup.version || !backup.projects) {
      throw new Error('올바른 백업 파일이 아닙니다.')
    }

    await db.transaction('rw', db.projects, db.categories, db.subCategories, db.tasks, db.taskHistory, async () => {
      if (mode === 'overwrite') {
        await db.taskHistory.clear()
        await db.tasks.clear()
        await db.subCategories.clear()
        await db.categories.clear()
        await db.projects.clear()

        await db.projects.bulkAdd(backup.projects)
        await db.categories.bulkAdd(backup.categories)
        await db.subCategories.bulkAdd(backup.subCategories)
        await db.tasks.bulkAdd(backup.tasks)
        await db.taskHistory.bulkAdd(backup.taskHistory)
      } else {
        // Merge: add records with new IDs (strip existing IDs to avoid conflicts)
        const idMap = new Map<number, number>()

        for (const p of backup.projects) {
          const oldId = p.id!
          const { id: _id, ...rest } = p
          const newId = await db.projects.add(rest as typeof p)
          idMap.set(oldId, newId as number)
        }

        const catIdMap = new Map<number, number>()
        for (const c of backup.categories) {
          const oldId = c.id!
          const { id: _id, ...rest } = c
          const newId = await db.categories.add({
            ...rest,
            projectId: idMap.get(rest.projectId) ?? rest.projectId,
          } as typeof c)
          catIdMap.set(oldId, newId as number)
        }

        const subCatIdMap = new Map<number, number>()
        for (const s of backup.subCategories) {
          const oldId = s.id!
          const { id: _id, ...rest } = s
          const newId = await db.subCategories.add({
            ...rest,
            projectId: idMap.get(rest.projectId) ?? rest.projectId,
            categoryId: catIdMap.get(rest.categoryId) ?? rest.categoryId,
          } as typeof s)
          subCatIdMap.set(oldId, newId as number)
        }

        const taskIdMap = new Map<number, number>()
        for (const t of backup.tasks) {
          const oldId = t.id!
          const { id: _id, ...rest } = t
          const newId = await db.tasks.add({
            ...rest,
            projectId: idMap.get(rest.projectId) ?? rest.projectId,
            categoryId: catIdMap.get(rest.categoryId) ?? rest.categoryId,
            subCategoryId: subCatIdMap.get(rest.subCategoryId) ?? rest.subCategoryId,
          } as typeof t)
          taskIdMap.set(oldId, newId as number)
        }

        for (const h of backup.taskHistory) {
          const { id: _id, ...rest } = h
          await db.taskHistory.add({
            ...rest,
            taskId: taskIdMap.get(rest.taskId) ?? rest.taskId,
          } as typeof h)
        }
      }
    })
  }

  return { exportData, importData }
}
