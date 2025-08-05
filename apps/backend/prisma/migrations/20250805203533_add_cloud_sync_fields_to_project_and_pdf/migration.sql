-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PDF" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filePath" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cloudSynced" BOOLEAN NOT NULL DEFAULT false,
    "cloudPath" TEXT,
    "cloudService" TEXT,
    "lastSynced" DATETIME,
    "syncStatus" TEXT
);
INSERT INTO "new_PDF" ("filePath", "id", "title", "uploadedAt") SELECT "filePath", "id", "title", "uploadedAt" FROM "PDF";
DROP TABLE "PDF";
ALTER TABLE "new_PDF" RENAME TO "PDF";
CREATE INDEX "PDF_cloudSynced_idx" ON "PDF"("cloudSynced");
CREATE INDEX "PDF_cloudService_idx" ON "PDF"("cloudService");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" DATETIME,
    "lastActivity" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "cloudSynced" BOOLEAN NOT NULL DEFAULT false,
    "cloudPath" TEXT,
    "cloudService" TEXT,
    "lastSynced" DATETIME,
    "syncStatus" TEXT,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("createdAt", "description", "id", "lastActivity", "name", "startDate", "status", "userId") SELECT "createdAt", "description", "id", "lastActivity", "name", "startDate", "status", "userId" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_cloudSynced_idx" ON "Project"("cloudSynced");
CREATE INDEX "Project_cloudService_idx" ON "Project"("cloudService");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
