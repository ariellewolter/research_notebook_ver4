/*
  Warnings:

  - Added the required column `updatedAt` to the `TaskNotification` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TaskNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "sentAt" DATETIME,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "deliveryMethod" TEXT NOT NULL DEFAULT 'in_app',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaskNotification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TaskNotification" ("createdAt", "id", "isRead", "message", "scheduledFor", "sentAt", "taskId", "type") SELECT "createdAt", "id", "isRead", "message", "scheduledFor", "sentAt", "taskId", "type" FROM "TaskNotification";
DROP TABLE "TaskNotification";
ALTER TABLE "new_TaskNotification" RENAME TO "TaskNotification";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
