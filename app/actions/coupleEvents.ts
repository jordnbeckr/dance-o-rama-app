'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requireStudio, clearSignaturesForStudent } from './shared'
import { assertBeforeDeadline, DeadlinePassedError } from '@/lib/deadline'
import { COUPLE_EVENT_SECTIONS, CoupleEventSectionKey, coupleEventDay, studentHasPaidFor } from '@/lib/divisions'

export async function searchPartners(query: string) {
  const q = query.trim()
  if (q.length < 2) return { students: [], instructors: [] }

  const [students, instructors] = await Promise.all([
    db.student.findMany({
      where: {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
        ],
      },
      include: { studio: { select: { name: true } } },
      take: 15,
    }),
    db.instructor.findMany({
      where: { name: { contains: q } },
      include: { studio: { select: { name: true } } },
      take: 15,
    }),
  ])

  return {
    students: students.map((s: { id: number; firstName: string; lastName: string; studio: { name: string } }) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      studioName: s.studio.name,
    })),
    instructors: instructors.map((i: { id: number; name: string; studio: { name: string } }) => ({
      id: i.id,
      name: i.name,
      studioName: i.studio.name,
    })),
  }
}

export async function addCoupleEventEntry(
  studioSlug: string,
  studentId: number,
  partnerType: 'Instructor' | 'Student',
  partnerId: number,
  section: CoupleEventSectionKey,
  eventName: string
): Promise<{ error: string } | { success: true }> {
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

  const sectionDef = COUPLE_EVENT_SECTIONS[section]
  if (!sectionDef) return { error: 'Invalid section' }
  if (!(sectionDef.partnerTypes as readonly string[]).includes(partnerType)) {
    return { error: `${sectionDef.label} does not allow an instructor partner` }
  }
  const day = coupleEventDay(section, eventName)
  if (!day) return { error: 'Invalid event' }
  if (!studentHasPaidFor(student, day)) {
    return { error: `${student.firstName} hasn't paid for ${day}` }
  }

  // Canonical storage: for student-student pairs, always store the lower ID
  // as the primary `studentId` regardless of who initiated the entry, so the
  // same pairing can't be double-entered from either participant's side.
  let primaryId = studentId
  let partnerStudentId: number | null = null
  let partnerInstructorId: number | null = null
  let partnerKey: string

  if (partnerType === 'Student') {
    if (partnerId === studentId) return { error: 'Partner must be a different student' }
    const partner = await db.student.findUnique({ where: { id: partnerId } })
    if (!partner) return { error: 'Partner student not found' }
    if (!studentHasPaidFor(partner, day)) {
      return { error: `${partner.firstName} hasn't paid for ${day}` }
    }
    const lower = Math.min(studentId, partnerId)
    const higher = Math.max(studentId, partnerId)
    primaryId = lower
    partnerStudentId = higher
    partnerKey = `student:${higher}`
  } else {
    const instructor = await db.instructor.findUnique({ where: { id: partnerId } })
    if (!instructor) return { error: 'Partner instructor not found' }
    partnerInstructorId = partnerId
    partnerKey = `instructor:${partnerId}`
  }

  try {
    await db.coupleEventEntry.create({
      data: {
        studioId: studio.id,
        studentId: primaryId,
        partnerType,
        partnerStudentId,
        partnerInstructorId,
        partnerKey,
        section,
        eventName,
      },
    })
  } catch {
    return { error: 'This couple is already entered in this event.' }
  }
  await clearSignaturesForStudent(studentId)
  if (partnerType === 'Student') await clearSignaturesForStudent(partnerId)

  revalidatePath(`/studio/${studioSlug}/couples`)
  revalidatePath('/admin/master')
  return { success: true }
}

export async function removeCoupleEventEntry(studioSlug: string, id: number) {
  const studio = await requireStudio(studioSlug)
  const entry = await db.coupleEventEntry.findFirst({
    where: {
      id,
      OR: [
        { student: { studioId: studio.id } },
        { partnerStudent: { studioId: studio.id } },
        { partnerInstructor: { studioId: studio.id } },
      ],
    },
  })
  if (!entry) return { error: 'Entry not found' }
  await db.coupleEventEntry.delete({ where: { id } })
  await clearSignaturesForStudent(entry.studentId)
  if (entry.partnerStudentId) await clearSignaturesForStudent(entry.partnerStudentId)
  revalidatePath(`/studio/${studioSlug}/couples`)
  revalidatePath('/admin/master')
}
