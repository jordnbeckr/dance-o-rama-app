'use client'

import { useState, useTransition } from 'react'
import { addDivisionEntry, removeDivisionEntry } from '@/app/actions/divisionEntries'
import { DIVISION_SECTIONS, DivisionSectionKey, AGE_LABELS, DAY_COLORS, DAY_BG_COLORS, studentHasPaidFor } from '@/lib/divisions'

type Entry = { id: number; section: string; ageCategory: string; eventName: string }
type StudentPaid = { firstName: string; paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }
type Selection = { ages: string[]; events: string[] }

const SECTION_KEYS = Object.keys(DIVISION_SECTIONS) as DivisionSectionKey[]

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
        const bg = allSameDay ? DAY_BG_COLORS[def.events[0].day] : undefined

        return (
          <div key={section} className="card overflow-hidden flex flex-col" style={{ backgroundColor: bg }}>
            <div
              className="text-xs font-bold uppercase tracking-wide px-3 py-2 flex items-center justify-between gap-2"
              style={{
                backgroundColor: bg ?? '#f5f6f8',
                color: allSameDay ? DAY_COLORS[def.events[0].day] : '#2a3545',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span>{def.label}</span>
              {allSameDay && (
                <span
                  style={{
                    backgroundColor: DAY_COLORS[def.events[0].day],
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
            </div>
            <div className="p-3 flex-1" style={{ backgroundColor: bg }}>
              <div className="grid gap-x-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
                      {AGE_LABELS[age] ?? age}
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
                        className="flex items-center gap-1.5 py-0.5 text-sm cursor-pointer"
                        style={{ color: allSameDay ? undefined : DAY_COLORS[ev.day] }}
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
          </div>
        )
      })}
    </>
  )
}
