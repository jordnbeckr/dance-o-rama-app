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
  DAY_BG_COLORS,
  SOLO_DAY,
  FORMATION_DAY,
  danceDay,
  Day,
} from '@/lib/divisions'
import PaidDaysBadge from '@/components/PaidDaysBadge'

type Category = 'dance' | 'division' | 'couple' | 'solo' | 'formation'
type DayItem = { day: Day; category: Category; node: React.ReactNode }

const CATEGORY_COLORS: Record<Category, string> = {
  dance: '#7a2f4e',
  division: '#7c3aed',
  couple: '#2d5fa3',
  solo: '#608040',
  formation: '#92400e',
}

const CATEGORY_LABELS: Record<Category, string> = {
  dance: 'Individual Dances',
  division: 'Divisions',
  couple: 'Couple Events',
  solo: 'Solo / Show',
  formation: 'Formation Teams',
}

const CATEGORY_ORDER: Category[] = ['dance', 'division', 'couple', 'solo', 'formation']

function DaySection({ day, items }: { day: Day; items: { category: Category; node: React.ReactNode }[] }) {
  const byCategory = new Map<Category, React.ReactNode[]>()
  for (const item of items) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, [])
    byCategory.get(item.category)!.push(item.node)
  }

  return (
    <div className="rounded overflow-hidden break-inside-avoid" style={{ border: '1px solid var(--border)' }}>
      <div
        className="text-xs font-bold uppercase tracking-wide px-2.5 py-1.5"
        style={{ backgroundColor: DAY_BG_COLORS[day], color: DAY_COLORS[day], borderBottom: '1px solid var(--border)' }}
      >
        {day}
      </div>
      <div className="p-2.5 space-y-2">
        {CATEGORY_ORDER.filter(cat => byCategory.has(cat)).map(cat => (
          <div key={cat} className="rounded overflow-hidden" style={{ border: `1px solid ${CATEGORY_COLORS[cat]}55` }}>
            <div
              className="text-xs font-bold uppercase tracking-wide px-2 py-1"
              style={{ backgroundColor: `${CATEGORY_COLORS[cat]}1a`, color: CATEGORY_COLORS[cat] }}
            >
              {CATEGORY_LABELS[cat]}
            </div>
            <div className="p-2 text-sm space-y-1">
              {byCategory.get(cat)!.map((node, i) => (
                <div key={i}>{node}</div>
              ))}
            </div>
          </div>
        ))}
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
        coupleEventEntries: { section: string; eventName: string; partnerStudent: { firstName: string; lastName: string; studio: { name: string } } | null; partnerInstructor: { name: string; studio: { name: string } } | null }[]
        coupleEventEntriesAsPartner: { section: string; eventName: string; student: { firstName: string; lastName: string; studio: { name: string } } }[]
        soloEntry: { entryType: string; routineName: string; danceName: string | null } | null
        formationMembers: { team: { name: string; danceName: string }; instructor: { name: string } | null }[]
      }) => {
        const multiplePartnerships = student.partnerships.filter(p => p.danceEntries.length > 0 || p.divisionEntries.length > 0).length > 1
        const items: DayItem[] = []

        for (const p of student.partnerships) {
          const withSuffix = multiplePartnerships ? ` — with ${p.instructor.name}` : ''
          for (const e of p.danceEntries) {
            items.push({
              day: danceDay(e.dance.style, e.category),
              category: 'dance',
              node: (
                <>
                  {e.dance.name} <span className="text-xs opacity-70">({e.category})</span>
                  {' '}— {DANCE_AGE_LABELS[e.ageCategory] ?? AGE_LABELS[e.ageCategory] ?? e.ageCategory} · {e.level}
                  {withSuffix}
                </>
              ),
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
                {' '}with {e.partnerStudent ? `${e.partnerStudent.firstName} ${e.partnerStudent.lastName} (${e.partnerStudent.studio.name})` : `${e.partnerInstructor?.name} (${e.partnerInstructor?.studio.name}, instructor)`}
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

        const byDay = new Map<Day, { category: Category; node: React.ReactNode }[]>()
        for (const item of items) {
          if (!byDay.has(item.day)) byDay.set(item.day, [])
          byDay.get(item.day)!.push({ category: item.category, node: item.node })
        }

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
            <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {DAYS.filter(day => byDay.has(day)).map(day => (
                <DaySection key={day} day={day} items={byDay.get(day)!} />
              ))}
            </div>
          </details>
        )
      })}
    </div>
  )
}
