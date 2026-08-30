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
    <label className="checkbox-row card px-4 py-2 inline-flex w-fit cursor-pointer">
      <input type="checkbox" checked={checked} onChange={toggle} />
      <span>🏆 Award plaque requested</span>
    </label>
  )
}
