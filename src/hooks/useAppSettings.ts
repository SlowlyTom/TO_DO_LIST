import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'

export function useAppSettings() {
  const settings = useLiveQuery(() => db.appSettings.toCollection().first(), [])

  const currentUserName = settings?.currentUserName ?? ''

  async function setCurrentUserName(name: string) {
    const existing = await db.appSettings.toCollection().first()
    const now = new Date().toISOString()
    if (existing?.id) {
      await db.appSettings.update(existing.id, { currentUserName: name, updatedAt: now })
    } else {
      await db.appSettings.add({ currentUserName: name, updatedAt: now })
    }
  }

  return { currentUserName, setCurrentUserName }
}
