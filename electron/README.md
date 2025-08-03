# Electron Integration for Research Notebook

This directory contains the Electron wrapper that turns your Research Notebook app into a desktop application.

## 🚀 Quick Start

### Development Mode
```bash
# Install dependencies (if not already done)
pnpm install

# Start the full stack in development mode
pnpm start
```

This will:
1. Start the Vite dev server (frontend) on port 5173
2. Start the Express backend on port 3000
3. Launch Electron pointing to the dev server

### Production Build
```bash
# Build the frontend
pnpm frontend:build

# Package the Electron app
pnpm electron:build
```

## 📁 File Structure

```
electron/
├── main.js              # Main Electron process
├── preload.js           # Preload script for renderer
├── utils/
│   └── spawnBackend.js  # Backend process management
├── assets/              # App icons and resources
└── README.md           # This file
```

## 🔧 Configuration

### Main Process (`main.js`)
- Creates the main browser window
- Spawns the backend server process
- Handles app lifecycle events
- Manages IPC communication

### Preload Script (`preload.js`)
- Exposes safe APIs to the renderer process
- Provides file system access
- Handles environment detection

### Backend Spawner (`utils/spawnBackend.js`)
- Manages backend server process lifecycle
- Handles development vs production modes
- Provides health checking and error handling

## 🌐 API Integration

The Electron app provides these additional APIs to the frontend:

### File System APIs
```typescript
// Open file dialog
const files = await window.electronAPI.openFileDialog();

// Save file dialog
const path = await window.electronAPI.saveFileDialog('report.pdf');

// Select directory
const dirs = await window.electronAPI.selectDirectory();
```

### App Control APIs
```typescript
// Quit the app
await window.electronAPI.quitApp();

// Minimize to tray
await window.electronAPI.minimizeToTray();

// Restore from tray
await window.electronAPI.restoreFromTray();
```

### Environment Detection
```typescript
// Check if running in Electron
const isElectron = window.electronAPI?.isElectron;

// Get app info
const appInfo = {
  name: window.electronAPI?.getAppName(),
  version: window.electronAPI?.getVersion(),
  platform: window.electronAPI?.getPlatform()
};
```

## 📦 Packaging

### Build Configuration
The app uses `electron-builder` for packaging with the following targets:

- **macOS**: DMG installer (x64 + ARM64)
- **Windows**: NSIS installer (x64)
- **Linux**: AppImage (x64)

### Build Process
1. Frontend is built to `apps/frontend/dist/`
2. Backend source is included in the package
3. Electron wrapper is bundled with the app
4. Database and uploads are included as resources

### Distribution
Built packages are output to `dist-electron/` directory.

## 🔒 Security

- **Context Isolation**: Enabled to prevent direct Node.js access
- **Preload Script**: Only exposes necessary APIs
- **Web Security**: Enabled for secure content loading
- **Sandboxing**: Backend runs in separate process

## 🛠️ Development

### Adding New APIs
1. Add IPC handler in `main.js`
2. Expose API in `preload.js`
3. Update TypeScript types in `apps/frontend/src/utils/fileSystemAPI.ts`

### Debugging
- DevTools are automatically opened in development mode
- Backend logs are piped to console
- Use `console.log` in preload script for debugging

### Environment Variables
- `NODE_ENV`: Set to 'development' for dev mode
- `ELECTRON_START_URL`: Override frontend URL
- `BACKEND_PORT`: Override backend port

## 📱 Platform Support

### macOS
- Native menu bar integration
- Dark mode support
- Hardened runtime enabled
- Universal binary (Intel + Apple Silicon)

### Windows
- Native Windows installer
- Start menu integration
- Desktop shortcuts
- Auto-update support

### Linux
- AppImage format for easy distribution
- Desktop integration
- System tray support

## 🔄 Updates

The app is configured for automatic updates via GitHub releases:

1. Tag releases with semantic versioning
2. Build packages for all platforms
3. Upload to GitHub releases
4. App will check for updates automatically

## 🐛 Troubleshooting

### Backend Won't Start
- Check if port 3000 is available
- Verify backend dependencies are installed
- Check backend logs in console

### Frontend Won't Load
- Verify Vite dev server is running on port 5173
- Check network connectivity
- Review console for errors

### Build Failures
- Ensure all dependencies are installed
- Check Node.js version compatibility
- Verify build resources exist

### Packaging Issues
- Ensure all required files are included
- Check file paths in electron-builder config
- Verify platform-specific requirements

## 📚 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Documentation](https://www.electron.build/)
- [Vite Documentation](https://vitejs.dev/)
- [Express.js Documentation](https://expressjs.com/) 