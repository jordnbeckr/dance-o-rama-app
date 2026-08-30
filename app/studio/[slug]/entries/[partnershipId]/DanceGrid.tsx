'use client'

import { useState, useTransition, useEffect, useMemo } from 'react'
import { addDanceEntry, removeDanceEntry } from '@/app/actions/danceEntries'
import { AGE_LABELS, DAY_COLORS, DAY_BG_COLORS, studentHasPaidFor, danceDay, Day } from '@/lib/divisions'

type Dance = { id: number; name: string; style: string }
type Entry = { id: number; danceId: number; category: string; ageCategory: string; level: string }
type StudentPaid = { firstName: string; paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }
type GroupKey = { ageCategory: string; level: string }

function groupKeyStr(g: GroupKey) {
  return `${g.ageCategory}::${g.level}`
}

function entryKey(danceId: number, category: string, ageCategory: string, level: string) {
  return `${danceId}::${category}::${ageCategory}::${level}`
}

// Matches the mockup's 4-column layout: each column pairs a category
// (Closed/Open) with the two styles that share a paper-form sub-column.
const COLUMNS: { category: 'Closed' | 'Open'; title: string; styles: string[] }[] = [
  { category: 'Closed', title: 'Closed · American & Int’l Style', styles: ['American Style', 'International Style'] },
  { category: 'Closed', title: 'Closed · C/W & Specialty', styles: ['Country Western', 'Specialty'] },
  { category: 'Open', title: 'Open · American & Int’l Style', styles: ['American Style', 'International Style'] },
  { category: 'Open', title: 'Open · C/W & Specialty', styles: ['Country Western', 'Specialty'] },
]

export default function DanceGrid({
  slug,
  partnershipId,
  dances,
  entries,
  student,
  selectedAges,
  selectedLevels,
}: {
  slug: string
  partnershipId: number
  dances: Dance[]
  entries: Entry[]
  student: StudentPaid
  selectedAges: string[]
  selectedLevels: string[]
}) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [optimisticPending, setOptimisticPending] = useState<Set<string>>(new Set())

  // Clear transient optimistic-pending markers once fresh entries arrive.
  const entriesFingerprint = entries.map(e => e.id).sort((a, b) => a - b).join(',')
  useEffect(() => {
    setOptimisticPending(new Set())
  }, [entriesFingerprint])

  const derivedGroups: GroupKey[] = useMemo(() => {
    const seen = new Map<string, GroupKey>()
    for (const e of entries) {
      const g = { ageCategory: e.ageCategory, level: e.level }
      seen.set(groupKeyStr(g), g)
    }
    return Array.from(seen.values())
  }, [entries])

  // Active groups = every real (age, level) already entered, plus the
  // cross-product of whatever's currently checked in the top picker — so
  // checking chips is itself the only step needed to reveal a fresh chart.
  const activeGroups: GroupKey[] = useMemo(() => {
    const map = new Map<string, GroupKey>()
    for (const g of derivedGroups) map.set(groupKeyStr(g), g)
    for (const ageCategory of selectedAges) {
      for (const level of selectedLevels) {
        const g = { ageCategory, level }
        if (!map.has(groupKeyStr(g))) map.set(groupKeyStr(g), g)
      }
    }
    return Array.from(map.values())
  }, [derivedGroups, selectedAges, selectedLevels])

  const entryLookup = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of entries) m.set(entryKey(e.danceId, e.category, e.ageCategory, e.level), e.id)
    return m
  }, [entries])

  function toggleDance(g: GroupKey, danceId: number, category: 'Closed' | 'Open', checked: boolean) {
    const key = entryKey(danceId, category, g.ageCategory, g.level)
    setOptimisticPending(prev => new Set(prev).add(key))
    setError(null)
    setWarning(null)
    startTransition(async () => {
      if (checked) {
        const result = await addDanceEntry(slug, partnershipId, danceId, category, g.ageCategory, g.level)
        if ('error' in result && result.error) setError(result.error)
        else if ('warning' in result && result.warning) setWarning(result.warning)
      } else {
        const id = entryLookup.get(key)
        if (id) {
          const result = await removeDanceEntry(slug, id)
          if (result?.error) setError(result.error)
        }
      }
    })
  }

  return (
    <div className="card p-4 space-y-4">
      <h2 className="font-bold text-base">Closed Category · Open Category</h2>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        {`Dances are disabled if ${student.firstName} hasn't paid for that day. Each style is tinted to the day it runs.`}
      </p>

      {error && (
        <div className="banner-error flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}
      {warning && (
        <div className="banner-warning flex justify-between">
          {warning}
          <button onClick={() => setWarning(null)} className="font-bold">×</button>
        </div>
      )}

      {activeGroups.length === 0 && (
        <p className="text-sm italic" style={{ color: 'var(--muted)' }}>
          Pick an age and level above to start checking off dances.
        </p>
      )}

      <div className="space-y-4">
        {activeGroups.map(g => (
          <div key={groupKeyStr(g)}>
            {activeGroups.length > 1 && (
              <div
                className="text-xs font-semibold px-2 py-1.5 rounded-t"
                style={{ backgroundColor: '#f5f6f8' }}
              >
                {AGE_LABELS[g.ageCategory] ?? g.ageCategory} · {g.level}
              </div>
            )}
            <div className="overflow-x-auto">
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))' }}>
                {COLUMNS.map(col => (
                  <div key={`${col.category}-${col.title}`}>
                    <div
                      className="text-xs font-bold uppercase tracking-wide text-white rounded px-2 py-1.5 mb-2"
                      style={{ backgroundColor: 'var(--header)' }}
                    >
                      {col.title}
                    </div>
                    {col.styles.map(style => {
                      const styleDances = dances.filter(d => d.style === style)
                      if (styleDances.length === 0) return null
                      const day: Day = danceDay(style, col.category)
                      return (
                        <div
                          key={style}
                          className="rounded p-2 mb-2"
                          style={{ backgroundColor: DAY_BG_COLORS[day] }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#2a3545' }}>{style}</span>
                            <span className="text-xs font-bold" style={{ color: DAY_COLORS[day] }}>{day}</span>
                          </div>
                          {styleDances.map(dance => {
                            const key = entryKey(dance.id, col.category, g.ageCategory, g.level)
                            const isChecked = entryLookup.has(key) !== optimisticPending.has(key)
                            const paid = studentHasPaidFor(student, day)
                            return (
                              <label
                                key={dance.id}
                                className="flex items-center gap-2 py-0.5 text-sm cursor-pointer"
                                style={{ color: DAY_COLORS[day] }}
                                title={paid ? undefined : `${student.firstName} hasn't paid for ${day}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={!paid}
                                  style={{ accentColor: DAY_COLORS[day], width: 15, height: 15, flexShrink: 0 }}
                                  onChange={e => toggleDance(g, dance.id, col.category, e.target.checked)}
                                />
                                {dance.name}
                              </label>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
