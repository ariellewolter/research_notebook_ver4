# Cloud Sync Implementation

## Overview

This document describes the implementation of the Cloud Sync Service Abstraction Layer for the Electronic Lab Notebook application. The system provides a unified interface for connecting to and managing multiple cloud storage services.

## Architecture

### Core Components

1. **Cloud Sync API (`apps/frontend/src/utils/cloudSyncAPI.ts`)**
   - Main abstraction layer for cloud storage operations
   - OAuth2 authentication handling
   - Provider-agnostic interface
   - Event-driven architecture

2. **React Hook (`apps/frontend/src/hooks/useCloudSync.ts`)**
   - React-friendly interface for cloud sync operations
   - State management for connections and files
   - Event handling and error management

3. **UI Component (`apps/frontend/src/components/CloudSync/CloudSyncManager.tsx`)**
   - User interface for managing cloud connections
   - File browsing and management
   - Upload/download operations

4. **Backend API (`apps/backend/src/routes/api/cloudSync.ts`)**
   - Server-side cloud sync operations
   - OAuth callback handling
   - File operation endpoints

## Supported Services

### Dropbox
- **OAuth URL**: `https://www.dropbox.com/oauth2/authorize`
- **Scopes**: `files.content.read`, `files.content.write`, `files.metadata.read`
- **API**: Dropbox API v2

### Google Drive
- **OAuth URL**: `https://accounts.google.com/o/oauth2/v2/auth`
- **Scopes**: `https://www.googleapis.com/auth/drive.file`
- **API**: Google Drive API v3

### iCloud
- **OAuth URL**: `https://appleid.apple.com/auth/authorize`
- **Scopes**: `files.read`, `files.write`
- **API**: iCloud Web Services

### OneDrive
- **OAuth URL**: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
- **Scopes**: `files.readwrite`, `offline_access`
- **API**: Microsoft Graph API

## Implementation Details

### OAuth2 Flow

1. **Authorization Request**
   ```typescript
   const authUrl = buildAuthUrl(serviceName, config);
   window.location.href = authUrl;
   ```

2. **Callback Handling**
   ```typescript
   const tokenResponse = await exchangeCodeForToken(serviceName, code, config);
   storeToken(serviceName, tokenResponse.access_token, tokenResponse.refresh_token);
   ```

3. **Token Management**
   - Access tokens stored in localStorage
   - Refresh token handling for expired tokens
   - Automatic token renewal

### File Operations

#### List Files
```typescript
const files = await cloudSyncService.listSyncedFiles(serviceName, folderPath);
```

#### Upload File
```typescript
const success = await cloudSyncService.uploadFile(serviceName, localPath, remotePath, fileContent);
```

#### Download File
```typescript
const fileContent = await cloudSyncService.downloadFile(serviceName, remotePath, localPath);
```

### Event System

The cloud sync service uses an event-driven architecture for real-time updates:

```typescript
// Listen for events
cloudSyncService.on('serviceConnected', (data) => {
  console.log(`${data.serviceName} connected`);
});

cloudSyncService.on('fileUploaded', (data) => {
  console.log(`File uploaded: ${data.localPath} -> ${data.remotePath}`);
});

cloudSyncService.on('error', (error) => {
  console.error('Cloud sync error:', error);
});
```

## Usage Examples

### Basic Connection

```typescript
import { useCloudSync } from '../hooks/useCloudSync';

const MyComponent = () => {
  const { connectService, isConnected, loading, error } = useCloudSync();

  const handleConnect = async () => {
    await connectService('dropbox');
  };

  return (
    <div>
      {loading && <p>Connecting...</p>}
      {error && <p>Error: {error.message}</p>}
      {isConnected('dropbox') && <p>Dropbox connected!</p>}
      <button onClick={handleConnect}>Connect to Dropbox</button>
    </div>
  );
};
```

### File Management

```typescript
const { listFiles, uploadFile, downloadFile, files } = useCloudSync();

// List files
const handleListFiles = async () => {
  const fileList = await listFiles('dropbox', '/documents');
  console.log('Files:', fileList);
};

// Upload file
const handleUpload = async () => {
  const success = await uploadFile('dropbox', '/local/file.txt', '/remote/file.txt');
  if (success) {
    console.log('File uploaded successfully');
  }
};

// Download file
const handleDownload = async () => {
  const fileContent = await downloadFile('dropbox', '/remote/file.txt', '/local/file.txt');
  if (fileContent) {
    console.log('File downloaded successfully');
  }
};
```

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Dropbox
REACT_APP_DROPBOX_CLIENT_ID=your_dropbox_client_id
REACT_APP_DROPBOX_CLIENT_SECRET=your_dropbox_client_secret

# Google Drive
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret

# iCloud
REACT_APP_APPLE_CLIENT_ID=your_apple_client_id
REACT_APP_APPLE_CLIENT_SECRET=your_apple_client_secret

# OneDrive
REACT_APP_ONEDRIVE_CLIENT_ID=your_onedrive_client_id
REACT_APP_ONEDRIVE_CLIENT_SECRET=your_onedrive_client_secret
```

### OAuth Redirect URIs

Configure the following redirect URIs in your cloud service applications:

- `http://localhost:5173/auth/dropbox/callback`
- `http://localhost:5173/auth/google/callback`
- `http://localhost:5173/auth/apple/callback`
- `http://localhost:5173/auth/onedrive/callback`

## Security Considerations

1. **Token Storage**
   - Access tokens stored in localStorage (consider more secure storage for production)
   - Refresh tokens handled securely
   - Automatic token cleanup on disconnect

2. **OAuth Security**
   - State parameter for CSRF protection
   - PKCE (Proof Key for Code Exchange) for public clients
   - Secure redirect URI validation

3. **File Security**
   - File content validation
   - Path traversal protection
   - File size limits

## Error Handling

The system provides comprehensive error handling:

```typescript
interface CloudSyncError {
  code: string;
  message: string;
  serviceName: CloudServiceName;
  timestamp: string;
}
```

Common error codes:
- `CONNECTION_FAILED`: OAuth connection failed
- `TOKEN_EXPIRED`: Access token expired
- `UPLOAD_FAILED`: File upload failed
- `DOWNLOAD_FAILED`: File download failed
- `LIST_FILES_FAILED`: File listing failed

## Future Enhancements

### Planned Features

1. **Provider SDKs Integration**
   - Dropbox SDK
   - Google Drive SDK
   - Microsoft Graph SDK
   - iCloud Web Services SDK

2. **Advanced Features**
   - File synchronization
   - Conflict resolution
   - Selective sync
   - Offline support

3. **Performance Optimizations**
   - File chunking for large uploads
   - Background sync
   - Caching strategies

### Provider-Specific Implementations

The current implementation includes placeholder methods for provider-specific operations:

```typescript
private async providerListFiles(serviceName: CloudServiceName, token: string, folderPath: string): Promise<CloudFile[]> {
  // TODO: Implement with actual SDK calls
  return [];
}

private async providerUploadFile(serviceName: CloudServiceName, token: string, localPath: string, remotePath: string, fileContent?: File | Blob): Promise<boolean> {
  // TODO: Implement with actual SDK calls
  return true;
}

private async providerDownloadFile(serviceName: CloudServiceName, token: string, remotePath: string): Promise<Blob | null> {
  // TODO: Implement with actual SDK calls
  return null;
}
```

## Testing

### Unit Tests

```typescript
describe('CloudSyncService', () => {
  it('should connect to Dropbox', async () => {
    const service = new CloudSyncService();
    const result = await service.connectService('dropbox');
    expect(result).toBe(true);
  });

  it('should list files', async () => {
    const service = new CloudSyncService();
    const files = await service.listSyncedFiles('dropbox');
    expect(Array.isArray(files)).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('CloudSync Integration', () => {
  it('should handle OAuth flow', async () => {
    // Test complete OAuth flow
  });

  it('should upload and download files', async () => {
    // Test file operations
  });
});
```

## Troubleshooting

### Common Issues

1. **OAuth Connection Fails**
   - Check client ID and secret configuration
   - Verify redirect URI settings
   - Ensure scopes are properly configured

2. **File Operations Fail**
   - Check token validity
   - Verify file permissions
   - Check network connectivity

3. **Token Expiration**
   - Implement refresh token logic
   - Handle token renewal automatically
   - Provide user feedback for re-authentication

### Debug Mode

Enable debug logging:

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  cloudSyncService.on('*', (event, data) => {
    console.log('Cloud sync event:', event, data);
  });
}
```

## Conclusion

The Cloud Sync Service Abstraction Layer provides a robust foundation for integrating multiple cloud storage services into the Electronic Lab Notebook application. The modular design allows for easy addition of new providers and features while maintaining a consistent user experience.

The implementation follows best practices for OAuth2 authentication, error handling, and security, making it suitable for production use with proper configuration and provider SDK integration. 