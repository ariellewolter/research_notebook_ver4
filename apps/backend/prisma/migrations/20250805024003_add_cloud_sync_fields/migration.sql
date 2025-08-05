-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "experimentId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" DATETIME,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cloudSynced" BOOLEAN NOT NULL DEFAULT false,
    "cloudPath" TEXT,
    "cloudService" TEXT,
    "lastSynced" DATETIME,
    "syncStatus" TEXT,
    CONSTRAINT "Note_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Note" ("content", "createdAt", "date", "experimentId", "id", "title", "type") SELECT "content", "createdAt", "date", "experimentId", "id", "title", "type" FROM "Note";
DROP TABLE "Note";
ALTER TABLE "new_Note" RENAME TO "Note";
CREATE INDEX "Note_type_idx" ON "Note"("type");
CREATE INDEX "Note_date_idx" ON "Note"("date");
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");
CREATE INDEX "Note_experimentId_idx" ON "Note"("experimentId");
CREATE INDEX "Note_cloudSynced_idx" ON "Note"("cloudSynced");
CREATE INDEX "Note_cloudService_idx" ON "Note"("cloudService");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
