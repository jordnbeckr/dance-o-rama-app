'use client'

import { DANCE_AGE_CATEGORIES, DANCE_AGE_LABELS, LEVELS } from '@/lib/divisions'

type Combo = { ageCategory: string; level: string }

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
    <button
      type="button"
      onClick={onChange}
      className="inline-flex items-center text-sm rounded-full px-3 py-1 cursor-pointer"
      style={{
        border: `1px solid ${checked ? 'var(--accent)' : 'var(--border-dark)'}`,
        backgroundColor: checked ? 'var(--accent)' : '#fff',
        color: checked ? '#fff' : 'var(--text)',
        fontWeight: checked ? 600 : 400,
      }}
    >
      {label}
    </button>
  )
}

function comboLabel(c: Combo) {
  return `${DANCE_AGE_LABELS[c.ageCategory] ?? c.ageCategory} · ${c.level}`
}

export default function AgeLevelPicker({
  currentAge,
  currentLevel,
  onSelectAge,
  onSelectLevel,
  submittedCombos,
  onSelectCombo,
  onSubmit,
}: {
  currentAge: string | null
  currentLevel: string | null
  onSelectAge: (age: string | null) => void
  onSelectLevel: (level: string | null) => void
  submittedCombos: Combo[]
  onSelectCombo: (combo: Combo) => void
  onSubmit: () => void
}) {
  return (
    <div className="card p-4 space-y-3">
      <h2 className="font-bold text-base">Age Category &amp; Level</h2>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        Pick one age and one level, check off that sheet&apos;s dances below, then Submit — this student may need
        several sheets across different age/level combos, and each one is fully independent.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)', width: 50 }}>Age</span>
        {DANCE_AGE_CATEGORIES.map(age => (
          <Chip
            key={age}
            label={DANCE_AGE_LABELS[age] ?? age}
            checked={currentAge === age}
            onChange={() => onSelectAge(currentAge === age ? null : age)}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)', width: 50 }}>Level</span>
        {LEVELS.map(level => (
          <Chip
            key={level}
            label={level}
            checked={currentLevel === level}
            onChange={() => onSelectLevel(currentLevel === level ? null : level)}
          />
        ))}
      </div>
      <div>
        <button
          onClick={onSubmit}
          disabled={!currentAge || !currentLevel}
          className="px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}
        >
          Submit this sheet
        </button>
      </div>

      {submittedCombos.length > 0 && (
        <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)' }}>
            Submitted sheets — click to reopen and edit
          </p>
          <div className="flex flex-wrap gap-2">
            {submittedCombos.map(c => {
              const isActive = c.ageCategory === currentAge && c.level === currentLevel
              return (
                <button
                  key={`${c.ageCategory}::${c.level}`}
                  onClick={() => onSelectCombo(c)}
                  className="text-sm rounded-full px-3 py-1"
                  style={{
                    border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-dark)'}`,
                    backgroundColor: isActive ? '#f6eef1' : '#f5f6f8',
                  }}
                >
                  {comboLabel(c)}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
