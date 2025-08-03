# 🖥️ Electron Desktop App Integration

## ✅ **COMPLETED: OS File Handler Implementation**

The Research Notebook app now includes a full Electron desktop application with native OS file handler integration, allowing users to double-click PDF files to open them directly in the app.

---

## 🚀 **Key Features Implemented**

### **1. OS File Handler Registration**
- ✅ **PDF File Association:** Double-click PDF files to open in Research Notebook
- ✅ **Cross-Platform Support:** Windows, macOS, and Linux
- ✅ **Smart File Handling:** Works whether app is running or closed
- ✅ **File Type Registration:** Automatic registration during app installation

### **2. System Integration**
- ✅ **System Tray:** App runs in system tray with context menu
- ✅ **Auto-Start:** Option to start app on system login
- ✅ **Native Notifications:** System-level notifications
- ✅ **Window Management:** Proper minimize/restore behavior

### **3. Multi-Window System**
- ✅ **Popout Windows:** Open any route in separate window
- ✅ **PDF Viewer Windows:** Dedicated PDF viewing windows
- ✅ **Editor Windows:** Separate document editing windows
- ✅ **Settings Windows:** Modal settings dialogs
- ✅ **Window Management:** Full window control operations

### **4. Native File Operations**
- ✅ **File Dialogs:** System file dialogs for open/save
- ✅ **Save File Dialog:** Native save with content writing
- ✅ **Local Settings:** Persistent app settings
- ✅ **File System Access:** Direct file system operations

---

## 📁 **File Structure**

```
electron/
├── main.js                    # Main Electron process
├── preload.js                 # Preload script for IPC
├── utils/
│   ├── spawnBackend.js        # Backend process management
│   └── fileUtils.js           # File system utilities
└── assets/                    # App icons and resources
    ├── app-icon.icns          # macOS icon
    ├── app-icon.ico           # Windows icon
    └── app-icon.png           # Linux icon

apps/frontend/src/
├── hooks/
│   ├── useWindowManager.ts    # Multi-window management
│   ├── useNotification.ts     # Notification system
│   └── useAppSettings.ts      # App settings management
└── utils/
    └── fileSystemAPI.ts       # File system abstraction
```

---

## 🔧 **Technical Implementation**

### **Main Process (main.js)**
```javascript
// File handling variables
let pendingFiles = []; // Store files opened before app ready
let isAppReady = false;

// Function to open PDF file in new window
function openPDFFile(filePath) {
    // Creates new PDF viewer window with file path
}

// Handle files opened from OS
function handleFileOpen(filePath) {
    if (!isAppReady) {
        pendingFiles.push(filePath);
    } else {
        openPDFFile(filePath);
    }
}

// App lifecycle with file handler registration
app.whenReady().then(() => {
    // Register file protocol handler
    app.setAsDefaultProtocolClient('research-notebook');
    
    // Handle files opened via protocol (macOS)
    app.on('open-file', (event, filePath) => {
        event.preventDefault();
        handleFileOpen(filePath);
    });
    
    // Handle files from command line (Windows/Linux)
    const filesFromArgs = process.argv.slice(1).filter(arg => 
        arg.toLowerCase().endsWith('.pdf') && fs.existsSync(arg)
    );
    
    // Second instance handling
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        app.quit();
    } else {
        app.on('second-instance', (event, commandLine) => {
            // Focus existing window and handle new files
        });
    }
});
```

### **Preload Script (preload.js)**
```javascript
// Expose file handling APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // File operations
    openFileFromPath: (filePath) => ipcRenderer.invoke('open-file-from-path', filePath),
    registerFileAssociations: () => ipcRenderer.invoke('register-file-associations'),
    
    // Window management
    openPopoutWindow: (route, params) => ipcRenderer.invoke('create-window', config),
    openPDFWindow: (filePath, params) => ipcRenderer.invoke('create-window', config),
    
    // System integration
    showNotification: (title, body) => ipcRenderer.invoke('notification:show', title, body),
    getAutoStartStatus: () => ipcRenderer.invoke('get-auto-start-status'),
    setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),
});
```

### **Frontend Integration**
```typescript
// useWindowManager hook
export function useWindowManager() {
    const openPopout = useCallback(async (route: string, params = {}) => {
        if (isElectron && window.electronAPI?.openPopoutWindow) {
            return await window.electronAPI.openPopoutWindow(route, params);
        } else {
            // Web fallback: navigate in current window
            window.location.href = `${route}?${searchParams.toString()}`;
        }
    }, [isElectron]);

    const openPDF = useCallback(async (filePath: string, params = {}) => {
        if (isElectron && window.electronAPI?.openPDFWindow) {
            return await window.electronAPI.openPDFWindow(filePath, params);
        } else {
            // Web fallback: open in new tab
            window.open(filePath, '_blank');
        }
    }, [isElectron]);
}
```

---

## 🎯 **Usage Examples**

### **Opening PDF Files**
```typescript
// From frontend component
const { openPDF } = useWindowManager();

const handleOpenPDF = async () => {
    const result = await openPDF('/path/to/document.pdf', { 
        page: 1, 
        zoom: 1.5 
    });
    
    if (result.success) {
        console.log('PDF opened in window:', result.windowId);
    }
};
```

### **Creating Popout Windows**
```typescript
// Open notes in popout window
await openPopout('/notes', { filter: 'recent' });

// Open calendar in popout window
await openPopout('/calendar', { view: 'month' });

// Open research dashboard in popout window
await openPopout('/research', { projectId: 'proj_123' });
```

### **System Notifications**
```typescript
const { notify } = useNotification();

// Show system notification
await notify('Task Completed', 'Your research task has been completed successfully');
```

### **Auto-Start Management**
```typescript
const { getAutoStartStatus, setAutoStart } = useAutoStart();

// Check auto-start status
const status = await getAutoStartStatus();
console.log('Auto-start enabled:', status.openAtLogin);

// Enable auto-start
await setAutoStart(true);
```

---

## 🔄 **Cross-Platform Behavior**

### **Windows**
- **File Association:** PDF files registered with app during installation
- **Command Line:** Files passed as command line arguments
- **System Tray:** App runs in system notification area
- **Auto-Start:** Registry-based auto-start configuration

### **macOS**
- **File Association:** PDF files associated via protocol handler
- **File Events:** Uses `app.on('open-file')` event
- **System Tray:** App runs in menu bar
- **Auto-Start:** LaunchAgents-based auto-start

### **Linux**
- **File Association:** Desktop entry file associations
- **Command Line:** Files passed as command line arguments
- **System Tray:** App runs in system tray
- **Auto-Start:** Desktop entry auto-start configuration

---

## 📦 **Build Configuration**

### **electron-builder.json**
```json
{
    "appId": "com.researchnotebook.app",
    "productName": "Research Notebook",
    "mac": {
        "extendInfo": {
            "CFBundleDocumentTypes": [
                {
                    "CFBundleTypeName": "PDF Document",
                    "CFBundleTypeExtensions": ["pdf"],
                    "LSHandlerRank": "Owner"
                }
            ]
        }
    },
    "win": {
        "fileAssociations": [
            {
                "ext": "pdf",
                "name": "PDF Document",
                "role": "Viewer"
            }
        ]
    },
    "linux": {
        "fileAssociations": [
            {
                "ext": "pdf",
                "name": "PDF Document",
                "mimeType": "application/pdf"
            }
        ]
    }
}
```

---

## 🚀 **Development Workflow**

### **Development Mode**
```bash
# Start full stack development
pnpm start

# Start Electron only (with running backend/frontend)
pnpm electron:dev
```

### **Production Build**
```bash
# Build frontend
pnpm frontend:build

# Build and package desktop app
pnpm electron:build
```

### **Testing File Handler**
1. **Build the app:** `pnpm electron:build`
2. **Install the app** on your system
3. **Double-click a PDF file** - it should open in Research Notebook
4. **Test with app closed** - should launch app and open file
5. **Test with app running** - should open file in new window

---

## 🐛 **Troubleshooting**

### **Common Issues**

1. **File Association Not Working:**
   - Ensure app is properly installed
   - Check file association in system settings
   - Verify app has proper permissions

2. **Backend Not Starting:**
   - Use simple-app.ts for development: `pnpm simple-dev`
   - Check TypeScript compilation errors
   - Verify Prisma client is generated

3. **White Screen in Electron:**
   - Check if backend is running on port 3000
   - Verify frontend is running on port 5173
   - Check console for error messages

4. **File Handler Not Responding:**
   - Restart the app after installation
   - Check system file associations
   - Verify app has file access permissions

### **Debug Commands**
```bash
# Check if backend is running
curl http://localhost:3000

# Check if frontend is running
curl http://localhost:5173

# Test file handler manually
open -a "Research Notebook" /path/to/test.pdf
```

---

## 🎉 **Summary**

The Electron integration provides:

- ✅ **Native OS Integration:** PDF files open directly in Research Notebook
- ✅ **Cross-Platform Support:** Works on Windows, macOS, and Linux
- ✅ **Smart File Handling:** Handles files whether app is running or closed
- ✅ **Multi-Window System:** Flexible window management for different tasks
- ✅ **System Integration:** Tray, notifications, and auto-start functionality
- ✅ **Web Fallbacks:** Graceful degradation when running in browser

**The OS file handler is now fully implemented and ready for use!** 🖥️

Users can:
- **Double-click PDF files** to open them in Research Notebook
- **Use the app as a desktop application** with native OS integration
- **Open multiple windows** for different tasks and workflows
- **Access system features** like notifications and auto-start
- **Enjoy seamless file handling** across all platforms 