'use client'

import { useState } from 'react'
import AgeLevelPicker from './AgeLevelPicker'
import DivisionForm from './DivisionForm'
import CoupleEventCards from './CoupleEventCards'
import DanceGrid from './DanceGrid'
import SoloCard from './SoloCard'
import FormationCard from './FormationCard'
import { SOLO_DAY, FORMATION_DAY, studentHasPaidFor } from '@/lib/divisions'

type Dance = { id: number; name: string; style: string }
type DanceEntryT = { id: number; danceId: number; category: string; ageCategory: string; level: string }
type DivisionEntryT = { id: number; section: string; ageCategory: string; eventName: string }
type StudentPaid = { firstName: string; paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }
type SoloEntryT = { entryType: string; routineName: string; danceName: string | null; instructorId: number | null }
type FormationTeamT = { id: number; danceName: string; members: { id: number; studentId: number }[] }
type CoupleEntryT = {
  id: number
  section: 'AmateurCouple' | 'Club'
  eventName: string
  partnerType: 'Instructor' | 'Student'
  partnerId: number | null
  partnerLabel: string
}

export default function PairingWorkspace({
  slug,
  partnershipId,
  studentId,
  instructorId,
  dances,
  danceEntries,
  divisionEntries,
  student,
  soloEntry,
  formationTeams,
  coupleEntries,
}: {
  slug: string
  partnershipId: number
  studentId: number
  instructorId: number
  dances: Dance[]
  danceEntries: DanceEntryT[]
  divisionEntries: DivisionEntryT[]
  student: StudentPaid
  soloEntry: SoloEntryT | null
  formationTeams: FormationTeamT[]
  coupleEntries: CoupleEntryT[]
}) {
  const [selectedAges, setSelectedAges] = useState<string[]>(() =>
    Array.from(new Set(danceEntries.map(e => e.ageCategory)))
  )
  const [selectedLevels, setSelectedLevels] = useState<string[]>(() =>
    Array.from(new Set(danceEntries.map(e => e.level)))
  )

  function toggleAge(age: string) {
    setSelectedAges(prev => (prev.includes(age) ? prev.filter(a => a !== age) : [...prev, age]))
  }
  function toggleLevel(level: string) {
    setSelectedLevels(prev => (prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]))
  }

  return (
    <div className="space-y-5">
      <AgeLevelPicker
        selectedAges={selectedAges}
        selectedLevels={selectedLevels}
        onToggleAge={toggleAge}
        onToggleLevel={toggleLevel}
      />

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <DivisionForm slug={slug} partnershipId={partnershipId} entries={divisionEntries} student={student} />
        <CoupleEventCards
          slug={slug}
          studentId={studentId}
          instructorId={instructorId}
          student={student}
          entries={coupleEntries}
        />
      </div>

      <DanceGrid
        slug={slug}
        partnershipId={partnershipId}
        dances={dances}
        entries={danceEntries}
        student={student}
        selectedAges={selectedAges}
        selectedLevels={selectedLevels}
      />

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <SoloCard
          slug={slug}
          studentId={studentId}
          firstName={student.firstName}
          defaultInstructorId={instructorId}
          soloEntry={soloEntry}
          paidThursday={studentHasPaidFor(student, SOLO_DAY)}
        />
        <FormationCard
          slug={slug}
          studentId={studentId}
          instructorId={instructorId}
          firstName={student.firstName}
          teams={formationTeams}
          paidSaturday={studentHasPaidFor(student, FORMATION_DAY)}
        />
      </div>
    </div>
  )
}
