import { useEffect, useState } from 'react';
import { backupService, BackupConfig, BackupSnapshot } from '../services/backupService';

export const useBackup = () => {
  const [config, setConfig] = useState<BackupConfig>(backupService.getConfig());
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [lastBackupDate, setLastBackupDate] = useState<Date | null>(null);
  const [isBackupDue, setIsBackupDue] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  useEffect(() => {
    // Load initial data
    loadBackupData();

    // Start automated backups
    backupService.startAutomatedBackups();

    // Set up periodic refresh
    const refreshInterval = setInterval(() => {
      loadBackupData();
    }, 60000); // Refresh every minute

    return () => {
      clearInterval(refreshInterval);
      backupService.stopAutomatedBackups();
    };
  }, []);

  const loadBackupData = () => {
    setConfig(backupService.getConfig());
    setSnapshots(backupService.getSnapshots());
    setLastBackupDate(backupService.getLastBackupDate());
    setIsBackupDue(backupService.isBackupDue());
  };

  const updateConfig = async (newConfig: Partial<BackupConfig>) => {
    await backupService.updateConfig(newConfig);
    setConfig(backupService.getConfig());
  };

  const createBackup = async (): Promise<BackupSnapshot | null> => {
    setIsCreatingBackup(true);
    try {
      const snapshot = await backupService.createBackup();
      loadBackupData(); // Refresh data after backup
      return snapshot;
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const restoreFromBackup = async (backupId: string): Promise<boolean> => {
    return await backupService.restoreFromBackup(backupId);
  };

  const downloadBackup = async (backupId: string): Promise<Blob | null> => {
    return await backupService.downloadBackup(backupId);
  };

  const deleteBackup = async (backupId: string): Promise<boolean> => {
    const success = await backupService.deleteBackup(backupId);
    if (success) {
      loadBackupData(); // Refresh data after deletion
    }
    return success;
  };

  const getBackupStats = () => {
    const totalBackups = snapshots.length;
    const completedBackups = snapshots.filter(s => s.status === 'completed').length;
    const failedBackups = snapshots.filter(s => s.status === 'failed').length;
    const totalSize = snapshots.reduce((sum, s) => sum + s.size, 0);
    const averageSize = totalBackups > 0 ? totalSize / totalBackups : 0;

    return {
      totalBackups,
      completedBackups,
      failedBackups,
      totalSize,
      averageSize,
      successRate: totalBackups > 0 ? (completedBackups / totalBackups) * 100 : 0
    };
  };

  const getEntityCounts = () => {
    if (snapshots.length === 0) return null;
    
    const latestSnapshot = snapshots.find(s => s.status === 'completed');
    return latestSnapshot?.metadata.entityCounts || null;
  };

  const formatBackupSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeSinceLastBackup = (): string => {
    if (!lastBackupDate) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastBackupDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
  };

  const getBackupStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getBackupStatusText = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'pending':
        return 'In Progress';
      default:
        return 'Unknown';
    }
  };

  return {
    // State
    config,
    snapshots,
    lastBackupDate,
    isBackupDue,
    isCreatingBackup,
    
    // Actions
    updateConfig,
    createBackup,
    restoreFromBackup,
    downloadBackup,
    deleteBackup,
    
    // Computed values
    getBackupStats,
    getEntityCounts,
    formatBackupSize,
    formatTimeSinceLastBackup,
    getBackupStatusColor,
    getBackupStatusText
  };
}; 