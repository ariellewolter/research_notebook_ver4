// Auto-sync components
export { AutoSyncProvider } from './AutoSyncProvider';
export { AutoSyncStatus } from './AutoSyncStatus';
export { AutoSyncIntegration } from './AutoSyncIntegration';

// Auto-export components
export { AutoExportProvider } from './AutoExportProvider';
export { AutoExportStatus } from './AutoExportStatus';
export { AutoExportSettings } from './AutoExportSettings';

// Integration components
export { CloudSyncIntegration } from './CloudSyncIntegration';
export { CloudSyncManager } from './CloudSyncManager';

// Cloud Sync UI Components
export { default as GoogleDriveFolderSelector } from './GoogleDriveFolderSelector';
export { default as OneDriveFolderSelector } from './OneDriveFolderSelector';
export { default as ICloudFolderSelector } from './ICloudFolderSelector';
export { default as CloudSyncStatusBadge } from './CloudSyncStatusBadge';
export { default as EntityCloudSyncDialog } from './EntityCloudSyncDialog';
export { default as SyncConflictResolver } from './SyncConflictResolver';
export { default as CloudSyncNotificationsDemo } from './CloudSyncNotificationsDemo';

// Auto-sync hooks
export { useAutoSync, useSaveEventEmitter, emitSaveEvent } from '../../hooks/useAutoSync';
export { useAutoSyncContext } from './AutoSyncProvider';

// Auto-export hooks
export { useAutoExport, useProjectStatusEmitter, emitProjectStatusChange } from '../../hooks/useAutoExport';
export { useAutoExportContext } from './AutoExportProvider';

// Enhanced hooks with auto-sync
export { useNotesWithAutoSync } from '../../hooks/api/useNotesWithAutoSync';
export { useProjectsWithAutoSync } from '../../hooks/api/useProjectsWithAutoSync';
export { useTasksWithAutoSync } from '../../hooks/useTasksWithAutoSync';

// Enhanced hooks with auto-export
export { useProjectsWithAutoExport } from '../../hooks/api/useProjectsWithAutoExport';

// Types
export type { 
  EntityType, 
  EntitySaveEvent, 
  AutoSyncConfig, 
  AutoSyncStatus as AutoSyncStatusType, 
  SyncResult 
} from '../../hooks/useAutoSync';

export type { 
  ExportFormat, 
  AutoExportConfig, 
  AutoExportStatus as AutoExportStatusType, 
  ExportResult 
} from '../../hooks/useAutoExport'; 