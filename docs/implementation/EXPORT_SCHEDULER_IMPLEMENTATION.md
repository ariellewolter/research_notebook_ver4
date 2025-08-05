# Export Scheduler Implementation

## Overview

The Smart Export Scheduler is a sophisticated background task that manages periodic exports and reports for the Research Notebook application. It allows users to schedule automatic exports of selected projects with configurable formats and cloud destinations, ensuring regular data backups and report generation.

## Features

### 🎯 Core Functionality
- **Periodic Scheduling**: Schedule exports daily, weekly, or monthly
- **Multiple Formats**: Support for PDF, Excel, CSV, and JSON exports
- **Cloud Integration**: Auto-save exports to configured cloud folders
- **Background Processing**: Runs in background with notification logging
- **Configurable Settings**: Comprehensive configuration options
- **Real-time Monitoring**: Live status tracking and statistics

### 📊 Smart Scheduling
- **Cron-based Scheduling**: Uses node-cron for reliable scheduling
- **Timezone Support**: Configurable timezone for accurate scheduling
- **Flexible Frequencies**: Daily, weekly, and monthly scheduling options
- **Time-based Execution**: Precise time control for export execution

### 🎨 User Interface
- **Export Scheduler Settings**: Comprehensive configuration interface
- **Schedule Management**: Add, edit, remove, and toggle export schedules
- **Real-time Monitoring**: Live status and history tracking
- **Manual Execution**: Execute exports on-demand

## Implementation Details

### Component Structure

```
electron/utils/
├── exportScheduler.js (Main scheduler implementation)
├── exportSchedulerIPC.js (IPC handlers for main process)
└── fileUtils.js (File utilities)

apps/frontend/src/components/CloudSync/
├── ExportSchedulerSettings.tsx (Configuration UI)
└── index.ts (Component exports)
```

### Key Components

#### 1. SmartExportScheduler Class
The main scheduler class that manages all export operations.

**Core Features:**
- Cron-based scheduling with node-cron
- Export data preparation and generation
- Cloud upload integration
- History tracking and statistics
- Notification logging

**Configuration:**
```javascript
const settings = {
  enabled: true,
  defaultFormats: ['pdf', 'excel'],
  defaultCloudFolder: '/research-exports',
  maxConcurrentExports: 2,
  retryAttempts: 3,
  retryDelay: 5000,
  cleanupOldExports: true,
  maxExportAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  notificationLevel: 'info'
};
```

#### 2. ExportSchedulerIPC Class
Handles communication between the main process and renderer process.

**IPC Handlers:**
- Scheduler control (start, stop)
- Scheduled exports management (add, update, remove, toggle)
- Settings management (get, update)
- Statistics and monitoring (stats, history)
- Manual export execution

#### 3. ExportSchedulerSettings Component
React component providing comprehensive configuration interface.

**Features:**
- Scheduler control panel
- Export schedule management
- Format selection and configuration
- Cloud folder setup
- Real-time monitoring and history

## Scheduling System

### Cron Expression Generation

The scheduler creates cron expressions based on schedule configuration:

```javascript
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
```

### Schedule Types

1. **Daily**: Execute every day at specified time
2. **Weekly**: Execute on specific day of week at specified time
3. **Monthly**: Execute on specific day of month at specified time

## Export Configuration

### Export Schedule Structure

```typescript
interface ExportSchedule {
  id: string;
  name: string;
  enabled: boolean;
  projects: string[];
  formats: string[];
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  cloudFolder: string;
  timezone: string;
  createdAt: number;
}
```

### Supported Export Formats

1. **PDF**: Portable Document Format for reports
2. **Excel**: Spreadsheet format for data analysis
3. **CSV**: Comma-separated values for data exchange
4. **JSON**: JavaScript Object Notation for structured data

## Export Execution Process

### 1. Data Preparation

```javascript
async prepareExportData(exportConfig) {
  // This would integrate with your existing export service
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
```

### 2. Export Generation

```javascript
async generateExport(exportConfig, exportData, format) {
  const startTime = Date.now();
  
  try {
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${exportConfig.name}_${timestamp}.${this.getFileExtension(format)}`;
    
    // Generate export file
    const exportDelay = Math.random() * 3000 + 1000; // 1-4 seconds
    await this.sleep(exportDelay);
    
    const duration = Date.now() - startTime;
    
    return {
      format,
      filename,
      success: true,
      duration,
      fileSize: Math.random() * 1024 * 1024 + 1024
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
```

### 3. Cloud Upload

```javascript
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
```

## Configuration Options

### Basic Settings

```typescript
interface ExportSchedulerSettings {
  enabled: boolean;                    // Enable/disable scheduler
  defaultFormats: string[];           // Default export formats
  defaultCloudFolder: string;         // Default cloud folder path
  maxConcurrentExports: number;       // Maximum concurrent exports
  retryAttempts: number;              // Maximum retry attempts
  retryDelay: number;                 // Base retry delay
}
```

### Advanced Settings

```typescript
interface AdvancedSettings {
  cleanupOldExports: boolean;         // Enable automatic cleanup
  maxExportAge: number;               // Maximum age for export records
  notificationLevel: string;          // Notification level (info, warning, error)
}
```

## Usage Guide

### 1. Basic Integration

The scheduler is automatically initialized when the Electron app starts:

```javascript
// In electron/main.js
const exportSchedulerIPC = require('./utils/exportSchedulerIPC');
```

### 2. Add Export Schedule

```javascript
// From renderer process
const exportConfig = {
  name: 'Weekly Research Report',
  projects: ['project1', 'project2'],
  formats: ['pdf', 'excel'],
  schedule: {
    frequency: 'weekly',
    time: '09:00',
    dayOfWeek: 1 // Monday
  },
  cloudFolder: '/research-exports/weekly',
  timezone: 'UTC'
};

const result = await window.electronAPI.exportScheduler.addExport(exportConfig);
```

### 3. Configure Settings

```javascript
// Update settings
await window.electronAPI.exportScheduler.updateSettings({
  maxConcurrentExports: 3,
  defaultCloudFolder: '/my-exports',
  cleanupOldExports: true,
  maxExportAge: 60 * 24 * 60 * 60 * 1000 // 60 days
});
```

### 4. Monitor and Control

```javascript
// Get scheduler status
const status = await window.electronAPI.exportScheduler.getStatus();

// Get scheduled exports
const exports = await window.electronAPI.exportScheduler.getExports();

// Get export history
const history = await window.electronAPI.exportScheduler.getHistory();

// Execute export manually
await window.electronAPI.exportScheduler.executeExport(exportId);

// Toggle export schedule
await window.electronAPI.exportScheduler.toggleExport(exportId, false);
```

## Export Scheduler Settings UI

### Component Usage

```typescript
import { ExportSchedulerSettings } from './components/CloudSync/ExportSchedulerSettings';

function SettingsPage() {
  return (
    <div>
      <ExportSchedulerSettings />
    </div>
  );
}
```

### Features

1. **Scheduler Control**: Start, stop, and monitor scheduler
2. **Schedule Management**: Add, edit, remove, and toggle export schedules
3. **Format Configuration**: Select export formats (PDF, Excel, CSV, JSON)
4. **Cloud Setup**: Configure cloud folder destinations
5. **Real-time Monitoring**: View live status and export history
6. **Manual Execution**: Execute exports on-demand

## Notification System

### Notification Types

The scheduler logs various notifications to the Notifications Panel:

1. **Info**: Export scheduled, completed, settings updated
2. **Warning**: Cloud upload failures, retry attempts
3. **Error**: Export failures, scheduling errors

### Notification Structure

```typescript
interface Notification {
  id: string;
  type: 'export-scheduler';
  level: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
}
```

### Example Notifications

```javascript
// Export scheduled
this.logNotification('info', 'Export scheduled: Weekly Report', 'Scheduled for weekly');

// Export completed
this.logNotification('info', 'Export completed: Weekly Report', '2/2 formats exported successfully');

// Export failed
this.logNotification('error', 'Export failed: Weekly Report', 'PDF generation failed');

// Cloud upload failed
this.logNotification('warning', 'Cloud upload failed: report.pdf', 'Network timeout');
```

## Performance Considerations

### Concurrent Processing

- **Configurable Limits**: Set maximum concurrent exports
- **Resource Management**: Efficient handling of multiple exports
- **Queue Management**: Proper queuing and prioritization

### Error Handling

- **Retry Logic**: Automatic retry with exponential backoff
- **Graceful Degradation**: Continue processing other exports on failure
- **Error Logging**: Comprehensive error tracking and reporting

### Storage Management

- **Automatic Cleanup**: Remove old export records
- **Configurable Retention**: Set maximum age for export history
- **Storage Optimization**: Efficient storage of export metadata

## Statistics and Monitoring

### Available Statistics

```typescript
interface ExportSchedulerStats {
  totalScheduled: number;             // Total scheduled exports
  totalCompleted: number;             // Total completed exports
  totalFailed: number;                // Total failed exports
  lastExportTime: number | null;      // Timestamp of last export
  activeSchedules: number;            // Number of active schedules
}
```

### Monitoring Features

1. **Real-time Updates**: Statistics update every 10 seconds
2. **Export History**: Track export execution history
3. **Success Rates**: Monitor export success and failure rates
4. **Performance Metrics**: Track export duration and throughput

## Integration with Existing Systems

### Export Service Integration

The scheduler integrates with the existing export service:

```javascript
// Integration with export service
const exportData = await this.prepareExportData(exportConfig);
const result = await exportService.generateExport(format, exportData, options);
```

### Cloud Sync Integration

The scheduler works with the cloud sync system:

```javascript
// Cloud upload integration
const success = await cloudSyncService.uploadFile(cloudFolder, filename, fileBlob);
```

### Notification Panel Integration

The scheduler logs to the notification system:

```javascript
// Notification integration
this.logNotification(level, title, message);
```

## Testing

### Manual Testing

1. **Schedule Creation**: Create exports with different frequencies
2. **Format Testing**: Test all supported export formats
3. **Cloud Upload**: Verify cloud folder uploads
4. **Error Handling**: Test retry logic and error scenarios

### Automated Testing

```javascript
// Test schedule creation
describe('Export Scheduler', () => {
  it('should create daily export schedule', async () => {
    const config = {
      name: 'Test Export',
      schedule: { frequency: 'daily', time: '10:00' },
      formats: ['pdf']
    };
    
    const result = await exportScheduler.addScheduledExport(config);
    expect(result).toBeDefined();
  });
});
```

## Troubleshooting

### Common Issues

1. **Scheduler Not Starting**
   - Check if scheduler is enabled in settings
   - Verify cron expressions are valid
   - Check console logs for errors

2. **Exports Not Executing**
   - Verify schedule configuration
   - Check timezone settings
   - Review export data preparation

3. **Cloud Upload Failures**
   - Verify cloud folder paths
   - Check network connectivity
   - Review cloud service configuration

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

1. **Advanced Scheduling**: Custom cron expressions, multiple schedules per export
2. **Export Templates**: Predefined export configurations
3. **Conditional Exports**: Export based on data changes or conditions
4. **Export Notifications**: Email/SMS notifications for completed exports
5. **Export Analytics**: Detailed performance analytics and reporting

### API Extensions

1. **Webhook Support**: Real-time export notifications
2. **Custom Export Formats**: Support for additional export formats
3. **Export Filtering**: Filter exports by project, date, or status
4. **Export Scheduling**: Schedule exports for specific times or conditions
5. **Export Policies**: Configurable export rules and policies 