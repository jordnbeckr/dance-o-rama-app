import { DAYS, DAY_COLORS } from '@/lib/divisions'

type PaidFlags = { paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }

const SHORT: Record<string, string> = { Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' }

export default function PaidDaysBadge({ student }: { student: PaidFlags }) {
  const paid = DAYS.filter(d =>
    d === 'Thursday' ? student.paidThursday : d === 'Friday' ? student.paidFriday : student.paidSaturday
  )

  if (paid.length === 0) {
    return <span className="text-xs italic" style={{ color: 'var(--muted)' }}>no paid days</span>
  }

  return (
    <span className="inline-flex items-center gap-1">
      {paid.map(d => (
        <span
          key={d}
          className="text-xs font-medium px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${DAY_COLORS[d]}1a`, color: DAY_COLORS[d] }}
        >
          {SHORT[d]}
        </span>
      ))}
    </span>
  )
}
