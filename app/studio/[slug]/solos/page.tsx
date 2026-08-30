import { db } from '@/lib/db'
import SoloManager from './SoloManager'

export default async function SolosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      students: {
        orderBy: { lastName: 'asc' },
        include: { soloEntry: true },
      },
      instructors: { orderBy: { name: 'asc' } },
    },
  })
  if (!studio) return <p>Studio not found</p>

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-center">Solo / Show Routines</h1>
      <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
        One per student: a Solo routine OR a Show routine, not both. Solo/Show routines run on Thursday.
      </p>
      <SoloManager
        slug={slug}
        instructors={studio.instructors}
        students={studio.students.map((s: {
          id: number
          firstName: string
          lastName: string
          paidThursday: boolean
          soloEntry: { entryType: string; routineName: string; danceName: string | null; instructorId: number | null } | null
        }) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          paidThursday: s.paidThursday,
          soloEntry: s.soloEntry,
        }))}
      />
    </div>
  )
}
