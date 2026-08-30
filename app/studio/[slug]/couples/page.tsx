import { db } from '@/lib/db'
import CoupleEventsManager from './CoupleEventsManager'

export default async function CouplesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      students: {
        orderBy: { lastName: 'asc' },
        select: { id: true, firstName: true, lastName: true, paidThursday: true, paidFriday: true, paidSaturday: true },
      },
    },
  })
  if (!studio) return <p>Studio not found</p>

  const entries = await db.coupleEventEntry.findMany({
    where: {
      OR: [{ student: { studioId: studio.id } }, { partnerStudent: { studioId: studio.id } }],
    },
    include: {
      student: { include: { studio: { select: { name: true } } } },
      partnerStudent: { include: { studio: { select: { name: true } } } },
      partnerInstructor: { include: { studio: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-center">Couple Events</h1>
      <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
        Amateur Couple Events (student/student only) and Club 3-Dance Divisions (student/student or student/instructor).
        Partners can be from any studio — search by name.
      </p>
      <CoupleEventsManager
        slug={slug}
        students={studio.students}
        entries={entries.map((e: {
          id: number
          section: string
          eventName: string
          partnerType: string
          student: { id: number; firstName: string; lastName: string; studio: { name: string } }
          partnerStudent: { id: number; firstName: string; lastName: string; studio: { name: string } } | null
          partnerInstructor: { id: number; name: string; studio: { name: string } } | null
        }) => ({
          id: e.id,
          section: e.section,
          eventName: e.eventName,
          partnerType: e.partnerType,
          studentLabel: `${e.student.firstName} ${e.student.lastName} (${e.student.studio.name})`,
          partnerLabel: e.partnerStudent
            ? `${e.partnerStudent.firstName} ${e.partnerStudent.lastName} (${e.partnerStudent.studio.name})`
            : `${e.partnerInstructor?.name} (${e.partnerInstructor?.studio.name}, instructor)`,
        }))}
      />
    </div>
  )
}
