# File Watcher Settings Implementation

## Overview

The File Watcher Settings feature allows users to configure automatic file monitoring in the Research Notebook application. Users can select a local folder to watch for new files, toggle the file watcher on/off, and view the current watched folder path. The system automatically detects file changes and provides notifications for new files.

## Features

### 🎯 Core Functionality
- **Folder Selection**: Choose a local folder to monitor for file changes
- **Enable/Disable Toggle**: Turn file watcher on or off
- **Real-time Monitoring**: Watch for file creation, modification, and deletion
- **Automatic Notifications**: Desktop notifications for new files
- **Settings Persistence**: Settings are saved and restored across app restarts
- **File Type Detection**: Automatic detection of supported file types

### 📁 Supported File Types
- **PDF Documents** (.pdf)
- **CSV Files** (.csv)
- **JSON Files** (.json)
- **Text Files** (.txt, .md)
- **Excel Files** (.xlsx, .xls)

### 🎨 User Interface
- **Settings Integration**: Integrated into the main Settings page
- **Status Indicators**: Visual indicators showing watcher status
- **Folder Path Display**: Shows current watched folder path
- **Test Functionality**: Built-in test to verify watcher is working
- **Error Handling**: Comprehensive error messages and validation

## Implementation Details

### Component Structure

```
File Watcher Settings/
├── electron/main.js (Backend file watcher logic)
├── electron/preload.js (API exposure)
├── apps/frontend/src/components/FileWatcherSettings.tsx (UI component)
├── apps/frontend/src/pages/Settings.tsx (Integration)
└── test-file-watcher.js (Test script)
```

### Key Components

#### 1. Electron Main Process (main.js)
The main process handles the file watcher functionality and IPC communication.

**Key Features:**
- File system monitoring using `fs.watch`
- Settings persistence
- IPC handlers for frontend communication
- File event handling (create, modify, delete)
- Desktop notifications

**File Watcher Management:**
```javascript
// File watcher management
let fileWatcher = null;
let watchedFolderPath = null;
let isFileWatcherEnabled = false;

// Initialize file watcher
function initializeFileWatcher() {
    const settings = loadFileWatcherSettings();
    isFileWatcherEnabled = settings.enabled;
    watchedFolderPath = settings.folderPath;
    
    if (isFileWatcherEnabled && watchedFolderPath) {
        startFileWatcher(watchedFolderPath);
    }
}
```

**File Event Handling:**
```javascript
// Handle file created event
function handleFileCreated(filePath) {
    console.log('File created:', filePath);
    
    // Check if it's a supported file type
    const supportedExtensions = ['.pdf', '.csv', '.json', '.txt', '.md', '.xlsx', '.xls'];
    const ext = path.extname(filePath).toLowerCase();
    
    if (supportedExtensions.includes(ext)) {
        // Show notification
        if (Notification.isSupported()) {
            new Notification({
                title: 'New File Detected',
                body: `File created: ${path.basename(filePath)}`,
                icon: path.join(__dirname, 'assets', 'app-icon.png')
            }).show();
        }
    }
}
```

#### 2. IPC Handlers
The main process exposes several IPC handlers for frontend communication:

```javascript
// Get file watcher status
ipcMain.handle('file-watcher:get-status', async () => {
    return {
        success: true,
        enabled: isFileWatcherEnabled,
        folderPath: watchedFolderPath,
        isWatching: fileWatcher !== null
    };
});

// Enable/disable file watcher
ipcMain.handle('file-watcher:set-enabled', async (event, enabled) => {
    isFileWatcherEnabled = enabled;
    
    if (enabled && watchedFolderPath) {
        const success = startFileWatcher(watchedFolderPath);
        if (!success) {
            isFileWatcherEnabled = false;
            return { success: false, error: 'Failed to start file watcher' };
        }
    } else if (!enabled) {
        stopFileWatcher();
    }
    
    saveFileWatcherSettings();
    return { success: true, enabled: isFileWatcherEnabled, folderPath: watchedFolderPath };
});

// Set watched folder
ipcMain.handle('file-watcher:set-folder', async (event, folderPath) => {
    // Validate folder path
    if (!fs.existsSync(folderPath)) {
        return { success: false, error: 'Folder does not exist' };
    }
    
    const stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) {
        return { success: false, error: 'Path is not a directory' };
    }
    
    watchedFolderPath = folderPath;
    
    // Start watcher if enabled
    if (isFileWatcherEnabled) {
        const success = startFileWatcher(folderPath);
        if (!success) {
            return { success: false, error: 'Failed to start file watcher' };
        }
    }
    
    saveFileWatcherSettings();
    return { success: true, enabled: isFileWatcherEnabled, folderPath: watchedFolderPath };
});
```

#### 3. Preload Script (preload.js)
Exposes safe APIs to the renderer process:

```javascript
// File watcher APIs
getFileWatcherStatus: () => ipcRenderer.invoke('file-watcher:get-status'),
setFileWatcherEnabled: (enabled) => ipcRenderer.invoke('file-watcher:set-enabled', enabled),
setFileWatcherFolder: (folderPath) => ipcRenderer.invoke('file-watcher:set-folder', folderPath),
selectFileWatcherFolder: () => ipcRenderer.invoke('file-watcher:select-folder'),
getSupportedFileTypes: () => ipcRenderer.invoke('file-watcher:get-supported-types'),
testFileWatcher: () => ipcRenderer.invoke('file-watcher:test'),
onFileWatcherEvent: (callback) => ipcRenderer.on('file-watcher-event', callback),
removeFileWatcherEventListener: () => ipcRenderer.removeAllListeners('file-watcher-event'),
```

#### 4. Frontend Component (FileWatcherSettings.tsx)
The React component that provides the user interface.

**Key Features:**
- Status display with visual indicators
- Enable/disable toggle switch
- Folder selection with dialog
- Test functionality
- Supported file types display
- Error handling and user feedback

**State Management:**
```typescript
interface FileWatcherStatus {
    enabled: boolean;
    folderPath: string | null;
    isWatching: boolean;
}

const [status, setStatus] = useState<FileWatcherStatus>({
    enabled: false,
    folderPath: null,
    isWatching: false
});
```

**API Integration:**
```typescript
const loadFileWatcherStatus = async () => {
    try {
        setLoading(true);
        const result = await (window as any).electronAPI.getFileWatcherStatus();
        if (result.success) {
            setStatus(result);
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to load file watcher status' });
        }
    } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load file watcher status' });
    } finally {
        setLoading(false);
    }
};
```

## User Experience Flow

### 1. Settings Access
- User navigates to Settings page
- File Watcher Settings section is visible
- Current status is displayed (Disabled/Watching/Not Watching)

### 2. Enable File Watcher
- User toggles "Enable File Watcher" switch
- System validates current configuration
- Status updates to reflect new state
- Success/error message appears

### 3. Folder Selection
- User clicks "Select" button
- Folder selection dialog opens
- User chooses a folder to watch
- Folder path is displayed in text field
- Clear button appears for folder management

### 4. Testing
- User clicks "Test File Watcher" button
- System creates a test file in watched folder
- Test file is automatically removed after 2 seconds
- Success message confirms watcher is working

### 5. File Detection
- When files are added to watched folder
- Desktop notifications appear
- Files are logged and processed
- Different file types are handled appropriately

## Settings Persistence

### Storage Location
Settings are stored in a JSON file:
- **Development**: `electron/settings.json`
- **Production**: `process.resourcesPath/settings.json`

### Settings Structure
```json
{
  "fileWatcherEnabled": true,
  "watchedFolderPath": "/path/to/watched/folder"
}
```

### Persistence Functions
```javascript
// Load file watcher settings
function loadFileWatcherSettings() {
    try {
        const settings = app.isPackaged 
            ? path.join(process.resourcesPath, 'settings.json')
            : path.join(__dirname, 'settings.json');
        
        if (fs.existsSync(settings)) {
            const data = fs.readFileSync(settings, 'utf8');
            const config = JSON.parse(data);
            return {
                enabled: config.fileWatcherEnabled || false,
                folderPath: config.watchedFolderPath || null
            };
        }
    } catch (error) {
        console.warn('Failed to load file watcher settings:', error);
    }
    
    return { enabled: false, folderPath: null };
}

// Save file watcher settings
function saveFileWatcherSettings() {
    try {
        const settings = app.isPackaged 
            ? path.join(process.resourcesPath, 'settings.json')
            : path.join(__dirname, 'settings.json');
        
        const config = {
            fileWatcherEnabled: isFileWatcherEnabled,
            watchedFolderPath: watchedFolderPath
        };
        
        fs.writeFileSync(settings, JSON.stringify(config, null, 2));
        console.log('File watcher settings saved');
    } catch (error) {
        console.error('Failed to save file watcher settings:', error);
    }
}
```

## Error Handling

### Validation
- **Folder Existence**: Checks if selected folder exists
- **Directory Validation**: Ensures path is a directory, not a file
- **Permissions**: Validates read access to folder
- **File Watcher Limits**: Handles system limits on file watchers

### Error Messages
- Clear, user-friendly error messages
- Specific guidance for resolution
- Graceful fallback behavior
- Application stability maintenance

### Recovery
- Automatic retry mechanisms
- Fallback to previous settings
- Clear error state indicators
- Manual recovery options

## Integration Points

### 1. Settings Page Integration
The FileWatcherSettings component is integrated into the main Settings page:

```typescript
// In Settings.tsx
import FileWatcherSettings from '../components/FileWatcherSettings';

// In JSX
<FileWatcherSettings />
```

### 2. Electron Integration
File watcher is initialized during app startup:

```javascript
// In main.js app.whenReady()
app.whenReady().then(() => {
    // ... other initialization ...
    
    // Initialize file watcher
    initializeFileWatcher();
    
    // ... rest of initialization ...
});
```

### 3. Notification Integration
File watcher integrates with Electron's notification system:

```javascript
// Show notification for new files
if (Notification.isSupported()) {
    new Notification({
        title: 'New File Detected',
        body: `File created: ${path.basename(filePath)}`,
        icon: path.join(__dirname, 'assets', 'app-icon.png')
    }).show();
}
```

## Performance Considerations

### File System Monitoring
- Uses Node.js `fs.watch` for efficient file system monitoring
- Recursive monitoring for subdirectories
- Event debouncing to prevent excessive notifications
- Memory-efficient event handling

### Resource Management
- Automatic cleanup of file watchers
- Memory leak prevention
- System resource monitoring
- Graceful shutdown handling

### Scalability
- Handles large numbers of files
- Efficient event processing
- Background operation
- Minimal UI impact

## Testing

### Test Script
A comprehensive test script (`test-file-watcher.js`) is provided to verify functionality:

1. **Application Startup**: Verifies app starts correctly
2. **Settings Navigation**: Tests settings page access
3. **File Watcher Toggle**: Tests enable/disable functionality
4. **Folder Selection**: Tests folder selection dialog
5. **File Watcher Testing**: Tests built-in test functionality
6. **File Detection**: Tests actual file monitoring
7. **Settings Persistence**: Tests settings across restarts
8. **Error Handling**: Tests error scenarios
9. **Supported File Types**: Tests file type display
10. **Drag-and-Drop Integration**: Tests integration with drag-and-drop

### Manual Testing
The test script provides guidance for manual verification:
- Navigate to Settings → File Watcher Settings
- Test enable/disable functionality
- Test folder selection and clearing
- Test file watcher with actual files
- Verify settings persistence across restarts
- Check error handling for invalid inputs
- Test integration with drag-and-drop overlay

## Future Enhancements

### Planned Features
1. **Multiple Folder Support**
   - Watch multiple folders simultaneously
   - Folder-specific settings
   - Priority-based monitoring

2. **Advanced File Processing**
   - Automatic file import on detection
   - File content analysis
   - Metadata extraction

3. **Filtering Options**
   - File type filters
   - Size-based filtering
   - Pattern-based filtering

4. **Advanced Notifications**
   - Customizable notification settings
   - Notification history
   - Action buttons in notifications

### Performance Improvements
1. **Optimized Monitoring**
   - Platform-specific optimizations
   - Event batching
   - Selective monitoring

2. **Enhanced Persistence**
   - Encrypted settings storage
   - Cloud sync support
   - Backup and restore

## Troubleshooting

### Common Issues

1. **File Watcher Not Starting**
   - Check folder permissions
   - Verify folder exists
   - Check system file watcher limits

2. **Notifications Not Appearing**
   - Check notification permissions
   - Verify notification settings
   - Check system notification settings

3. **Settings Not Persisting**
   - Check file permissions
   - Verify storage location
   - Check for file corruption

4. **Performance Issues**
   - Monitor system resources
   - Check for too many files
   - Verify event handling

### Debug Mode
Enable debug logging by setting:
```javascript
const DEBUG_FILE_WATCHER = true;
```

This will log detailed information about:
- File watcher events
- Settings operations
- Error details
- Performance metrics

## Conclusion

The File Watcher Settings feature provides a robust and user-friendly way to monitor local folders for file changes. With comprehensive error handling, settings persistence, and integration with the existing application architecture, it enhances the user experience by automating file detection and providing timely notifications.

The implementation is designed to be efficient, reliable, and extensible, allowing for future enhancements while maintaining performance and stability. The integration with the Settings page and Electron backend ensures a seamless user experience across the application. 