import { db } from '@/lib/db'
import FormationsManager from './FormationsManager'

export default async function FormationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      students: {
        orderBy: { lastName: 'asc' },
        select: { id: true, firstName: true, lastName: true, paidThursday: true, paidFriday: true, paidSaturday: true },
      },
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
      <div className="text-center">
        <h1 className="text-2xl font-bold">Formations</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Create formation teams here — give each one a name and a dance, then a student can pick it from a dropdown
          on their own signup page. Small = 4 couples, Medium = 5-6, Large = 7-8 (a suggestion, not a hard limit).
          Formation Teams run on Saturday.
        </p>
      </div>
      <FormationsManager
        slug={slug}
        students={studio.students}
        instructors={studio.instructors}
        teams={studio.formationTeams.map(t => ({
          id: t.id,
          name: t.name,
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
