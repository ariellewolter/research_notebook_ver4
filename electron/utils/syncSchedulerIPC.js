const { ipcMain } = require('electron');
const syncScheduler = require('./syncScheduler');

/**
 * IPC Handlers for Smart Sync Scheduler
 * 
 * Provides communication between the main process and renderer process
 * for managing the smart sync scheduler functionality.
 */

class SyncSchedulerIPC {
    constructor() {
        this.setupIPCHandlers();
    }

    /**
     * Setup all IPC handlers
     */
    setupIPCHandlers() {
        // Scheduler control
        ipcMain.handle('sync-scheduler:get-status', this.getStatus.bind(this));
        ipcMain.handle('sync-scheduler:start', this.start.bind(this));
        ipcMain.handle('sync-scheduler:stop', this.stop.bind(this));
        ipcMain.handle('sync-scheduler:pause', this.pause.bind(this));
        ipcMain.handle('sync-scheduler:resume', this.resume.bind(this));

        // Queue management
        ipcMain.handle('sync-scheduler:add-file', this.addFile.bind(this));
        ipcMain.handle('sync-scheduler:remove-file', this.removeFile.bind(this));
        ipcMain.handle('sync-scheduler:clear-queue', this.clearQueue.bind(this));
        ipcMain.handle('sync-scheduler:get-queue', this.getQueue.bind(this));

        // Settings management
        ipcMain.handle('sync-scheduler:get-settings', this.getSettings.bind(this));
        ipcMain.handle('sync-scheduler:update-settings', this.updateSettings.bind(this));

        // Statistics and monitoring
        ipcMain.handle('sync-scheduler:get-stats', this.getStats.bind(this));
        ipcMain.handle('sync-scheduler:get-history', this.getHistory.bind(this));

        // Activity tracking
        ipcMain.handle('sync-scheduler:track-activity', this.trackActivity.bind(this));
        ipcMain.handle('sync-scheduler:get-activity-status', this.getActivityStatus.bind(this));

        console.log('✅ Sync Scheduler IPC handlers registered');
    }

    /**
     * Get scheduler status
     */
    async getStatus() {
        try {
            return {
                success: true,
                data: syncScheduler.getStatus()
            };
        } catch (error) {
            console.error('Error getting sync scheduler status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Start the scheduler
     */
    async start() {
        try {
            syncScheduler.startScheduler();
            return {
                success: true,
                message: 'Sync scheduler started'
            };
        } catch (error) {
            console.error('Error starting sync scheduler:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stop the scheduler
     */
    async stop() {
        try {
            syncScheduler.stopScheduler();
            return {
                success: true,
                message: 'Sync scheduler stopped'
            };
        } catch (error) {
            console.error('Error stopping sync scheduler:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Pause the scheduler
     */
    async pause() {
        try {
            syncScheduler.pause();
            return {
                success: true,
                message: 'Sync scheduler paused'
            };
        } catch (error) {
            console.error('Error pausing sync scheduler:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Resume the scheduler
     */
    async resume() {
        try {
            syncScheduler.resume();
            return {
                success: true,
                message: 'Sync scheduler resumed'
            };
        } catch (error) {
            console.error('Error resuming sync scheduler:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add file to sync queue
     */
    async addFile(event, filePath, options = {}) {
        try {
            syncScheduler.addFileToSync(filePath, options);
            return {
                success: true,
                message: `File added to sync queue: ${filePath}`
            };
        } catch (error) {
            console.error('Error adding file to sync queue:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Remove file from sync queue
     */
    async removeFile(event, filePath) {
        try {
            syncScheduler.removeFileFromSync(filePath);
            return {
                success: true,
                message: `File removed from sync queue: ${filePath}`
            };
        } catch (error) {
            console.error('Error removing file from sync queue:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Clear sync queue
     */
    async clearQueue() {
        try {
            syncScheduler.clearQueue();
            return {
                success: true,
                message: 'Sync queue cleared'
            };
        } catch (error) {
            console.error('Error clearing sync queue:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get sync queue status
     */
    async getQueue() {
        try {
            return {
                success: true,
                data: syncScheduler.getQueueStatus()
            };
        } catch (error) {
            console.error('Error getting sync queue:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get scheduler settings
     */
    async getSettings() {
        try {
            return {
                success: true,
                data: syncScheduler.settings
            };
        } catch (error) {
            console.error('Error getting sync scheduler settings:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update scheduler settings
     */
    async updateSettings(event, newSettings) {
        try {
            await syncScheduler.updateSettings(newSettings);
            return {
                success: true,
                message: 'Sync scheduler settings updated'
            };
        } catch (error) {
            console.error('Error updating sync scheduler settings:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get scheduler statistics
     */
    async getStats() {
        try {
            return {
                success: true,
                data: syncScheduler.getStats()
            };
        } catch (error) {
            console.error('Error getting sync scheduler stats:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get sync history
     */
    async getHistory() {
        try {
            return {
                success: true,
                data: syncScheduler.getSyncHistory()
            };
        } catch (error) {
            console.error('Error getting sync history:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Track user activity
     */
    async trackActivity(event, activityType = 'general') {
        try {
            // Update activity tracker
            syncScheduler.activityTracker.lastActivity = Date.now();
            syncScheduler.activityTracker.isActive = true;
            
            console.log(`📊 Activity tracked: ${activityType}`);
            
            return {
                success: true,
                message: 'Activity tracked'
            };
        } catch (error) {
            console.error('Error tracking activity:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get activity status
     */
    async getActivityStatus() {
        try {
            return {
                success: true,
                data: {
                    isActive: syncScheduler.activityTracker.isActive,
                    lastActivity: syncScheduler.activityTracker.lastActivity,
                    isOffPeak: syncScheduler.isOffPeakTime(),
                    currentFrequency: syncScheduler.getCurrentSyncFrequency()
                }
            };
        } catch (error) {
            console.error('Error getting activity status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cleanup IPC handlers
     */
    cleanup() {
        // Remove all IPC handlers
        ipcMain.removeHandler('sync-scheduler:get-status');
        ipcMain.removeHandler('sync-scheduler:start');
        ipcMain.removeHandler('sync-scheduler:stop');
        ipcMain.removeHandler('sync-scheduler:pause');
        ipcMain.removeHandler('sync-scheduler:resume');
        ipcMain.removeHandler('sync-scheduler:add-file');
        ipcMain.removeHandler('sync-scheduler:remove-file');
        ipcMain.removeHandler('sync-scheduler:clear-queue');
        ipcMain.removeHandler('sync-scheduler:get-queue');
        ipcMain.removeHandler('sync-scheduler:get-settings');
        ipcMain.removeHandler('sync-scheduler:update-settings');
        ipcMain.removeHandler('sync-scheduler:get-stats');
        ipcMain.removeHandler('sync-scheduler:get-history');
        ipcMain.removeHandler('sync-scheduler:track-activity');
        ipcMain.removeHandler('sync-scheduler:get-activity-status');
        
        console.log('🧹 Sync Scheduler IPC handlers cleaned up');
    }
}

// Export singleton instance
const syncSchedulerIPC = new SyncSchedulerIPC();

module.exports = syncSchedulerIPC; 