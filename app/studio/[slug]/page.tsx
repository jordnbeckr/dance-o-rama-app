import { db } from '@/lib/db'
import { getSettings } from '@/lib/deadline'
import { JEWEL_TONES as JEWEL } from '@/lib/divisions'
import Link from 'next/link'

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
function NoteIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ width: 14, height: 14 }}>
      <path d="M8 14V4l8-2v10" />
      <circle cx="6" cy="15" r="2.3" fill="currentColor" stroke="none" />
      <circle cx="14" cy="12" r="2.3" fill="currentColor" stroke="none" />
    </svg>
  )
}
function RibbonIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
      <circle cx="10" cy="7" r="4.2" />
      <path d="M7.3 10.8L6 18l4-2 4 2-1.3-7.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
function CoupleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
      <circle cx="7" cy="10" r="5" />
      <circle cx="13" cy="10" r="5" opacity="0.55" />
    </svg>
  )
}
function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
      <path d="M10 2l2.2 5.6 6 .4-4.6 3.9 1.6 5.8L10 14.8 4.8 17.7l1.6-5.8L1.8 8l6-.4z" />
    </svg>
  )
}
function GroupIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
      <circle cx="10" cy="4.5" r="2.3" />
      <circle cx="4.5" cy="15" r="2.3" />
      <circle cx="15.5" cy="15" r="2.3" />
    </svg>
  )
}

export default async function StudioDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const studio = await db.studio.findUnique({ where: { slug } })
  if (!studio) return null

  const [studentCount, instructorCount, danceEntryCount, divisionEntryCount, coupleEventCount, soloCount, formationCount, settings] =
    await Promise.all([
      db.student.count({ where: { studioId: studio.id } }),
      db.instructor.count({ where: { studioId: studio.id } }),
      db.danceEntry.count({ where: { partnership: { studioId: studio.id } } }),
      db.divisionEntry.count({ where: { partnership: { studioId: studio.id } } }),
      db.coupleEventEntry.count({
        where: { OR: [{ student: { studioId: studio.id } }, { partnerStudent: { studioId: studio.id } }] },
      }),
      db.soloEntry.count({ where: { studioId: studio.id } }),
      db.formationTeam.count({ where: { studioId: studio.id } }),
      getSettings(),
    ])

  const tiles = [
    { label: 'Students', value: studentCount, href: `/studio/${slug}/roster`, color: JEWEL.garnet, icon: <PersonIcon /> },
    { label: 'Instructors', value: instructorCount, href: `/studio/${slug}/roster`, color: JEWEL.emerald, icon: <MentorIcon /> },
    { label: 'Dance Entries', value: danceEntryCount, href: `/studio/${slug}/entries`, color: JEWEL.sapphire, icon: <NoteIcon /> },
    { label: 'Division Entries', value: divisionEntryCount, href: `/studio/${slug}/entries`, color: JEWEL.amethyst, icon: <RibbonIcon /> },
    { label: 'Couple Events', value: coupleEventCount, href: `/studio/${slug}/entries`, color: JEWEL.topaz, icon: <CoupleIcon /> },
    { label: 'Solo/Show Routines', value: soloCount, href: `/studio/${slug}/entries`, color: JEWEL.garnet, icon: <StarIcon /> },
    { label: 'Formation Teams', value: formationCount, href: `/studio/${slug}/entries`, color: JEWEL.emerald, icon: <GroupIcon /> },
  ]

  const steps = [
    {
      color: JEWEL.garnet,
      title: 'Build your roster',
      body: <>Add students and instructors on the <Link href={`/studio/${slug}/roster`} className="underline">Roster</Link> page.</>,
    },
    {
      color: JEWEL.sapphire,
      title: 'Check off entries',
      body: (
        <>
          For each pairing, add dances and divisions under <Link href={`/studio/${slug}/entries`} className="underline">Entries</Link>
          {' '}&mdash; it also covers Amateur Couple/Club events, Solo/Show routines, and Formation teams.
        </>
      ),
    },
    {
      color: JEWEL.emerald,
      title: 'Confirm & submit',
      body: <>Review the <Link href={`/studio/${slug}/summary`} className="underline">Summary</Link> page before the deadline to make sure everything&apos;s correct.</>,
    },
  ]

  return (
    <div className="space-y-6">
      <div style={{ background: 'linear-gradient(135deg, var(--header) 0%, #26365a 100%)', borderRadius: 8, padding: '20px 24px', textAlign: 'center' }}>
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
            marginBottom: 10,
          }}
        >
          Studio Dashboard
        </span>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>{studio.name}</h1>
        <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, margin: '6px 0 0' }}>{settings?.eventName ?? 'Dance-O-Rama'}</p>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {tiles.map(t => (
          <Link
            key={t.label}
            href={t.href}
            className="hover:shadow-md transition-shadow"
            style={{ borderRadius: 10, padding: '12px 10px', color: '#fff', background: t.color, boxShadow: '0 6px 14px rgba(15,25,35,.18)' }}
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
          </Link>
        ))}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)', marginBottom: 14 }}>
          Getting started
        </p>
        <div className="grid grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={s.title}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    flexShrink: 0,
                    borderRadius: '50%',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 15,
                    background: s.color,
                  }}
                >
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      marginLeft: 10,
                      background: 'repeating-linear-gradient(to right, var(--border-dark) 0 6px, transparent 6px 12px)',
                    }}
                  />
                )}
              </div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 4px' }}>{s.title}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
