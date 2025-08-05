const { ipcMain } = require('electron');
const exportScheduler = require('./exportScheduler');

/**
 * IPC Handlers for Smart Export Scheduler
 * 
 * Provides communication between the main process and renderer process
 * for managing the smart export scheduler functionality.
 */

class ExportSchedulerIPC {
    constructor() {
        this.setupIPCHandlers();
    }

    /**
     * Setup all IPC handlers
     */
    setupIPCHandlers() {
        // Scheduler control
        ipcMain.handle('export-scheduler:get-status', this.getStatus.bind(this));
        ipcMain.handle('export-scheduler:start', this.start.bind(this));
        ipcMain.handle('export-scheduler:stop', this.stop.bind(this));

        // Scheduled exports management
        ipcMain.handle('export-scheduler:add-export', this.addExport.bind(this));
        ipcMain.handle('export-scheduler:update-export', this.updateExport.bind(this));
        ipcMain.handle('export-scheduler:remove-export', this.removeExport.bind(this));
        ipcMain.handle('export-scheduler:toggle-export', this.toggleExport.bind(this));
        ipcMain.handle('export-scheduler:get-exports', this.getExports.bind(this));

        // Settings management
        ipcMain.handle('export-scheduler:get-settings', this.getSettings.bind(this));
        ipcMain.handle('export-scheduler:update-settings', this.updateSettings.bind(this));

        // Statistics and monitoring
        ipcMain.handle('export-scheduler:get-stats', this.getStats.bind(this));
        ipcMain.handle('export-scheduler:get-history', this.getHistory.bind(this));

        // Manual export execution
        ipcMain.handle('export-scheduler:execute-export', this.executeExport.bind(this));
        ipcMain.handle('export-scheduler:cleanup-exports', this.cleanupExports.bind(this));

        console.log('✅ Export Scheduler IPC handlers registered');
    }

    /**
     * Get scheduler status
     */
    async getStatus() {
        try {
            return {
                success: true,
                data: exportScheduler.getStatus()
            };
        } catch (error) {
            console.error('Error getting export scheduler status:', error);
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
            exportScheduler.startScheduler();
            return {
                success: true,
                message: 'Export scheduler started'
            };
        } catch (error) {
            console.error('Error starting export scheduler:', error);
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
            exportScheduler.stopScheduler();
            return {
                success: true,
                message: 'Export scheduler stopped'
            };
        } catch (error) {
            console.error('Error stopping export scheduler:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add scheduled export
     */
    async addExport(event, exportConfig) {
        try {
            const id = await exportScheduler.addScheduledExport(exportConfig);
            return {
                success: true,
                data: { id },
                message: `Export schedule added: ${exportConfig.name}`
            };
        } catch (error) {
            console.error('Error adding scheduled export:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update scheduled export
     */
    async updateExport(event, id, updates) {
        try {
            await exportScheduler.updateScheduledExport(id, updates);
            return {
                success: true,
                message: 'Export schedule updated'
            };
        } catch (error) {
            console.error('Error updating scheduled export:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Remove scheduled export
     */
    async removeExport(event, id) {
        try {
            await exportScheduler.removeScheduledExport(id);
            return {
                success: true,
                message: 'Export schedule removed'
            };
        } catch (error) {
            console.error('Error removing scheduled export:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Toggle scheduled export
     */
    async toggleExport(event, id, enabled) {
        try {
            await exportScheduler.toggleScheduledExport(id, enabled);
            return {
                success: true,
                message: `Export schedule ${enabled ? 'enabled' : 'disabled'}`
            };
        } catch (error) {
            console.error('Error toggling scheduled export:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all scheduled exports
     */
    async getExports() {
        try {
            return {
                success: true,
                data: exportScheduler.getScheduledExports()
            };
        } catch (error) {
            console.error('Error getting scheduled exports:', error);
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
                data: exportScheduler.settings
            };
        } catch (error) {
            console.error('Error getting export scheduler settings:', error);
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
            await exportScheduler.updateSettings(newSettings);
            return {
                success: true,
                message: 'Export scheduler settings updated'
            };
        } catch (error) {
            console.error('Error updating export scheduler settings:', error);
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
                data: exportScheduler.getStatus()
            };
        } catch (error) {
            console.error('Error getting export scheduler stats:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get export history
     */
    async getHistory() {
        try {
            return {
                success: true,
                data: exportScheduler.getExportHistory()
            };
        } catch (error) {
            console.error('Error getting export history:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute export manually
     */
    async executeExport(event, id) {
        try {
            const exportConfig = exportScheduler.scheduledExports.get(id);
            if (!exportConfig) {
                throw new Error('Export schedule not found');
            }

            await exportScheduler.executeExport(id, exportConfig);
            return {
                success: true,
                message: 'Export executed successfully'
            };
        } catch (error) {
            console.error('Error executing export:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cleanup old exports
     */
    async cleanupExports() {
        try {
            await exportScheduler.cleanupOldExports();
            return {
                success: true,
                message: 'Export cleanup completed'
            };
        } catch (error) {
            console.error('Error cleaning up exports:', error);
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
        ipcMain.removeHandler('export-scheduler:get-status');
        ipcMain.removeHandler('export-scheduler:start');
        ipcMain.removeHandler('export-scheduler:stop');
        ipcMain.removeHandler('export-scheduler:add-export');
        ipcMain.removeHandler('export-scheduler:update-export');
        ipcMain.removeHandler('export-scheduler:remove-export');
        ipcMain.removeHandler('export-scheduler:toggle-export');
        ipcMain.removeHandler('export-scheduler:get-exports');
        ipcMain.removeHandler('export-scheduler:get-settings');
        ipcMain.removeHandler('export-scheduler:update-settings');
        ipcMain.removeHandler('export-scheduler:get-stats');
        ipcMain.removeHandler('export-scheduler:get-history');
        ipcMain.removeHandler('export-scheduler:execute-export');
        ipcMain.removeHandler('export-scheduler:cleanup-exports');
        
        console.log('🧹 Export Scheduler IPC handlers cleaned up');
    }
}

// Export singleton instance
const exportSchedulerIPC = new ExportSchedulerIPC();

module.exports = exportSchedulerIPC; 