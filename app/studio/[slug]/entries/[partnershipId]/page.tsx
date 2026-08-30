import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DanceGrid from './DanceGrid'
import DivisionForm from './DivisionForm'
import PlaqueToggle from './PlaqueToggle'

export default async function PartnershipPage({
  params,
}: {
  params: Promise<{ slug: string; partnershipId: string }>
}) {
  const { slug, partnershipId } = await params
  const id = Number(partnershipId)

  const partnership = await db.partnership.findUnique({
    where: { id },
    include: {
      student: true,
      instructor: true,
      danceEntries: { include: { dance: true } },
      divisionEntries: true,
    },
  })
  if (!partnership || partnership.studioId !== (await db.studio.findUnique({ where: { slug } }))?.id) {
    notFound()
  }

  const dances = await db.dance.findMany({ orderBy: [{ style: 'asc' }, { order: 'asc' }] })

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <Link href={`/studio/${slug}/entries`} className="text-sm" style={{ color: 'var(--muted)' }}>
          ← All pairings
        </Link>
        <h1 className="text-2xl font-bold mt-1">
          {partnership!.student.firstName} {partnership!.student.lastName} &amp; {partnership!.instructor.name}
        </h1>
      </div>

      <PlaqueToggle slug={slug} partnershipId={id} initialValue={partnership!.awardPlaque} />

      <DanceGrid
        slug={slug}
        partnershipId={id}
        dances={dances}
        entries={partnership!.danceEntries.map(e => ({
          id: e.id,
          danceId: e.danceId,
          category: e.category,
          ageCategory: e.ageCategory,
          level: e.level,
        }))}
        student={partnership!.student}
      />

      <DivisionForm
        slug={slug}
        partnershipId={id}
        entries={partnership!.divisionEntries.map(e => ({
          id: e.id,
          section: e.section,
          ageCategory: e.ageCategory,
          eventName: e.eventName,
        }))}
        student={partnership!.student}
      />
    </div>
  )
}
