import { db } from '@/lib/db'
import { AGE_LABELS, DIVISION_SECTIONS, DivisionSectionKey, divisionEventDay, COUPLE_EVENT_SECTIONS, CoupleEventSectionKey, coupleEventDay, DAY_COLORS, SOLO_DAY, FORMATION_DAY, danceDay } from '@/lib/divisions'
import PaidDaysBadge from '@/components/PaidDaysBadge'

export default async function SummaryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      students: {
        orderBy: { lastName: 'asc' },
        include: {
          partnerships: {
            include: {
              instructor: true,
              danceEntries: { include: { dance: true } },
              divisionEntries: true,
            },
          },
          coupleEventEntries: {
            include: { partnerStudent: { include: { studio: true } }, partnerInstructor: { include: { studio: true } } },
          },
          coupleEventEntriesAsPartner: {
            include: { student: { include: { studio: true } } },
          },
          soloEntry: true,
          formationMembers: { include: { team: true, instructor: true } },
        },
      },
    },
  })
  if (!studio) return <p>Studio not found</p>

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:max-w-full">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{studio.name} — Dance-O-Rama Summary</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Printable rollup of every entry, per student</p>
      </div>

      {studio.students.length === 0 && (
        <p className="text-sm italic text-center" style={{ color: 'var(--muted)' }}>No students on the roster yet.</p>
      )}

      {studio.students.map((student: {
        id: number
        firstName: string
        lastName: string
        paidThursday: boolean
        paidFriday: boolean
        paidSaturday: boolean
        partnerships: {
          instructor: { name: string }
          awardPlaque: boolean
          danceEntries: { category: string; ageCategory: string; level: string; dance: { name: string; style: string } }[]
          divisionEntries: { section: string; ageCategory: string; eventName: string }[]
        }[]
        coupleEventEntries: { section: string; eventName: string; partnerStudent: { firstName: string; lastName: string; studio: { name: string } } | null; partnerInstructor: { name: string; studio: { name: string } } | null }[]
        coupleEventEntriesAsPartner: { section: string; eventName: string; student: { firstName: string; lastName: string; studio: { name: string } } }[]
        soloEntry: { entryType: string; routineName: string; danceName: string | null } | null
        formationMembers: { team: { danceName: string }; instructor: { name: string } | null }[]
      }) => {
        const hasAnything =
          student.partnerships.length > 0 ||
          student.coupleEventEntries.length > 0 ||
          student.coupleEventEntriesAsPartner.length > 0 ||
          student.soloEntry ||
          student.formationMembers.length > 0

        return (
          <div key={student.id} className="card p-4 space-y-3 break-inside-avoid">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-lg">{student.firstName} {student.lastName}</h2>
              <PaidDaysBadge student={student} />
            </div>
            {!hasAnything && <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No entries yet.</p>}

            {student.partnerships.map((p, i: number) => (
              <div key={i} className="pl-2" style={{ borderLeft: '3px solid var(--accent)' }}>
                <p className="text-sm font-semibold">
                  With {p.instructor.name}{p.awardPlaque && <span className="ml-2 text-xs" style={{ color: 'var(--accent)' }}>🏆 plaque requested</span>}
                </p>
                {p.danceEntries.length > 0 && (
                  <div className="text-sm mt-1">
                    {Object.entries(
                      p.danceEntries.reduce((acc: Record<string, string[]>, e) => {
                        const key = `${AGE_LABELS[e.ageCategory] ?? e.ageCategory} · ${e.level}`
                        acc[key] = acc[key] || []
                        acc[key].push(`${e.dance.name} (${e.category}, ${danceDay(e.dance.style, e.category)})`)
                        return acc
                      }, {})
                    ).map(([group, dances]) => (
                      <p key={group}><strong>{group}:</strong> {dances.join(', ')}</p>
                    ))}
                  </div>
                )}
                {p.divisionEntries.length > 0 && (
                  <div className="text-sm mt-1">
                    {p.divisionEntries.map((e, j: number) => {
                      const day = divisionEventDay(e.section as DivisionSectionKey, e.eventName)
                      return (
                        <p key={j}>
                          {DIVISION_SECTIONS[e.section as DivisionSectionKey]?.label ?? e.section}: {e.eventName}
                          {' '}({AGE_LABELS[e.ageCategory] ?? e.ageCategory})
                          {day && <span style={{ color: DAY_COLORS[day] }}> [{day}]</span>}
                        </p>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            {(student.coupleEventEntries.length > 0 || student.coupleEventEntriesAsPartner.length > 0) && (
              <div className="pl-2" style={{ borderLeft: '3px solid #2d5fa3' }}>
                <p className="text-sm font-semibold">Couple Events</p>
                {student.coupleEventEntries.map((e, i: number) => {
                  const day = coupleEventDay(e.section as CoupleEventSectionKey, e.eventName)
                  return (
                    <p key={`p${i}`} className="text-sm">
                      {COUPLE_EVENT_SECTIONS[e.section as CoupleEventSectionKey]?.label ?? e.section} — {e.eventName} with{' '}
                      {e.partnerStudent ? `${e.partnerStudent.firstName} ${e.partnerStudent.lastName} (${e.partnerStudent.studio.name})` : `${e.partnerInstructor?.name} (${e.partnerInstructor?.studio.name}, instructor)`}
                      {day && <span style={{ color: DAY_COLORS[day] }}> [{day}]</span>}
                    </p>
                  )
                })}
                {student.coupleEventEntriesAsPartner.map((e, i: number) => {
                  const day = coupleEventDay(e.section as CoupleEventSectionKey, e.eventName)
                  return (
                    <p key={`a${i}`} className="text-sm">
                      {COUPLE_EVENT_SECTIONS[e.section as CoupleEventSectionKey]?.label ?? e.section} — {e.eventName} with {e.student.firstName} {e.student.lastName} ({e.student.studio.name})
                      {day && <span style={{ color: DAY_COLORS[day] }}> [{day}]</span>}
                    </p>
                  )
                })}
              </div>
            )}

            {student.soloEntry && (
              <div className="pl-2" style={{ borderLeft: '3px solid #608040' }}>
                <p className="text-sm font-semibold">Solo / Show</p>
                <p className="text-sm">
                  {student.soloEntry.entryType}{student.soloEntry.danceName && <> ({student.soloEntry.danceName})</>}: &ldquo;{student.soloEntry.routineName}&rdquo;
                  <span style={{ color: DAY_COLORS[SOLO_DAY] }}> [{SOLO_DAY}]</span>
                </p>
              </div>
            )}

            {student.formationMembers.length > 0 && (
              <div className="pl-2" style={{ borderLeft: '3px solid #92400e' }}>
                <p className="text-sm font-semibold">Formation Teams</p>
                {student.formationMembers.map((m, i: number) => (
                  <p key={i} className="text-sm">
                    {m.team.danceName}{m.instructor && <> &amp; {m.instructor.name}</>}
                    <span style={{ color: DAY_COLORS[FORMATION_DAY] }}> [{FORMATION_DAY}]</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
