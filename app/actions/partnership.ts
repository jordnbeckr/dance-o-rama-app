'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requireStudio, clearPartnershipSignature } from './shared'

export async function getOrCreatePartnership(
  studioSlug: string,
  studentId: number,
  instructorId: number
): Promise<{ partnershipId: number } | { error: string }> {
  const studio = await requireStudio(studioSlug)

  const student = await db.student.findFirst({ where: { id: studentId, studioId: studio.id } })
  if (!student) return { error: 'Student not found' }
  const instructor = await db.instructor.findFirst({ where: { id: instructorId, studioId: studio.id } })
  if (!instructor) return { error: 'Instructor not found' }

  const existing = await db.partnership.findUnique({
    where: { studentId_instructorId: { studentId, instructorId } },
  })
  if (existing) return { partnershipId: existing.id }

  const created = await db.partnership.create({
    data: { studioId: studio.id, studentId, instructorId },
  })
  revalidatePath(`/studio/${studioSlug}/entries`)
  return { partnershipId: created.id }
}

export async function setAwardPlaque(studioSlug: string, partnershipId: number, value: boolean) {
  const studio = await requireStudio(studioSlug)
  const partnership = await db.partnership.findFirst({ where: { id: partnershipId, studioId: studio.id } })
  if (!partnership) return { error: 'Partnership not found' }
  await db.partnership.update({ where: { id: partnershipId }, data: { awardPlaque: value } })
  await clearPartnershipSignature(partnershipId)
  revalidatePath(`/studio/${studioSlug}/entries/${partnershipId}`)
}

export async function deletePartnership(studioSlug: string, partnershipId: number) {
  const studio = await requireStudio(studioSlug)
  const partnership = await db.partnership.findFirst({ where: { id: partnershipId, studioId: studio.id } })
  if (!partnership) return { error: 'Partnership not found' }
  await db.partnership.delete({ where: { id: partnershipId } })
  revalidatePath(`/studio/${studioSlug}/entries`)
  revalidatePath(`/studio/${studioSlug}/summary`)
}
