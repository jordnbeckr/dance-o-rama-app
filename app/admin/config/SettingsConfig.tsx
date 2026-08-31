'use client'

import { useState, useTransition } from 'react'
import { updateDeadline, setDeadlineOverride, updateEventName } from '@/app/actions/admin'

type Settings = { entryDeadline: Date; deadlineOverride: boolean; eventName: string } | null

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function SettingsConfig({ settings }: { settings: Settings }) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [value, setValue] = useState(settings ? toLocalInputValue(new Date(settings.entryDeadline)) : '')
  const [override, setOverride] = useState(settings?.deadlineOverride ?? false)
  const [eventName, setEventName] = useState(settings?.eventName ?? '')

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

  function handleSaveEventName() {
    setError(null)
    startTransition(async () => {
      const result = await updateEventName(eventName)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="space-y-2">
        <h2 className="font-bold text-base">Event Name</h2>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Shown to every studio on their dashboard (e.g. &ldquo;Unique Dance-O-Rama 2026&rdquo;).
        </p>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex-1" style={{ minWidth: 240 }}>
            <input
              value={eventName}
              onChange={e => setEventName(e.target.value)}
              placeholder="e.g. Unique Dance-O-Rama 2026"
              className="field"
            />
          </div>
          <button
            onClick={handleSaveEventName}
            disabled={!eventName.trim()}
            className="px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}
          >
            Save name
          </button>
        </div>
      </div>

      <div className="space-y-2" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
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
    </div>
  )
}
