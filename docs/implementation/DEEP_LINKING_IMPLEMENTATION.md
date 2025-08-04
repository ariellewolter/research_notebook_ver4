# Deep Linking Implementation

## Overview

This document describes the implementation of deep linking via custom URL scheme (`researchnotebook://`) in the Research Notebook Electron application. The system allows users to open specific entities (notes, projects, PDFs, protocols, recipes, tasks) directly through URLs, enabling seamless integration with external applications and web browsers.

## URL Scheme

The application uses the custom URL scheme: `researchnotebook://`

### URL Format
```
researchnotebook://{entity-type}/{entity-id}?{query-parameters}
```

### Supported Entity Types

1. **Notes**: `researchnotebook://note/{note-id}`
2. **Projects**: `researchnotebook://project/{project-id}`
3. **PDFs**: `researchnotebook://pdf/{pdf-id-or-path}`
4. **Protocols**: `researchnotebook://protocol/{protocol-id}`
5. **Recipes**: `researchnotebook://recipe/{recipe-id}`
6. **Tasks**: `researchnotebook://task/{task-id}`
7. **Search**: `researchnotebook://search`
8. **Dashboard**: `researchnotebook://dashboard`

## Configuration

### 1. electron-builder.json

#### macOS Configuration
```json
"mac": {
    "extendInfo": {
        "CFBundleURLTypes": [
            {
                "CFBundleURLName": "Research Notebook URL Scheme",
                "CFBundleURLSchemes": ["researchnotebook"],
                "CFBundleURLIconFile": "app-icon.icns"
            }
        ]
    }
}
```

#### Windows Configuration
```json
"win": {
    "protocols": [
        {
            "name": "Research Notebook URL Scheme",
            "schemes": ["researchnotebook"]
        }
    ]
}
```

### 2. NSIS Installer Script (electron/assets/installer.nsh)

```nsh
!macro customInstall
    ; Register custom URL scheme protocol
    WriteRegStr HKCR "researchnotebook" "" "URL:Research Notebook Protocol"
    WriteRegStr HKCR "researchnotebook" "URL Protocol" ""
    WriteRegStr HKCR "researchnotebook\DefaultIcon" "" "$INSTDIR\app-icon.ico,0"
    WriteRegStr HKCR "researchnotebook\shell\open\command" "" '"$INSTDIR\Research Notebook.exe" "%1"'
!macroend
```

## Event Handling

### Main Process (electron/main.js)

The main process handles deep links through multiple event handlers:

#### 1. Protocol Registration
```javascript
// Register custom URL scheme protocol
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('researchnotebook', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('researchnotebook');
}
```

#### 2. URL Event Handling
```javascript
app.on('open-url', (event, url) => {
    event.preventDefault();
    
    // Handle our custom deep link scheme
    if (url.startsWith('researchnotebook://')) {
        if (!isAppReady) {
            pendingUrls.push(url);
            return;
        }
        handleDeepLink(url);
        return;
    }
});
```

#### 3. Second Instance Handling
```javascript
app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Check for deep links in command line arguments
    const deepLinksFromSecondInstance = commandLine.slice(1).filter(arg => 
        arg.startsWith('researchnotebook://')
    );
    
    if (deepLinksFromSecondInstance.length > 0) {
        deepLinksFromSecondInstance.forEach(url => {
            handleDeepLink(url);
        });
    }
});
```

## Deep Link Processing

### URL Parsing Function
```javascript
function handleDeepLink(url) {
    try {
        const urlObj = new URL(url);
        
        // Check if it's our custom scheme
        if (urlObj.protocol !== 'researchnotebook:') {
            return;
        }
        
        // Parse the path to determine the entity type and ID
        const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
        const entityType = pathParts[0].toLowerCase();
        const entityId = pathParts[1];
        const queryParams = Object.fromEntries(urlObj.searchParams.entries());
        
        // Handle different entity types
        switch (entityType) {
            case 'note':
                openNote(entityId, queryParams);
                break;
            case 'project':
                openProject(entityId, queryParams);
                break;
            // ... other entity types
        }
    } catch (error) {
        console.error('Error handling deep link:', error);
    }
}
```

## Entity Opening Functions

### Note Opening
```javascript
function openNote(noteId, params = {}) {
    const noteWindow = createNewWindow({
        id: `note_${noteId}_${Date.now()}`,
        title: `Research Notebook - Note`,
        route: '/notes',
        params: {
            windowType: 'note-editor',
            noteId: noteId,
            mode: params.mode || 'edit',
            section: params.section || 'content',
            ...params
        }
    });
}
```

### Project Opening
```javascript
function openProject(projectId, params = {}) {
    const projectWindow = createNewWindow({
        id: `project_${projectId}_${Date.now()}`,
        title: `Research Notebook - Project`,
        route: '/projects',
        params: {
            windowType: 'project-dashboard',
            projectId: projectId,
            view: params.view || 'overview',
            tab: params.tab || 'details',
            ...params
        }
    });
}
```

## IPC Handlers

### Creating Deep Links
```javascript
ipcMain.handle('create-deep-link', async (event, entityType, entityId, params = {}) => {
    const url = new URL(`researchnotebook://${entityType}/${entityId}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.set(key, value.toString());
        }
    });
    
    return { success: true, deepLink: url.toString() };
});
```

### Opening Deep Links
```javascript
ipcMain.handle('open-deep-link', async (event, url) => {
    if (!url.startsWith('researchnotebook://')) {
        throw new Error('Invalid deep link URL');
    }
    
    handleDeepLink(url);
    return { success: true };
});
```

## Example Deep Links

### Notes
```
researchnotebook://note/123
researchnotebook://note/123?mode=edit&section=content
researchnotebook://note/123?mode=view&highlight=true
```

### Projects
```
researchnotebook://project/456
researchnotebook://project/456?view=overview&tab=details
researchnotebook://project/456?view=tasks&filter=active
```

### PDFs
```
researchnotebook://pdf/document.pdf
researchnotebook://pdf/document.pdf?page=10&zoom=1.2
researchnotebook://pdf/123?page=5&highlight=true
```

### Protocols
```
researchnotebook://protocol/789
researchnotebook://protocol/789?step=3&mode=edit
researchnotebook://protocol/789?step=1&mode=view
```

### Recipes
```
researchnotebook://recipe/101
researchnotebook://recipe/101?step=1&mode=view
researchnotebook://recipe/101?step=2&mode=edit
```

### Tasks
```
researchnotebook://task/202
researchnotebook://task/202?mode=edit
researchnotebook://task/202?mode=view&show=details
```

### Search
```
researchnotebook://search?q=research
researchnotebook://search?q=protocol&type=all
researchnotebook://search?q=project&filters=active
```

### Dashboard
```
researchnotebook://dashboard
researchnotebook://dashboard?view=projects&filters=active
researchnotebook://dashboard?view=recent&tab=notes
```

## Usage Examples

### From Web Browser
```html
<a href="researchnotebook://note/123">Open Note 123</a>
<a href="researchnotebook://project/456?view=overview">Open Project 456</a>
<a href="researchnotebook://search?q=research">Search for Research</a>
```

### From Command Line
```bash
# macOS
open "researchnotebook://note/123"

# Windows
start "researchnotebook://project/456"

# Linux
xdg-open "researchnotebook://search?q=protocol"
```

### From Other Applications
```javascript
// JavaScript
window.location.href = 'researchnotebook://note/123?mode=edit';

// Python
import webbrowser
webbrowser.open('researchnotebook://project/456?view=tasks')
```

### From Frontend (React)
```javascript
import { ipcRenderer } from 'electron';

// Create a deep link
const createDeepLink = async (entityType, entityId, params) => {
    const result = await ipcRenderer.invoke('create-deep-link', entityType, entityId, params);
    if (result.success) {
        return result.deepLink;
    }
};

// Open a deep link
const openDeepLink = async (url) => {
    const result = await ipcRenderer.invoke('open-deep-link', url);
    return result.success;
};

// Example usage
const noteLink = await createDeepLink('note', '123', { mode: 'edit' });
await openDeepLink(noteLink);
```

## Testing

### Test Script
Run the test script to verify deep linking functionality:
```bash
node test-deep-linking.js
```

### Manual Testing
1. **Browser Testing**: Navigate to `researchnotebook://note/123` in a web browser
2. **Command Line Testing**: Use `open "researchnotebook://project/456"` (macOS)
3. **External App Testing**: Create links in documents or other applications
4. **Second Instance Testing**: Open deep links when app is already running

## Platform-Specific Details

### Windows
- Protocol registration in Windows Registry
- NSIS installer handles registration
- Uninstaller cleans up registry entries
- Uses `perMachine: true` for system-wide registration

### macOS
- URL scheme registration in Info.plist
- Launch Services automatically handles registration
- Supports both development and production builds
- Protocol handlers work with `open` command

### Linux
- Uses `.desktop` files for protocol registration
- MIME type associations via `xdg-mime`
- Protocol handlers work with `xdg-open` command

## Security Considerations

1. **URL Validation**: All deep links are validated for correct scheme
2. **Entity Validation**: Entity IDs are validated before opening
3. **Parameter Sanitization**: Query parameters are properly parsed and validated
4. **Error Handling**: Graceful error handling for invalid URLs
5. **Sandboxing**: App runs with appropriate security restrictions

## Troubleshooting

### Common Issues

1. **Deep links not working after installation**
   - Check if installer ran with administrator privileges
   - Verify protocol registration in registry (Windows)
   - Check Launch Services on macOS

2. **App not responding to deep links**
   - Rebuild and reinstall the application
   - Clear Launch Services cache on macOS
   - Check if app is properly registered as protocol handler

3. **Deep links opening wrong entity**
   - Verify entity ID format and validity
   - Check query parameter parsing
   - Ensure proper error handling

### Debug Commands

#### Windows
```cmd
reg query "HKEY_CLASSES_ROOT\researchnotebook"
```

#### macOS
```bash
defaults read com.researchnotebook.app CFBundleURLTypes
lsregister -dump | grep -A 5 -B 5 "researchnotebook"
```

#### Linux
```bash
cat ~/.local/share/applications/research-notebook.desktop
```

## Future Enhancements

1. **Universal Links**: Support for HTTPS deep links
2. **Deep Link Analytics**: Track deep link usage
3. **Custom Actions**: Support for custom deep link actions
4. **Deep Link Sharing**: Generate shareable deep links
5. **Deep Link History**: Track recently opened deep links
6. **Deep Link Templates**: Predefined deep link templates 