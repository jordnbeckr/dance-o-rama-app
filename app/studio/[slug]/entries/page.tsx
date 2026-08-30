import { db } from '@/lib/db'
import EntryPicker from './EntryPicker'
import SoloManager from './SoloManager'
import FormationBuilder from './FormationBuilder'

export default async function EntriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      students: {
        orderBy: { lastName: 'asc' },
        include: { soloEntry: true },
      },
      instructors: { orderBy: { name: 'asc' } },
      partnerships: {
        include: {
          student: true,
          instructor: true,
          _count: { select: { danceEntries: true, divisionEntries: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      formationTeams: {
        include: { members: { include: { student: true, instructor: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!studio) return <p>Studio not found</p>

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-center">Entries</h1>
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

      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold">Solo / Show Routines</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            One per student: a Solo routine OR a Show routine, not both. Solo/Show routines run on Thursday.
          </p>
        </div>
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

      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold">Formation Teams</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Small = 4 couples, Medium = 5-6 couples, Large = 7-8 couples (a suggestion, not a hard limit).
            Formation Teams run on Saturday.
          </p>
        </div>
        <FormationBuilder
          slug={slug}
          students={studio.students}
          instructors={studio.instructors}
          teams={studio.formationTeams.map((t: {
            id: number
            danceName: string
            members: { id: number; student: { firstName: string; lastName: string }; instructor: { name: string } | null }[]
          }) => ({
            id: t.id,
            danceName: t.danceName,
            members: t.members.map(m => ({
              id: m.id,
              studentName: `${m.student.firstName} ${m.student.lastName}`,
              instructorName: m.instructor?.name ?? null,
            })),
          }))}
        />
      </div>
    </div>
  )
}
