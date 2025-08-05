import { useState, useEffect, useCallback, useRef } from 'react';
import { useCloudSync } from './useCloudSync';
import { cloudSyncService, CloudServiceName } from '../utils/cloudSyncAPI';

export type EntityType = 'note' | 'project' | 'task';

export interface EntitySaveEvent {
  entityType: EntityType;
  entityId: string;
  entity: any; // The saved entity data
  timestamp: number;
}

export interface AutoSyncConfig {
  enabled: boolean;
  throttleDelay: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  services: CloudServiceName[];
}

export interface AutoSyncStatus {
  isEnabled: boolean;
  lastSyncTime: number | null;
  pendingSyncs: number;
  failedSyncs: number;
  isSyncing: boolean;
}

export interface SyncResult {
  success: boolean;
  entityType: EntityType;
  entityId: string;
  serviceName: CloudServiceName;
  timestamp: number;
  error?: string;
  retryCount: number;
}

const DEFAULT_CONFIG: AutoSyncConfig = {
  enabled: true,
  throttleDelay: 2000, // 2 seconds
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  services: ['dropbox', 'google', 'onedrive', 'apple']
};

export const useAutoSync = (config: Partial<AutoSyncConfig> = {}) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { isConnected, uploadFile } = useCloudSync();
  
  const [status, setStatus] = useState<AutoSyncStatus>({
    isEnabled: mergedConfig.enabled,
    lastSyncTime: null,
    pendingSyncs: 0,
    failedSyncs: 0,
    isSyncing: false
  });

  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs for managing sync state
  const syncQueue = useRef<EntitySaveEvent[]>([]);
  const syncTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const retryCounts = useRef<Map<string, number>>(new Map());
  const isProcessing = useRef(false);

  // Check if entity is cloud-synced
  const isEntityCloudSynced = useCallback((entity: any): boolean => {
    return entity?.cloudSynced === true && entity?.cloudService;
  }, []);

  // Get cloud service for entity
  const getEntityCloudService = useCallback((entity: any): CloudServiceName | null => {
    if (!isEntityCloudSynced(entity)) return null;
    return entity.cloudService as CloudServiceName;
  }, [isEntityCloudSynced]);

  // Generate unique sync key for entity
  const getSyncKey = useCallback((entityType: EntityType, entityId: string): string => {
    return `${entityType}:${entityId}`;
  }, []);

  // Throttled sync function
  const scheduleSync = useCallback((event: EntitySaveEvent) => {
    const syncKey = getSyncKey(event.entityType, event.entityId);
    
    // Clear existing timeout for this entity
    const existingTimeout = syncTimeouts.current.get(syncKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Add to queue if not already present
    const existingInQueue = syncQueue.current.find(
      e => getSyncKey(e.entityType, e.entityId) === syncKey
    );
    if (!existingInQueue) {
      syncQueue.current.push(event);
    }

    // Schedule new timeout
    const timeout = setTimeout(() => {
      processSyncQueue();
    }, mergedConfig.throttleDelay);

    syncTimeouts.current.set(syncKey, timeout);
  }, [getSyncKey, mergedConfig.throttleDelay]);

  // Process sync queue
  const processSyncQueue = useCallback(async () => {
    if (isProcessing.current || !status.isEnabled) return;

    isProcessing.current = true;
    setStatus(prev => ({ ...prev, isSyncing: true }));

    const eventsToProcess = [...syncQueue.current];
    syncQueue.current = [];

    // Clear all timeouts
    syncTimeouts.current.forEach(timeout => clearTimeout(timeout));
    syncTimeouts.current.clear();

    for (const event of eventsToProcess) {
      await processEntitySync(event);
    }

    isProcessing.current = false;
    setStatus(prev => ({ 
      ...prev, 
      isSyncing: false,
      lastSyncTime: Date.now(),
      pendingSyncs: syncQueue.current.length
    }));
  }, [status.isEnabled]);

  // Process individual entity sync
  const processEntitySync = useCallback(async (event: EntitySaveEvent) => {
    const { entityType, entityId, entity } = event;
    const syncKey = getSyncKey(entityType, entityId);

    // Check if entity is cloud-synced
    if (!isEntityCloudSynced(entity)) {
      console.log(`Entity ${entityId} is not cloud-synced, skipping sync`);
      return;
    }

    const cloudService = getEntityCloudService(entity);
    if (!cloudService) {
      console.log(`No cloud service found for entity ${entityId}`);
      return;
    }

    // Check if service is connected
    if (!isConnected(cloudService)) {
      console.log(`Cloud service ${cloudService} is not connected for entity ${entityId}`);
      return;
    }

    // Get current retry count
    const currentRetries = retryCounts.current.get(syncKey) || 0;

    try {
      // Prepare entity data for sync
      const entityData = prepareEntityForSync(entityType, entity);
      
      // Generate filename based on entity type and ID
      const filename = generateSyncFilename(entityType, entity);
      const remotePath = `${entity.cloudPath || '/research-notebook'}/${filename}`;

      // Upload to cloud service
      const success = await uploadFile(cloudService, '', remotePath, entityData);

      if (success) {
        // Success - clear retry count
        retryCounts.current.delete(syncKey);
        
        const result: SyncResult = {
          success: true,
          entityType,
          entityId,
          serviceName: cloudService,
          timestamp: Date.now(),
          retryCount: currentRetries
        };

        setSyncResults(prev => [result, ...prev.slice(0, 99)]); // Keep last 100 results
        console.log(`Successfully synced ${entityType} ${entityId} to ${cloudService}`);
      } else {
        throw new Error('Upload returned false');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown sync error';
      console.error(`Failed to sync ${entityType} ${entityId} to ${cloudService}:`, errorMessage);

      // Handle retries
      if (currentRetries < mergedConfig.maxRetries) {
        const newRetryCount = currentRetries + 1;
        retryCounts.current.set(syncKey, newRetryCount);

        // Schedule retry
        setTimeout(() => {
          syncQueue.current.push(event);
          processSyncQueue();
        }, mergedConfig.retryDelay * newRetryCount);

        console.log(`Scheduling retry ${newRetryCount} for ${entityType} ${entityId}`);
      } else {
        // Max retries exceeded
        retryCounts.current.delete(syncKey);
        
        const result: SyncResult = {
          success: false,
          entityType,
          entityId,
          serviceName: cloudService,
          timestamp: Date.now(),
          error: errorMessage,
          retryCount: currentRetries
        };

        setSyncResults(prev => [result, ...prev.slice(0, 99)]);
        setStatus(prev => ({ ...prev, failedSyncs: prev.failedSyncs + 1 }));
        setError(`Failed to sync ${entityType} ${entityId} after ${mergedConfig.maxRetries} retries`);
      }
    }
  }, [
    getSyncKey,
    isEntityCloudSynced,
    getEntityCloudService,
    isConnected,
    uploadFile,
    mergedConfig.maxRetries,
    mergedConfig.retryDelay
  ]);

  // Prepare entity data for sync
  const prepareEntityForSync = useCallback((entityType: EntityType, entity: any): Blob => {
    const syncData = {
      entityType,
      entityId: entity.id,
      data: entity,
      syncedAt: new Date().toISOString(),
      version: '1.0'
    };

    const jsonString = JSON.stringify(syncData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }, []);

  // Generate filename for sync
  const generateSyncFilename = useCallback((entityType: EntityType, entity: any): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeTitle = (entity.title || entity.name || 'untitled').replace(/[^a-zA-Z0-9-_]/g, '_');
    return `${entityType}_${entity.id}_${safeTitle}_${timestamp}.json`;
  }, []);

  // Listen for save events
  const handleEntitySave = useCallback((event: EntitySaveEvent) => {
    if (!status.isEnabled) return;

    console.log(`Auto-sync: Entity save event for ${event.entityType} ${event.entityId}`);
    scheduleSync(event);
    
    setStatus(prev => ({ ...prev, pendingSyncs: prev.pendingSyncs + 1 }));
  }, [status.isEnabled, scheduleSync]);

  // Enable/disable auto-sync
  const setEnabled = useCallback((enabled: boolean) => {
    setStatus(prev => ({ ...prev, isEnabled: enabled }));
    
    if (!enabled) {
      // Clear all pending syncs
      syncQueue.current = [];
      syncTimeouts.current.forEach(timeout => clearTimeout(timeout));
      syncTimeouts.current.clear();
      retryCounts.current.clear();
      setStatus(prev => ({ ...prev, pendingSyncs: 0, isSyncing: false }));
    }
  }, []);

  // Clear sync results
  const clearResults = useCallback(() => {
    setSyncResults([]);
    setError(null);
    setStatus(prev => ({ ...prev, failedSyncs: 0 }));
  }, []);

  // Get recent sync results
  const getRecentResults = useCallback((limit: number = 10) => {
    return syncResults.slice(0, limit);
  }, [syncResults]);

  // Get failed syncs
  const getFailedSyncs = useCallback(() => {
    return syncResults.filter(result => !result.success);
  }, [syncResults]);

  // Manual sync trigger
  const triggerManualSync = useCallback(async (entityType: EntityType, entityId: string, entity: any) => {
    const event: EntitySaveEvent = {
      entityType,
      entityId,
      entity,
      timestamp: Date.now()
    };
    
    await processEntitySync(event);
  }, [processEntitySync]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      syncTimeouts.current.forEach(timeout => clearTimeout(timeout));
      syncTimeouts.current.clear();
      retryCounts.current.clear();
    };
  }, []);

  return {
    // State
    status,
    syncResults,
    error,
    
    // Actions
    handleEntitySave,
    setEnabled,
    clearResults,
    getRecentResults,
    getFailedSyncs,
    triggerManualSync,
    
    // Configuration
    config: mergedConfig
  };
};

// Export a global event emitter for save events
class SaveEventEmitter {
  private listeners: Map<string, ((event: EntitySaveEvent) => void)[]> = new Map();

  emit(event: EntitySaveEvent) {
    const listeners = this.listeners.get('save') || [];
    listeners.forEach(listener => listener(event));
  }

  on(event: string, listener: (event: EntitySaveEvent) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: (event: EntitySaveEvent) => void) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}

export const saveEventEmitter = new SaveEventEmitter();

// Hook to listen for global save events
export const useSaveEventEmitter = () => {
  const { handleEntitySave } = useAutoSync();

  useEffect(() => {
    saveEventEmitter.on('save', handleEntitySave);
    
    return () => {
      saveEventEmitter.off('save', handleEntitySave);
    };
  }, [handleEntitySave]);
};

// Utility function to emit save events from anywhere in the app
export const emitSaveEvent = (entityType: EntityType, entityId: string, entity: any) => {
  const event: EntitySaveEvent = {
    entityType,
    entityId,
    entity,
    timestamp: Date.now()
  };
  
  saveEventEmitter.emit(event);
}; 