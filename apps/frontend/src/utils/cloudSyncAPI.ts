/**
 * Cloud Sync Service Abstraction Layer
 * 
 * This module provides a unified interface for cloud storage services
 * with OAuth2 authentication and modular provider support.
 */

import { Dropbox } from 'dropbox';

export type CloudServiceName = 'dropbox' | 'google' | 'apple' | 'onedrive';

export interface CloudSyncConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface CloudFile {
  id: string;
  name: string;
  path: string;
  size: number;
  modifiedTime: string;
  isFolder: boolean;
  mimeType?: string;
}

export interface CloudSyncStatus {
  isConnected: boolean;
  serviceName: CloudServiceName;
  accountInfo?: {
    email: string;
    name: string;
    storageUsed: number;
    storageTotal: number;
  };
  lastSyncTime?: string;
}

export interface CloudSyncError {
  code: string;
  message: string;
  serviceName: CloudServiceName;
  timestamp: string;
}

// Provider-specific configurations
const CLOUD_SERVICE_CONFIGS: Record<CloudServiceName, CloudSyncConfig> = {
  dropbox: {
    clientId: process.env.REACT_APP_DROPBOX_CLIENT_ID || '',
    clientSecret: process.env.REACT_APP_DROPBOX_CLIENT_SECRET || '',
    redirectUri: `${window.location.origin}/auth/dropbox/callback`,
    scopes: ['files.content.read', 'files.content.write', 'files.metadata.read']
  },
  google: {
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${window.location.origin}/auth/google/callback`,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  },
  apple: {
    clientId: process.env.REACT_APP_APPLE_CLIENT_ID || '',
    clientSecret: process.env.REACT_APP_APPLE_CLIENT_SECRET || '',
    redirectUri: `${window.location.origin}/auth/apple/callback`,
    scopes: ['files.read', 'files.write']
  },
  onedrive: {
    clientId: process.env.REACT_APP_ONEDRIVE_CLIENT_ID || '',
    clientSecret: process.env.REACT_APP_ONEDRIVE_CLIENT_SECRET || '',
    redirectUri: `${window.location.origin}/auth/onedrive/callback`,
    scopes: ['files.readwrite', 'offline_access']
  }
};

// Storage keys for OAuth tokens
const getTokenStorageKey = (serviceName: CloudServiceName) => 
  `cloud_sync_${serviceName}_token`;

const getRefreshTokenStorageKey = (serviceName: CloudServiceName) => 
  `cloud_sync_${serviceName}_refresh_token`;

/**
 * Cloud Sync Service Class
 * Provides unified interface for cloud storage operations
 */
class CloudSyncService {
  private connectedServices: Set<CloudServiceName> = new Set();
  private eventListeners: Map<string, Function[]> = new Map();
  private dropboxClient: Dropbox | null = null;

  /**
   * Initialize OAuth2 flow for a cloud service
   */
  async connectService(serviceName: CloudServiceName): Promise<boolean> {
    try {
      const config = CLOUD_SERVICE_CONFIGS[serviceName];
      
      if (!config.clientId) {
        throw new Error(`Missing client ID for ${serviceName}`);
      }

      // Check if already connected
      if (this.connectedServices.has(serviceName)) {
        console.log(`${serviceName} already connected`);
        return true;
      }

      // Check for existing valid token
      const existingToken = this.getStoredToken(serviceName);
      if (existingToken && !this.isTokenExpired(existingToken)) {
        this.connectedServices.add(serviceName);
        if (serviceName === 'dropbox') {
          this.initializeDropboxClient(existingToken);
        }
        this.emit('serviceConnected', { serviceName });
        return true;
      }

      // Initiate OAuth2 flow
      const authUrl = this.buildAuthUrl(serviceName, config);
      window.location.href = authUrl;
      
      return false; // Will return true after callback
    } catch (error) {
      this.handleError(serviceName, error as Error);
      return false;
    }
  }

  /**
   * Handle OAuth2 callback and store tokens
   */
  async handleAuthCallback(serviceName: CloudServiceName, code: string): Promise<boolean> {
    try {
      const config = CLOUD_SERVICE_CONFIGS[serviceName];
      const tokenResponse = await this.exchangeCodeForToken(serviceName, code, config);
      
      if (tokenResponse.access_token) {
        this.storeToken(serviceName, tokenResponse.access_token, tokenResponse.refresh_token);
        this.connectedServices.add(serviceName);
        
        // Initialize provider-specific clients
        if (serviceName === 'dropbox') {
          this.initializeDropboxClient(tokenResponse.access_token);
        }
        
        this.emit('serviceConnected', { serviceName });
        return true;
      }
      
      return false;
    } catch (error) {
      this.handleError(serviceName, error as Error);
      return false;
    }
  }

  /**
   * List files in the sync folder
   */
  async listSyncedFiles(serviceName: CloudServiceName, folderPath: string = '/'): Promise<CloudFile[]> {
    try {
      this.ensureConnected(serviceName);
      
      const token = this.getStoredToken(serviceName);
      if (!token) {
        throw new Error('No valid token found');
      }

      // This will be implemented with provider-specific SDKs
      const files = await this.providerListFiles(serviceName, token, folderPath);
      
      this.emit('filesListed', { serviceName, files, folderPath });
      return files;
    } catch (error) {
      this.handleError(serviceName, error as Error);
      return [];
    }
  }

  /**
   * Upload a file to cloud storage
   */
  async uploadFile(
    serviceName: CloudServiceName, 
    localPath: string, 
    remotePath: string,
    fileContent?: File | Blob
  ): Promise<boolean> {
    try {
      this.ensureConnected(serviceName);
      
      const token = this.getStoredToken(serviceName);
      if (!token) {
        throw new Error('No valid token found');
      }

      // This will be implemented with provider-specific SDKs
      const success = await this.providerUploadFile(serviceName, token, localPath, remotePath, fileContent);
      
      if (success) {
        this.emit('fileUploaded', { serviceName, localPath, remotePath });
      }
      
      return success;
    } catch (error) {
      this.handleError(serviceName, error as Error);
      return false;
    }
  }

  /**
   * Download a file from cloud storage
   */
  async downloadFile(
    serviceName: CloudServiceName, 
    remotePath: string, 
    localPath: string
  ): Promise<Blob | null> {
    try {
      this.ensureConnected(serviceName);
      
      const token = this.getStoredToken(serviceName);
      if (!token) {
        throw new Error('No valid token found');
      }

      // This will be implemented with provider-specific SDKs
      const fileContent = await this.providerDownloadFile(serviceName, token, remotePath);
      
      if (fileContent) {
        this.emit('fileDownloaded', { serviceName, remotePath, localPath });
      }
      
      return fileContent;
    } catch (error) {
      this.handleError(serviceName, error as Error);
      return null;
    }
  }

  /**
   * Disconnect from a cloud service
   */
  disconnectService(serviceName: CloudServiceName): void {
    this.connectedServices.delete(serviceName);
    this.clearStoredTokens(serviceName);
    
    // Clean up provider-specific clients
    if (serviceName === 'dropbox') {
      this.dropboxClient = null;
    }
    
    this.emit('serviceDisconnected', { serviceName });
  }

  /**
   * Get sync status for a service
   */
  getSyncStatus(serviceName: CloudServiceName): CloudSyncStatus {
    const isConnected = this.connectedServices.has(serviceName);
    const token = this.getStoredToken(serviceName);
    
    return {
      isConnected,
      serviceName,
      lastSyncTime: token ? new Date().toISOString() : undefined
    };
  }

  /**
   * Get all connected services
   */
  getConnectedServices(): CloudServiceName[] {
    return Array.from(this.connectedServices);
  }

  // Event handling
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Private helper methods
  private ensureConnected(serviceName: CloudServiceName): void {
    if (!this.connectedServices.has(serviceName)) {
      throw new Error(`${serviceName} is not connected. Call connectService() first.`);
    }
  }

  private buildAuthUrl(serviceName: CloudServiceName, config: CloudSyncConfig): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state: serviceName // Used to identify the service in callback
    });

    const authUrls = {
      dropbox: 'https://www.dropbox.com/oauth2/authorize',
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      apple: 'https://appleid.apple.com/auth/authorize',
      onedrive: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
    };

    return `${authUrls[serviceName]}?${params.toString()}`;
  }

  private async exchangeCodeForToken(
    serviceName: CloudServiceName, 
    code: string, 
    config: CloudSyncConfig
  ): Promise<any> {
    if (serviceName === 'dropbox') {
      return this.exchangeDropboxCodeForToken(code, config);
    }
    
    // Placeholder for other providers
    return {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expires_in: 3600
    };
  }

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

  private isTokenExpired(token: string): boolean {
    // Simple token expiration check - will be enhanced with JWT parsing
    return false;
  }

  private handleError(serviceName: CloudServiceName, error: Error): void {
    const cloudError: CloudSyncError = {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      serviceName,
      timestamp: new Date().toISOString()
    };
    
    this.emit('error', cloudError);
    console.error(`Cloud sync error for ${serviceName}:`, error);
  }

  // Provider-specific implementations
  private async providerListFiles(
    serviceName: CloudServiceName, 
    token: string, 
    folderPath: string
  ): Promise<CloudFile[]> {
    if (serviceName === 'dropbox') {
      return this.dropboxListFiles(folderPath);
    }
    
    // Placeholder for other providers
    return [];
  }

  private async providerUploadFile(
    serviceName: CloudServiceName, 
    token: string, 
    localPath: string, 
    remotePath: string,
    fileContent?: File | Blob
  ): Promise<boolean> {
    if (serviceName === 'dropbox') {
      return this.dropboxUploadFile(remotePath, fileContent);
    }
    
    // Placeholder for other providers
    return true;
  }

  private async providerDownloadFile(
    serviceName: CloudServiceName, 
    token: string, 
    remotePath: string
  ): Promise<Blob | null> {
    if (serviceName === 'dropbox') {
      return this.dropboxDownloadFile(remotePath);
    }
    
    // Placeholder for other providers
    return null;
  }

  // Dropbox-specific implementations
  private initializeDropboxClient(accessToken: string): void {
    this.dropboxClient = new Dropbox({
      accessToken,
      fetch: fetch
    });
  }

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
}

// Export singleton instance
export const cloudSyncService = new CloudSyncService();

// Export types for external use
export type { CloudSyncService };
export default cloudSyncService; 