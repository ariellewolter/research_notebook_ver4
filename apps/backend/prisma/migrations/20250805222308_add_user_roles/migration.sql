/*
  Warnings:

  - You are about to drop the column `equipment` on the `Protocol` table. All the data in the column will be lost.
  - You are about to drop the column `reagents` on the `Protocol` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Chemical" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "stockLevel" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "location" TEXT,
    "vendorInfo" TEXT,
    "tags" TEXT,
    "metadata" TEXT,
    "catalogNumber" TEXT,
    "molecularWeight" REAL,
    "purity" TEXT,
    "concentration" TEXT,
    "storage" TEXT,
    "expiryDate" DATETIME,
    "minStockLevel" REAL,
    "cost" REAL,
    "supplier" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Gene" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "stockLevel" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "location" TEXT,
    "vendorInfo" TEXT,
    "tags" TEXT,
    "metadata" TEXT,
    "sequence" TEXT,
    "organism" TEXT,
    "accessionNumber" TEXT,
    "vector" TEXT,
    "resistance" TEXT,
    "promoter" TEXT,
    "terminator" TEXT,
    "insertSize" INTEGER,
    "concentration" TEXT,
    "storage" TEXT,
    "expiryDate" DATETIME,
    "minStockLevel" REAL,
    "cost" REAL,
    "supplier" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Reagent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "stockLevel" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "location" TEXT,
    "vendorInfo" TEXT,
    "tags" TEXT,
    "metadata" TEXT,
    "catalogNumber" TEXT,
    "lotNumber" TEXT,
    "concentration" TEXT,
    "specificity" TEXT,
    "hostSpecies" TEXT,
    "isotype" TEXT,
    "conjugate" TEXT,
    "storage" TEXT,
    "expiryDate" DATETIME,
    "minStockLevel" REAL,
    "cost" REAL,
    "supplier" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "stockLevel" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'piece',
    "location" TEXT,
    "vendorInfo" TEXT,
    "tags" TEXT,
    "metadata" TEXT,
    "modelNumber" TEXT,
    "serialNumber" TEXT,
    "manufacturer" TEXT,
    "purchaseDate" DATETIME,
    "warrantyExpiry" DATETIME,
    "maintenanceDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'available',
    "specifications" TEXT,
    "calibrationDate" DATETIME,
    "nextCalibration" DATETIME,
    "cost" REAL,
    "supplier" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "experimentId" TEXT,
    "taskId" TEXT,
    "protocolId" TEXT,
    "notes" TEXT,
    "usedBy" TEXT,
    "purpose" TEXT,
    "batchNumber" TEXT,
    "lotNumber" TEXT,
    "cost" REAL,
    "wasteGenerated" REAL,
    "wasteUnit" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UsageLog_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Chemical" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UsageLog_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Gene" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UsageLog_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Reagent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UsageLog_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UsageLog_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "UsageLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "UsageLog_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FreeformDrawingBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "strokes" TEXT NOT NULL,
    "svgPath" TEXT NOT NULL,
    "pngThumbnail" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 600,
    "height" INTEGER NOT NULL DEFAULT 400,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FreeformDrawingBlock_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Note" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FreeformDrawingBlock_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FreeformDrawingBlock_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Protocol" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FreeformDrawingBlock_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FreeformDrawingBlock_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "DatabaseEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ReagentNotes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ReagentNotes_A_fkey" FOREIGN KEY ("A") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ReagentNotes_B_fkey" FOREIGN KEY ("B") REFERENCES "Reagent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ReagentProtocols" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ReagentProtocols_A_fkey" FOREIGN KEY ("A") REFERENCES "Protocol" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ReagentProtocols_B_fkey" FOREIGN KEY ("B") REFERENCES "Reagent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ChemicalNotes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ChemicalNotes_A_fkey" FOREIGN KEY ("A") REFERENCES "Chemical" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ChemicalNotes_B_fkey" FOREIGN KEY ("B") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ChemicalProtocols" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ChemicalProtocols_A_fkey" FOREIGN KEY ("A") REFERENCES "Chemical" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ChemicalProtocols_B_fkey" FOREIGN KEY ("B") REFERENCES "Protocol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ChemicalTasks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ChemicalTasks_A_fkey" FOREIGN KEY ("A") REFERENCES "Chemical" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ChemicalTasks_B_fkey" FOREIGN KEY ("B") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_GeneNotes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_GeneNotes_A_fkey" FOREIGN KEY ("A") REFERENCES "Gene" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_GeneNotes_B_fkey" FOREIGN KEY ("B") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_GeneProtocols" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_GeneProtocols_A_fkey" FOREIGN KEY ("A") REFERENCES "Gene" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_GeneProtocols_B_fkey" FOREIGN KEY ("B") REFERENCES "Protocol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_GeneTasks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_GeneTasks_A_fkey" FOREIGN KEY ("A") REFERENCES "Gene" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_GeneTasks_B_fkey" FOREIGN KEY ("B") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ReagentTasks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ReagentTasks_A_fkey" FOREIGN KEY ("A") REFERENCES "Reagent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ReagentTasks_B_fkey" FOREIGN KEY ("B") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_EquipmentNotes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EquipmentNotes_A_fkey" FOREIGN KEY ("A") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EquipmentNotes_B_fkey" FOREIGN KEY ("B") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_EquipmentProtocols" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EquipmentProtocols_A_fkey" FOREIGN KEY ("A") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EquipmentProtocols_B_fkey" FOREIGN KEY ("B") REFERENCES "Protocol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_EquipmentTasks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EquipmentTasks_A_fkey" FOREIGN KEY ("A") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EquipmentTasks_B_fkey" FOREIGN KEY ("B") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Protocol" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "steps" TEXT NOT NULL,
    "safetyNotes" TEXT,
    "expectedDuration" TEXT,
    "difficulty" TEXT,
    "successRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Protocol" ("category", "createdAt", "description", "difficulty", "expectedDuration", "id", "name", "safetyNotes", "steps", "successRate", "updatedAt", "version") SELECT "category", "createdAt", "description", "difficulty", "expectedDuration", "id", "name", "safetyNotes", "steps", "successRate", "updatedAt", "version" FROM "Protocol";
DROP TABLE "Protocol";
ALTER TABLE "new_Protocol" RENAME TO "Protocol";
CREATE INDEX "Protocol_category_idx" ON "Protocol"("category");
CREATE INDEX "Protocol_updatedAt_idx" ON "Protocol"("updatedAt");
CREATE INDEX "Protocol_createdAt_idx" ON "Protocol"("createdAt");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "googleClientId" TEXT,
    "googleClientSecret" TEXT,
    "googleTokens" TEXT,
    "outlookClientId" TEXT,
    "outlookClientSecret" TEXT,
    "outlookTokens" TEXT
);
INSERT INTO "new_User" ("createdAt", "email", "googleClientId", "googleClientSecret", "googleTokens", "id", "outlookClientId", "outlookClientSecret", "outlookTokens", "password", "username") SELECT "createdAt", "email", "googleClientId", "googleClientSecret", "googleTokens", "id", "outlookClientId", "outlookClientSecret", "outlookTokens", "password", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Chemical_name_idx" ON "Chemical"("name");

-- CreateIndex
CREATE INDEX "Chemical_type_idx" ON "Chemical"("type");

-- CreateIndex
CREATE INDEX "Chemical_location_idx" ON "Chemical"("location");

-- CreateIndex
CREATE INDEX "Chemical_stockLevel_idx" ON "Chemical"("stockLevel");

-- CreateIndex
CREATE INDEX "Chemical_expiryDate_idx" ON "Chemical"("expiryDate");

-- CreateIndex
CREATE INDEX "Gene_name_idx" ON "Gene"("name");

-- CreateIndex
CREATE INDEX "Gene_type_idx" ON "Gene"("type");

-- CreateIndex
CREATE INDEX "Gene_organism_idx" ON "Gene"("organism");

-- CreateIndex
CREATE INDEX "Gene_location_idx" ON "Gene"("location");

-- CreateIndex
CREATE INDEX "Gene_stockLevel_idx" ON "Gene"("stockLevel");

-- CreateIndex
CREATE INDEX "Gene_expiryDate_idx" ON "Gene"("expiryDate");

-- CreateIndex
CREATE INDEX "Reagent_name_idx" ON "Reagent"("name");

-- CreateIndex
CREATE INDEX "Reagent_type_idx" ON "Reagent"("type");

-- CreateIndex
CREATE INDEX "Reagent_location_idx" ON "Reagent"("location");

-- CreateIndex
CREATE INDEX "Reagent_stockLevel_idx" ON "Reagent"("stockLevel");

-- CreateIndex
CREATE INDEX "Reagent_expiryDate_idx" ON "Reagent"("expiryDate");

-- CreateIndex
CREATE INDEX "Equipment_name_idx" ON "Equipment"("name");

-- CreateIndex
CREATE INDEX "Equipment_type_idx" ON "Equipment"("type");

-- CreateIndex
CREATE INDEX "Equipment_location_idx" ON "Equipment"("location");

-- CreateIndex
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");

-- CreateIndex
CREATE INDEX "Equipment_maintenanceDate_idx" ON "Equipment"("maintenanceDate");

-- CreateIndex
CREATE INDEX "UsageLog_entityType_idx" ON "UsageLog"("entityType");

-- CreateIndex
CREATE INDEX "UsageLog_entityId_idx" ON "UsageLog"("entityId");

-- CreateIndex
CREATE INDEX "UsageLog_date_idx" ON "UsageLog"("date");

-- CreateIndex
CREATE INDEX "UsageLog_experimentId_idx" ON "UsageLog"("experimentId");

-- CreateIndex
CREATE INDEX "UsageLog_taskId_idx" ON "UsageLog"("taskId");

-- CreateIndex
CREATE INDEX "UsageLog_protocolId_idx" ON "UsageLog"("protocolId");

-- CreateIndex
CREATE UNIQUE INDEX "FreeformDrawingBlock_blockId_key" ON "FreeformDrawingBlock"("blockId");

-- CreateIndex
CREATE INDEX "FreeformDrawingBlock_entityId_entityType_idx" ON "FreeformDrawingBlock"("entityId", "entityType");

-- CreateIndex
CREATE INDEX "FreeformDrawingBlock_entityType_idx" ON "FreeformDrawingBlock"("entityType");

-- CreateIndex
CREATE INDEX "FreeformDrawingBlock_createdAt_idx" ON "FreeformDrawingBlock"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_ReagentNotes_AB_unique" ON "_ReagentNotes"("A", "B");

-- CreateIndex
CREATE INDEX "_ReagentNotes_B_index" ON "_ReagentNotes"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ReagentProtocols_AB_unique" ON "_ReagentProtocols"("A", "B");

-- CreateIndex
CREATE INDEX "_ReagentProtocols_B_index" ON "_ReagentProtocols"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ChemicalNotes_AB_unique" ON "_ChemicalNotes"("A", "B");

-- CreateIndex
CREATE INDEX "_ChemicalNotes_B_index" ON "_ChemicalNotes"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ChemicalProtocols_AB_unique" ON "_ChemicalProtocols"("A", "B");

-- CreateIndex
CREATE INDEX "_ChemicalProtocols_B_index" ON "_ChemicalProtocols"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ChemicalTasks_AB_unique" ON "_ChemicalTasks"("A", "B");

-- CreateIndex
CREATE INDEX "_ChemicalTasks_B_index" ON "_ChemicalTasks"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_GeneNotes_AB_unique" ON "_GeneNotes"("A", "B");

-- CreateIndex
CREATE INDEX "_GeneNotes_B_index" ON "_GeneNotes"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_GeneProtocols_AB_unique" ON "_GeneProtocols"("A", "B");

-- CreateIndex
CREATE INDEX "_GeneProtocols_B_index" ON "_GeneProtocols"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_GeneTasks_AB_unique" ON "_GeneTasks"("A", "B");

-- CreateIndex
CREATE INDEX "_GeneTasks_B_index" ON "_GeneTasks"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ReagentTasks_AB_unique" ON "_ReagentTasks"("A", "B");

-- CreateIndex
CREATE INDEX "_ReagentTasks_B_index" ON "_ReagentTasks"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EquipmentNotes_AB_unique" ON "_EquipmentNotes"("A", "B");

-- CreateIndex
CREATE INDEX "_EquipmentNotes_B_index" ON "_EquipmentNotes"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EquipmentProtocols_AB_unique" ON "_EquipmentProtocols"("A", "B");

-- CreateIndex
CREATE INDEX "_EquipmentProtocols_B_index" ON "_EquipmentProtocols"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EquipmentTasks_AB_unique" ON "_EquipmentTasks"("A", "B");

-- CreateIndex
CREATE INDEX "_EquipmentTasks_B_index" ON "_EquipmentTasks"("B");
