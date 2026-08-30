'use client'

import { useTransition, useState } from 'react'
import { setAwardPlaque } from '@/app/actions/partnership'

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
    <label className="card inline-flex items-center w-fit cursor-pointer" style={{ gap: '0.625rem', padding: '0.625rem 1.125rem' }}>
      <input type="checkbox" checked={checked} onChange={toggle} style={{ width: 16, height: 16, flexShrink: 0 }} />
      <span className="text-sm">🏆 Award plaque requested</span>
    </label>
  )
}
