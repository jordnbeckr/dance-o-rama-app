'use client'

import { useState, useTransition } from 'react'
import { setSoloEntry, clearSoloEntry } from '@/app/actions/soloEntries'
import { SOLO_DAY, DAY_COLORS, DAY_BG_COLORS } from '@/lib/divisions'

type SoloEntry = { entryType: string; routineName: string; danceName: string | null; instructorId: number | null }

export default function SoloCard({
  slug,
  studentId,
  firstName,
  defaultInstructorId,
  soloEntry,
  paidThursday,
}: {
  slug: string
  studentId: number
  firstName: string
  defaultInstructorId: number
  soloEntry: SoloEntry | null
  paidThursday: boolean
}) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [hasEntry, setHasEntry] = useState(!!soloEntry)
  const [entryType, setEntryType] = useState<'Solo' | 'Show'>((soloEntry?.entryType as 'Solo' | 'Show') ?? 'Solo')
  const [routineName, setRoutineName] = useState(soloEntry?.routineName ?? '')
  const [danceName, setDanceName] = useState(soloEntry?.danceName ?? '')

  function save(overrides: Partial<{ entryType: 'Solo' | 'Show'; routineName: string; danceName: string }> = {}) {
    const next = {
      entryType: overrides.entryType ?? entryType,
      routineName: overrides.routineName ?? routineName,
      danceName: overrides.danceName ?? danceName,
    }
    if (!next.routineName.trim()) return
    if (next.entryType === 'Show' && !next.danceName.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await setSoloEntry(
        slug,
        studentId,
        next.entryType,
        next.routineName,
        next.entryType === 'Show' ? next.danceName : null,
        soloEntry?.instructorId ?? defaultInstructorId
      )
      if (result?.error) setError(result.error)
      else setHasEntry(true)
    })
  }

  function handleRemove() {
    if (!confirm(`Remove ${firstName}'s solo/show entry?`)) return
    setError(null)
    startTransition(async () => {
      const result = await clearSoloEntry(slug, studentId)
      if (result?.error) setError(result.error)
      else {
        setHasEntry(false)
        setRoutineName('')
        setDanceName('')
      }
    })
  }

  return (
    <div className="card overflow-hidden flex flex-col" style={{ backgroundColor: DAY_BG_COLORS[SOLO_DAY] }}>
      <div
        className="text-xs font-bold uppercase tracking-wide px-3 py-2 flex items-center justify-between gap-2"
        style={{ backgroundColor: DAY_BG_COLORS[SOLO_DAY], color: DAY_COLORS[SOLO_DAY], borderBottom: '1px solid var(--border)' }}
      >
        <span>Solo Routines</span>
        <span
          style={{
            backgroundColor: DAY_COLORS[SOLO_DAY],
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 10,
            whiteSpace: 'nowrap',
          }}
        >
          {SOLO_DAY}
        </span>
      </div>
      <div className="p-3 space-y-2 flex-1" style={{ backgroundColor: DAY_BG_COLORS[SOLO_DAY] }}>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>One per student: Solo routine OR Show routine, not both.</p>
        {error && <div className="banner-error">{error}</div>}
        {!paidThursday ? (
          <p className="text-xs italic" style={{ color: 'var(--muted)' }} title={`${firstName} hasn't paid for ${SOLO_DAY}`}>
            {firstName} hasn&apos;t paid for {SOLO_DAY}.
          </p>
        ) : (
          <>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={`solo-type-${studentId}`}
                  checked={entryType === 'Solo'}
                  onChange={() => { setEntryType('Solo'); save({ entryType: 'Solo' }) }}
                />
                Solo
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={`solo-type-${studentId}`}
                  checked={entryType === 'Show'}
                  onChange={() => { setEntryType('Show'); save({ entryType: 'Show' }) }}
                />
                Show
              </label>
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: entryType === 'Show' ? '1fr 1fr' : '1fr' }}>
              {entryType === 'Show' && (
                <div>
                  <label className="block text-xs font-medium mb-1">Dance (Show only)</label>
                  <input
                    value={danceName}
                    onChange={e => setDanceName(e.target.value)}
                    onBlur={() => save()}
                    placeholder="e.g. Cha Cha"
                    className="field"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium mb-1">Routine / theme title</label>
                <input
                  value={routineName}
                  onChange={e => setRoutineName(e.target.value)}
                  onBlur={() => save()}
                  placeholder='e.g. "Moulin Rouge"'
                  className="field"
                />
              </div>
            </div>
            {hasEntry && (
              <button onClick={handleRemove} className="text-xs" style={{ color: '#dc2626' }}>Remove entry</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
