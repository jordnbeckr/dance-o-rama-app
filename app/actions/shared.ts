import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function requireStudio(studioSlug: string) {
  const session = await getSession()
  if (session?.role !== 'studio' || session.studioSlug !== studioSlug) {
    throw new Error('Unauthorized')
  }
  const studio = await db.studio.findUnique({ where: { slug: studioSlug } })
  if (!studio) throw new Error('Studio not found')
  return studio
}

export async function requireAdmin() {
  const session = await getSession()
  if (session?.role !== 'admin') throw new Error('Unauthorized')
}

// A signed sheet attests to everything checked at signing time — any entry
// change afterward must invalidate it so a stale signature can never linger.
export async function clearPartnershipSignature(partnershipId: number) {
  await db.partnership.update({
    where: { id: partnershipId },
    data: { signatureData: null, signedAt: null },
  })
}

// Couple Events / Solo / Formations are student-scoped, not tied to one
// partnership, so a change there can invalidate signatures across every
// partnership that student has.
export async function clearSignaturesForStudent(studentId: number) {
  await db.partnership.updateMany({
    where: { studentId },
    data: { signatureData: null, signedAt: null },
  })
}
