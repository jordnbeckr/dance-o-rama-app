import { db } from '@/lib/db'
import Link from 'next/link'
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
  DAYS,
  DAY_COLORS,
  DAY_BG_COLORS,
  SOLO_DAY,
  FORMATION_DAY,
  danceDay,
  Day,
} from '@/lib/divisions'
import PaidDaysBadge from '@/components/PaidDaysBadge'

type Category = 'dance' | 'division' | 'couple' | 'solo' | 'formation'
type DayItem = { day: Day; category: Category; node: React.ReactNode; combo?: Combo }

const CATEGORY_LABELS: Record<Category, string> = {
  dance: 'Individual Dances',
  division: 'Competitive Events',
  couple: 'Couple Events',
  solo: 'Solo / Show',
  formation: 'Formation Teams',
}

// Individual Dances is purple; everything else shares one orange — simple,
// and neither reads as a day color even nested inside a same-colored day
// header (a "Competitive Events" box on a given day might hold All-Around,
// Open Bronze, or Scholarship entries, each with a different real day).
const PURPLE = '#7c3aed'
const ORANGE = '#c2410c'
const CATEGORY_COLORS: Record<Category, string> = {
  dance: PURPLE,
  division: ORANGE,
  couple: ORANGE,
  solo: ORANGE,
  formation: ORANGE,
}

// Opaque pastel fills — NOT a semi-transparent tint of CATEGORY_COLORS.
// A transparent tint blends with whatever's behind it, so the same
// category would look different (and slightly muddy) depending on which
// day's tinted section it happened to sit inside. Solid color reads
// identically everywhere.
const PURPLE_BG = '#ede9fe'
const ORANGE_BG = '#ffedd5'
const CATEGORY_BG: Record<Category, string> = {
  dance: PURPLE_BG,
  division: ORANGE_BG,
  couple: ORANGE_BG,
  solo: ORANGE_BG,
  formation: ORANGE_BG,
}

const CATEGORY_ORDER: Category[] = ['dance', 'division', 'couple', 'solo', 'formation']

type Combo = { ageCategory: string; level: string }

function comboKeyStr(c: Combo) {
  return `${c.ageCategory}::${c.level}`
}
function comboLabel(c: Combo) {
  return `${DANCE_AGE_LABELS[c.ageCategory] ?? AGE_LABELS[c.ageCategory] ?? c.ageCategory} · ${c.level}`
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]!.toUpperCase()).slice(0, 2).join('')
}

// Instructors only have one "name" field (no separate first/last), so the
// last whitespace-separated word stands in for a last name when sorting.
function lastNameOf(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts[parts.length - 1] ?? name
}

// Same square-initials badge either way — it names "the other person" on an
// entry line: an instructor's name in the student view, a student's name in
// the instructor view.
function PersonBadge({ name }: { name: string }) {
  return (
    <span
      title={name}
      className="inline-flex items-center justify-center font-bold"
      style={{ width: 20, height: 20, borderRadius: 5, border: '1.5px solid var(--header)', color: 'var(--header)', fontSize: '0.6rem', flexShrink: 0 }}
    >
      {initials(name)}
    </span>
  )
}

// Light-on-dark counterpart of PersonBadge, PaidDaysBadge, and the plaque
// pill — for use inside the navy banner where the light-bg versions
// elsewhere in the app wouldn't have enough contrast.
function PersonBadgeDark({ name }: { name: string }) {
  return (
    <span
      title={name}
      className="inline-flex items-center justify-center font-bold"
      style={{ width: 20, height: 20, borderRadius: 5, border: '1.5px solid rgba(255,255,255,.6)', color: '#fff', fontSize: '0.6rem', flexShrink: 0 }}
    >
      {initials(name)}
    </span>
  )
}

const DAY_SHORT: Record<Day, string> = { Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' }

function StudentDayBadges({ student }: { student: { paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean } }) {
  const paid = DAYS.filter(d => (d === 'Thursday' ? student.paidThursday : d === 'Friday' ? student.paidFriday : student.paidSaturday))
  if (paid.length === 0) {
    return <span style={{ color: 'rgba(255,255,255,.55)', fontSize: '0.7rem', fontStyle: 'italic' }}>no paid days</span>
  }
  return (
    <span className="inline-flex items-center gap-1">
      {paid.map(d => (
        <span
          key={d}
          style={{ backgroundColor: 'rgba(255,255,255,.18)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}
        >
          {DAY_SHORT[d]}
        </span>
      ))}
    </span>
  )
}

const GOLD = '#f5cb5c'

function PlaqueBadgeDark({ text = 'Plaque requested' }: { text?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1"
      style={{ backgroundColor: 'rgba(255,255,255,.18)', color: GOLD, fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 12 }}
    >
      <svg viewBox="0 0 20 20" style={{ width: 12, height: 12, flexShrink: 0 }}>
        <path
          d="M6 3h8v3.2c0 2.6-1.8 4.6-4 4.8v2h2.5v1.5h-6.5V13H8v-2c-2.2-.2-4-2.2-4-4.8V3z"
          fill={GOLD}
          stroke={GOLD}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path
          d="M6 4.2H3.8a1.4 1.4 0 0 0-1.4 1.6c.25 1.7 1.4 2.9 3 3.1M14 4.2h2.2a1.4 1.4 0 0 1 1.4 1.6c-.25 1.7-1.4 2.9-3 3.1"
          fill="none"
          stroke={GOLD}
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
      {text}
    </span>
  )
}

function SheetCard({ combo, entries }: { combo: Combo; entries: { day: Day; node: React.ReactNode }[] }) {
  const byDay = new Map<Day, React.ReactNode[]>()
  for (const e of entries) {
    if (!byDay.has(e.day)) byDay.set(e.day, [])
    byDay.get(e.day)!.push(e.node)
  }

  return (
    <div className="rounded overflow-hidden break-inside-avoid" style={{ border: `1px solid ${CATEGORY_COLORS.dance}` }}>
      <div
        className="text-xs font-bold uppercase tracking-wide px-2.5 py-1.5"
        style={{ backgroundColor: CATEGORY_BG.dance, color: CATEGORY_COLORS.dance }}
      >
        {comboLabel(combo)}
      </div>
      <div className="p-2.5 text-sm space-y-2">
        {DAYS.filter(day => byDay.has(day)).map(day => (
          <div key={day}>
            <p
              className="text-xs font-bold uppercase tracking-wide mb-1 inline-block px-2 py-0.5 rounded"
              style={{ backgroundColor: DAY_COLORS[day], color: '#fff' }}
            >
              {day}
            </p>
            <div className="space-y-0.5">
              {byDay.get(day)!.map((node, i) => <div key={i}>{node}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DaySection({ day, items }: { day: Day; items: { category: Category; node: React.ReactNode; combo?: Combo }[] }) {
  const byCategory = new Map<Category, { node: React.ReactNode; combo?: Combo }[]>()
  for (const item of items) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, [])
    byCategory.get(item.category)!.push({ node: item.node, combo: item.combo })
  }

  return (
    <div className="rounded overflow-hidden break-inside-avoid" style={{ border: '1px solid var(--border)' }}>
      <div
        className="text-sm font-extrabold uppercase px-3 py-2"
        style={{ backgroundColor: DAY_COLORS[day], color: '#fff', letterSpacing: '.07em' }}
      >
        {day}
      </div>
      <div className="p-2.5 space-y-2" style={{ backgroundColor: DAY_BG_COLORS[day] }}>
        {CATEGORY_ORDER.filter(cat => byCategory.has(cat)).map(cat => {
          const entries = byCategory.get(cat)!
          const byCombo = new Map<string, { combo: Combo; nodes: React.ReactNode[] }>()
          const uncategorized: React.ReactNode[] = []
          for (const e of entries) {
            if (e.combo) {
              const key = comboKeyStr(e.combo)
              if (!byCombo.has(key)) byCombo.set(key, { combo: e.combo, nodes: [] })
              byCombo.get(key)!.nodes.push(e.node)
            } else {
              uncategorized.push(e.node)
            }
          }
          const comboGroups = Array.from(byCombo.values()).sort((a, b) => comboLabel(a.combo).localeCompare(comboLabel(b.combo)))

          return (
            <div key={cat} className="rounded overflow-hidden" style={{ border: `1px solid ${CATEGORY_COLORS[cat]}` }}>
              <div
                className="text-xs font-bold uppercase tracking-wide px-2 py-1"
                style={{ backgroundColor: CATEGORY_BG[cat], color: CATEGORY_COLORS[cat] }}
              >
                {CATEGORY_LABELS[cat]}
              </div>
              <div className="p-2 text-sm space-y-2" style={{ backgroundColor: 'var(--card)' }}>
                {comboGroups.map(g => (
                  <div key={comboKeyStr(g.combo)}>
                    <p
                      className="text-xs font-bold uppercase tracking-wide mb-1 inline-block px-2 py-0.5 rounded"
                      style={{ backgroundColor: '#2a3545', color: '#fff' }}
                    >
                      {comboLabel(g.combo)}
                    </p>
                    <div className="space-y-1">
                      {g.nodes.map((node, i) => <div key={i}>{node}</div>)}
                    </div>
                  </div>
                ))}
                {uncategorized.length > 0 && (
                  <div className="space-y-1">
                    {uncategorized.map((node, i) => <div key={i}>{node}</div>)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Shared rendering for one person's block — a student in the student view,
// an instructor in the instructor view. The banner (name + badges) is the
// <summary>, always visible; the day/sheet breakdown is revealed on click.
function PersonSummaryBlock({
  id,
  name,
  leftBadges,
  rightExtras,
  entryCountLabel,
  items,
  sheets,
  noEntriesExtra,
}: {
  id: number
  name: string
  leftBadges: React.ReactNode
  rightExtras?: React.ReactNode
  entryCountLabel: string
  items: DayItem[]
  sheets: Map<string, { combo: Combo; entries: { day: Day; node: React.ReactNode }[] }>
  noEntriesExtra?: React.ReactNode
}) {
  const hasAnything = items.length > 0

  if (!hasAnything) {
    return (
      <div key={id} className="card p-4 break-inside-avoid">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-bold text-lg">{name}</h2>
          {noEntriesExtra}
          <span className="text-xs italic" style={{ color: 'var(--muted)' }}>No entries yet.</span>
        </div>
      </div>
    )
  }

  const byDay = new Map<Day, { category: Category; node: React.ReactNode; combo?: Combo }[]>()
  for (const item of items) {
    if (!byDay.has(item.day)) byDay.set(item.day, [])
    byDay.get(item.day)!.push({ category: item.category, node: item.node, combo: item.combo })
  }
  const sheetList = Array.from(sheets.values()).sort((a, b) => comboLabel(a.combo).localeCompare(comboLabel(b.combo)))

  return (
    <details key={id} className="card overflow-hidden break-inside-avoid">
      <summary
        className="cursor-pointer flex items-center justify-between gap-3 flex-wrap"
        style={{ background: 'linear-gradient(135deg, var(--header) 0%, #26365a 100%)', padding: '14px 18px' }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>{name}</span>
          {leftBadges}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {rightExtras}
          <span style={{ color: 'rgba(255,255,255,.6)', fontSize: '0.7rem' }}>{entryCountLabel}</span>
        </div>
      </summary>
      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          All entries, by day
        </p>
        <div className="grid gap-3 mt-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {DAYS.filter(day => byDay.has(day)).map(day => (
            <DaySection key={day} day={day} items={byDay.get(day)!} />
          ))}
        </div>

        {sheetList.length > 0 && (
          <>
            <p className="text-xs font-bold uppercase tracking-wide mt-4" style={{ color: 'var(--muted)' }}>
              Individual dances, by age/level sheet
            </p>
            <div className="grid gap-3 mt-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {sheetList.map(s => (
                <SheetCard key={comboKeyStr(s.combo)} combo={s.combo} entries={s.entries} />
              ))}
            </div>
          </>
        )}
      </div>
    </details>
  )
}

function ViewTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-semibold px-4 py-1.5 rounded-full no-print"
      style={{
        backgroundColor: active ? 'var(--header)' : 'var(--card)',
        color: active ? '#fff' : 'var(--muted)',
        border: `1.5px solid ${active ? 'var(--header)' : 'var(--border)'}`,
      }}
    >
      {children}
    </Link>
  )
}

export default async function SummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ by?: string }>
}) {
  const { slug } = await params
  const { by } = await searchParams
  const view = by === 'instructor' ? 'instructor' : 'student'

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
            include: { partnerStudent: { include: { studio: true } }, partnerInstructor: true },
          },
          coupleEventEntriesAsPartner: {
            include: { student: { include: { studio: true } } },
          },
          soloEntry: true,
          formationMembers: { include: { team: true, instructor: true } },
        },
      },
      instructors: {
        orderBy: { name: 'asc' },
        include: {
          partnerships: {
            include: {
              student: true,
              danceEntries: { include: { dance: true } },
              divisionEntries: true,
            },
          },
          coupleEventEntriesAsPartner: {
            include: { student: true },
          },
          soloEntries: {
            include: { student: true },
          },
          formationMembers: {
            include: { team: true, student: true },
          },
        },
      },
    },
  })
  if (!studio) return <p>Studio not found</p>

  return (
    <div className="max-w-4xl mx-auto space-y-4 print:max-w-full">
      <div style={{ background: 'linear-gradient(135deg, var(--header) 0%, #26365a 100%)', borderRadius: 8, padding: '20px 24px', textAlign: 'center' }}>
        <span
          style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,.14)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            padding: '4px 12px',
            borderRadius: 12,
            marginBottom: 10,
          }}
        >
          Dance-O-Rama Summary
        </span>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>{studio.name}</h1>
        <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, margin: '6px 0 0' }}>Printable rollup of every entry, organized by day</p>
      </div>

      <div className="flex justify-center gap-2">
        <ViewTab href={`/studio/${slug}/summary`} active={view === 'student'}>By Student</ViewTab>
        <ViewTab href={`/studio/${slug}/summary?by=instructor`} active={view === 'instructor'}>By Instructor</ViewTab>
      </div>

      {view === 'student' ? (
        <>
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
            coupleEventEntries: { section: string; eventName: string; partnerStudent: { firstName: string; lastName: string; studio: { name: string } } | null; partnerInstructor: { name: string } | null }[]
            coupleEventEntriesAsPartner: { section: string; eventName: string; student: { firstName: string; lastName: string; studio: { name: string } } }[]
            soloEntry: { entryType: string; routineName: string; danceName: string | null } | null
            formationMembers: { team: { name: string; danceName: string }; instructor: { name: string } | null }[]
          }) => {
            const multiplePartnerships = student.partnerships.filter(p => p.danceEntries.length > 0 || p.divisionEntries.length > 0).length > 1
            const items: DayItem[] = []
            const sheets = new Map<string, { combo: Combo; entries: { day: Day; node: React.ReactNode }[] }>()

            for (const p of student.partnerships) {
              const instructorBadge = multiplePartnerships ? <><PersonBadge name={p.instructor.name} /> </> : null
              for (const e of p.danceEntries) {
                const day = danceDay(e.dance.style, e.category)
                const combo: Combo = { ageCategory: e.ageCategory, level: e.level }
                items.push({
                  day,
                  category: 'dance',
                  combo,
                  node: (
                    <>
                      {instructorBadge}{e.dance.name} <span className="text-xs opacity-70">({e.category})</span>
                    </>
                  ),
                })

                const comboKey = comboKeyStr(combo)
                if (!sheets.has(comboKey)) sheets.set(comboKey, { combo, entries: [] })
                sheets.get(comboKey)!.entries.push({
                  day,
                  node: <>{instructorBadge}{e.dance.name} <span className="text-xs opacity-70">({e.category})</span></>,
                })
              }
              for (const e of p.divisionEntries) {
                const day = divisionEventDay(e.section as DivisionSectionKey, e.eventName)
                if (!day) continue
                items.push({
                  day,
                  category: 'division',
                  node: (
                    <>
                      {instructorBadge}{DIVISION_SECTIONS[e.section as DivisionSectionKey]?.label ?? e.section} — {e.eventName}
                      {' '}<span className="text-xs opacity-70">({divisionAgeLabel(e.section as DivisionSectionKey, e.ageCategory)})</span>
                    </>
                  ),
                })
              }
            }

            for (const e of student.coupleEventEntries) {
              const day = coupleEventDay(e.section as CoupleEventSectionKey, e.eventName)
              if (!day) continue
              items.push({
                day,
                // Club 3-Dance is a division in spirit (open freestyle, not a
                // couple-search event) — group it with Competitive Events.
                category: e.section === 'Club' ? 'division' : 'couple',
                node: (
                  <>
                    {!e.partnerStudent && e.partnerInstructor && <><PersonBadge name={e.partnerInstructor.name} /> </>}
                    {COUPLE_EVENT_SECTIONS[e.section as CoupleEventSectionKey]?.label ?? e.section} — {e.eventName}
                    {e.partnerStudent && <> with {e.partnerStudent.firstName} {e.partnerStudent.lastName} ({e.partnerStudent.studio.name})</>}
                  </>
                ),
              })
            }
            for (const e of student.coupleEventEntriesAsPartner) {
              const day = coupleEventDay(e.section as CoupleEventSectionKey, e.eventName)
              if (!day) continue
              items.push({
                day,
                category: e.section === 'Club' ? 'division' : 'couple',
                node: (
                  <>
                    {COUPLE_EVENT_SECTIONS[e.section as CoupleEventSectionKey]?.label ?? e.section} — {e.eventName}
                    {' '}with {e.student.firstName} {e.student.lastName} ({e.student.studio.name})
                  </>
                ),
              })
            }

            if (student.soloEntry) {
              items.push({
                day: SOLO_DAY,
                category: 'solo',
                node: (
                  <>
                    {student.soloEntry.entryType}{student.soloEntry.danceName && <> ({student.soloEntry.danceName})</>}: &ldquo;{student.soloEntry.routineName}&rdquo;
                  </>
                ),
              })
            }

            for (const m of student.formationMembers) {
              items.push({
                day: FORMATION_DAY,
                category: 'formation',
                node: (
                  <>
                    {m.instructor && <><PersonBadge name={m.instructor.name} /> </>}
                    {m.team.name} <span className="text-xs opacity-70">({m.team.danceName})</span>
                  </>
                ),
              })
            }

            const hasAnything = items.length > 0
            const plaqueRequested = student.partnerships.some(p => p.awardPlaque)
            const activeInstructors = Array.from(
              new Set(
                student.partnerships
                  .filter(p => p.danceEntries.length > 0 || p.divisionEntries.length > 0)
                  .map(p => p.instructor.name)
              )
            )

            return {
              count: items.length,
              lastName: student.lastName,
              node: (
                <PersonSummaryBlock
                  key={student.id}
                  id={student.id}
                  name={`${student.firstName} ${student.lastName}`}
                  leftBadges={activeInstructors.map(name => <PersonBadgeDark key={name} name={name} />)}
                  rightExtras={
                    <>
                      <StudentDayBadges student={student} />
                      {plaqueRequested && <PlaqueBadgeDark />}
                    </>
                  }
                  entryCountLabel={hasAnything ? `${items.length} entr${items.length === 1 ? 'y' : 'ies'}` : 'No entries yet'}
                  items={items}
                  sheets={sheets}
                  noEntriesExtra={<PaidDaysBadge student={student} />}
                />
              ),
            }
          })
            .sort((a, b) => b.count - a.count || a.lastName.localeCompare(b.lastName))
            .map(b => b.node)}
        </>
      ) : (
        <>
          {studio.instructors.length === 0 && (
            <p className="text-sm italic text-center" style={{ color: 'var(--muted)' }}>No instructors on the roster yet.</p>
          )}

          {studio.instructors.map((instructor: {
            id: number
            name: string
            partnerships: {
              student: { firstName: string; lastName: string }
              awardPlaque: boolean
              danceEntries: { category: string; ageCategory: string; level: string; dance: { name: string; style: string } }[]
              divisionEntries: { section: string; ageCategory: string; eventName: string }[]
            }[]
            coupleEventEntriesAsPartner: { section: string; eventName: string; student: { firstName: string; lastName: string } }[]
            soloEntries: { entryType: string; routineName: string; danceName: string | null; student: { firstName: string; lastName: string } }[]
            formationMembers: { team: { name: string; danceName: string }; student: { firstName: string; lastName: string } }[]
          }) => {
            const activeStudentPartnerships = instructor.partnerships.filter(p => p.danceEntries.length > 0 || p.divisionEntries.length > 0)
            const multipleStudents = activeStudentPartnerships.length > 1
            const items: DayItem[] = []
            const sheets = new Map<string, { combo: Combo; entries: { day: Day; node: React.ReactNode }[] }>()

            for (const p of instructor.partnerships) {
              const studentName = `${p.student.firstName} ${p.student.lastName}`
              const studentBadge = multipleStudents ? <><PersonBadge name={studentName} /> </> : null
              for (const e of p.danceEntries) {
                const day = danceDay(e.dance.style, e.category)
                const combo: Combo = { ageCategory: e.ageCategory, level: e.level }
                items.push({
                  day,
                  category: 'dance',
                  combo,
                  node: (
                    <>
                      {studentBadge}{e.dance.name} <span className="text-xs opacity-70">({e.category})</span>
                    </>
                  ),
                })

                const comboKey = comboKeyStr(combo)
                if (!sheets.has(comboKey)) sheets.set(comboKey, { combo, entries: [] })
                sheets.get(comboKey)!.entries.push({
                  day,
                  node: <>{studentBadge}{e.dance.name} <span className="text-xs opacity-70">({e.category})</span></>,
                })
              }
              for (const e of p.divisionEntries) {
                const day = divisionEventDay(e.section as DivisionSectionKey, e.eventName)
                if (!day) continue
                items.push({
                  day,
                  category: 'division',
                  node: (
                    <>
                      {studentBadge}{DIVISION_SECTIONS[e.section as DivisionSectionKey]?.label ?? e.section} — {e.eventName}
                      {' '}<span className="text-xs opacity-70">({divisionAgeLabel(e.section as DivisionSectionKey, e.ageCategory)})</span>
                    </>
                  ),
                })
              }
            }

            for (const e of instructor.coupleEventEntriesAsPartner) {
              const day = coupleEventDay(e.section as CoupleEventSectionKey, e.eventName)
              if (!day) continue
              items.push({
                day,
                category: e.section === 'Club' ? 'division' : 'couple',
                node: (
                  <>
                    <PersonBadge name={`${e.student.firstName} ${e.student.lastName}`} />{' '}
                    {COUPLE_EVENT_SECTIONS[e.section as CoupleEventSectionKey]?.label ?? e.section} — {e.eventName}
                  </>
                ),
              })
            }

            for (const e of instructor.soloEntries) {
              items.push({
                day: SOLO_DAY,
                category: 'solo',
                node: (
                  <>
                    <PersonBadge name={`${e.student.firstName} ${e.student.lastName}`} />{' '}
                    {e.entryType}{e.danceName && <> ({e.danceName})</>}: &ldquo;{e.routineName}&rdquo;
                  </>
                ),
              })
            }

            for (const m of instructor.formationMembers) {
              items.push({
                day: FORMATION_DAY,
                category: 'formation',
                node: (
                  <>
                    <PersonBadge name={`${m.student.firstName} ${m.student.lastName}`} />{' '}
                    {m.team.name} <span className="text-xs opacity-70">({m.team.danceName})</span>
                  </>
                ),
              })
            }

            const hasAnything = items.length > 0
            const plaqueCount = instructor.partnerships.filter(p => p.awardPlaque).length
            const activeStudents = Array.from(
              new Set([
                ...activeStudentPartnerships.map(p => `${p.student.firstName} ${p.student.lastName}`),
                ...instructor.coupleEventEntriesAsPartner.map(e => `${e.student.firstName} ${e.student.lastName}`),
                ...instructor.soloEntries.map(e => `${e.student.firstName} ${e.student.lastName}`),
                ...instructor.formationMembers.map(m => `${m.student.firstName} ${m.student.lastName}`),
              ])
            )

            return {
              count: items.length,
              lastName: lastNameOf(instructor.name),
              node: (
                <PersonSummaryBlock
                  key={instructor.id}
                  id={instructor.id}
                  name={instructor.name}
                  leftBadges={activeStudents.map(name => <PersonBadgeDark key={name} name={name} />)}
                  rightExtras={
                    plaqueCount > 0 ? <PlaqueBadgeDark text={`${plaqueCount} plaque${plaqueCount === 1 ? '' : 's'} requested`} /> : null
                  }
                  entryCountLabel={hasAnything ? `${items.length} entr${items.length === 1 ? 'y' : 'ies'}` : 'No entries yet'}
                  items={items}
                  sheets={sheets}
                />
              ),
            }
          })
            .sort((a, b) => b.count - a.count || a.lastName.localeCompare(b.lastName))
            .map(b => b.node)}
        </>
      )}
    </div>
  )
}
