import { db } from '@/lib/db'
import { getSettings, isPastDeadline } from '@/lib/deadline'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [studioCount, studentCount, partnershipCount, danceEntryCount, coupleEventCount, soloCount, formationCount, plaqueCount] =
    await Promise.all([
      db.studio.count(),
      db.student.count(),
      db.partnership.count(),
      db.danceEntry.count(),
      db.coupleEventEntry.count(),
      db.soloEntry.count(),
      db.formationTeam.count(),
      db.partnership.count({ where: { awardPlaque: true } }),
    ])

  const settings = await getSettings()
  const pastDeadline = await isPastDeadline()

  const tiles = [
    { label: 'Studios', value: studioCount },
    { label: 'Students', value: studentCount },
    { label: 'Pairings', value: partnershipCount },
    { label: 'Dance Entries', value: danceEntryCount },
    { label: 'Couple Events', value: coupleEventCount },
    { label: 'Solo/Show', value: soloCount },
    { label: 'Formation Teams', value: formationCount },
    { label: 'Plaque Requests', value: plaqueCount },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dance-O-Rama Admin</h1>

      {settings && (
        <div className={pastDeadline ? 'banner-error' : 'banner-info'} style={{ maxWidth: 500 }}>
          {pastDeadline
            ? `Deadline passed (${settings.entryDeadline.toLocaleString()}). Studios are locked out of adding/editing entries.`
            : `Entry deadline: ${settings.entryDeadline.toLocaleString()}`}
          {' '}
          <Link href="/admin/config" className="underline">Adjust in Config →</Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map(t => (
          <div key={t.label} className="card p-4">
            <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{t.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{t.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Link href="/admin/master" className="card p-4 flex-1 hover:shadow-md transition-shadow">
          <div className="font-semibold text-sm">Master View →</div>
          <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Every entry across every studio, plaque report, division counts.</div>
        </Link>
        <Link href="/admin/config" className="card p-4 flex-1 hover:shadow-md transition-shadow">
          <div className="font-semibold text-sm">Config →</div>
          <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Dances, studios, and the entry deadline.</div>
        </Link>
      </div>
    </div>
  )
}
