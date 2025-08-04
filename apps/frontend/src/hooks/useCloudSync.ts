import { useState, useEffect, useCallback } from 'react';
import { 
  cloudSyncService, 
  CloudServiceName, 
  CloudFile, 
  CloudSyncStatus, 
  CloudSyncError 
} from '../utils/cloudSyncAPI';

export interface UseCloudSyncReturn {
  // Connection state
  connectedServices: CloudServiceName[];
  isConnected: (serviceName: CloudServiceName) => boolean;
  
  // Connection methods
  connectService: (serviceName: CloudServiceName) => Promise<boolean>;
  disconnectService: (serviceName: CloudServiceName) => void;
  
  // File operations
  listFiles: (serviceName: CloudServiceName, folderPath?: string) => Promise<CloudFile[]>;
  uploadFile: (serviceName: CloudServiceName, localPath: string, remotePath: string, fileContent?: File | Blob) => Promise<boolean>;
  downloadFile: (serviceName: CloudServiceName, remotePath: string, localPath: string) => Promise<Blob | null>;
  
  // Status and info
  getSyncStatus: (serviceName: CloudServiceName) => CloudSyncStatus;
  
  // State
  loading: boolean;
  error: CloudSyncError | null;
  files: Record<CloudServiceName, CloudFile[]>;
  
  // Event handlers
  onServiceConnected: (callback: (data: { serviceName: CloudServiceName }) => void) => void;
  onServiceDisconnected: (callback: (data: { serviceName: CloudServiceName }) => void) => void;
  onFilesListed: (callback: (data: { serviceName: CloudServiceName; files: CloudFile[]; folderPath: string }) => void) => void;
  onFileUploaded: (callback: (data: { serviceName: CloudServiceName; localPath: string; remotePath: string }) => void) => void;
  onFileDownloaded: (callback: (data: { serviceName: CloudServiceName; remotePath: string; localPath: string }) => void) => void;
  onError: (callback: (error: CloudSyncError) => void) => void;
}

export const useCloudSync = (): UseCloudSyncReturn => {
  const [connectedServices, setConnectedServices] = useState<CloudServiceName[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CloudSyncError | null>(null);
  const [files, setFiles] = useState<Record<CloudServiceName, CloudFile[]>>({
    dropbox: [],
    google: [],
    apple: [],
    onedrive: []
  });

  // Initialize connected services on mount
  useEffect(() => {
    const services = cloudSyncService.getConnectedServices();
    setConnectedServices(services);
  }, []);

  // Set up event listeners
  useEffect(() => {
    const handleServiceConnected = ({ serviceName }: { serviceName: CloudServiceName }) => {
      setConnectedServices(prev => [...new Set([...prev, serviceName])]);
      setError(null);
    };

    const handleServiceDisconnected = ({ serviceName }: { serviceName: CloudServiceName }) => {
      setConnectedServices(prev => prev.filter(s => s !== serviceName));
      setFiles(prev => ({ ...prev, [serviceName]: [] }));
    };

    const handleFilesListed = ({ serviceName, files: fileList }: { serviceName: CloudServiceName; files: CloudFile[]; folderPath: string }) => {
      setFiles(prev => ({ ...prev, [serviceName]: fileList }));
    };

    const handleFileUploaded = ({ serviceName, localPath, remotePath }: { serviceName: CloudServiceName; localPath: string; remotePath: string }) => {
      // Optionally refresh file list after upload
      console.log(`File uploaded to ${serviceName}: ${localPath} -> ${remotePath}`);
    };

    const handleFileDownloaded = ({ serviceName, remotePath, localPath }: { serviceName: CloudServiceName; remotePath: string; localPath: string }) => {
      console.log(`File downloaded from ${serviceName}: ${remotePath} -> ${localPath}`);
    };

    const handleError = (error: CloudSyncError) => {
      setError(error);
      setLoading(false);
    };

    // Register event listeners
    cloudSyncService.on('serviceConnected', handleServiceConnected);
    cloudSyncService.on('serviceDisconnected', handleServiceDisconnected);
    cloudSyncService.on('filesListed', handleFilesListed);
    cloudSyncService.on('fileUploaded', handleFileUploaded);
    cloudSyncService.on('fileDownloaded', handleFileDownloaded);
    cloudSyncService.on('error', handleError);

    // Cleanup event listeners
    return () => {
      cloudSyncService.off('serviceConnected', handleServiceConnected);
      cloudSyncService.off('serviceDisconnected', handleServiceDisconnected);
      cloudSyncService.off('filesListed', handleFilesListed);
      cloudSyncService.off('fileUploaded', handleFileUploaded);
      cloudSyncService.off('fileDownloaded', handleFileDownloaded);
      cloudSyncService.off('error', handleError);
    };
  }, []);

  const connectService = useCallback(async (serviceName: CloudServiceName): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await cloudSyncService.connectService(serviceName);
      setLoading(false);
      return success;
    } catch (err) {
      setLoading(false);
      setError({
        code: 'CONNECTION_FAILED',
        message: err instanceof Error ? err.message : 'Connection failed',
        serviceName,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }, []);

  const disconnectService = useCallback((serviceName: CloudServiceName): void => {
    cloudSyncService.disconnectService(serviceName);
  }, []);

  const listFiles = useCallback(async (serviceName: CloudServiceName, folderPath: string = '/'): Promise<CloudFile[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const fileList = await cloudSyncService.listSyncedFiles(serviceName, folderPath);
      setLoading(false);
      return fileList;
    } catch (err) {
      setLoading(false);
      setError({
        code: 'LIST_FILES_FAILED',
        message: err instanceof Error ? err.message : 'Failed to list files',
        serviceName,
        timestamp: new Date().toISOString()
      });
      return [];
    }
  }, []);

  const uploadFile = useCallback(async (
    serviceName: CloudServiceName, 
    localPath: string, 
    remotePath: string, 
    fileContent?: File | Blob
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await cloudSyncService.uploadFile(serviceName, localPath, remotePath, fileContent);
      setLoading(false);
      return success;
    } catch (err) {
      setLoading(false);
      setError({
        code: 'UPLOAD_FAILED',
        message: err instanceof Error ? err.message : 'Upload failed',
        serviceName,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }, []);

  const downloadFile = useCallback(async (
    serviceName: CloudServiceName, 
    remotePath: string, 
    localPath: string
  ): Promise<Blob | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const fileContent = await cloudSyncService.downloadFile(serviceName, remotePath, localPath);
      setLoading(false);
      return fileContent;
    } catch (err) {
      setLoading(false);
      setError({
        code: 'DOWNLOAD_FAILED',
        message: err instanceof Error ? err.message : 'Download failed',
        serviceName,
        timestamp: new Date().toISOString()
      });
      return null;
    }
  }, []);

  const getSyncStatus = useCallback((serviceName: CloudServiceName): CloudSyncStatus => {
    return cloudSyncService.getSyncStatus(serviceName);
  }, []);

  const isConnected = useCallback((serviceName: CloudServiceName): boolean => {
    return connectedServices.includes(serviceName);
  }, [connectedServices]);

  // Event handler helpers
  const onServiceConnected = useCallback((callback: (data: { serviceName: CloudServiceName }) => void) => {
    cloudSyncService.on('serviceConnected', callback);
  }, []);

  const onServiceDisconnected = useCallback((callback: (data: { serviceName: CloudServiceName }) => void) => {
    cloudSyncService.on('serviceDisconnected', callback);
  }, []);

  const onFilesListed = useCallback((callback: (data: { serviceName: CloudServiceName; files: CloudFile[]; folderPath: string }) => void) => {
    cloudSyncService.on('filesListed', callback);
  }, []);

  const onFileUploaded = useCallback((callback: (data: { serviceName: CloudServiceName; localPath: string; remotePath: string }) => void) => {
    cloudSyncService.on('fileUploaded', callback);
  }, []);

  const onFileDownloaded = useCallback((callback: (data: { serviceName: CloudServiceName; remotePath: string; localPath: string }) => void) => {
    cloudSyncService.on('fileDownloaded', callback);
  }, []);

  const onError = useCallback((callback: (error: CloudSyncError) => void) => {
    cloudSyncService.on('error', callback);
  }, []);

  return {
    connectedServices,
    isConnected,
    connectService,
    disconnectService,
    listFiles,
    uploadFile,
    downloadFile,
    getSyncStatus,
    loading,
    error,
    files,
    onServiceConnected,
    onServiceDisconnected,
    onFilesListed,
    onFileUploaded,
    onFileDownloaded,
    onError
  };
}; 