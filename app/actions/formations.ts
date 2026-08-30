'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requireStudio } from './shared'
import { assertBeforeDeadline, DeadlinePassedError } from '@/lib/deadline'
import { FORMATION_DAY, studentHasPaidFor } from '@/lib/divisions'

export async function createFormationTeam(
  studioSlug: string,
  danceName: string
): Promise<{ error: string } | { teamId: number }> {
  const studio = await requireStudio(studioSlug)

  try {
    await assertBeforeDeadline()
  } catch (e) {
    if (e instanceof DeadlinePassedError) return { error: 'The entry deadline has passed. Contact Jordan to make changes.' }
    throw e
  }

  const name = danceName.trim()
  if (!name) return { error: 'Dance name required' }

  try {
    const team = await db.formationTeam.create({ data: { studioId: studio.id, danceName: name } })
    revalidatePath(`/studio/${studioSlug}/entries`)
    return { teamId: team.id }
  } catch {
    return { error: 'A formation team for this dance already exists' }
  }
}

export async function deleteFormationTeam(studioSlug: string, teamId: number) {
  const studio = await requireStudio(studioSlug)
  const team = await db.formationTeam.findFirst({ where: { id: teamId, studioId: studio.id } })
  if (!team) return { error: 'Team not found' }
  await db.formationTeam.delete({ where: { id: teamId } })
  revalidatePath(`/studio/${studioSlug}/entries`)
  revalidatePath('/admin/master')
}

export async function addFormationMember(
  studioSlug: string,
  teamId: number,
  studentId: number,
  instructorId: number | null
) {
  const studio = await requireStudio(studioSlug)

  try {
    await assertBeforeDeadline()
  } catch (e) {
    if (e instanceof DeadlinePassedError) return { error: 'The entry deadline has passed. Contact Jordan to make changes.' }
    throw e
  }

  const team = await db.formationTeam.findFirst({ where: { id: teamId, studioId: studio.id } })
  if (!team) return { error: 'Team not found' }
  const student = await db.student.findFirst({ where: { id: studentId, studioId: studio.id } })
  if (!student) return { error: 'Student not found' }
  if (!studentHasPaidFor(student, FORMATION_DAY)) {
    return { error: `${student.firstName} hasn't paid for ${FORMATION_DAY}` }
  }
  if (instructorId) {
    const instructor = await db.instructor.findFirst({ where: { id: instructorId, studioId: studio.id } })
    if (!instructor) return { error: 'Instructor not found' }
  }

  try {
    await db.formationMember.create({ data: { teamId, studentId, instructorId } })
  } catch {
    return { error: 'That dancer is already on this team' }
  }

  revalidatePath(`/studio/${studioSlug}/entries`)
  revalidatePath('/admin/master')
}

export async function removeFormationMember(studioSlug: string, memberId: number) {
  const studio = await requireStudio(studioSlug)
  const member = await db.formationMember.findFirst({
    where: { id: memberId, team: { studioId: studio.id } },
  })
  if (!member) return { error: 'Member not found' }
  await db.formationMember.delete({ where: { id: memberId } })
  revalidatePath(`/studio/${studioSlug}/entries`)
  revalidatePath('/admin/master')
}
