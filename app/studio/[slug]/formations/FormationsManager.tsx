'use client'

import { useState, useTransition } from 'react'
import { createFormationTeam, deleteFormationTeam, addFormationMember, removeFormationMember } from '@/app/actions/formations'
import { formationSizeLabel, FORMATION_DAY, studentHasPaidFor } from '@/lib/divisions'

type Student = { id: number; firstName: string; lastName: string; paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }
type Instructor = { id: number; name: string }
type Member = { id: number; studentName: string; instructorName: string | null }
type Team = { id: number; name: string; danceName: string; members: Member[] }

function TeamCard({ slug, team, students, instructors }: { slug: string; team: Team; students: Student[]; instructors: Instructor[] }) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [studentId, setStudentId] = useState('')
  const [instructorId, setInstructorId] = useState('')
  const selectedStudent = students.find(s => s.id === Number(studentId))
  const selectedStudentPaid = selectedStudent ? studentHasPaidFor(selectedStudent, FORMATION_DAY) : false

  function handleAddMember() {
    if (!studentId) return
    setError(null)
    startTransition(async () => {
      const result = await addFormationMember(slug, team.id, Number(studentId), instructorId ? Number(instructorId) : null)
      if (result?.error) setError(result.error)
      else {
        setStudentId('')
        setInstructorId('')
      }
    })
  }

  function handleRemoveMember(memberId: number) {
    startTransition(() => {
      removeFormationMember(slug, memberId)
    })
  }

  function handleDeleteTeam() {
    if (!confirm(`Delete the formation team "${team.name}"?`)) return
    startTransition(() => {
      deleteFormationTeam(slug, team.id)
    })
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: '#f5f6f8', borderBottom: '1px solid var(--border)' }}>
        <div>
          <span className="font-semibold text-sm">{team.name}</span>
          <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>{team.danceName}</span>
          <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>
            — {team.members.length} dancer{team.members.length !== 1 && 's'} — {formationSizeLabel(team.members.length)}
          </span>
        </div>
        <button onClick={handleDeleteTeam} className="text-xs" style={{ color: '#dc2626' }}>Delete team</button>
      </div>
      {error && <div className="banner-error m-3">{error}</div>}
      <div>
        {team.members.map((m, i) => (
          <div key={m.id} className="flex items-center px-4 py-1.5" style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
            <span className="flex-1 text-sm">{m.studentName}{m.instructorName && <span style={{ color: 'var(--muted)' }}> &amp; {m.instructorName}</span>}</span>
            <button onClick={() => handleRemoveMember(m.id)} className="text-xs" style={{ color: '#dc2626' }}>Remove</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-end px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div>
          <label className="block text-xs font-medium mb-1">Student</label>
          <select value={studentId} onChange={e => setStudentId(e.target.value)} className="field" style={{ width: 160 }}>
            <option value="">Select…</option>
            {students.map(s => {
              const paid = studentHasPaidFor(s, FORMATION_DAY)
              return (
                <option key={s.id} value={s.id} disabled={!paid}>
                  {s.firstName} {s.lastName}{paid ? '' : ` (not paid for ${FORMATION_DAY})`}
                </option>
              )
            })}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Instructor (optional)</label>
          <select value={instructorId} onChange={e => setInstructorId(e.target.value)} className="field" style={{ width: 160 }}>
            <option value="">None (amateur pair)</option>
            {instructors.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAddMember}
          disabled={!studentId || !selectedStudentPaid}
          className="px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}
        >
          + Add dancer
        </button>
      </div>
    </div>
  )
}

export default function FormationsManager({
  slug,
  students,
  instructors,
  teams,
}: {
  slug: string
  students: Student[]
  instructors: Instructor[]
  teams: Team[]
}) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newDanceName, setNewDanceName] = useState('')

  function handleCreateTeam() {
    if (!newName.trim() || !newDanceName.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await createFormationTeam(slug, newName, newDanceName)
      if ('error' in result) setError(result.error)
      else {
        setNewName('')
        setNewDanceName('')
      }
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="banner-error flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      <div className="card p-4 flex gap-2 items-end flex-wrap">
        <div className="flex-1" style={{ minWidth: 160 }}>
          <label className="block text-xs font-medium mb-1">Team name</label>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Advanced Team" className="field" />
        </div>
        <div className="flex-1" style={{ minWidth: 160 }}>
          <label className="block text-xs font-medium mb-1">Dance</label>
          <input value={newDanceName} onChange={e => setNewDanceName(e.target.value)} placeholder="e.g. Argentine Tango" className="field" />
        </div>
        <button
          onClick={handleCreateTeam}
          disabled={!newName.trim() || !newDanceName.trim()}
          className="px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}
        >
          Create team
        </button>
      </div>

      {teams.length === 0 && (
        <p className="text-sm italic text-center" style={{ color: 'var(--muted)' }}>No formation teams yet.</p>
      )}
      {teams.map(t => (
        <TeamCard key={t.id} slug={slug} team={t} students={students} instructors={instructors} />
      ))}
    </div>
  )
}
