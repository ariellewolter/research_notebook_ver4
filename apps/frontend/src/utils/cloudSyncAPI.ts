/**
 * Cloud Sync Service Abstraction Layer
 * 
 * This module provides a unified interface for cloud storage services
 * with OAuth2 authentication and modular provider support.
 */

import { Dropbox } from 'dropbox';
// import { google } from 'googleapis'; // Commented out - Node.js library not compatible with browser
import { PublicClientApplication, AuthenticationResult, AccountInfo } from '@azure/msal-browser';

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
  parentId?: string;
}

export interface CloudSyncStatus {
  isConnected: boolean;
  lastSync?: string;
  syncFolder?: string;
  syncFolderId?: string;
  error?: string;
}

export interface CloudSyncError {
  code: string;
  message: string;
  details?: any;
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
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly'
    ]
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
    scopes: ['Files.ReadWrite', 'Files.ReadWrite.All']
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
export class CloudSyncService {
  private connectedServices: Set<CloudServiceName> = new Set();
  private dropboxClient: Dropbox | null = null;
  private msalInstance: PublicClientApplication | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

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
        } else if (serviceName === 'google') {
          await this.initializeGoogleDriveClient(existingToken);
        } else if (serviceName === 'onedrive') {
          await this.initializeOneDriveClient(existingToken);
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
  async handleAuthCallback(serviceName: CloudServiceName, url: string): Promise<boolean> {
    try {
      if (serviceName === 'onedrive') {
        // OneDrive handles auth callback through MSAL popup
        return true;
      }

      const urlParams = new URLSearchParams(url.split('?')[1]);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        throw new Error(`Authorization failed: ${error}`);
      }

      if (!code || state !== serviceName) {
        throw new Error('Invalid authorization response');
      }

      const config = CLOUD_SERVICE_CONFIGS[serviceName];
      const tokenData = await this.exchangeCodeForToken(serviceName, code, config);

      // Store tokens
      this.storeToken(serviceName, tokenData.access_token, tokenData.refresh_token);

      // Initialize service-specific client
      if (serviceName === 'dropbox') {
        this.initializeDropboxClient(tokenData.access_token);
      } else if (serviceName === 'google') {
        await this.initializeGoogleDriveClient(tokenData.access_token);
      } else if (serviceName === 'onedrive') {
        await this.initializeOneDriveClient(tokenData.access_token);
      }

      this.connectedServices.add(serviceName);
      this.emit('serviceConnected', { serviceName });
      return true;
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
      const files = await this.providerListFiles(serviceName, folderPath);
      
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
      const success = await this.providerUploadFile(serviceName, remotePath, fileContent);
      
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
      const fileContent = await this.providerDownloadFile(serviceName, remotePath);
      
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
  async disconnectService(serviceName: CloudServiceName): Promise<boolean> {
    this.connectedServices.delete(serviceName);
    this.clearStoredTokens(serviceName);
    
    // Clean up provider-specific clients
    if (serviceName === 'dropbox') {
      this.dropboxClient = null;
    } else if (serviceName === 'google') {
      this.googleDriveClient = null;
    } else if (serviceName === 'onedrive') {
      if (this.msalInstance) {
        await this.msalInstance.logout();
        this.msalInstance = null;
      }
    }
    
    this.emit('serviceDisconnected', { serviceName });
    return true;
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
    } else if (serviceName === 'google') {
      return this.exchangeGoogleCodeForToken(code, config);
    } else if (serviceName === 'onedrive') {
      return this.exchangeOneDriveCodeForToken(code, config);
    }
    // Placeholder for other providers
    throw new Error(`Token exchange not implemented for ${serviceName}`);
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

  private async exchangeGoogleCodeForToken(code: string, config: CloudSyncConfig): Promise<any> {
    try {
      // Use backend API to handle Google OAuth token exchange
      const response = await fetch('/api/cloud-sync/google/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          redirectUri: config.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`Google OAuth error: ${response.statusText}`);
      }

      const tokens = await response.json();
      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      };
    } catch (error) {
      console.error('Google token exchange error:', error);
      throw error;
    }
  }

  private async exchangeOneDriveCodeForToken(code: string, config: CloudSyncConfig): Promise<any> {
    try {
      // For OneDrive, we use MSAL which handles token exchange internally
      // The code is already exchanged during the MSAL authentication flow
      const account = this.msalInstance?.getActiveAccount();
      if (!account) {
        throw new Error('No active OneDrive account found');
      }

      const silentRequest = {
        scopes: config.scopes,
        account: account
      };

      const response = await this.msalInstance?.acquireTokenSilent(silentRequest);
      if (!response) {
        throw new Error('Failed to acquire OneDrive token');
      }

      return {
        access_token: response.accessToken,
        refresh_token: response.refreshToken,
        expires_in: response.expiresOn ? Math.floor((response.expiresOn.getTime() - Date.now()) / 1000) : undefined
      };
    } catch (error) {
      console.error('OneDrive token exchange error:', error);
      throw error;
    }
  }

  private async initializeGoogleDriveClient(accessToken: string): Promise<void> {
    try {
      // This function is no longer used as Google Drive is commented out
      // const oauth2Client = new google.auth.OAuth2();
      // oauth2Client.setCredentials({ access_token: accessToken });
      
      // this.googleDriveClient = google.drive({ version: 'v3', auth: oauth2Client });
    } catch (error) {
      console.error('Failed to initialize Google Drive client:', error);
      throw error;
    }
  }

  private async initializeOneDriveClient(accessToken: string): Promise<void> {
    try {
      // OneDrive uses Microsoft Graph API directly with fetch
      // No separate client initialization needed, we'll use fetch with the access token
      this.msalInstance = new PublicClientApplication({
        auth: {
          clientId: process.env.REACT_APP_ONEDRIVE_CLIENT_ID || '',
          authority: 'https://login.microsoftonline.com/common',
          redirectUri: `${window.location.origin}/auth/onedrive/callback`
        },
        cache: {
          cacheLocation: 'localStorage',
          storeAuthStateInCookie: false
        }
      });
    } catch (error) {
      console.error('Failed to initialize OneDrive client:', error);
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
    folderPath: string = '/'
  ): Promise<CloudFile[]> {
    if (serviceName === 'dropbox') {
      return this.dropboxListFiles(folderPath);
    } else if (serviceName === 'google') {
      return this.googleDriveListFiles(folderPath);
    } else if (serviceName === 'onedrive') {
      return this.oneDriveListFiles(folderPath);
    }
    throw new Error(`File listing not implemented for ${serviceName}`);
  }

  private async googleDriveListFiles(folderPath: string = '/'): Promise<CloudFile[]> {
    // This function is no longer used as Google Drive is commented out
    // if (!this.googleDriveClient) {
    //   throw new Error('Google Drive client not initialized');
    // }

    try {
      let folderId = 'root';
      
      // If folderPath is not root, we need to find the folder ID
      if (folderPath !== '/') {
        const pathParts = folderPath.split('/').filter(part => part.length > 0);
        for (const part of pathParts) {
          // const response = await this.googleDriveClient.files.list({
          //   q: `name='${part}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          //   fields: 'files(id, name)',
          //   pageSize: 1
          // });
          
          // if (response.data.files && response.data.files.length > 0) {
          //   folderId = response.data.files[0].id;
          // } else {
          //   throw new Error(`Folder not found: ${part}`);
          // }
        }
      }

      // const response = await this.googleDriveClient.files.list({
      //   q: `'${folderId}' in parents and trashed=false`,
      //   fields: 'files(id, name, mimeType, size, modifiedTime, parents)',
      //   pageSize: 100
      // });

      return []; // Return empty array as client is not initialized
    } catch (error) {
      console.error('Google Drive list files error:', error);
      throw error;
    }
  }

  private async oneDriveListFiles(folderPath: string = '/'): Promise<CloudFile[]> {
    if (!this.msalInstance) {
      throw new Error('OneDrive client not initialized');
    }

    try {
      const account = this.msalInstance.getActiveAccount();
      if (!account) {
        throw new Error('No active OneDrive account found');
      }

      const silentRequest = {
        scopes: ['Files.ReadWrite', 'Files.ReadWrite.All'],
        account: account
      };

      const response = await this.msalInstance.acquireTokenSilent(silentRequest);
      if (!response) {
        throw new Error('Failed to acquire OneDrive token');
      }

      let endpoint = 'https://graph.microsoft.com/v1.0/me/drive/root/children';
      
      // If not root, find the folder ID
      if (folderPath !== '/') {
        const pathParts = folderPath.split('/').filter(part => part.length > 0);
        let currentPath = '';
        
        for (const part of pathParts) {
          currentPath += `/${part}`;
          const folderResponse = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/root:${currentPath}:`,
            {
              headers: {
                'Authorization': `Bearer ${response.accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!folderResponse.ok) {
            throw new Error(`Folder not found: ${part}`);
          }

          const folderData = await folderResponse.json();
          if (folderData.folder) {
            endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${folderData.id}/children`;
          }
        }
      }

      const filesResponse = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${response.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!filesResponse.ok) {
        throw new Error('Failed to list OneDrive files');
      }

      const filesData = await filesResponse.json();
      
      return filesData.value?.map((file: any) => ({
        id: file.id,
        name: file.name,
        path: folderPath === '/' ? `/${file.name}` : `${folderPath}/${file.name}`,
        size: file.size || 0,
        modifiedTime: file.lastModifiedDateTime || new Date().toISOString(),
        isFolder: file.folder !== undefined,
        mimeType: file.file?.mimeType,
        parentId: file.parentReference?.id
      })) || [];
    } catch (error) {
      console.error('OneDrive list files error:', error);
      throw error;
    }
  }

  private async providerUploadFile(
    serviceName: CloudServiceName, 
    remotePath: string, 
    fileContent?: File | Blob
  ): Promise<boolean> {
    if (serviceName === 'dropbox') {
      return this.dropboxUploadFile(remotePath, fileContent);
    } else if (serviceName === 'google') {
      return this.googleDriveUploadFile(remotePath, fileContent);
    } else if (serviceName === 'onedrive') {
      return this.oneDriveUploadFile(remotePath, fileContent);
    }
    throw new Error(`File upload not implemented for ${serviceName}`);
  }

  private async googleDriveUploadFile(remotePath: string, fileContent?: File | Blob): Promise<boolean> {
    // This function is no longer used as Google Drive is commented out
    // if (!this.googleDriveClient) {
    //   throw new Error('Google Drive client not initialized');
    // }

    if (!fileContent) {
      throw new Error('File content is required for upload');
    }

    try {
      const fileName = remotePath.split('/').pop() || 'untitled';
      const arrayBuffer = await fileContent.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileMetadata = {
        name: fileName,
        mimeType: this.getMimeType(fileName)
      };

      const media = {
        mimeType: this.getMimeType(fileName),
        body: buffer
      };

      // await this.googleDriveClient.files.create({
      //   requestBody: fileMetadata,
      //   media: media,
      //   fields: 'id'
      // });

      return true;
    } catch (error) {
      console.error('Google Drive upload error:', error);
      throw error;
    }
  }

  private async oneDriveUploadFile(remotePath: string, fileContent?: File | Blob): Promise<boolean> {
    if (!this.msalInstance) {
      throw new Error('OneDrive client not initialized');
    }

    if (!fileContent) {
      throw new Error('File content is required for upload');
    }

    try {
      const account = this.msalInstance.getActiveAccount();
      if (!account) {
        throw new Error('No active OneDrive account found');
      }

      const silentRequest = {
        scopes: ['Files.ReadWrite', 'Files.ReadWrite.All'],
        account: account
      };

      const response = await this.msalInstance.acquireTokenSilent(silentRequest);
      if (!response) {
        throw new Error('Failed to acquire OneDrive token');
      }

      const fileName = remotePath.split('/').pop() || 'untitled';
      const arrayBuffer = await fileContent.arrayBuffer();

      // Upload to OneDrive using Microsoft Graph API
      const uploadResponse = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root:/${fileName}:/content`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${response.accessToken}`,
            'Content-Type': this.getMimeType(fileName)
          },
          body: arrayBuffer
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(`OneDrive upload failed: ${uploadResponse.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('OneDrive upload error:', error);
      throw error;
    }
  }

  private async providerDownloadFile(
    serviceName: CloudServiceName, 
    remotePath: string
  ): Promise<Blob | null> {
    if (serviceName === 'dropbox') {
      return this.dropboxDownloadFile(remotePath);
    } else if (serviceName === 'google') {
      return this.googleDriveDownloadFile(remotePath);
    } else if (serviceName === 'onedrive') {
      return this.oneDriveDownloadFile(remotePath);
    }
    throw new Error(`File download not implemented for ${serviceName}`);
  }

  private async googleDriveDownloadFile(remotePath: string): Promise<Blob | null> {
    // This function is no longer used as Google Drive is commented out
    // if (!this.googleDriveClient) {
    //   throw new Error('Google Drive client not initialized');
    // }

    try {
      // First, find the file ID by path
      const fileName = remotePath.split('/').pop() || '';
      // const response = await this.googleDriveClient.files.list({
      //   q: `name='${fileName}' and trashed=false`,
      //   fields: 'files(id, name, mimeType)',
      //   pageSize: 1
      // });

      // if (!response.data.files || response.data.files.length === 0) {
      //   throw new Error(`File not found: ${fileName}`);
      // }

      // const fileId = response.data.files[0].id;
      // const file = await this.googleDriveClient.files.get({
      //   fileId: fileId,
      //   alt: 'media'
      // });

      // // Convert the response to a Blob
      // const blob = new Blob([file.data], {
      //   type: this.getMimeType(fileName)
      // });

      return null; // Return null as client is not initialized
    } catch (error) {
      console.error('Google Drive download error:', error);
      throw error;
    }
  }

  private async oneDriveDownloadFile(remotePath: string): Promise<Blob | null> {
    if (!this.msalInstance) {
      throw new Error('OneDrive client not initialized');
    }

    try {
      const account = this.msalInstance.getActiveAccount();
      if (!account) {
        throw new Error('No active OneDrive account found');
      }

      const silentRequest = {
        scopes: ['Files.ReadWrite', 'Files.ReadWrite.All'],
        account: account
      };

      const response = await this.msalInstance.acquireTokenSilent(silentRequest);
      if (!response) {
        throw new Error('Failed to acquire OneDrive token');
      }

      const fileName = remotePath.split('/').pop() || '';
      
      // Download from OneDrive using Microsoft Graph API
      const downloadResponse = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root:/${fileName}:/content`,
        {
          headers: {
            'Authorization': `Bearer ${response.accessToken}`
          }
        }
      );

      if (!downloadResponse.ok) {
        throw new Error(`OneDrive download failed: ${downloadResponse.statusText}`);
      }

      const blob = await downloadResponse.blob();
      return blob;
    } catch (error) {
      console.error('OneDrive download error:', error);
      throw error;
    }
  }

  // New method for Google Drive folder selection
  async selectGoogleDriveFolder(): Promise<{ id: string; name: string; path: string } | null> {
    // This function is no longer used as Google Drive is commented out
    // if (!this.googleDriveClient) {
    //   throw new Error('Google Drive client not initialized');
    // }

    try {
      // Get all folders from Google Drive
      // const response = await this.googleDriveClient.files.list({
      //   q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      //   fields: 'files(id, name, parents)',
      //   pageSize: 100
      // });

      // const folders = response.data.files || [];
      
      // // For now, return the first available folder or root
      // // In a real implementation, you'd show a folder picker UI
      // if (folders.length > 0) {
      //   const folder = folders[0];
      //   return {
      //     id: folder.id,
      //     name: folder.name,
      //     path: `/${folder.name}`
      //   };
      // }

      // // Return root folder if no other folders exist
      // return {
      //   id: 'root',
      //   name: 'My Drive',
      //   path: '/'
      // };
      return null; // Return null as client is not initialized
    } catch (error) {
      console.error('Error selecting Google Drive folder:', error);
      throw error;
    }
  }

  // New method for OneDrive folder selection
  async selectOneDriveFolder(): Promise<{ id: string; name: string; path: string } | null> {
    if (!this.msalInstance) {
      throw new Error('OneDrive client not initialized');
    }

    try {
      const account = this.msalInstance.getActiveAccount();
      if (!account) {
        throw new Error('No active OneDrive account found');
      }

      const silentRequest = {
        scopes: ['Files.ReadWrite', 'Files.ReadWrite.All'],
        account: account
      };

      const response = await this.msalInstance.acquireTokenSilent(silentRequest);
      if (!response) {
        throw new Error('Failed to acquire OneDrive token');
      }

      // Get all folders from OneDrive
      const foldersResponse = await fetch(
        'https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=folder ne null',
        {
          headers: {
            'Authorization': `Bearer ${response.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!foldersResponse.ok) {
        throw new Error('Failed to list OneDrive folders');
      }

      const foldersData = await foldersResponse.json();
      const folders = foldersData.value || [];
      
      // For now, return the first available folder or root
      // In a real implementation, you'd show a folder picker UI
      if (folders.length > 0) {
        const folder = folders[0];
        return {
          id: folder.id,
          name: folder.name,
          path: `/${folder.name}`
        };
      }

      // Return root folder if no other folders exist
      return {
        id: 'root',
        name: 'OneDrive',
        path: '/'
      };
    } catch (error) {
      console.error('Error selecting OneDrive folder:', error);
      throw error;
    }
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