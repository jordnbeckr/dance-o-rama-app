/*
  Warnings:

  - Added the required column `name` to the `FormationTeam` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FormationTeam" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studioId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "danceName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormationTeam_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FormationTeam" ("createdAt", "danceName", "id", "studioId", "name") SELECT "createdAt", "danceName", "id", "studioId", "danceName" FROM "FormationTeam";
DROP TABLE "FormationTeam";
ALTER TABLE "new_FormationTeam" RENAME TO "FormationTeam";
CREATE UNIQUE INDEX "FormationTeam_studioId_name_key" ON "FormationTeam"("studioId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
