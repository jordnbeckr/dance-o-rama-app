'use client'

import { useState, useTransition } from 'react'
import { addFormationMember, removeFormationMember } from '@/app/actions/formations'
import { FORMATION_DAY, DAY_COLORS, DAY_BG_COLORS, formationSizeLabel } from '@/lib/divisions'

type Team = { id: number; name: string; danceName: string; members: { id: number; studentId: number }[] }

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
  const [pickedTeamId, setPickedTeamId] = useState('')

  const joinedTeams = teams.filter(t => t.members.some(m => m.studentId === studentId))
  const availableTeams = teams.filter(t => !t.members.some(m => m.studentId === studentId))

  function handleJoin() {
    if (!pickedTeamId) return
    setError(null)
    startTransition(async () => {
      const result = await addFormationMember(slug, Number(pickedTeamId), studentId, instructorId)
      if (result?.error) setError(result.error)
      else setPickedTeamId('')
    })
  }

  function handleLeave(team: Team) {
    const member = team.members.find(m => m.studentId === studentId)
    if (!member) return
    setError(null)
    startTransition(async () => {
      const result = await removeFormationMember(slug, member.id)
      if (result?.error) setError(result.error)
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
          Ask your studio to set up a formation team if you don&apos;t see it below.
        </p>
        {error && <div className="banner-error">{error}</div>}
        {!paidSaturday ? (
          <p className="text-xs italic" style={{ color: 'var(--muted)' }} title={`${firstName} hasn't paid for ${FORMATION_DAY}`}>
            {firstName} hasn&apos;t paid for {FORMATION_DAY}.
          </p>
        ) : (
          <>
            {joinedTeams.length > 0 && (
              <div className="space-y-1">
                {joinedTeams.map(team => (
                  <div key={team.id} className="flex items-center justify-between text-sm gap-2">
                    <span>
                      {team.name} <span className="text-xs" style={{ color: 'var(--muted)' }}>({team.danceName})</span>
                    </span>
                    <button onClick={() => handleLeave(team)} className="text-xs" style={{ color: '#dc2626' }}>Leave</button>
                  </div>
                ))}
              </div>
            )}

            {availableTeams.length === 0 ? (
              <p className="text-xs italic" style={{ color: 'var(--muted)' }}>
                {teams.length === 0 ? 'No formation teams have been created yet.' : 'Already joined every team.'}
              </p>
            ) : (
              <div className="flex gap-2 items-end pt-1">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1">Choose a formation</label>
                  <select value={pickedTeamId} onChange={e => setPickedTeamId(e.target.value)} className="field">
                    <option value="">Select…</option>
                    {availableTeams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name} — {team.danceName} ({team.members.length} dancer{team.members.length !== 1 ? 's' : ''}, {formationSizeLabel(team.members.length)})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleJoin}
                  disabled={!pickedTeamId}
                  className="px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}
                >
                  Join
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
