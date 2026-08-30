import { db } from '@/lib/db'
import Link from 'next/link'

export default async function StudioDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const studio = await db.studio.findUnique({ where: { slug } })
  if (!studio) return null

  const [studentCount, instructorCount, danceEntryCount, divisionEntryCount, coupleEventCount, soloCount, formationCount] =
    await Promise.all([
      db.student.count({ where: { studioId: studio.id } }),
      db.instructor.count({ where: { studioId: studio.id } }),
      db.danceEntry.count({ where: { partnership: { studioId: studio.id } } }),
      db.divisionEntry.count({ where: { partnership: { studioId: studio.id } } }),
      db.coupleEventEntry.count({
        where: { OR: [{ student: { studioId: studio.id } }, { partnerStudent: { studioId: studio.id } }] },
      }),
      db.soloEntry.count({ where: { studioId: studio.id } }),
      db.formationTeam.count({ where: { studioId: studio.id } }),
    ])

  const tiles = [
    { label: 'Students', value: studentCount, href: `/studio/${slug}/roster` },
    { label: 'Instructors', value: instructorCount, href: `/studio/${slug}/roster` },
    { label: 'Dance Entries', value: danceEntryCount, href: `/studio/${slug}/entries` },
    { label: 'Division Entries', value: divisionEntryCount, href: `/studio/${slug}/entries` },
    { label: 'Couple Events', value: coupleEventCount, href: `/studio/${slug}/couples` },
    { label: 'Solo/Show Routines', value: soloCount, href: `/studio/${slug}/entries` },
    { label: 'Formation Teams', value: formationCount, href: `/studio/${slug}/entries` },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{studio.name}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map(t => (
          <Link key={t.label} href={t.href} className="card p-4 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{t.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{t.label}</div>
          </Link>
        ))}
      </div>
      <div className="card p-4 text-sm" style={{ color: 'var(--muted)' }}>
        <p className="mb-2 font-semibold" style={{ color: 'var(--text)' }}>Getting started</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Add your students and instructors on the <Link href={`/studio/${slug}/roster`} className="underline">Roster</Link> page.</li>
          <li>For each student+instructor pairing, add dances and divisions under <Link href={`/studio/${slug}/entries`} className="underline">Entries</Link> &mdash; that page also covers Solo/Show routines and Formation teams.</li>
          <li>Enter Amateur Couple and Club events under <Link href={`/studio/${slug}/couples`} className="underline">Couple Events</Link> (partners can be from any studio).</li>
          <li>Check the <Link href={`/studio/${slug}/summary`} className="underline">Summary</Link> page before the deadline to confirm everything is correct.</li>
        </ol>
      </div>
    </div>
  )
}
