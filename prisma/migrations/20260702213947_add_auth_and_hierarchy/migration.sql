-- AlterTable
ALTER TABLE "User" ADD COLUMN "githubToken" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Classification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "versionPrefix" TEXT,
    CONSTRAINT "Classification_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Classification" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Classification" ("color", "description", "id", "isActive", "name", "sortOrder") SELECT "color", "description", "id", "isActive", "name", "sortOrder" FROM "Classification";
DROP TABLE "Classification";
ALTER TABLE "new_Classification" RENAME TO "Classification";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
