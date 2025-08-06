import { DrawingData } from '../components/blocks/FreeformDrawingBlock';

export interface DrawingStorageData {
  blockId: string;
  entityId: string;
  entityType: string;
  drawingData: DrawingData;
  lastModified: string;
  syncStatus: 'pending' | 'synced' | 'error' | 'offline';
  cloudSynced?: boolean;
  cloudPath?: string;
  cloudService?: string;
}

export interface StorageStats {
  totalDrawings: number;
  pendingSync: number;
  offlineDrawings: number;
  lastSyncTime?: string;
}

class DrawingStorageService {
  private dbName = 'ResearchNotebookDrawings';
  private dbVersion = 1;
  private storeName = 'drawings';
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.warn('IndexedDB not available, falling back to localStorage');
        resolve();
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'blockId' });
          store.createIndex('entityId', 'entityId', { unique: false });
          store.createIndex('entityType', 'entityType', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('lastModified', 'lastModified', { unique: false });
        }
      };
    });
  }

  /**
   * Save drawing data to storage
   */
  async saveDrawing(data: DrawingStorageData): Promise<void> {
    try {
      if (this.db) {
        // Use IndexedDB
        return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.put(data);

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } else {
        // Fallback to localStorage
        const key = `drawing_${data.blockId}`;
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to save drawing to storage:', error);
      throw error;
    }
  }

  /**
   * Get drawing data from storage
   */
  async getDrawing(blockId: string): Promise<DrawingStorageData | null> {
    try {
      if (this.db) {
        // Use IndexedDB
        return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.get(blockId);

          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });
      } else {
        // Fallback to localStorage
        const key = `drawing_${blockId}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      console.error('Failed to get drawing from storage:', error);
      return null;
    }
  }

  /**
   * Get all drawings for an entity
   */
  async getDrawingsByEntity(entityId: string, entityType: string): Promise<DrawingStorageData[]> {
    try {
      if (this.db) {
        // Use IndexedDB
        return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const index = store.index('entityId');
          const request = index.getAll(entityId);

          request.onsuccess = () => {
            const drawings = request.result.filter(d => d.entityType === entityType);
            resolve(drawings);
          };
          request.onerror = () => reject(request.error);
        });
      } else {
        // Fallback to localStorage
        const drawings: DrawingStorageData[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('drawing_')) {
            try {
              const data = JSON.parse(localStorage.getItem(key)!);
              if (data.entityId === entityId && data.entityType === entityType) {
                drawings.push(data);
              }
            } catch (error) {
              console.warn('Failed to parse drawing data from localStorage:', error);
            }
          }
        }
        return drawings;
      }
    } catch (error) {
      console.error('Failed to get drawings by entity:', error);
      return [];
    }
  }

  /**
   * Get all pending sync drawings
   */
  async getPendingSyncDrawings(): Promise<DrawingStorageData[]> {
    try {
      if (this.db) {
        // Use IndexedDB
        return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const index = store.index('syncStatus');
          const request = index.getAll('pending');

          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } else {
        // Fallback to localStorage
        const drawings: DrawingStorageData[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('drawing_')) {
            try {
              const data = JSON.parse(localStorage.getItem(key)!);
              if (data.syncStatus === 'pending') {
                drawings.push(data);
              }
            } catch (error) {
              console.warn('Failed to parse drawing data from localStorage:', error);
            }
          }
        }
        return drawings;
      }
    } catch (error) {
      console.error('Failed to get pending sync drawings:', error);
      return [];
    }
  }

  /**
   * Update sync status for a drawing
   */
  async updateSyncStatus(blockId: string, syncStatus: DrawingStorageData['syncStatus'], cloudData?: { cloudSynced: boolean; cloudPath?: string; cloudService?: string }): Promise<void> {
    try {
      const drawing = await this.getDrawing(blockId);
      if (drawing) {
        drawing.syncStatus = syncStatus;
        if (cloudData) {
          drawing.cloudSynced = cloudData.cloudSynced;
          drawing.cloudPath = cloudData.cloudPath;
          drawing.cloudService = cloudData.cloudService;
        }
        await this.saveDrawing(drawing);
      }
    } catch (error) {
      console.error('Failed to update sync status:', error);
      throw error;
    }
  }

  /**
   * Delete drawing from storage
   */
  async deleteDrawing(blockId: string): Promise<void> {
    try {
      if (this.db) {
        // Use IndexedDB
        return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.delete(blockId);

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } else {
        // Fallback to localStorage
        const key = `drawing_${blockId}`;
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Failed to delete drawing from storage:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      if (this.db) {
        // Use IndexedDB
        return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.getAll();

          request.onsuccess = () => {
            const drawings = request.result;
            const stats: StorageStats = {
              totalDrawings: drawings.length,
              pendingSync: drawings.filter(d => d.syncStatus === 'pending').length,
              offlineDrawings: drawings.filter(d => d.syncStatus === 'offline').length,
              lastSyncTime: drawings
                .filter(d => d.syncStatus === 'synced')
                .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())[0]?.lastModified
            };
            resolve(stats);
          };
          request.onerror = () => reject(request.error);
        });
      } else {
        // Fallback to localStorage
        const drawings: DrawingStorageData[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('drawing_')) {
            try {
              const data = JSON.parse(localStorage.getItem(key)!);
              drawings.push(data);
            } catch (error) {
              console.warn('Failed to parse drawing data from localStorage:', error);
            }
          }
        }
        
        return {
          totalDrawings: drawings.length,
          pendingSync: drawings.filter(d => d.syncStatus === 'pending').length,
          offlineDrawings: drawings.filter(d => d.syncStatus === 'offline').length,
          lastSyncTime: drawings
            .filter(d => d.syncStatus === 'synced')
            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())[0]?.lastModified
        };
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalDrawings: 0,
        pendingSync: 0,
        offlineDrawings: 0
      };
    }
  }

  /**
   * Clear all stored drawings
   */
  async clearAll(): Promise<void> {
    try {
      if (this.db) {
        // Use IndexedDB
        return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.clear();

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } else {
        // Fallback to localStorage
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('drawing_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.error('Failed to clear all drawings:', error);
      throw error;
    }
  }

  /**
   * Check if storage is available
   */
  isStorageAvailable(): boolean {
    return this.db !== null || typeof localStorage !== 'undefined';
  }

  /**
   * Get storage type being used
   */
  getStorageType(): 'indexeddb' | 'localstorage' | 'none' {
    if (this.db) return 'indexeddb';
    if (typeof localStorage !== 'undefined') return 'localstorage';
    return 'none';
  }
}

export const drawingStorageService = new DrawingStorageService(); 