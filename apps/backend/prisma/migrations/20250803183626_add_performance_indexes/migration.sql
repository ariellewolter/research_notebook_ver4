-- CreateIndex
CREATE INDEX "Note_type_idx" ON "Note"("type");

-- CreateIndex
CREATE INDEX "Note_date_idx" ON "Note"("date");

-- CreateIndex
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");

-- CreateIndex
CREATE INDEX "Note_experimentId_idx" ON "Note"("experimentId");

-- CreateIndex
CREATE INDEX "Protocol_category_idx" ON "Protocol"("category");

-- CreateIndex
CREATE INDEX "Protocol_updatedAt_idx" ON "Protocol"("updatedAt");

-- CreateIndex
CREATE INDEX "Protocol_createdAt_idx" ON "Protocol"("createdAt");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");

-- CreateIndex
CREATE INDEX "Task_deadline_idx" ON "Task"("deadline");

-- CreateIndex
CREATE INDEX "Task_createdAt_idx" ON "Task"("createdAt");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- CreateIndex
CREATE INDEX "Task_experimentId_idx" ON "Task"("experimentId");
