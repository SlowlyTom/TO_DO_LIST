import { useEffect } from 'react'
import { useAllTasks } from './useTasks'
import { useUiStore } from '../stores/uiStore'

const NOTICE_HOURS = 24 // notify when due within this many hours

export function useDeadlineNotifications() {
  const { notificationsEnabled, notifiedTaskIds, markTaskNotified } = useUiStore()
  const tasks = useAllTasks()

  useEffect(() => {
    if (!notificationsEnabled) return

    async function requestAndCheck() {
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
      if (Notification.permission !== 'granted') return
      checkDeadlines()
    }

    function checkDeadlines() {
      const now = new Date()
      const cutoff = new Date(now.getTime() + NOTICE_HOURS * 60 * 60 * 1000)
      const today = now.toISOString().slice(0, 10)
      const cutoffDate = cutoff.toISOString().slice(0, 10)

      for (const task of tasks) {
        if (!task.dueDate) continue
        if (task.status === 'DONE') continue
        if (task.archivedAt) continue
        if (!task.id) continue
        if (notifiedTaskIds.has(task.id)) continue

        const isOverdue = task.dueDate < today
        const isDueSoon = task.dueDate >= today && task.dueDate <= cutoffDate

        if (isOverdue || isDueSoon) {
          const label = isOverdue ? '기한 초과' : '마감 임박'
          new Notification(`[${label}] ${task.title}`, {
            body: `마감일: ${task.dueDate}`,
            icon: '/favicon.ico',
          })
          markTaskNotified(task.id)
        }
      }
    }

    requestAndCheck()
    const interval = setInterval(checkDeadlines, 60 * 1000)
    return () => clearInterval(interval)
  }, [notificationsEnabled, tasks, notifiedTaskIds, markTaskNotified])
}
