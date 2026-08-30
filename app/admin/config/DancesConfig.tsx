'use client'

import { useState, useTransition } from 'react'
import { addDance, deleteDance } from '@/app/actions/admin'
import { DANCE_STYLES } from '@/lib/divisions'

type Dance = { id: number; name: string; style: string }

export default function DancesConfig({ dances }: { dances: Dance[] }) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleAdd(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addDance(formData)
      if (result?.error) setError(result.error)
    })
  }

  function handleDelete(danceId: number, name: string) {
    if (!confirm(`Remove "${name}" from the dance list?`)) return
    startTransition(async () => {
      const result = await deleteDance(danceId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="card p-4 space-y-3">
      <h2 className="font-bold text-base">Dances ({dances.length})</h2>
      {error && (
        <div className="banner-error flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      <form action={handleAdd} className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium mb-1">Name</label>
          <input name="name" required className="field" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Style</label>
          <select name="style" required className="field" style={{ width: 180 }}>
            {DANCE_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}>
          Add
        </button>
      </form>

      {DANCE_STYLES.map(style => {
        const styleDances = dances.filter(d => d.style === style)
        if (styleDances.length === 0) return null
        return (
          <div key={style}>
            <div className="text-xs font-semibold uppercase tracking-wide mt-2 mb-1" style={{ color: '#444' }}>{style}</div>
            <div className="flex flex-wrap gap-1.5">
              {styleDances.map(d => (
                <span key={d.id} className="text-xs px-2 py-1 flex items-center gap-1.5" style={{ backgroundColor: '#f0f2f5', borderRadius: 3 }}>
                  {d.name}
                  <button onClick={() => handleDelete(d.id, d.name)} className="font-bold" style={{ color: '#dc2626' }}>×</button>
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
