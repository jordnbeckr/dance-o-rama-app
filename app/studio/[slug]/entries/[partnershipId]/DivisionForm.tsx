'use client'

import { useState, useTransition } from 'react'
import { addDivisionEntry, removeDivisionEntry } from '@/app/actions/divisionEntries'
import { DIVISION_SECTIONS, DivisionSectionKey, divisionAgeLabel, DAY_COLORS, DAY_BG_COLORS, JEWEL_TONES, studentHasPaidFor } from '@/lib/divisions'

type Entry = { id: number; section: string; ageCategory: string; eventName: string }
type StudentPaid = { firstName: string; paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }
type Selection = { ages: string[]; events: string[] }

const SECTION_KEYS = Object.keys(DIVISION_SECTIONS) as DivisionSectionKey[]

// A section that runs entirely on one day gets a jewel-toned version of
// that day's color — a hint of the day identity without the stark, primary
// intensity of the raw day color. A section that mixes days (Scholarship)
// gets a distinct non-day color instead, so it never reads as "this one's
// Friday" (or Thursday) when it isn't.
const SECTION_COLORS: Record<DivisionSectionKey, string> = {
  AllAround: JEWEL_TONES.garnet,
  OpenBronze3Dance: JEWEL_TONES.sapphire,
  Scholarship: JEWEL_TONES.gold,
}

function cellKey(age: string, eventName: string) {
  return `${age}::${eventName}`
}

export default function DivisionForm({
  slug,
  partnershipId,
  entries,
  student,
}: {
  slug: string
  partnershipId: number
  entries: Entry[]
  student: StudentPaid
}) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Each section's checked chips are tracked locally (like the top Age/Level
  // picker) so checking an age with no event yet — or vice versa — still
  // registers instead of silently no-op'ing on an empty cross product.
  const [selected, setSelected] = useState<Record<string, Selection>>(() => {
    const initial: Record<string, Selection> = {}
    for (const section of SECTION_KEYS) {
      const sectionEntries = entries.filter(e => e.section === section)
      initial[section] = {
        ages: Array.from(new Set(sectionEntries.map(e => e.ageCategory))),
        events: Array.from(new Set(sectionEntries.map(e => e.eventName))),
      }
    }
    return initial
  })

  function reconcile(section: DivisionSectionKey, ages: string[], events: string[]) {
    const sectionEntries = entries.filter(e => e.section === section)
    const existing = new Set(sectionEntries.map(e => cellKey(e.ageCategory, e.eventName)))
    const desired = new Set(ages.flatMap(a => events.map(ev => cellKey(a, ev))))
    setError(null)
    startTransition(async () => {
      for (const age of ages) {
        for (const eventName of events) {
          if (!existing.has(cellKey(age, eventName))) {
            const result = await addDivisionEntry(slug, partnershipId, section, age, eventName)
            if (result?.error) setError(result.error)
          }
        }
      }
      for (const e of sectionEntries) {
        if (!desired.has(cellKey(e.ageCategory, e.eventName))) {
          const result = await removeDivisionEntry(slug, e.id)
          if (result?.error) setError(result.error)
        }
      }
    })
  }

  function toggleAge(section: DivisionSectionKey, age: string, checked: boolean) {
    const cur = selected[section]
    const ages = checked ? [...cur.ages, age] : cur.ages.filter(a => a !== age)
    setSelected(prev => ({ ...prev, [section]: { ...cur, ages } }))
    reconcile(section, ages, cur.events)
  }

  function toggleEvent(section: DivisionSectionKey, eventName: string, checked: boolean) {
    const cur = selected[section]
    const events = checked ? [...cur.events, eventName] : cur.events.filter(e => e !== eventName)
    setSelected(prev => ({ ...prev, [section]: { ...cur, events } }))
    reconcile(section, cur.ages, events)
  }

  return (
    <>
      {error && (
        <div className="banner-error flex justify-between" style={{ gridColumn: '1 / -1' }}>
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      {SECTION_KEYS.map(section => {
        const def = DIVISION_SECTIONS[section]
        const sel = selected[section]
        const allSameDay = def.events.every(ev => ev.day === def.events[0].day)
        const count = entries.filter(e => e.section === section).length
        const color = SECTION_COLORS[section]

        return (
          <details key={section} className="card overflow-hidden">
            <summary
              className="text-xs font-bold uppercase tracking-wide px-3 py-2 flex items-center justify-between gap-2 cursor-pointer"
              style={{ backgroundColor: color, color: '#fff' }}
            >
              <span>
                {def.label}
                <span
                  className="font-normal normal-case"
                  style={{ color: 'rgba(255,255,255,.75)' }}
                >
                  {' '}— {count} selected
                </span>
              </span>
              {allSameDay && (
                <span
                  style={{
                    backgroundColor: 'rgba(255,255,255,.24)',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 10,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {def.events[0].day}
                </span>
              )}
            </summary>
            <div className="p-3">
              <div className="grid gap-x-8" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Age</p>
                  {def.ages.map(age => (
                    <label key={age} className="flex items-center gap-1.5 py-0.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sel.ages.includes(age)}
                        style={{ width: 15, height: 15, flexShrink: 0 }}
                        onChange={e => toggleAge(section, age, e.target.checked)}
                      />
                      {divisionAgeLabel(section, age)}
                    </label>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Event</p>
                  {def.events.map(ev => {
                    const paid = studentHasPaidFor(student, ev.day)
                    return (
                      <label
                        key={ev.name}
                        className="flex items-center gap-1.5 py-0.5 px-1.5 my-0.5 rounded text-sm cursor-pointer"
                        style={{
                          color: allSameDay ? undefined : DAY_COLORS[ev.day],
                          backgroundColor: allSameDay ? undefined : DAY_BG_COLORS[ev.day],
                        }}
                        title={paid ? undefined : `${student.firstName} hasn't paid for ${ev.day}`}
                      >
                        <input
                          type="checkbox"
                          checked={sel.events.includes(ev.name)}
                          disabled={!paid}
                          style={{ width: 15, height: 15, flexShrink: 0, accentColor: allSameDay ? undefined : DAY_COLORS[ev.day] }}
                          onChange={e => toggleEvent(section, ev.name, e.target.checked)}
                        />
                        {ev.name}
                        {!allSameDay && <span className="text-xs opacity-70">({ev.day})</span>}
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          </details>
        )
      })}
    </>
  )
}
