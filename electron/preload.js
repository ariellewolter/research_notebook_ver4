const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // File system operations
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    saveFileDialog: (defaultName) => ipcRenderer.invoke('save-file-dialog', defaultName),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),

    // App control
    quitApp: () => ipcRenderer.invoke('quit-app'),
    minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
    restoreFromTray: () => ipcRenderer.invoke('restore-from-tray'),
    getTrayStatus: () => ipcRenderer.invoke('get-tray-status'),
    isRunningInTray: () => ipcRenderer.invoke('is-running-in-tray'),

    // Auto-start management
    getAutoStartStatus: () => ipcRenderer.invoke('get-auto-start-status'),
    setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),

    // File handling
    openFileFromPath: (filePath) => ipcRenderer.invoke('open-file-from-path', filePath),
    registerFileAssociations: () => ipcRenderer.invoke('register-file-associations'),

    // Multi-window management
    createWindow: (windowConfig) => ipcRenderer.invoke('create-window', windowConfig),
    getAllWindows: () => ipcRenderer.invoke('get-all-windows'),
    getWindowById: (id) => ipcRenderer.invoke('get-window-by-id', id),
    closeWindow: (id) => ipcRenderer.invoke('close-window', id),
    focusWindow: (id) => ipcRenderer.invoke('focus-window', id),
    minimizeWindow: (id) => ipcRenderer.invoke('minimize-window', id),
    maximizeWindow: (id) => ipcRenderer.invoke('maximize-window', id),
    restoreWindow: (id) => ipcRenderer.invoke('restore-window', id),

    // Predefined window creators
    createEditorWindow: (params) => ipcRenderer.invoke('create-editor-window', params),
    createPdfViewerWindow: (params) => ipcRenderer.invoke('create-pdf-viewer-window', params),
    createSettingsWindow: (params) => ipcRenderer.invoke('create-settings-window', params),

    // Convenient window opening APIs
    openPopoutWindow: (route, params = {}) => ipcRenderer.invoke('create-window', {
        id: `popout_${Date.now()}`,
        title: `Research Notebook - ${route.replace('/', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        width: 1000,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        route: route,
        params: { ...params, windowType: 'popout' },
        modal: false,
        resizable: true,
        maximizable: true,
        minimizable: true,
        closable: true,
        alwaysOnTop: false,
        skipTaskbar: false
    }),

    openPDFWindow: (filePath, params = {}) => ipcRenderer.invoke('create-window', {
        id: `pdf_${Date.now()}`,
        title: `Research Notebook - PDF Viewer`,
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        route: '/pdf-viewer',
        params: {
            ...params,
            windowType: 'pdf-viewer',
            filePath: filePath,
            fileName: filePath.split('/').pop() || filePath.split('\\').pop() || 'document.pdf'
        },
        modal: false,
        resizable: true,
        maximizable: true,
        minimizable: true,
        closable: true,
        alwaysOnTop: false,
        skipTaskbar: false
    }),

    // Additional convenience methods for common use cases
    openEditorWindow: (documentId, mode = 'edit', params = {}) => ipcRenderer.invoke('create-window', {
        id: `editor_${Date.now()}`,
        title: `Research Notebook - Editor${documentId ? ` (${documentId})` : ''}`,
        width: 1000,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        route: '/editor',
        params: {
            ...params,
            windowType: 'editor',
            documentId: documentId,
            mode: mode
        },
        modal: false,
        resizable: true,
        maximizable: true,
        minimizable: true,
        closable: true,
        alwaysOnTop: false,
        skipTaskbar: false
    }),

    openSettingsWindow: (tab = 'general', params = {}) => ipcRenderer.invoke('create-window', {
        id: `settings_${Date.now()}`,
        title: 'Research Notebook - Settings',
        width: 800,
        height: 600,
        minWidth: 600,
        minHeight: 400,
        route: '/settings',
        params: {
            ...params,
            windowType: 'settings',
            tab: tab
        },
        modal: true,
        resizable: true,
        maximizable: false,
        minimizable: true,
        closable: true,
        alwaysOnTop: true,
        skipTaskbar: false
    }),

    // Window context listener
    onWindowContext: (callback) => ipcRenderer.on('window-context', callback),
    removeWindowContextListener: () => ipcRenderer.removeAllListeners('window-context'),

    // Notification APIs
    showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
    showNotificationAdvanced: (title, body, options) => ipcRenderer.invoke('notification:show', title, body, options),

    // File operations
    saveFileWithDialog: (defaultFileName, content) => ipcRenderer.invoke('save-file-dialog-with-content', defaultFileName, content),
    saveFileDialog: (options) => ipcRenderer.invoke('dialog:saveFile', options),

    // Local settings management
    loadLocalSettings: () => ipcRenderer.invoke('load-local-settings'),
    saveLocalSettings: (settings) => ipcRenderer.invoke('save-local-settings', settings),
    loadSettings: () => ipcRenderer.invoke('settings:load'),
    saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),

    // Environment detection
    isElectron: true,

    // Version info
    getVersion: () => process.versions.electron,

    // Platform info
    getPlatform: () => process.platform,

    // App info
    getAppName: () => 'Research Notebook',

    // Future APIs can be added here:
    // - System tray APIs
    // - Native menu APIs
    // - File system watchers
    // - Auto-update APIs
});

// Expose a minimal process API for environment detection
contextBridge.exposeInMainWorld('process', {
    env: {
        NODE_ENV: process.env.NODE_ENV,
        ELECTRON_START_URL: process.env.ELECTRON_START_URL
    },
    platform: process.platform,
    versions: {
        electron: process.versions.electron,
        node: process.versions.node,
        chrome: process.versions.chrome
    }
});

// Handle any errors in the preload script
window.addEventListener('error', (event) => {
    console.error('Preload script error:', event.error);
});

// Log when preload script is loaded
console.log('Electron preload script loaded'); 