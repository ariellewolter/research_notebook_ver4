import { apiClient } from './apiClient';
import { CloudServiceName, CloudFile, CloudSyncStatus } from '../../utils/cloudSyncAPI';

export interface CloudSyncApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
}

export interface CloudSyncStatusResponse {
  connectedServices: CloudServiceName[];
  lastSyncTime: string | null;
  syncEnabled: boolean;
}

export interface CloudSyncConnectResponse {
  serviceName: CloudServiceName;
  authUrl: string;
  state: string;
}

export interface CloudSyncCallbackResponse {
  serviceName: CloudServiceName;
  connected: boolean;
  accessToken: string;
}

export interface CloudSyncFilesResponse {
  serviceName: CloudServiceName;
  folderPath: string;
  files: CloudFile[];
}

export interface CloudSyncUploadResponse {
  serviceName: CloudServiceName;
  localPath: string;
  remotePath: string;
  uploaded: boolean;
}

export interface CloudSyncDownloadResponse {
  serviceName: CloudServiceName;
  remotePath: string;
  localPath: string;
  downloaded: boolean;
}

export interface CloudSyncOperationResponse {
  serviceName: CloudServiceName;
  operation: string;
  synced: boolean;
  timestamp: string;
}

export const cloudSyncApi = {
  /**
   * Get cloud sync status for all services
   */
  getStatus: async (): Promise<CloudSyncStatusResponse> => {
    const response = await apiClient.get<CloudSyncApiResponse<CloudSyncStatusResponse>>('/cloud-sync/status');
    return response.data.data;
  },

  /**
   * Initiate connection to a cloud service
   */
  connect: async (serviceName: CloudServiceName): Promise<CloudSyncConnectResponse> => {
    const response = await apiClient.post<CloudSyncApiResponse<CloudSyncConnectResponse>>('/cloud-sync/connect', {
      serviceName
    });
    return response.data.data;
  },

  /**
   * Handle OAuth callback from cloud service
   */
  handleCallback: async (serviceName: CloudServiceName, code: string, state?: string): Promise<CloudSyncCallbackResponse> => {
    const response = await apiClient.post<CloudSyncApiResponse<CloudSyncCallbackResponse>>('/cloud-sync/callback', {
      serviceName,
      code,
      state
    });
    return response.data.data;
  },

  /**
   * Disconnect from a cloud service
   */
  disconnect: async (serviceName: CloudServiceName): Promise<{ serviceName: CloudServiceName; disconnected: boolean }> => {
    const response = await apiClient.post<CloudSyncApiResponse<{ serviceName: CloudServiceName; disconnected: boolean }>>('/cloud-sync/disconnect', {
      serviceName
    });
    return response.data.data;
  },

  /**
   * List files from a cloud service
   */
  listFiles: async (serviceName: CloudServiceName, folderPath: string = '/'): Promise<CloudSyncFilesResponse> => {
    const response = await apiClient.get<CloudSyncApiResponse<CloudSyncFilesResponse>>(`/cloud-sync/files/${serviceName}`, {
      params: { folderPath }
    });
    return response.data.data;
  },

  /**
   * Upload a file to cloud service
   */
  uploadFile: async (serviceName: CloudServiceName, localPath: string, remotePath: string): Promise<CloudSyncUploadResponse> => {
    const response = await apiClient.post<CloudSyncApiResponse<CloudSyncUploadResponse>>('/cloud-sync/upload', {
      serviceName,
      localPath,
      remotePath
    });
    return response.data.data;
  },

  /**
   * Download a file from cloud service
   */
  downloadFile: async (serviceName: CloudServiceName, remotePath: string, localPath: string): Promise<CloudSyncDownloadResponse> => {
    const response = await apiClient.post<CloudSyncApiResponse<CloudSyncDownloadResponse>>('/cloud-sync/download', {
      serviceName,
      remotePath,
      localPath
    });
    return response.data.data;
  },

  /**
   * Perform a sync operation
   */
  sync: async (serviceName: CloudServiceName, operation: string): Promise<CloudSyncOperationResponse> => {
    const response = await apiClient.post<CloudSyncApiResponse<CloudSyncOperationResponse>>('/cloud-sync/sync', {
      serviceName,
      operation
    });
    return response.data.data;
  }
}; 