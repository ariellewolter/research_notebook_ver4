-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RecipeExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "experimentId" TEXT,
    "status" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "notes" TEXT,
    "modifications" TEXT,
    "results" TEXT,
    "issues" TEXT,
    "nextSteps" TEXT,
    "executedBy" TEXT,
    "completedSteps" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecipeExecution_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecipeExecution_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RecipeExecution" ("completedSteps", "createdAt", "endDate", "executedBy", "experimentId", "id", "issues", "modifications", "nextSteps", "notes", "recipeId", "results", "startDate", "status", "updatedAt") SELECT "completedSteps", "createdAt", "endDate", "executedBy", "experimentId", "id", "issues", "modifications", "nextSteps", "notes", "recipeId", "results", "startDate", "status", "updatedAt" FROM "RecipeExecution";
DROP TABLE "RecipeExecution";
ALTER TABLE "new_RecipeExecution" RENAME TO "RecipeExecution";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
