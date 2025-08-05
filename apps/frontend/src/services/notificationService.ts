import { useNotification } from '../hooks/useNotification';

export interface AutomationEvent {
    id: string;
    type: 'import' | 'export' | 'zotero_sync' | 'file_watcher' | 'background_sync' | 'system' | 'sync-conflict' | 'sync-conflict-resolved';
    category: 'file_import' | 'file_export' | 'zotero_sync' | 'file_watcher' | 'background_sync' | 'system' | 'sync_conflict';
    title: string;
    message: string;
    status: 'pending' | 'success' | 'error' | 'warning' | 'info';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    timestamp: Date;
    metadata?: {
        fileCount?: number;
        fileNames?: string[];
        fileTypes?: string[];
        syncCount?: number;
        errorDetails?: string;
        duration?: number;
        source?: string;
        target?: string;
        format?: string;
        options?: string[];
        // Cloud sync specific properties
        syncType?: string;
        cloudService?: string;
        entityType?: string;
        entityCount?: number;
        action?: string;
        quotaType?: string;
        currentUsage?: number;
        limit?: number;
        percentage?: number;
        entityId?: string;
        conflictType?: string;
        resolution?: string;
        note?: string;
    };
    isRead: boolean;
    canRetry?: boolean;
    retryAction?: () => Promise<void>;
}

export interface NotificationLog {
    events: AutomationEvent[];
    unreadCount: number;
    totalCount: number;
}

class NotificationService {
    private events: AutomationEvent[] = [];
    private listeners: Array<(events: AutomationEvent[]) => void> = [];
    private maxEvents = 1000; // Keep last 1000 events

    /**
     * Add an automation event to the notification log
     */
    addEvent(event: Omit<AutomationEvent, 'id' | 'timestamp' | 'isRead'>): string {
        const newEvent: AutomationEvent = {
            ...event,
            id: this.generateId(),
            timestamp: new Date(),
            isRead: false
        };

        this.events.unshift(newEvent); // Add to beginning

        // Keep only the last maxEvents
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(0, this.maxEvents);
        }

        // Notify listeners
        this.notifyListeners();

        return newEvent.id;
    }

    /**
     * Log file import events
     */
    logFileImport(
        status: 'pending' | 'success' | 'error',
        fileCount: number,
        fileNames: string[],
        fileTypes: string[],
        errorDetails?: string,
        duration?: number
    ): string {
        const event: Omit<AutomationEvent, 'id' | 'timestamp' | 'isRead'> = {
            type: 'import',
            category: 'file_import',
            title: this.getImportTitle(status, fileCount),
            message: this.getImportMessage(status, fileCount, fileNames, fileTypes, errorDetails),
            status,
            priority: this.getImportPriority(status),
            metadata: {
                fileCount,
                fileNames,
                fileTypes,
                errorDetails,
                duration
            },
            canRetry: status === 'error',
            retryAction: status === 'error' ? () => this.retryFileImport(fileNames) : undefined
        };

        return this.addEvent(event);
    }

    /**
     * Log file export events
     */
    logFileExport(
        status: 'pending' | 'success' | 'error',
        format: string,
        dataType: string,
        itemCount: number,
        options: string[],
        errorDetails?: string,
        duration?: number
    ): string {
        const event: Omit<AutomationEvent, 'id' | 'timestamp' | 'isRead'> = {
            type: 'export',
            category: 'file_export',
            title: this.getExportTitle(status, format, dataType),
            message: this.getExportMessage(status, format, dataType, itemCount, options, errorDetails),
            status,
            priority: this.getExportPriority(status),
            metadata: {
                fileCount: itemCount,
                format,
                options,
                errorDetails,
                duration,
                source: dataType
            },
            canRetry: status === 'error',
            retryAction: status === 'error' ? () => this.retryFileExport(format, dataType, options) : undefined
        };

        return this.addEvent(event);
    }

    /**
     * Log Zotero sync events
     */
    logZoteroSync(
        status: 'pending' | 'success' | 'error',
        syncType: 'manual' | 'background',
        newItems: number,
        updatedItems: number,
        totalItems: number,
        errorDetails?: string,
        duration?: number
    ): string {
        const event: Omit<AutomationEvent, 'id' | 'timestamp' | 'isRead'> = {
            type: 'zotero_sync',
            category: 'zotero_sync',
            title: this.getZoteroSyncTitle(status, syncType),
            message: this.getZoteroSyncMessage(status, syncType, newItems, updatedItems, totalItems, errorDetails),
            status,
            priority: this.getZoteroSyncPriority(status, syncType),
            metadata: {
                syncCount: newItems + updatedItems,
                errorDetails,
                duration,
                source: 'zotero',
                target: syncType
            },
            canRetry: status === 'error',
            retryAction: status === 'error' ? () => this.retryZoteroSync(syncType) : undefined
        };

        return this.addEvent(event);
    }

    /**
     * Log file watcher events
     */
    logFileWatcher(
        status: 'pending' | 'success' | 'error',
        eventType: 'created' | 'modified' | 'deleted',
        fileName: string,
        fileType: string,
        folderPath: string,
        errorDetails?: string
    ): string {
        const event: Omit<AutomationEvent, 'id' | 'timestamp' | 'isRead'> = {
            type: 'file_watcher',
            category: 'file_watcher',
            title: this.getFileWatcherTitle(status, eventType),
            message: this.getFileWatcherMessage(status, eventType, fileName, fileType, folderPath, errorDetails),
            status,
            priority: this.getFileWatcherPriority(status, eventType),
            metadata: {
                fileNames: [fileName],
                fileTypes: [fileType],
                errorDetails,
                source: folderPath,
                target: eventType
            },
            canRetry: status === 'error',
            retryAction: status === 'error' ? () => this.retryFileWatcher(fileName, folderPath) : undefined
        };

        return this.addEvent(event);
    }

    /**
     * Log background sync events
     */
    logBackgroundSync(
        status: 'pending' | 'success' | 'error',
        syncType: string,
        itemCount: number,
        errorDetails?: string,
        duration?: number
    ): string {
        const event: Omit<AutomationEvent, 'id' | 'timestamp' | 'isRead'> = {
            type: 'background_sync',
            category: 'background_sync',
            title: this.getBackgroundSyncTitle(status, syncType),
            message: this.getBackgroundSyncMessage(status, syncType, itemCount, errorDetails),
            status,
            priority: this.getBackgroundSyncPriority(status),
            metadata: {
                syncCount: itemCount,
                errorDetails,
                duration,
                source: syncType
            },
            canRetry: status === 'error',
            retryAction: status === 'error' ? () => this.retryBackgroundSync(syncType) : undefined
        };

        return this.addEvent(event);
    }

    /**
     * Log cloud sync events
     */
    logCloudSync(
        status: 'pending' | 'success' | 'error' | 'warning' | 'info',
        syncType: 'upload' | 'download' | 'sync' | 'background',
        cloudService: string,
        entityType: string,
        entityCount: number,
        errorDetails?: string,
        duration?: number,
        metadata?: any
    ): string {
        const event: Omit<AutomationEvent, 'id' | 'timestamp' | 'isRead'> = {
            type: 'background_sync',
            category: 'background_sync',
            title: this.getCloudSyncTitle(status, syncType, cloudService),
            message: this.getCloudSyncMessage(status, syncType, cloudService, entityType, entityCount, errorDetails),
            status,
            priority: this.getCloudSyncPriority(status, syncType),
            metadata: {
                syncType,
                cloudService,
                entityType,
                entityCount,
                errorDetails,
                duration,
                ...metadata
            },
            canRetry: status === 'error',
            retryAction: status === 'error' ? () => this.retryCloudSync(syncType, cloudService, entityType) : undefined
        };

        return this.addEvent(event);
    }

    /**
     * Log cloud sync connection events
     */
    logCloudSyncConnection(
        status: 'pending' | 'success' | 'error' | 'warning' | 'info',
        cloudService: string,
        action: 'connect' | 'disconnect' | 'reconnect',
        errorDetails?: string
    ): string {
        const event: Omit<AutomationEvent, 'id' | 'timestamp' | 'isRead'> = {
            type: 'background_sync',
            category: 'background_sync',
            title: this.getCloudSyncConnectionTitle(status, action, cloudService),
            message: this.getCloudSyncConnectionMessage(status, action, cloudService, errorDetails),
            status,
            priority: this.getCloudSyncConnectionPriority(status, action),
            metadata: {
                syncType: 'connection',
                cloudService,
                action,
                errorDetails
            },
            canRetry: status === 'error' && action === 'connect',
            retryAction: status === 'error' && action === 'connect' ? () => this.retryCloudSyncConnection(cloudService) : undefined
        };

        return this.addEvent(event);
    }

    /**
     * Log cloud sync quota/limit events
     */
    logCloudSyncQuota(
        status: 'warning' | 'error',
        cloudService: string,
        quotaType: 'storage' | 'api_calls' | 'bandwidth',
        currentUsage: number,
        limit: number,
        percentage: number
    ): string {
        const event: Omit<AutomationEvent, 'id' | 'timestamp' | 'isRead'> = {
            type: 'background_sync',
            category: 'background_sync',
            title: this.getCloudSyncQuotaTitle(status, quotaType, cloudService),
            message: this.getCloudSyncQuotaMessage(status, quotaType, cloudService, currentUsage, limit, percentage),
            status,
            priority: percentage > 90 ? 'urgent' : 'high',
            metadata: {
                syncType: 'quota',
                cloudService,
                quotaType,
                currentUsage,
                limit,
                percentage
            }
        };

        return this.addEvent(event);
    }

    /**
     * Log system events
     */
    logSystemEvent(
        status: 'pending' | 'success' | 'error' | 'warning' | 'info',
        title: string,
        message: string,
        priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
        metadata?: any
    ): string {
        const event: Omit<AutomationEvent, 'id' | 'timestamp' | 'isRead'> = {
            type: 'system',
            category: 'system',
            title,
            message,
            status,
            priority,
            metadata
        };

        return this.addEvent(event);
    }

    /**
     * Log sync conflict events
     */
    logSyncConflict(
        entityType: string,
        entityTitle: string,
        cloudService: string,
        conflictType: string,
        metadata?: any
    ): string {
        const event: Omit<AutomationEvent, 'id' | 'timestamp' | 'isRead'> = {
            type: 'sync-conflict',
            category: 'sync_conflict',
            title: 'Sync Conflict Detected',
            message: `Conflict detected for ${entityTitle} in ${cloudService}`,
            status: 'warning',
            priority: 'high',
            metadata: {
                entityType,
                entityTitle,
                cloudService,
                conflictType,
                ...metadata
            }
        };

        return this.addEvent(event);
    }

    /**
     * Log sync conflict resolution events
     */
    logSyncConflictResolved(
        entityType: string,
        entityTitle: string,
        cloudService: string,
        resolution: string,
        metadata?: any
    ): string {
        const event: Omit<AutomationEvent, 'id' | 'timestamp' | 'isRead'> = {
            type: 'sync-conflict-resolved',
            category: 'sync_conflict',
            title: 'Conflict Resolved',
            message: `${resolution} for ${entityTitle}`,
            status: 'success',
            priority: 'normal',
            metadata: {
                entityType,
                entityTitle,
                cloudService,
                resolution,
                ...metadata
            }
        };

        return this.addEvent(event);
    }

    /**
     * Mark event as read
     */
    markAsRead(eventId: string): void {
        const event = this.events.find(e => e.id === eventId);
        if (event) {
            event.isRead = true;
            this.notifyListeners();
        }
    }

    /**
     * Mark all events as read
     */
    markAllAsRead(): void {
        this.events.forEach(event => {
            event.isRead = true;
        });
        this.notifyListeners();
    }

    /**
     * Get all events
     */
    getEvents(): AutomationEvent[] {
        return [...this.events];
    }

    /**
     * Get unread events
     */
    getUnreadEvents(): AutomationEvent[] {
        return this.events.filter(event => !event.isRead);
    }

    /**
     * Get events by category
     */
    getEventsByCategory(category: AutomationEvent['category']): AutomationEvent[] {
        return this.events.filter(event => event.category === category);
    }

    /**
     * Get events by status
     */
    getEventsByStatus(status: AutomationEvent['status']): AutomationEvent[] {
        return this.events.filter(event => event.status === status);
    }

    /**
     * Clear all events
     */
    clearEvents(): void {
        this.events = [];
        this.notifyListeners();
    }

    /**
     * Clear events by category
     */
    clearEventsByCategory(category: AutomationEvent['category']): void {
        this.events = this.events.filter(event => event.category !== category);
        this.notifyListeners();
    }

    /**
     * Subscribe to event changes
     */
    subscribe(listener: (events: AutomationEvent[]) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Get notification log summary
     */
    getLogSummary(): NotificationLog {
        return {
            events: this.events,
            unreadCount: this.events.filter(e => !e.isRead).length,
            totalCount: this.events.length
        };
    }

    // Private helper methods

    private generateId(): string {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener([...this.events]));
    }

    // Import event helpers
    private getImportTitle(status: string, fileCount: number): string {
        switch (status) {
            case 'pending':
                return `Importing ${fileCount} file${fileCount !== 1 ? 's' : ''}...`;
            case 'success':
                return `Successfully imported ${fileCount} file${fileCount !== 1 ? 's' : ''}`;
            case 'error':
                return `Failed to import ${fileCount} file${fileCount !== 1 ? 's' : ''}`;
            default:
                return `File import ${status}`;
        }
    }

    private getImportMessage(status: string, fileCount: number, fileNames: string[], fileTypes: string[], errorDetails?: string): string {
        switch (status) {
            case 'pending':
                return `Processing ${fileCount} file${fileCount !== 1 ? 's' : ''} (${fileTypes.join(', ')})`;
            case 'success':
                return `Imported: ${fileNames.slice(0, 3).join(', ')}${fileNames.length > 3 ? ` and ${fileNames.length - 3} more` : ''}`;
            case 'error':
                return `Error: ${errorDetails || 'Unknown error occurred during import'}`;
            default:
                return `Import ${status}`;
        }
    }

    private getImportPriority(status: string): 'low' | 'normal' | 'high' | 'urgent' {
        switch (status) {
            case 'error':
                return 'high';
            case 'pending':
                return 'normal';
            case 'success':
                return 'low';
            default:
                return 'normal';
        }
    }

    // Export event helpers
    private getExportTitle(status: string, format: string, dataType: string): string {
        switch (status) {
            case 'pending':
                return `Exporting ${dataType} as ${format.toUpperCase()}...`;
            case 'success':
                return `Successfully exported ${dataType} as ${format.toUpperCase()}`;
            case 'error':
                return `Failed to export ${dataType} as ${format.toUpperCase()}`;
            default:
                return `Export ${status}`;
        }
    }

    private getExportMessage(status: string, format: string, dataType: string, itemCount: number, options: string[], errorDetails?: string): string {
        switch (status) {
            case 'pending':
                return `Processing ${itemCount} ${dataType} item${itemCount !== 1 ? 's' : ''} with options: ${options.join(', ')}`;
            case 'success':
                return `Exported ${itemCount} ${dataType} item${itemCount !== 1 ? 's' : ''} as ${format.toUpperCase()}`;
            case 'error':
                return `Error: ${errorDetails || 'Unknown error occurred during export'}`;
            default:
                return `Export ${status}`;
        }
    }

    private getExportPriority(status: string): 'low' | 'normal' | 'high' | 'urgent' {
        switch (status) {
            case 'error':
                return 'high';
            case 'pending':
                return 'normal';
            case 'success':
                return 'low';
            default:
                return 'normal';
        }
    }

    // Zotero sync event helpers
    private getZoteroSyncTitle(status: string, syncType: string): string {
        const typeText = syncType === 'manual' ? 'Manual' : 'Background';
        switch (status) {
            case 'pending':
                return `${typeText} Zotero sync in progress...`;
            case 'success':
                return `${typeText} Zotero sync completed`;
            case 'error':
                return `${typeText} Zotero sync failed`;
            default:
                return `Zotero sync ${status}`;
        }
    }

    private getZoteroSyncMessage(status: string, syncType: string, newItems: number, updatedItems: number, totalItems: number, errorDetails?: string): string {
        switch (status) {
            case 'pending':
                return `Syncing ${totalItems} items from Zotero library`;
            case 'success':
                const changes = [];
                if (newItems > 0) changes.push(`${newItems} new`);
                if (updatedItems > 0) changes.push(`${updatedItems} updated`);
                return changes.length > 0 ? `Synced ${changes.join(', ')} items` : 'No changes detected';
            case 'error':
                return `Error: ${errorDetails || 'Unknown error occurred during sync'}`;
            default:
                return `Zotero sync ${status}`;
        }
    }

    private getZoteroSyncPriority(status: string, syncType: string): 'low' | 'normal' | 'high' | 'urgent' {
        switch (status) {
            case 'error':
                return 'high';
            case 'pending':
                return syncType === 'manual' ? 'normal' : 'low';
            case 'success':
                return 'low';
            default:
                return 'normal';
        }
    }

    // File watcher event helpers
    private getFileWatcherTitle(status: string, eventType: string): string {
        const action = eventType === 'created' ? 'detected' : eventType === 'modified' ? 'modified' : 'deleted';
        switch (status) {
            case 'pending':
                return `File ${action}...`;
            case 'success':
                return `File ${action} successfully`;
            case 'error':
                return `Failed to process ${action} file`;
            default:
                return `File watcher ${status}`;
        }
    }

    private getFileWatcherMessage(status: string, eventType: string, fileName: string, fileType: string, folderPath: string, errorDetails?: string): string {
        switch (status) {
            case 'pending':
                return `Processing ${eventType} file: ${fileName} (${fileType})`;
            case 'success':
                return `${fileName} was ${eventType} in ${folderPath}`;
            case 'error':
                return `Error: ${errorDetails || 'Unknown error occurred while processing file'}`;
            default:
                return `File watcher ${status}`;
        }
    }

    private getFileWatcherPriority(status: string, eventType: string): 'low' | 'normal' | 'high' | 'urgent' {
        switch (status) {
            case 'error':
                return 'high';
            case 'pending':
                return 'normal';
            case 'success':
                return eventType === 'created' ? 'normal' : 'low';
            default:
                return 'normal';
        }
    }

    // Background sync event helpers
    private getBackgroundSyncTitle(status: string, syncType: string): string {
        switch (status) {
            case 'pending':
                return `Background ${syncType} sync in progress...`;
            case 'success':
                return `Background ${syncType} sync completed`;
            case 'error':
                return `Background ${syncType} sync failed`;
            default:
                return `Background sync ${status}`;
        }
    }

    private getBackgroundSyncMessage(status: string, syncType: string, itemCount: number, errorDetails?: string): string {
        switch (status) {
            case 'pending':
                return `Processing ${itemCount} items for ${syncType} sync`;
            case 'success':
                return `Successfully synced ${itemCount} items for ${syncType}`;
            case 'error':
                return `Error: ${errorDetails || 'Unknown error occurred during background sync'}`;
            default:
                return `Background sync ${status}`;
        }
    }

    private getBackgroundSyncPriority(status: string): 'low' | 'normal' | 'high' | 'urgent' {
        switch (status) {
            case 'error':
                return 'high';
            case 'pending':
                return 'low';
            case 'success':
                return 'low';
            default:
                return 'normal';
        }
    }

    // Retry action stubs (to be implemented by consumers)
    private async retryFileImport(fileNames: string[]): Promise<void> {
        console.log('Retry file import:', fileNames);
        // Implementation would be provided by the component using this service
    }

    private async retryFileExport(format: string, dataType: string, options: string[]): Promise<void> {
        console.log('Retry file export:', format, dataType, options);
        // Implementation would be provided by the component using this service
    }

    private async retryZoteroSync(syncType: string): Promise<void> {
        console.log('Retry Zotero sync:', syncType);
        // Implementation would be provided by the component using this service
    }

    private async retryFileWatcher(fileName: string, folderPath: string): Promise<void> {
        console.log('Retry file watcher:', fileName, folderPath);
        // Implementation would be provided by the component using this service
    }

    private async retryBackgroundSync(syncType: string): Promise<void> {
        console.log('Retry background sync:', syncType);
        // Implementation would be provided by the component using this service
    }

    private getCloudSyncTitle(status: string, syncType: string, cloudService: string): string {
        const serviceName = this.getServiceDisplayName(cloudService);
        const actionName = this.getSyncTypeDisplayName(syncType);
        
        switch (status) {
            case 'pending':
                return `${actionName} to ${serviceName} - In Progress`;
            case 'success':
                return `${actionName} to ${serviceName} - Completed`;
            case 'error':
                return `${actionName} to ${serviceName} - Failed`;
            case 'warning':
                return `${actionName} to ${serviceName} - Warning`;
            default:
                return `${actionName} to ${serviceName}`;
        }
    }

    private getCloudSyncMessage(
        status: string, 
        syncType: string, 
        cloudService: string, 
        entityType: string, 
        entityCount: number, 
        errorDetails?: string
    ): string {
        const serviceName = this.getServiceDisplayName(cloudService);
        const actionName = this.getSyncTypeDisplayName(syncType);
        const entityName = this.getEntityTypeDisplayName(entityType);
        
        switch (status) {
            case 'pending':
                return `Starting ${actionName.toLowerCase()} of ${entityCount} ${entityName} to ${serviceName}`;
            case 'success':
                return `Successfully ${actionName.toLowerCase()}ed ${entityCount} ${entityName} to ${serviceName}`;
            case 'error':
                return `Failed to ${actionName.toLowerCase()} ${entityCount} ${entityName} to ${serviceName}: ${errorDetails}`;
            case 'warning':
                return `Warning during ${actionName.toLowerCase()} to ${serviceName}: ${errorDetails}`;
            default:
                return `${actionName} operation to ${serviceName}`;
        }
    }

    private getCloudSyncPriority(status: string, syncType: string): 'low' | 'normal' | 'high' | 'urgent' {
        if (status === 'error') return 'high';
        if (status === 'warning') return 'normal';
        if (syncType === 'background') return 'low';
        return 'normal';
    }

    private getCloudSyncConnectionTitle(status: string, action: string, cloudService: string): string {
        const serviceName = this.getServiceDisplayName(cloudService);
        const actionName = action.charAt(0).toUpperCase() + action.slice(1);
        
        switch (status) {
            case 'pending':
                return `${actionName}ing to ${serviceName} - In Progress`;
            case 'success':
                return `${actionName}ed to ${serviceName} - Success`;
            case 'error':
                return `${actionName} to ${serviceName} - Failed`;
            default:
                return `${actionName} to ${serviceName}`;
        }
    }

    private getCloudSyncConnectionMessage(
        status: string, 
        action: string, 
        cloudService: string, 
        errorDetails?: string
    ): string {
        const serviceName = this.getServiceDisplayName(cloudService);
        const actionName = action.charAt(0).toUpperCase() + action.slice(1);
        
        switch (status) {
            case 'pending':
                return `${actionName}ing to ${serviceName}...`;
            case 'success':
                return `Successfully ${actionName.toLowerCase()}ed to ${serviceName}`;
            case 'error':
                return `Failed to ${actionName.toLowerCase()} to ${serviceName}: ${errorDetails}`;
            default:
                return `${actionName} operation to ${serviceName}`;
        }
    }

    private getCloudSyncConnectionPriority(status: string, action: string): 'low' | 'normal' | 'high' | 'urgent' {
        if (status === 'error') return 'high';
        if (action === 'connect') return 'normal';
        return 'low';
    }

    private getCloudSyncQuotaTitle(status: string, quotaType: string, cloudService: string): string {
        const serviceName = this.getServiceDisplayName(cloudService);
        const quotaName = this.getQuotaTypeDisplayName(quotaType);
        
        return `${quotaName} Limit - ${serviceName}`;
    }

    private getCloudSyncQuotaMessage(
        status: string, 
        quotaType: string, 
        cloudService: string, 
        currentUsage: number, 
        limit: number, 
        percentage: number
    ): string {
        const serviceName = this.getServiceDisplayName(cloudService);
        const quotaName = this.getQuotaTypeDisplayName(quotaType);
        
        return `${quotaName} usage for ${serviceName}: ${percentage}% (${currentUsage}/${limit})`;
    }

    private getServiceDisplayName(service: string): string {
        const serviceNames: Record<string, string> = {
            'dropbox': 'Dropbox',
            'google': 'Google Drive',
            'onedrive': 'OneDrive',
            'icloud': 'iCloud'
        };
        return serviceNames[service] || service;
    }

    private getSyncTypeDisplayName(syncType: string): string {
        const syncTypeNames: Record<string, string> = {
            'upload': 'Upload',
            'download': 'Download',
            'sync': 'Sync',
            'background': 'Background Sync'
        };
        return syncTypeNames[syncType] || syncType;
    }

    private getEntityTypeDisplayName(entityType: string): string {
        const entityTypeNames: Record<string, string> = {
            'note': 'notes',
            'project': 'projects',
            'pdf': 'PDFs',
            'file': 'files'
        };
        return entityTypeNames[entityType] || entityType;
    }

    private getQuotaTypeDisplayName(quotaType: string): string {
        const quotaTypeNames: Record<string, string> = {
            'storage': 'Storage',
            'api_calls': 'API Calls',
            'bandwidth': 'Bandwidth'
        };
        return quotaTypeNames[quotaType] || quotaType;
    }

    private async retryCloudSync(syncType: string, cloudService: string, entityType: string): Promise<void> {
        // TODO: Implement retry logic for cloud sync operations
        console.log(`Retrying ${syncType} for ${cloudService} - ${entityType}`);
    }

    private async retryCloudSyncConnection(cloudService: string): Promise<void> {
        // TODO: Implement retry logic for cloud sync connections
        console.log(`Retrying connection to ${cloudService}`);
    }
}

// Export singleton instance
export const notificationService = new NotificationService(); 