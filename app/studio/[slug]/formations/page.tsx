import { db } from '@/lib/db'
import FormationBuilder from './FormationBuilder'

export default async function FormationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      students: { orderBy: { lastName: 'asc' } },
      instructors: { orderBy: { name: 'asc' } },
      formationTeams: {
        include: { members: { include: { student: true, instructor: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!studio) return <p>Studio not found</p>

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-center">Formation Teams</h1>
      <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
        Small = 4 couples, Medium = 5-6 couples, Large = 7-8 couples (a suggestion, not a hard limit).
        Formation Teams run on Saturday.
      </p>
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
  )
}
