import { db } from '@/lib/db'
import { AGE_LABELS, DIVISION_SECTIONS, DivisionSectionKey, divisionEventDay, COUPLE_EVENT_SECTIONS, CoupleEventSectionKey, coupleEventDay, DAY_COLORS, SOLO_DAY, FORMATION_DAY, danceDay } from '@/lib/divisions'
import PaidDaysBadge from '@/components/PaidDaysBadge'

export default async function MasterViewPage({
  searchParams,
}: {
  searchParams: Promise<{ studio?: string }>
}) {
  const { studio: studioFilter } = await searchParams
  const studios = await db.studio.findMany({ orderBy: { name: 'asc' } })
  const studioWhere = studioFilter ? { studio: { slug: studioFilter } } : {}

  const [danceEntries, divisionEntries, coupleEvents, solos, formationTeams, plaqueRequests, allStudents] = await Promise.all([
    db.danceEntry.findMany({
      where: { partnership: studioFilter ? { studio: { slug: studioFilter } } : {} },
      include: { dance: true, partnership: { include: { student: true, instructor: true, studio: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.divisionEntry.findMany({
      where: { partnership: studioFilter ? { studio: { slug: studioFilter } } : {} },
      include: { partnership: { include: { student: true, instructor: true, studio: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.coupleEventEntry.findMany({
      where: studioFilter
        ? { OR: [{ studio: { slug: studioFilter } }, { student: { studio: { slug: studioFilter } } }, { partnerStudent: { studio: { slug: studioFilter } } }] }
        : {},
      include: {
        student: { include: { studio: true } },
        partnerStudent: { include: { studio: true } },
        partnerInstructor: { include: { studio: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.soloEntry.findMany({
      where: studioFilter ? { studio: { slug: studioFilter } } : {},
      include: { student: true, studio: true, instructor: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.formationTeam.findMany({
      where: studioFilter ? { studio: { slug: studioFilter } } : {},
      include: { studio: true, members: { include: { student: true, instructor: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.partnership.findMany({
      where: { awardPlaque: true, ...(studioFilter ? { studio: { slug: studioFilter } } : {}) },
      include: { student: true, instructor: true, studio: true },
    }),
    db.student.findMany({
      where: studioFilter ? { studio: { slug: studioFilter } } : {},
      include: { studio: true },
      orderBy: [{ studio: { name: 'asc' } }, { lastName: 'asc' }],
    }),
  ])

  // Division counts across all entries (informational, mirrors the "3+ entrants" note)
  const divisionCounts = new Map<string, number>()
  for (const e of divisionEntries) {
    const label = `${DIVISION_SECTIONS[e.section as DivisionSectionKey]?.label ?? e.section} — ${e.eventName} (${AGE_LABELS[e.ageCategory] ?? e.ageCategory})`
    divisionCounts.set(label, (divisionCounts.get(label) ?? 0) + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Master View</h1>
        <form method="get" className="flex gap-2 items-center">
          <label className="text-sm">Studio:</label>
          <select name="studio" defaultValue={studioFilter ?? ''} className="field" style={{ width: 200 }}>
            <option value="">All studios</option>
            {studios.map((s: { slug: string; name: string }) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
          <button type="submit" className="px-3 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}>
            Filter
          </button>
        </form>
      </div>

      <div className="card p-4 overflow-x-auto">
        <h2 className="font-bold text-base mb-2">Paid Days ({allStudents.length} students)</h2>
        <table className="data-table">
          <thead><tr><th>Studio</th><th>Student</th><th>Paid Days</th></tr></thead>
          <tbody>
            {allStudents.map((s: { id: number; firstName: string; lastName: string; studio: { name: string }; paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }) => (
              <tr key={s.id}>
                <td>{s.studio.name}</td>
                <td>{s.firstName} {s.lastName}</td>
                <td><PaidDaysBadge student={s} /></td>
              </tr>
            ))}
            {allStudents.length === 0 && <tr><td colSpan={3} className="italic" style={{ color: 'var(--muted)' }}>No students yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card p-4">
        <h2 className="font-bold text-base mb-2">🏆 Plaque Requests ({plaqueRequests.length})</h2>
        {plaqueRequests.length === 0 ? (
          <p className="text-sm italic" style={{ color: 'var(--muted)' }}>None yet.</p>
        ) : (
          <ul className="text-sm space-y-0.5">
            {plaqueRequests.map((p: { id: number; student: { firstName: string; lastName: string }; instructor: { name: string }; studio: { name: string } }) => (
              <li key={p.id}>{p.student.firstName} {p.student.lastName} &amp; {p.instructor.name} — {p.studio.name}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-4">
        <h2 className="font-bold text-base mb-2">Division Counts</h2>
        <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
          Informational — the paper form notes separate divisions get created for any multi-dance event with 3+ male and 3+ female entrants.
        </p>
        <table className="data-table">
          <thead><tr><th>Division</th><th>Entries</th></tr></thead>
          <tbody>
            {Array.from(divisionCounts.entries()).sort((a, b) => b[1] - a[1]).map(([label, count]) => (
              <tr key={label}><td>{label}</td><td>{count}</td></tr>
            ))}
            {divisionCounts.size === 0 && <tr><td colSpan={2} className="italic" style={{ color: 'var(--muted)' }}>No division entries yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card p-4 overflow-x-auto">
        <h2 className="font-bold text-base mb-2">Section 1 — Dance Entries ({danceEntries.length})</h2>
        <table className="data-table">
          <thead><tr><th>Studio</th><th>Student</th><th>Instructor</th><th>Dance</th><th>Day</th><th>Category</th><th>Age</th><th>Level</th></tr></thead>
          <tbody>
            {danceEntries.map((e: { id: number; category: string; ageCategory: string; level: string; dance: { name: string; style: string }; partnership: { studio: { name: string }; student: { firstName: string; lastName: string }; instructor: { name: string } } }) => {
              const day = danceDay(e.dance.style, e.category)
              return (
                <tr key={e.id}>
                  <td>{e.partnership.studio.name}</td>
                  <td>{e.partnership.student.firstName} {e.partnership.student.lastName}</td>
                  <td>{e.partnership.instructor.name}</td>
                  <td>{e.dance.name}</td>
                  <td style={{ color: DAY_COLORS[day] }}>{day}</td>
                  <td>{e.category}</td>
                  <td>{AGE_LABELS[e.ageCategory] ?? e.ageCategory}</td>
                  <td>{e.level}</td>
                </tr>
              )
            })}
            {danceEntries.length === 0 && <tr><td colSpan={8} className="italic" style={{ color: 'var(--muted)' }}>None yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card p-4 overflow-x-auto">
        <h2 className="font-bold text-base mb-2">Sections 2-4 — Division Entries ({divisionEntries.length})</h2>
        <table className="data-table">
          <thead><tr><th>Studio</th><th>Student</th><th>Instructor</th><th>Section</th><th>Day</th><th>Age</th><th>Event</th></tr></thead>
          <tbody>
            {divisionEntries.map((e: { id: number; section: string; ageCategory: string; eventName: string; partnership: { studio: { name: string }; student: { firstName: string; lastName: string }; instructor: { name: string } } }) => {
              const day = divisionEventDay(e.section as DivisionSectionKey, e.eventName)
              return (
                <tr key={e.id}>
                  <td>{e.partnership.studio.name}</td>
                  <td>{e.partnership.student.firstName} {e.partnership.student.lastName}</td>
                  <td>{e.partnership.instructor.name}</td>
                  <td>{DIVISION_SECTIONS[e.section as DivisionSectionKey]?.label ?? e.section}</td>
                  <td style={{ color: day ? DAY_COLORS[day] : undefined }}>{day}</td>
                  <td>{AGE_LABELS[e.ageCategory] ?? e.ageCategory}</td>
                  <td>{e.eventName}</td>
                </tr>
              )
            })}
            {divisionEntries.length === 0 && <tr><td colSpan={7} className="italic" style={{ color: 'var(--muted)' }}>None yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card p-4 overflow-x-auto">
        <h2 className="font-bold text-base mb-2">Sections 5-6 — Couple Events ({coupleEvents.length})</h2>
        <table className="data-table">
          <thead><tr><th>Student</th><th>Partner</th><th>Section</th><th>Event</th><th>Day</th></tr></thead>
          <tbody>
            {coupleEvents.map((e: { id: number; section: string; eventName: string; student: { firstName: string; lastName: string; studio: { name: string } }; partnerStudent: { firstName: string; lastName: string; studio: { name: string } } | null; partnerInstructor: { name: string; studio: { name: string } } | null }) => {
              const day = coupleEventDay(e.section as CoupleEventSectionKey, e.eventName)
              return (
                <tr key={e.id}>
                  <td>{e.student.firstName} {e.student.lastName} ({e.student.studio.name})</td>
                  <td>{e.partnerStudent ? `${e.partnerStudent.firstName} ${e.partnerStudent.lastName} (${e.partnerStudent.studio.name})` : `${e.partnerInstructor?.name} (${e.partnerInstructor?.studio.name}, instructor)`}</td>
                  <td>{COUPLE_EVENT_SECTIONS[e.section as CoupleEventSectionKey]?.label ?? e.section}</td>
                  <td>{e.eventName}</td>
                  <td style={{ color: day ? DAY_COLORS[day] : undefined }}>{day}</td>
                </tr>
              )
            })}
            {coupleEvents.length === 0 && <tr><td colSpan={5} className="italic" style={{ color: 'var(--muted)' }}>None yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card p-4 overflow-x-auto">
        <h2 className="font-bold text-base mb-2">
          Section 7 — Solo / Show Routines ({solos.length}){' '}
          <span className="text-xs font-normal" style={{ color: DAY_COLORS[SOLO_DAY] }}>({SOLO_DAY})</span>
        </h2>
        <table className="data-table">
          <thead><tr><th>Studio</th><th>Student</th><th>Type</th><th>Dance</th><th>Routine</th><th>Instructor</th></tr></thead>
          <tbody>
            {solos.map((e: { id: number; entryType: string; danceName: string | null; routineName: string; studio: { name: string }; student: { firstName: string; lastName: string }; instructor: { name: string } | null }) => (
              <tr key={e.id}>
                <td>{e.studio.name}</td>
                <td>{e.student.firstName} {e.student.lastName}</td>
                <td>{e.entryType}</td>
                <td>{e.danceName ?? '—'}</td>
                <td>{e.routineName}</td>
                <td>{e.instructor?.name ?? '—'}</td>
              </tr>
            ))}
            {solos.length === 0 && <tr><td colSpan={6} className="italic" style={{ color: 'var(--muted)' }}>None yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card p-4 overflow-x-auto">
        <h2 className="font-bold text-base mb-2">
          Section 8 — Formation Teams ({formationTeams.length}){' '}
          <span className="text-xs font-normal" style={{ color: DAY_COLORS[FORMATION_DAY] }}>({FORMATION_DAY})</span>
        </h2>
        <table className="data-table">
          <thead><tr><th>Studio</th><th>Dance</th><th>Members</th></tr></thead>
          <tbody>
            {formationTeams.map((t: { id: number; danceName: string; studio: { name: string }; members: { student: { firstName: string; lastName: string }; instructor: { name: string } | null }[] }) => (
              <tr key={t.id}>
                <td>{t.studio.name}</td>
                <td>{t.danceName}</td>
                <td>{t.members.map(m => `${m.student.firstName} ${m.student.lastName}${m.instructor ? ` & ${m.instructor.name}` : ''}`).join(', ') || '—'}</td>
              </tr>
            ))}
            {formationTeams.length === 0 && <tr><td colSpan={3} className="italic" style={{ color: 'var(--muted)' }}>None yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
