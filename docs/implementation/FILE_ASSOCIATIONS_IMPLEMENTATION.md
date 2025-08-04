# File Associations Implementation

## Overview

This document describes the implementation of file associations for PDF files in the Research Notebook Electron application. The app is configured to be a valid handler for PDF files on Windows and macOS, triggering open events when users double-click PDF files or use "Open with" functionality.

## Configuration Files

### 1. electron-builder.json

The main configuration file that defines file associations for all platforms:

#### Windows Configuration
```json
"win": {
    "fileAssociations": [
        {
            "ext": "pdf",
            "name": "PDF Document",
            "description": "PDF Document",
            "icon": "electron/assets/app-icon.ico",
            "role": "Viewer",
            "mimeType": "application/pdf",
            "perMachine": true
        }
    ]
}
```

#### macOS Configuration
```json
"mac": {
    "extendInfo": {
        "CFBundleDocumentTypes": [
            {
                "CFBundleTypeName": "PDF Document",
                "CFBundleTypeRole": "Viewer",
                "CFBundleTypeExtensions": ["pdf"],
                "CFBundleTypeIconFile": "app-icon.icns",
                "LSHandlerRank": "Owner",
                "LSItemContentTypes": ["com.adobe.pdf"],
                "CFBundleTypeOSTypes": ["PDF "],
                "CFBundleTypeMIMETypes": ["application/pdf"],
                "LSTypeIsPackage": false,
                "CFBundleTypeIconSystemGenerated": 0
            }
        ]
    }
}
```

#### Linux Configuration
```json
"linux": {
    "fileAssociations": [
        {
            "ext": "pdf",
            "name": "PDF Document",
            "description": "PDF Document",
            "icon": "electron/assets/app-icon.png",
            "role": "Viewer",
            "mimeType": "application/pdf"
        }
    ]
}
```

### 2. NSIS Installer Script (electron/assets/installer.nsh)

Enhanced installer script that registers file associations in the Windows registry:

```nsh
!macro customInstall
    ; Register file associations for PDF files
    WriteRegStr HKCR ".pdf" "" "ResearchNotebook.PDF"
    WriteRegStr HKCR "ResearchNotebook.PDF" "" "PDF Document"
    WriteRegStr HKCR "ResearchNotebook.PDF\DefaultIcon" "" "$INSTDIR\app-icon.ico,0"
    WriteRegStr HKCR "ResearchNotebook.PDF\shell\open\command" "" '"$INSTDIR\Research Notebook.exe" "%1"'
    WriteRegStr HKCR "ResearchNotebook.PDF\shell\print\command" "" '"$INSTDIR\Research Notebook.exe" "%1"'
    
    ; Register MIME type
    WriteRegStr HKCR "MIME\Database\Content Type\application\pdf" "Extension" ".pdf"
    WriteRegStr HKCR "MIME\Database\Content Type\application\pdf" "CLSID" "{25336920-03F9-11cf-8FD0-00AA00686F13}"
!macroend
```

## Event Handling in Main Process

### File Open Events (electron/main.js)

The main process handles multiple types of file open events:

#### 1. macOS File Events
```javascript
// Handle files opened via protocol (macOS)
app.on('open-file', (event, filePath) => {
    event.preventDefault();
    console.log('File opened via protocol:', filePath);
    handleFileOpen(filePath);
});
```

#### 2. Protocol Events
```javascript
// Handle files opened via file protocol (Windows/Linux)
app.on('open-url', (event, url) => {
    event.preventDefault();
    console.log('URL opened via protocol:', url);
    
    // Handle file:// URLs
    if (url.startsWith('file://')) {
        const filePath = decodeURIComponent(url.replace('file://', ''));
        if (filePath.toLowerCase().endsWith('.pdf')) {
            handleFileOpen(filePath);
        }
    }
});
```

#### 3. Command Line Arguments
```javascript
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
```

#### 4. Second Instance Handling
```javascript
app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Check for PDF files in command line arguments
    const filesFromSecondInstance = commandLine.slice(1).filter(arg => 
        arg.toLowerCase().endsWith('.pdf') && fs.existsSync(arg)
    );
    
    if (filesFromSecondInstance.length > 0) {
        filesFromSecondInstance.forEach(filePath => {
            openPDFFile(filePath);
        });
    }
});
```

## PDF File Opening Function

```javascript
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
            }
        });

        return pdfWindow;
    } catch (error) {
        console.error('Error opening PDF file:', error);
    }
}
```

## Testing File Associations

### Test Script
A test script (`test-file-associations.js`) is provided to verify file associations:

```bash
node test-file-associations.js
```

### Manual Testing
1. **Double-click a PDF file** - Should open in Research Notebook
2. **Right-click a PDF** - Should show "Open with Research Notebook" option
3. **Drag and drop** - Should open PDF when dropped on app icon
4. **Command line** - `"Research Notebook.exe" document.pdf"` should work

## Platform-Specific Details

### Windows
- File associations are registered in the Windows Registry
- NSIS installer handles registration during installation
- Uninstaller cleans up registry entries
- Uses `perMachine: true` for system-wide registration

### macOS
- Uses `CFBundleDocumentTypes` in Info.plist
- `LSHandlerRank: "Owner"` makes the app the primary handler
- Supports both file extensions and UTI content types
- Launch Services automatically handles registration

### Linux
- Uses `.desktop` files for file associations
- MIME type associations via `xdg-mime`
- File associations defined in electron-builder configuration

## Troubleshooting

### Common Issues

1. **File associations not working after installation**
   - Check if installer ran with administrator privileges
   - Verify registry entries on Windows
   - Check Launch Services on macOS

2. **App not appearing in "Open with" menu**
   - Rebuild and reinstall the application
   - Clear Launch Services cache on macOS: `lsregister -kill -r -domain local -domain system -domain user`

3. **PDF files opening in wrong application**
   - Set Research Notebook as default PDF handler
   - Clear existing file associations and reinstall

### Debug Commands

#### Windows
```cmd
reg query "HKEY_CLASSES_ROOT\.pdf"
reg query "HKEY_CLASSES_ROOT\ResearchNotebook.PDF"
```

#### macOS
```bash
defaults read com.researchnotebook.app CFBundleDocumentTypes
lsregister -dump | grep -A 5 -B 5 "com.researchnotebook"
```

#### Linux
```bash
xdg-mime query default application/pdf
cat ~/.local/share/applications/research-notebook.desktop
```

## Security Considerations

1. **File validation** - All opened files are validated for PDF extension
2. **Path sanitization** - File paths are properly decoded and validated
3. **Sandboxing** - App runs with appropriate security restrictions
4. **Permission handling** - Proper file access permissions are requested

## Future Enhancements

1. **Multiple file support** - Handle opening multiple PDFs simultaneously
2. **Recent files** - Track recently opened PDF files
3. **File watching** - Monitor for changes in opened PDF files
4. **Advanced file types** - Support for additional document formats 