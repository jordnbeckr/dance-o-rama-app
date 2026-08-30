'use client'

import { useState, useTransition } from 'react'
import { createFormationTeam, addFormationMember, removeFormationMember } from '@/app/actions/formations'
import { FORMATION_DAY, DAY_COLORS, DAY_BG_COLORS, formationSizeLabel } from '@/lib/divisions'

type Team = { id: number; danceName: string; members: { id: number; studentId: number }[] }

export default function FormationCard({
  slug,
  studentId,
  instructorId,
  firstName,
  teams,
  paidSaturday,
}: {
  slug: string
  studentId: number
  instructorId: number
  firstName: string
  teams: Team[]
  paidSaturday: boolean
}) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [newDanceName, setNewDanceName] = useState('')

  function toggleTeam(team: Team, join: boolean) {
    setError(null)
    startTransition(async () => {
      if (join) {
        const result = await addFormationMember(slug, team.id, studentId, instructorId)
        if (result?.error) setError(result.error)
      } else {
        const member = team.members.find(m => m.studentId === studentId)
        if (member) {
          const result = await removeFormationMember(slug, member.id)
          if (result?.error) setError(result.error)
        }
      }
    })
  }

  function handleCreateAndJoin() {
    if (!newDanceName.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await createFormationTeam(slug, newDanceName)
      if ('error' in result) {
        setError(result.error)
        return
      }
      const joinResult = await addFormationMember(slug, result.teamId, studentId, instructorId)
      if (joinResult?.error) setError(joinResult.error)
      else setNewDanceName('')
    })
  }

  return (
    <div className="card overflow-hidden flex flex-col" style={{ backgroundColor: DAY_BG_COLORS[FORMATION_DAY] }}>
      <div
        className="text-xs font-bold uppercase tracking-wide px-3 py-2 flex items-center justify-between gap-2"
        style={{ backgroundColor: DAY_BG_COLORS[FORMATION_DAY], color: DAY_COLORS[FORMATION_DAY], borderBottom: '1px solid var(--border)' }}
      >
        <span>Formation Teams</span>
        <span
          style={{
            backgroundColor: DAY_COLORS[FORMATION_DAY],
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 10,
            whiteSpace: 'nowrap',
          }}
        >
          {FORMATION_DAY}
        </span>
      </div>
      <div className="p-3 space-y-2 flex-1" style={{ backgroundColor: DAY_BG_COLORS[FORMATION_DAY] }}>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Small = 4 couples · Medium = 5-6 · Large = 7-8 (suggested, not a hard limit).
        </p>
        {error && <div className="banner-error">{error}</div>}
        {!paidSaturday ? (
          <p className="text-xs italic" style={{ color: 'var(--muted)' }} title={`${firstName} hasn't paid for ${FORMATION_DAY}`}>
            {firstName} hasn&apos;t paid for {FORMATION_DAY}.
          </p>
        ) : (
          <>
            {teams.length === 0 && (
              <p className="text-xs italic" style={{ color: 'var(--muted)' }}>No formation teams yet — create one below.</p>
            )}
            {teams.map(team => {
              const isMember = team.members.some(m => m.studentId === studentId)
              return (
                <label key={team.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMember}
                    onChange={e => toggleTeam(team, e.target.checked)}
                    style={{ accentColor: DAY_COLORS[FORMATION_DAY], width: 15, height: 15 }}
                  />
                  {team.danceName}
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>
                    ({team.members.length} dancer{team.members.length !== 1 ? 's' : ''} — {formationSizeLabel(team.members.length)})
                  </span>
                </label>
              )
            })}
            <div className="flex gap-2 items-end pt-1">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">New team — dance name</label>
                <input
                  value={newDanceName}
                  onChange={e => setNewDanceName(e.target.value)}
                  placeholder="e.g. Argentine Tango"
                  className="field"
                />
              </div>
              <button
                onClick={handleCreateAndJoin}
                disabled={!newDanceName.trim()}
                className="px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}
              >
                + Create &amp; join
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
