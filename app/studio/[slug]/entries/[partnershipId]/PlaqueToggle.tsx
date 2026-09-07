'use client'

import { useTransition, useState } from 'react'
import { setAwardPlaque } from '@/app/actions/partnership'

const GOLD = '#b8860b'

function TrophyIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path
        d="M6 3h8v3.2c0 2.6-1.8 4.6-4 4.8v2h2.5v1.5h-6.5V13H8v-2c-2.2-.2-4-2.2-4-4.8V3z"
        fill={filled ? GOLD : 'none'}
        stroke={filled ? GOLD : 'var(--muted)'}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M6 4.2H3.8a1.4 1.4 0 0 0-1.4 1.6c.25 1.7 1.4 2.9 3 3.1M14 4.2h2.2a1.4 1.4 0 0 1 1.4 1.6c-.25 1.7-1.4 2.9-3 3.1"
        fill="none"
        stroke={filled ? GOLD : 'var(--muted)'}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function PlaqueToggle({
  slug,
  partnershipId,
  initialValue,
}: {
  slug: string
  partnershipId: number
  initialValue: boolean
}) {
  const [checked, setChecked] = useState(initialValue)
  const [, startTransition] = useTransition()

  function toggle() {
    const next = !checked
    setChecked(next)
    startTransition(() => {
      setAwardPlaque(slug, partnershipId, next)
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center w-fit cursor-pointer rounded-full transition-colors"
      style={{
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        border: `1.5px solid ${checked ? GOLD : 'var(--border)'}`,
        backgroundColor: checked ? `${GOLD}1a` : 'var(--card)',
      }}
    >
      <TrophyIcon filled={checked} />
      <span className="text-sm font-semibold" style={{ color: checked ? GOLD : 'var(--muted)' }}>
        {checked ? 'Plaque requested' : 'Request a plaque'}
      </span>
    </button>
  )
}
