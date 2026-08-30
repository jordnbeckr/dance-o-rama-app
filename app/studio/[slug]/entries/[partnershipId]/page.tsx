import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PairingWorkspace from './PairingWorkspace'
import PlaqueToggle from './PlaqueToggle'

export default async function PartnershipPage({
  params,
}: {
  params: Promise<{ slug: string; partnershipId: string }>
}) {
  const { slug, partnershipId } = await params
  const id = Number(partnershipId)

  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      formationTeams: { include: { members: true }, orderBy: { createdAt: 'desc' } },
    },
  })
  if (!studio) notFound()

  const partnership = await db.partnership.findUnique({
    where: { id },
    include: {
      student: true,
      instructor: true,
      danceEntries: { include: { dance: true } },
      divisionEntries: true,
    },
  })
  if (!partnership || partnership.studioId !== studio!.id) {
    notFound()
  }

  const dances = await db.dance.findMany({ orderBy: [{ style: 'asc' }, { order: 'asc' }] })
  const soloEntry = await db.soloEntry.findUnique({ where: { studentId: partnership!.studentId } })

  const rawCoupleEntries = await db.coupleEventEntry.findMany({
    where: {
      section: { in: ['AmateurCouple', 'Club'] },
      OR: [{ studentId: partnership!.studentId }, { partnerStudentId: partnership!.studentId }],
    },
    include: { student: true, partnerStudent: true, partnerInstructor: true },
  })
  const coupleEntries = rawCoupleEntries.map(e => {
    const isPrimarySide = e.studentId === partnership!.studentId
    const partnerId =
      e.partnerType === 'Instructor' ? e.partnerInstructorId : isPrimarySide ? e.partnerStudentId : e.studentId
    const partnerLabel =
      e.partnerType === 'Instructor'
        ? e.partnerInstructor!.name
        : isPrimarySide
          ? `${e.partnerStudent!.firstName} ${e.partnerStudent!.lastName}`
          : `${e.student.firstName} ${e.student.lastName}`
    return {
      id: e.id,
      section: e.section as 'AmateurCouple' | 'Club',
      eventName: e.eventName,
      partnerType: e.partnerType as 'Instructor' | 'Student',
      partnerId,
      partnerLabel,
    }
  })

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <Link href={`/studio/${slug}/entries`} className="text-sm" style={{ color: 'var(--muted)' }}>
          ← All pairings
        </Link>
        <h1 className="text-2xl font-bold mt-1">
          {partnership!.student.firstName} {partnership!.student.lastName} &amp; {partnership!.instructor.name}
        </h1>
      </div>

      <PlaqueToggle slug={slug} partnershipId={id} initialValue={partnership!.awardPlaque} />

      <PairingWorkspace
        slug={slug}
        partnershipId={id}
        studentId={partnership!.studentId}
        instructorId={partnership!.instructorId}
        dances={dances}
        danceEntries={partnership!.danceEntries.map(e => ({
          id: e.id,
          danceId: e.danceId,
          category: e.category,
          ageCategory: e.ageCategory,
          level: e.level,
        }))}
        divisionEntries={partnership!.divisionEntries.map(e => ({
          id: e.id,
          section: e.section,
          ageCategory: e.ageCategory,
          eventName: e.eventName,
        }))}
        student={partnership!.student}
        soloEntry={
          soloEntry
            ? {
                entryType: soloEntry.entryType,
                routineName: soloEntry.routineName,
                danceName: soloEntry.danceName,
                instructorId: soloEntry.instructorId,
              }
            : null
        }
        formationTeams={studio!.formationTeams.map(t => ({
          id: t.id,
          danceName: t.danceName,
          members: t.members.map(m => ({ id: m.id, studentId: m.studentId })),
        }))}
        coupleEntries={coupleEntries}
      />
    </div>
  )
}
