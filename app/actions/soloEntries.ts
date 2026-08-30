'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requireStudio } from './shared'
import { assertBeforeDeadline, DeadlinePassedError } from '@/lib/deadline'
import { SOLO_DAY, studentHasPaidFor } from '@/lib/divisions'

export async function setSoloEntry(
  studioSlug: string,
  studentId: number,
  entryType: 'Solo' | 'Show',
  routineName: string,
  danceName: string | null,
  instructorId: number | null
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

  const student = await db.student.findFirst({ where: { id: studentId, studioId: studio.id } })
  if (!student) return { error: 'Student not found' }
  if (!studentHasPaidFor(student, SOLO_DAY)) {
    return { error: `${student.firstName} hasn't paid for ${SOLO_DAY}` }
  }
  if (!routineName.trim()) return { error: 'Routine name required' }
  if (entryType === 'Show' && !danceName?.trim()) return { error: 'Dance name required for a show routine' }

  if (instructorId) {
    const instructor = await db.instructor.findFirst({ where: { id: instructorId, studioId: studio.id } })
    if (!instructor) return { error: 'Instructor not found' }
  }

  await db.soloEntry.upsert({
    where: { studentId },
    update: {
      entryType,
      routineName: routineName.trim(),
      danceName: entryType === 'Show' ? danceName!.trim() : null,
      instructorId,
    },
    create: {
      studioId: studio.id,
      studentId,
      entryType,
      routineName: routineName.trim(),
      danceName: entryType === 'Show' ? danceName!.trim() : null,
      instructorId,
    },
  })

  revalidatePath(`/studio/${studioSlug}/solos`)
  revalidatePath('/admin/master')
}

export async function clearSoloEntry(studioSlug: string, studentId: number) {
  const studio = await requireStudio(studioSlug)
  const entry = await db.soloEntry.findFirst({ where: { studentId, studioId: studio.id } })
  if (!entry) return { error: 'Entry not found' }
  await db.soloEntry.delete({ where: { studentId } })
  revalidatePath(`/studio/${studioSlug}/solos`)
  revalidatePath('/admin/master')
}
