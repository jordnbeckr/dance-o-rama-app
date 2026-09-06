'use client'

import { useState } from 'react'
import { DANCE_AGE_CATEGORIES, DANCE_AGE_LABELS, LEVELS, JEWEL_TONES } from '@/lib/divisions'

// Matches DanceGrid's sheet color directly below it — the two read as one
// "Individual Dances" unit even though they're separate components.
const SHEET_COLOR = JEWEL_TONES.sapphire

export default function AgeLevelPicker({
  onAddSheet,
}: {
  onAddSheet: (combo: { ageCategory: string; level: string }) => void
}) {
  const [age, setAge] = useState('')
  const [level, setLevel] = useState('')

  function handleAdd() {
    if (!age || !level) return
    onAddSheet({ ageCategory: age, level })
    setAge('')
    setLevel('')
  }

  return (
    <div className="card overflow-hidden">
      <div
        className="text-xs font-bold uppercase tracking-wide px-3 py-2"
        style={{ backgroundColor: SHEET_COLOR, color: '#fff', letterSpacing: '.06em' }}
      >
        Add a Dance Sheet
      </div>
      <div className="p-3 flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Age</label>
          <select
            value={age}
            onChange={e => setAge(e.target.value)}
            className="field"
            style={{ width: 170, borderColor: SHEET_COLOR, borderWidth: 1.5 }}
          >
            <option value="">Select…</option>
            {DANCE_AGE_CATEGORIES.map(a => (
              <option key={a} value={a}>{DANCE_AGE_LABELS[a] ?? a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Level</label>
          <select
            value={level}
            onChange={e => setLevel(e.target.value)}
            className="field"
            style={{ width: 170, borderColor: SHEET_COLOR, borderWidth: 1.5 }}
          >
            <option value="">Select…</option>
            {LEVELS.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAdd}
          disabled={!age || !level}
          className="px-4 py-2 text-sm font-bold text-white disabled:opacity-40 rounded"
          style={{ backgroundColor: SHEET_COLOR }}
        >
          + Add Sheet
        </button>
      </div>
    </div>
  )
}
