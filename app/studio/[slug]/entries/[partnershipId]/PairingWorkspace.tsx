'use client'

import { useState } from 'react'
import AgeLevelPicker from './AgeLevelPicker'
import DivisionForm from './DivisionForm'
import CoupleEventCards from './CoupleEventCards'
import DanceGrid from './DanceGrid'
import SoloCard from './SoloCard'
import FormationCard from './FormationCard'
import SignaturePad from './SignaturePad'
import { SOLO_DAY, FORMATION_DAY, studentHasPaidFor } from '@/lib/divisions'

type Dance = { id: number; name: string; style: string }
type DanceEntryT = { id: number; danceId: number; category: string; ageCategory: string; level: string }
type DivisionEntryT = { id: number; section: string; ageCategory: string; eventName: string }
type StudentPaid = { firstName: string; paidThursday: boolean; paidFriday: boolean; paidSaturday: boolean }
type SoloEntryT = { entryType: string; routineName: string; danceName: string | null; instructorId: number | null }
type FormationTeamT = { id: number; name: string; danceName: string; members: { id: number; studentId: number }[] }
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
  signatureData,
  signedAt,
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
  signatureData: string | null
  signedAt: string | null
}) {
  const [pendingCombo, setPendingCombo] = useState<{ ageCategory: string; level: string } | null>(null)

  return (
    <div className="space-y-5">
      <AgeLevelPicker onAddSheet={setPendingCombo} />

      <div className="space-y-4">
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
        pendingCombo={pendingCombo}
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

      <SignaturePad
        slug={slug}
        partnershipId={partnershipId}
        studentName={student.firstName}
        signatureData={signatureData}
        signedAt={signedAt}
      />
    </div>
  )
}
