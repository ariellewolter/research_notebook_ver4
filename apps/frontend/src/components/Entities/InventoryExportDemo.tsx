import React, { useState, useEffect } from 'react';
import { InventoryExportManager } from './InventoryExportManager';
import { inventorySyncService, ExportOptions, SyncStatus, ExportJob } from '../../services/inventorySyncService';

interface InventoryExportDemoProps {
  className?: string;
}

export const InventoryExportDemo: React.FC<InventoryExportDemoProps> = ({
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'demo' | 'export' | 'sync' | 'lims'>('demo');
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [limsData, setLimsData] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [status, jobs] = await Promise.all([
        inventorySyncService.getSyncStatus(),
        inventorySyncService.getExportJobs()
      ]);
      setSyncStatus(status);
      setExportJobs(jobs);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleSyncWithCloud = async () => {
    try {
      await inventorySyncService.syncWithCloud();
      const newStatus = await inventorySyncService.getSyncStatus();
      setSyncStatus(newStatus);
    } catch (error) {
      console.error('Cloud sync failed:', error);
    }
  };

  const handleExportData = async (options: ExportOptions) => {
    try {
      const job = await inventorySyncService.exportInventoryData(options);
      setExportJobs(prev => [job, ...prev]);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handlePrepareLIMSData = async () => {
    try {
      const data = await inventorySyncService.prepareForLIMSIntegration();
      setLimsData(data);
    } catch (error) {
      console.error('LIMS data preparation failed:', error);
    }
  };

  return (
    <div className={`max-w-7xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <span className="text-2xl">📤</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Export & Sync System
          </h1>
          <p className="text-gray-500">
            Comprehensive export and synchronization for inventory data
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('demo')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'demo'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🎯 System Overview
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📤 Export Manager
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sync'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ☁️ Cloud Sync
          </button>
          <button
            onClick={() => setActiveTab('lims')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'lims'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔬 LIMS Integration
          </button>
        </nav>
      </div>

      {/* System Overview Tab */}
      {activeTab === 'demo' && (
        <div className="space-y-6">
          {/* Feature Overview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">
              Export & Sync System Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-lg">📤</span>
                </div>
                <h4 className="font-medium text-blue-900 mb-2">Multi-Format Export</h4>
                <p className="text-sm text-blue-700">
                  Export inventory data in CSV, JSON, and Excel formats with customizable options
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-lg">☁️</span>
                </div>
                <h4 className="font-medium text-blue-900 mb-2">Cloud Sync</h4>
                <p className="text-sm text-blue-700">
                  Synchronize inventory data with cloud services for backup and cross-device access
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-lg">🔬</span>
                </div>
                <h4 className="font-medium text-blue-900 mb-2">LIMS Integration</h4>
                <p className="text-sm text-blue-700">
                  Prepare data in LIMS-compatible formats for laboratory information management systems
                </p>
              </div>
            </div>
          </div>

          {/* Export Formats */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Supported Export Formats
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">📄</span>
                  <h4 className="font-medium text-gray-900">CSV Format</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Comma-separated values format for easy import into spreadsheet applications
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Compatible with Excel, Google Sheets</li>
                  <li>• Human-readable format</li>
                  <li>• Lightweight file size</li>
                </ul>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">🔧</span>
                  <h4 className="font-medium text-gray-900">JSON Format</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Structured data format for programmatic access and API integration
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Machine-readable format</li>
                  <li>• Preserves data structure</li>
                  <li>• API-friendly</li>
                </ul>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">📊</span>
                  <h4 className="font-medium text-gray-900">Excel Format</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Excel-compatible format with multiple sheets and formatting
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Native Excel support</li>
                  <li>• Multiple data sheets</li>
                  <li>• Professional formatting</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Types */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Exportable Data Types
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">📦</span>
                  <h4 className="font-medium text-green-900">Stock Levels</h4>
                </div>
                <p className="text-sm text-green-700">
                  Current inventory levels, units, and stock status
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">📊</span>
                  <h4 className="font-medium text-blue-900">Usage Logs</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Detailed usage history and consumption tracking
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">⚙️</span>
                  <h4 className="font-medium text-purple-900">Reorder Settings</h4>
                </div>
                <p className="text-sm text-purple-700">
                  Thresholds, quantities, and vendor preferences
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">🏢</span>
                  <h4 className="font-medium text-orange-900">Vendor Info</h4>
                </div>
                <p className="text-sm text-orange-700">
                  Supplier details, catalog numbers, and contact info
                </p>
              </div>
            </div>
          </div>

          {/* Sync Status Overview */}
          {syncStatus && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Current Sync Status
              </h3>
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
                      <p className="text-sm text-purple-600">Usage Logs</p>
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
            </div>
          )}

          {/* Recent Exports */}
          {exportJobs.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Recent Exports
              </h3>
              <div className="space-y-3">
                {exportJobs.slice(0, 3).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">
                        {job.status === 'completed' ? '✅' : 
                         job.status === 'processing' ? '⏳' : '❌'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{job.filename}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(job.createdAt).toLocaleString()} • {job.format.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      job.status === 'completed' ? 'text-green-600 bg-green-100' :
                      job.status === 'processing' ? 'text-blue-600 bg-blue-100' :
                      'text-red-600 bg-red-100'
                    }`}>
                      {job.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export Manager Tab */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <InventoryExportManager />
        </div>
      )}

      {/* Cloud Sync Tab */}
      {activeTab === 'sync' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Cloud Sync Management
            </h3>
            
            {syncStatus && (
              <div className="space-y-6">
                {/* Sync Status */}
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
                        <p className="text-sm text-purple-600">Usage Logs</p>
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

                {/* Sync Progress */}
                {syncStatus.syncProgress !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Sync Progress</span>
                      <span className="text-sm text-gray-500">{syncStatus.syncProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${syncStatus.syncProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {syncStatus.lastError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">❌</span>
                      <h4 className="font-medium text-red-900">Last Sync Error</h4>
                    </div>
                    <p className="text-sm text-red-700">{syncStatus.lastError}</p>
                  </div>
                )}

                {/* Sync Actions */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSyncWithCloud}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                  >
                    Sync Now
                  </button>
                  <button
                    onClick={() => inventorySyncService.integrateWithCloudSync()}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                  >
                    Integrate with Cloud Sync
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIMS Integration Tab */}
      {activeTab === 'lims' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              LIMS Integration
            </h3>
            
            <div className="space-y-6">
              {/* LIMS Overview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">🔬</span>
                  <h4 className="font-medium text-blue-900">Laboratory Information Management System</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Prepare inventory data in LIMS-compatible formats for seamless integration with laboratory management systems.
                </p>
              </div>

              {/* LIMS Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">📋</span>
                    <h4 className="font-medium text-gray-900">Standardized Format</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Data formatted according to LIMS industry standards
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">🔗</span>
                    <h4 className="font-medium text-gray-900">API Ready</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Structured data ready for API integration
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">📊</span>
                    <h4 className="font-medium text-gray-900">Comprehensive Data</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Complete inventory and usage data included
                  </p>
                </div>
              </div>

              {/* Prepare LIMS Data */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Prepare LIMS Data</h4>
                    <p className="text-sm text-gray-600">
                      Generate LIMS-compatible data structure for integration
                    </p>
                  </div>
                  <button
                    onClick={handlePrepareLIMSData}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Generate LIMS Data
                  </button>
                </div>
              </div>

              {/* LIMS Data Preview */}
              {limsData && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">LIMS Data Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-600">Chemicals</p>
                      <p className="text-lg font-semibold text-green-900">{limsData.inventory.chemicals.length}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-600">Reagents</p>
                      <p className="text-lg font-semibold text-blue-900">{limsData.inventory.reagents.length}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-sm text-purple-600">Equipment</p>
                      <p className="text-lg font-semibold text-purple-900">{limsData.inventory.equipment.length}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-sm text-orange-600">Usage Records</p>
                      <p className="text-lg font-semibold text-orange-900">{limsData.usage.length}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Metadata:</span> {limsData.metadata.syncVersion} • 
                      LIMS Compatible: {limsData.metadata.limsCompatible ? 'Yes' : 'No'} • 
                      Export Format: {limsData.metadata.exportFormat}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 