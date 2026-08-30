'use client'

import { useState, useTransition, useEffect } from 'react'
import { addDivisionEntry, removeDivisionEntry } from '@/app/actions/divisionEntries'
import { DIVISION_SECTIONS, DivisionSectionKey, AGE_LABELS, DAY_COLORS, DAY_BG_COLORS, studentHasPaidFor } from '@/lib/divisions'

type Entry = { id: number; section: string; ageCategory: string; eventName: string }
type StudentPaid = { firstName: string; paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }

const SECTION_KEYS = Object.keys(DIVISION_SECTIONS) as DivisionSectionKey[]

function cellKey(section: string, ageCategory: string, eventName: string) {
  return `${section}::${ageCategory}::${eventName}`
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
  const [optimisticPending, setOptimisticPending] = useState<Set<string>>(new Set())

  const entriesFingerprint = entries.map(e => e.id).sort((a, b) => a - b).join(',')
  useEffect(() => {
    setOptimisticPending(new Set())
  }, [entriesFingerprint])

  const entryLookup = new Map<string, number>()
  for (const e of entries) entryLookup.set(cellKey(e.section, e.ageCategory, e.eventName), e.id)

  function toggle(section: DivisionSectionKey, ageCategory: string, eventName: string, checked: boolean) {
    const key = cellKey(section, ageCategory, eventName)
    setOptimisticPending(prev => new Set(prev).add(key))
    setError(null)
    startTransition(async () => {
      if (checked) {
        const result = await addDivisionEntry(slug, partnershipId, section, ageCategory, eventName)
        if (result?.error) setError(result.error)
      } else {
        const id = entryLookup.get(key)
        if (id) {
          const result = await removeDivisionEntry(slug, id)
          if (result?.error) setError(result.error)
        }
      }
    })
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="banner-error flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {SECTION_KEYS.map(section => {
          const def = DIVISION_SECTIONS[section]
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
              <div className="p-3 overflow-x-auto flex-1" style={{ backgroundColor: bg }}>
                <table className="data-table" style={{ minWidth: 300 }}>
                  <thead>
                    <tr>
                      <th style={{ backgroundColor: bg }}>Age</th>
                      {def.events.map(ev => (
                        <th key={ev.name} style={{ textAlign: 'center', color: DAY_COLORS[ev.day], backgroundColor: bg }}>
                          {ev.name}
                          {!allSameDay && <div className="font-normal normal-case" style={{ fontSize: '0.65rem' }}>{ev.day}</div>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {def.ages.map(age => (
                      <tr key={age}>
                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap', backgroundColor: bg }}>{AGE_LABELS[age] ?? age}</td>
                        {def.events.map(ev => {
                          const key = cellKey(section, age, ev.name)
                          const isChecked = entryLookup.has(key) !== optimisticPending.has(key)
                          const paid = studentHasPaidFor(student, ev.day)
                          return (
                            <td
                              key={ev.name}
                              style={{ textAlign: 'center', backgroundColor: allSameDay ? bg : DAY_BG_COLORS[ev.day] }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={!paid}
                                style={{ accentColor: DAY_COLORS[ev.day], width: 15, height: 15 }}
                                title={paid ? undefined : `${student.firstName} hasn't paid for ${ev.day}`}
                                onChange={e => toggle(section, age, ev.name, e.target.checked)}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
