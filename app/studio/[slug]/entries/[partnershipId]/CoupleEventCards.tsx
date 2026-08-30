'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { addCoupleEventEntry, removeCoupleEventEntry, searchPartners } from '@/app/actions/coupleEvents'
import { COUPLE_EVENT_SECTIONS, DAY_COLORS, DAY_BG_COLORS, studentHasPaidFor } from '@/lib/divisions'

type StudentPaid = { firstName: string; paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }
type CoupleEntry = {
  id: number
  section: 'AmateurCouple' | 'Club'
  eventName: string
  partnerType: 'Instructor' | 'Student'
  partnerId: number | null
  partnerLabel: string
}
type PartnerResult = { id: number; name: string; studioName: string }

function DayBadge({ day }: { day: 'Thursday' | 'Friday' | 'Saturday' }) {
  return (
    <span
      style={{
        backgroundColor: DAY_COLORS[day],
        color: '#fff',
        fontSize: '0.65rem',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 10,
        whiteSpace: 'nowrap',
      }}
    >
      {day}
    </span>
  )
}

export default function CoupleEventCards({
  slug,
  studentId,
  instructorId,
  student,
  entries,
}: {
  slug: string
  studentId: number
  instructorId: number
  student: StudentPaid
  entries: CoupleEntry[]
}) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const clubDef = COUPLE_EVENT_SECTIONS.Club
  const clubEntries = entries.filter(e => e.section === 'Club')

  function toggleClub(eventName: string, checked: boolean) {
    setError(null)
    startTransition(async () => {
      if (checked) {
        const result = await addCoupleEventEntry(slug, studentId, 'Instructor', instructorId, 'Club', eventName)
        if ('error' in result) setError(result.error)
      } else {
        const entry = clubEntries.find(e => e.eventName === eventName && e.partnerId === instructorId)
        if (entry) {
          const result = await removeCoupleEventEntry(slug, entry.id)
          if (result?.error) setError(result.error)
        }
      }
    })
  }

  const amDef = COUPLE_EVENT_SECTIONS.AmateurCouple
  const amEntries = entries.filter(e => e.section === 'AmateurCouple')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PartnerResult[]>([])
  const [selectedPartner, setSelectedPartner] = useState<PartnerResult | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      const r = await searchPartners(query)
      setResults(r.students.filter(s => s.id !== studentId))
    }, 250)
  }, [query, studentId])

  function toggleAmateurCouple(eventName: string, checked: boolean) {
    if (!selectedPartner) return
    setError(null)
    startTransition(async () => {
      if (checked) {
        const result = await addCoupleEventEntry(slug, studentId, 'Student', selectedPartner.id, 'AmateurCouple', eventName)
        if ('error' in result) setError(result.error)
      } else {
        const entry = amEntries.find(e => e.eventName === eventName && e.partnerId === selectedPartner.id)
        if (entry) {
          const result = await removeCoupleEventEntry(slug, entry.id)
          if (result?.error) setError(result.error)
        }
      }
    })
  }

  function handleRemoveAmateurCouple(id: number) {
    setError(null)
    startTransition(async () => {
      const result = await removeCoupleEventEntry(slug, id)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <>
      {error && (
        <div className="banner-error flex justify-between" style={{ gridColumn: '1 / -1' }}>
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Amateur Couple Events */}
      <div className="card overflow-hidden flex flex-col">
        <div
          className="text-xs font-bold uppercase tracking-wide px-3 py-2 flex items-center justify-between gap-2"
          style={{ backgroundColor: '#f5f6f8', color: '#2a3545', borderBottom: '1px solid var(--border)' }}
        >
          <span>Amateur Couple Events</span>
        </div>
        <div className="p-3 space-y-2 flex-1">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Student/Student couples only.</p>

          {amEntries.length > 0 && (
            <div className="space-y-1">
              {amEntries.map(e => {
                const ev = amDef.events.find(x => x.name === e.eventName)
                return (
                  <div key={e.id} className="flex items-center justify-between text-sm gap-2">
                    <span>
                      <span style={{ color: ev ? DAY_COLORS[ev.day] : undefined }}>{e.eventName}</span>
                      {' '}with {e.partnerLabel}
                    </span>
                    <button onClick={() => handleRemoveAmateurCouple(e.id)} className="text-xs" style={{ color: '#dc2626' }}>Remove</button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="relative pt-1">
            <label className="block text-xs font-medium mb-1">Partner (search any studio)</label>
            <input
              value={selectedPartner ? `${selectedPartner.name} (${selectedPartner.studioName})` : query}
              onChange={e => { setQuery(e.target.value); setSelectedPartner(null) }}
              placeholder="Type a name…"
              className="field"
            />
            {!selectedPartner && results.length > 0 && (
              <div className="card absolute z-10 mt-1 w-full max-h-40 overflow-y-auto shadow-lg">
                {results.map(p => (
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

          <div className="space-y-0.5 pt-1">
            {amDef.events.map(ev => {
              const paid = studentHasPaidFor(student, ev.day)
              const checked = !!selectedPartner && amEntries.some(e => e.eventName === ev.name && e.partnerId === selectedPartner.id)
              return (
                <label
                  key={ev.name}
                  className="flex items-center gap-1.5 py-0.5 text-sm cursor-pointer"
                  style={{ color: DAY_COLORS[ev.day], opacity: selectedPartner ? 1 : 0.5 }}
                  title={!selectedPartner ? 'Pick a partner above first' : paid ? undefined : `${student.firstName} hasn't paid for ${ev.day}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!selectedPartner || !paid}
                    style={{ width: 15, height: 15, flexShrink: 0, accentColor: DAY_COLORS[ev.day] }}
                    onChange={e => toggleAmateurCouple(ev.name, e.target.checked)}
                  />
                  {ev.name} <span className="text-xs opacity-70">({ev.day})</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {/* Club 3-Dance Divisions */}
      <div className="card overflow-hidden flex flex-col" style={{ backgroundColor: DAY_BG_COLORS[clubDef.events[0].day] }}>
        <div
          className="text-xs font-bold uppercase tracking-wide px-3 py-2 flex items-center justify-between gap-2"
          style={{
            backgroundColor: DAY_BG_COLORS[clubDef.events[0].day],
            color: DAY_COLORS[clubDef.events[0].day],
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span>Club 3-Dance Divisions</span>
          <DayBadge day={clubDef.events[0].day} />
        </div>
        <div className="p-3 space-y-0.5 flex-1" style={{ backgroundColor: DAY_BG_COLORS[clubDef.events[0].day] }}>
          <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
            One combined event for all ages/levels, open category freestyle, no costumes.
          </p>
          {clubDef.events.map(ev => {
            const paid = studentHasPaidFor(student, ev.day)
            const checked = clubEntries.some(e => e.eventName === ev.name && e.partnerId === instructorId)
            return (
              <label
                key={ev.name}
                className="flex items-center gap-1.5 py-0.5 text-sm cursor-pointer"
                title={paid ? undefined : `${student.firstName} hasn't paid for ${ev.day}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!paid}
                  style={{ width: 15, height: 15, flexShrink: 0, accentColor: DAY_COLORS[ev.day] }}
                  onChange={e => toggleClub(ev.name, e.target.checked)}
                />
                {ev.name}
              </label>
            )
          })}
        </div>
      </div>
    </>
  )
}
