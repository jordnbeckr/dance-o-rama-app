-- CreateTable
CREATE TABLE "Studio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Instructor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "studioId" INTEGER NOT NULL,
    CONSTRAINT "Instructor_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "studioId" INTEGER NOT NULL,
    CONSTRAINT "Student_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Partnership" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studioId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "awardPlaque" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Partnership_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Partnership_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Partnership_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DanceEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partnershipId" INTEGER NOT NULL,
    "danceId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "ageCategory" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DanceEntry_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DanceEntry_danceId_fkey" FOREIGN KEY ("danceId") REFERENCES "Dance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DivisionEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partnershipId" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "ageCategory" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DivisionEntry_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoupleEventEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studioId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "partnerType" TEXT NOT NULL,
    "partnerInstructorId" INTEGER,
    "partnerStudentId" INTEGER,
    "partnerKey" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoupleEventEntry_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoupleEventEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoupleEventEntry_partnerInstructorId_fkey" FOREIGN KEY ("partnerInstructorId") REFERENCES "Instructor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoupleEventEntry_partnerStudentId_fkey" FOREIGN KEY ("partnerStudentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SoloEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studioId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "instructorId" INTEGER,
    "entryType" TEXT NOT NULL,
    "danceName" TEXT,
    "routineName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SoloEntry_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SoloEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SoloEntry_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormationTeam" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studioId" INTEGER NOT NULL,
    "danceName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormationTeam_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormationMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "instructorId" INTEGER,
    CONSTRAINT "FormationMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "FormationTeam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FormationMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FormationMember_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DanceORamaSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "entryDeadline" DATETIME NOT NULL,
    "deadlineOverride" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "Studio_name_key" ON "Studio"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Studio_slug_key" ON "Studio"("slug");

-- CreateIndex
CREATE INDEX "Instructor_studioId_idx" ON "Instructor"("studioId");

-- CreateIndex
CREATE INDEX "Student_studioId_idx" ON "Student"("studioId");

-- CreateIndex
CREATE UNIQUE INDEX "Dance_name_key" ON "Dance"("name");

-- CreateIndex
CREATE INDEX "Partnership_studioId_idx" ON "Partnership"("studioId");

-- CreateIndex
CREATE UNIQUE INDEX "Partnership_studentId_instructorId_key" ON "Partnership"("studentId", "instructorId");

-- CreateIndex
CREATE INDEX "DanceEntry_partnershipId_idx" ON "DanceEntry"("partnershipId");

-- CreateIndex
CREATE UNIQUE INDEX "DanceEntry_partnershipId_danceId_category_ageCategory_level_key" ON "DanceEntry"("partnershipId", "danceId", "category", "ageCategory", "level");

-- CreateIndex
CREATE INDEX "DivisionEntry_partnershipId_idx" ON "DivisionEntry"("partnershipId");

-- CreateIndex
CREATE UNIQUE INDEX "DivisionEntry_partnershipId_section_ageCategory_eventName_key" ON "DivisionEntry"("partnershipId", "section", "ageCategory", "eventName");

-- CreateIndex
CREATE INDEX "CoupleEventEntry_studioId_idx" ON "CoupleEventEntry"("studioId");

-- CreateIndex
CREATE UNIQUE INDEX "CoupleEventEntry_studentId_section_eventName_partnerKey_key" ON "CoupleEventEntry"("studentId", "section", "eventName", "partnerKey");

-- CreateIndex
CREATE UNIQUE INDEX "SoloEntry_studentId_key" ON "SoloEntry"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "FormationTeam_studioId_danceName_key" ON "FormationTeam"("studioId", "danceName");

-- CreateIndex
CREATE UNIQUE INDEX "FormationMember_teamId_studentId_key" ON "FormationMember"("teamId", "studentId");
