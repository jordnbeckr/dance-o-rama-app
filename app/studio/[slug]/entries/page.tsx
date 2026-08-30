import { db } from '@/lib/db'
import EntryPicker from './EntryPicker'

export default async function EntriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      students: { orderBy: { lastName: 'asc' } },
      instructors: { orderBy: { name: 'asc' } },
      partnerships: {
        include: {
          student: true,
          instructor: true,
          _count: { select: { danceEntries: true, divisionEntries: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!studio) return <p>Studio not found</p>

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-center">Dance Entries</h1>
      <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
        Pick a student and instructor to enter their individual dances (Closed/Open Category), All Around,
        Open Bronze 3-Dance, and Scholarship divisions. A student dancing with two instructors gets two pairings.
      </p>
      <EntryPicker
        slug={slug}
        students={studio.students}
        instructors={studio.instructors}
        partnerships={studio.partnerships.map((p: {
          id: number
          awardPlaque: boolean
          student: { firstName: string; lastName: string; paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }
          instructor: { name: string }
          _count: { danceEntries: number; divisionEntries: number }
        }) => ({
          id: p.id,
          studentName: `${p.student.firstName} ${p.student.lastName}`,
          instructorName: p.instructor.name,
          awardPlaque: p.awardPlaque,
          danceEntryCount: p._count.danceEntries,
          divisionEntryCount: p._count.divisionEntries,
          student: p.student,
        }))}
      />
    </div>
  )
}
