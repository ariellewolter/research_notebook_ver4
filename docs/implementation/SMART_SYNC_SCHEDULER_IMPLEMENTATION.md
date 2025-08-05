# Smart Sync Scheduler Implementation

## Overview

The Smart Sync Scheduler is a sophisticated background task that intelligently manages cloud synchronization in the Research Notebook application. It prioritizes recently edited files, adjusts sync frequency based on user activity, and handles large files during off-peak times to optimize performance and user experience.

## Features

### 🎯 Core Functionality
- **Intelligent Prioritization**: Prioritizes recently edited files first
- **Activity-Based Frequency**: Adjusts sync frequency based on user activity
- **Off-Peak Large File Sync**: Syncs large files during idle times or off-peak hours
- **Configurable Settings**: Comprehensive configuration options per user
- **Real-time Monitoring**: Live status tracking and statistics
- **Retry Mechanism**: Automatic retry with exponential backoff

### 📊 Smart Scheduling
- **Priority Queue**: Files are queued and processed based on calculated priority scores
- **Activity Detection**: Tracks user activity to determine optimal sync timing
- **Time-Based Optimization**: Different sync frequencies for active, idle, and off-peak periods
- **File Size Awareness**: Different handling for small, medium, and large files

### 🎨 User Interface
- **Advanced Settings Panel**: Comprehensive configuration interface
- **Real-time Status**: Live monitoring of scheduler status and queue
- **Statistics Dashboard**: Detailed sync statistics and performance metrics
- **Queue Management**: View and manage sync queue items

## Implementation Details

### Component Structure

```
electron/utils/
├── syncScheduler.js (Main scheduler implementation)
├── syncSchedulerIPC.js (IPC handlers for main process)
└── fileUtils.js (File utilities)

apps/frontend/src/components/CloudSync/
├── AdvancedSyncSettings.tsx (Configuration UI)
└── index.ts (Component exports)
```

### Key Components

#### 1. SmartSyncScheduler Class
The main scheduler class that manages all sync operations.

**Core Features:**
- Priority-based queue management
- Activity tracking and frequency adjustment
- Off-peak time detection
- Retry logic with exponential backoff
- Statistics tracking and reporting

**Configuration:**
```javascript
const settings = {
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
```

#### 2. SyncSchedulerIPC Class
Handles communication between the main process and renderer process.

**IPC Handlers:**
- Scheduler control (start, stop, pause, resume)
- Queue management (add, remove, clear, get)
- Settings management (get, update)
- Statistics and monitoring (stats, history)
- Activity tracking

#### 3. AdvancedSyncSettings Component
React component providing comprehensive configuration interface.

**Features:**
- Scheduler control panel
- Priority weight configuration
- Off-peak hours setup
- Retry settings
- Real-time statistics display
- Queue and history monitoring

## Priority System

### Priority Calculation

The scheduler calculates priority scores based on multiple factors:

```javascript
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
```

### Priority Factors

1. **Recently Edited**: Files marked as recently edited get highest priority
2. **File Size**: Smaller files are prioritized over larger ones
3. **Time Context**: Large files get bonus priority during off-peak hours
4. **Activity State**: Large files get bonus priority when user is idle

## Activity-Based Frequency Adjustment

### Sync Frequencies

The scheduler adjusts sync frequency based on user activity:

```javascript
const syncFrequency = {
  active: 30 * 1000,    // 30 seconds when active
  idle: 5 * 60 * 1000,  // 5 minutes when idle
  offPeak: 15 * 60 * 1000 // 15 minutes during off-peak
};
```

### Activity Detection

- **Active Period**: User is actively using the application
- **Idle Period**: No user activity detected for 5 minutes
- **Off-Peak Period**: Configured off-peak hours (default: 10 PM - 6 AM)

## Off-Peak Large File Handling

### Off-Peak Detection

```javascript
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
```

### Large File Strategy

- **During Peak Hours**: Large files get lower priority
- **During Off-Peak**: Large files get bonus priority
- **During Idle**: Large files get moderate priority boost

## Configuration Options

### Basic Settings

```typescript
interface SyncSchedulerSettings {
  enabled: boolean;                    // Enable/disable scheduler
  maxConcurrentSyncs: number;         // Maximum concurrent sync operations
  largeFileThreshold: number;         // Threshold for large file classification
  maxQueueSize: number;               // Maximum queue size
}
```

### Priority Weights

```typescript
interface PriorityWeights {
  recentlyEdited: number;             // Weight for recently edited files
  smallFiles: number;                 // Weight for files < 1MB
  mediumFiles: number;                // Weight for files 1MB - 10MB
  largeFiles: number;                 // Weight for files > 10MB
}
```

### Off-Peak Configuration

```typescript
interface OffPeakHours {
  start: number;                      // Start hour (0-23)
  end: number;                        // End hour (0-23)
}
```

### Retry Settings

```typescript
interface RetrySettings {
  retryAttempts: number;              // Maximum retry attempts
  retryDelay: number;                 // Base retry delay in milliseconds
}
```

## Usage Guide

### 1. Basic Integration

The scheduler is automatically initialized when the Electron app starts:

```javascript
// In electron/main.js
const syncSchedulerIPC = require('./utils/syncSchedulerIPC');
```

### 2. Adding Files to Sync

```javascript
// From renderer process
await window.electronAPI.syncScheduler.addFile('/path/to/file.txt', {
  fileSize: 1024 * 1024, // 1MB
  recentlyEdited: true,
  priority: 'high'
});
```

### 3. Configuration

```javascript
// Update settings
await window.electronAPI.syncScheduler.updateSettings({
  maxConcurrentSyncs: 5,
  largeFileThreshold: 20 * 1024 * 1024, // 20MB
  offPeakHours: {
    start: 23, // 11 PM
    end: 7     // 7 AM
  }
});
```

### 4. Monitoring

```javascript
// Get scheduler status
const status = await window.electronAPI.syncScheduler.getStatus();

// Get statistics
const stats = await window.electronAPI.syncScheduler.getStats();

// Get queue status
const queue = await window.electronAPI.syncScheduler.getQueue();
```

### 5. Control

```javascript
// Start scheduler
await window.electronAPI.syncScheduler.start();

// Pause scheduler
await window.electronAPI.syncScheduler.pause();

// Stop scheduler
await window.electronAPI.syncScheduler.stop();

// Clear queue
await window.electronAPI.syncScheduler.clearQueue();
```

## Advanced Settings UI

### Component Usage

```typescript
import { AdvancedSyncSettings } from './components/CloudSync/AdvancedSyncSettings';

function SettingsPage() {
  return (
    <div>
      <AdvancedSyncSettings />
    </div>
  );
}
```

### Features

1. **Scheduler Control**: Start, stop, pause, resume scheduler
2. **Priority Configuration**: Adjust priority weights for different file types
3. **Off-Peak Setup**: Configure off-peak hours
4. **Retry Settings**: Configure retry attempts and delays
5. **Real-time Monitoring**: View live statistics and queue status
6. **Queue Management**: View and clear sync queue

## Performance Considerations

### Queue Management

- **Size Limits**: Configurable maximum queue size to prevent memory issues
- **Priority Sorting**: Efficient sorting algorithm for queue prioritization
- **Concurrent Processing**: Configurable number of concurrent sync operations

### Resource Usage

- **Memory Management**: Automatic cleanup of completed sync operations
- **CPU Optimization**: Efficient scheduling algorithms
- **Network Optimization**: Intelligent timing to minimize network impact

### Error Handling

- **Retry Logic**: Exponential backoff for failed operations
- **Error Recovery**: Graceful handling of sync failures
- **Logging**: Comprehensive logging for debugging and monitoring

## Statistics and Monitoring

### Available Statistics

```typescript
interface SyncSchedulerStats {
  totalSynced: number;                // Total successful syncs
  totalFailed: number;                // Total failed syncs
  averageSyncTime: number;            // Average sync time in milliseconds
  lastSyncTime: number | null;        // Timestamp of last sync
  queueSize: number;                  // Current queue size
  isRunning: boolean;                 // Scheduler running status
  isActive: boolean;                  // User activity status
  isOffPeak: boolean;                 // Off-peak time status
  currentFrequency: number;           // Current sync frequency
}
```

### Monitoring Features

1. **Real-time Updates**: Statistics update every 5 seconds
2. **Queue Monitoring**: View current queue items and priorities
3. **History Tracking**: Track sync history and success rates
4. **Performance Metrics**: Monitor average sync times and throughput

## Integration with Existing Systems

### Auto-Sync Integration

The smart sync scheduler works seamlessly with the existing auto-sync system:

```javascript
// Auto-sync can add files to the smart scheduler
await window.electronAPI.syncScheduler.addFile(filePath, {
  recentlyEdited: true,
  fileSize: fileSize,
  priority: 'high'
});
```

### Cloud Sync Integration

The scheduler integrates with the cloud sync system:

```javascript
// Scheduler can trigger cloud sync operations
const syncResult = await performCloudSync(filePath, options);
```

## Testing

### Manual Testing

1. **Priority Testing**: Create files of different sizes and edit states
2. **Activity Testing**: Test frequency changes during active/idle periods
3. **Off-Peak Testing**: Test large file handling during off-peak hours
4. **Retry Testing**: Test retry logic with simulated failures

### Automated Testing

```javascript
// Test priority calculation
describe('Priority Calculation', () => {
  it('should prioritize recently edited files', () => {
    const priority = scheduler.calculatePriority({
      recentlyEdited: true,
      fileSize: 1024
    });
    expect(priority).toBeGreaterThan(10);
  });
});
```

## Troubleshooting

### Common Issues

1. **Scheduler Not Starting**
   - Check if scheduler is enabled in settings
   - Verify Electron app permissions
   - Check console logs for errors

2. **Files Not Syncing**
   - Verify file paths are accessible
   - Check queue size limits
   - Review priority settings

3. **Performance Issues**
   - Adjust maxConcurrentSyncs setting
   - Review priority weights
   - Check off-peak configuration

### Debug Mode

Enable debug logging:

```javascript
// Add to scheduler configuration
const config = {
  debug: true,
  // ... other settings
};
```

## Future Enhancements

### Planned Features

1. **Machine Learning**: Learn user patterns for better scheduling
2. **Bandwidth Optimization**: Adjust sync frequency based on network conditions
3. **Selective Sync**: Choose specific folders or file types for sync
4. **Sync Scheduling**: Schedule syncs for specific times
5. **Advanced Analytics**: Detailed performance analytics and reporting

### API Extensions

1. **Webhook Support**: Real-time sync notifications
2. **Custom Schedulers**: Support for custom scheduling algorithms
3. **Advanced Filtering**: Filter files by type, size, or modification date
4. **Sync Policies**: Configurable sync rules and policies 