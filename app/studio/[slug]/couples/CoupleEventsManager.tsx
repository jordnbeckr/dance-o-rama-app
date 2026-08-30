'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { addCoupleEventEntry, removeCoupleEventEntry, searchPartners } from '@/app/actions/coupleEvents'
import { COUPLE_EVENT_SECTIONS, CoupleEventSectionKey, DAY_COLORS, studentHasPaidFor, coupleEventDay } from '@/lib/divisions'

type Student = { id: number; firstName: string; lastName: string; paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }
type EntryRow = { id: number; section: string; eventName: string; partnerType: string; studentLabel: string; partnerLabel: string }
type PartnerResult = { id: number; name: string; studioName: string }

const SECTION_KEYS = Object.keys(COUPLE_EVENT_SECTIONS) as CoupleEventSectionKey[]

export default function CoupleEventsManager({
  slug,
  students,
  entries,
}: {
  slug: string
  students: Student[]
  entries: EntryRow[]
}) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [studentId, setStudentId] = useState('')
  const [section, setSection] = useState<CoupleEventSectionKey>('AmateurCouple')
  const [eventName, setEventName] = useState('')
  const [partnerType, setPartnerType] = useState<'Instructor' | 'Student'>('Student')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ students: PartnerResult[]; instructors: PartnerResult[] }>({ students: [], instructors: [] })
  const [selectedPartner, setSelectedPartner] = useState<PartnerResult | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sectionDef = COUPLE_EVENT_SECTIONS[section]

  useEffect(() => {
    if (!(sectionDef.partnerTypes as readonly string[]).includes(partnerType)) {
      setPartnerType(sectionDef.partnerTypes[0])
    }
    setEventName('')
  }, [section, sectionDef, partnerType])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults({ students: [], instructors: [] })
      return
    }
    debounceRef.current = setTimeout(async () => {
      const r = await searchPartners(query)
      setResults(r)
    }, 250)
  }, [query])

  function handleAdd() {
    if (!studentId || !eventName || !selectedPartner) return
    setError(null)
    startTransition(async () => {
      const result = await addCoupleEventEntry(slug, Number(studentId), partnerType, selectedPartner.id, section, eventName)
      if ('error' in result) {
        setError(result.error)
      } else {
        setEventName('')
        setQuery('')
        setSelectedPartner(null)
        setResults({ students: [], instructors: [] })
      }
    })
  }

  function handleRemove(id: number) {
    startTransition(async () => {
      const result = await removeCoupleEventEntry(slug, id)
      if (result?.error) setError(result.error)
    })
  }

  const partnerOptions = partnerType === 'Instructor' ? results.instructors : results.students
  const selectedStudent = students.find(s => s.id === Number(studentId))
  const eventDay = eventName ? coupleEventDay(section, eventName) : undefined
  const studentPaidForEvent = selectedStudent && eventDay ? studentHasPaidFor(selectedStudent, eventDay) : true

  return (
    <div className="space-y-4">
      {error && (
        <div className="banner-error flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      <div className="card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Add couple event entry</h3>
        <div className="flex gap-2 flex-wrap">
          <div>
            <label className="block text-xs font-medium mb-1">Student</label>
            <select value={studentId} onChange={e => setStudentId(e.target.value)} className="field" style={{ width: 180 }}>
              <option value="">Select…</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Section</label>
            <select value={section} onChange={e => setSection(e.target.value as CoupleEventSectionKey)} className="field" style={{ width: 200 }}>
              {SECTION_KEYS.map(k => (
                <option key={k} value={k}>{COUPLE_EVENT_SECTIONS[k].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Event</label>
            <select value={eventName} onChange={e => setEventName(e.target.value)} className="field" style={{ width: 200 }}>
              <option value="">Select…</option>
              {sectionDef.events.map(ev => {
                const paid = selectedStudent ? studentHasPaidFor(selectedStudent, ev.day) : true
                return (
                  <option key={ev.name} value={ev.name} disabled={!paid}>
                    {ev.name} ({ev.day}{paid ? '' : ' — not paid'})
                  </option>
                )
              })}
            </select>
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>{sectionDef.sublabel}</p>
        {eventDay && (
          <p className="text-xs font-medium" style={{ color: DAY_COLORS[eventDay] }}>
            {eventDay}{!studentPaidForEvent && selectedStudent && ` — ${selectedStudent.firstName} hasn't paid`}
          </p>
        )}

        <div className="flex gap-2 items-center">
          <span className="text-xs font-medium">Partner:</span>
          {sectionDef.partnerTypes.map(pt => (
            <label key={pt} className="checkbox-row">
              <input type="radio" name="partnerType" checked={partnerType === pt} onChange={() => setPartnerType(pt)} />
              {pt}
            </label>
          ))}
        </div>

        <div className="relative">
          <label className="block text-xs font-medium mb-1">
            Search {partnerType === 'Instructor' ? 'instructors' : 'students'} (any studio)
          </label>
          <input
            value={selectedPartner ? `${selectedPartner.name} (${selectedPartner.studioName})` : query}
            onChange={e => { setQuery(e.target.value); setSelectedPartner(null) }}
            placeholder="Type a name…"
            className="field"
          />
          {!selectedPartner && partnerOptions.length > 0 && (
            <div className="card absolute z-10 mt-1 w-full max-h-48 overflow-y-auto shadow-lg">
              {partnerOptions.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPartner(p); setQuery('') }}
                  className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  {p.name} <span style={{ color: 'var(--muted)' }}>({p.studioName})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={!studentId || !eventName || !selectedPartner || !studentPaidForEvent}
          className="px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}
        >
          Add entry
        </button>
      </div>

      <div className="card overflow-hidden">
        <div
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wide"
          style={{ backgroundColor: '#ebebeb', borderBottom: '1px solid var(--border)', color: '#444' }}
        >
          Entries ({entries.length})
        </div>
        {entries.length === 0 && (
          <p className="px-4 py-3 text-sm italic" style={{ color: 'var(--muted)' }}>No couple events entered yet</p>
        )}
        {entries.map((e, i) => (
          <div
            key={e.id}
            className="flex items-center px-4 py-2 gap-3"
            style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
          >
            <div className="flex-1 text-sm">
              <strong>{e.studentLabel}</strong> &amp; {e.partnerLabel}
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                {COUPLE_EVENT_SECTIONS[e.section as CoupleEventSectionKey]?.label ?? e.section} — {e.eventName}
                {(() => {
                  const d = coupleEventDay(e.section as CoupleEventSectionKey, e.eventName)
                  return d ? <span style={{ color: DAY_COLORS[d] }}> ({d})</span> : null
                })()}
              </div>
            </div>
            <button onClick={() => handleRemove(e.id)} className="text-xs" style={{ color: '#dc2626' }}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}
