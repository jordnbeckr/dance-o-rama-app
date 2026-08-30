import { db } from '@/lib/db'
import {
  DANCE_AGE_LABELS,
  AGE_LABELS,
  DIVISION_SECTIONS,
  DivisionSectionKey,
  divisionEventDay,
  divisionAgeLabel,
  COUPLE_EVENT_SECTIONS,
  CoupleEventSectionKey,
  coupleEventDay,
  DAY_COLORS,
  SOLO_DAY,
  FORMATION_DAY,
  danceDay,
  Day,
} from '@/lib/divisions'
import PaidDaysBadge from '@/components/PaidDaysBadge'

function DayPill({ day }: { day: Day }) {
  return (
    <span
      className="text-xs font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
      style={{ backgroundColor: `${DAY_COLORS[day]}1a`, color: DAY_COLORS[day] }}
    >
      {day}
    </span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded overflow-hidden break-inside-avoid" style={{ border: '1px solid var(--border)' }}>
      <div
        className="text-xs font-bold uppercase tracking-wide px-2.5 py-1.5"
        style={{ backgroundColor: '#f5f6f8', color: '#2a3545', borderBottom: '1px solid var(--border)' }}
      >
        {title}
      </div>
      <div className="p-2.5 text-sm space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ left, day }: { left: React.ReactNode; day?: Day }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{left}</span>
      {day && <DayPill day={day} />}
    </div>
  )
}

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
        formationMembers: { team: { name: string; danceName: string }; instructor: { name: string } | null }[]
      }) => {
        const hasAnything =
          student.partnerships.some(p => p.danceEntries.length > 0 || p.divisionEntries.length > 0) ||
          student.coupleEventEntries.length > 0 ||
          student.coupleEventEntriesAsPartner.length > 0 ||
          !!student.soloEntry ||
          student.formationMembers.length > 0

        const multiplePartnerships = student.partnerships.filter(p => p.danceEntries.length > 0 || p.divisionEntries.length > 0).length > 1

        return (
          <div key={student.id} className="card p-4 space-y-3 break-inside-avoid">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-bold text-lg">{student.firstName} {student.lastName}</h2>
              <PaidDaysBadge student={student} />
              {student.partnerships.some(p => p.awardPlaque) && (
                <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>🏆 plaque requested</span>
              )}
            </div>

            {!hasAnything && <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No entries yet.</p>}

            {hasAnything && (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                {student.partnerships.map((p, i: number) => {
                  if (p.danceEntries.length === 0 && p.divisionEntries.length === 0) return null
                  const heading = multiplePartnerships ? `Individual Dances — with ${p.instructor.name}` : 'Individual Dances'

                  const groups = p.danceEntries.reduce((acc: Record<string, typeof p.danceEntries>, e) => {
                    const key = `${DANCE_AGE_LABELS[e.ageCategory] ?? AGE_LABELS[e.ageCategory] ?? e.ageCategory} · ${e.level}`
                    acc[key] = acc[key] || []
                    acc[key].push(e)
                    return acc
                  }, {})

                  return (
                    <div key={`dances-${i}`} className="space-y-3">
                      {p.danceEntries.length > 0 && (
                        <Section title={heading}>
                          {Object.entries(groups).map(([group, entries]) => (
                            <div key={group}>
                              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>{group}</p>
                              <div className="space-y-0.5">
                                {entries.map((e, j: number) => (
                                  <Row
                                    key={j}
                                    left={<>{e.dance.name} <span className="text-xs opacity-70">({e.category})</span></>}
                                    day={danceDay(e.dance.style, e.category)}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </Section>
                      )}
                      {p.divisionEntries.length > 0 && (
                        <Section title={multiplePartnerships ? `Divisions — with ${p.instructor.name}` : 'Divisions'}>
                          {p.divisionEntries.map((e, j: number) => (
                            <Row
                              key={j}
                              left={
                                <>
                                  {DIVISION_SECTIONS[e.section as DivisionSectionKey]?.label ?? e.section}: {e.eventName}{' '}
                                  <span className="text-xs opacity-70">
                                    ({divisionAgeLabel(e.section as DivisionSectionKey, e.ageCategory)})
                                  </span>
                                </>
                              }
                              day={divisionEventDay(e.section as DivisionSectionKey, e.eventName)}
                            />
                          ))}
                        </Section>
                      )}
                    </div>
                  )
                })}

                {(student.coupleEventEntries.length > 0 || student.coupleEventEntriesAsPartner.length > 0) && (
                  <Section title="Couple Events">
                    {student.coupleEventEntries.map((e, i: number) => (
                      <Row
                        key={`p${i}`}
                        left={
                          <>
                            {COUPLE_EVENT_SECTIONS[e.section as CoupleEventSectionKey]?.label ?? e.section} — {e.eventName}
                            <br />
                            <span className="text-xs opacity-70">
                              with {e.partnerStudent ? `${e.partnerStudent.firstName} ${e.partnerStudent.lastName} (${e.partnerStudent.studio.name})` : `${e.partnerInstructor?.name} (${e.partnerInstructor?.studio.name}, instructor)`}
                            </span>
                          </>
                        }
                        day={coupleEventDay(e.section as CoupleEventSectionKey, e.eventName)}
                      />
                    ))}
                    {student.coupleEventEntriesAsPartner.map((e, i: number) => (
                      <Row
                        key={`a${i}`}
                        left={
                          <>
                            {COUPLE_EVENT_SECTIONS[e.section as CoupleEventSectionKey]?.label ?? e.section} — {e.eventName}
                            <br />
                            <span className="text-xs opacity-70">with {e.student.firstName} {e.student.lastName} ({e.student.studio.name})</span>
                          </>
                        }
                        day={coupleEventDay(e.section as CoupleEventSectionKey, e.eventName)}
                      />
                    ))}
                  </Section>
                )}

                {student.soloEntry && (
                  <Section title="Solo / Show">
                    <Row
                      left={
                        <>
                          {student.soloEntry.entryType}{student.soloEntry.danceName && <> ({student.soloEntry.danceName})</>}: &ldquo;{student.soloEntry.routineName}&rdquo;
                        </>
                      }
                      day={SOLO_DAY}
                    />
                  </Section>
                )}

                {student.formationMembers.length > 0 && (
                  <Section title="Formation Teams">
                    {student.formationMembers.map((m, i: number) => (
                      <Row
                        key={i}
                        left={
                          <>
                            {m.team.name} <span className="text-xs opacity-70">({m.team.danceName})</span>
                            {m.instructor && <> &amp; {m.instructor.name}</>}
                          </>
                        }
                        day={FORMATION_DAY}
                      />
                    ))}
                  </Section>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
