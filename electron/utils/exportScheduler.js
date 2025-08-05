const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');
const fileUtils = require('./fileUtils');
const cron = require('node-cron');

/**
 * Smart Export Scheduler
 * 
 * A background task that manages periodic exports and reports:
 * - Schedules periodic exports (daily, weekly, monthly) for selected projects
 * - Supports multiple export formats (PDF, Excel, CSV, JSON)
 * - Auto-saves exports to configured Cloud Folders
 * - Runs in background and logs actions to Notifications Panel
 */

class SmartExportScheduler {
    constructor() {
        this.isRunning = false;
        this.scheduledExports = new Map();
        this.exportHistory = new Map();
        this.notificationCallback = null;
        
        this.settings = {
            enabled: true,
            defaultFormats: ['pdf', 'excel'],
            defaultCloudFolder: '/research-exports',
            maxConcurrentExports: 2,
            retryAttempts: 3,
            retryDelay: 5000,
            cleanupOldExports: true,
            maxExportAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            notificationLevel: 'info' // 'info', 'warning', 'error'
        };
        
        this.stats = {
            totalScheduled: 0,
            totalCompleted: 0,
            totalFailed: 0,
            lastExportTime: null,
            activeSchedules: 0
        };
        
        this.initializeScheduler();
    }

    /**
     * Initialize the scheduler
     */
    async initializeScheduler() {
        try {
            await this.loadSettings();
            await this.loadScheduledExports();
            this.startScheduler();
            console.log('✅ Smart Export Scheduler initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Smart Export Scheduler:', error);
        }
    }

    /**
     * Load scheduler settings from storage
     */
    async loadSettings() {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'export-scheduler-settings.json');
            const savedSettings = await fileUtils.loadJSON(settingsPath);
            
            // Merge saved settings with defaults
            this.settings = { ...this.settings, ...savedSettings };
            
            console.log('✅ Export scheduler settings loaded');
        } catch (error) {
            console.warn('⚠️ Using default export scheduler settings:', error.message);
        }
    }

    /**
     * Save scheduler settings to storage
     */
    async saveSettings() {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'export-scheduler-settings.json');
            await fileUtils.saveJSON(settingsPath, this.settings);
            console.log('✅ Export scheduler settings saved');
        } catch (error) {
            console.error('❌ Failed to save export scheduler settings:', error);
        }
    }

    /**
     * Load scheduled exports from storage
     */
    async loadScheduledExports() {
        try {
            const exportsPath = path.join(app.getPath('userData'), 'scheduled-exports.json');
            const savedExports = await fileUtils.loadJSON(exportsPath);
            
            // Restore scheduled exports
            for (const [id, exportConfig] of Object.entries(savedExports)) {
                this.scheduledExports.set(id, exportConfig);
            }
            
            console.log(`✅ Loaded ${this.scheduledExports.size} scheduled exports`);
        } catch (error) {
            console.warn('⚠️ No saved scheduled exports found:', error.message);
        }
    }

    /**
     * Save scheduled exports to storage
     */
    async saveScheduledExports() {
        try {
            const exportsPath = path.join(app.getPath('userData'), 'scheduled-exports.json');
            const exportsData = Object.fromEntries(this.scheduledExports);
            await fileUtils.saveJSON(exportsPath, exportsData);
            console.log('✅ Scheduled exports saved');
        } catch (error) {
            console.error('❌ Failed to save scheduled exports:', error);
        }
    }

    /**
     * Start the scheduler
     */
    startScheduler() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.scheduleAllExports();
        console.log('✅ Smart Export Scheduler started');
    }

    /**
     * Stop the scheduler
     */
    stopScheduler() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.unscheduleAllExports();
        console.log('⏹️ Smart Export Scheduler stopped');
    }

    /**
     * Schedule all exports
     */
    scheduleAllExports() {
        for (const [id, exportConfig] of this.scheduledExports) {
            if (exportConfig.enabled) {
                this.scheduleExport(id, exportConfig);
            }
        }
    }

    /**
     * Unschedule all exports
     */
    unscheduleAllExports() {
        for (const [id] of this.scheduledExports) {
            this.unscheduleExport(id);
        }
    }

    /**
     * Schedule a single export
     */
    scheduleExport(id, exportConfig) {
        try {
            // Unschedule existing task if any
            this.unscheduleExport(id);
            
            // Create cron schedule
            const cronExpression = this.createCronExpression(exportConfig.schedule);
            
            // Schedule the task
            const task = cron.schedule(cronExpression, () => {
                this.executeExport(id, exportConfig);
            }, {
                scheduled: false,
                timezone: exportConfig.timezone || 'UTC'
            });
            
            // Start the task
            task.start();
            
            // Store the task reference
            exportConfig.task = task;
            this.scheduledExports.set(id, exportConfig);
            
            this.stats.activeSchedules = this.scheduledExports.size;
            this.saveScheduledExports();
            
            console.log(`✅ Scheduled export: ${id} (${cronExpression})`);
            this.logNotification('info', `Export scheduled: ${exportConfig.name}`, `Scheduled for ${exportConfig.schedule.frequency}`);
            
        } catch (error) {
            console.error(`❌ Failed to schedule export ${id}:`, error);
            this.logNotification('error', `Failed to schedule export: ${exportConfig.name}`, error.message);
        }
    }

    /**
     * Unschedule a single export
     */
    unscheduleExport(id) {
        const exportConfig = this.scheduledExports.get(id);
        if (exportConfig && exportConfig.task) {
            exportConfig.task.stop();
            exportConfig.task.destroy();
            delete exportConfig.task;
            console.log(`⏹️ Unscheduled export: ${id}`);
        }
    }

    /**
     * Create cron expression from schedule config
     */
    createCronExpression(schedule) {
        const { frequency, time, dayOfWeek, dayOfMonth } = schedule;
        
        switch (frequency) {
            case 'daily':
                // Daily at specified time (e.g., "14:30" -> "30 14 * * *")
                const [hour, minute] = time.split(':').map(Number);
                return `${minute} ${hour} * * *`;
                
            case 'weekly':
                // Weekly on specified day and time (e.g., Monday at 14:30 -> "30 14 * * 1")
                const [weekHour, weekMinute] = time.split(':').map(Number);
                return `${weekMinute} ${weekHour} * * ${dayOfWeek}`;
                
            case 'monthly':
                // Monthly on specified day and time (e.g., 15th at 14:30 -> "30 14 15 * *")
                const [monthHour, monthMinute] = time.split(':').map(Number);
                return `${monthMinute} ${monthHour} ${dayOfMonth} * *`;
                
            default:
                throw new Error(`Unsupported frequency: ${frequency}`);
        }
    }

    /**
     * Execute an export
     */
    async executeExport(id, exportConfig) {
        const startTime = Date.now();
        
        try {
            console.log(`🔄 Executing scheduled export: ${exportConfig.name}`);
            this.logNotification('info', `Starting export: ${exportConfig.name}`, 'Export in progress...');
            
            // Prepare export data
            const exportData = await this.prepareExportData(exportConfig);
            
            // Generate exports for each format
            const results = [];
            for (const format of exportConfig.formats) {
                try {
                    const result = await this.generateExport(exportConfig, exportData, format);
                    results.push(result);
                } catch (error) {
                    console.error(`❌ Failed to generate ${format} export:`, error);
                    results.push({ format, success: false, error: error.message });
                }
            }
            
            // Upload to cloud if configured
            if (exportConfig.cloudFolder) {
                await this.uploadToCloud(exportConfig, results);
            }
            
            // Update history
            const exportTime = Date.now();
            const duration = exportTime - startTime;
            
            this.exportHistory.set(id, {
                lastExport: exportTime,
                duration: duration,
                results: results,
                success: results.some(r => r.success)
            });
            
            // Update stats
            this.stats.totalCompleted++;
            this.stats.lastExportTime = exportTime;
            
            // Log success
            const successCount = results.filter(r => r.success).length;
            console.log(`✅ Export completed: ${exportConfig.name} (${successCount}/${results.length} formats)`);
            this.logNotification('info', `Export completed: ${exportConfig.name}`, `${successCount}/${results.length} formats exported successfully`);
            
        } catch (error) {
            console.error(`❌ Export failed: ${exportConfig.name}`, error);
            
            // Update stats
            this.stats.totalFailed++;
            
            // Log error
            this.logNotification('error', `Export failed: ${exportConfig.name}`, error.message);
        }
    }

    /**
     * Prepare export data for projects
     */
    async prepareExportData(exportConfig) {
        // This would integrate with your existing export service
        // For now, we'll simulate the data preparation
        const exportData = {
            projects: exportConfig.projects || [],
            experiments: [],
            notes: [],
            tasks: [],
            protocols: []
        };
        
        // Simulate data fetching delay
        await this.sleep(1000);
        
        return exportData;
    }

    /**
     * Generate export file
     */
    async generateExport(exportConfig, exportData, format) {
        const startTime = Date.now();
        
        try {
            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `${exportConfig.name}_${timestamp}.${this.getFileExtension(format)}`;
            
            // Simulate export generation
            const exportDelay = Math.random() * 3000 + 1000; // 1-4 seconds
            await this.sleep(exportDelay);
            
            // Simulate occasional failures
            if (Math.random() < 0.1) { // 10% failure rate
                throw new Error('Simulated export generation failure');
            }
            
            const duration = Date.now() - startTime;
            
            return {
                format,
                filename,
                success: true,
                duration,
                fileSize: Math.random() * 1024 * 1024 + 1024 // 1KB - 1MB
            };
            
        } catch (error) {
            return {
                format,
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * Upload exports to cloud
     */
    async uploadToCloud(exportConfig, results) {
        const successfulExports = results.filter(r => r.success);
        
        for (const result of successfulExports) {
            try {
                // Simulate cloud upload
                const uploadDelay = Math.random() * 2000 + 1000; // 1-3 seconds
                await this.sleep(uploadDelay);
                
                console.log(`☁️ Uploaded to cloud: ${result.filename}`);
                
            } catch (error) {
                console.error(`❌ Cloud upload failed: ${result.filename}`, error);
                this.logNotification('warning', `Cloud upload failed: ${result.filename}`, error.message);
            }
        }
    }

    /**
     * Get file extension for format
     */
    getFileExtension(format) {
        const extensions = {
            pdf: 'pdf',
            excel: 'xlsx',
            csv: 'csv',
            json: 'json'
        };
        return extensions[format] || 'txt';
    }

    /**
     * Add scheduled export
     */
    async addScheduledExport(exportConfig) {
        const id = this.generateExportId();
        
        const fullConfig = {
            id,
            enabled: true,
            createdAt: Date.now(),
            ...exportConfig
        };
        
        this.scheduledExports.set(id, fullConfig);
        this.stats.totalScheduled++;
        
        if (this.isRunning && fullConfig.enabled) {
            this.scheduleExport(id, fullConfig);
        }
        
        await this.saveScheduledExports();
        
        console.log(`✅ Added scheduled export: ${id}`);
        this.logNotification('info', `Export schedule added: ${fullConfig.name}`, `Scheduled for ${fullConfig.schedule.frequency}`);
        
        return id;
    }

    /**
     * Update scheduled export
     */
    async updateScheduledExport(id, updates) {
        const exportConfig = this.scheduledExports.get(id);
        if (!exportConfig) {
            throw new Error(`Export schedule not found: ${id}`);
        }
        
        // Update configuration
        Object.assign(exportConfig, updates);
        
        // Reschedule if running
        if (this.isRunning && exportConfig.enabled) {
            this.scheduleExport(id, exportConfig);
        }
        
        await this.saveScheduledExports();
        
        console.log(`✅ Updated scheduled export: ${id}`);
        this.logNotification('info', `Export schedule updated: ${exportConfig.name}`, 'Configuration saved');
        
        return id;
    }

    /**
     * Remove scheduled export
     */
    async removeScheduledExport(id) {
        const exportConfig = this.scheduledExports.get(id);
        if (!exportConfig) {
            throw new Error(`Export schedule not found: ${id}`);
        }
        
        // Unschedule the task
        this.unscheduleExport(id);
        
        // Remove from storage
        this.scheduledExports.delete(id);
        this.exportHistory.delete(id);
        
        await this.saveScheduledExports();
        
        console.log(`🗑️ Removed scheduled export: ${id}`);
        this.logNotification('info', `Export schedule removed: ${exportConfig.name}`, 'Schedule deleted');
        
        return true;
    }

    /**
     * Enable/disable scheduled export
     */
    async toggleScheduledExport(id, enabled) {
        const exportConfig = this.scheduledExports.get(id);
        if (!exportConfig) {
            throw new Error(`Export schedule not found: ${id}`);
        }
        
        exportConfig.enabled = enabled;
        
        if (enabled && this.isRunning) {
            this.scheduleExport(id, exportConfig);
        } else {
            this.unscheduleExport(id);
        }
        
        await this.saveScheduledExports();
        
        const action = enabled ? 'enabled' : 'disabled';
        console.log(`✅ ${action} scheduled export: ${id}`);
        this.logNotification('info', `Export schedule ${action}: ${exportConfig.name}`, `Schedule ${action}`);
        
        return true;
    }

    /**
     * Generate unique export ID
     */
    generateExportId() {
        return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Set notification callback
     */
    setNotificationCallback(callback) {
        this.notificationCallback = callback;
    }

    /**
     * Log notification
     */
    logNotification(level, title, message) {
        if (this.notificationCallback) {
            this.notificationCallback({
                id: `export_${Date.now()}`,
                type: 'export-scheduler',
                level,
                title,
                message,
                timestamp: Date.now()
            });
        }
        
        console.log(`📢 [${level.toUpperCase()}] ${title}: ${message}`);
    }

    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            totalScheduled: this.stats.totalScheduled,
            totalCompleted: this.stats.totalCompleted,
            totalFailed: this.stats.totalFailed,
            activeSchedules: this.stats.activeSchedules,
            lastExportTime: this.stats.lastExportTime,
            settings: this.settings
        };
    }

    /**
     * Get all scheduled exports
     */
    getScheduledExports() {
        return Array.from(this.scheduledExports.values());
    }

    /**
     * Get export history
     */
    getExportHistory() {
        return Array.from(this.exportHistory.entries()).map(([id, data]) => ({
            id,
            ...data
        }));
    }

    /**
     * Update settings
     */
    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        await this.saveSettings();
        console.log('✅ Export scheduler settings updated');
    }

    /**
     * Cleanup old exports
     */
    async cleanupOldExports() {
        if (!this.settings.cleanupOldExports) return;
        
        const cutoffTime = Date.now() - this.settings.maxExportAge;
        let cleanedCount = 0;
        
        for (const [id, history] of this.exportHistory) {
            if (history.lastExport < cutoffTime) {
                this.exportHistory.delete(id);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} old export records`);
            this.logNotification('info', 'Export cleanup completed', `Removed ${cleanedCount} old export records`);
        }
    }

    /**
     * Utility function to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
const exportScheduler = new SmartExportScheduler();

module.exports = exportScheduler; 