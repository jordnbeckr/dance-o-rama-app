-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "day" TEXT NOT NULL DEFAULT 'Saturday',
    "order" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Dance" ("id", "name", "order", "style") SELECT "id", "name", "order", "style" FROM "Dance";
DROP TABLE "Dance";
ALTER TABLE "new_Dance" RENAME TO "Dance";
CREATE UNIQUE INDEX "Dance_name_key" ON "Dance"("name");
CREATE TABLE "new_Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "studioId" INTEGER NOT NULL,
    "paidThursday" BOOLEAN NOT NULL DEFAULT false,
    "paidFriday" BOOLEAN NOT NULL DEFAULT false,
    "paidSaturday" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Student_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("firstName", "id", "lastName", "studioId") SELECT "firstName", "id", "lastName", "studioId" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE INDEX "Student_studioId_idx" ON "Student"("studioId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
