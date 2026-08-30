// Static option lists for Sections 2-4 (DivisionEntry) and Sections 5-6
// (CoupleEventEntry). Kept out of the schema per the plan — valid values
// differ per section and are validated here / in the UI, not the DB.

export const DAYS = ['Thursday', 'Friday', 'Saturday'] as const
export type Day = (typeof DAYS)[number]

// Matches the paper form's color legend (green/blue/red).
export const DAY_COLORS: Record<Day, string> = {
  Thursday: '#15803d',
  Friday: '#1d4ed8',
  Saturday: '#b91c1c',
}

// Solo Routines (Section 7) and Formation Teams (Section 8) each run on a
// single fixed day — not necessarily the same day as each other.
export const SOLO_DAY: Day = 'Thursday'
export const FORMATION_DAY: Day = 'Saturday'

type PaidDayFlags = { paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }

export function studentHasPaidFor(student: PaidDayFlags, day: string): boolean {
  if (day === 'Thursday') return student.paidThursday
  if (day === 'Friday') return student.paidFriday
  if (day === 'Saturday') return student.paidSaturday
  return false
}

export const AGE_CATEGORIES_5 = ['Junior', 'A', 'B', 'C', 'D'] as const
export const AGE_LABELS: Record<string, string> = {
  Junior: 'Junior (-17)',
  A: 'A (18+)',
  B: 'B (40+)',
  C: 'C (60+)',
  D: 'D (70+)',
}

export const LEVELS = [
  'Newcomer',
  'Assoc Bronze',
  'Full Bronze',
  'Assoc Silver',
  'Full Silver',
  'Associate Gold',
  'Full Gold',
  'Advanced Gold',
] as const

// Section 1 (Closed/Open dance grid): a dance's day depends on BOTH its style
// and whether it's entered Closed or Open — the same dance can run on a
// different day in each category (e.g. Specialty dances are Saturday when
// Closed but Thursday when Open). Confirmed with Jordan directly. Day is
// derived from style+category, not stored per-dance, since it's uniform
// across every dance in a style.
export const DANCE_STYLES = ['American Style', 'International Style', 'Country Western', 'Specialty'] as const
export const DANCE_CATEGORIES = ['Closed', 'Open'] as const

export const DANCE_STYLE_DAY: Record<(typeof DANCE_STYLES)[number], Record<(typeof DANCE_CATEGORIES)[number], Day>> = {
  'American Style': { Closed: 'Saturday', Open: 'Friday' },
  'International Style': { Closed: 'Saturday', Open: 'Thursday' },
  'Country Western': { Closed: 'Friday', Open: 'Thursday' },
  Specialty: { Closed: 'Friday', Open: 'Thursday' },
}

export function danceDay(style: string, category: string): Day {
  const styleRow = DANCE_STYLE_DAY[style as (typeof DANCE_STYLES)[number]]
  return styleRow?.[category as (typeof DANCE_CATEGORIES)[number]] ?? 'Saturday'
}

// Sections 2-4 (DivisionEntry). Each event carries its own day — Scholarship
// is a mixed-day section (American Smooth/Rhythm = Friday, Int'l Style
// Ballroom/Latin = Thursday), same shape as Club below.
export const DIVISION_SECTIONS = {
  AllAround: {
    label: 'All Around Divisions',
    ages: AGE_CATEGORIES_5,
    events: [
      { name: 'Newcomer 2-Dance', day: 'Saturday' as Day },
      { name: 'Assoc Bronze 2-Dance', day: 'Saturday' as Day },
      { name: 'Full Bronze 4-Dance', day: 'Saturday' as Day },
      { name: 'Assoc Silver 4-Dance', day: 'Saturday' as Day },
      { name: 'Full Silver 4-Dance', day: 'Saturday' as Day },
      { name: 'Gold & Above 4-Dance', day: 'Saturday' as Day },
    ],
  },
  OpenBronze3Dance: {
    label: 'Open Bronze Three Dance Divisions',
    ages: ['A', 'B'] as const,
    events: [
      { name: 'Bronze Smooth', day: 'Friday' as Day },
      { name: 'Bronze Rhythm', day: 'Friday' as Day },
    ],
  },
  Scholarship: {
    label: 'Scholarship Divisions',
    ages: AGE_CATEGORIES_5,
    events: [
      { name: 'American Smooth', day: 'Friday' as Day },
      { name: "Int'l Style Ballroom", day: 'Thursday' as Day },
      { name: 'American Rhythm', day: 'Friday' as Day },
      { name: "Int'l Style Latin", day: 'Thursday' as Day },
    ],
  },
} as const

export type DivisionSectionKey = keyof typeof DIVISION_SECTIONS

export function divisionEventDay(section: DivisionSectionKey, eventName: string): Day | undefined {
  return (DIVISION_SECTIONS[section].events as readonly { name: string; day: Day }[]).find(
    e => e.name === eventName
  )?.day
}

export const COUPLE_EVENT_SECTIONS = {
  AmateurCouple: {
    label: 'Amateur Couple Events',
    sublabel: 'Student/Student couples only',
    partnerTypes: ['Student'] as const,
    events: [
      { name: 'Closed Bronze Smooth', day: 'Saturday' as Day },
      { name: 'Closed Bronze Rhythm', day: 'Saturday' as Day },
      { name: 'Closed Silver & Above Smooth', day: 'Saturday' as Day },
      { name: 'Closed Silver & Above Rhythm', day: 'Saturday' as Day },
      { name: 'Open Smooth 3-Dance', day: 'Friday' as Day },
      { name: 'Open Rhythm 3-Dance', day: 'Friday' as Day },
      { name: 'Open Smooth', day: 'Friday' as Day },
      { name: 'Open Rhythm', day: 'Friday' as Day },
    ],
  },
  Club: {
    label: 'Club 3-Dance Divisions',
    sublabel: 'One combined event for all ages and levels. Open to Pro/Am and Amateur couples.',
    partnerTypes: ['Instructor', 'Student'] as const,
    events: [
      { name: 'Country Western', day: 'Thursday' as Day },
      { name: 'Latin', day: 'Thursday' as Day },
      { name: 'Swing', day: 'Thursday' as Day },
      { name: 'Argentine Tango', day: 'Thursday' as Day },
    ],
  },
} as const

export type CoupleEventSectionKey = keyof typeof COUPLE_EVENT_SECTIONS

export function coupleEventDay(section: CoupleEventSectionKey, eventName: string): Day | undefined {
  return (COUPLE_EVENT_SECTIONS[section].events as readonly { name: string; day: Day }[]).find(
    e => e.name === eventName
  )?.day
}

export function formationSizeLabel(memberCount: number): string {
  if (memberCount <= 0) return 'Empty'
  if (memberCount <= 4) return 'Small (up to 4 couples)'
  if (memberCount <= 6) return 'Medium (5-6 couples)'
  return 'Large (7-8 couples)'
}
