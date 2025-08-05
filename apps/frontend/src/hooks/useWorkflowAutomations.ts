import { useState, useEffect, useCallback } from 'react';

export interface AutomationConfig {
  id: string;
  name: string;
  type: 'auto-sync' | 'auto-export' | 'auto-backup';
  enabled: boolean;
  frequency: string;
  lastRun: number | null;
  nextRun: number | null;
  status: 'idle' | 'running' | 'success' | 'error' | 'warning';
  config: any;
}

export interface AutomationLog {
  id: string;
  automationId: string;
  automationName: string;
  type: string;
  timestamp: number;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: any;
  duration?: number;
}

export interface AutomationStats {
  totalAutomations: number;
  activeAutomations: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecutionTime: number | null;
}

export interface AutomationSettings {
  notifications: {
    enabled: boolean;
    showSuccess: boolean;
    showError: boolean;
    showWarning: boolean;
  };
  performance: {
    maxConcurrent: number;
    retryAttempts: number;
    retryDelay: number;
  };
}

export const useWorkflowAutomations = () => {
  const [automations, setAutomations] = useState<AutomationConfig[]>([]);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [settings, setSettings] = useState<AutomationSettings>({
    notifications: {
      enabled: true,
      showSuccess: true,
      showError: true,
      showWarning: false,
    },
    performance: {
      maxConcurrent: 3,
      retryAttempts: 3,
      retryDelay: 5,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load automation data
  const loadAutomations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load data from different schedulers
      const [syncStatus, exportStatus, syncStats, exportStats] = await Promise.all([
        window.electronAPI.syncScheduler.getStatus(),
        window.electronAPI.exportScheduler.getStatus(),
        window.electronAPI.syncScheduler.getStats(),
        window.electronAPI.exportScheduler.getStats(),
      ]);

      // Combine automation data
      const automationData: AutomationConfig[] = [
        {
          id: 'auto-sync',
          name: 'Auto-Sync on Save',
          type: 'auto-sync',
          enabled: syncStatus.success ? syncStatus.data.isRunning : false,
          frequency: 'Real-time',
          lastRun: syncStats.success ? syncStats.data.lastSyncTime : null,
          nextRun: null,
          status: syncStatus.success ? (syncStatus.data.isRunning ? 'running' : 'idle') : 'error',
          config: syncStatus.success ? syncStatus.data.settings : {}
        },
        {
          id: 'auto-export',
          name: 'Auto-Export on Project Completion',
          type: 'auto-export',
          enabled: exportStatus.success ? exportStatus.data.isRunning : false,
          frequency: 'On Project Completion',
          lastRun: exportStats.success ? exportStats.data.lastExportTime : null,
          nextRun: null,
          status: exportStatus.success ? (exportStatus.data.isRunning ? 'running' : 'idle') : 'error',
          config: exportStatus.success ? exportStatus.data.settings : {}
        },
        {
          id: 'auto-backup',
          name: 'Auto-Backup',
          type: 'auto-backup',
          enabled: false, // Placeholder for future implementation
          frequency: 'Daily',
          lastRun: null,
          nextRun: null,
          status: 'idle',
          config: {}
        }
      ];

      setAutomations(automationData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load automations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load automation logs
  const loadAutomationLogs = useCallback(async () => {
    try {
      // For now, we'll use mock data
      // In the future, this would load from a centralized log service
      const mockLogs: AutomationLog[] = [
        {
          id: '1',
          automationId: 'auto-sync',
          automationName: 'Auto-Sync on Save',
          type: 'auto-sync',
          timestamp: Date.now() - 300000, // 5 minutes ago
          status: 'success',
          message: 'Successfully synced 3 files to cloud',
          duration: 2500
        },
        {
          id: '2',
          automationId: 'auto-export',
          automationName: 'Auto-Export on Project Completion',
          type: 'auto-export',
          timestamp: Date.now() - 900000, // 15 minutes ago
          status: 'success',
          message: 'Exported project "Research Study A" to PDF and Excel',
          duration: 8000
        },
        {
          id: '3',
          automationId: 'auto-sync',
          automationName: 'Auto-Sync on Save',
          type: 'auto-sync',
          timestamp: Date.now() - 1800000, // 30 minutes ago
          status: 'warning',
          message: 'Cloud sync delayed due to network issues',
          duration: 15000
        },
        {
          id: '4',
          automationId: 'auto-backup',
          automationName: 'Auto-Backup',
          type: 'auto-backup',
          timestamp: Date.now() - 86400000, // 1 day ago
          status: 'success',
          message: 'Daily backup completed successfully',
          duration: 45000
        }
      ];

      setAutomationLogs(mockLogs);

      // Calculate stats
      const totalExecutions = mockLogs.length;
      const successfulExecutions = mockLogs.filter(log => log.status === 'success').length;
      const failedExecutions = mockLogs.filter(log => log.status === 'error').length;
      const averageExecutionTime = mockLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / totalExecutions;

      setStats({
        totalAutomations: automations.length,
        activeAutomations: automations.filter(a => a.enabled).length,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        averageExecutionTime,
        lastExecutionTime: mockLogs[0]?.timestamp || null
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load automation logs');
    }
  }, [automations.length]);

  // Toggle automation
  const toggleAutomation = useCallback(async (automationId: string, enabled: boolean) => {
    try {
      setLoading(true);
      setError(null);

      let result;
      
      if (automationId === 'auto-sync') {
        result = enabled 
          ? await window.electronAPI.syncScheduler.start()
          : await window.electronAPI.syncScheduler.stop();
      } else if (automationId === 'auto-export') {
        result = enabled 
          ? await window.electronAPI.exportScheduler.start()
          : await window.electronAPI.exportScheduler.stop();
      } else {
        // Placeholder for auto-backup
        result = { success: true, message: 'Auto-backup not yet implemented' };
      }

      if (result.success) {
        // Reload data to reflect changes
        await loadAutomations();
        return { success: true, message: result.message };
      } else {
        throw new Error(result.error || 'Failed to toggle automation');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle automation';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [loadAutomations]);

  // Update automation settings
  const updateAutomationSettings = useCallback(async (automationId: string, updates: any) => {
    try {
      setLoading(true);
      setError(null);

      let result;
      
      if (automationId === 'auto-sync') {
        result = await window.electronAPI.syncScheduler.updateSettings(updates);
      } else if (automationId === 'auto-export') {
        result = await window.electronAPI.exportScheduler.updateSettings(updates);
      } else {
        // Placeholder for auto-backup
        result = { success: true, message: 'Settings updated' };
      }

      if (result.success) {
        await loadAutomations();
        return { success: true, message: result.message };
      } else {
        throw new Error(result.error || 'Failed to update settings');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [loadAutomations]);

  // Update global settings
  const updateGlobalSettings = useCallback(async (newSettings: Partial<AutomationSettings>) => {
    try {
      setLoading(true);
      setError(null);

      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      // In the future, this would save to a centralized settings service
      console.log('Global automation settings updated:', updatedSettings);

      return { success: true, message: 'Settings updated successfully' };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [settings]);

  // Get automation by ID
  const getAutomation = useCallback((id: string) => {
    return automations.find(automation => automation.id === id);
  }, [automations]);

  // Get logs by automation ID
  const getAutomationLogs = useCallback((automationId: string) => {
    return automationLogs.filter(log => log.automationId === automationId);
  }, [automationLogs]);

  // Get logs by type
  const getLogsByType = useCallback((type: string) => {
    return automationLogs.filter(log => log.type === type);
  }, [automationLogs]);

  // Get logs by status
  const getLogsByStatus = useCallback((status: string) => {
    return automationLogs.filter(log => log.status === status);
  }, [automationLogs]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    loadAutomations();
  }, [loadAutomations]);

  // Load logs when automations change
  useEffect(() => {
    if (automations.length > 0) {
      loadAutomationLogs();
    }
  }, [automations, loadAutomationLogs]);

  return {
    // State
    automations,
    automationLogs,
    stats,
    settings,
    loading,
    error,

    // Actions
    loadAutomations,
    loadAutomationLogs,
    toggleAutomation,
    updateAutomationSettings,
    updateGlobalSettings,
    clearError,

    // Utilities
    getAutomation,
    getAutomationLogs,
    getLogsByType,
    getLogsByStatus,
  };
}; 