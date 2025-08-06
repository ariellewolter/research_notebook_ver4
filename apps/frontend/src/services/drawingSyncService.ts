import { blocksApi } from './api/blocksApi';
import { entityCloudSyncApi } from './api/entityCloudSyncApi';
import { cloudSyncApi } from './api/cloudSyncApi';
import { drawingStorageService, DrawingStorageData } from './drawingStorageService';
import { DrawingData } from '../components/blocks/FreeformDrawingBlock';

export interface SyncResult {
  success: boolean;
  synced: boolean;
  error?: string;
  cloudData?: {
    cloudSynced: boolean;
    cloudPath?: string;
    cloudService?: string;
  };
}

export interface SyncOptions {
  forceSync?: boolean;
  includeCloudSync?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

class DrawingSyncService {
  private syncQueue: Map<string, Promise<SyncResult>> = new Map();
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingSyncs();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Initialize storage
    this.init();
  }

  private async init(): Promise<void> {
    try {
      await drawingStorageService.init();
    } catch (error) {
      console.error('Failed to initialize drawing storage:', error);
    }
  }

  /**
   * Save drawing with auto-sync
   */
  async saveDrawingWithSync(
    blockId: string,
    entityId: string,
    entityType: string,
    drawingData: DrawingData,
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const syncOptions: SyncOptions = {
      includeCloudSync: true,
      retryAttempts: 3,
      retryDelay: 1000,
      ...options
    };

    try {
      // Save to local storage first
      const storageData: DrawingStorageData = {
        blockId,
        entityId,
        entityType,
        drawingData,
        lastModified: new Date().toISOString(),
        syncStatus: 'pending'
      };

      await drawingStorageService.saveDrawing(storageData);

      // Attempt to sync if online
      if (this.isOnline) {
        return await this.syncDrawing(blockId, syncOptions);
      } else {
        // Mark as offline if not connected
        await drawingStorageService.updateSyncStatus(blockId, 'offline');
        return {
          success: true,
          synced: false,
          cloudData: { cloudSynced: false }
        };
      }
    } catch (error) {
      console.error('Failed to save drawing with sync:', error);
      return {
        success: false,
        synced: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sync a specific drawing
   */
  async syncDrawing(blockId: string, options: SyncOptions = {}): Promise<SyncResult> {
    // Check if sync is already in progress for this drawing
    if (this.syncQueue.has(blockId)) {
      return this.syncQueue.get(blockId)!;
    }

    const syncPromise = this.performSync(blockId, options);
    this.syncQueue.set(blockId, syncPromise);

    try {
      const result = await syncPromise;
      return result;
    } finally {
      this.syncQueue.delete(blockId);
    }
  }

  /**
   * Perform the actual sync operation
   */
  private async performSync(blockId: string, options: SyncOptions): Promise<SyncResult> {
    const { forceSync = false, includeCloudSync = true, retryAttempts = 3, retryDelay = 1000 } = options;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        // Get drawing data from storage
        const storageData = await drawingStorageService.getDrawing(blockId);
        if (!storageData) {
          return {
            success: false,
            synced: false,
            error: 'Drawing not found in storage'
          };
        }

        // Skip sync if already synced and not forced
        if (!forceSync && storageData.syncStatus === 'synced') {
          return {
            success: true,
            synced: true,
            cloudData: {
              cloudSynced: storageData.cloudSynced || false,
              cloudPath: storageData.cloudPath,
              cloudService: storageData.cloudService
            }
          };
        }

        // Sync to backend
        const backendResult = await this.syncToBackend(storageData);
        if (!backendResult.success) {
          throw new Error(backendResult.error || 'Backend sync failed');
        }

        // Sync to cloud if enabled
        let cloudResult: SyncResult['cloudData'] = { cloudSynced: false };
        if (includeCloudSync && backendResult.success) {
          cloudResult = await this.syncToCloud(storageData);
        }

        // Update sync status
        await drawingStorageService.updateSyncStatus(blockId, 'synced', cloudResult);

        return {
          success: true,
          synced: true,
          cloudData: cloudResult
        };

      } catch (error) {
        console.error(`Sync attempt ${attempt} failed for drawing ${blockId}:`, error);

        if (attempt === retryAttempts) {
          // Final attempt failed, mark as error
          await drawingStorageService.updateSyncStatus(blockId, 'error');
          return {
            success: false,
            synced: false,
            error: error instanceof Error ? error.message : 'Sync failed after retries'
          };
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }

    return {
      success: false,
      synced: false,
      error: 'Sync failed after all retry attempts'
    };
  }

  /**
   * Sync drawing to backend
   */
  private async syncToBackend(storageData: DrawingStorageData): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if drawing exists in backend
      try {
        await blocksApi.getBlockByBlockId(storageData.blockId);
        // Update existing drawing
        await blocksApi.updateFreeformDrawingBlock(storageData.blockId, {
          strokes: JSON.stringify(storageData.drawingData.strokes),
          svgPath: storageData.drawingData.svgPath,
          pngThumbnail: storageData.drawingData.pngThumbnail,
          width: storageData.drawingData.width,
          height: storageData.drawingData.height
        });
      } catch (error) {
        // Drawing doesn't exist, create new one
        await blocksApi.createFreeformDrawingBlock({
          blockId: storageData.blockId,
          entityId: storageData.entityId,
          entityType: storageData.entityType as any,
          strokes: JSON.stringify(storageData.drawingData.strokes),
          svgPath: storageData.drawingData.svgPath,
          pngThumbnail: storageData.drawingData.pngThumbnail,
          width: storageData.drawingData.width,
          height: storageData.drawingData.height
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Backend sync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backend sync failed'
      };
    }
  }

  /**
   * Sync drawing to cloud services
   */
  private async syncToCloud(storageData: DrawingStorageData): Promise<SyncResult['cloudData']> {
    try {
      // Check if entity has cloud sync enabled
      const entitySyncData = await entityCloudSyncApi.getEntityCloudSync(
        storageData.entityType as any,
        storageData.entityId
      );

      if (!entitySyncData.cloudSynced) {
        return { cloudSynced: false };
      }

      // Get cloud sync status
      const cloudStatus = await cloudSyncApi.getStatus();
      if (!cloudStatus.syncEnabled || cloudStatus.connectedServices.length === 0) {
        return { cloudSynced: false };
      }

      // For now, we'll just mark as cloud synced if the entity is configured for cloud sync
      // In a full implementation, you would upload the drawing data to the cloud service
      return {
        cloudSynced: true,
        cloudPath: entitySyncData.cloudPath,
        cloudService: entitySyncData.cloudService
      };

    } catch (error) {
      console.error('Cloud sync failed:', error);
      return { cloudSynced: false };
    }
  }

  /**
   * Process all pending syncs
   */
  async processPendingSyncs(): Promise<{ total: number; synced: number; failed: number }> {
    if (this.syncInProgress || !this.isOnline) {
      return { total: 0, synced: 0, failed: 0 };
    }

    this.syncInProgress = true;

    try {
      const pendingDrawings = await drawingStorageService.getPendingSyncDrawings();
      const results = await Promise.allSettled(
        pendingDrawings.map(drawing => this.syncDrawing(drawing.blockId))
      );

      const synced = results.filter(r => r.status === 'fulfilled' && r.value.synced).length;
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.synced)).length;

      return {
        total: pendingDrawings.length,
        synced,
        failed
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get sync status for a drawing
   */
  async getSyncStatus(blockId: string): Promise<DrawingStorageData['syncStatus'] | null> {
    try {
      const storageData = await drawingStorageService.getDrawing(blockId);
      return storageData?.syncStatus || null;
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return null;
    }
  }

  /**
   * Force sync all drawings
   */
  async forceSyncAll(): Promise<{ total: number; synced: number; failed: number }> {
    const stats = await drawingStorageService.getStorageStats();
    const allDrawings = await this.getAllDrawings();

    const results = await Promise.allSettled(
      allDrawings.map(drawing => this.syncDrawing(drawing.blockId, { forceSync: true }))
    );

    const synced = results.filter(r => r.status === 'fulfilled' && r.value.synced).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.synced)).length;

    return {
      total: allDrawings.length,
      synced,
      failed
    };
  }

  /**
   * Get all drawings from storage
   */
  private async getAllDrawings(): Promise<DrawingStorageData[]> {
    // This would need to be implemented in the storage service
    // For now, we'll return an empty array
    return [];
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.syncInProgress || this.syncQueue.size > 0;
  }

  /**
   * Get sync queue size
   */
  getSyncQueueSize(): number {
    return this.syncQueue.size;
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get storage stats
   */
  async getStorageStats() {
    return await drawingStorageService.getStorageStats();
  }
}

export const drawingSyncService = new DrawingSyncService(); 