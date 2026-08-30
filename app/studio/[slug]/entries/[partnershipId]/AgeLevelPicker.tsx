'use client'

import { DANCE_AGE_CATEGORIES, DANCE_AGE_LABELS, LEVELS } from '@/lib/divisions'

function Chip({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label
      className="inline-flex items-center gap-1.5 text-sm rounded-full px-3 py-1 cursor-pointer"
      style={{
        border: `1px solid ${checked ? 'var(--accent)' : 'var(--border-dark)'}`,
        backgroundColor: checked ? '#f6eef1' : '#fff',
      }}
    >
      <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 13, height: 13 }} />
      {label}
    </label>
  )
}

export default function AgeLevelPicker({
  selectedAges,
  selectedLevels,
  onToggleAge,
  onToggleLevel,
}: {
  selectedAges: string[]
  selectedLevels: string[]
  onToggleAge: (age: string) => void
  onToggleLevel: (level: string) => void
}) {
  return (
    <div className="card p-4 space-y-3">
      <h2 className="font-bold text-base">Age Category &amp; Level</h2>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        Applies to the Closed/Open dance chart below — students may dance in up to two ages and two levels.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)', width: 50 }}>Age</span>
        {DANCE_AGE_CATEGORIES.map(age => (
          <Chip key={age} label={DANCE_AGE_LABELS[age] ?? age} checked={selectedAges.includes(age)} onChange={() => onToggleAge(age)} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)', width: 50 }}>Level</span>
        {LEVELS.map(level => (
          <Chip key={level} label={level} checked={selectedLevels.includes(level)} onChange={() => onToggleLevel(level)} />
        ))}
      </div>
    </div>
  )
}
