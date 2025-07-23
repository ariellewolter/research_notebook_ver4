-- AlterTable
ALTER TABLE "DatabaseEntry" ADD COLUMN "metadata" TEXT;
ALTER TABLE "DatabaseEntry" ADD COLUMN "relatedResearch" TEXT;

-- CreateTable
CREATE TABLE "LiteratureNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "authors" TEXT,
    "year" TEXT,
    "journal" TEXT,
    "doi" TEXT,
    "abstract" TEXT,
    "tags" TEXT,
    "citation" TEXT,
    "synonyms" TEXT,
    "userNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start" DATETIME NOT NULL,
    "end" DATETIME,
    "allDay" BOOLEAN DEFAULT false,
    "relatedId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT
);

-- CreateTable
CREATE TABLE "_EntryLitNotes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EntryLitNotes_A_fkey" FOREIGN KEY ("A") REFERENCES "DatabaseEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EntryLitNotes_B_fkey" FOREIGN KEY ("B") REFERENCES "LiteratureNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_EntryLitNotes_AB_unique" ON "_EntryLitNotes"("A", "B");

-- CreateIndex
CREATE INDEX "_EntryLitNotes_B_index" ON "_EntryLitNotes"("B");
