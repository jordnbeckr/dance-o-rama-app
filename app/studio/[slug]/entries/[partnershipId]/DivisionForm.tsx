'use client'

import { useState, useTransition } from 'react'
import { addDivisionEntry, removeDivisionEntry } from '@/app/actions/divisionEntries'
import { DIVISION_SECTIONS, DivisionSectionKey, divisionEventDay, AGE_LABELS, DAY_COLORS, studentHasPaidFor } from '@/lib/divisions'

type Entry = { id: number; section: string; ageCategory: string; eventName: string }
type StudentPaid = { firstName: string; paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }

const SECTION_KEYS = Object.keys(DIVISION_SECTIONS) as DivisionSectionKey[]

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
  const [section, setSection] = useState<DivisionSectionKey>('AllAround')
  const [age, setAge] = useState('')
  const [eventName, setEventName] = useState('')

  const sectionDef = DIVISION_SECTIONS[section]
  const eventDay = eventName ? divisionEventDay(section, eventName) : undefined
  const eventPaid = eventDay ? studentHasPaidFor(student, eventDay) : true

  function handleAdd() {
    if (!eventName || !age) return
    setError(null)
    startTransition(async () => {
      const result = await addDivisionEntry(slug, partnershipId, section, age, eventName)
      if (result?.error) setError(result.error)
      else {
        setAge('')
        setEventName('')
      }
    })
  }

  function handleRemove(id: number) {
    startTransition(async () => {
      const result = await removeDivisionEntry(slug, id)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="card p-4 space-y-4">
      <h2 className="font-bold text-base">Sections 2-4 — All Around, Open Bronze 3-Dance, Scholarship</h2>

      {error && (
        <div className="banner-error flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      <div className="flex items-end gap-2 flex-wrap">
        <div>
          <label className="block text-xs font-medium mb-1">Section</label>
          <select
            value={section}
            onChange={e => { setSection(e.target.value as DivisionSectionKey); setAge(''); setEventName('') }}
            className="field"
            style={{ width: 220 }}
          >
            {SECTION_KEYS.map(k => (
              <option key={k} value={k}>{DIVISION_SECTIONS[k].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Event</label>
          <select value={eventName} onChange={e => setEventName(e.target.value)} className="field" style={{ width: 220 }}>
            <option value="">Select…</option>
            {sectionDef.events.map(ev => {
              const paid = studentHasPaidFor(student, ev.day)
              return (
                <option key={ev.name} value={ev.name} disabled={!paid}>
                  {ev.name} ({ev.day}{paid ? '' : ' — not paid'})
                </option>
              )
            })}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Age category</label>
          <select value={age} onChange={e => setAge(e.target.value)} className="field" style={{ width: 160 }}>
            <option value="">Select…</option>
            {sectionDef.ages.map(a => (
              <option key={a} value={a}>{AGE_LABELS[a] ?? a}</option>
            ))}
          </select>
        </div>
        {eventDay && (
          <span className="text-xs font-medium" style={{ color: DAY_COLORS[eventDay] }}>
            {eventDay}{!eventPaid && ` — ${student.firstName} hasn't paid`}
          </span>
        )}
        <button
          onClick={handleAdd}
          disabled={!eventPaid || !eventName || !age}
          className="px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}
        >
          + Add
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No divisions entered yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Section</th>
              <th>Day</th>
              <th>Age</th>
              <th>Event</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => {
              const day = divisionEventDay(e.section as DivisionSectionKey, e.eventName)
              return (
                <tr key={e.id}>
                  <td>{DIVISION_SECTIONS[e.section as DivisionSectionKey]?.label ?? e.section}</td>
                  <td style={{ color: day ? DAY_COLORS[day] : undefined }}>{day}</td>
                  <td>{AGE_LABELS[e.ageCategory] ?? e.ageCategory}</td>
                  <td>{e.eventName}</td>
                  <td>
                    <button onClick={() => handleRemove(e.id)} className="text-xs" style={{ color: '#dc2626' }}>Remove</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
