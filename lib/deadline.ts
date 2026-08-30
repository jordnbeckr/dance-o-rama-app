import { db } from '@/lib/db'

export class DeadlinePassedError extends Error {
  constructor() {
    super('DEADLINE_PASSED')
  }
}

export async function assertBeforeDeadline() {
  const settings = await db.danceORamaSettings.findUnique({ where: { id: 1 } })
  if (!settings) return // fail open only if truly unconfigured — seed always creates this row
  if (settings.deadlineOverride) return
  if (new Date() > settings.entryDeadline) {
    throw new DeadlinePassedError()
  }
}

export async function isPastDeadline(): Promise<boolean> {
  const settings = await db.danceORamaSettings.findUnique({ where: { id: 1 } })
  if (!settings) return false
  if (settings.deadlineOverride) return false
  return new Date() > settings.entryDeadline
}

export async function getSettings() {
  return db.danceORamaSettings.findUnique({ where: { id: 1 } })
}
