const { app, BrowserWindow, ipcMain, dialog, Notification, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const BackendSpawner = require('./utils/spawnBackend');
const fileUtils = require('./utils/fileUtils');
const syncSchedulerIPC = require('./utils/syncSchedulerIPC');
const exportSchedulerIPC = require('./utils/exportSchedulerIPC');

// Environment detection
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const isProduction = !isDev;

let mainWindow;
let backendSpawner;
let tray;

// Multi-window management
let openWindows = new Map(); // Track all open windows by ID
let windowCounter = 0; // Counter for generating unique window IDs

// File watcher management
let fileWatcher = null;
let watchedFolderPath = null;
let isFileWatcherEnabled = false;

// Backend server configuration
const BACKEND_PORT = 3001;
const FRONTEND_PORT = 5173;

// File watcher settings storage
const FILE_WATCHER_SETTINGS_KEY = 'fileWatcherSettings';

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

// Initialize file watcher
function initializeFileWatcher() {
    const settings = loadFileWatcherSettings();
    isFileWatcherEnabled = settings.enabled;
    watchedFolderPath = settings.folderPath;
    
    if (isFileWatcherEnabled && watchedFolderPath) {
        startFileWatcher(watchedFolderPath);
    }
}

// Start file watcher
function startFileWatcher(folderPath) {
    if (fileWatcher) {
        stopFileWatcher();
    }
    
    try {
        if (!fs.existsSync(folderPath)) {
            console.warn('Watched folder does not exist:', folderPath);
            return false;
        }
        
        fileWatcher = fs.watch(folderPath, { recursive: true }, (eventType, filename) => {
            if (filename) {
                const filePath = path.join(folderPath, filename);
                console.log(`File watcher event: ${eventType} - ${filePath}`);
                
                // Handle different file events
                switch (eventType) {
                    case 'rename':
                        // Check if file was created or deleted
                        if (fs.existsSync(filePath)) {
                            handleFileCreated(filePath);
                        } else {
                            handleFileDeleted(filePath);
                        }
                        break;
                    case 'change':
                        handleFileChanged(filePath);
                        break;
                }
                
                // Notify all windows about the file change
                notifyWindowsOfFileChange(eventType, filePath);
            }
        });
        
        watchedFolderPath = folderPath;
        console.log(`File watcher started for: ${folderPath}`);
        return true;
    } catch (error) {
        console.error('Failed to start file watcher:', error);
        return false;
    }
}

// Stop file watcher
function stopFileWatcher() {
    if (fileWatcher) {
        fileWatcher.close();
        fileWatcher = null;
        watchedFolderPath = null;
        console.log('File watcher stopped');
    }
}

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
        
        // You can add additional logic here, such as:
        // - Auto-import the file
        // - Add to recent files
        // - Update the UI
    }
}

// Handle file changed event
function handleFileChanged(filePath) {
    console.log('File changed:', filePath);
    
    // You can add logic here to handle file modifications
    // For example, auto-refresh if the file is currently open
}

// Handle file deleted event
function handleFileDeleted(filePath) {
    console.log('File deleted:', filePath);
    
    // You can add logic here to handle file deletions
    // For example, remove from recent files if it was there
}

// Notify all windows about file changes
function notifyWindowsOfFileChange(eventType, filePath) {
    openWindows.forEach((window) => {
        if (window && !window.isDestroyed()) {
            window.webContents.send('file-watcher-event', {
                eventType,
                filePath,
                fileName: path.basename(filePath)
            });
        }
    });
}

// Backend readiness check function
async function waitForBackendReady(maxRetries = 50, retryDelay = 100) {
    const backendUrl = `http://localhost:${BACKEND_PORT}/health`;
    console.log(`Checking backend readiness at: ${backendUrl}`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(backendUrl);
            if (response.ok) {
                console.log(`✅ Backend is ready (attempt ${attempt}/${maxRetries})`);
                return true;
            }
        } catch (error) {
            console.log(`⏳ Backend not ready yet (attempt ${attempt}/${maxRetries}): ${error.message}`);
        }
        
        if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
    
    console.error(`❌ Backend failed to become ready after ${maxRetries} attempts`);
    return false;
}

async function initializeBackend() {
    backendSpawner = new BackendSpawner();

    // In development mode, skip spawning backend since it's already running via pnpm start
    if (isDev) {
        console.log('Development mode: Skipping backend spawn (backend already running via pnpm start)');
        return;
    }

    // In production mode, spawn the backend server
    console.log('Production mode: Spawning backend server');
    backendSpawner.spawnBackend(false, BACKEND_PORT)
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
            webSecurity: true,
            // Add Content Security Policy
            additionalArguments: [
                `--disable-web-security=${isDev}`,
                '--disable-features=VizDisplayCompositor'
            ]
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
    if (isDev) {
        // Development mode: Load from Vite dev server
        const devUrl = `http://localhost:${FRONTEND_PORT}${route}`;
        console.log(`Loading development URL: ${devUrl}`);
        newWindow.loadURL(devUrl);
    } else {
        // Production mode: Load from static build
        const indexPath = path.join(__dirname, '..', 'apps', 'frontend', 'dist', 'index.html');
        console.log(`Loading production file: ${indexPath}`);
        
        // Check if the file exists
        if (!fs.existsSync(indexPath)) {
            console.error(`Production build not found at: ${indexPath}`);
            console.error('Please run "pnpm build" in the frontend directory first');
            newWindow.loadURL('data:text/html,<h1>Production build not found</h1><p>Please run "pnpm build" in the frontend directory first</p>');
        } else {
            newWindow.loadFile(indexPath, { hash: route });
        }
    }

    // Set a timeout for window load
    const loadTimeout = setTimeout(() => {
        console.error(`Window ${id} load timeout after 30 seconds`);
        if (!newWindow.isDestroyed()) {
            newWindow.webContents.stop();
            newWindow.loadURL('data:text/html,<h1>Load Timeout</h1><p>The application took too long to load. Please check if the development server is running.</p>');
        }
    }, 30000); // 30 second timeout

    // Clear timeout when load completes
    newWindow.webContents.on('did-finish-load', () => {
        clearTimeout(loadTimeout);
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

    // Error handling for window load failures
    newWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error(`Window ${id} failed to load:`, {
            errorCode,
            errorDescription,
            validatedURL
        });
        
        // Show error page with reload button
        const errorHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Load Error - Research Notebook</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        background: #f5f5f5;
                        color: #333;
                    }
                    .error-container {
                        text-align: center;
                        max-width: 500px;
                        padding: 2rem;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .error-icon { font-size: 4rem; margin-bottom: 1rem; }
                    .error-title { font-size: 1.5rem; margin-bottom: 1rem; color: #d32f2f; }
                    .error-message { margin-bottom: 2rem; color: #666; }
                    .reload-btn {
                        background: #1976d2;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 1rem;
                    }
                    .reload-btn:hover { background: #1565c0; }
                    .details { margin-top: 1rem; font-size: 0.9rem; color: #999; }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <div class="error-title">Failed to Load Application</div>
                    <div class="error-message">
                        The application failed to load. This might be due to a network issue or the development server not running.
                    </div>
                    <button class="reload-btn" onclick="window.location.reload()">Reload Page</button>
                    <div class="details">
                        Error: ${errorDescription}<br>
                        Code: ${errorCode}<br>
                        URL: ${validatedURL}
                    </div>
                </div>
            </body>
            </html>
        `;
        
        newWindow.loadURL(`data:text/html,${encodeURIComponent(errorHtml)}`);
    });

    // Handle unresponsive window
    newWindow.on('unresponsive', () => {
        console.error(`Window ${id} became unresponsive`);
        
        // Show dialog to user
        dialog.showMessageBox(newWindow, {
            type: 'warning',
            title: 'Application Unresponsive',
            message: 'The application has become unresponsive.',
            detail: 'You can wait for it to respond or force quit the application.',
            buttons: ['Wait', 'Force Quit'],
            defaultId: 0
        }).then((result) => {
            if (result.response === 1) {
                // Force quit
                app.quit();
            }
        });
    });

    // Handle responsive window
    newWindow.on('responsive', () => {
        console.log(`Window ${id} became responsive again`);
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
let pendingUrls = []; // Store URLs that were opened before app was ready
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

// Function to process pending URLs
function processPendingUrls() {
    if (pendingUrls.length > 0) {
        console.log('Processing pending URLs:', pendingUrls);
        pendingUrls.forEach(url => {
            handleDeepLink(url);
        });
        pendingUrls = [];
    }
}

// Function to parse and handle deep links
function handleDeepLink(url) {
    try {
        console.log('Handling deep link:', url);
        
        // Parse the URL
        const urlObj = new URL(url);
        
        // Check if it's our custom scheme
        if (urlObj.protocol !== 'researchnotebook:') {
            console.warn('Invalid protocol for deep link:', urlObj.protocol);
            return;
        }
        
        // Parse the path to determine the entity type and ID
        const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
        
        if (pathParts.length === 0) {
            console.warn('No entity type specified in deep link');
            return;
        }
        
        const entityType = pathParts[0].toLowerCase();
        const entityId = pathParts[1];
        const queryParams = Object.fromEntries(urlObj.searchParams.entries());
        
        console.log('Deep link parsed:', {
            entityType,
            entityId,
            queryParams
        });
        
        // Handle different entity types
        switch (entityType) {
            case 'note':
                openNote(entityId, queryParams);
                break;
            case 'project':
                openProject(entityId, queryParams);
                break;
            case 'pdf':
                openPDFFromDeepLink(entityId, queryParams);
                break;
            case 'protocol':
                openProtocol(entityId, queryParams);
                break;
            case 'recipe':
                openRecipe(entityId, queryParams);
                break;
            case 'task':
                openTask(entityId, queryParams);
                break;
            case 'search':
                openSearch(queryParams);
                break;
            case 'dashboard':
                openDashboard(queryParams);
                break;
            default:
                console.warn('Unknown entity type:', entityType);
                // Open main window with the entity as a parameter
                openMainWindowWithEntity(entityType, entityId, queryParams);
        }
        
    } catch (error) {
        console.error('Error handling deep link:', error);
    }
}

// Function to open a note
function openNote(noteId, params = {}) {
    console.log('Opening note:', noteId, params);
    
    const noteWindow = createNewWindow({
        id: `note_${noteId}_${Date.now()}`,
        title: `Research Notebook - Note`,
        width: 1000,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        route: '/notes',
        params: {
            windowType: 'note-editor',
            noteId: noteId,
            mode: params.mode || 'edit',
            section: params.section || 'content',
            ...params
        },
        modal: false,
        resizable: true,
        maximizable: true,
        minimizable: true,
        closable: true,
        alwaysOnTop: false,
        skipTaskbar: false
    });
    
    return noteWindow;
}

// Function to open a project
function openProject(projectId, params = {}) {
    console.log('Opening project:', projectId, params);
    
    const projectWindow = createNewWindow({
        id: `project_${projectId}_${Date.now()}`,
        title: `Research Notebook - Project`,
        width: 1200,
        height: 800,
        minWidth: 1000,
        minHeight: 700,
        route: '/projects',
        params: {
            windowType: 'project-dashboard',
            projectId: projectId,
            view: params.view || 'overview',
            tab: params.tab || 'details',
            ...params
        },
        modal: false,
        resizable: true,
        maximizable: true,
        minimizable: true,
        closable: true,
        alwaysOnTop: false,
        skipTaskbar: false
    });
    
    return projectWindow;
}

// Function to open PDF from deep link
function openPDFFromDeepLink(pdfId, params = {}) {
    console.log('Opening PDF from deep link:', pdfId, params);
    
    // If pdfId is a file path, open it directly
    if (pdfId && pdfId.includes('/') || pdfId.includes('\\')) {
        openPDFFile(pdfId);
        return;
    }
    
    // Otherwise, open PDF viewer with the ID
    const pdfWindow = createNewWindow({
        id: `pdf_${pdfId}_${Date.now()}`,
        title: `Research Notebook - PDF Viewer`,
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        route: '/pdf-viewer',
        params: {
            windowType: 'pdf-viewer',
            pdfId: pdfId,
            page: params.page || 1,
            zoom: params.zoom || 1.0,
            ...params
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
}

// Function to open a protocol
function openProtocol(protocolId, params = {}) {
    console.log('Opening protocol:', protocolId, params);
    
    const protocolWindow = createNewWindow({
        id: `protocol_${protocolId}_${Date.now()}`,
        title: `Research Notebook - Protocol`,
        width: 1200,
        height: 800,
        minWidth: 1000,
        minHeight: 700,
        route: '/protocols',
        params: {
            windowType: 'protocol-viewer',
            protocolId: protocolId,
            step: params.step || 1,
            mode: params.mode || 'view',
            ...params
        },
        modal: false,
        resizable: true,
        maximizable: true,
        minimizable: true,
        closable: true,
        alwaysOnTop: false,
        skipTaskbar: false
    });
    
    return protocolWindow;
}

// Function to open a recipe
function openRecipe(recipeId, params = {}) {
    console.log('Opening recipe:', recipeId, params);
    
    const recipeWindow = createNewWindow({
        id: `recipe_${recipeId}_${Date.now()}`,
        title: `Research Notebook - Recipe`,
        width: 1200,
        height: 800,
        minWidth: 1000,
        minHeight: 700,
        route: '/recipes',
        params: {
            windowType: 'recipe-viewer',
            recipeId: recipeId,
            step: params.step || 1,
            mode: params.mode || 'view',
            ...params
        },
        modal: false,
        resizable: true,
        maximizable: true,
        minimizable: true,
        closable: true,
        alwaysOnTop: false,
        skipTaskbar: false
    });
    
    return recipeWindow;
}

// Function to open a task
function openTask(taskId, params = {}) {
    console.log('Opening task:', taskId, params);
    
    const taskWindow = createNewWindow({
        id: `task_${taskId}_${Date.now()}`,
        title: `Research Notebook - Task`,
        width: 1000,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        route: '/tasks',
        params: {
            windowType: 'task-editor',
            taskId: taskId,
            mode: params.mode || 'edit',
            ...params
        },
        modal: false,
        resizable: true,
        maximizable: true,
        minimizable: true,
        closable: true,
        alwaysOnTop: false,
        skipTaskbar: false
    });
    
    return taskWindow;
}

// Function to open search
function openSearch(params = {}) {
    console.log('Opening search with params:', params);
    
    const searchWindow = createNewWindow({
        id: `search_${Date.now()}`,
        title: `Research Notebook - Search`,
        width: 1000,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        route: '/search',
        params: {
            windowType: 'search',
            query: params.q || params.query || '',
            type: params.type || 'all',
            filters: params.filters || {},
            ...params
        },
        modal: false,
        resizable: true,
        maximizable: true,
        minimizable: true,
        closable: true,
        alwaysOnTop: false,
        skipTaskbar: false
    });
    
    return searchWindow;
}

// Function to open dashboard
function openDashboard(params = {}) {
    console.log('Opening dashboard with params:', params);
    
    const dashboardWindow = createNewWindow({
        id: `dashboard_${Date.now()}`,
        title: `Research Notebook - Dashboard`,
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800,
        route: '/dashboard',
        params: {
            windowType: 'dashboard',
            view: params.view || 'overview',
            filters: params.filters || {},
            ...params
        },
        modal: false,
        resizable: true,
        maximizable: true,
        minimizable: true,
        closable: true,
        alwaysOnTop: false,
        skipTaskbar: false
    });
    
    return dashboardWindow;
}

// Function to open main window with entity
function openMainWindowWithEntity(entityType, entityId, params = {}) {
    console.log('Opening main window with entity:', entityType, entityId, params);
    
    // Focus existing main window or create new one
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.focus();
        // Send the entity data to the main window
        mainWindow.webContents.send('deep-link-entity', {
            entityType,
            entityId,
            params
        });
    } else {
        createWindow();
        // Store the entity data to be sent when window is ready
        setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('deep-link-entity', {
                    entityType,
                    entityId,
                    params
                });
            }
        }, 2000);
    }
}

// App event handlers
app.whenReady().then(async () => {
    // Register file protocol handler for PDF files
    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient('research-notebook', process.execPath, [path.resolve(process.argv[1])]);
        }
    } else {
        app.setAsDefaultProtocolClient('research-notebook');
    }

    // Register as default PDF handler (macOS)
    if (process.platform === 'darwin') {
        app.setAsDefaultProtocolClient('file');
    }

    // Register custom URL scheme protocol
    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient('researchnotebook', process.execPath, [path.resolve(process.argv[1])]);
        }
    } else {
        app.setAsDefaultProtocolClient('researchnotebook');
    }

    // Handle files opened via protocol (macOS)
    app.on('open-file', (event, filePath) => {
        event.preventDefault();
        console.log('File opened via protocol:', filePath);
        handleFileOpen(filePath);
    });

    // Handle files opened via file protocol (Windows/Linux)
    app.on('open-url', (event, url) => {
        event.preventDefault();
        console.log('URL opened via protocol:', url);
        
        // Handle our custom deep link scheme
        if (url.startsWith('researchnotebook://')) {
            if (!isAppReady) {
                console.log('App not ready, storing URL for later:', url);
                pendingUrls.push(url);
                return;
            }
            console.log('App ready, handling deep link:', url);
            handleDeepLink(url);
            return;
        }
        
        // Handle file:// URLs
        if (url.startsWith('file://')) {
            const filePath = decodeURIComponent(url.replace('file://', ''));
            if (filePath.toLowerCase().endsWith('.pdf')) {
                handleFileOpen(filePath);
            }
        }
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

    // Initialize backend server only in production mode
    if (isProduction) {
        console.log('Production mode: Initializing backend...');
        await initializeBackend().catch(error => {
            console.error('Failed to initialize backend:', error);
        });
    } else {
        console.log('Development mode: Backend initialization skipped');
    }

    // Wait for backend to be ready before creating window
    console.log('Waiting for backend to be ready...');
    const backendReady = await waitForBackendReady();
    
    if (!backendReady) {
        console.error('Backend failed to become ready. Creating window with error fallback.');
        // Create a fallback window that shows backend connection error
        const fallbackWindow = createNewWindow({
            id: 'main',
            title: 'Research Notebook - Backend Error',
            width: 800,
            height: 600,
            route: '/error',
            skipTaskbar: false
        });
        
        // Load error page
        const errorHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Backend Connection Error - Research Notebook</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        background: #f5f5f5;
                        color: #333;
                    }
                    .error-container {
                        text-align: center;
                        max-width: 600px;
                        padding: 2rem;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .error-icon { font-size: 4rem; margin-bottom: 1rem; }
                    .error-title { font-size: 1.5rem; margin-bottom: 1rem; color: #d32f2f; }
                    .error-message { margin-bottom: 2rem; color: #666; line-height: 1.6; }
                    .retry-btn {
                        background: #1976d2;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 1rem;
                        margin: 0 10px;
                    }
                    .retry-btn:hover { background: #1565c0; }
                    .quit-btn {
                        background: #f44336;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 1rem;
                        margin: 0 10px;
                    }
                    .quit-btn:hover { background: #d32f2f; }
                    .details { margin-top: 1rem; font-size: 0.9rem; color: #999; }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <div class="error-icon">🔌</div>
                    <div class="error-title">Backend Connection Failed</div>
                    <div class="error-message">
                        The application cannot connect to the backend server. This might be because:<br><br>
                        • The backend server is not running<br>
                        • The backend server is running on a different port<br>
                        • There's a network connectivity issue<br><br>
                        Please check that the backend server is running on port 3001.
                    </div>
                    <div>
                        <button class="retry-btn" onclick="window.location.reload()">Retry Connection</button>
                        <button class="quit-btn" onclick="window.close()">Quit Application</button>
                    </div>
                    <div class="details">
                        Expected backend URL: http://localhost:3001/api/health<br>
                        Time: ${new Date().toLocaleString()}
                    </div>
                </div>
            </body>
            </html>
        `;
        
        fallbackWindow.loadURL(`data:text/html,${encodeURIComponent(errorHtml)}`);
        return;
    }

    // Initialize file watcher
    initializeFileWatcher();

    // Create window and tray
    console.log('Creating main window...');
    createWindow();
    createTray();
    
    // Mark app as ready and process any pending files and URLs
    isAppReady = true;
    processPendingFiles();
    processPendingUrls();

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

            // Check for deep links in command line arguments
            const deepLinksFromSecondInstance = commandLine.slice(1).filter(arg => 
                arg.startsWith('researchnotebook://')
            );
            
            if (deepLinksFromSecondInstance.length > 0) {
                console.log('Deep links from second instance:', deepLinksFromSecondInstance);
                deepLinksFromSecondInstance.forEach(url => {
                    handleDeepLink(url);
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



// IPC handler for saving file dialog with content
ipcMain.handle('save-file-dialog-with-content', async (event, filePath, content) => {
    try {
        // Write content to the specified file path
        if (typeof content === 'string') {
            fs.writeFileSync(filePath, content, 'utf8');
        } else if (content instanceof Buffer) {
            fs.writeFileSync(filePath, content);
        } else if (content instanceof Blob) {
            // Convert blob to buffer and write
            const arrayBuffer = await content.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fs.writeFileSync(filePath, buffer);
        } else {
            throw new Error('Unsupported content type');
        }
        
        return { success: true, filePath };
    } catch (error) {
        console.error('Error saving file with content:', error);
        return { success: false, error: error.message };
    }
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

// IPC handler for creating deep links
ipcMain.handle('create-deep-link', async (event, entityType, entityId, params = {}) => {
    try {
        const url = new URL(`researchnotebook://${entityType}/${entityId}`);
        
        // Add query parameters
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, value.toString());
            }
        });
        
        const deepLink = url.toString();
        console.log('Created deep link:', deepLink);
        
        return { success: true, deepLink };
    } catch (error) {
        console.error('Error creating deep link:', error);
        return { success: false, error: error.message };
    }
});

// IPC handler for opening deep links programmatically
ipcMain.handle('open-deep-link', async (event, url) => {
    try {
        if (!url.startsWith('researchnotebook://')) {
            throw new Error('Invalid deep link URL');
        }
        
        handleDeepLink(url);
        return { success: true };
    } catch (error) {
        console.error('Error opening deep link:', error);
        return { success: false, error: error.message };
    }
});

// IPC handler for getting current window context for deep linking
ipcMain.handle('get-deep-link-context', async (event) => {
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
                    canCreateDeepLink: true
                };
            }
        }
        return { success: false, error: 'Window context not found' };
    } catch (error) {
        console.error('Error getting deep link context:', error);
        return { success: false, error: error.message };
    }
});

// File Watcher IPC Handlers

// Get file watcher status
ipcMain.handle('file-watcher:get-status', async () => {
    try {
        return {
            success: true,
            enabled: isFileWatcherEnabled,
            folderPath: watchedFolderPath,
            isWatching: fileWatcher !== null
        };
    } catch (error) {
        console.error('Error getting file watcher status:', error);
        return { success: false, error: error.message };
    }
});

// Enable/disable file watcher
ipcMain.handle('file-watcher:set-enabled', async (event, enabled) => {
    try {
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
        
        return {
            success: true,
            enabled: isFileWatcherEnabled,
            folderPath: watchedFolderPath
        };
    } catch (error) {
        console.error('Error setting file watcher enabled:', error);
        return { success: false, error: error.message };
    }
});

// Set watched folder
ipcMain.handle('file-watcher:set-folder', async (event, folderPath) => {
    try {
        if (!folderPath) {
            stopFileWatcher();
            watchedFolderPath = null;
            saveFileWatcherSettings();
            return { success: true, enabled: false, folderPath: null };
        }
        
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
        
        return {
            success: true,
            enabled: isFileWatcherEnabled,
            folderPath: watchedFolderPath
        };
    } catch (error) {
        console.error('Error setting file watcher folder:', error);
        return { success: false, error: error.message };
    }
});

// Select folder dialog
ipcMain.handle('file-watcher:select-folder', async () => {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Select Folder to Watch'
        });
        
        if (!result.canceled && result.filePaths.length > 0) {
            const folderPath = result.filePaths[0];
            return { success: true, folderPath };
        } else {
            return { success: false, error: 'No folder selected' };
        }
    } catch (error) {
        console.error('Error selecting folder:', error);
        return { success: false, error: error.message };
    }
});

// Get supported file types
ipcMain.handle('file-watcher:get-supported-types', async () => {
    try {
        const supportedTypes = [
            { extension: '.pdf', name: 'PDF Documents', mimeType: 'application/pdf' },
            { extension: '.csv', name: 'CSV Files', mimeType: 'text/csv' },
            { extension: '.json', name: 'JSON Files', mimeType: 'application/json' },
            { extension: '.txt', name: 'Text Files', mimeType: 'text/plain' },
            { extension: '.md', name: 'Markdown Files', mimeType: 'text/markdown' },
            { extension: '.xlsx', name: 'Excel Files', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
            { extension: '.xls', name: 'Excel Files (Legacy)', mimeType: 'application/vnd.ms-excel' }
        ];
        
        return { success: true, supportedTypes };
    } catch (error) {
        console.error('Error getting supported file types:', error);
        return { success: false, error: error.message };
    }
});

// Test file watcher
ipcMain.handle('file-watcher:test', async () => {
    try {
        if (!isFileWatcherEnabled || !watchedFolderPath) {
            return { success: false, error: 'File watcher is not enabled or no folder is set' };
        }
        
        // Create a test file to verify watcher is working
        const testFileName = `test-${Date.now()}.txt`;
        const testFilePath = path.join(watchedFolderPath, testFileName);
        const testContent = `Test file created at ${new Date().toISOString()}`;
        
        fs.writeFileSync(testFilePath, testContent);
        
        // Remove the test file after a short delay
        setTimeout(() => {
            try {
                if (fs.existsSync(testFilePath)) {
                    fs.unlinkSync(testFilePath);
                }
            } catch (error) {
                console.warn('Failed to remove test file:', error);
            }
        }, 2000);
        
        return { success: true, message: 'Test file created successfully' };
    } catch (error) {
        console.error('Error testing file watcher:', error);
        return { success: false, error: error.message };
    }
}); 