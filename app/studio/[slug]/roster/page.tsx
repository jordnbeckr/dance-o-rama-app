import { db } from '@/lib/db'
import { JEWEL_TONES as JEWEL } from '@/lib/divisions'
import RosterManager from './RosterManager'

function PersonIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
      <circle cx="10" cy="6" r="3" />
      <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6z" />
    </svg>
  )
}
function MentorIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
      <circle cx="8" cy="6" r="3" />
      <path d="M2 17c0-3.3 2.7-6 6-6s6 2.7 6 6z" />
      <path d="M16 2.5l1 2 2.2.3-1.6 1.5.4 2.1-2-1-2 1 .4-2.1-1.6-1.5 2.2-.3z" />
    </svg>
  )
}

export default async function RosterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      students: {
        orderBy: [{ lastName: 'asc' }],
        select: { id: true, firstName: true, lastName: true, paidThursday: true, paidFriday: true, paidSaturday: true },
      },
      instructors: { orderBy: [{ name: 'asc' }] },
    },
  })

  if (!studio) return <p>Studio not found</p>

  const tiles = [
    { label: 'Students', value: studio.students.length, color: JEWEL.garnet, icon: <PersonIcon /> },
    { label: 'Instructors', value: studio.instructors.length, color: JEWEL.emerald, icon: <MentorIcon /> },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div style={{ background: 'linear-gradient(135deg, var(--header) 0%, #26365a 100%)', borderRadius: 8, padding: '24px 24px 36px' }}>
        <span
          style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,.14)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            padding: '4px 12px',
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          Roster
        </span>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>Students &amp; Instructors</h1>
        <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, margin: '6px 0 0' }}>Who&apos;s dancing this Dance-O-Rama</p>
      </div>

      <div className="grid grid-cols-2 gap-3" style={{ marginTop: -22, position: 'relative', zIndex: 2 }}>
        {tiles.map(t => (
          <div
            key={t.label}
            style={{ borderRadius: 10, padding: '12px 14px', color: '#fff', background: t.color, boxShadow: '0 6px 14px rgba(15,25,35,.18)' }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,.22)',
                borderRadius: 6,
                marginBottom: 8,
              }}
            >
              {t.icon}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{t.value}</div>
            <div style={{ fontSize: '0.6rem', marginTop: 3, opacity: 0.9, fontWeight: 600 }}>{t.label}</div>
          </div>
        ))}
      </div>

      <RosterManager slug={slug} students={studio.students} instructors={studio.instructors} />
    </div>
  )
}
