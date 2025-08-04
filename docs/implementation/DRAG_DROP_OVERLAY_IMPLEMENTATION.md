# Global Drag-and-Drop Import Overlay Implementation

## Overview

The Global Drag-and-Drop Import Overlay is a comprehensive file import system that allows users to drag and drop files directly onto the Research Notebook application. The system automatically detects file types, routes them to appropriate import handlers, and provides a rich user interface for managing the import process.

## Features

### 🎯 Core Functionality
- **Global Drag Detection**: Captures drag events anywhere in the application
- **File Type Detection**: Automatically identifies file types based on MIME type and extension
- **Smart Routing**: Routes files to appropriate sections based on type
- **Progress Tracking**: Real-time progress indicators during import
- **Error Handling**: Comprehensive error handling and user feedback
- **Batch Processing**: Import multiple files simultaneously

### 📁 Supported File Types
- **PDFs** → PDF Management
- **CSV/Excel** → Database
- **JSON** → Database
- **Images** → Notes
- **Videos** → Notes
- **Audio** → Notes
- **Archives** → Projects
- **Text Files** → Notes

### 🎨 User Interface
- **Visual Overlay**: Dark backdrop with blur effect when dragging
- **Import Dialog**: Comprehensive dialog showing file details and import options
- **Progress Indicators**: Real-time progress bars and status updates
- **Notifications**: Success/error notifications via snackbar
- **File Metadata**: Displays file size, modification date, and content preview

## Implementation Details

### Component Structure

```
GlobalDragDropOverlay/
├── GlobalDragDropOverlay.tsx (Main component)
├── EnhancedCommandPaletteProvider.tsx (Integration)
└── App.tsx (Integration point)
```

### Key Components

#### 1. GlobalDragDropOverlay.tsx
The main component that handles all drag-and-drop functionality.

**Key Features:**
- Global drag event listeners
- File type detection and routing
- Import dialog management
- Progress tracking
- Error handling

**Props:**
```typescript
interface FileImportInfo {
    id: string;
    file: File;
    type: 'pdf' | 'csv' | 'excel' | 'json' | 'image' | 'video' | 'audio' | 'archive' | 'text' | 'unknown';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    error?: string;
    warning?: string;
    importTarget?: 'notes' | 'projects' | 'protocols' | 'database' | 'tasks' | 'recipes' | 'pdfs';
    metadata?: {
        size: string;
        lastModified: Date;
        preview?: string;
        rowCount?: number;
        columns?: string[];
    };
}
```

#### 2. EnhancedCommandPaletteProvider.tsx
Enhanced command palette provider that integrates with the drag-and-drop system.

**Key Features:**
- Recent items tracking
- Searchable items management
- Import action handlers
- localStorage persistence

### File Type Detection

The system uses a combination of MIME type and file extension for robust file type detection:

```typescript
const getFileType = (file: File): FileImportInfo['type'] => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;

    if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf';
    if (mimeType === 'text/csv' || extension === 'csv') return 'csv';
    if (mimeType.includes('spreadsheet') || extension === 'xlsx' || extension === 'xls') return 'excel';
    if (mimeType === 'application/json' || extension === 'json') return 'json';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return 'archive';
    if (mimeType.startsWith('text/') || extension === 'txt' || extension === 'md') return 'text';
    
    return 'unknown';
};
```

### Import Target Routing

Files are automatically routed to appropriate sections based on their type:

```typescript
const getImportTarget = (type: FileImportInfo['type']): FileImportInfo['importTarget'] => {
    switch (type) {
        case 'pdf': return 'pdfs';
        case 'csv': return 'database';
        case 'excel': return 'database';
        case 'json': return 'database';
        case 'image': return 'notes';
        case 'video': return 'notes';
        case 'audio': return 'notes';
        case 'archive': return 'projects';
        case 'text': return 'notes';
        default: return 'notes';
    }
};
```

### File Metadata Parsing

The system extracts rich metadata from files to provide better user experience:

```typescript
const parseFileMetadata = async (file: File, type: FileImportInfo['type']): Promise<FileImportInfo['metadata']> => {
    const metadata: FileImportInfo['metadata'] = {
        size: formatFileSize(file.size),
        lastModified: new Date(file.lastModified)
    };

    if (type === 'csv' || type === 'excel') {
        // Parse CSV/Excel headers and row count
        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0]?.split(',').map(h => h.trim()) || [];
        metadata.rowCount = lines.length - 1;
        metadata.columns = headers;
        metadata.preview = lines.slice(0, 5).join('\n');
    } else if (type === 'json') {
        // Parse JSON structure
        const text = await file.text();
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
            metadata.rowCount = data.length;
            metadata.columns = Object.keys(data[0] || {});
        }
        metadata.preview = text.substring(0, 500) + (text.length > 500 ? '...' : '');
    }
    // ... more file type handling

    return metadata;
};
```

## User Experience Flow

### 1. Drag Detection
- User drags files over the application window
- Dark overlay appears with blur effect
- Centered upload icon and instructions are displayed

### 2. File Analysis
- Files are analyzed for type and metadata
- Import targets are determined automatically
- File information is displayed in the import dialog

### 3. Import Dialog
- Comprehensive dialog shows all dropped files
- Each file displays:
  - File icon based on type
  - File name and size
  - Modification date
  - Import target
  - Row/column count (for data files)
  - Preview content (for text files)

### 4. Import Process
- User can import individual files or all files
- Progress bars show real-time import progress
- Status indicators show completion/failure
- Success/error notifications appear

### 5. Integration
- Imported files appear in recent items
- Command palette shows imported files
- Navigation to appropriate sections

## Integration Points

### 1. App.tsx Integration
```typescript
<EnhancedCommandPaletteProvider>
    <ProtectedRoutes />
    <GlobalDragDropOverlay />
</EnhancedCommandPaletteProvider>
```

### 2. Command Palette Integration
- Imported files are added to recent items
- Command palette shows imported file names
- Clicking on imported items navigates to correct sections

### 3. Navigation Integration
- Files are routed to appropriate sections
- Recent items tracking for quick access
- Deep linking support for imported content

## Error Handling

### File Type Errors
- Unsupported file types are clearly marked
- Error messages explain why files can't be imported
- Users can remove problematic files from the queue

### Import Errors
- Failed imports show detailed error messages
- Progress tracking stops on failure
- Users can retry failed imports
- Application remains stable during errors

### Network/System Errors
- Graceful handling of file read errors
- Timeout handling for large files
- Fallback behavior for corrupted files

## Performance Considerations

### File Size Limits
- Large files are handled efficiently
- Progress tracking prevents UI freezing
- Memory usage is optimized for batch imports

### Batch Processing
- Multiple files are processed sequentially
- Progress is tracked per file
- Users can cancel ongoing imports

### UI Responsiveness
- Drag events don't block the UI
- Progress updates are throttled appropriately
- Import dialog remains responsive during processing

## Testing

### Test Script
A comprehensive test script (`test-drag-drop-overlay.js`) is provided to verify functionality:

1. **Application Startup**: Verifies the app starts correctly
2. **Drag Overlay Visibility**: Tests overlay appearance
3. **File Type Detection**: Verifies correct file type identification
4. **Import Dialog**: Tests dialog functionality
5. **Import Processing**: Verifies import workflow
6. **Error Handling**: Tests error scenarios
7. **Command Palette Integration**: Verifies integration
8. **File Routing**: Tests routing logic

### Manual Testing
The test script provides guidance for manual verification:
- Drag files over the application window
- Check overlay styling and behavior
- Verify import dialog information
- Test import functionality
- Confirm file routing
- Check command palette integration

## Future Enhancements

### Planned Features
1. **Advanced File Processing**
   - OCR for image files
   - PDF text extraction
   - Video thumbnail generation

2. **Import Templates**
   - Custom import configurations
   - Field mapping templates
   - Batch import presets

3. **Cloud Integration**
   - Direct cloud storage imports
   - Google Drive integration
   - Dropbox integration

4. **Advanced Validation**
   - File content validation
   - Duplicate detection
   - Format verification

### Performance Improvements
1. **Parallel Processing**
   - Concurrent file imports
   - Background processing
   - Queue management

2. **Caching**
   - Import result caching
   - Metadata caching
   - Progress persistence

## Troubleshooting

### Common Issues

1. **Overlay Not Appearing**
   - Check if drag events are being captured
   - Verify z-index settings
   - Check for conflicting event handlers

2. **File Type Detection Issues**
   - Verify MIME type detection
   - Check file extension handling
   - Test with different file types

3. **Import Failures**
   - Check file permissions
   - Verify file integrity
   - Check import target availability

4. **Performance Issues**
   - Monitor file size limits
   - Check memory usage
   - Verify progress tracking

### Debug Mode
Enable debug logging by setting:
```typescript
const DEBUG_DRAG_DROP = true;
```

This will log detailed information about:
- Drag events
- File type detection
- Import progress
- Error details

## Conclusion

The Global Drag-and-Drop Import Overlay provides a seamless and intuitive way for users to import files into the Research Notebook application. With automatic file type detection, smart routing, and comprehensive error handling, it significantly improves the user experience for file management tasks.

The implementation is designed to be extensible, allowing for future enhancements while maintaining performance and reliability. The integration with the command palette and navigation system ensures that imported files are easily accessible and properly organized within the application. 