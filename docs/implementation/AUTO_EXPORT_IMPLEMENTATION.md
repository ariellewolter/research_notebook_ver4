# Auto-Export Implementation

## Overview

The Auto-Export feature provides automatic export functionality for completed projects in the Research Notebook application. The system listens for project completion status changes and automatically generates export files (PDF, Excel, CSV, JSON) that are saved directly to a designated Cloud Sync folder.

## Features

### 🎯 Core Functionality
- **Automatic Detection**: Listens for project status changes to 'completed'
- **Multi-Format Export**: Supports PDF, Excel, CSV, and JSON formats
- **Cloud Integration**: Automatically uploads exports to cloud storage
- **Configurable Options**: Customizable export content and settings
- **Retry Mechanism**: Automatic retry with exponential backoff for failed exports
- **Real-time Status**: Live export status and progress tracking

### 📊 Export Capabilities
- **Project Data**: Complete project information with all relationships
- **Experiments**: All experiments associated with the project
- **Notes**: Research notes and observations from experiments
- **Tasks**: Project tasks and their status
- **Protocols**: Experimental protocols and procedures
- **Metadata**: Optional inclusion of IDs, timestamps, and relationships

### 🎨 User Interface
- **Status Component**: Real-time export status display
- **Settings Panel**: Comprehensive configuration interface
- **Progress Tracking**: Visual progress indicators during export
- **Results Display**: Detailed export results with success/failure status
- **Configuration Controls**: Easy-to-use export configuration interface

## Implementation Details

### Component Structure

```
CloudSync/
├── useAutoExport.ts (Main auto-export hook)
├── AutoExportProvider.tsx (Context provider)
├── AutoExportStatus.tsx (Status display component)
├── AutoExportSettings.tsx (Configuration component)
├── CloudSyncIntegration.tsx (Unified integration)
└── Enhanced Hooks/
    └── useProjectsWithAutoExport.ts
```

### Key Components

#### 1. useAutoExport Hook
The main hook that manages auto-export functionality.

**Features:**
- Project completion detection
- Multi-format export generation
- Cloud storage integration
- Retry mechanism with exponential backoff
- Export queue management
- Error handling and recovery

**Configuration:**
```typescript
interface AutoExportConfig {
  enabled: boolean;
  formats: ExportFormat[];
  includeMetadata: boolean;
  includeRelationships: boolean;
  includeNotes: boolean;
  includeFileReferences: boolean;
  cloudSyncEnabled: boolean;
  cloudService: 'dropbox' | 'google' | 'onedrive' | 'apple';
  cloudPath: string;
  filenameTemplate: string;
  retryAttempts: number;
  retryDelay: number;
}
```

#### 2. AutoExportProvider
Context provider that makes auto-export functionality available throughout the app.

**Usage:**
```typescript
<AutoExportProvider config={{ enabled: true, formats: ['pdf', 'excel'] }}>
  <YourApp />
</AutoExportProvider>
```

#### 3. AutoExportStatus Component
Displays real-time export status and provides user controls.

**Props:**
```typescript
interface AutoExportStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}
```

#### 4. AutoExportSettings Component
Provides comprehensive configuration options for auto-export functionality.

**Features:**
- Export format selection
- Content inclusion options
- Cloud service configuration
- Filename template customization
- Retry settings

#### 5. Enhanced Hooks
Hooks that automatically emit project status change events.

- `useProjectsWithAutoExport`: Enhanced projects hook with auto-export

## Usage Guide

### 1. Basic Integration

Wrap your application with the CloudSyncIntegration component:

```typescript
import { CloudSyncIntegration } from './components/CloudSync/CloudSyncIntegration';

function App() {
  return (
    <CloudSyncIntegration
      autoExportConfig={{
        enabled: true,
        formats: ['pdf', 'excel'],
        cloudSyncEnabled: true,
        cloudService: 'dropbox',
        cloudPath: '/research-exports'
      }}
    >
      <YourAppContent />
    </CloudSyncIntegration>
  );
}
```

### 2. Using Enhanced Hooks

Replace your existing project hooks with the auto-export enhanced version:

```typescript
import { useProjectsWithAutoExport } from './hooks/api/useProjectsWithAutoExport';

function MyComponent() {
  const { updateProject } = useProjectsWithAutoExport();

  const handleCompleteProject = async (projectId: string) => {
    // This will automatically trigger export when status changes to 'completed'
    await updateProject(projectId, { status: 'completed' });
  };
}
```

### 3. Manual Export Trigger

You can also manually trigger export for specific projects:

```typescript
import { useAutoExportContext } from './components/CloudSync/AutoExportProvider';

function MyComponent() {
  const { triggerManualExport } = useAutoExportContext();

  const handleManualExport = async (project) => {
    if (project.status === 'completed') {
      await triggerManualExport(project);
    }
  };
}
```

### 4. Status Monitoring

Display export status in your components:

```typescript
import { AutoExportStatus } from './components/CloudSync/AutoExportStatus';

function MyComponent() {
  return (
    <div>
      <AutoExportStatus compact />
      {/* Your component content */}
    </div>
  );
}
```

### 5. Configuration

Configure auto-export settings:

```typescript
import { AutoExportSettings } from './components/CloudSync/AutoExportSettings';

function SettingsPage() {
  return (
    <div>
      <AutoExportSettings />
    </div>
  );
}
```

## Configuration

### Auto-Export Settings

```typescript
const autoExportConfig = {
  enabled: true,                    // Enable/disable auto-export
  formats: ['pdf', 'excel'],       // Export formats
  includeMetadata: true,           // Include IDs, timestamps
  includeRelationships: true,      // Include entity relationships
  includeNotes: true,              // Include experiment notes
  includeFileReferences: true,     // Include file references
  cloudSyncEnabled: true,          // Upload to cloud storage
  cloudService: 'dropbox',         // Target cloud service
  cloudPath: '/research-exports',  // Cloud storage path
  filenameTemplate: '{projectName}_{date}_{format}', // Filename pattern
  retryAttempts: 3,               // Maximum retry attempts
  retryDelay: 5000                // Base retry delay in milliseconds
};
```

### Filename Template Variables

The filename template supports the following placeholders:

- `{projectName}`: Project name (sanitized)
- `{date}`: Export date in YYYY-MM-DD format
- `{format}`: Export format (pdf, excel, csv, json)
- `{projectId}`: Project ID

Example: `{projectName}_{date}_{format}` → `My_Research_Project_2024-01-15_pdf.pdf`

## Export Formats

### Supported Formats

1. **PDF**: Formatted document with tables and styling
2. **Excel**: Multi-sheet Excel format with formatting
3. **CSV**: Comma-separated values for spreadsheet applications
4. **JSON**: Structured data format for APIs and data exchange

### Export Content

Each export includes:

```typescript
interface ExportData {
  projects: Project[];           // Project information
  experiments: Experiment[];     // Associated experiments
  notes: Note[];                // Experiment notes (if enabled)
  tasks: Task[];                // Project tasks (if enabled)
  protocols: Protocol[];        // Experimental protocols (if enabled)
}
```

## Cloud Service Integration

### Supported Services

1. **Dropbox**: Uses Dropbox API with OAuth2 authentication
2. **Google Drive**: Uses Google Drive API with OAuth2 authentication
3. **OneDrive**: Uses Microsoft Graph API with MSAL authentication
4. **iCloud**: Uses iCloud API with OAuth2 authentication

### File Organization

Exported files are organized with the following structure:
```
{cloudPath}/
├── {projectName}_{date}_pdf.pdf
├── {projectName}_{date}_excel.xlsx
├── {projectName}_{date}_csv.csv
└── {projectName}_{date}_json.json
```

## Error Handling

### Retry Mechanism

- **Exponential Backoff**: Retry delays increase with each attempt
- **Maximum Retries**: Configurable maximum retry attempts
- **Error Logging**: Comprehensive error logging and reporting

### Common Error Scenarios

1. **Network Errors**: Automatic retry with exponential backoff
2. **Authentication Errors**: User notification to re-authenticate
3. **Service Unavailable**: Graceful degradation with retry scheduling
4. **File Generation Errors**: Detailed error reporting with context

## Performance Considerations

### Export Queue Management

- **Sequential Processing**: Exports are processed one at a time
- **Memory Management**: Automatic cleanup of completed exports
- **Background Processing**: Export operations run in background
- **Minimal UI Impact**: Non-blocking export operations

### Resource Usage

- **Efficient Data Fetching**: Optimized data retrieval for exports
- **File Size Optimization**: Compressed export files
- **Cloud Upload Optimization**: Efficient upload strategies

## Testing

### Manual Testing

1. Create a project and mark it as completed
2. Check auto-export status for export completion
3. Verify files appear in cloud storage
4. Test different export formats

### Automated Testing

```typescript
// Test auto-export functionality
describe('AutoExport', () => {
  it('should trigger export for completed projects', async () => {
    const { updateProject } = useProjectsWithAutoExport();
    const projectData = { status: 'completed' };
    
    const updatedProject = await updateProject(projectId, projectData);
    // Verify export was triggered
  });
});
```

## Troubleshooting

### Common Issues

1. **Export Not Triggering**
   - Check if project status is 'completed'
   - Verify auto-export is enabled
   - Check cloud service connection

2. **Export Failures**
   - Check network connectivity
   - Verify cloud service authentication
   - Review error logs for specific issues

3. **Performance Issues**
   - Monitor export queue size
   - Check cloud service rate limits
   - Review export configuration

### Debug Mode

Enable debug logging:
```typescript
// Add to your configuration
const config = {
  debug: true,
  // ... other settings
};
```

## Integration with Auto-Sync

### Combined Functionality

The auto-export system works seamlessly with the auto-sync system:

1. **Auto-Sync**: Automatically syncs entities when they're saved
2. **Auto-Export**: Automatically exports projects when they're completed
3. **Unified Interface**: Combined status monitoring and configuration

### Usage Example

```typescript
<CloudSyncIntegration
  autoSyncConfig={{
    enabled: true,
    throttleDelay: 2000,
    maxRetries: 3
  }}
  autoExportConfig={{
    enabled: true,
    formats: ['pdf', 'excel'],
    cloudSyncEnabled: true,
    cloudService: 'dropbox'
  }}
>
  <YourApp />
</CloudSyncIntegration>
```

## Future Enhancements

### Planned Features

1. **Selective Export**: Choose specific projects for export
2. **Export Scheduling**: Configurable export intervals
3. **Custom Templates**: User-defined export templates
4. **Batch Operations**: Export multiple projects simultaneously
5. **Export History**: Detailed export history and analytics

### API Extensions

1. **Webhook Support**: Real-time export notifications
2. **Custom Exporters**: Support for additional export formats
3. **Advanced Filtering**: Filter projects by export criteria
4. **Export Policies**: Configurable export rules and policies 