# Export Options Integrated in Project/Experiment Views

## Overview

The Export functionality provides comprehensive data export capabilities for Projects and Experiments in the Research Notebook application. It includes a modal interface for format selection, configurable export options, and integration with Electron's native save dialog for seamless file saving.

## Features

### 🎯 Core Functionality
- **Export Button**: Integrated into Project/Experiment page headers
- **Format Selection**: Support for CSV, JSON, Excel, and PDF formats
- **Configurable Options**: Metadata, relationships, notes, and file references
- **Native Save Dialog**: Electron integration for file saving
- **Data Summary**: Real-time preview of data to be exported
- **Filename Customization**: Optional custom filename with default generation

### 📊 Export Formats
- **CSV**: Comma-separated values for spreadsheet applications
- **JSON**: Structured data format for APIs and data exchange
- **Excel**: Multi-sheet Excel format with formatting support
- **PDF**: Formatted document with tables and styling

### 🎨 User Interface
- **Export Modal**: Clean, intuitive interface for export configuration
- **Format Cards**: Visual format selection with descriptions and icons
- **Option Toggles**: Checkbox-based configuration for export options
- **Progress Indicators**: Loading states and progress feedback
- **Error Handling**: Clear error messages and recovery guidance

## Implementation Details

### Component Structure

```
Export Functionality/
├── apps/frontend/src/components/ExportModal.tsx (Main export modal)
├── apps/frontend/src/services/exportService.ts (Export service)
├── apps/frontend/src/pages/Projects.tsx (Integration)
├── apps/frontend/src/pages/ExperimentsDashboard.tsx (Integration)
├── electron/preload.js (Electron API)
├── electron/main.js (IPC handlers)
└── test-export-functionality.js (Test script)
```

### Key Components

#### 1. Export Modal (ExportModal.tsx)
The main React component that provides the export interface.

**Key Features:**
- Format selection with visual cards
- Export options configuration
- Data summary display
- Filename customization
- Progress and error handling

**Component Interface:**
```typescript
interface ExportModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    data: ExportData;
    availableFormats?: ExportFormat[];
    availableOptions?: ExportOption[];
    onExport: (format: string, options: string[], filename?: string) => Promise<void>;
}
```

**Export Format Interface:**
```typescript
interface ExportFormat {
    value: string;
    label: string;
    icon: React.ReactNode;
    description: string;
    extensions: string[];
}
```

**Export Option Interface:**
```typescript
interface ExportOption {
    key: string;
    label: string;
    description?: string;
    default: boolean;
}
```

#### 2. Export Service (exportService.ts)
The service that handles the actual export functionality.

**Key Methods:**
```typescript
class ExportService {
    async exportToCSV(data: ExportData, options: ExportOptions, filename: string): Promise<void>
    async exportToJSON(data: ExportData, options: ExportOptions, filename: string): Promise<void>
    async exportToExcel(data: ExportData, options: ExportOptions, filename: string): Promise<void>
    async exportToPDF(data: ExportData, options: ExportOptions, filename: string): Promise<void>
    async exportData(format: string, data: ExportData, options: ExportOptions, filename: string): Promise<void>
}
```

**Export Data Interface:**
```typescript
interface ExportData {
    projects?: any[];
    experiments?: any[];
    protocols?: any[];
    notes?: any[];
    databaseEntries?: any[];
    tasks?: any[];
    pdfs?: any[];
}
```

**Export Options Interface:**
```typescript
interface ExportOptions {
    includeMetadata: boolean;
    includeRelationships: boolean;
    includeNotes: boolean;
    includeFiles: boolean;
}
```

#### 3. Electron Integration
Integration with Electron for native file saving.

**Preload Script (preload.js):**
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
    // ... existing APIs ...
    saveFileDialog: (defaultName) => ipcRenderer.invoke('save-file-dialog', defaultName),
    saveFileDialogWithContent: (filePath, content) => ipcRenderer.invoke('save-file-dialog-with-content', filePath, content),
});
```

**Main Process (main.js):**
```javascript
// IPC handler for saving file dialog with content
ipcMain.handle('save-file-dialog-with-content', async (event, filePath, content) => {
    try {
        // Write content to the specified file path
        if (typeof content === 'string') {
            fs.writeFileSync(filePath, content, 'utf8');
        } else if (content instanceof Buffer) {
            fs.writeFileSync(filePath, content);
        } else if (content instanceof Blob) {
            const arrayBuffer = await content.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fs.writeFileSync(filePath, buffer);
        }
        
        return { success: true, filePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});
```

## User Experience Flow

### 1. Export Button Access
- User navigates to Projects or Experiments page
- Export button is visible in the page header
- Button has download icon and outlined styling

### 2. Modal Opening
- Click Export button opens the export modal
- Modal shows data summary and format options
- Default format (CSV) is pre-selected

### 3. Format Selection
- User can select from available formats
- Each format shows icon, description, and file extensions
- Visual feedback for selected format

### 4. Options Configuration
- User can configure export options via checkboxes
- Options include metadata, relationships, notes, and files
- Default options are pre-selected

### 5. Filename Customization
- User can enter custom filename or use default
- Default filename includes timestamp and format extension
- Helper text explains filename usage

### 6. Export Execution
- Click Export button initiates export process
- Loading state shows during export
- Electron save dialog opens for file location
- Success message appears after completion

## Export Format Details

### CSV Export
```typescript
async exportToCSV(data: ExportData, options: ExportOptions, filename: string): Promise<void> {
    const csvData = this.prepareDataForExport(data, options);
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    // Use Electron save dialog if available
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const result = await (window as any).electronAPI.saveFileDialog(filename);
        if (result.success) {
            await this.saveFileWithElectron(result.filePath, csv);
        }
    } else {
        saveAs(blob, filename);
    }
}
```

### JSON Export
```typescript
async exportToJSON(data: ExportData, options: ExportOptions, filename: string): Promise<void> {
    const jsonData = this.prepareDataForExport(data, options);
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    
    // Similar Electron integration as CSV
}
```

### Excel Export
```typescript
async exportToExcel(data: ExportData, options: ExportOptions, filename: string): Promise<void> {
    const workbook = XLSX.utils.book_new();
    
    // Create worksheets for each data type
    if (data.projects && data.projects.length > 0) {
        const projectsData = this.prepareDataForExport({ projects: data.projects }, options);
        const worksheet = XLSX.utils.json_to_sheet(projectsData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
    }
    
    // Similar for other data types...
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Electron integration
}
```

### PDF Export
```typescript
async exportToPDF(data: ExportData, options: ExportOptions, filename: string): Promise<void> {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Add title and timestamp
    doc.setFontSize(20);
    doc.text('Research Notebook Export', 20, yPosition);
    yPosition += 20;
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 15;
    
    // Export each data type with tables
    if (data.projects && data.projects.length > 0) {
        yPosition = this.addSectionToPDF(doc, 'Projects', data.projects, yPosition, options);
    }
    
    // Similar for other data types...
    
    const pdfBlob = doc.output('blob');
    // Electron integration
}
```

## Data Processing

### Data Preparation
```typescript
private prepareDataForExport(data: ExportData, options: ExportOptions): any[] {
    const exportData: any[] = [];
    
    // Process projects
    if (data.projects) {
        data.projects.forEach(project => {
            const exportItem: any = {
                type: 'project',
                name: project.name,
                description: project.description,
                status: project.status,
                startDate: project.startDate,
                lastActivity: project.lastActivity,
                createdAt: project.createdAt
            };
            
            if (options.includeMetadata) {
                exportItem.id = project.id;
                exportItem.updatedAt = project.updatedAt;
            }
            
            if (options.includeRelationships && project.experiments) {
                exportItem.experimentCount = project.experiments.length;
                exportItem.experimentNames = project.experiments.map((exp: any) => exp.name).join(', ');
            }
            
            exportData.push(exportItem);
        });
    }
    
    // Similar processing for other data types...
    
    return exportData;
}
```

### PDF Table Generation
```typescript
private addSectionToPDF(doc: jsPDF, title: string, items: any[], yPosition: number, options: ExportOptions): number {
    // Add section title
    doc.setFontSize(16);
    doc.text(title, 20, yPosition);
    yPosition += 10;
    
    // Create table data
    const tableData = items.map(item => {
        const row: any = {
            Name: item.name || item.title,
            Description: item.description || '',
            Status: item.status || '',
            Created: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''
        };
        
        if (options.includeMetadata) {
            row.ID = item.id || '';
        }
        
        return Object.values(row);
    });
    
    // Add table headers
    const headers = Object.keys(tableData[0] || {}).map(key => key);
    
    // Add table to PDF
    (doc as any).autoTable({
        head: [headers],
        body: tableData,
        startY: yPosition,
        margin: { top: 20 },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] }
    });
    
    return (doc as any).lastAutoTable.finalY + 20;
}
```

## Integration Points

### 1. Projects Page Integration
```typescript
// In Projects.tsx
import ExportModal, { ExportData } from '../components/ExportModal';
import { exportService, ExportOptions } from '../services/exportService';

// Add export button to header
<Button
    variant="outlined"
    startIcon={<DownloadIcon />}
    onClick={() => setOpenExportModal(true)}
>
    Export
</Button>

// Add export modal
<ExportModal
    open={openExportModal}
    onClose={() => setOpenExportModal(false)}
    title="Projects"
    data={{
        projects: projects,
        experiments: projects.flatMap(project => project.experiments || [])
    }}
    onExport={handleExportWithModal}
/>

// Export handler
const handleExportWithModal = async (format: string, options: string[], filename?: string) => {
    try {
        const exportData: ExportData = {
            projects: projects,
            experiments: projects.flatMap(project => project.experiments || [])
        };

        const exportOptions: ExportOptions = {
            includeMetadata: options.includes('includeMetadata'),
            includeRelationships: options.includes('includeRelationships'),
            includeNotes: options.includes('includeNotes'),
            includeFiles: options.includes('includeFiles')
        };

        await exportService.exportData(format, exportData, exportOptions, filename || 'projects_export');
    } catch (error) {
        console.error('Export failed:', error);
        throw error;
    }
};
```

### 2. Experiments Page Integration
Similar integration pattern for the Experiments page with experiment-specific data.

## Error Handling

### Validation
- **Data Validation**: Check for valid data before export
- **Format Validation**: Ensure selected format is supported
- **Options Validation**: Validate export options
- **Filename Validation**: Check filename format and length

### Error Recovery
- **Graceful Degradation**: Fallback to browser download if Electron unavailable
- **Error Messages**: Clear error messages for user guidance
- **Retry Options**: Allow users to retry failed exports
- **Partial Success**: Handle partial export failures

### Error Types
- **Data Errors**: Invalid or missing data
- **Format Errors**: Unsupported export formats
- **File System Errors**: Permission or disk space issues
- **Network Errors**: API or service failures

## Performance Considerations

### Export Optimization
- **Batch Processing**: Process data in batches for large exports
- **Memory Management**: Efficient memory usage during export
- **Progress Tracking**: Show progress for long-running exports
- **Background Processing**: Non-blocking export operations

### Resource Management
- **File Size Limits**: Handle large file exports
- **Memory Leak Prevention**: Proper cleanup of resources
- **Timeout Handling**: Handle long-running export operations
- **Concurrent Exports**: Prevent multiple simultaneous exports

### Scalability
- **Large Dataset Support**: Handle exports with thousands of items
- **Incremental Export**: Export only changed data
- **Compression**: Compress large export files
- **Streaming**: Stream data for very large exports

## Testing

### Test Script
A comprehensive test script (`test-export-functionality.js`) is provided to verify functionality:

1. **Application Startup**: Verifies app starts correctly
2. **Projects Page Navigation**: Tests export button access
3. **Export Button Functionality**: Tests modal opening
4. **Export Format Selection**: Tests format options
5. **Export Options Configuration**: Tests option toggles
6. **Data Summary Display**: Tests data preview
7. **Filename Customization**: Tests filename input
8. **Export Execution**: Tests actual export process
9. **Error Handling**: Tests error scenarios
10. **Experiments Page Integration**: Tests integration
11. **File Format Validation**: Tests exported files
12. **Performance Testing**: Tests with large datasets

### Manual Testing
The test script provides guidance for manual verification:
- Navigate to Projects → Click Export button
- Test all export formats (CSV, JSON, Excel, PDF)
- Configure export options and verify functionality
- Test filename customization
- Verify file save dialog and file creation
- Test export with different data scenarios
- Check error handling and recovery
- Test integration with Experiments page
- Verify exported file contents and formats
- Test performance with large datasets

## Future Enhancements

### Planned Features
1. **Advanced Formatting**
   - Custom templates for exports
   - Branding and styling options
   - Custom field selection

2. **Scheduled Exports**
   - Automated export scheduling
   - Email delivery of exports
   - Export history and management

3. **Advanced Options**
   - Data filtering and selection
   - Custom field mapping
   - Export validation rules

4. **Integration Enhancements**
   - Cloud storage integration
   - API export endpoints
   - Third-party service integration

### Performance Improvements
1. **Optimized Processing**
   - Parallel data processing
   - Caching for repeated exports
   - Incremental export support

2. **Enhanced Formats**
   - More export formats (XML, YAML, etc.)
   - Custom format plugins
   - Format-specific optimizations

3. **Advanced UI**
   - Export templates
   - Drag-and-drop field ordering
   - Preview functionality

## Troubleshooting

### Common Issues

1. **Export Button Not Visible**
   - Check if user is on Projects/Experiments page
   - Verify component imports and styling
   - Check for JavaScript errors

2. **Modal Not Opening**
   - Check state management for modal open/close
   - Verify event handlers are properly bound
   - Check for component rendering issues

3. **Export Fails**
   - Check data availability and format
   - Verify Electron API availability
   - Check file system permissions

4. **File Not Saving**
   - Check Electron save dialog integration
   - Verify file path and permissions
   - Check for disk space issues

### Debug Mode
Enable debug logging by setting:
```typescript
const DEBUG_EXPORT = true;
```

This will log detailed information about:
- Export operations
- Data processing
- File operations
- Error details
- Performance metrics

## Conclusion

The Export functionality provides a comprehensive and user-friendly way to export Projects and Experiments data from the Research Notebook application. With support for multiple formats, configurable options, and seamless Electron integration, it enhances the user experience by providing flexible data export capabilities.

The implementation is designed to be efficient, reliable, and extensible, allowing for future enhancements while maintaining performance and stability. The integration with Projects and Experiments pages ensures a consistent user experience across the application. 