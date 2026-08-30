'use client'

import { useState, useTransition, useEffect, useMemo } from 'react'
import { addDanceEntry, removeDanceEntry } from '@/app/actions/danceEntries'
import { DANCE_AGE_LABELS, DAY_COLORS, DAY_BG_COLORS, studentHasPaidFor, danceDay, Day } from '@/lib/divisions'

type Dance = { id: number; name: string; style: string }
type Entry = { id: number; danceId: number; category: string; ageCategory: string; level: string }
type StudentPaid = { firstName: string; paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }
type Combo = { ageCategory: string; level: string }

function comboKeyStr(c: Combo) {
  return `${c.ageCategory}::${c.level}`
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
  pendingCombo,
}: {
  slug: string
  partnershipId: number
  dances: Dance[]
  entries: Entry[]
  student: StudentPaid
  pendingCombo: Combo | null
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

  const derivedGroups: Combo[] = useMemo(() => {
    const seen = new Map<string, Combo>()
    for (const e of entries) {
      const c = { ageCategory: e.ageCategory, level: e.level }
      seen.set(comboKeyStr(c), c)
    }
    return Array.from(seen.values())
  }, [entries])

  // Every real sheet always shows — plus a blank one being started, if its
  // combo doesn't already have entries.
  const allGroups: Combo[] = useMemo(() => {
    if (pendingCombo && !derivedGroups.some(g => comboKeyStr(g) === comboKeyStr(pendingCombo))) {
      return [...derivedGroups, pendingCombo]
    }
    return derivedGroups
  }, [derivedGroups, pendingCombo])

  const entryLookup = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of entries) m.set(entryKey(e.danceId, e.category, e.ageCategory, e.level), e.id)
    return m
  }, [entries])

  // Students often dance the same heats across several of their sheets
  // (e.g. the same Waltz at both B1 and B2, Assoc and Full Silver) — this
  // copies one sheet's checked dances into the others instead of
  // re-checking the same boxes over again.
  function copyGroupToOthers(source: Combo) {
    const sourceEntries = entries.filter(e => e.ageCategory === source.ageCategory && e.level === source.level)
    const targets = allGroups.filter(g => comboKeyStr(g) !== comboKeyStr(source))
    if (sourceEntries.length === 0 || targets.length === 0) return
    setError(null)
    startTransition(async () => {
      const results = await Promise.all(
        targets.flatMap(target =>
          sourceEntries
            .filter(se => !entryLookup.has(entryKey(se.danceId, se.category, target.ageCategory, target.level)))
            .map(se => addDanceEntry(slug, partnershipId, se.danceId, se.category as 'Closed' | 'Open', target.ageCategory, target.level))
        )
      )
      const firstError = results.find((r): r is { error: string } => 'error' in r && !!r.error)
      if (firstError) setError(firstError.error)
    })
  }

  function toggleDance(g: Combo, danceId: number, category: 'Closed' | 'Open', checked: boolean) {
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

      {allGroups.length === 0 && (
        <p className="text-sm italic" style={{ color: 'var(--muted)' }}>
          Pick an age and level above to start a sheet.
        </p>
      )}

      <div className="space-y-4">
        {allGroups.map(g => (
          <div key={comboKeyStr(g)}>
            {allGroups.length > 1 && (
              <div
                className="text-xs font-semibold px-2 py-1.5 rounded-t flex items-center justify-between gap-2"
                style={{ backgroundColor: '#f5f6f8' }}
              >
                <span>{DANCE_AGE_LABELS[g.ageCategory] ?? g.ageCategory} · {g.level}</span>
                <button
                  onClick={() => copyGroupToOthers(g)}
                  className="font-normal normal-case"
                  style={{ color: 'var(--accent)' }}
                  title="Check the same dances in every other sheet"
                >
                  Copy to other sheets
                </button>
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
