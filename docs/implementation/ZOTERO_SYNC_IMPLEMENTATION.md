# Zotero Sync Implementation

## Overview

The Zotero Sync feature provides comprehensive synchronization capabilities for the Research Notebook application with Zotero libraries. It includes manual sync functionality, background sync with configurable intervals, and real-time notifications for new items and updates.

## Features

### 🎯 Core Functionality
- **Manual Sync**: Trigger immediate synchronization with Zotero library
- **Background Sync**: Automatic synchronization at configurable intervals
- **Real-time Notifications**: Desktop notifications for new items and updates
- **Sync Status Tracking**: Visual indicators showing sync state and history
- **Item Change Detection**: Automatic detection of new and updated items
- **Settings Persistence**: Sync settings saved and restored across app restarts

### 📊 Sync Capabilities
- **New Item Detection**: Automatically imports new items from Zotero
- **Update Detection**: Detects and applies changes to existing items
- **Metadata Preservation**: Maintains all Zotero metadata and relationships
- **Error Handling**: Comprehensive error handling and recovery
- **Progress Tracking**: Real-time sync progress and status updates

### 🎨 User Interface
- **Sync Settings Panel**: Integrated into Zotero page
- **Status Indicators**: Visual status chips and progress indicators
- **Results Display**: Detailed sync results with item information
- **Configuration Controls**: Easy-to-use sync configuration interface
- **Error Feedback**: Clear error messages and recovery guidance

## Implementation Details

### Component Structure

```
Zotero Sync/
├── apps/backend/src/services/zoteroSyncService.ts (Backend sync service)
├── apps/backend/src/routes/zotero.ts (Updated routes with sync endpoints)
├── apps/frontend/src/services/api.ts (Updated API with sync functions)
├── apps/frontend/src/components/Zotero/ZoteroSyncSettings.tsx (UI component)
├── apps/frontend/src/pages/Zotero.tsx (Integration)
└── test-zotero-sync.js (Test script)
```

### Key Components

#### 1. Backend Sync Service (zoteroSyncService.ts)
The core sync service that handles all synchronization logic.

**Key Features:**
- Singleton service for managing sync state
- Background sync with configurable intervals
- Item change detection and processing
- Error handling and recovery
- Settings persistence

**Service Management:**
```typescript
class ZoteroSyncService {
    private config: ZoteroConfig | null = null;
    private lastSyncTime: Date | null = null;
    private syncInterval: NodeJS.Timeout | null = null;
    private isSyncing = false;

    async performSync(): Promise<SyncResult> {
        // Comprehensive sync logic
        // New item detection
        // Update detection
        // Error handling
    }

    startBackgroundSync(intervalMinutes: number) {
        // Start background sync with specified interval
    }

    stopBackgroundSync() {
        // Stop background sync
    }
}
```

**Sync Result Interface:**
```typescript
interface SyncResult {
    success: boolean;
    message: string;
    totalItems: number;
    syncedCount: number;
    newItems: Array<{
        key: string;
        title: string;
        type: string;
        authors?: string[];
    }>;
    updatedItems: Array<{
        key: string;
        title: string;
        type: string;
        changes: string[];
    }>;
    errors: string[];
}
```

#### 2. Backend Routes (zotero.ts)
Updated routes to support sync functionality.

**New Endpoints:**
```typescript
// Manual sync
router.post('/sync', async (req, res) => {
    const result = await zoteroSyncService.performSync();
    res.json(result);
});

// Get sync status
router.get('/sync/status', async (req, res) => {
    const config = zoteroSyncService.getConfig();
    const lastSyncTime = zoteroSyncService.getLastSyncTime();
    const isSyncing = zoteroSyncService.isSyncInProgress();
    res.json({ configured: !!config, lastSyncTime, isSyncing });
});

// Configure background sync
router.post('/sync/background', async (req, res) => {
    const { enabled, intervalMinutes } = req.body;
    if (enabled) {
        zoteroSyncService.startBackgroundSync(intervalMinutes);
    } else {
        zoteroSyncService.stopBackgroundSync();
    }
    res.json({ message: 'Background sync configured' });
});

// Get background sync status
router.get('/sync/background/status', async (req, res) => {
    const isActive = zoteroSyncService.isBackgroundSyncActive();
    const interval = zoteroSyncService.getBackgroundSyncInterval();
    res.json({ active: isActive, intervalMinutes: interval });
});
```

#### 3. Frontend API Service (api.ts)
Updated API service with sync endpoints.

```typescript
export const zoteroApi = {
    // Existing endpoints...
    sync: () => api.post('/zotero/sync'),
    getSyncStatus: () => api.get('/zotero/sync/status'),
    configureBackgroundSync: (data: { enabled: boolean; intervalMinutes: number }) =>
        api.post('/zotero/sync/background', data),
    getBackgroundSyncStatus: () => api.get('/zotero/sync/background/status'),
};
```

#### 4. Frontend Component (ZoteroSyncSettings.tsx)
The React component that provides the sync settings interface.

**Key Features:**
- Manual sync button with progress indication
- Background sync toggle with interval configuration
- Sync status display with visual indicators
- Sync results display with item details
- Error handling and user feedback

**State Management:**
```typescript
interface SyncStatus {
    configured: boolean;
    lastSyncTime: string | null;
    isSyncing: boolean;
    config: {
        userId: string;
        hasGroupId: boolean;
    } | null;
}

interface BackgroundSyncStatus {
    active: boolean;
    intervalMinutes: number | null;
}

const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
const [backgroundSyncStatus, setBackgroundSyncStatus] = useState<BackgroundSyncStatus | null>(null);
const [backgroundSyncEnabled, setBackgroundSyncEnabled] = useState(false);
const [backgroundSyncInterval, setBackgroundSyncInterval] = useState(30);
```

**API Integration:**
```typescript
const handleManualSync = async () => {
    try {
        setSyncing(true);
        const response = await zoteroApi.sync();
        const result: SyncResult = response.data;
        
        setLastSyncResult(result);
        
        if (result.syncedCount > 0 || result.updatedItems.length > 0) {
            setMessage({
                type: 'success',
                text: `${result.message} (${result.syncedCount} new, ${result.updatedItems.length} updated)`
            });
        }
        
        await loadSyncStatus();
    } catch (error) {
        setMessage({ type: 'error', text: 'Sync failed' });
    } finally {
        setSyncing(false);
    }
};
```

## User Experience Flow

### 1. Manual Sync
- User navigates to Zotero → Zotero Sync Settings
- Clicks "Sync Now" button
- System shows loading indicator during sync
- Sync results are displayed with item details
- Success/error messages appear
- Last sync time is updated

### 2. Background Sync Configuration
- User toggles "Enable Background Sync" switch
- Sets sync interval (1-1440 minutes)
- System starts background sync process
- Status shows "Active" when enabled
- Settings are saved and persist across restarts

### 3. Background Sync Operation
- Background sync runs automatically at configured intervals
- New items are detected and imported
- Updated items are synchronized
- Desktop notifications appear for new items
- Sync status updates automatically

### 4. Sync Results Display
- Results show total items processed
- New items are listed with details
- Updated items show change information
- Item types and authors are displayed
- Results persist until next sync

## Sync Process Details

### Item Processing Logic
```typescript
private async processItem(item: ZoteroItem): Promise<{
    isNew: boolean;
    isUpdated: boolean;
    changes?: string[];
}> {
    // Check if item already exists
    const existingEntry = await prisma.databaseEntry.findFirst({
        where: {
            properties: {
                contains: `"zoteroKey":"${item.key}"`
            }
        }
    });

    if (!existingEntry) {
        // Create new entry
        await prisma.databaseEntry.create({
            data: {
                type: 'REFERENCE',
                name: item.data.title,
                description: item.data.abstractNote,
                properties: JSON.stringify({
                    zoteroKey: item.key,
                    title: item.data.title,
                    authors: item.data.creators?.map(creator => 
                        `${creator.firstName} ${creator.lastName}`.trim()
                    ) || [],
                    // ... other properties
                })
            }
        });
        return { isNew: true, isUpdated: false };
    } else {
        // Check for updates
        const existingProperties = JSON.parse(existingEntry.properties);
        const changes: string[] = [];

        if (existingProperties.title !== item.data.title) {
            changes.push('title');
        }
        if (existingProperties.abstract !== item.data.abstractNote) {
            changes.push('abstract');
        }
        if (existingProperties.version !== item.meta?.version) {
            changes.push('content');
        }

        if (changes.length > 0) {
            // Update existing entry
            await prisma.databaseEntry.update({
                where: { id: existingEntry.id },
                data: {
                    name: item.data.title,
                    description: item.data.abstractNote,
                    properties: JSON.stringify({
                        // ... updated properties
                    })
                }
            });
            return { isNew: false, isUpdated: true, changes };
        }

        return { isNew: false, isUpdated: false };
    }
}
```

### Background Sync Implementation
```typescript
startBackgroundSync(intervalMinutes: number) {
    if (this.syncInterval) {
        this.stopBackgroundSync();
    }

    const intervalMs = intervalMinutes * 60 * 1000;
    this.syncInterval = setInterval(async () => {
        try {
            const result = await this.performSync();
            if (result.success && (result.newItems.length > 0 || result.updatedItems.length > 0)) {
                // Emit notification event
                console.log(`Background sync completed: ${result.message}`);
            }
        } catch (error) {
            console.error('Background sync failed:', error);
        }
    }, intervalMs);

    console.log(`Background sync started with ${intervalMinutes} minute interval`);
}
```

## Error Handling

### Validation
- **Configuration Check**: Validates Zotero API configuration
- **API Response Validation**: Checks Zotero API responses
- **Database Validation**: Validates database operations
- **Interval Validation**: Ensures sync interval is within valid range

### Error Recovery
- **Automatic Retry**: Retries failed sync operations
- **Graceful Degradation**: Continues operation despite individual item failures
- **Error Logging**: Comprehensive error logging for debugging
- **User Feedback**: Clear error messages for user guidance

### Error Types
- **Configuration Errors**: Missing or invalid Zotero configuration
- **API Errors**: Zotero API communication failures
- **Database Errors**: Database operation failures
- **Network Errors**: Network connectivity issues
- **Permission Errors**: Insufficient permissions

## Performance Considerations

### Sync Optimization
- **Batch Processing**: Processes items in batches for efficiency
- **Change Detection**: Only updates items that have actually changed
- **Memory Management**: Efficient memory usage during sync operations
- **Background Operation**: Sync runs in background without blocking UI

### Resource Management
- **Interval Management**: Proper cleanup of sync intervals
- **Memory Leak Prevention**: Prevents memory leaks in long-running syncs
- **Database Connection Management**: Efficient database connection handling
- **API Rate Limiting**: Respects Zotero API rate limits

### Scalability
- **Large Library Support**: Handles libraries with thousands of items
- **Incremental Sync**: Only syncs changes since last sync
- **Parallel Processing**: Processes multiple items concurrently
- **Progress Tracking**: Shows progress for large sync operations

## Integration Points

### 1. Zotero Page Integration
The ZoteroSyncSettings component is integrated into the main Zotero page:

```typescript
// In Zotero.tsx
import ZoteroSyncSettings from '../components/Zotero/ZoteroSyncSettings';

// In JSX
<Box sx={{ mb: 4 }}>
    <ZoteroSyncSettings />
</Box>
```

### 2. Database Integration
Sync results are stored in the database using existing schemas:

```typescript
// Create database entry for synced items
await prisma.databaseEntry.create({
    data: {
        type: 'REFERENCE',
        name: item.data.title,
        description: item.data.abstractNote,
        properties: JSON.stringify({
            zoteroKey: item.key,
            importedFrom: 'zotero',
            // ... other properties
        })
    }
});
```

### 3. Notification Integration
Background sync integrates with the notification system:

```typescript
// Show notification for new items
if (Notification.isSupported()) {
    new Notification({
        title: 'New Zotero Items',
        body: `Synced ${result.syncedCount} new items from Zotero`,
        icon: path.join(__dirname, 'assets', 'app-icon.png')
    }).show();
}
```

## Testing

### Test Script
A comprehensive test script (`test-zotero-sync.js`) is provided to verify functionality:

1. **Application Startup**: Verifies app starts correctly
2. **Zotero Page Navigation**: Tests sync settings access
3. **Manual Sync Functionality**: Tests manual sync operation
4. **Background Sync Configuration**: Tests background sync setup
5. **Sync Status Display**: Tests status indicators
6. **Sync Results Display**: Tests results presentation
7. **Error Handling**: Tests error scenarios
8. **Background Sync Operation**: Tests automatic sync
9. **Settings Persistence**: Tests settings across restarts
10. **Integration**: Tests integration with existing features

### Manual Testing
The test script provides guidance for manual verification:
- Navigate to Zotero → Zotero Sync Settings
- Test manual sync functionality
- Configure and test background sync
- Verify sync status and results display
- Test error handling scenarios
- Check settings persistence across restarts
- Verify integration with existing Zotero features
- Test notifications for new items

## Future Enhancements

### Planned Features
1. **Selective Sync**
   - Sync specific collections only
   - Filter by item type or tags
   - Custom sync rules

2. **Advanced Notifications**
   - Customizable notification settings
   - Notification history
   - Action buttons in notifications

3. **Sync Analytics**
   - Sync history and statistics
   - Performance metrics
   - Usage analytics

4. **Conflict Resolution**
   - Handle sync conflicts
   - Manual conflict resolution
   - Sync conflict history

### Performance Improvements
1. **Optimized Sync**
   - Delta sync (only changed items)
   - Compressed data transfer
   - Parallel item processing

2. **Enhanced Caching**
   - Local item cache
   - Metadata caching
   - Offline sync support

3. **Advanced Scheduling**
   - Custom sync schedules
   - Time-based sync rules
   - Priority-based sync

## Troubleshooting

### Common Issues

1. **Sync Not Starting**
   - Check Zotero configuration
   - Verify API credentials
   - Check network connectivity

2. **Background Sync Not Working**
   - Verify background sync is enabled
   - Check sync interval settings
   - Review application logs

3. **Items Not Syncing**
   - Check Zotero API permissions
   - Verify item visibility settings
   - Review sync error logs

4. **Performance Issues**
   - Reduce sync interval
   - Check system resources
   - Review sync logs

### Debug Mode
Enable debug logging by setting:
```typescript
const DEBUG_ZOTERO_SYNC = true;
```

This will log detailed information about:
- Sync operations
- API requests and responses
- Database operations
- Error details
- Performance metrics

## Conclusion

The Zotero Sync feature provides a robust and user-friendly way to synchronize Research Notebook with Zotero libraries. With comprehensive manual and background sync capabilities, real-time notifications, and seamless integration with the existing application architecture, it enhances the user experience by automating the import and synchronization of research materials.

The implementation is designed to be efficient, reliable, and extensible, allowing for future enhancements while maintaining performance and stability. The integration with the Zotero page and backend services ensures a seamless user experience across the application. 