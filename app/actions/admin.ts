'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from './shared'
import * as crypto from 'crypto'

function hash(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex')
}

// --- Settings / deadline ---

export async function updateDeadline(formData: FormData) {
  await requireAdmin()
  const raw = formData.get('entryDeadline') as string
  const entryDeadline = new Date(raw)
  if (isNaN(entryDeadline.getTime())) return { error: 'Invalid date' }
  await db.danceORamaSettings.upsert({
    where: { id: 1 },
    update: { entryDeadline },
    create: { id: 1, entryDeadline },
  })
  revalidatePath('/admin/config')
  revalidatePath('/', 'layout')
}

export async function setDeadlineOverride(value: boolean) {
  await requireAdmin()
  await db.danceORamaSettings.upsert({
    where: { id: 1 },
    update: { deadlineOverride: value },
    create: { id: 1, entryDeadline: new Date(), deadlineOverride: value },
  })
  revalidatePath('/admin/config')
  revalidatePath('/', 'layout')
}

// --- Dance config ---

export async function addDance(formData: FormData) {
  await requireAdmin()
  const name = (formData.get('name') as string).trim()
  const style = formData.get('style') as string
  if (!name || !style) return { error: 'Name and style required' }
  const maxOrder = await db.dance.aggregate({ _max: { order: true } })
  try {
    await db.dance.create({ data: { name, style, order: (maxOrder._max.order ?? 0) + 1 } })
  } catch {
    return { error: 'A dance with this name already exists' }
  }
  revalidatePath('/admin/config')
}

export async function deleteDance(danceId: number) {
  await requireAdmin()
  try {
    await db.dance.delete({ where: { id: danceId } })
  } catch {
    return { error: 'Cannot delete a dance that already has entries' }
  }
  revalidatePath('/admin/config')
}

export async function reorderDances(ids: number[]) {
  await requireAdmin()
  await db.$transaction(ids.map((id, i) => db.dance.update({ where: { id }, data: { order: i } })))
  revalidatePath('/admin/config')
}

// --- Studio config ---

export async function addStudio(formData: FormData) {
  await requireAdmin()
  const name = (formData.get('name') as string).trim()
  const slug = (formData.get('slug') as string).trim().toLowerCase()
  const password = formData.get('password') as string
  if (!name || !slug || !password) return { error: 'All fields required' }
  const maxOrder = await db.studio.aggregate({ _max: { order: true } })
  try {
    await db.studio.create({
      data: { name, slug, passwordHash: hash(password), order: (maxOrder._max.order ?? 0) + 1 },
    })
  } catch {
    return { error: 'A studio with this name or slug already exists' }
  }
  revalidatePath('/admin/config')
}

export async function resetStudioPassword(studioId: number, newPassword: string) {
  await requireAdmin()
  if (!newPassword.trim()) return { error: 'Password required' }
  await db.studio.update({ where: { id: studioId }, data: { passwordHash: hash(newPassword) } })
  revalidatePath('/admin/config')
}

export async function deleteStudio(studioId: number) {
  await requireAdmin()
  await db.studio.delete({ where: { id: studioId } })
  revalidatePath('/admin/config')
}
