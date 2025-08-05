# Cloud Sync Implementation Documentation

## Overview

The cloud sync functionality allows users to synchronize their research data across multiple cloud storage services including Dropbox, Google Drive, OneDrive, and iCloud. This document outlines the implementation details, recent fixes, and current status.

## Architecture

### Backend Components

#### Database Schema
- **Note Model**: Includes cloud sync fields (`cloudSynced`, `cloudPath`, `cloudService`, `lastSynced`, `syncStatus`)
- **Project Model**: Includes cloud sync fields (`cloudSynced`, `cloudPath`, `cloudService`, `lastSynced`, `syncStatus`)
- **PDF Model**: Includes cloud sync fields (`cloudSynced`, `cloudPath`, `cloudService`, `lastSynced`, `syncStatus`)

#### API Routes
- `/api/cloud-sync/*` - General cloud sync operations
- `/api/entity-cloud-sync/*` - Entity-specific cloud sync operations
- `/api/zotero/sync/*` - Zotero integration sync operations

### Frontend Components

#### Cloud Sync Components
- `EntityCloudSyncDialog.tsx` - Main cloud sync management dialog
- `CloudSyncSettings.tsx` - Cloud sync configuration
- `AdvancedSyncSettings.tsx` - Advanced sync options
- `AutoExportSettings.tsx` - Automatic export configuration

#### Services
- `cloudSyncAPI.ts` - Cloud sync API client
- `useCloudSync.ts` - Cloud sync React hook
- `syncReminderService.ts` - Sync status monitoring

## Recent Fixes (Latest Update)

### 1. Database Schema Issues ✅
**Problem**: Only the Note model had cloud sync fields, but Project and PDF models were missing them.
**Solution**: Added cloud sync fields to Project and PDF models:
```prisma
model Project {
  // ... existing fields
  cloudSynced  Boolean      @default(false)
  cloudPath    String?
  cloudService String?      // 'dropbox', 'google', 'onedrive', 'icloud'
  lastSynced   DateTime?
  syncStatus   String?      // 'pending', 'synced', 'error', 'conflict'
}

model PDF {
  // ... existing fields
  cloudSynced  Boolean      @default(false)
  cloudPath    String?
  cloudService String?
  lastSynced   DateTime?
  syncStatus   String?
}
```

### 2. Backend Route Issues ✅
**Problem**: Entity cloud sync routes were commented out and had routing conflicts.
**Solution**: 
- Enabled entity cloud sync routes in `/api/index.ts`
- Fixed routing conflict by moving `/stats/overview` before `/:entityType` routes
- Added Zotero routes to API routes

### 3. API Response Structure Issues ✅
**Problem**: Cloud sync status API returned incorrect structure causing frontend errors.
**Solution**: Updated API response to match expected frontend interface:
```typescript
{
  success: true,
  data: {
    connectedServices: [],
    lastSyncTime: null,
    syncEnabled: false
  }
}
```

### 4. TypeScript Compilation Issues ✅
**Problem**: Type mismatches between Prisma schema and TypeScript interfaces.
**Solution**: Updated TypeScript interfaces to match Prisma's null/undefined handling.

## Current API Endpoints

### Cloud Sync Status
```bash
GET /api/cloud-sync/status
```
Returns cloud sync status for all services.

### Entity Cloud Sync Stats
```bash
GET /api/entity-cloud-sync/stats/overview
```
Returns sync statistics for notes, projects, and PDFs.

### Entity Cloud Sync Operations
```bash
GET /api/entity-cloud-sync/:entityType/:id
PUT /api/entity-cloud-sync/:entityType/:id
DELETE /api/entity-cloud-sync/:entityType/:id
```
Where `entityType` is one of: `note`, `project`, `pdf`

### Zotero Sync Status
```bash
GET /api/zotero/sync/status
```
Returns Zotero sync configuration and status.

## Supported Cloud Services

### Dropbox
- **Status**: ✅ Implemented
- **Features**: File upload, download, sync status
- **Configuration**: OAuth 2.0 authentication

### Google Drive
- **Status**: ✅ Implemented
- **Features**: File upload, download, sync status
- **Configuration**: OAuth 2.0 authentication

### OneDrive
- **Status**: ✅ Implemented
- **Features**: File upload, download, sync status
- **Configuration**: OAuth 2.0 authentication

### iCloud
- **Status**: ✅ Implemented
- **Features**: File upload, download, sync status
- **Configuration**: OAuth 2.0 authentication

## Sync Status Values

- `pending` - Sync operation is queued
- `synced` - Entity is successfully synced
- `error` - Sync operation failed
- `conflict` - Sync conflict detected

## Cloud Service Values

- `dropbox` - Dropbox integration
- `google` - Google Drive integration
- `onedrive` - OneDrive integration
- `icloud` - iCloud integration

## Frontend Integration

### Cloud Sync Hook
```typescript
const { syncStatus, syncEntity, getSyncStatus } = useCloudSync();
```

### Entity Sync Dialog
The `EntityCloudSyncDialog` component provides:
- Entity selection (notes, projects, PDFs)
- Cloud service selection
- Sync status display
- Manual sync triggers

### Auto-Export Settings
The `AutoExportSettings` component allows users to:
- Configure automatic export schedules
- Set export formats
- Choose destination cloud services

## Error Handling

### Common Error Codes
- `UNKNOWN_ERROR` - Generic sync error
- `AUTHENTICATION_ERROR` - OAuth authentication failed
- `NETWORK_ERROR` - Network connectivity issues
- `QUOTA_EXCEEDED` - Cloud storage quota exceeded

### Error Recovery
- Automatic retry with exponential backoff
- User notification via notification service
- Manual retry options in UI

## Testing

### API Testing
```bash
# Test cloud sync status
curl -X GET http://localhost:3001/api/cloud-sync/status

# Test entity sync stats
curl -X GET http://localhost:3001/api/entity-cloud-sync/stats/overview

# Test Zotero sync status
curl -X GET http://localhost:3001/api/zotero/sync/status
```

### Frontend Testing
- Cloud sync dialog functionality
- Entity selection and sync operations
- Error handling and user feedback
- Auto-export configuration

## Future Enhancements

### Planned Features
1. **Conflict Resolution UI** - Visual conflict resolution interface
2. **Selective Sync** - Choose specific folders/files to sync
3. **Sync History** - Detailed sync operation history
4. **Batch Operations** - Sync multiple entities at once
5. **Real-time Sync** - WebSocket-based real-time sync updates

### Performance Optimizations
1. **Incremental Sync** - Only sync changed files
2. **Background Sync** - Non-blocking sync operations
3. **Compression** - Compress data before upload
4. **Caching** - Local cache for frequently accessed files

## Troubleshooting

### Common Issues

#### 1. "Cannot read properties of undefined (reading 'lastSyncTime')"
**Cause**: API response structure mismatch
**Solution**: ✅ Fixed - Updated backend API response structure

#### 2. "404 Not Found" for cloud sync endpoints
**Cause**: Routes not properly mounted
**Solution**: ✅ Fixed - Added routes to API index

#### 3. TypeScript compilation errors
**Cause**: Type mismatches between Prisma and TypeScript
**Solution**: ✅ Fixed - Updated TypeScript interfaces

#### 4. Database migration errors
**Cause**: Missing cloud sync fields in models
**Solution**: ✅ Fixed - Added cloud sync fields to all entity models

### Debug Commands
```bash
# Check backend status
curl -X GET http://localhost:3001/api/cloud-sync/status

# Check entity sync stats
curl -X GET http://localhost:3001/api/entity-cloud-sync/stats/overview

# Check Zotero sync
curl -X GET http://localhost:3001/api/zotero/sync/status
```

## Security Considerations

### OAuth Implementation
- Secure token storage
- Token refresh handling
- Scope limitation

### Data Privacy
- Local encryption before upload
- Secure transmission (HTTPS)
- User consent for data access

### Access Control
- User-specific sync folders
- Permission validation
- Audit logging

## Monitoring and Logging

### Sync Metrics
- Sync success/failure rates
- Sync duration
- Data transfer volumes
- Error frequency

### Logging
- Sync operation logs
- Error logs with stack traces
- Performance metrics
- User activity logs

## Dependencies

### Backend Dependencies
- `@prisma/client` - Database ORM
- `express` - Web framework
- `zod` - Schema validation
- `axios` - HTTP client

### Frontend Dependencies
- `react` - UI framework
- `axios` - HTTP client
- `@types/node` - TypeScript types

## Related Documentation

- [API Documentation](../api/README.md)
- [Database Schema](../database/README.md)
- [Frontend Components](../frontend/README.md)
- [Authentication](../auth/README.md) 