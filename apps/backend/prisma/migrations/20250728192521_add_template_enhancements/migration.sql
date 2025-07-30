-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TaskTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "title" TEXT NOT NULL,
    "defaultPriority" TEXT NOT NULL DEFAULT 'medium',
    "defaultStatus" TEXT NOT NULL DEFAULT 'todo',
    "estimatedHours" REAL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringPattern" TEXT,
    "tags" TEXT,
    "category" TEXT,
    "variables" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TaskTemplate" ("createdAt", "defaultPriority", "defaultStatus", "description", "estimatedHours", "id", "isRecurring", "name", "recurringPattern", "tags", "title", "updatedAt") SELECT "createdAt", "defaultPriority", "defaultStatus", "description", "estimatedHours", "id", "isRecurring", "name", "recurringPattern", "tags", "title", "updatedAt" FROM "TaskTemplate";
DROP TABLE "TaskTemplate";
ALTER TABLE "new_TaskTemplate" RENAME TO "TaskTemplate";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
