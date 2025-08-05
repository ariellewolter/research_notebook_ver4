import { useState, useEffect, useCallback, useRef } from 'react';
import { useCloudSync } from './useCloudSync';
import { exportService, ExportData, ExportOptions } from '../services/exportService';
import { projectsApi } from '../services/api';

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface AutoExportConfig {
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
  retryDelay: number; // milliseconds
}

export interface AutoExportStatus {
  isEnabled: boolean;
  lastExportTime: number | null;
  pendingExports: number;
  failedExports: number;
  isExporting: boolean;
}

export interface ExportResult {
  success: boolean;
  projectId: string;
  projectName: string;
  format: ExportFormat;
  filename: string;
  cloudPath?: string;
  timestamp: number;
  error?: string;
  retryCount: number;
}

const DEFAULT_CONFIG: AutoExportConfig = {
  enabled: true,
  formats: ['pdf', 'excel'],
  includeMetadata: true,
  includeRelationships: true,
  includeNotes: true,
  includeFileReferences: true,
  cloudSyncEnabled: true,
  cloudService: 'dropbox',
  cloudPath: '/research-exports',
  filenameTemplate: '{projectName}_{date}_{format}',
  retryAttempts: 3,
  retryDelay: 5000
};

export const useAutoExport = (config: Partial<AutoExportConfig> = {}) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { isConnected, uploadFile } = useCloudSync();
  
  const [status, setStatus] = useState<AutoExportStatus>({
    isEnabled: mergedConfig.enabled,
    lastExportTime: null,
    pendingExports: 0,
    failedExports: 0,
    isExporting: false
  });

  const [exportResults, setExportResults] = useState<ExportResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs for managing export state
  const exportQueue = useRef<{ projectId: string; project: any; timestamp: number }[]>([]);
  const retryCounts = useRef<Map<string, number>>(new Map());
  const isProcessing = useRef(false);

  // Check if project is completed
  const isProjectCompleted = useCallback((project: any): boolean => {
    return project?.status === 'completed' || project?.status === 'Completed';
  }, []);

  // Generate filename based on template
  const generateFilename = useCallback((project: any, format: ExportFormat): string => {
    const date = new Date().toISOString().split('T')[0];
    const safeProjectName = (project.name || project.title || 'untitled')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);
    
    return mergedConfig.filenameTemplate
      .replace('{projectName}', safeProjectName)
      .replace('{date}', date)
      .replace('{format}', format)
      .replace('{projectId}', project.id);
  }, [mergedConfig.filenameTemplate]);

  // Prepare export data for project
  const prepareExportData = useCallback(async (project: any): Promise<ExportData> => {
    try {
      // Fetch complete project data with all relationships
      const projectData = await projectsApi.getById(project.id);
      const fullProject = projectData.data;

      const exportData: ExportData = {
        projects: [fullProject]
      };

      // Include experiments if they exist
      if (fullProject.experiments && fullProject.experiments.length > 0) {
        exportData.experiments = fullProject.experiments;
      }

      // Include notes if they exist
      if (mergedConfig.includeNotes && fullProject.experiments) {
        const allNotes = fullProject.experiments.flatMap((exp: any) => exp.notes || []);
        if (allNotes.length > 0) {
          exportData.notes = allNotes;
        }
      }

      // Include tasks if they exist
      if (fullProject.tasks && fullProject.tasks.length > 0) {
        exportData.tasks = fullProject.tasks;
      }

      // Include protocols if they exist
      if (fullProject.protocols && fullProject.protocols.length > 0) {
        exportData.protocols = fullProject.protocols;
      }

      return exportData;
    } catch (error) {
      console.error('Error preparing export data:', error);
      throw error;
    }
  }, [mergedConfig.includeNotes]);

  // Process export queue
  const processExportQueue = useCallback(async () => {
    if (isProcessing.current || !status.isEnabled) return;

    isProcessing.current = true;
    setStatus(prev => ({ ...prev, isExporting: true }));

    const exportsToProcess = [...exportQueue.current];
    exportQueue.current = [];

    for (const { projectId, project, timestamp } of exportsToProcess) {
      await processProjectExport(projectId, project, timestamp);
    }

    isProcessing.current = false;
    setStatus(prev => ({ 
      ...prev, 
      isExporting: false,
      lastExportTime: Date.now(),
      pendingExports: exportQueue.current.length
    }));
  }, [status.isEnabled]);

  // Process individual project export
  const processProjectExport = useCallback(async (
    projectId: string, 
    project: any, 
    timestamp: number
  ) => {
    const exportKey = `${projectId}_${timestamp}`;
    const currentRetries = retryCounts.current.get(exportKey) || 0;

    try {
      // Prepare export data
      const exportData = await prepareExportData(project);
      
      // Prepare export options
      const exportOptions: ExportOptions = {
        includeMetadata: mergedConfig.includeMetadata,
        includeRelationships: mergedConfig.includeRelationships,
        includeNotes: mergedConfig.includeNotes,
        includeFileReferences: mergedConfig.includeFileReferences
      };

      // Export to each configured format
      for (const format of mergedConfig.formats) {
        const filename = generateFilename(project, format);
        
        try {
          // Generate export file
          const fileBlob = await generateExportFile(format, exportData, exportOptions, filename);
          
          // Upload to cloud if enabled
          if (mergedConfig.cloudSyncEnabled) {
            await uploadToCloud(format, fileBlob, filename, project);
          }

          // Record successful export
          const result: ExportResult = {
            success: true,
            projectId,
            projectName: project.name || project.title,
            format,
            filename,
            cloudPath: mergedConfig.cloudSyncEnabled ? `${mergedConfig.cloudPath}/${filename}` : undefined,
            timestamp: Date.now(),
            retryCount: currentRetries
          };

          setExportResults(prev => [result, ...prev.slice(0, 99)]); // Keep last 100 results
          console.log(`Successfully exported ${project.name} to ${format}`);
          
        } catch (formatError) {
          console.error(`Failed to export ${project.name} to ${format}:`, formatError);
          
          // Handle retries for this format
          if (currentRetries < mergedConfig.retryAttempts) {
            const newRetryCount = currentRetries + 1;
            retryCounts.current.set(exportKey, newRetryCount);

            // Schedule retry
            setTimeout(() => {
              exportQueue.current.push({ projectId, project, timestamp });
              processExportQueue();
            }, mergedConfig.retryDelay * newRetryCount);

            console.log(`Scheduling retry ${newRetryCount} for ${project.name} ${format} export`);
          } else {
            // Max retries exceeded
            retryCounts.current.delete(exportKey);
            
            const result: ExportResult = {
              success: false,
              projectId,
              projectName: project.name || project.title,
              format,
              filename,
              timestamp: Date.now(),
              error: formatError instanceof Error ? formatError.message : 'Export failed',
              retryCount: currentRetries
            };

            setExportResults(prev => [result, ...prev.slice(0, 99)]);
            setStatus(prev => ({ ...prev, failedExports: prev.failedExports + 1 }));
            setError(`Failed to export ${project.name} to ${format} after ${mergedConfig.retryAttempts} retries`);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to process export for project ${projectId}:`, error);
      setError(`Failed to process export for project ${project.name || projectId}`);
    }
  }, [
    prepareExportData,
    mergedConfig,
    generateFilename,
    status.isEnabled,
    uploadToCloud
  ]);

  // Generate export file
  const generateExportFile = useCallback(async (
    format: ExportFormat,
    data: ExportData,
    options: ExportOptions,
    filename: string
  ): Promise<Blob> => {
    switch (format) {
      case 'pdf':
        return await exportService.exportToPDF(data, options, filename);
      case 'excel':
        return await exportService.exportToExcel(data, options, filename);
      case 'csv':
        return await exportService.exportToCSV(data, options, filename);
      case 'json':
        return await exportService.exportToJSON(data, options, filename);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }, []);

  // Upload to cloud storage
  const uploadToCloud = useCallback(async (
    format: ExportFormat,
    fileBlob: Blob,
    filename: string,
    project: any
  ) => {
    if (!mergedConfig.cloudSyncEnabled) return;

    const cloudService = mergedConfig.cloudService;
    
    // Check if cloud service is connected
    if (!isConnected(cloudService)) {
      throw new Error(`Cloud service ${cloudService} is not connected`);
    }

    // Determine file extension
    const extensions = {
      pdf: '.pdf',
      excel: '.xlsx',
      csv: '.csv',
      json: '.json'
    };

    const extension = extensions[format];
    const fullFilename = filename.endsWith(extension) ? filename : `${filename}${extension}`;
    const cloudPath = `${mergedConfig.cloudPath}/${fullFilename}`;

    // Upload file
    const success = await uploadFile(cloudService, '', cloudPath, fileBlob);
    
    if (!success) {
      throw new Error(`Failed to upload ${fullFilename} to ${cloudService}`);
    }

    console.log(`Successfully uploaded ${fullFilename} to ${cloudService}`);
  }, [
    mergedConfig.cloudSyncEnabled,
    mergedConfig.cloudService,
    mergedConfig.cloudPath,
    isConnected,
    uploadFile
  ]);

  // Listen for project status changes
  const handleProjectStatusChange = useCallback((project: any) => {
    if (!status.isEnabled) return;

    // Check if project was just completed
    if (isProjectCompleted(project)) {
      console.log(`Auto-export: Project ${project.name || project.title} completed, triggering export`);
      
      // Add to export queue
      exportQueue.current.push({
        projectId: project.id,
        project,
        timestamp: Date.now()
      });
      
      setStatus(prev => ({ ...prev, pendingExports: prev.pendingExports + 1 }));
      
      // Process queue
      processExportQueue();
    }
  }, [status.isEnabled, isProjectCompleted, processExportQueue]);

  // Enable/disable auto-export
  const setEnabled = useCallback((enabled: boolean) => {
    setStatus(prev => ({ ...prev, isEnabled: enabled }));
    
    if (!enabled) {
      // Clear all pending exports
      exportQueue.current = [];
      retryCounts.current.clear();
      setStatus(prev => ({ ...prev, pendingExports: 0, isExporting: false }));
    }
  }, []);

  // Clear export results
  const clearResults = useCallback(() => {
    setExportResults([]);
    setError(null);
    setStatus(prev => ({ ...prev, failedExports: 0 }));
  }, []);

  // Get recent export results
  const getRecentResults = useCallback((limit: number = 10) => {
    return exportResults.slice(0, limit);
  }, [exportResults]);

  // Get failed exports
  const getFailedExports = useCallback(() => {
    return exportResults.filter(result => !result.success);
  }, [exportResults]);

  // Manual export trigger
  const triggerManualExport = useCallback(async (project: any) => {
    if (!isProjectCompleted(project)) {
      throw new Error('Project is not completed');
    }

    const timestamp = Date.now();
    await processProjectExport(project.id, project, timestamp);
  }, [isProjectCompleted, processProjectExport]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      retryCounts.current.clear();
    };
  }, []);

  return {
    // State
    status,
    exportResults,
    error,
    
    // Actions
    handleProjectStatusChange,
    setEnabled,
    clearResults,
    getRecentResults,
    getFailedExports,
    triggerManualExport,
    
    // Configuration
    config: mergedConfig
  };
};

// Export a global event emitter for project status changes
class ProjectStatusEventEmitter {
  private listeners: Map<string, ((project: any) => void)[]> = new Map();

  emit(project: any) {
    const listeners = this.listeners.get('statusChange') || [];
    listeners.forEach(listener => listener(project));
  }

  on(event: string, listener: (project: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: (project: any) => void) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}

export const projectStatusEventEmitter = new ProjectStatusEventEmitter();

// Hook to listen for global project status changes
export const useProjectStatusEmitter = () => {
  const { handleProjectStatusChange } = useAutoExport();

  useEffect(() => {
    projectStatusEventEmitter.on('statusChange', handleProjectStatusChange);
    
    return () => {
      projectStatusEventEmitter.off('statusChange', handleProjectStatusChange);
    };
  }, [handleProjectStatusChange]);
};

// Utility function to emit project status changes from anywhere in the app
export const emitProjectStatusChange = (project: any) => {
  projectStatusEventEmitter.emit(project);
}; 