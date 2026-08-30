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
