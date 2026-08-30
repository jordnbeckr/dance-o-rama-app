'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requireStudio, clearPartnershipSignature } from './shared'
import { assertBeforeDeadline, DeadlinePassedError } from '@/lib/deadline'
import { DivisionSectionKey, divisionEventDay, studentHasPaidFor } from '@/lib/divisions'

export async function addDivisionEntry(
  studioSlug: string,
  partnershipId: number,
  section: DivisionSectionKey,
  ageCategory: string,
  eventName: string
) {
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

  const day = divisionEventDay(section, eventName)
  if (!day) return { error: 'Invalid event' }
  if (!studentHasPaidFor(partnership.student, day)) {
    return { error: `${partnership.student.firstName} hasn't paid for ${day}` }
  }

  try {
    await db.divisionEntry.create({ data: { partnershipId, section, ageCategory, eventName } })
  } catch {
    return { error: 'This division is already entered for this pairing.' }
  }
  await clearPartnershipSignature(partnershipId)

  revalidatePath(`/studio/${studioSlug}/entries/${partnershipId}`)
  revalidatePath('/admin/master')
}

export async function removeDivisionEntry(studioSlug: string, divisionEntryId: number) {
  const studio = await requireStudio(studioSlug)
  const entry = await db.divisionEntry.findFirst({
    where: { id: divisionEntryId, partnership: { studioId: studio.id } },
  })
  if (!entry) return { error: 'Entry not found' }
  await db.divisionEntry.delete({ where: { id: divisionEntryId } })
  await clearPartnershipSignature(entry.partnershipId)
  revalidatePath(`/studio/${studioSlug}/entries/${entry.partnershipId}`)
  revalidatePath('/admin/master')
}
