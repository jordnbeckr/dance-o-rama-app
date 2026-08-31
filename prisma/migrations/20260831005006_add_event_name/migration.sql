-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DanceORamaSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "entryDeadline" DATETIME NOT NULL,
    "deadlineOverride" BOOLEAN NOT NULL DEFAULT false,
    "eventName" TEXT NOT NULL DEFAULT 'Dance-O-Rama'
);
INSERT INTO "new_DanceORamaSettings" ("deadlineOverride", "entryDeadline", "id") SELECT "deadlineOverride", "entryDeadline", "id" FROM "DanceORamaSettings";
DROP TABLE "DanceORamaSettings";
ALTER TABLE "new_DanceORamaSettings" RENAME TO "DanceORamaSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
