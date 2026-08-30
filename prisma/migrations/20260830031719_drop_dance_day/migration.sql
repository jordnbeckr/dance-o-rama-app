-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Dance" ("id", "name", "style", "order") SELECT "id", "name", "style", "order" FROM "Dance";
DROP TABLE "Dance";
ALTER TABLE "new_Dance" RENAME TO "Dance";
CREATE UNIQUE INDEX "Dance_name_key" ON "Dance"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
