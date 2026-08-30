'use client'

import { useState, useTransition } from 'react'
import { setSoloEntry, clearSoloEntry } from '@/app/actions/soloEntries'
import { SOLO_DAY } from '@/lib/divisions'

type Instructor = { id: number; name: string }
type SoloEntry = { entryType: string; routineName: string; danceName: string | null; instructorId: number | null }
type Student = { id: number; firstName: string; lastName: string; paidThursday: boolean; soloEntry: SoloEntry | null }

function StudentRow({ slug, student, instructors }: { slug: string; student: Student; instructors: Instructor[] }) {
  const [, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entryType, setEntryType] = useState<'Solo' | 'Show'>((student.soloEntry?.entryType as 'Solo' | 'Show') ?? 'Solo')
  const [routineName, setRoutineName] = useState(student.soloEntry?.routineName ?? '')
  const [danceName, setDanceName] = useState(student.soloEntry?.danceName ?? '')
  const [instructorId, setInstructorId] = useState(student.soloEntry?.instructorId?.toString() ?? '')

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await setSoloEntry(
        slug,
        student.id,
        entryType,
        routineName,
        entryType === 'Show' ? danceName : null,
        instructorId ? Number(instructorId) : null
      )
      if (result?.error) setError(result.error)
      else setEditing(false)
    })
  }

  function handleClear() {
    if (!confirm(`Remove ${student.firstName}'s solo/show entry?`)) return
    startTransition(async () => {
      const result = await clearSoloEntry(slug, student.id)
      if (result?.error) setError(result.error)
      else {
        setRoutineName('')
        setDanceName('')
        setInstructorId('')
      }
    })
  }

  if (!editing && !student.soloEntry) {
    return (
      <div className="flex items-center px-4 py-2" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="flex-1 text-sm">{student.firstName} {student.lastName}</span>
        {student.paidThursday ? (
          <>
            <span className="text-xs italic mr-3" style={{ color: 'var(--muted)' }}>No entry</span>
            <button onClick={() => setEditing(true)} className="text-xs" style={{ color: 'var(--accent)' }}>Add</button>
          </>
        ) : (
          <span className="text-xs italic" style={{ color: 'var(--muted)' }} title={`${student.firstName} hasn't paid for ${SOLO_DAY}`}>
            Not paid for {SOLO_DAY}
          </span>
        )}
      </div>
    )
  }

  if (!editing && student.soloEntry) {
    return (
      <div className="flex items-center px-4 py-2 gap-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex-1 text-sm">
          <strong>{student.firstName} {student.lastName}</strong> — {student.soloEntry.entryType}
          {student.soloEntry.danceName && <> ({student.soloEntry.danceName})</>}: &ldquo;{student.soloEntry.routineName}&rdquo;
        </div>
        <button onClick={() => setEditing(true)} className="text-xs" style={{ color: 'var(--accent)' }}>Edit</button>
        <button onClick={handleClear} className="text-xs" style={{ color: '#dc2626' }}>Remove</button>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="text-sm font-semibold">{student.firstName} {student.lastName}</div>
      {error && <div className="banner-error">{error}</div>}
      <div className="flex gap-2 flex-wrap items-end">
        <div>
          <label className="block text-xs font-medium mb-1">Type</label>
          <select value={entryType} onChange={e => setEntryType(e.target.value as 'Solo' | 'Show')} className="field" style={{ width: 120 }}>
            <option value="Solo">Solo</option>
            <option value="Show">Show</option>
          </select>
        </div>
        {entryType === 'Show' && (
          <div>
            <label className="block text-xs font-medium mb-1">Dance</label>
            <input value={danceName} onChange={e => setDanceName(e.target.value)} placeholder="e.g. Cha Cha" className="field" style={{ width: 140 }} />
          </div>
        )}
        <div className="flex-1" style={{ minWidth: 180 }}>
          <label className="block text-xs font-medium mb-1">Routine / theme title</label>
          <input value={routineName} onChange={e => setRoutineName(e.target.value)} placeholder='e.g. "Moulin Rouge"' className="field" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Instructor (optional)</label>
          <select value={instructorId} onChange={e => setInstructorId(e.target.value)} className="field" style={{ width: 160 }}>
            <option value="">None</option>
            {instructors.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
        <button onClick={handleSave} className="px-3 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}>
          Save
        </button>
        <button onClick={() => setEditing(false)} className="px-3 py-2 text-sm" style={{ color: 'var(--muted)' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function SoloManager({ slug, students, instructors }: { slug: string; students: Student[]; instructors: Instructor[] }) {
  return (
    <div className="card overflow-hidden">
      <div
        className="px-4 py-2 text-xs font-semibold uppercase tracking-wide"
        style={{ backgroundColor: '#ebebeb', borderBottom: '1px solid var(--border)', color: '#444' }}
      >
        Students ({students.length})
      </div>
      {students.length === 0 && (
        <p className="px-4 py-3 text-sm italic" style={{ color: 'var(--muted)' }}>No students yet — add them on the Roster page.</p>
      )}
      {students.map(s => (
        <StudentRow key={s.id} slug={slug} student={s} instructors={instructors} />
      ))}
    </div>
  )
}
