'use client'

import { useState } from 'react'
import { DANCE_AGE_CATEGORIES, DANCE_AGE_LABELS, LEVELS } from '@/lib/divisions'

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
    <div className="card p-3 flex items-end gap-2 flex-wrap">
      <div>
        <label className="block text-xs font-medium mb-1">Age</label>
        <select value={age} onChange={e => setAge(e.target.value)} className="field" style={{ width: 150 }}>
          <option value="">Select…</option>
          {DANCE_AGE_CATEGORIES.map(a => (
            <option key={a} value={a}>{DANCE_AGE_LABELS[a] ?? a}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Level</label>
        <select value={level} onChange={e => setLevel(e.target.value)} className="field" style={{ width: 150 }}>
          <option value="">Select…</option>
          {LEVELS.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      <button
        onClick={handleAdd}
        disabled={!age || !level}
        className="px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}
      >
        + Add dance sheet
      </button>
      <span className="text-xs" style={{ color: 'var(--muted)' }}>
        for the Closed/Open chart below — a student can have several sheets, one per age/level combo
      </span>
    </div>
  )
}
