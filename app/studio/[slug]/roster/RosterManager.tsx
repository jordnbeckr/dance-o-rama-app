'use client'

import { addStudent, deleteStudent, addInstructor, deleteInstructor, setStudentPaidDay } from '@/app/actions/roster'
import { useTransition, useState } from 'react'
import { DAYS, DAY_COLORS, Day, JEWEL_TONES as JEWEL } from '@/lib/divisions'

type Student = { id: number; firstName: string; lastName: string; paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }
type Instructor = { id: number; name: string }

const DAY_FIELD: Record<Day, keyof Student> = {
  Thursday: 'paidThursday',
  Friday: 'paidFriday',
  Saturday: 'paidSaturday',
}

export default function RosterManager({
  slug,
  students,
  instructors,
}: {
  slug: string
  students: Student[]
  instructors: Instructor[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleAddStudent(formData: FormData) {
    startTransition(async () => {
      const result = await addStudent(slug, formData)
      if (result?.error) setError(result.error)
    })
  }

  function handleDeleteStudent(studentId: number, name: string) {
    if (!confirm(`Remove ${name}? This will also remove all their entries.`)) return
    startTransition(async () => {
      const result = await deleteStudent(slug, studentId)
      if (result?.error) setError(result.error)
    })
  }

  function handleTogglePaidDay(studentId: number, day: Day, value: boolean) {
    startTransition(async () => {
      const result = await setStudentPaidDay(slug, studentId, day, value)
      if (result?.error) setError(result.error)
    })
  }

  function handleAddInstructor(formData: FormData) {
    startTransition(async () => {
      const result = await addInstructor(slug, formData)
      if (result?.error) setError(result.error)
    })
  }

  function handleDeleteInstructor(instructorId: number, name: string) {
    if (!confirm(`Remove ${name}? This will also remove all their pairings.`)) return
    startTransition(async () => {
      const result = await deleteInstructor(slug, instructorId)
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
        <h3 className="font-semibold text-sm mb-3">Add Student</h3>
        <form action={handleAddStudent} className="flex gap-2">
          <input name="firstName" placeholder="First name" required className="field flex-1" />
          <input name="lastName" placeholder="Last name" required className="field flex-1" />
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}
          >
            Add
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wide"
          style={{ backgroundColor: `${JEWEL.garnet}1a`, borderBottom: '1px solid var(--border)', color: JEWEL.garnet }}
        >
          Students ({students.length})
        </div>
        {students.length === 0 && (
          <p className="px-4 py-3 text-sm italic" style={{ color: 'var(--muted)' }}>No students yet</p>
        )}
        {students.map((s, i) => (
          <div
            key={s.id}
            className="flex items-center px-4 py-2 gap-3"
            style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
          >
            <span className="flex-1 text-sm">{s.firstName} {s.lastName}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--muted)' }}>Paid days:</span>
              {DAYS.map(day => (
                <label key={day} className="checkbox-row" style={{ color: DAY_COLORS[day] }}>
                  <input
                    type="checkbox"
                    checked={s[DAY_FIELD[day]] as boolean}
                    onChange={e => handleTogglePaidDay(s.id, day, e.target.checked)}
                    disabled={pending}
                  />
                  {day.slice(0, 3)}
                </label>
              ))}
            </div>
            <button
              onClick={() => handleDeleteStudent(s.id, `${s.firstName} ${s.lastName}`)}
              disabled={pending}
              className="text-xs disabled:opacity-40"
              style={{ color: '#dc2626' }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-sm mb-3">Add Instructor</h3>
        <form action={handleAddInstructor} className="flex gap-2">
          <input name="name" placeholder="Instructor name" required className="field flex-1" />
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}
          >
            Add
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wide"
          style={{ backgroundColor: `${JEWEL.emerald}1a`, borderBottom: '1px solid var(--border)', color: JEWEL.emerald }}
        >
          Instructors ({instructors.length})
        </div>
        {instructors.length === 0 && (
          <p className="px-4 py-3 text-sm italic" style={{ color: 'var(--muted)' }}>No instructors yet</p>
        )}
        {instructors.map((inst, i) => (
          <div
            key={inst.id}
            className="flex items-center px-4 py-2"
            style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
          >
            <span className="flex-1 text-sm">{inst.name}</span>
            <button
              onClick={() => handleDeleteInstructor(inst.id, inst.name)}
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
