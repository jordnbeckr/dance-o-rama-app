'use client'

import { useState, useTransition } from 'react'
import { updateDeadline, setDeadlineOverride } from '@/app/actions/admin'

type Settings = { entryDeadline: Date; deadlineOverride: boolean } | null

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function SettingsConfig({ settings }: { settings: Settings }) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [value, setValue] = useState(settings ? toLocalInputValue(new Date(settings.entryDeadline)) : '')
  const [override, setOverride] = useState(settings?.deadlineOverride ?? false)

  function handleSave() {
    setError(null)
    const fd = new FormData()
    fd.set('entryDeadline', value)
    startTransition(async () => {
      const result = await updateDeadline(fd)
      if (result?.error) setError(result.error)
    })
  }

  function handleToggleOverride() {
    const next = !override
    setOverride(next)
    startTransition(() => setDeadlineOverride(next))
  }

  return (
    <div className="card p-4 space-y-3">
      <h2 className="font-bold text-base">Entry Deadline</h2>
      {error && <div className="banner-error">{error}</div>}
      <div className="flex gap-2 items-end flex-wrap">
        <div>
          <label className="block text-xs font-medium mb-1">Deadline (studio&apos;s local time)</label>
          <input
            type="datetime-local"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="field"
            style={{ width: 240 }}
          />
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}
        >
          Save deadline
        </button>
      </div>
      <label className="checkbox-row">
        <input type="checkbox" checked={override} onChange={handleToggleOverride} />
        Override — let all studios edit past the deadline
      </label>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        This is one global deadline that applies to every studio. Admin can always add/edit/remove entries
        regardless of the deadline.
      </p>
    </div>
  )
}
