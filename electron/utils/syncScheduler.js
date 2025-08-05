const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');
const fileUtils = require('./fileUtils');

/**
 * Smart Sync Scheduler
 * 
 * A background task that intelligently manages cloud synchronization:
 * - Prioritizes recently edited files first
 * - Adjusts sync frequency based on user activity
 * - Syncs large files during off-peak times or when app is idle
 * - Configurable per user through Advanced Sync Settings
 */

class SmartSyncScheduler {
    constructor() {
        this.isRunning = false;
        this.syncQueue = [];
        this.syncHistory = new Map();
        this.activityTracker = {
            lastActivity: Date.now(),
            isActive: false,
            activityThreshold: 5 * 60 * 1000, // 5 minutes
            syncFrequency: {
                active: 30 * 1000,    // 30 seconds when active
                idle: 5 * 60 * 1000,  // 5 minutes when idle
                offPeak: 15 * 60 * 1000 // 15 minutes during off-peak
            }
        };
        
        this.settings = {
            enabled: true,
            maxConcurrentSyncs: 3,
            largeFileThreshold: 10 * 1024 * 1024, // 10MB
            offPeakHours: {
                start: 22, // 10 PM
                end: 6     // 6 AM
            },
            priorityWeights: {
                recentlyEdited: 10,
                smallFiles: 5,
                mediumFiles: 3,
                largeFiles: 1
            },
            retryAttempts: 3,
            retryDelay: 5000,
            maxQueueSize: 1000
        };
        
        this.syncWorkers = new Map();
        this.stats = {
            totalSynced: 0,
            totalFailed: 0,
            averageSyncTime: 0,
            lastSyncTime: null
        };
        
        this.initializeScheduler();
    }

    /**
     * Initialize the scheduler
     */
    async initializeScheduler() {
        try {
            await this.loadSettings();
            this.startActivityTracking();
            this.startScheduler();
            console.log('✅ Smart Sync Scheduler initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Smart Sync Scheduler:', error);
        }
    }

    /**
     * Load scheduler settings from storage
     */
    async loadSettings() {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'sync-scheduler-settings.json');
            const savedSettings = await fileUtils.loadJSON(settingsPath);
            
            // Merge saved settings with defaults
            this.settings = { ...this.settings, ...savedSettings };
            
            console.log('✅ Sync scheduler settings loaded');
        } catch (error) {
            console.warn('⚠️ Using default sync scheduler settings:', error.message);
        }
    }

    /**
     * Save scheduler settings to storage
     */
    async saveSettings() {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'sync-scheduler-settings.json');
            await fileUtils.saveJSON(settingsPath, this.settings);
            console.log('✅ Sync scheduler settings saved');
        } catch (error) {
            console.error('❌ Failed to save sync scheduler settings:', error);
        }
    }

    /**
     * Start activity tracking
     */
    startActivityTracking() {
        // Track user activity through various events
        const trackActivity = () => {
            this.activityTracker.lastActivity = Date.now();
            this.activityTracker.isActive = true;
            
            // Reset to idle after threshold
            setTimeout(() => {
                if (Date.now() - this.activityTracker.lastActivity >= this.activityTracker.activityThreshold) {
                    this.activityTracker.isActive = false;
                }
            }, this.activityTracker.activityThreshold);
        };

        // Listen for user activity events
        if (app.isReady()) {
            // Track mouse and keyboard activity
            const { screen } = require('electron');
            const primaryDisplay = screen.getPrimaryDisplay();
            
            // Note: In a real implementation, you'd need to track activity through the renderer process
            // For now, we'll simulate activity tracking
            setInterval(() => {
                // Simulate activity detection
                if (Math.random() > 0.8) { // 20% chance of activity
                    trackActivity();
                }
            }, 10000); // Check every 10 seconds
        }
    }

    /**
     * Start the main scheduler loop
     */
    startScheduler() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.schedulerLoop();
        console.log('✅ Smart Sync Scheduler started');
    }

    /**
     * Stop the scheduler
     */
    stopScheduler() {
        this.isRunning = false;
        console.log('⏹️ Smart Sync Scheduler stopped');
    }

    /**
     * Main scheduler loop
     */
    async schedulerLoop() {
        while (this.isRunning) {
            try {
                await this.processSyncQueue();
                await this.waitForNextCycle();
            } catch (error) {
                console.error('❌ Error in scheduler loop:', error);
                await this.sleep(5000); // Wait 5 seconds before retrying
            }
        }
    }

    /**
     * Process the sync queue
     */
    async processSyncQueue() {
        if (this.syncQueue.length === 0) return;

        // Sort queue by priority
        this.sortQueueByPriority();

        // Process up to maxConcurrentSyncs items
        const itemsToProcess = this.syncQueue.splice(0, this.settings.maxConcurrentSyncs);
        
        const syncPromises = itemsToProcess.map(item => this.processSyncItem(item));
        
        try {
            await Promise.allSettled(syncPromises);
        } catch (error) {
            console.error('❌ Error processing sync queue:', error);
        }
    }

    /**
     * Sort queue by priority
     */
    sortQueueByPriority() {
        this.syncQueue.sort((a, b) => {
            const priorityA = this.calculatePriority(a);
            const priorityB = this.calculatePriority(b);
            return priorityB - priorityA; // Higher priority first
        });
    }

    /**
     * Calculate priority for a sync item
     */
    calculatePriority(item) {
        let priority = 0;

        // Recently edited files get highest priority
        if (item.recentlyEdited) {
            priority += this.settings.priorityWeights.recentlyEdited;
        }

        // File size priority (smaller files get higher priority)
        const fileSize = item.fileSize || 0;
        if (fileSize < 1024 * 1024) { // < 1MB
            priority += this.settings.priorityWeights.smallFiles;
        } else if (fileSize < this.settings.largeFileThreshold) { // < 10MB
            priority += this.settings.priorityWeights.mediumFiles;
        } else { // Large files
            priority += this.settings.priorityWeights.largeFiles;
        }

        // Off-peak bonus for large files
        if (this.isOffPeakTime() && fileSize >= this.settings.largeFileThreshold) {
            priority += 5;
        }

        // Idle time bonus for large files
        if (!this.activityTracker.isActive && fileSize >= this.settings.largeFileThreshold) {
            priority += 3;
        }

        return priority;
    }

    /**
     * Check if current time is off-peak
     */
    isOffPeakTime() {
        const now = new Date();
        const hour = now.getHours();
        
        if (this.settings.offPeakHours.start > this.settings.offPeakHours.end) {
            // Off-peak spans midnight (e.g., 10 PM to 6 AM)
            return hour >= this.settings.offPeakHours.start || hour < this.settings.offPeakHours.end;
        } else {
            // Off-peak within same day
            return hour >= this.settings.offPeakHours.start && hour < this.settings.offPeakHours.end;
        }
    }

    /**
     * Process a single sync item
     */
    async processSyncItem(item) {
        const startTime = Date.now();
        
        try {
            console.log(`🔄 Syncing: ${item.filePath} (Priority: ${this.calculatePriority(item)})`);
            
            // Simulate sync operation
            await this.performSync(item);
            
            // Update stats
            const syncTime = Date.now() - startTime;
            this.updateStats(true, syncTime);
            
            // Update sync history
            this.syncHistory.set(item.filePath, {
                lastSync: Date.now(),
                success: true,
                syncTime: syncTime
            });
            
            console.log(`✅ Synced successfully: ${item.filePath} (${syncTime}ms)`);
            
        } catch (error) {
            console.error(`❌ Sync failed: ${item.filePath}`, error);
            
            // Update stats
            this.updateStats(false, 0);
            
            // Handle retry logic
            await this.handleSyncRetry(item, error);
        }
    }

    /**
     * Perform the actual sync operation
     */
    async performSync(item) {
        // Simulate sync operation with delay based on file size
        const fileSize = item.fileSize || 1024;
        const syncDelay = Math.min(fileSize / (1024 * 1024) * 1000, 10000); // Max 10 seconds
        
        await this.sleep(syncDelay);
        
        // Simulate occasional failures
        if (Math.random() < 0.1) { // 10% failure rate
            throw new Error('Simulated sync failure');
        }
    }

    /**
     * Handle sync retry logic
     */
    async handleSyncRetry(item, error) {
        const retryCount = item.retryCount || 0;
        
        if (retryCount < this.settings.retryAttempts) {
            item.retryCount = retryCount + 1;
            
            // Exponential backoff
            const delay = this.settings.retryDelay * Math.pow(2, retryCount);
            
            console.log(`🔄 Retrying sync in ${delay}ms (attempt ${retryCount + 1}/${this.settings.retryAttempts})`);
            
            setTimeout(() => {
                this.addToQueue(item);
            }, delay);
        } else {
            console.error(`❌ Max retries exceeded for: ${item.filePath}`);
            
            // Update sync history
            this.syncHistory.set(item.filePath, {
                lastSync: Date.now(),
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Add item to sync queue
     */
    addToQueue(item) {
        // Check queue size limit
        if (this.syncQueue.length >= this.settings.maxQueueSize) {
            console.warn('⚠️ Sync queue full, removing oldest item');
            this.syncQueue.shift();
        }
        
        // Add to queue
        this.syncQueue.push({
            ...item,
            addedAt: Date.now(),
            retryCount: item.retryCount || 0
        });
        
        console.log(`📝 Added to sync queue: ${item.filePath} (Queue size: ${this.syncQueue.length})`);
    }

    /**
     * Wait for next scheduler cycle
     */
    async waitForNextCycle() {
        const frequency = this.getCurrentSyncFrequency();
        await this.sleep(frequency);
    }

    /**
     * Get current sync frequency based on activity and time
     */
    getCurrentSyncFrequency() {
        if (this.isOffPeakTime()) {
            return this.activityTracker.syncFrequency.offPeak;
        } else if (this.activityTracker.isActive) {
            return this.activityTracker.syncFrequency.active;
        } else {
            return this.activityTracker.syncFrequency.idle;
        }
    }

    /**
     * Update sync statistics
     */
    updateStats(success, syncTime) {
        if (success) {
            this.stats.totalSynced++;
            this.stats.averageSyncTime = 
                (this.stats.averageSyncTime * (this.stats.totalSynced - 1) + syncTime) / this.stats.totalSynced;
        } else {
            this.stats.totalFailed++;
        }
        
        this.stats.lastSyncTime = Date.now();
    }

    /**
     * Get scheduler statistics
     */
    getStats() {
        return {
            ...this.stats,
            queueSize: this.syncQueue.length,
            isRunning: this.isRunning,
            isActive: this.activityTracker.isActive,
            isOffPeak: this.isOffPeakTime(),
            currentFrequency: this.getCurrentSyncFrequency()
        };
    }

    /**
     * Get sync queue status
     */
    getQueueStatus() {
        return {
            size: this.syncQueue.length,
            items: this.syncQueue.map(item => ({
                filePath: item.filePath,
                priority: this.calculatePriority(item),
                addedAt: item.addedAt,
                retryCount: item.retryCount || 0
            }))
        };
    }

    /**
     * Get sync history
     */
    getSyncHistory() {
        return Array.from(this.syncHistory.entries()).map(([filePath, data]) => ({
            filePath,
            ...data
        }));
    }

    /**
     * Update scheduler settings
     */
    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        await this.saveSettings();
        console.log('✅ Sync scheduler settings updated');
    }

    /**
     * Add file to sync queue
     */
    addFileToSync(filePath, options = {}) {
        const item = {
            filePath,
            fileSize: options.fileSize || 0,
            recentlyEdited: options.recentlyEdited || false,
            priority: options.priority || 'normal',
            ...options
        };
        
        this.addToQueue(item);
    }

    /**
     * Remove file from sync queue
     */
    removeFileFromSync(filePath) {
        const index = this.syncQueue.findIndex(item => item.filePath === filePath);
        if (index !== -1) {
            this.syncQueue.splice(index, 1);
            console.log(`🗑️ Removed from sync queue: ${filePath}`);
        }
    }

    /**
     * Clear sync queue
     */
    clearQueue() {
        this.syncQueue = [];
        console.log('🗑️ Sync queue cleared');
    }

    /**
     * Pause scheduler
     */
    pause() {
        this.isRunning = false;
        console.log('⏸️ Sync scheduler paused');
    }

    /**
     * Resume scheduler
     */
    resume() {
        if (!this.isRunning) {
            this.startScheduler();
        }
    }

    /**
     * Utility function to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            queueSize: this.syncQueue.length,
            isActive: this.activityTracker.isActive,
            isOffPeak: this.isOffPeakTime(),
            currentFrequency: this.getCurrentSyncFrequency(),
            settings: this.settings
        };
    }
}

// Export singleton instance
const syncScheduler = new SmartSyncScheduler();

module.exports = syncScheduler; 