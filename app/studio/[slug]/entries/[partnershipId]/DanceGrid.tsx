'use client'

import { useState, useTransition, useEffect, useMemo, Fragment } from 'react'
import { addDanceEntry, removeDanceEntry } from '@/app/actions/danceEntries'
import { AGE_CATEGORIES_5, AGE_LABELS, LEVELS, DANCE_STYLES, DAY_COLORS, studentHasPaidFor, danceDay } from '@/lib/divisions'

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

export default function DanceGrid({
  slug,
  partnershipId,
  dances,
  entries,
  student,
}: {
  slug: string
  partnershipId: number
  dances: Dance[]
  entries: Entry[]
  student: StudentPaid
}) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [draftGroups, setDraftGroups] = useState<GroupKey[]>([])
  const [newAge, setNewAge] = useState('')
  const [newLevel, setNewLevel] = useState('')
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

  const allGroups: GroupKey[] = useMemo(() => {
    const map = new Map<string, GroupKey>()
    for (const g of derivedGroups) map.set(groupKeyStr(g), g)
    for (const g of draftGroups) if (!map.has(groupKeyStr(g))) map.set(groupKeyStr(g), g)
    return Array.from(map.values())
  }, [derivedGroups, draftGroups])

  const distinctAges = new Set(entries.map(e => e.ageCategory))
  const distinctLevels = new Set(entries.map(e => e.level))

  const entryLookup = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of entries) m.set(entryKey(e.danceId, e.category, e.ageCategory, e.level), e.id)
    return m
  }, [entries])

  function addGroup() {
    if (!newAge || !newLevel) return
    const g = { ageCategory: newAge, level: newLevel }
    if (!allGroups.some(existing => groupKeyStr(existing) === groupKeyStr(g))) {
      setDraftGroups(prev => [...prev, g])
    }
    setNewAge('')
    setNewLevel('')
  }

  function removeDraftGroup(g: GroupKey) {
    setDraftGroups(prev => prev.filter(d => groupKeyStr(d) !== groupKeyStr(g)))
  }

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

  const stylesInOrder = DANCE_STYLES

  return (
    <div className="card p-4 space-y-4">
      <h2 className="font-bold text-base">Section 1 — Individual Dances (Closed / Open Category)</h2>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        {`Dances are disabled if ${student.firstName} hasn't paid for that day — check the Roster page to update paid days.`}
      </p>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        Build a group by picking an age category and a level, then check off which dances apply. Add another
        group for a different age/level combo (e.g. a lower age or a step-up level). Up to 2 distinct ages and
        2 distinct levels is suggested — going beyond that just shows a warning, it won&apos;t be blocked.
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

      <div className="flex items-end gap-2 flex-wrap">
        <div>
          <label className="block text-xs font-medium mb-1">Age category</label>
          <select value={newAge} onChange={e => setNewAge(e.target.value)} className="field" style={{ width: 160 }}>
            <option value="">Select…</option>
            {AGE_CATEGORIES_5.map(a => (
              <option key={a} value={a}>{AGE_LABELS[a]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Level</label>
          <select value={newLevel} onChange={e => setNewLevel(e.target.value)} className="field" style={{ width: 180 }}>
            <option value="">Select…</option>
            {LEVELS.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <button
          onClick={addGroup}
          disabled={!newAge || !newLevel}
          className="px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}
        >
          + Add group
        </button>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          Ages used: {distinctAges.size ? Array.from(distinctAges).map(a => AGE_LABELS[a] ?? a).join(', ') : 'none'} · Levels used: {distinctLevels.size ? Array.from(distinctLevels).join(', ') : 'none'}
        </span>
      </div>

      {allGroups.length === 0 && (
        <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No groups yet — add one above to start checking off dances.</p>
      )}

      <div className="space-y-4">
        {allGroups.map(g => {
          const isDraftOnly = !derivedGroups.some(d => groupKeyStr(d) === groupKeyStr(g))
          return (
            <details key={groupKeyStr(g)} open className="border rounded" style={{ borderColor: 'var(--border)' }}>
              <summary
                className="px-3 py-2 text-sm font-semibold cursor-pointer flex items-center justify-between"
                style={{ backgroundColor: '#f5f6f8' }}
              >
                <span>{AGE_LABELS[g.ageCategory] ?? g.ageCategory} · {g.level}</span>
                {isDraftOnly && (
                  <button
                    onClick={e => { e.preventDefault(); removeDraftGroup(g) }}
                    className="text-xs"
                    style={{ color: '#dc2626' }}
                  >
                    Discard empty group
                  </button>
                )}
              </summary>
              <div className="p-3 overflow-x-auto">
                <table className="data-table" style={{ minWidth: 480 }}>
                  <thead>
                    <tr>
                      <th>Dance</th>
                      <th style={{ textAlign: 'center' }}>Closed</th>
                      <th style={{ textAlign: 'center' }}>Open</th>
                    </tr>
                  </thead>
                  <tbody>
    {stylesInOrder.map(style => {
                      const styleDances = dances.filter(d => d.style === style)
                      if (styleDances.length === 0) return null
                      const closedDay = danceDay(style, 'Closed')
                      const openDay = danceDay(style, 'Open')
                      return (
                        <Fragment key={style}>
                          <tr>
                            <td style={{ backgroundColor: '#eef0f3', fontWeight: 600, fontSize: '0.75rem' }}>
                              {style}
                            </td>
                            <td style={{ backgroundColor: '#eef0f3', textAlign: 'center', fontSize: '0.68rem', fontWeight: 600, color: DAY_COLORS[closedDay] }}>
                              {closedDay}
                            </td>
                            <td style={{ backgroundColor: '#eef0f3', textAlign: 'center', fontSize: '0.68rem', fontWeight: 600, color: DAY_COLORS[openDay] }}>
                              {openDay}
                            </td>
                          </tr>
                          {styleDances.map(dance => {
                            const closedPaid = studentHasPaidFor(student, closedDay)
                            const openPaid = studentHasPaidFor(student, openDay)
                            return (
                              <tr key={dance.id}>
                                <td>{dance.name}</td>
                                {(['Closed', 'Open'] as const).map(category => {
                                  const day = category === 'Closed' ? closedDay : openDay
                                  const paid = category === 'Closed' ? closedPaid : openPaid
                                  const key = entryKey(dance.id, category, g.ageCategory, g.level)
                                  const isChecked = entryLookup.has(key) !== optimisticPending.has(key)
                                  return (
                                    <td key={category} style={{ textAlign: 'center' }}>
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        disabled={!paid}
                                        style={{ accentColor: DAY_COLORS[day] }}
                                        title={paid ? undefined : `${student.firstName} hasn't paid for ${day}`}
                                        onChange={e => toggleDance(g, dance.id, category, e.target.checked)}
                                      />
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
