import { notificationService } from './notificationService';
import { cloudSyncApi } from './api/cloudSyncApi';
import { zoteroApi } from './api';

export interface SyncStatus {
  service: string;
  lastSyncTime: Date | null;
  isConfigured: boolean;
  isSyncing: boolean;
  hasErrors: boolean;
  errorCount: number;
  lastError?: string;
}

export interface SyncReminderConfig {
  enabled: boolean;
  checkInterval: number; // minutes
  warningThreshold: number; // hours
  criticalThreshold: number; // hours
  errorThreshold: number; // consecutive errors
}

class SyncReminderService {
  private checkInterval: NodeJS.Timeout | null = null;
  private config: SyncReminderConfig = {
    enabled: true,
    checkInterval: 30, // Check every 30 minutes
    warningThreshold: 24, // Warn after 24 hours
    criticalThreshold: 72, // Critical after 72 hours
    errorThreshold: 3 // Alert after 3 consecutive errors
  };

  private syncStatuses: Map<string, SyncStatus> = new Map();
  private errorCounts: Map<string, number> = new Map();

  constructor() {
    this.initializeSyncStatuses();
  }

  private async initializeSyncStatuses() {
    // Initialize sync statuses for different services
    this.syncStatuses.set('cloud', {
      service: 'cloud',
      lastSyncTime: null,
      isConfigured: false,
      isSyncing: false,
      hasErrors: false,
      errorCount: 0
    });

    this.syncStatuses.set('zotero', {
      service: 'zotero',
      lastSyncTime: null,
      isConfigured: false,
      isSyncing: false,
      hasErrors: false,
      errorCount: 0
    });

    // Load initial statuses
    await this.refreshSyncStatuses();
  }

  public async startMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    if (!this.config.enabled) return;

    // Initial check
    await this.checkSyncStatuses();

    // Set up periodic checking
    this.checkInterval = setInterval(async () => {
      await this.checkSyncStatuses();
    }, this.config.checkInterval * 60 * 1000);
  }

  public stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public updateConfig(newConfig: Partial<SyncReminderConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring if config changed
    if (this.config.enabled) {
      this.startMonitoring();
    } else {
      this.stopMonitoring();
    }
  }

  private async refreshSyncStatuses() {
    try {
      // Get cloud sync status
      try {
        const cloudStatus = await cloudSyncApi.getStatus();
        const cloudSyncStatus: SyncStatus = {
          service: 'cloud',
          lastSyncTime: cloudStatus.data.lastSyncTime ? new Date(cloudStatus.data.lastSyncTime) : null,
          isConfigured: cloudStatus.data.configured,
          isSyncing: cloudStatus.data.isSyncing || false,
          hasErrors: cloudStatus.data.hasErrors || false,
          errorCount: this.errorCounts.get('cloud') || 0
        };
        this.syncStatuses.set('cloud', cloudSyncStatus);
      } catch (error) {
        console.error('Failed to get cloud sync status:', error);
        this.incrementErrorCount('cloud');
      }

      // Get Zotero sync status
      try {
        const zoteroStatus = await zoteroApi.getSyncStatus();
        const zoteroSyncStatus: SyncStatus = {
          service: 'zotero',
          lastSyncTime: zoteroStatus.data.lastSyncTime ? new Date(zoteroStatus.data.lastSyncTime) : null,
          isConfigured: zoteroStatus.data.configured,
          isSyncing: zoteroStatus.data.isSyncing || false,
          hasErrors: false, // Zotero doesn't provide error status in the same way
          errorCount: this.errorCounts.get('zotero') || 0
        };
        this.syncStatuses.set('zotero', zoteroSyncStatus);
      } catch (error) {
        console.error('Failed to get Zotero sync status:', error);
        this.incrementErrorCount('zotero');
      }
    } catch (error) {
      console.error('Error refreshing sync statuses:', error);
    }
  }

  private async checkSyncStatuses() {
    await this.refreshSyncStatuses();

    for (const [service, status] of this.syncStatuses) {
      if (!status.isConfigured) continue;

      const hoursSinceLastSync = this.getHoursSinceLastSync(status.lastSyncTime);
      const errorCount = this.errorCounts.get(service) || 0;

      // Check for sync errors
      if (errorCount >= this.config.errorThreshold) {
        await this.createErrorReminder(service, errorCount);
        continue;
      }

      // Check for overdue syncs
      if (hoursSinceLastSync >= this.config.criticalThreshold) {
        await this.createCriticalReminder(service, hoursSinceLastSync);
      } else if (hoursSinceLastSync >= this.config.warningThreshold) {
        await this.createWarningReminder(service, hoursSinceLastSync);
      }
    }
  }

  private getHoursSinceLastSync(lastSyncTime: Date | null): number {
    if (!lastSyncTime) return Infinity;
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    return diffMs / (1000 * 60 * 60);
  }

  private async createWarningReminder(service: string, hoursSinceLastSync: number) {
    const serviceName = this.getServiceDisplayName(service);
    const hours = Math.floor(hoursSinceLastSync);
    
    try {
      // Create backend notification
      const { syncNotificationsApi } = await import('./api/syncNotificationsApi');
      await syncNotificationsApi.createReminder({
        service,
        type: 'warning',
        message: `Your ${serviceName} hasn't been synced for ${hours} hours. Consider syncing soon to keep your data up to date.`,
        hoursSinceLastSync
      });

      // Also log to frontend notification service
      notificationService.logSystemEvent(
        'warning',
        `Sync Reminder: ${serviceName}`,
        `Your ${serviceName} hasn't been synced for ${hours} hours. Consider syncing soon to keep your data up to date.`,
        'normal',
        {
          service,
          hoursSinceLastSync,
          reminderType: 'warning',
          canRetry: true
        }
      );
    } catch (error) {
      console.error('Failed to create warning reminder:', error);
    }
  }

  private async createCriticalReminder(service: string, hoursSinceLastSync: number) {
    const serviceName = this.getServiceDisplayName(service);
    const hours = Math.floor(hoursSinceLastSync);
    
    try {
      // Create backend notification
      const { syncNotificationsApi } = await import('./api/syncNotificationsApi');
      await syncNotificationsApi.createReminder({
        service,
        type: 'critical',
        message: `Your ${serviceName} hasn't been synced for ${hours} hours. This may lead to data loss. Please sync immediately.`,
        hoursSinceLastSync
      });

      // Also log to frontend notification service
      notificationService.logSystemEvent(
        'error',
        `Critical: ${serviceName} Sync Overdue`,
        `Your ${serviceName} hasn't been synced for ${hours} hours. This may lead to data loss. Please sync immediately.`,
        'high',
        {
          service,
          hoursSinceLastSync,
          reminderType: 'critical',
          canRetry: true
        }
      );
    } catch (error) {
      console.error('Failed to create critical reminder:', error);
    }
  }

  private async createErrorReminder(service: string, errorCount: number) {
    const serviceName = this.getServiceDisplayName(service);
    
    try {
      // Create backend notification
      const { syncNotificationsApi } = await import('./api/syncNotificationsApi');
      await syncNotificationsApi.createReminder({
        service,
        type: 'error',
        message: `${serviceName} has encountered ${errorCount} consecutive sync errors. Please check your connection and try again.`,
        errorCount
      });

      // Also log to frontend notification service
      notificationService.logSystemEvent(
        'error',
        `Sync Errors: ${serviceName}`,
        `${serviceName} has encountered ${errorCount} consecutive sync errors. Please check your connection and try again.`,
        'high',
        {
          service,
          errorCount,
          reminderType: 'error',
          canRetry: true
        }
      );
    } catch (error) {
      console.error('Failed to create error reminder:', error);
    }
  }

  private incrementErrorCount(service: string) {
    const currentCount = this.errorCounts.get(service) || 0;
    this.errorCounts.set(service, currentCount + 1);
  }

  public resetErrorCount(service: string) {
    this.errorCounts.set(service, 0);
  }

  public async triggerSync(service: string): Promise<boolean> {
    try {
      this.resetErrorCount(service);
      
      if (service === 'cloud') {
        await cloudSyncApi.sync();
      } else if (service === 'zotero') {
        await zoteroApi.sync();
      }

      // Log successful sync
      const serviceName = this.getServiceDisplayName(service);
      notificationService.logSystemEvent(
        'success',
        `Sync Completed: ${serviceName}`,
        `${serviceName} has been successfully synced.`,
        'normal',
        { service }
      );

      return true;
    } catch (error) {
      console.error(`Failed to trigger sync for ${service}:`, error);
      this.incrementErrorCount(service);
      
      // Log sync failure
      const serviceName = this.getServiceDisplayName(service);
      notificationService.logSystemEvent(
        'error',
        `Sync Failed: ${serviceName}`,
        `Failed to sync ${serviceName}. Please check your connection and try again.`,
        'high',
        { service, error: error.message }
      );

      return false;
    }
  }

  public getSyncStatuses(): Map<string, SyncStatus> {
    return new Map(this.syncStatuses);
  }

  public getConfig(): SyncReminderConfig {
    return { ...this.config };
  }

  private getServiceDisplayName(service: string): string {
    switch (service) {
      case 'cloud':
        return 'Cloud Storage';
      case 'zotero':
        return 'Zotero Library';
      default:
        return service.charAt(0).toUpperCase() + service.slice(1);
    }
  }

  public formatTimeSinceLastSync(lastSyncTime: Date | null): string {
    if (!lastSyncTime) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
  }
}

export const syncReminderService = new SyncReminderService(); 