import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getSettings } from '@/lib/deadline'
import Link from 'next/link'

const entries = [
  {
    href: '/login/admin',
    label: 'Admin',
    color: '#1a2744',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
  {
    href: '/login/studio',
    label: 'Studio Login',
    color: '#7a2f4e',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21l18 0"/>
        <path d="M9 8l1 0"/>
        <path d="M9 12l1 0"/>
        <path d="M9 16l1 0"/>
        <path d="M14 8l1 0"/>
        <path d="M14 12l1 0"/>
        <path d="M14 16l1 0"/>
        <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16"/>
      </svg>
    ),
  },
]

export default async function Home() {
  const session = await getSession()
  if (session?.role === 'admin') redirect('/admin')
  if (session?.role === 'studio') redirect(`/studio/${session.studioSlug}`)

  const settings = await getSettings()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="w-full space-y-8" style={{ maxWidth: 560 }}>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-center" style={{ color: 'var(--text)' }}>Unique Dance-O-Rama</h1>
          <div className="text-sm text-center space-y-0.5" style={{ color: 'var(--muted)' }}>
            <p>Entry signup — who&apos;s dancing what, with whom, in which division</p>
            {settings && (
              <p>
                <strong style={{ color: 'var(--text)' }}>
                  Entry deadline: {settings.entryDeadline.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </strong>
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {entries.map(({ href, label, color, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-3 rounded-lg py-6 px-3 text-center transition-opacity hover:opacity-90 active:opacity-75"
              style={{ backgroundColor: color, color: 'white', flex: 1, minHeight: 110 }}
            >
              {icon}
              <span className="text-xs font-semibold leading-tight" style={{ color: 'white' }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
