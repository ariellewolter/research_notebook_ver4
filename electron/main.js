const { app, BrowserWindow, ipcMain, dialog, Notification, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const BackendSpawner = require('./utils/spawnBackend');
const fileUtils = require('./utils/fileUtils');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let backendSpawner;
let tray;

// Multi-window management
let openWindows = new Map(); // Track all open windows by ID
let windowCounter = 0; // Counter for generating unique window IDs

// Backend server configuration
const BACKEND_PORT = 3000;
const FRONTEND_PORT = 5173;

// Initialize backend spawner
function initializeBackend() {
    backendSpawner = new BackendSpawner();

    // Spawn backend server process
    backendSpawner.spawnBackend(isDev, BACKEND_PORT)
        .then(() => {
            console.log('Backend server started successfully');
        })
        .catch((error) => {
            console.error('Failed to start backend server:', error);
        });
}

// Generate unique window ID
function generateWindowId() {
    return `window_${++windowCounter}`;
}

// Create the main browser window
function createWindow() {
    // Create main window using the new window system
    mainWindow = createNewWindow({
        id: 'main',
        title: 'Research Notebook',
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800,
        route: '/',
        skipTaskbar: false
    });

    // Handle window minimize (hide to tray instead of minimizing)
    mainWindow.on('minimize', (event) => {
        event.preventDefault();
        mainWindow.hide();
        console.log('Window minimized to tray');
    });

    // Handle window close (hide to tray instead of closing)
    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
            console.log('Window closed to tray');
        } else {
            console.log('App is quitting, allowing window to close');
        }
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
    });
}

// Create a new window with specific configuration
function createNewWindow(windowConfig) {
    const {
        id = generateWindowId(),
        title = 'Research Notebook',
        width = 1200,
        height = 800,
        minWidth = 800,
        minHeight = 600,
        route = '',
        params = {},
        parent = null,
        modal = false,
        resizable = true,
        maximizable = true,
        minimizable = true,
        closable = true,
        alwaysOnTop = false,
        skipTaskbar = false,
        show = true
    } = windowConfig;

    // Check if window with this ID already exists
    if (openWindows.has(id)) {
        const existingWindow = openWindows.get(id);
        if (!existingWindow.isDestroyed()) {
            existingWindow.focus();
            return existingWindow;
        } else {
            openWindows.delete(id);
        }
    }

    // Set icon based on platform
    let iconPath;
    if (process.platform === 'darwin') {
        iconPath = undefined; // macOS uses ICNS icon via electron-builder config
    } else if (process.platform === 'win32') {
        iconPath = path.join(__dirname, 'assets', 'app-icon.ico');
    } else {
        iconPath = path.join(__dirname, 'assets', 'app-icon.png');
    }

    // Create window options
    const windowOptions = {
        width,
        height,
        minWidth,
        minHeight,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true
        },
        icon: iconPath,
        titleBarStyle: 'default',
        show: false, // Don't show until ready
        resizable,
        maximizable,
        minimizable,
        closable,
        alwaysOnTop,
        skipTaskbar
    };

    // Add parent window if specified
    if (parent) {
        windowOptions.parent = parent;
    }

    // Add modal property if specified
    if (modal) {
        windowOptions.modal = true;
    }

    // Create the window
    const newWindow = new BrowserWindow(windowOptions);

    // Store window reference
    openWindows.set(id, newWindow);

    // Load the frontend with route and params
    const startUrl = isDev
        ? `http://localhost:${FRONTEND_PORT}${route}`
        : `file://${path.join(__dirname, '..', 'apps', 'frontend', 'dist', 'index.html')}`;

    // Add route and params as query parameters for production
    const finalUrl = isDev ? startUrl : `${startUrl}#${route}`;

    newWindow.loadURL(finalUrl);

    // Pass context data to the window
    newWindow.webContents.on('did-finish-load', () => {
        newWindow.webContents.send('window-context', {
            id,
            route,
            params,
            isDev
        });
    });

    // Show window when ready
    newWindow.once('ready-to-show', () => {
        if (show) {
            newWindow.show();
        }

        // Open DevTools in development
        if (isDev) {
            newWindow.webContents.openDevTools();
        }
    });

    // Handle window closed
    newWindow.on('closed', () => {
        openWindows.delete(id);
        console.log(`Window ${id} closed`);
    });

    // Handle window close (for non-main windows)
    if (id !== 'main') {
        newWindow.on('close', (event) => {
            // For non-main windows, allow normal closing
            console.log(`Window ${id} closing`);
        });
    }

    console.log(`Created window ${id} with route: ${route}`);
    return newWindow;
}

// Window management functions
function getWindowById(id) {
    return openWindows.get(id);
}

function getAllWindows() {
    const windows = [];
    for (const [id, window] of openWindows.entries()) {
        if (!window.isDestroyed()) {
            windows.push({
                id,
                title: window.getTitle(),
                isVisible: window.isVisible(),
                isMinimized: window.isMinimized(),
                isMaximized: window.isMaximized(),
                bounds: window.getBounds()
            });
        }
    }
    return windows;
}

function closeWindow(id) {
    const window = openWindows.get(id);
    if (window && !window.isDestroyed()) {
        window.close();
        return true;
    }
    return false;
}

function focusWindow(id) {
    const window = openWindows.get(id);
    if (window && !window.isDestroyed()) {
        window.focus();
        return true;
    }
    return false;
}

function minimizeWindow(id) {
    const window = openWindows.get(id);
    if (window && !window.isDestroyed()) {
        window.minimize();
        return true;
    }
    return false;
}

function maximizeWindow(id) {
    const window = openWindows.get(id);
    if (window && !window.isDestroyed()) {
        window.maximize();
        return true;
    }
    return false;
}

function restoreWindow(id) {
    const window = openWindows.get(id);
    if (window && !window.isDestroyed()) {
        window.restore();
        return true;
    }
    return false;
}

// Clean up destroyed windows
function cleanupWindows() {
    for (const [id, window] of openWindows.entries()) {
        if (window.isDestroyed()) {
            openWindows.delete(id);
        }
    }
}

// Create system tray icon and menu
function createTray() {
    // Set tray icon based on platform
    let trayIconPath;
    if (process.platform === 'darwin') {
        // macOS uses PNG for tray (16x16 or 32x32 recommended)
        trayIconPath = path.join(__dirname, 'assets', 'icon-32x32.png');
    } else if (process.platform === 'win32') {
        // Windows can use ICO or PNG
        trayIconPath = path.join(__dirname, 'assets', 'app-icon.ico');
    } else {
        // Linux uses PNG
        trayIconPath = path.join(__dirname, 'assets', 'app-icon.png');
    }

    // Create tray icon
    tray = new Tray(trayIconPath);

    // Create context menu
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Window',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                    console.log('Window shown from tray menu');
                }
            }
        },
        {
            label: 'Hide to Tray',
            click: () => {
                if (mainWindow) {
                    mainWindow.hide();
                    console.log('Window hidden to tray from menu');
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quit Research Notebook',
            click: () => {
                console.log('Quitting app from tray menu');
                app.quit();
            }
        }
    ]);

    // Set tooltip
    tray.setToolTip('Research Notebook');

    // Set context menu
    tray.setContextMenu(contextMenu);

    // Handle tray icon click
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.focus();
                console.log('Window focused from tray click');
            } else {
                mainWindow.show();
                mainWindow.focus();
                console.log('Window shown and focused from tray click');
            }
        }
    });

    // Handle tray icon double-click (macOS)
    tray.on('double-click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.focus();
                console.log('Window focused from tray double-click');
            } else {
                mainWindow.show();
                mainWindow.focus();
                console.log('Window shown and focused from tray double-click');
            }
        }
    });

    console.log('System tray icon created successfully');
}

// File handling variables
let pendingFiles = []; // Store files that were opened before app was ready
let isAppReady = false;

// Function to open PDF file in a new window
function openPDFFile(filePath) {
    try {
        // Validate file path and check if it's a PDF
        if (!filePath || !filePath.toLowerCase().endsWith('.pdf')) {
            console.warn('Invalid file path or not a PDF file:', filePath);
            return;
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error('File does not exist:', filePath);
            return;
        }

        console.log('Opening PDF file:', filePath);

        // Create a new PDF viewer window
        const pdfWindow = createNewWindow({
            id: `pdf_${Date.now()}`,
            title: `Research Notebook - PDF Viewer`,
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            route: '/pdf-viewer',
            params: {
                windowType: 'pdf-viewer',
                filePath: filePath,
                fileName: path.basename(filePath),
                openedFromOS: true
            },
            modal: false,
            resizable: true,
            maximizable: true,
            minimizable: true,
            closable: true,
            alwaysOnTop: false,
            skipTaskbar: false
        });

        return pdfWindow;
    } catch (error) {
        console.error('Error opening PDF file:', error);
    }
}

// Function to handle files opened from OS
function handleFileOpen(filePath) {
    if (!isAppReady) {
        // App is not ready yet, store the file for later
        console.log('App not ready, storing file for later:', filePath);
        pendingFiles.push(filePath);
        return;
    }

    // App is ready, open the file immediately
    console.log('App ready, opening file:', filePath);
    openPDFFile(filePath);
}

// Function to process pending files
function processPendingFiles() {
    if (pendingFiles.length > 0) {
        console.log('Processing pending files:', pendingFiles);
        pendingFiles.forEach(filePath => {
            openPDFFile(filePath);
        });
        pendingFiles = [];
    }
}

// App event handlers
app.whenReady().then(() => {
    // Register file protocol handler for PDF files
    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient('research-notebook', process.execPath, [path.resolve(process.argv[1])]);
        }
    } else {
        app.setAsDefaultProtocolClient('research-notebook');
    }

    // Handle files opened via protocol (macOS)
    app.on('open-file', (event, filePath) => {
        event.preventDefault();
        console.log('File opened via protocol:', filePath);
        handleFileOpen(filePath);
    });

    // Handle files opened via command line arguments (Windows/Linux)
    const filesFromArgs = process.argv.slice(1).filter(arg => 
        arg.toLowerCase().endsWith('.pdf') && fs.existsSync(arg)
    );
    
    if (filesFromArgs.length > 0) {
        console.log('Files from command line args:', filesFromArgs);
        filesFromArgs.forEach(filePath => {
            handleFileOpen(filePath);
        });
    }

    // Initialize backend server first
    initializeBackend();

    // Wait a moment for backend to start, then create window and tray
    setTimeout(() => {
        createWindow();
        createTray();
        
        // Mark app as ready and process any pending files
        isAppReady = true;
        processPendingFiles();
    }, 3000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    // Handle second instance (when app is already running and user tries to open another file)
    const gotTheLock = app.requestSingleInstanceLock();
    
    if (!gotTheLock) {
        console.log('Another instance is running, quitting this one');
        app.quit();
    } else {
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            console.log('Second instance detected, command line:', commandLine);
            
            // Someone tried to run a second instance, we should focus our window instead
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();
            }

            // Check for PDF files in command line arguments
            const filesFromSecondInstance = commandLine.slice(1).filter(arg => 
                arg.toLowerCase().endsWith('.pdf') && fs.existsSync(arg)
            );
            
            if (filesFromSecondInstance.length > 0) {
                console.log('Files from second instance:', filesFromSecondInstance);
                filesFromSecondInstance.forEach(filePath => {
                    openPDFFile(filePath);
                });
            }
        });
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    // Set quitting flag to allow window to close
    app.isQuiting = true;

    // Clean up tray
    if (tray) {
        tray.destroy();
    }

    // Clean up backend process
    if (backendSpawner) {
        backendSpawner.killBackend();
    }
});

// IPC handlers for file system operations
ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'PDF Files', extensions: ['pdf'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    return result.filePaths;
});

ipcMain.handle('save-file-dialog', async (event, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName,
        filters: [
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    return result.filePath;
});

ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    return result.filePaths;
});

// Handle app quit
ipcMain.handle('quit-app', () => {
    app.quit();
});

// Handle minimize to tray
ipcMain.handle('minimize-to-tray', () => {
    if (mainWindow) {
        mainWindow.hide();
        return { success: true };
    }
    return { success: false, error: 'Main window not available' };
});

// Handle restore from tray
ipcMain.handle('restore-from-tray', () => {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        return { success: true };
    }
    return { success: false, error: 'Main window not available' };
});

// Handle tray status check
ipcMain.handle('get-tray-status', () => {
    return {
        trayExists: !!tray,
        windowVisible: mainWindow ? mainWindow.isVisible() : false,
        windowMinimized: mainWindow ? mainWindow.isMinimized() : false,
        appQuiting: app.isQuiting || false
    };
});

// Handle check if app is running in tray mode
ipcMain.handle('is-running-in-tray', () => {
    return {
        inTray: mainWindow ? !mainWindow.isVisible() : false,
        trayExists: !!tray,
        canRestore: mainWindow && !mainWindow.isDestroyed()
    };
});

// Notification API
ipcMain.handle('show-notification', async (event, title, body) => {
    if (Notification.isSupported()) {
        const notification = new Notification({
            title: title,
            body: body,
            silent: false
        });
        notification.show();
        return true;
    }
    return false;
});

// Enhanced file save dialog with content
ipcMain.handle('save-file-dialog-with-content', async (event, defaultFileName, content) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultFileName,
        filters: [
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePath) {
        try {
            await fileUtils.saveFile(content, result.filePath);
            return { success: true, filePath: result.filePath };
        } catch (error) {
            console.error('Error saving file:', error);
            return { success: false, error: error.message };
        }
    }
    return { success: false, canceled: true };
});

// Local settings management
ipcMain.handle('load-local-settings', async () => {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    try {
        const settings = await fileUtils.loadJSON(settingsPath);
        return settings;
    } catch (error) {
        console.error('Error loading local settings:', error);
        return {};
    }
});

ipcMain.handle('save-local-settings', async (event, settings) => {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    try {
        await fileUtils.saveJSON(settingsPath, settings);
        return { success: true };
    } catch (error) {
        console.error('Error saving local settings:', error);
        return { success: false, error: error.message };
    }
});

// Auto-start on login management
ipcMain.handle('get-auto-start-status', async () => {
    try {
        const loginItemSettings = app.getLoginItemSettings();
        return {
            success: true,
            openAtLogin: loginItemSettings.openAtLogin,
            openAsHidden: loginItemSettings.openAsHidden,
            path: loginItemSettings.path
        };
    } catch (error) {
        console.error('Error getting auto-start status:', error);
        return {
            success: false,
            error: error.message,
            openAtLogin: false,
            openAsHidden: false
        };
    }
});

ipcMain.handle('set-auto-start', async (event, enabled) => {
    try {
        app.setLoginItemSettings({
            openAtLogin: enabled,
            openAsHidden: false, // Start visible, not hidden
            path: process.execPath
        });

        console.log(`Auto-start ${enabled ? 'enabled' : 'disabled'}`);
        return { success: true, enabled };
    } catch (error) {
        console.error('Error setting auto-start:', error);
        return { success: false, error: error.message };
    }
});

// Multi-window management IPC handlers
ipcMain.handle('create-window', async (event, windowConfig) => {
    try {
        cleanupWindows(); // Clean up destroyed windows first
        const newWindow = createNewWindow(windowConfig);
        return { success: true, windowId: newWindow.id || windowConfig.id };
    } catch (error) {
        console.error('Error creating window:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-all-windows', async () => {
    try {
        cleanupWindows();
        return { success: true, windows: getAllWindows() };
    } catch (error) {
        console.error('Error getting windows:', error);
        return { success: false, error: error.message, windows: [] };
    }
});

ipcMain.handle('get-window-by-id', async (event, id) => {
    try {
        const window = getWindowById(id);
        if (window && !window.isDestroyed()) {
            return {
                success: true,
                window: {
                    id,
                    title: window.getTitle(),
                    isVisible: window.isVisible(),
                    isMinimized: window.isMinimized(),
                    isMaximized: window.isMaximized(),
                    bounds: window.getBounds()
                }
            };
        }
        return { success: false, error: 'Window not found' };
    } catch (error) {
        console.error('Error getting window:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('close-window', async (event, id) => {
    try {
        const success = closeWindow(id);
        return { success };
    } catch (error) {
        console.error('Error closing window:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('focus-window', async (event, id) => {
    try {
        const success = focusWindow(id);
        return { success };
    } catch (error) {
        console.error('Error focusing window:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('minimize-window', async (event, id) => {
    try {
        const success = minimizeWindow(id);
        return { success };
    } catch (error) {
        console.error('Error minimizing window:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('maximize-window', async (event, id) => {
    try {
        const success = maximizeWindow(id);
        return { success };
    } catch (error) {
        console.error('Error maximizing window:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('restore-window', async (event, id) => {
    try {
        const success = restoreWindow(id);
        return { success };
    } catch (error) {
        console.error('Error restoring window:', error);
        return { success: false, error: error.message };
    }
});

// Predefined window configurations
ipcMain.handle('create-editor-window', async (event, params = {}) => {
    try {
        cleanupWindows();
        const newWindow = createNewWindow({
            id: `editor_${Date.now()}`,
            title: 'Research Notebook - Editor',
            width: 1000,
            height: 700,
            minWidth: 800,
            minHeight: 600,
            route: '/editor',
            params: { ...params, windowType: 'editor' },
            parent: mainWindow,
            modal: false,
            resizable: true,
            maximizable: true,
            minimizable: true,
            closable: true,
            alwaysOnTop: false,
            skipTaskbar: false
        });
        return { success: true, windowId: newWindow.id };
    } catch (error) {
        console.error('Error creating editor window:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('create-pdf-viewer-window', async (event, params = {}) => {
    try {
        cleanupWindows();
        const newWindow = createNewWindow({
            id: `pdf_viewer_${Date.now()}`,
            title: 'Research Notebook - PDF Viewer',
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            route: '/pdf-viewer',
            params: { ...params, windowType: 'pdf-viewer' },
            parent: mainWindow,
            modal: false,
            resizable: true,
            maximizable: true,
            minimizable: true,
            closable: true,
            alwaysOnTop: false,
            skipTaskbar: false
        });
        return { success: true, windowId: newWindow.id };
    } catch (error) {
        console.error('Error creating PDF viewer window:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('create-settings-window', async (event, params = {}) => {
    try {
        cleanupWindows();
        const newWindow = createNewWindow({
            id: `settings_${Date.now()}`,
            title: 'Research Notebook - Settings',
            width: 800,
            height: 600,
            minWidth: 600,
            minHeight: 400,
            route: '/settings',
            params: { ...params, windowType: 'settings' },
            parent: mainWindow,
            modal: true,
            resizable: true,
            maximizable: false,
            minimizable: true,
            closable: true,
            alwaysOnTop: true,
            skipTaskbar: false
        });
        return { success: true, windowId: newWindow.id };
    } catch (error) {
        console.error('Error creating settings window:', error);
        return { success: false, error: error.message };
    }
});

// Window context handler
ipcMain.handle('get-current-window-context', async (event) => {
    try {
        const sender = event.sender;
        // Find the window that sent this request
        for (const [id, window] of openWindows.entries()) {
            if (window.webContents === sender) {
                return {
                    success: true,
                    windowId: id,
                    route: window.route || '/',
                    params: window.params || {},
                    isDev
                };
            }
        }
        return { success: false, error: 'Window context not found' };
    } catch (error) {
        console.error('Error getting window context:', error);
        return { success: false, error: error.message };
    }
});

// Additional IPCMain handlers for enhanced functionality
ipcMain.handle('notification:show', async (event, title, body, options = {}) => {
    if (Notification.isSupported()) {
        const notification = new Notification({
            title: title,
            body: body,
            silent: options.silent || false,
            icon: options.icon || undefined,
            badge: options.badge || undefined,
            tag: options.tag || undefined,
            requireInteraction: options.requireInteraction || false,
            actions: options.actions || undefined,
            urgency: options.urgency || 'normal'
        });

        // Handle notification events
        notification.on('click', () => {
            if (options.onClick) {
                mainWindow.webContents.send('notification:clicked', { title, body });
            }
        });

        notification.on('close', () => {
            if (options.onClose) {
                mainWindow.webContents.send('notification:closed', { title, body });
            }
        });

        notification.show();
        return { success: true, id: notification.id };
    }
    return { success: false, error: 'Notifications not supported' };
});

ipcMain.handle('dialog:saveFile', async (event, options = {}) => {
    const defaultOptions = {
        title: 'Save File',
        defaultPath: options.defaultPath || 'untitled.txt',
        filters: options.filters || [
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'CSV Files', extensions: ['csv'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: options.properties || ['createDirectory', 'showOverwriteConfirmation']
    };

    try {
        const result = await dialog.showSaveDialog(mainWindow, defaultOptions);

        if (!result.canceled && result.filePath) {
            // If content is provided, write it to the file
            if (options.content !== undefined) {
                try {
                    await fileUtils.saveFile(options.content, result.filePath);
                    return {
                        success: true,
                        filePath: result.filePath,
                        canceled: false
                    };
                } catch (writeError) {
                    console.error('Error writing file:', writeError);
                    return {
                        success: false,
                        error: writeError.message,
                        filePath: result.filePath,
                        canceled: false
                    };
                }
            }

            // If no content provided, just return the file path
            return {
                success: true,
                filePath: result.filePath,
                canceled: false
            };
        }

        return {
            success: false,
            canceled: true,
            error: 'Dialog was canceled'
        };
    } catch (error) {
        console.error('Error in save file dialog:', error);
        return {
            success: false,
            error: error.message,
            canceled: false
        };
    }
});

ipcMain.handle('settings:load', async () => {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    try {
        const settings = await fileUtils.loadJSON(settingsPath);
        return { success: true, settings };
    } catch (error) {
        console.error('Error loading settings:', error);
        return { success: false, error: error.message, settings: {} };
    }
});

ipcMain.handle('settings:save', async (event, settings) => {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    try {
        await fileUtils.saveJSON(settingsPath, settings);
        return { success: true };
    } catch (error) {
        console.error('Error saving settings:', error);
        return { success: false, error: error.message };
    }
});

// IPC handler for opening files from frontend
ipcMain.handle('open-file-from-path', async (event, filePath) => {
    try {
        const result = openPDFFile(filePath);
        return { success: true, windowId: result ? result.id : null };
    } catch (error) {
        console.error('Error opening file from path:', error);
        return { success: false, error: error.message };
    }
});

// IPC handler for registering file associations
ipcMain.handle('register-file-associations', async () => {
    try {
        // This will be handled by electron-builder during installation
        // For development, we can set up protocol handlers
        if (process.defaultApp) {
            app.setAsDefaultProtocolClient('research-notebook');
        }
        return { success: true };
    } catch (error) {
        console.error('Error registering file associations:', error);
        return { success: false, error: error.message };
    }
}); 