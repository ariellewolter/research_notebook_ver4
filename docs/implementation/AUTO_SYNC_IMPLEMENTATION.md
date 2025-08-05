# Auto-Sync Implementation

## Overview

The Auto-Sync feature provides automatic cloud synchronization for notes, projects, and tasks that are marked as cloud-synced. The system listens for save events and triggers background sync operations with throttling to avoid redundant triggers.

## Features

### 🎯 Core Functionality
- **Automatic Save Detection**: Listens for note/project/task save events
- **Cloud Service Support**: Works with Dropbox, Google Drive, OneDrive, and iCloud
- **Throttled Sync**: Debounces rapid edits to avoid redundant sync operations
- **Retry Mechanism**: Automatic retry with exponential backoff for failed syncs
- **Real-time Status**: Live sync status and progress tracking
- **Error Handling**: Comprehensive error handling and recovery

### 📊 Sync Capabilities
- **Entity Types**: Supports notes, projects, and tasks
- **Cloud Synced Detection**: Only syncs entities marked with `cloudSynced: true`
- **Service Routing**: Routes to appropriate cloud service based on entity configuration
- **File Organization**: Organizes synced files in cloud storage with structured naming
- **Metadata Preservation**: Maintains entity metadata and relationships

### 🎨 User Interface
- **Status Component**: Real-time sync status display
- **Progress Tracking**: Visual progress indicators during sync
- **Error Feedback**: Clear error messages and recovery guidance
- **Configuration Controls**: Easy-to-use sync configuration interface

## Implementation Details

### Component Structure

```
CloudSync/
├── useAutoSync.ts (Main auto-sync hook)
├── AutoSyncProvider.tsx (Context provider)
├── AutoSyncStatus.tsx (Status display component)
├── AutoSyncIntegration.tsx (Integration wrapper)
└── Enhanced Hooks/
    ├── useNotesWithAutoSync.ts
    ├── useProjectsWithAutoSync.ts
    └── useTasksWithAutoSync.ts
```

### Key Components

#### 1. useAutoSync Hook
The main hook that manages auto-sync functionality.

**Features:**
- Event-driven save detection
- Throttled sync queue processing
- Retry mechanism with exponential backoff
- Cloud service integration
- Error handling and recovery

**Configuration:**
```typescript
interface AutoSyncConfig {
  enabled: boolean;
  throttleDelay: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  services: CloudServiceName[];
}
```

#### 2. AutoSyncProvider
Context provider that makes auto-sync functionality available throughout the app.

**Usage:**
```typescript
<AutoSyncProvider config={{ enabled: true, throttleDelay: 2000 }}>
  <YourApp />
</AutoSyncProvider>
```

#### 3. AutoSyncStatus Component
Displays real-time sync status and provides user controls.

**Props:**
```typescript
interface AutoSyncStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}
```

#### 4. Enhanced Hooks
Hooks that automatically emit save events when entities are created or updated.

- `useNotesWithAutoSync`: Enhanced notes hook with auto-sync
- `useProjectsWithAutoSync`: Enhanced projects hook with auto-sync
- `useTasksWithAutoSync`: Enhanced tasks hook with auto-sync

## Usage Guide

### 1. Basic Integration

Wrap your application with the AutoSyncIntegration component:

```typescript
import { AutoSyncIntegration } from './components/CloudSync/AutoSyncIntegration';

function App() {
  return (
    <AutoSyncIntegration>
      <YourAppContent />
    </AutoSyncIntegration>
  );
}
```

### 2. Using Enhanced Hooks

Replace your existing hooks with the auto-sync enhanced versions:

```typescript
// Instead of useNotes, useNotesWithAutoSync
import { useNotesWithAutoSync } from './hooks/api/useNotesWithAutoSync';
import { useProjectsWithAutoSync } from './hooks/api/useProjectsWithAutoSync';
import { useTasksWithAutoSync } from './hooks/useTasksWithAutoSync';

function MyComponent() {
  const { createNote, updateNote } = useNotesWithAutoSync();
  const { createProject, updateProject } = useProjectsWithAutoSync();
  const { createTask, updateTask } = useTasksWithAutoSync();

  // These functions will automatically trigger sync for cloud-synced entities
  const handleSaveNote = async (noteData) => {
    const savedNote = await createNote(noteData);
    // Auto-sync will be triggered automatically if note.cloudSynced is true
  };
}
```

### 3. Manual Sync Trigger

You can also manually trigger sync for specific entities:

```typescript
import { useAutoSyncContext } from './components/CloudSync/AutoSyncProvider';

function MyComponent() {
  const { triggerManualSync } = useAutoSyncContext();

  const handleManualSync = async (entity) => {
    await triggerManualSync('note', entity.id, entity);
  };
}
```

### 4. Status Monitoring

Display sync status in your components:

```typescript
import { AutoSyncStatus } from './components/CloudSync/AutoSyncStatus';

function MyComponent() {
  return (
    <div>
      <AutoSyncStatus compact />
      {/* Your component content */}
    </div>
  );
}
```

## Configuration

### Auto-Sync Settings

```typescript
const autoSyncConfig = {
  enabled: true,           // Enable/disable auto-sync
  throttleDelay: 2000,     // Debounce delay in milliseconds
  maxRetries: 3,          // Maximum retry attempts
  retryDelay: 5000,       // Base retry delay in milliseconds
  services: ['dropbox', 'google', 'onedrive', 'apple'] // Supported services
};
```

### Entity Configuration

To enable auto-sync for an entity, set the following properties:

```typescript
const note = {
  id: 'note-123',
  title: 'My Note',
  content: 'Note content',
  cloudSynced: true,           // Enable cloud sync
  cloudService: 'dropbox',     // Target cloud service
  cloudPath: '/research-notes' // Optional custom path
};
```

## Cloud Service Integration

### Supported Services

1. **Dropbox**: Uses Dropbox API with OAuth2 authentication
2. **Google Drive**: Uses Google Drive API with OAuth2 authentication
3. **OneDrive**: Uses Microsoft Graph API with MSAL authentication
4. **iCloud**: Uses iCloud API with OAuth2 authentication

### File Organization

Synced files are organized with the following naming convention:
```
{entityType}_{entityId}_{safeTitle}_{timestamp}.json
```

Example: `note_123_my_research_note_2024-01-15T10-30-45-123Z.json`

### Sync Data Format

Each synced file contains:
```json
{
  "entityType": "note",
  "entityId": "123",
  "data": { /* full entity data */ },
  "syncedAt": "2024-01-15T10:30:45.123Z",
  "version": "1.0"
}
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
4. **File Conflicts**: Conflict resolution with user notification

## Performance Considerations

### Throttling

- **Debounce**: Prevents excessive sync operations during rapid edits
- **Queue Management**: Efficient processing of sync queue
- **Memory Management**: Automatic cleanup of completed syncs

### Resource Usage

- **Background Processing**: Sync operations run in background
- **Minimal UI Impact**: Non-blocking sync operations
- **Efficient Storage**: Optimized file storage and retrieval

## Testing

### Manual Testing

1. Create a note/project/task with `cloudSynced: true`
2. Save the entity
3. Check auto-sync status for sync completion
4. Verify file appears in cloud storage

### Automated Testing

```typescript
// Test auto-sync functionality
describe('AutoSync', () => {
  it('should trigger sync for cloud-synced entities', async () => {
    const { createNote } = useNotesWithAutoSync();
    const noteData = { title: 'Test', content: 'Test', cloudSynced: true };
    
    const savedNote = await createNote(noteData);
    // Verify sync was triggered
  });
});
```

## Troubleshooting

### Common Issues

1. **Sync Not Triggering**
   - Check if entity has `cloudSynced: true`
   - Verify cloud service is connected
   - Check auto-sync is enabled

2. **Sync Failures**
   - Check network connectivity
   - Verify cloud service authentication
   - Review error logs for specific issues

3. **Performance Issues**
   - Adjust throttle delay settings
   - Monitor sync queue size
   - Check cloud service rate limits

### Debug Mode

Enable debug logging:
```typescript
// Add to your configuration
const config = {
  debug: true,
  // ... other settings
};
```

## Future Enhancements

### Planned Features

1. **Selective Sync**: Choose specific entities for sync
2. **Sync Scheduling**: Configurable sync intervals
3. **Conflict Resolution**: Advanced conflict detection and resolution
4. **Bulk Operations**: Batch sync for multiple entities
5. **Sync History**: Detailed sync history and analytics

### API Extensions

1. **Webhook Support**: Real-time sync notifications
2. **Custom Providers**: Support for additional cloud services
3. **Advanced Filtering**: Filter entities by sync criteria
4. **Sync Policies**: Configurable sync rules and policies 