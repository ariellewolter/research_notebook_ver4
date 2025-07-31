-- Performance optimization: Add indexes for common task filtering and sorting patterns

-- Index for overdue/due soon filtering (status + deadline)
CREATE INDEX IF NOT EXISTS idx_tasks_status_deadline ON Task(status, deadline);

-- Index for project-based filtering with status
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON Task(projectId, status);

-- Index for priority-based sorting with creation date
CREATE INDEX IF NOT EXISTS idx_tasks_priority_created ON Task(priority, createdAt);

-- Index for deadline-based sorting
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON Task(deadline);

-- Index for experiment-based filtering
CREATE INDEX IF NOT EXISTS idx_tasks_experiment ON Task(experimentId);

-- Index for protocol-based filtering
CREATE INDEX IF NOT EXISTS idx_tasks_protocol ON Task(protocolId);

-- Index for note-based filtering
CREATE INDEX IF NOT EXISTS idx_tasks_note ON Task(noteId);

-- Index for recurring tasks filtering
CREATE INDEX IF NOT EXISTS idx_tasks_recurring ON Task(isRecurring);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority_deadline ON Task(status, priority, deadline);