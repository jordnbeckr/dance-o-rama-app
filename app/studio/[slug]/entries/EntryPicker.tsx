'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getOrCreatePartnership } from '@/app/actions/partnership'
import { deletePartnership } from '@/app/actions/partnership'
import Link from 'next/link'
import PaidDaysBadge from '@/components/PaidDaysBadge'

type Person = {
  id: number
  firstName?: string
  lastName?: string
  name?: string
  paidThursday?: boolean
  paidFriday?: boolean
  paidSaturday?: boolean
}
type PartnershipRow = {
  id: number
  studentName: string
  instructorName: string
  awardPlaque: boolean
  danceEntryCount: number
  divisionEntryCount: number
  student: { paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }
}

export default function EntryPicker({
  slug,
  students,
  instructors,
  partnerships,
}: {
  slug: string
  students: Person[]
  instructors: Person[]
  partnerships: PartnershipRow[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [studentId, setStudentId] = useState('')
  const [instructorId, setInstructorId] = useState('')
  const selectedStudent = students.find(s => s.id === Number(studentId))

  function handleGo() {
    if (!studentId || !instructorId) return
    startTransition(async () => {
      const result = await getOrCreatePartnership(slug, Number(studentId), Number(instructorId))
      if ('error' in result) {
        setError(result.error)
      } else {
        router.push(`/studio/${slug}/entries/${result.partnershipId}`)
      }
    })
  }

  function handleDelete(id: number, label: string) {
    if (!confirm(`Remove the pairing "${label}"? This deletes all of its dance and division entries.`)) return
    startTransition(async () => {
      const result = await deletePartnership(slug, id)
      if (result?.error) setError(result.error)
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

      <div className="card p-4">
        <h3 className="font-semibold text-sm mb-3">Start or resume a pairing</h3>
        <div className="flex gap-2">
          <select value={studentId} onChange={e => setStudentId(e.target.value)} className="field flex-1">
            <option value="">Student…</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
            ))}
          </select>
          <select value={instructorId} onChange={e => setInstructorId(e.target.value)} className="field flex-1">
            <option value="">Instructor…</option>
            {instructors.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
          <button
            onClick={handleGo}
            disabled={pending || !studentId || !instructorId}
            className="px-4 py-2 text-sm font-medium text-white disabled:opacity-50 whitespace-nowrap"
            style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}
          >
            Go
          </button>
        </div>
        {selectedStudent && (
          <div className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
            Paid days: <PaidDaysBadge student={{
              paidThursday: selectedStudent.paidThursday ?? false,
              paidFriday: selectedStudent.paidFriday ?? false,
              paidSaturday: selectedStudent.paidSaturday ?? false,
            }} />
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wide"
          style={{ backgroundColor: '#ebebeb', borderBottom: '1px solid var(--border)', color: '#444' }}
        >
          Existing Pairings ({partnerships.length})
        </div>
        {partnerships.length === 0 && (
          <p className="px-4 py-3 text-sm italic" style={{ color: 'var(--muted)' }}>No pairings yet</p>
        )}
        {partnerships.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center px-4 py-2 gap-3"
            style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
          >
            <Link href={`/studio/${slug}/entries/${p.id}`} className="flex-1 text-sm hover:underline">
              <strong>{p.studentName}</strong> &amp; {p.instructorName}
              {p.awardPlaque && <span className="ml-2 text-xs" style={{ color: 'var(--accent)' }}>🏆 plaque</span>}
            </Link>
            <PaidDaysBadge student={p.student} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {p.danceEntryCount} dance{p.danceEntryCount !== 1 && 's'} · {p.divisionEntryCount} division{p.divisionEntryCount !== 1 && 's'}
            </span>
            <button
              onClick={() => handleDelete(p.id, `${p.studentName} & ${p.instructorName}`)}
              disabled={pending}
              className="text-xs disabled:opacity-40"
              style={{ color: '#dc2626' }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
