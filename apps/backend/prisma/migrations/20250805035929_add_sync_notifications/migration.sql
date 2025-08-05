-- CreateTable
CREATE TABLE "SyncNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "sentAt" DATETIME,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "deliveryMethod" TEXT NOT NULL DEFAULT 'in_app',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "SyncNotification_service_idx" ON "SyncNotification"("service");

-- CreateIndex
CREATE INDEX "SyncNotification_type_idx" ON "SyncNotification"("type");

-- CreateIndex
CREATE INDEX "SyncNotification_isRead_idx" ON "SyncNotification"("isRead");

-- CreateIndex
CREATE INDEX "SyncNotification_createdAt_idx" ON "SyncNotification"("createdAt");
