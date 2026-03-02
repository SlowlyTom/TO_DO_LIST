import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { TaskComment } from '../types'

export function useTaskComments(taskId: number | null) {
  return useLiveQuery(
    () => taskId != null
      ? db.taskComments.where('taskId').equals(taskId).sortBy('createdAt')
      : Promise.resolve([] as TaskComment[]),
    [taskId]
  ) ?? []
}

export function useTaskCommentMutations() {
  async function addComment(taskId: number, text: string) {
    const now = new Date().toISOString()
    return db.taskComments.add({ taskId, text, createdAt: now })
  }

  async function deleteComment(id: number) {
    return db.taskComments.delete(id)
  }

  return { addComment, deleteComment }
}
