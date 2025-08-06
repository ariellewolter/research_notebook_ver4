import { useState, useEffect, useCallback, useRef } from 'react';
import { DrawingData } from '../components/blocks/FreeformDrawingBlock';
import { drawingSyncService, SyncResult, SyncOptions } from '../services/drawingSyncService';
import { drawingStorageService } from '../services/drawingStorageService';

export interface UseDrawingSyncOptions {
  blockId: string;
  entityId: string;
  entityType: string;
  autoSaveDelay?: number;
  enableCloudSync?: boolean;
  onSaveSuccess?: (result: SyncResult) => void;
  onSaveError?: (error: string) => void;
  onSyncStatusChange?: (status: string) => void;
}

export interface DrawingSyncState {
  isSaving: boolean;
  isSyncing: boolean;
  syncStatus: 'pending' | 'synced' | 'error' | 'offline' | null;
  lastSaved: string | null;
  hasUnsavedChanges: boolean;
  saveError: string | null;
  cloudSynced: boolean;
  cloudService?: string;
}

export interface DrawingSyncActions {
  saveDrawing: (drawingData: DrawingData, options?: SyncOptions) => Promise<SyncResult>;
  forceSync: (options?: SyncOptions) => Promise<SyncResult>;
  clearError: () => void;
  resetState: () => void;
}

export const useDrawingSync = (options: UseDrawingSyncOptions): [DrawingSyncState, DrawingSyncActions] => {
  const {
    blockId,
    entityId,
    entityType,
    autoSaveDelay = 2000,
    enableCloudSync = true,
    onSaveSuccess,
    onSaveError,
    onSyncStatusChange
  } = options;

  const [state, setState] = useState<DrawingSyncState>({
    isSaving: false,
    isSyncing: false,
    syncStatus: null,
    lastSaved: null,
    hasUnsavedChanges: false,
    saveError: null,
    cloudSynced: false
  });

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDrawingDataRef = useRef<DrawingData | null>(null);

  // Initialize sync status
  useEffect(() => {
    const initSyncStatus = async () => {
      try {
        const syncStatus = await drawingSyncService.getSyncStatus(blockId);
        const storageData = await drawingStorageService.getDrawing(blockId);
        
        setState(prev => ({
          ...prev,
          syncStatus,
          cloudSynced: storageData?.cloudSynced || false,
          cloudService: storageData?.cloudService
        }));

        if (onSyncStatusChange && syncStatus) {
          onSyncStatusChange(syncStatus);
        }
      } catch (error) {
        console.error('Failed to initialize sync status:', error);
      }
    };

    initSyncStatus();
  }, [blockId, onSyncStatusChange]);

  // Listen for online/offline changes
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      const isOnline = navigator.onLine;
      if (isOnline && state.hasUnsavedChanges) {
        // Trigger sync when coming back online
        if (lastDrawingDataRef.current) {
          saveDrawing(lastDrawingDataRef.current);
        }
      }
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [state.hasUnsavedChanges]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const saveDrawing = useCallback(async (drawingData: DrawingData, saveOptions?: SyncOptions): Promise<SyncResult> => {
    // Clear existing auto-save timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Store the drawing data for potential auto-save
    lastDrawingDataRef.current = drawingData;

    // Set unsaved changes flag
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: true,
      saveError: null
    }));

    // Set up auto-save timeout
    autoSaveTimeoutRef.current = setTimeout(async () => {
      await performSave(drawingData, saveOptions);
    }, autoSaveDelay);

    // Return immediate success for UI responsiveness
    return {
      success: true,
      synced: false,
      cloudData: { cloudSynced: false }
    };
  }, [blockId, entityId, entityType, autoSaveDelay, enableCloudSync]);

  const performSave = useCallback(async (drawingData: DrawingData, saveOptions?: SyncOptions): Promise<SyncResult> => {
    setState(prev => ({
      ...prev,
      isSaving: true,
      isSyncing: true
    }));

    try {
      const syncOptions: SyncOptions = {
        includeCloudSync: enableCloudSync,
        ...saveOptions
      };

      const result = await drawingSyncService.saveDrawingWithSync(
        blockId,
        entityId,
        entityType,
        drawingData,
        syncOptions
      );

      if (result.success) {
        setState(prev => ({
          ...prev,
          isSaving: false,
          isSyncing: false,
          syncStatus: result.synced ? 'synced' : 'pending',
          lastSaved: new Date().toISOString(),
          hasUnsavedChanges: false,
          saveError: null,
          cloudSynced: result.cloudData?.cloudSynced || false,
          cloudService: result.cloudData?.cloudService
        }));

        if (onSaveSuccess) {
          onSaveSuccess(result);
        }

        if (onSyncStatusChange) {
          onSyncStatusChange(result.synced ? 'synced' : 'pending');
        }
      } else {
        setState(prev => ({
          ...prev,
          isSaving: false,
          isSyncing: false,
          syncStatus: 'error',
          saveError: result.error || 'Save failed'
        }));

        if (onSaveError) {
          onSaveError(result.error || 'Save failed');
        }

        if (onSyncStatusChange) {
          onSyncStatusChange('error');
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        isSyncing: false,
        syncStatus: 'error',
        saveError: errorMessage
      }));

      if (onSaveError) {
        onSaveError(errorMessage);
      }

      if (onSyncStatusChange) {
        onSyncStatusChange('error');
      }

      return {
        success: false,
        synced: false,
        error: errorMessage
      };
    }
  }, [blockId, entityId, entityType, enableCloudSync, onSaveSuccess, onSaveError, onSyncStatusChange]);

  const forceSync = useCallback(async (syncOptions?: SyncOptions): Promise<SyncResult> => {
    if (!lastDrawingDataRef.current) {
      return {
        success: false,
        synced: false,
        error: 'No drawing data to sync'
      };
    }

    return await performSave(lastDrawingDataRef.current, syncOptions);
  }, [performSave]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      saveError: null
    }));
  }, []);

  const resetState = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setState({
      isSaving: false,
      isSyncing: false,
      syncStatus: null,
      lastSaved: null,
      hasUnsavedChanges: false,
      saveError: null,
      cloudSynced: false
    });

    lastDrawingDataRef.current = null;
  }, []);

  const actions: DrawingSyncActions = {
    saveDrawing,
    forceSync,
    clearError,
    resetState
  };

  return [state, actions];
}; 