// One-time (and re-runnable) helper: applies every prisma/migrations/*/migration.sql
// file, in order, directly to a Turso database via its HTTP pipeline API.
// Needed because Prisma's `migrate deploy` engine doesn't accept libsql:// URLs
// for the sqlite provider — only the Prisma Client driver adapter does, at runtime.
//
// Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/push-schema-to-turso.mjs

import { readdirSync, readFileSync } from 'fs'
import path from 'path'

const tursoUrl = process.env.TURSO_DATABASE_URL
const token = process.env.TURSO_AUTH_TOKEN
if (!tursoUrl || !token) {
  console.error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN')
  process.exit(1)
}

const httpUrl = tursoUrl.replace(/^libsql:\/\//, 'https://') + '/v2/pipeline'

const migrationsDir = path.resolve(import.meta.dirname, '..', 'prisma', 'migrations')
const dirs = readdirSync(migrationsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort()

const statements = []
for (const dir of dirs) {
  const sqlPath = path.join(migrationsDir, dir, 'migration.sql')
  const sql = readFileSync(sqlPath, 'utf8')
  const stmts = sql
    .split(/;\s*\n/)
    .map(chunk =>
      chunk
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter(s => s.length > 0)
  console.log(`${dir}: ${stmts.length} statement(s)`)
  statements.push(...stmts)
}

const requests = [
  ...statements.map(sql => ({ type: 'execute', stmt: { sql } })),
  { type: 'close' },
]

const res = await fetch(httpUrl, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ requests }),
})

const body = await res.json()
if (!res.ok) {
  console.error('Turso pipeline request failed:', res.status, JSON.stringify(body, null, 2))
  process.exit(1)
}

const errors = (body.results ?? [])
  .map((r, i) => ({ i, r }))
  .filter(({ r }) => r.type === 'error')
if (errors.length > 0) {
  console.error('Some statements failed:')
  for (const { i, r } of errors) {
    console.error(`  [${i}] ${statements[i]?.slice(0, 80)}...`)
    console.error(`      ${r.error?.message}`)
  }
  process.exit(1)
}

console.log(`Applied ${statements.length} statements successfully.`)
