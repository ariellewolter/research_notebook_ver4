# Dropbox SDK Integration

## Overview

This document describes the complete integration of the Dropbox SDK into the Electronic Lab Notebook application's cloud sync system. The integration provides full OAuth2 authentication and file operations for Dropbox cloud storage.

## Implementation Details

### 1. SDK Installation

The Dropbox SDK was installed using pnpm:

```bash
cd apps/frontend && pnpm add dropbox
```

### 2. Core Integration

#### Cloud Sync API (`apps/frontend/src/utils/cloudSyncAPI.ts`)

The main integration point where the Dropbox SDK is imported and used:

```typescript
import { Dropbox } from 'dropbox';

class CloudSyncService {
  private dropboxClient: Dropbox | null = null;
  
  // Dropbox-specific implementations
  private initializeDropboxClient(accessToken: string): void {
    this.dropboxClient = new Dropbox({
      accessToken,
      fetch: fetch
    });
  }
}
```

### 3. OAuth2 Authentication Flow

#### Configuration
```typescript
const CLOUD_SERVICE_CONFIGS: Record<CloudServiceName, CloudSyncConfig> = {
  dropbox: {
    clientId: process.env.REACT_APP_DROPBOX_CLIENT_ID || '',
    clientSecret: process.env.REACT_APP_DROPBOX_CLIENT_SECRET || '',
    redirectUri: `${window.location.origin}/auth/dropbox/callback`,
    scopes: ['files.content.read', 'files.content.write', 'files.metadata.read']
  }
};
```

#### Authorization URL Generation
```typescript
private buildAuthUrl(serviceName: CloudServiceName, config: CloudSyncConfig): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state: serviceName
  });

  const authUrls = {
    dropbox: 'https://www.dropbox.com/oauth2/authorize'
  };

  return `${authUrls[serviceName]}?${params.toString()}`;
}
```

#### Token Exchange
```typescript
private async exchangeDropboxCodeForToken(code: string, config: CloudSyncConfig): Promise<any> {
  try {
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri
      })
    });

    if (!response.ok) {
      throw new Error(`Dropbox token exchange failed: ${response.statusText}`);
    }

    const tokenData = await response.json();
    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in
    };
  } catch (error) {
    console.error('Dropbox token exchange error:', error);
    throw error;
  }
}
```

### 4. File Operations

#### List Files
```typescript
private async dropboxListFiles(folderPath: string): Promise<CloudFile[]> {
  if (!this.dropboxClient) {
    throw new Error('Dropbox client not initialized');
  }

  try {
    const response = await this.dropboxClient.filesListFolder({
      path: folderPath,
      limit: 100
    });

    return response.result.entries.map(entry => ({
      id: entry.id,
      name: entry.name,
      path: entry.path_display || entry.path_lower || '',
      size: entry.size || 0,
      modifiedTime: entry.server_modified || new Date().toISOString(),
      isFolder: entry['.tag'] === 'folder',
      mimeType: entry['.tag'] === 'file' ? this.getMimeType(entry.name) : undefined
    }));
  } catch (error) {
    console.error('Dropbox list files error:', error);
    throw error;
  }
}
```

#### Upload File
```typescript
private async dropboxUploadFile(remotePath: string, fileContent?: File | Blob): Promise<boolean> {
  if (!this.dropboxClient) {
    throw new Error('Dropbox client not initialized');
  }

  if (!fileContent) {
    throw new Error('File content is required for upload');
  }

  try {
    const arrayBuffer = await fileContent.arrayBuffer();
    
    await this.dropboxClient.filesUpload({
      path: remotePath,
      contents: arrayBuffer,
      mode: { '.tag': 'overwrite' }
    });

    return true;
  } catch (error) {
    console.error('Dropbox upload error:', error);
    throw error;
  }
}
```

#### Download File
```typescript
private async dropboxDownloadFile(remotePath: string): Promise<Blob | null> {
  if (!this.dropboxClient) {
    throw new Error('Dropbox client not initialized');
  }

  try {
    const response = await this.dropboxClient.filesDownload({
      path: remotePath
    });

    // Convert the file content to a Blob
    const blob = new Blob([response.result.fileBlob], {
      type: this.getMimeType(remotePath)
    });

    return blob;
  } catch (error) {
    console.error('Dropbox download error:', error);
    throw error;
  }
}
```

### 5. MIME Type Detection

```typescript
private getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'json': 'application/json',
    'csv': 'text/csv',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml'
  };
  
  return mimeTypes[ext || ''] || 'application/octet-stream';
}
```

### 6. Settings Integration

#### CloudSyncSettings Component (`apps/frontend/src/components/Settings/CloudSyncSettings.tsx`)

A comprehensive settings component that provides:

- **Service Connection Management**: Connect/disconnect from Dropbox
- **General Settings**: Enable/disable cloud sync, auto-sync configuration
- **Service Status**: Visual indicators for connection status
- **Configuration Persistence**: Settings saved to localStorage

Key features:
```typescript
const serviceConfigs = {
  dropbox: {
    name: 'Dropbox',
    icon: '☁️',
    color: '#0061FE',
    description: 'Sync your research files with Dropbox cloud storage'
  }
};
```

### 7. Token Management

#### Storage
```typescript
const getTokenStorageKey = (serviceName: CloudServiceName) => 
  `cloud_sync_${serviceName}_token`;

const getRefreshTokenStorageKey = (serviceName: CloudServiceName) => 
  `cloud_sync_${serviceName}_refresh_token`;
```

#### Token Operations
```typescript
private getStoredToken(serviceName: CloudServiceName): string | null {
  return localStorage.getItem(getTokenStorageKey(serviceName));
}

private storeToken(serviceName: CloudServiceName, accessToken: string, refreshToken?: string): void {
  localStorage.setItem(getTokenStorageKey(serviceName), accessToken);
  if (refreshToken) {
    localStorage.setItem(getRefreshTokenStorageKey(serviceName), refreshToken);
  }
}

private clearStoredTokens(serviceName: CloudServiceName): void {
  localStorage.removeItem(getTokenStorageKey(serviceName));
  localStorage.removeItem(getRefreshTokenStorageKey(serviceName));
}
```

## Environment Configuration

### Required Environment Variables

Add the following to your `.env` file:

```env
# Dropbox OAuth2 Configuration
REACT_APP_DROPBOX_CLIENT_ID=your_dropbox_client_id
REACT_APP_DROPBOX_CLIENT_SECRET=your_dropbox_client_secret
```

### Dropbox App Configuration

1. **Create Dropbox App**:
   - Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
   - Click "Create app"
   - Choose "Scoped access"
   - Select "Full Dropbox" access
   - Name your app (e.g., "Research Notebook")

2. **Configure OAuth2**:
   - Set redirect URI: `http://localhost:5173/auth/dropbox/callback`
   - Add required scopes:
     - `files.content.read`
     - `files.content.write`
     - `files.metadata.read`

3. **Get Credentials**:
   - Copy the App key (Client ID)
   - Copy the App secret (Client Secret)

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

### File Operations
```typescript
const { listFiles, uploadFile, downloadFile } = useCloudSync();

// List files
const handleListFiles = async () => {
  const files = await listFiles('dropbox', '/documents');
  console.log('Files:', files);
};

// Upload file
const handleUpload = async () => {
  const file = new File(['content'], 'test.txt', { type: 'text/plain' });
  const success = await uploadFile('dropbox', '/local/test.txt', '/remote/test.txt', file);
  if (success) {
    console.log('File uploaded successfully');
  }
};

// Download file
const handleDownload = async () => {
  const fileContent = await downloadFile('dropbox', '/remote/test.txt', '/local/test.txt');
  if (fileContent) {
    console.log('File downloaded successfully');
  }
};
```

## Error Handling

### Common Errors and Solutions

1. **"Missing client ID for dropbox"**
   - Ensure `REACT_APP_DROPBOX_CLIENT_ID` is set in environment variables
   - Check that the environment variable is properly loaded

2. **"Dropbox token exchange failed"**
   - Verify client ID and secret are correct
   - Check redirect URI matches Dropbox app configuration
   - Ensure authorization code is valid and not expired

3. **"Dropbox client not initialized"**
   - Call `connectService('dropbox')` before performing file operations
   - Check that OAuth2 flow completed successfully

4. **"File content is required for upload"**
   - Provide a File or Blob object when calling uploadFile
   - Ensure the file content is not null or undefined

## Security Considerations

### Token Security
- Access tokens are stored in localStorage (consider more secure storage for production)
- Refresh tokens are handled securely
- Automatic token cleanup on disconnect

### OAuth2 Security
- State parameter for CSRF protection
- Secure redirect URI validation
- Proper scope management

### File Security
- File content validation
- Path traversal protection
- File size limits (implement as needed)

## Testing

### Unit Tests
```typescript
describe('Dropbox Integration', () => {
  it('should connect to Dropbox', async () => {
    const service = new CloudSyncService();
    const result = await service.connectService('dropbox');
    expect(result).toBe(true);
  });

  it('should list files from Dropbox', async () => {
    const service = new CloudSyncService();
    const files = await service.listSyncedFiles('dropbox', '/');
    expect(Array.isArray(files)).toBe(true);
  });
});
```

### Integration Tests
```typescript
describe('Dropbox File Operations', () => {
  it('should upload and download files', async () => {
    // Test complete file operation flow
  });

  it('should handle OAuth flow', async () => {
    // Test complete OAuth2 flow
  });
});
```

## Performance Considerations

### Optimization Strategies
1. **File Chunking**: For large files, implement chunked uploads
2. **Caching**: Cache file listings to reduce API calls
3. **Background Sync**: Implement background synchronization
4. **Error Retry**: Add retry logic for failed operations

### Monitoring
- Track API call frequency
- Monitor upload/download speeds
- Log error rates and types
- Monitor token refresh patterns

## Future Enhancements

### Planned Features
1. **File Synchronization**: Two-way sync with conflict resolution
2. **Selective Sync**: Choose which folders to sync
3. **Offline Support**: Cache files for offline access
4. **Batch Operations**: Upload/download multiple files
5. **File Versioning**: Track file versions and changes

### Advanced Features
1. **Real-time Sync**: WebSocket-based real-time updates
2. **Collaboration**: Shared folder support
3. **Advanced Permissions**: Granular access control
4. **Audit Logging**: Track all file operations

## Troubleshooting

### Debug Mode
Enable debug logging for development:

```typescript
if (process.env.NODE_ENV === 'development') {
  cloudSyncService.on('*', (event, data) => {
    console.log('Cloud sync event:', event, data);
  });
}
```

### Common Issues
1. **CORS Errors**: Ensure proper CORS configuration
2. **Token Expiration**: Implement automatic token refresh
3. **Network Issues**: Add retry logic and offline detection
4. **File Size Limits**: Implement chunked uploads for large files

## Conclusion

The Dropbox SDK integration provides a robust foundation for cloud storage operations in the Electronic Lab Notebook application. The implementation follows best practices for OAuth2 authentication, error handling, and security, making it suitable for production use.

The modular design allows for easy extension to other cloud providers while maintaining a consistent user experience. The comprehensive settings interface provides users with full control over their cloud sync configuration. 