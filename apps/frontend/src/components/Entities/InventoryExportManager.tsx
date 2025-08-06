import React, { useState, useCallback } from 'react';
import { EntityType } from '../../types/entity.types';

interface InventoryExportManagerProps {
  className?: string;
}

interface ExportOptions {
  format: 'csv' | 'json' | 'excel';
  includeStockLevels: boolean;
  includeUsageLogs: boolean;
  includeReorderSettings: boolean;
  includeVendorInfo: boolean;
  includeLocationInfo: boolean;
  includeMetadata: boolean;
  dateRange: {
    start: string;
    end: string;
  };
  entityTypes: EntityType[];
  filters: {
    stockStatus: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
    location?: string;
    vendor?: string;
  };
}

interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: string;
  filename: string;
  createdAt: string;
  completedAt?: string;
  fileSize?: number;
  downloadUrl?: string;
  error?: string;
}

interface SyncStatus {
  lastSync: string;
  syncEnabled: boolean;
  entitiesSynced: number;
  usageLogsSynced: number;
  pendingChanges: number;
  lastError?: string;
}

export const InventoryExportManager: React.FC<InventoryExportManagerProps> = ({
  className = ''
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeStockLevels: true,
    includeUsageLogs: true,
    includeReorderSettings: true,
    includeVendorInfo: true,
    includeLocationInfo: true,
    includeMetadata: true,
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      end: new Date().toISOString().split('T')[0]
    },
    entityTypes: ['chemical', 'gene', 'reagent', 'equipment'],
    filters: {
      stockStatus: 'all'
    }
  });

  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    syncEnabled: true,
    entitiesSynced: 156,
    usageLogsSynced: 1247,
    pendingChanges: 3
  });

  const [showExportModal, setShowExportModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Generate export filename
  const generateFilename = useCallback((format: string) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    return `inventory-export-${timestamp}.${format}`;
  }, []);

  // Export inventory data
  const exportInventoryData = useCallback(async () => {
    setProcessing(true);
    try {
      const jobId = `export-${Date.now()}`;
      const filename = generateFilename(exportOptions.format);
      
      // Create export job
      const newJob: ExportJob = {
        id: jobId,
        status: 'processing',
        format: exportOptions.format,
        filename,
        createdAt: new Date().toISOString()
      };

      setExportJobs(prev => [newJob, ...prev]);

      // Simulate export processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock export data
      const mockExportData = {
        entities: [
          {
            id: 'chemical-1',
            name: 'Sodium Chloride',
            type: 'chemical',
            stockLevel: 3,
            unit: 'g',
            location: 'Shelf A1',
            supplier: 'Sigma-Aldrich',
            catalogNumber: 'S9888',
            cost: 45.99,
            reorderThreshold: 5,
            reorderQuantity: 50,
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'reagent-1',
            name: 'Taq Polymerase',
            type: 'reagent',
            stockLevel: 0,
            unit: 'units',
            location: 'Freezer A',
            supplier: 'New England Biolabs',
            catalogNumber: 'M0273S',
            cost: 199.99,
            reorderThreshold: 10,
            reorderQuantity: 100,
            lastUpdated: new Date().toISOString()
          }
        ],
        usageLogs: [
          {
            id: 'usage-1',
            entityId: 'chemical-1',
            entityName: 'Sodium Chloride',
            quantity: 2,
            unit: 'g',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            experiment: 'PCR Protocol A',
            user: 'Dr. Smith'
          }
        ],
        exportMetadata: {
          exportedAt: new Date().toISOString(),
          totalEntities: 2,
          totalUsageLogs: 1,
          dateRange: exportOptions.dateRange,
          filters: exportOptions.filters
        }
      };

      // Generate file based on format
      let fileContent: string;
      let mimeType: string;

      switch (exportOptions.format) {
        case 'csv':
          fileContent = generateCSV(mockExportData);
          mimeType = 'text/csv';
          break;
        case 'json':
          fileContent = JSON.stringify(mockExportData, null, 2);
          mimeType = 'application/json';
          break;
        case 'excel':
          // For Excel, we'll create a CSV that can be opened in Excel
          fileContent = generateCSV(mockExportData);
          mimeType = 'text/csv';
          break;
        default:
          throw new Error('Unsupported format');
      }

      // Create download link
      const blob = new Blob([fileContent], { type: mimeType });
      const downloadUrl = URL.createObjectURL(blob);

      // Update job status
      setExportJobs(prev => prev.map(job => 
        job.id === jobId ? {
          ...job,
          status: 'completed',
          completedAt: new Date().toISOString(),
          fileSize: blob.size,
          downloadUrl
        } : job
      ));

      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
      setExportJobs(prev => prev.map(job => 
        job.status === 'processing' ? {
          ...job,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Export failed'
        } : job
      ));
    } finally {
      setProcessing(false);
    }
  }, [exportOptions, generateFilename]);

  // Generate CSV content
  const generateCSV = useCallback((data: any) => {
    const { entities, usageLogs, exportMetadata } = data;
    
    let csv = '';

    // Entities CSV
    if (exportOptions.includeStockLevels) {
      csv += '=== ENTITIES ===\n';
      csv += 'ID,Name,Type,Stock Level,Unit,Location,Supplier,Catalog Number,Cost,Reorder Threshold,Reorder Quantity,Last Updated\n';
      
      entities.forEach((entity: any) => {
        csv += `${entity.id},"${entity.name}",${entity.type},${entity.stockLevel},${entity.unit},"${entity.location || ''}","${entity.supplier || ''}","${entity.catalogNumber || ''}",${entity.cost || ''},${entity.reorderThreshold || ''},${entity.reorderQuantity || ''},"${entity.lastUpdated}"\n`;
      });
      csv += '\n';
    }

    // Usage Logs CSV
    if (exportOptions.includeUsageLogs) {
      csv += '=== USAGE LOGS ===\n';
      csv += 'ID,Entity ID,Entity Name,Quantity,Unit,Date,Experiment,User\n';
      
      usageLogs.forEach((log: any) => {
        csv += `${log.id},${log.entityId},"${log.entityName}",${log.quantity},${log.unit},"${log.date}","${log.experiment || ''}","${log.user || ''}"\n`;
      });
      csv += '\n';
    }

    // Export Metadata
    csv += '=== EXPORT METADATA ===\n';
    csv += `Exported At,${exportMetadata.exportedAt}\n`;
    csv += `Total Entities,${exportMetadata.totalEntities}\n`;
    csv += `Total Usage Logs,${exportMetadata.totalUsageLogs}\n`;
    csv += `Date Range Start,${exportMetadata.dateRange.start}\n`;
    csv += `Date Range End,${exportMetadata.dateRange.end}\n`;

    return csv;
  }, [exportOptions]);

  // Sync with cloud services
  const syncWithCloud = useCallback(async () => {
    setProcessing(true);
    try {
      // Simulate cloud sync
      await new Promise(resolve => setTimeout(resolve, 3000));

      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date().toISOString(),
        entitiesSynced: prev.entitiesSynced + 5,
        usageLogsSynced: prev.usageLogsSynced + 12,
        pendingChanges: 0
      }));

      setShowSyncModal(false);
    } catch (error) {
      console.error('Cloud sync failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        lastError: error instanceof Error ? error.message : 'Sync failed'
      }));
    } finally {
      setProcessing(false);
    }
  }, []);

  // Download completed export
  const downloadExport = useCallback((job: ExportJob) => {
    if (job.downloadUrl) {
      const link = document.createElement('a');
      link.href = job.downloadUrl;
      link.download = job.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  // Delete export job
  const deleteExportJob = useCallback((jobId: string) => {
    setExportJobs(prev => prev.filter(job => job.id !== jobId));
  }, []);

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'processing':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '⏸️';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Inventory Export & Sync
          </h3>
          <p className="text-sm text-gray-500">
            Export inventory data and sync with cloud services
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSyncModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Cloud Sync
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Export Data
          </button>
        </div>
      </div>

      {/* Sync Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Cloud Sync Status</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Last Sync</p>
                <p className="text-lg font-semibold text-blue-900">
                  {new Date(syncStatus.lastSync).toLocaleString()}
                </p>
              </div>
              <span className="text-lg">🔄</span>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Entities Synced</p>
                <p className="text-lg font-semibold text-green-900">{syncStatus.entitiesSynced}</p>
              </div>
              <span className="text-lg">📦</span>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Usage Logs Synced</p>
                <p className="text-lg font-semibold text-purple-900">{syncStatus.usageLogsSynced}</p>
              </div>
              <span className="text-lg">📊</span>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Pending Changes</p>
                <p className="text-lg font-semibold text-orange-900">{syncStatus.pendingChanges}</p>
              </div>
              <span className="text-lg">⏳</span>
            </div>
          </div>
        </div>

        {syncStatus.lastError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <span className="font-medium">Last Error:</span> {syncStatus.lastError}
            </p>
          </div>
        )}
      </div>

      {/* Export Jobs */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Recent Exports</h4>
        
        {exportJobs.length > 0 ? (
          <div className="space-y-3">
            {exportJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getStatusIcon(job.status)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{job.filename}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(job.createdAt).toLocaleString()} • {job.format.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(job.status)}`}>
                    {job.status.toUpperCase()}
                  </span>
                  
                  {job.status === 'completed' && job.downloadUrl && (
                    <button
                      onClick={() => downloadExport(job)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Download
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteExportJob(job.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No export jobs yet.</p>
            <p className="text-sm">Create your first export to see it here.</p>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-2xl max-w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Export Inventory Data
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Export Format</h4>
                <div className="grid grid-cols-3 gap-3">
                  {(['csv', 'json', 'excel'] as const).map((format) => (
                    <label
                      key={format}
                      className={`p-3 border rounded-lg cursor-pointer ${
                        exportOptions.format === format
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={format}
                        checked={exportOptions.format === format}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="text-lg mb-1">
                          {format === 'csv' ? '📄' : format === 'json' ? '🔧' : '📊'}
                        </div>
                        <div className="font-medium text-gray-900">{format.toUpperCase()}</div>
                        <div className="text-xs text-gray-500">
                          {format === 'csv' ? 'Comma separated values' :
                           format === 'json' ? 'Structured data format' :
                           'Excel compatible'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Data Selection */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Include Data</h4>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeStockLevels}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeStockLevels: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Stock Levels</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeUsageLogs}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeUsageLogs: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Usage Logs</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeReorderSettings}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeReorderSettings: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Reorder Settings</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeVendorInfo}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeVendorInfo: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Vendor Information</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeLocationInfo}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeLocationInfo: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Location Information</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeMetadata}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Export Metadata</span>
                  </label>
                </div>
              </div>

              {/* Date Range */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Date Range</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={exportOptions.dateRange.start}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, start: e.target.value } 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={exportOptions.dateRange.end}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, end: e.target.value } 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Entity Types */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Entity Types</h4>
                <div className="grid grid-cols-2 gap-3">
                  {(['chemical', 'gene', 'reagent', 'equipment'] as EntityType[]).map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.entityTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExportOptions(prev => ({ 
                              ...prev, 
                              entityTypes: [...prev.entityTypes, type] 
                            }));
                          } else {
                            setExportOptions(prev => ({ 
                              ...prev, 
                              entityTypes: prev.entityTypes.filter(t => t !== type) 
                            }));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{type}s</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={exportInventoryData}
                disabled={processing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {processing ? 'Exporting...' : 'Export Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Cloud Sync
              </h3>
              <button
                onClick={() => setShowSyncModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">☁️</span>
                  <h4 className="font-medium text-blue-900">Sync with Cloud Services</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Upload inventory data to configured cloud storage services for backup and cross-device access.
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Entities to sync:</span> {syncStatus.entitiesSynced}</p>
                <p><span className="font-medium">Usage logs to sync:</span> {syncStatus.usageLogsSynced}</p>
                <p><span className="font-medium">Pending changes:</span> {syncStatus.pendingChanges}</p>
              </div>

              {syncStatus.lastError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <span className="font-medium">Last Error:</span> {syncStatus.lastError}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowSyncModal(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={syncWithCloud}
                disabled={processing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {processing ? 'Syncing...' : 'Start Sync'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 