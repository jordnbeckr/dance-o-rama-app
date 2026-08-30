'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requireStudio } from './shared'
import { assertBeforeDeadline, DeadlinePassedError } from '@/lib/deadline'
import { studentHasPaidFor, danceDay } from '@/lib/divisions'

type Result = { error: string } | { warning?: string }

export async function addDanceEntry(
  studioSlug: string,
  partnershipId: number,
  danceId: number,
  category: 'Closed' | 'Open',
  ageCategory: string,
  level: string
): Promise<Result> {
  const studio = await requireStudio(studioSlug)

  try {
    await assertBeforeDeadline()
  } catch (e) {
    if (e instanceof DeadlinePassedError) {
      return { error: 'The entry deadline has passed. Contact Jordan to make changes.' }
    }
    throw e
  }

  const partnership = await db.partnership.findFirst({
    where: { id: partnershipId, studioId: studio.id },
    include: { student: true },
  })
  if (!partnership) return { error: 'Partnership not found' }

  const dance = await db.dance.findUnique({ where: { id: danceId } })
  if (!dance) return { error: 'Dance not found' }
  const day = danceDay(dance.style, category)
  if (!studentHasPaidFor(partnership.student, day)) {
    return { error: `${partnership.student.firstName} hasn't paid for ${day}` }
  }

  const existing = await db.danceEntry.findMany({ where: { partnershipId } })
  const distinctAges = new Set(existing.map((e: { ageCategory: string }) => e.ageCategory))
  const distinctLevels = new Set(existing.map((e: { level: string }) => e.level))
  const exceedsCap =
    (!distinctAges.has(ageCategory) && distinctAges.size >= 2) ||
    (!distinctLevels.has(level) && distinctLevels.size >= 2)

  try {
    await db.danceEntry.create({ data: { partnershipId, danceId, category, ageCategory, level } })
  } catch {
    return { error: 'This dance is already entered for this age/level/category combination.' }
  }

  revalidatePath(`/studio/${studioSlug}/entries/${partnershipId}`)
  revalidatePath('/admin/master')

  if (exceedsCap) {
    return { warning: 'This pairing now spans more than 2 age categories or levels — the paper form suggests capping at 2 of each.' }
  }
  return {}
}

export async function removeDanceEntry(studioSlug: string, danceEntryId: number) {
  const studio = await requireStudio(studioSlug)
  const entry = await db.danceEntry.findFirst({
    where: { id: danceEntryId, partnership: { studioId: studio.id } },
  })
  if (!entry) return { error: 'Entry not found' }
  await db.danceEntry.delete({ where: { id: danceEntryId } })
  revalidatePath(`/studio/${studioSlug}/entries/${entry.partnershipId}`)
  revalidatePath('/admin/master')
}
