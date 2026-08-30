'use client'

import { useState, useTransition } from 'react'
import { addStudio, resetStudioPassword, deleteStudio } from '@/app/actions/admin'

type Studio = { id: number; name: string; slug: string }

export default function StudiosConfig({ studios }: { studios: Studio[] }) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [resetting, setResetting] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')

  function handleAdd(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addStudio(formData)
      if (result?.error) setError(result.error)
    })
  }

  function handleResetPassword(studioId: number) {
    if (!newPassword.trim()) return
    startTransition(async () => {
      const result = await resetStudioPassword(studioId, newPassword)
      if (result?.error) setError(result.error)
      else {
        setResetting(null)
        setNewPassword('')
      }
    })
  }

  function handleDelete(studioId: number, name: string) {
    if (!confirm(`Delete ${name}? This removes ALL of its students, instructors, and entries.`)) return
    startTransition(() => deleteStudio(studioId))
  }

  return (
    <div className="card p-4 space-y-3">
      <h2 className="font-bold text-base">Studios</h2>
      {error && (
        <div className="banner-error flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      <form action={handleAdd} className="flex gap-2 flex-wrap items-end">
        <div>
          <label className="block text-xs font-medium mb-1">Name</label>
          <input name="name" required className="field" style={{ width: 160 }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Slug</label>
          <input name="slug" required placeholder="e.g. sherman-oaks" className="field" style={{ width: 160 }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Password</label>
          <input name="password" required className="field" style={{ width: 140 }} />
        </div>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}>
          Add studio
        </button>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {studios.map(s => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.slug}</td>
              <td className="flex gap-3">
                {resetting === s.id ? (
                  <>
                    <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" className="field" style={{ width: 140 }} />
                    <button onClick={() => handleResetPassword(s.id)} className="text-xs" style={{ color: 'var(--accent)' }}>Save</button>
                    <button onClick={() => { setResetting(null); setNewPassword('') }} className="text-xs" style={{ color: 'var(--muted)' }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setResetting(s.id)} className="text-xs" style={{ color: 'var(--accent)' }}>Reset password</button>
                    <button onClick={() => handleDelete(s.id, s.name)} className="text-xs" style={{ color: '#dc2626' }}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
