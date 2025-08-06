/*
  Warnings:

  - You are about to drop the column `equipment` on the `DatabaseEntry` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DatabaseEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "properties" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "catalogNumber" TEXT,
    "concentration" TEXT,
    "duration" TEXT,
    "function" TEXT,
    "molecularWeight" REAL,
    "organism" TEXT,
    "pH" TEXT,
    "protocol" TEXT,
    "purity" TEXT,
    "sequence" TEXT,
    "storage" TEXT,
    "supplier" TEXT,
    "temperature" TEXT,
    "metadata" TEXT,
    "relatedResearch" TEXT
);
INSERT INTO "new_DatabaseEntry" ("catalogNumber", "concentration", "createdAt", "description", "duration", "function", "id", "metadata", "molecularWeight", "name", "organism", "pH", "properties", "protocol", "purity", "relatedResearch", "sequence", "storage", "supplier", "temperature", "type") SELECT "catalogNumber", "concentration", "createdAt", "description", "duration", "function", "id", "metadata", "molecularWeight", "name", "organism", "pH", "properties", "protocol", "purity", "relatedResearch", "sequence", "storage", "supplier", "temperature", "type" FROM "DatabaseEntry";
DROP TABLE "DatabaseEntry";
ALTER TABLE "new_DatabaseEntry" RENAME TO "DatabaseEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
