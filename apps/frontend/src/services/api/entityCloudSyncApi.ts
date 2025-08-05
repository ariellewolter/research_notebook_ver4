import { apiClient } from './apiClient';
import { EntityCloudSyncSettings } from '../../components/CloudSync/EntityCloudSyncDialog';

export interface EntityCloudSyncData {
  id: string;
  title?: string;
  name?: string;
  cloudSynced?: boolean;
  cloudPath?: string;
  cloudService?: string;
  lastSynced?: string;
  syncStatus?: string;
}

export interface SyncStatistics {
  notes: {
    total: number;
    synced: number;
    byStatus: Array<{
      cloudSynced: boolean;
      syncStatus: string | null;
      _count: number;
    }>;
  };
  projects: {
    total: number;
    synced: number;
    byStatus: Array<{
      cloudSynced: boolean;
      syncStatus: string | null;
      _count: number;
    }>;
  };
  pdfs: {
    total: number;
    synced: number;
    byStatus: Array<{
      cloudSynced: boolean;
      syncStatus: string | null;
      _count: number;
    }>;
  };
}

export const entityCloudSyncApi = {
  // Update cloud sync settings for an entity
  updateEntityCloudSync: async (
    entityType: 'note' | 'project' | 'pdf',
    entityId: string,
    settings: EntityCloudSyncSettings
  ): Promise<EntityCloudSyncData> => {
    const response = await apiClient.put(`/entity-cloud-sync/${entityType}/${entityId}`, settings);
    return response.data;
  },

  // Get cloud sync settings for an entity
  getEntityCloudSync: async (
    entityType: 'note' | 'project' | 'pdf',
    entityId: string
  ): Promise<EntityCloudSyncData> => {
    const response = await apiClient.get(`/entity-cloud-sync/${entityType}/${entityId}`);
    return response.data;
  },

  // Get all entities with cloud sync status
  getEntitiesWithCloudSync: async (
    entityType: 'note' | 'project' | 'pdf'
  ): Promise<EntityCloudSyncData[]> => {
    const response = await apiClient.get(`/entity-cloud-sync/${entityType}`);
    return response.data;
  },

  // Update sync status for an entity
  updateSyncStatus: async (
    entityType: 'note' | 'project' | 'pdf',
    entityId: string,
    syncStatus: 'pending' | 'synced' | 'error' | 'conflict',
    lastSynced?: string
  ): Promise<EntityCloudSyncData> => {
    const response = await apiClient.patch(`/entity-cloud-sync/${entityType}/${entityId}/status`, {
      syncStatus,
      lastSynced,
    });
    return response.data;
  },

  // Get sync statistics
  getSyncStatistics: async (): Promise<SyncStatistics> => {
    const response = await apiClient.get('/entity-cloud-sync/stats/overview');
    return response.data;
  },

  // Get entities by sync status
  getEntitiesBySyncStatus: async (
    entityType: 'note' | 'project' | 'pdf',
    syncStatus: 'pending' | 'synced' | 'error' | 'conflict'
  ): Promise<EntityCloudSyncData[]> => {
    const response = await apiClient.get(`/entity-cloud-sync/${entityType}?syncStatus=${syncStatus}`);
    return response.data;
  },

  // Get entities by cloud service
  getEntitiesByCloudService: async (
    entityType: 'note' | 'project' | 'pdf',
    cloudService: 'dropbox' | 'google' | 'onedrive' | 'icloud'
  ): Promise<EntityCloudSyncData[]> => {
    const response = await apiClient.get(`/entity-cloud-sync/${entityType}?cloudService=${cloudService}`);
    return response.data;
  },
}; 