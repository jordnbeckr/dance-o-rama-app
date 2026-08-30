'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requireStudio } from './shared'
import { assertBeforeDeadline, DeadlinePassedError } from '@/lib/deadline'

export async function saveSignature(studioSlug: string, partnershipId: number, dataUrl: string) {
  const studio = await requireStudio(studioSlug)

  try {
    await assertBeforeDeadline()
  } catch (e) {
    if (e instanceof DeadlinePassedError) {
      return { error: 'The entry deadline has passed. Contact Jordan to make changes.' }
    }
    throw e
  }

  if (!dataUrl.startsWith('data:image/png;base64,')) return { error: 'Invalid signature image' }
  if (dataUrl.length > 200_000) return { error: 'Signature image too large' }

  const partnership = await db.partnership.findFirst({ where: { id: partnershipId, studioId: studio.id } })
  if (!partnership) return { error: 'Partnership not found' }

  await db.partnership.update({
    where: { id: partnershipId },
    data: { signatureData: dataUrl, signedAt: new Date() },
  })

  revalidatePath(`/studio/${studioSlug}/entries/${partnershipId}`)
}

export async function clearSignature(studioSlug: string, partnershipId: number) {
  const studio = await requireStudio(studioSlug)
  const partnership = await db.partnership.findFirst({ where: { id: partnershipId, studioId: studio.id } })
  if (!partnership) return { error: 'Partnership not found' }

  await db.partnership.update({
    where: { id: partnershipId },
    data: { signatureData: null, signedAt: null },
  })

  revalidatePath(`/studio/${studioSlug}/entries/${partnershipId}`)
}
