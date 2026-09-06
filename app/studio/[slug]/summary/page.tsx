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
  DAYS,
  DAY_COLORS,
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
  division: 'Divisions',
  couple: 'Couple Events',
  solo: 'Solo / Show',
  formation: 'Formation Teams',
}

const CATEGORY_ORDER: Category[] = ['dance', 'division', 'couple', 'solo', 'formation']

type Combo = { ageCategory: string; level: string }

function comboKeyStr(c: Combo) {
  return `${c.ageCategory}::${c.level}`
}
function comboLabel(c: Combo) {
  return `${DANCE_AGE_LABELS[c.ageCategory] ?? AGE_LABELS[c.ageCategory] ?? c.ageCategory} · ${c.level}`
}

// Categories are told apart by icon + label only — color is reserved for
// days, so a division/couple/solo box never risks reading as "this is
// Thursday" the way a green- or blue-tinted card would.
function CategoryIcon({ category }: { category: Category }) {
  const common = { viewBox: '0 0 20 20', style: { width: 12, height: 12, flexShrink: 0 }, fill: 'currentColor' } as const
  switch (category) {
    case 'dance':
      return (
        <svg {...common}>
          <circle cx="6" cy="15" r="2.3" />
          <circle cx="14" cy="12" r="2.3" />
          <path d="M8 15V4l8-2v10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'division':
      return (
        <svg {...common}>
          <circle cx="10" cy="7" r="4.2" />
          <path d="M7.3 10.8L6 18l4-2 4 2-1.3-7.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      )
    case 'couple':
      return (
        <svg {...common}>
          <circle cx="7" cy="10" r="5" />
          <circle cx="13" cy="10" r="5" opacity="0.55" />
        </svg>
      )
    case 'solo':
      return (
        <svg {...common}>
          <path d="M10 2l2.2 5.6 6 .4-4.6 3.9 1.6 5.8L10 14.8 4.8 17.7l1.6-5.8L1.8 8l6-.4z" />
        </svg>
      )
    case 'formation':
      return (
        <svg {...common}>
          <circle cx="10" cy="4.5" r="2.3" />
          <circle cx="4.5" cy="15" r="2.3" />
          <circle cx="15.5" cy="15" r="2.3" />
        </svg>
      )
  }
}

function SheetCard({ combo, entries }: { combo: Combo; entries: { day: Day; node: React.ReactNode }[] }) {
  const byDay = new Map<Day, React.ReactNode[]>()
  for (const e of entries) {
    if (!byDay.has(e.day)) byDay.set(e.day, [])
    byDay.get(e.day)!.push(e.node)
  }

  return (
    <div className="rounded overflow-hidden break-inside-avoid" style={{ border: '1px solid var(--border)' }}>
      <div
        className="text-xs font-bold uppercase tracking-wide px-2.5 py-1.5"
        style={{ backgroundColor: '#eef0f3', color: '#2a3545', borderBottom: '1px solid var(--border)' }}
      >
        {comboLabel(combo)}
      </div>
      <div className="p-2.5 text-sm space-y-2">
        {DAYS.filter(day => byDay.has(day)).map(day => (
          <div key={day}>
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: DAY_COLORS[day] }}>{day}</p>
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
      <div className="p-2.5 space-y-2">
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
            <div key={cat} className="rounded overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div
                className="text-xs font-bold uppercase tracking-wide px-2 py-1 flex items-center gap-1.5"
                style={{ backgroundColor: '#eef0f3', color: '#2a3545' }}
              >
                <CategoryIcon category={cat} />
                {CATEGORY_LABELS[cat]}
              </div>
              <div className="p-2 text-sm space-y-2" style={{ backgroundColor: 'var(--card)' }}>
                {comboGroups.map(g => (
                  <div key={comboKeyStr(g.combo)}>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>{comboLabel(g.combo)}</p>
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
            include: { partnerStudent: { include: { studio: true } }, partnerInstructor: true },
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
    <div className="max-w-4xl mx-auto space-y-4 print:max-w-full">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{studio.name} — Dance-O-Rama Summary</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Printable rollup of every entry, per student, organized by day</p>
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
        coupleEventEntries: { section: string; eventName: string; partnerStudent: { firstName: string; lastName: string; studio: { name: string } } | null; partnerInstructor: { name: string } | null }[]
        coupleEventEntriesAsPartner: { section: string; eventName: string; student: { firstName: string; lastName: string; studio: { name: string } } }[]
        soloEntry: { entryType: string; routineName: string; danceName: string | null } | null
        formationMembers: { team: { name: string; danceName: string }; instructor: { name: string } | null }[]
      }) => {
        const multiplePartnerships = student.partnerships.filter(p => p.danceEntries.length > 0 || p.divisionEntries.length > 0).length > 1
        const items: DayItem[] = []
        const sheets = new Map<string, { combo: Combo; entries: { day: Day; node: React.ReactNode }[] }>()

        for (const p of student.partnerships) {
          const withSuffix = multiplePartnerships ? ` — with ${p.instructor.name}` : ''
          for (const e of p.danceEntries) {
            const day = danceDay(e.dance.style, e.category)
            const combo: Combo = { ageCategory: e.ageCategory, level: e.level }
            items.push({
              day,
              category: 'dance',
              combo,
              node: (
                <>
                  {e.dance.name} <span className="text-xs opacity-70">({e.category})</span>
                  {withSuffix}
                </>
              ),
            })

            const comboKey = comboKeyStr(combo)
            if (!sheets.has(comboKey)) sheets.set(comboKey, { combo, entries: [] })
            sheets.get(comboKey)!.entries.push({
              day,
              node: <>{e.dance.name} <span className="text-xs opacity-70">({e.category})</span>{withSuffix}</>,
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
                  {DIVISION_SECTIONS[e.section as DivisionSectionKey]?.label ?? e.section} — {e.eventName}
                  {' '}<span className="text-xs opacity-70">({divisionAgeLabel(e.section as DivisionSectionKey, e.ageCategory)})</span>
                  {withSuffix}
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
            category: 'couple',
            node: (
              <>
                {COUPLE_EVENT_SECTIONS[e.section as CoupleEventSectionKey]?.label ?? e.section} — {e.eventName}
                {' '}with {e.partnerStudent ? `${e.partnerStudent.firstName} ${e.partnerStudent.lastName} (${e.partnerStudent.studio.name})` : e.partnerInstructor?.name}
              </>
            ),
          })
        }
        for (const e of student.coupleEventEntriesAsPartner) {
          const day = coupleEventDay(e.section as CoupleEventSectionKey, e.eventName)
          if (!day) continue
          items.push({
            day,
            category: 'couple',
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
                {m.team.name} <span className="text-xs opacity-70">({m.team.danceName})</span>
                {m.instructor && <> &amp; {m.instructor.name}</>}
              </>
            ),
          })
        }

        const byDay = new Map<Day, { category: Category; node: React.ReactNode; combo?: Combo }[]>()
        for (const item of items) {
          if (!byDay.has(item.day)) byDay.set(item.day, [])
          byDay.get(item.day)!.push({ category: item.category, node: item.node, combo: item.combo })
        }

        const sheetList = Array.from(sheets.values()).sort((a, b) => comboLabel(a.combo).localeCompare(comboLabel(b.combo)))

        const hasAnything = items.length > 0
        const plaqueRequested = student.partnerships.some(p => p.awardPlaque)

        const summaryLine = (
          <summary className="cursor-pointer flex items-center gap-3 flex-wrap">
            <span className="font-bold text-lg">{student.firstName} {student.lastName}</span>
            <PaidDaysBadge student={student} />
            {plaqueRequested && <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>🏆 plaque requested</span>}
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {hasAnything ? `${items.length} entr${items.length === 1 ? 'y' : 'ies'}` : 'No entries yet'}
            </span>
          </summary>
        )

        if (!hasAnything) {
          return (
            <div key={student.id} className="card p-4 break-inside-avoid">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-bold text-lg">{student.firstName} {student.lastName}</h2>
                <PaidDaysBadge student={student} />
                <span className="text-xs italic" style={{ color: 'var(--muted)' }}>No entries yet.</span>
              </div>
            </div>
          )
        }

        return (
          <details key={student.id} className="card p-4 break-inside-avoid">
            {summaryLine}
            <p className="text-xs font-bold uppercase tracking-wide mt-3" style={{ color: 'var(--muted)' }}>
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
          </details>
        )
      })}
    </div>
  )
}
