import { db } from '@/lib/db'
import RosterManager from './RosterManager'

export default async function RosterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      students: {
        orderBy: [{ lastName: 'asc' }],
        select: { id: true, firstName: true, lastName: true, paidThursday: true, paidFriday: true, paidSaturday: true },
      },
      instructors: { orderBy: [{ name: 'asc' }] },
    },
  })

  if (!studio) return <p>Studio not found</p>

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-center">Roster</h1>
      <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
        {studio.students.length} students · {studio.instructors.length} instructors
      </p>
      <RosterManager slug={slug} students={studio.students} instructors={studio.instructors} />
    </div>
  )
}
