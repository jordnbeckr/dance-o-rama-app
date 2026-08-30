import { PrismaLibSql } from '@prisma/adapter-libsql'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')
import * as crypto from 'crypto'
import * as path from 'path'

const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN
const resolvedUrl = tursoUrl ? tursoUrl.replace(/^libsql:\/\//, 'https://') : null
const adapter = new PrismaLibSql(
  resolvedUrl
    ? { url: resolvedUrl, authToken: tursoToken }
    : { url: 'file:' + path.resolve(__dirname, 'danceorama.db') }
)
const db = new PrismaClient({ adapter })

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function main() {
  console.log('Seeding...')

  // Studios (same network as the regular Summer Showcase)
  const studioData = [
    { name: 'Beverly Hills', slug: 'beverly-hills', password: 'bh2026' },
    { name: 'Glendale-Montrose', slug: 'glendale-montrose', password: 'gm2026' },
    { name: 'Santa Barbara', slug: 'santa-barbara', password: 'sb2026' },
    { name: 'Santa Monica', slug: 'santa-monica', password: 'sm2026' },
    { name: 'Sherman Oaks', slug: 'sherman-oaks', password: 'so2026' },
    { name: 'Thousand Oaks', slug: 'thousand-oaks', password: 'to2026' },
    { name: 'Valencia', slug: 'valencia', password: 'val2026' },
    { name: 'Ventura', slug: 'ventura', password: 'ven2026' },
    { name: 'West Covina', slug: 'west-covina', password: 'wc2026' },
    { name: 'Woodland Hills', slug: 'woodland-hills', password: 'wh2026' },
  ]

  for (const [i, s] of studioData.entries()) {
    await db.studio.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        name: s.name,
        slug: s.slug,
        passwordHash: hashPassword(s.password),
        order: i,
      },
    })
  }

  // Dances — from the Unique Dance-O-Rama entry form, Closed/Open grid.
  // A dance's day depends on style AND Closed/Open category (see
  // lib/divisions.ts danceDay()), so it isn't stored here — just style.
  const dances: { name: string; style: string }[] = [
    // American Style
    { name: 'Waltz', style: 'American Style' },
    { name: 'Tango', style: 'American Style' },
    { name: 'Foxtrot', style: 'American Style' },
    { name: 'Viennese Waltz (FB & Higher)', style: 'American Style' },
    { name: 'Cha Cha', style: 'American Style' },
    { name: 'Rumba', style: 'American Style' },
    { name: 'Swing', style: 'American Style' },
    { name: 'Bolero (FB & Higher)', style: 'American Style' },
    { name: 'Mambo', style: 'American Style' },
    { name: 'Hustle', style: 'American Style' },
    { name: 'Samba', style: 'American Style' },
    { name: 'Merengue', style: 'American Style' },
    // International Style
    { name: 'International Waltz', style: 'International Style' },
    { name: 'International Tango', style: 'International Style' },
    { name: 'International Viennese Waltz', style: 'International Style' },
    { name: 'International Foxtrot', style: 'International Style' },
    { name: 'Quickstep', style: 'International Style' },
    { name: 'International Cha Cha', style: 'International Style' },
    { name: 'International Rumba', style: 'International Style' },
    { name: 'International Samba', style: 'International Style' },
    { name: 'Paso Doble', style: 'International Style' },
    { name: 'Jive', style: 'International Style' },
    // Country Western
    { name: 'C/W Two Step', style: 'Country Western' },
    { name: 'C/W Swing', style: 'Country Western' },
    { name: 'C/W Cha Cha', style: 'Country Western' },
    { name: 'C/W Three Step', style: 'Country Western' },
    { name: 'C/W Shuffle', style: 'Country Western' },
    { name: 'C/W Waltz', style: 'Country Western' },
    // Specialty Dances
    { name: 'Argentine Tango', style: 'Specialty' },
    { name: 'Milonga', style: 'Specialty' },
    { name: 'Tango Vals', style: 'Specialty' },
    { name: 'Peabody', style: 'Specialty' },
    { name: 'Polka', style: 'Specialty' },
    { name: 'West Coast Swing', style: 'Specialty' },
    { name: 'Lindy Hop', style: 'Specialty' },
    { name: 'Salsa', style: 'Specialty' },
    { name: 'Bachata', style: 'Specialty' },
    { name: 'Night Club Two Step', style: 'Specialty' },
  ]

  for (const [i, d] of dances.entries()) {
    await db.dance.upsert({
      where: { name: d.name },
      update: { style: d.style, order: i },
      create: { name: d.name, style: d.style, order: i },
    })
  }

  // Instructors (same roster as the regular showcase)
  const instructors: { name: string; studio: string }[] = [
    { name: 'Jackie Buckmaster', studio: 'Beverly Hills' },
    { name: 'Chad Garrett', studio: 'Beverly Hills' },
    { name: 'Cecilia Hulett', studio: 'Beverly Hills' },
    { name: 'Scott Lopez', studio: 'Beverly Hills' },
    { name: 'Isaac Barahona', studio: 'Glendale-Montrose' },
    { name: 'Fernando Cortez', studio: 'Glendale-Montrose' },
    { name: 'Amaia Shah', studio: 'Glendale-Montrose' },
    { name: 'Katie Pia', studio: 'Glendale-Montrose' },
    { name: 'Sophie Gottler', studio: 'Glendale-Montrose' },
    { name: 'Allison Felix', studio: 'Santa Barbara' },
    { name: 'Eva Luo', studio: 'Santa Barbara' },
    { name: 'Drew Miller', studio: 'Santa Barbara' },
    { name: 'Grace Schuck', studio: 'Santa Barbara' },
    { name: 'Dibella Caminsky', studio: 'Santa Monica' },
    { name: 'Joel Rieck', studio: 'Santa Monica' },
    { name: 'Ty Kramer-Watson', studio: 'Santa Monica' },
    { name: 'Martin Barthold', studio: 'Sherman Oaks' },
    { name: 'Jordan Becker', studio: 'Sherman Oaks' },
    { name: 'Dani Bommer', studio: 'Sherman Oaks' },
    { name: 'Kat Dieguez', studio: 'Sherman Oaks' },
    { name: 'Cass Godinez', studio: 'Sherman Oaks' },
    { name: 'Vendela Lloyd', studio: 'Sherman Oaks' },
    { name: 'Tommy Shadi', studio: 'Sherman Oaks' },
    { name: 'Anthony Tatoosi', studio: 'Sherman Oaks' },
    { name: 'Edwin Cabrera', studio: 'Thousand Oaks' },
  ]

  for (const inst of instructors) {
    const studio = await db.studio.findUnique({ where: { name: inst.studio } })
    if (!studio) continue
    const existing = await db.instructor.findFirst({
      where: { name: inst.name, studioId: studio.id },
    })
    if (!existing) {
      await db.instructor.create({ data: { name: inst.name, studioId: studio.id } })
    }
  }

  // A handful of Sherman Oaks students for testing the flow end to end.
  // Paid days are deliberately varied so the day-restriction logic is
  // actually exercised: Eva has all three days paid (the "everything works"
  // case), Nancy has only Saturday paid (the "blocked from Thu/Fri" case),
  // and the rest are unpaid for every day (the default/most-common state).
  const shermanOaks = await db.studio.findUnique({ where: { slug: 'sherman-oaks' } })
  if (shermanOaks) {
    const students = [
      { firstName: 'Nancy', lastName: 'Riegling', paidThursday: false, paidFriday: false, paidSaturday: true },
      { firstName: 'Eva', lastName: 'McCormick', paidThursday: true, paidFriday: true, paidSaturday: true },
      { firstName: 'Shelby', lastName: 'Fogelman', paidThursday: false, paidFriday: false, paidSaturday: false },
      { firstName: 'Richard', lastName: 'Roe', paidThursday: false, paidFriday: false, paidSaturday: false },
      { firstName: 'David', lastName: 'Romm', paidThursday: false, paidFriday: false, paidSaturday: false },
    ]
    for (const s of students) {
      const { firstName, lastName, ...paidDays } = s
      const existing = await db.student.findFirst({
        where: { firstName, lastName, studioId: shermanOaks.id },
      })
      if (existing) {
        await db.student.update({ where: { id: existing.id }, data: paidDays })
      } else {
        await db.student.create({ data: { firstName, lastName, studioId: shermanOaks.id, ...paidDays } })
      }
    }
  }

  // Settings — default deadline is 3 weeks out; admin can move it any time.
  const defaultDeadline = new Date()
  defaultDeadline.setDate(defaultDeadline.getDate() + 21)
  await db.danceORamaSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, entryDeadline: defaultDeadline, deadlineOverride: false },
  })

  console.log('Seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
