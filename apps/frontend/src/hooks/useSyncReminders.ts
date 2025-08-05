import { useEffect, useState } from 'react';
import { syncReminderService, SyncStatus, SyncReminderConfig } from '../services/syncReminderService';

export const useSyncReminders = () => {
  const [syncStatuses, setSyncStatuses] = useState<Map<string, SyncStatus>>(new Map());
  const [config, setConfig] = useState<SyncReminderConfig>(syncReminderService.getConfig());
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Start monitoring when the hook is mounted
    if (config.enabled) {
      syncReminderService.startMonitoring();
      setIsMonitoring(true);
    }

    // Set up interval to refresh sync statuses
    const statusInterval = setInterval(() => {
      setSyncStatuses(syncReminderService.getSyncStatuses());
    }, 30000); // Refresh every 30 seconds

    return () => {
      // Clean up intervals when component unmounts
      clearInterval(statusInterval);
      if (isMonitoring) {
        syncReminderService.stopMonitoring();
        setIsMonitoring(false);
      }
    };
  }, [config.enabled, isMonitoring]);

  const updateConfig = (newConfig: Partial<SyncReminderConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    syncReminderService.updateConfig(updatedConfig);
    
    if (updatedConfig.enabled && !isMonitoring) {
      setIsMonitoring(true);
    } else if (!updatedConfig.enabled && isMonitoring) {
      setIsMonitoring(false);
    }
  };

  const triggerSync = async (service: string) => {
    return await syncReminderService.triggerSync(service);
  };

  const refreshStatuses = () => {
    setSyncStatuses(syncReminderService.getSyncStatuses());
  };

  const getServiceStatus = (service: string): SyncStatus | undefined => {
    return syncStatuses.get(service);
  };

  const getAllStatuses = (): SyncStatus[] => {
    return Array.from(syncStatuses.values());
  };

  const getConfiguredServices = (): SyncStatus[] => {
    return getAllStatuses().filter(status => status.isConfigured);
  };

  const getServicesNeedingSync = (): SyncStatus[] => {
    const now = new Date();
    return getAllStatuses().filter(status => {
      if (!status.isConfigured || status.isSyncing) return false;
      
      if (!status.lastSyncTime) return true;
      
      const hoursSinceLastSync = (now.getTime() - status.lastSyncTime.getTime()) / (1000 * 60 * 60);
      return hoursSinceLastSync >= config.warningThreshold;
    });
  };

  const getServicesWithErrors = (): SyncStatus[] => {
    return getAllStatuses().filter(status => 
      status.isConfigured && status.hasErrors
    );
  };

  const formatTimeSinceLastSync = (lastSyncTime: Date | null): string => {
    return syncReminderService.formatTimeSinceLastSync(lastSyncTime);
  };

  return {
    // State
    syncStatuses,
    config,
    isMonitoring,
    
    // Actions
    updateConfig,
    triggerSync,
    refreshStatuses,
    
    // Getters
    getServiceStatus,
    getAllStatuses,
    getConfiguredServices,
    getServicesNeedingSync,
    getServicesWithErrors,
    formatTimeSinceLastSync
  };
}; 