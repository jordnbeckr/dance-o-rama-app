'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requireStudio } from './shared'
import { Day } from '@/lib/divisions'

// --- Students ---

export async function addStudent(studioSlug: string, formData: FormData) {
  const studio = await requireStudio(studioSlug)
  const firstName = (formData.get('firstName') as string).trim()
  const lastName = (formData.get('lastName') as string).trim()
  if (!firstName || !lastName) return { error: 'First and last name required' }
  await db.student.create({ data: { firstName, lastName, studioId: studio.id } })
  revalidatePath(`/studio/${studioSlug}/roster`)
}

export async function updateStudent(studioSlug: string, studentId: number, formData: FormData) {
  const studio = await requireStudio(studioSlug)
  const student = await db.student.findFirst({ where: { id: studentId, studioId: studio.id } })
  if (!student) return { error: 'Student not found' }
  const firstName = (formData.get('firstName') as string).trim()
  const lastName = (formData.get('lastName') as string).trim()
  if (!firstName || !lastName) return { error: 'First and last name required' }
  await db.student.update({ where: { id: studentId }, data: { firstName, lastName } })
  revalidatePath(`/studio/${studioSlug}/roster`)
}

export async function deleteStudent(studioSlug: string, studentId: number) {
  const studio = await requireStudio(studioSlug)
  const student = await db.student.findFirst({ where: { id: studentId, studioId: studio.id } })
  if (!student) return { error: 'Student not found' }
  await db.student.delete({ where: { id: studentId } })
  revalidatePath(`/studio/${studioSlug}/roster`)
}

export async function setStudentPaidDay(studioSlug: string, studentId: number, day: Day, value: boolean) {
  const studio = await requireStudio(studioSlug)
  const student = await db.student.findFirst({ where: { id: studentId, studioId: studio.id } })
  if (!student) return { error: 'Student not found' }
  const field = day === 'Thursday' ? 'paidThursday' : day === 'Friday' ? 'paidFriday' : 'paidSaturday'
  await db.student.update({ where: { id: studentId }, data: { [field]: value } })
  revalidatePath(`/studio/${studioSlug}/roster`)
  revalidatePath(`/studio/${studioSlug}/entries`)
  revalidatePath(`/studio/${studioSlug}/couples`)
}

// --- Instructors ---

export async function addInstructor(studioSlug: string, formData: FormData) {
  const studio = await requireStudio(studioSlug)
  const name = (formData.get('name') as string).trim()
  if (!name) return { error: 'Name required' }
  await db.instructor.create({ data: { name, studioId: studio.id } })
  revalidatePath(`/studio/${studioSlug}/roster`)
}

export async function updateInstructor(studioSlug: string, instructorId: number, formData: FormData) {
  const studio = await requireStudio(studioSlug)
  const instructor = await db.instructor.findFirst({ where: { id: instructorId, studioId: studio.id } })
  if (!instructor) return { error: 'Instructor not found' }
  const name = (formData.get('name') as string).trim()
  if (!name) return { error: 'Name required' }
  await db.instructor.update({ where: { id: instructorId }, data: { name } })
  revalidatePath(`/studio/${studioSlug}/roster`)
}

export async function deleteInstructor(studioSlug: string, instructorId: number) {
  const studio = await requireStudio(studioSlug)
  const instructor = await db.instructor.findFirst({ where: { id: instructorId, studioId: studio.id } })
  if (!instructor) return { error: 'Instructor not found' }
  await db.instructor.delete({ where: { id: instructorId } })
  revalidatePath(`/studio/${studioSlug}/roster`)
}
