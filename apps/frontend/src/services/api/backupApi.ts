import api from './apiClient';

export interface BackupConfig {
  enabled: boolean;
  interval: number;
  maxBackups: number;
  cloudFolder: string;
  includeMetadata: boolean;
  includeRelationships: boolean;
  compression: boolean;
}

export interface BackupRecord {
  id: string;
  userId: string;
  filename: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  metadata: {
    entityCounts: {
      projects: number;
      notes: number;
      tasks: number;
      databaseEntries: number;
      literatureNotes: number;
      protocols: number;
      recipes: number;
    };
  };
}

export interface BackupStats {
  totalBackups: number;
  completedBackups: number;
  failedBackups: number;
  totalSize: number;
  averageSize: number;
  successRate: number;
  lastBackupDate: string | null;
}

export const backupApi = {
  // Export all data for backup
  exportData: () => api.get('/backup/export'),

  // Get backup configuration
  getConfig: () => api.get('/backup/config'),

  // Update backup configuration
  updateConfig: (config: BackupConfig) => api.put('/backup/config', config),

  // Get backup history
  getHistory: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    return api.get(`/backup/history?${searchParams.toString()}`);
  },

  // Create backup
  createBackup: () => api.post('/backup/create'),

  // Delete backup
  deleteBackup: (backupId: string) => api.delete(`/backup/${backupId}`),

  // Restore from backup
  restoreBackup: (backupId: string) => api.post(`/backup/${backupId}/restore`),

  // Get backup statistics
  getStats: () => api.get('/backup/stats')
}; 