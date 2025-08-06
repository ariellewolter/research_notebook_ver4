import { EntityType } from '../types/entity.types';

// Types for inventory sync
export interface InventorySyncData {
  entities: InventoryEntity[];
  usageLogs: InventoryUsageLog[];
  reorderSettings: InventoryReorderSettings[];
  syncMetadata: InventorySyncMetadata;
}

export interface InventoryEntity {
  id: string;
  name: string;
  type: EntityType;
  stockLevel: number;
  unit: string;
  location?: string;
  supplier?: string;
  catalogNumber?: string;
  cost?: number;
  expiryDate?: string;
  tags?: string;
  description?: string;
  reorderThreshold?: number;
  reorderQuantity?: number;
  minStockLevel?: number;
  vendorInfo?: VendorInfo;
  metadata?: Record<string, any>;
  lastUpdated: string;
  lastSynced?: string;
}

export interface InventoryUsageLog {
  id: string;
  entityId: string;
  entityName: string;
  entityType: EntityType;
  quantity: number;
  unit: string;
  date: string;
  experimentId?: string;
  taskId?: string;
  protocolId?: string;
  experimentName?: string;
  taskName?: string;
  protocolName?: string;
  notes?: string;
  purpose?: string;
  userId?: string;
  userName?: string;
}

export interface InventoryReorderSettings {
  entityId: string;
  entityName: string;
  threshold: number;
  reorderQuantity: number;
  autoReorder: boolean;
  preferredVendor?: string;
  notes?: string;
  lastUpdated: string;
}

export interface VendorInfo {
  name: string;
  catalogNumber?: string;
  purchaseDate?: string;
  cost?: number;
  lotNumber?: string;
  supplierContact?: string;
  email?: string;
  phone?: string;
  website?: string;
  warrantyInfo?: string;
  returnPolicy?: string;
}

export interface InventorySyncMetadata {
  syncId: string;
  syncTimestamp: string;
  totalEntities: number;
  totalUsageLogs: number;
  totalReorderSettings: number;
  syncVersion: string;
  appVersion: string;
  deviceId?: string;
  userId?: string;
}

export interface SyncStatus {
  lastSync: string;
  syncEnabled: boolean;
  entitiesSynced: number;
  usageLogsSynced: number;
  reorderSettingsSynced: number;
  pendingChanges: number;
  lastError?: string;
  syncProgress?: number;
}

export interface ExportOptions {
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

export interface ExportJob {
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

class InventorySyncService {
  private syncStatus: SyncStatus = {
    lastSync: new Date().toISOString(),
    syncEnabled: true,
    entitiesSynced: 0,
    usageLogsSynced: 0,
    reorderSettingsSynced: 0,
    pendingChanges: 0
  };

  private exportJobs: ExportJob[] = [];

  // Get current sync status
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      // This would typically fetch from local storage or API
      return this.syncStatus;
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  }

  // Update sync status
  async updateSyncStatus(status: Partial<SyncStatus>): Promise<void> {
    try {
      this.syncStatus = { ...this.syncStatus, ...status };
      // This would typically save to local storage or API
      console.log('Sync status updated:', this.syncStatus);
    } catch (error) {
      console.error('Error updating sync status:', error);
      throw error;
    }
  }

  // Prepare inventory data for sync
  async prepareInventoryData(): Promise<InventorySyncData> {
    try {
      // This would typically fetch from the database/API
      const mockEntities: InventoryEntity[] = [
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
      ];

      const mockUsageLogs: InventoryUsageLog[] = [
        {
          id: 'usage-1',
          entityId: 'chemical-1',
          entityName: 'Sodium Chloride',
          entityType: 'chemical',
          quantity: 2,
          unit: 'g',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          experimentName: 'PCR Protocol A',
          userName: 'Dr. Smith'
        }
      ];

      const mockReorderSettings: InventoryReorderSettings[] = [
        {
          entityId: 'chemical-1',
          entityName: 'Sodium Chloride',
          threshold: 5,
          reorderQuantity: 50,
          autoReorder: false,
          preferredVendor: 'Sigma-Aldrich',
          lastUpdated: new Date().toISOString()
        }
      ];

      const syncMetadata: InventorySyncMetadata = {
        syncId: `sync-${Date.now()}`,
        syncTimestamp: new Date().toISOString(),
        totalEntities: mockEntities.length,
        totalUsageLogs: mockUsageLogs.length,
        totalReorderSettings: mockReorderSettings.length,
        syncVersion: '1.0.0',
        appVersion: '1.0.0',
        deviceId: 'device-123',
        userId: 'user-123'
      };

      return {
        entities: mockEntities,
        usageLogs: mockUsageLogs,
        reorderSettings: mockReorderSettings,
        syncMetadata
      };
    } catch (error) {
      console.error('Error preparing inventory data:', error);
      throw error;
    }
  }

  // Sync inventory data with cloud services
  async syncWithCloud(): Promise<void> {
    try {
      await this.updateSyncStatus({ syncProgress: 0 });

      // Prepare data
      const inventoryData = await this.prepareInventoryData();
      await this.updateSyncStatus({ syncProgress: 25 });

      // Simulate cloud sync process
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.updateSyncStatus({ syncProgress: 50 });

      // Update sync status with results
      await this.updateSyncStatus({
        lastSync: new Date().toISOString(),
        entitiesSynced: inventoryData.entities.length,
        usageLogsSynced: inventoryData.usageLogs.length,
        reorderSettingsSynced: inventoryData.reorderSettings.length,
        pendingChanges: 0,
        syncProgress: 100
      });

      console.log('Inventory sync completed successfully');
    } catch (error) {
      console.error('Inventory sync failed:', error);
      await this.updateSyncStatus({
        lastError: error instanceof Error ? error.message : 'Sync failed',
        syncProgress: 0
      });
      throw error;
    }
  }

  // Export inventory data
  async exportInventoryData(options: ExportOptions): Promise<ExportJob> {
    try {
      const jobId = `export-${Date.now()}`;
      const filename = this.generateFilename(options.format);
      
      // Create export job
      const newJob: ExportJob = {
        id: jobId,
        status: 'processing',
        format: options.format,
        filename,
        createdAt: new Date().toISOString()
      };

      this.exportJobs.unshift(newJob);

      // Prepare export data
      const inventoryData = await this.prepareInventoryData();
      
      // Filter data based on options
      const filteredData = this.filterExportData(inventoryData, options);
      
      // Generate file content
      const fileContent = this.generateFileContent(filteredData, options);
      
      // Create download link
      const blob = new Blob([fileContent.content], { type: fileContent.mimeType });
      const downloadUrl = URL.createObjectURL(blob);

      // Update job status
      const updatedJob: ExportJob = {
        ...newJob,
        status: 'completed',
        completedAt: new Date().toISOString(),
        fileSize: blob.size,
        downloadUrl
      };

      this.exportJobs = this.exportJobs.map(job => 
        job.id === jobId ? updatedJob : job
      );

      return updatedJob;
    } catch (error) {
      console.error('Export failed:', error);
      const failedJob: ExportJob = {
        id: `export-${Date.now()}`,
        status: 'failed',
        format: options.format,
        filename: this.generateFilename(options.format),
        createdAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Export failed'
      };
      
      this.exportJobs.unshift(failedJob);
      throw error;
    }
  }

  // Get export jobs
  async getExportJobs(): Promise<ExportJob[]> {
    return this.exportJobs;
  }

  // Delete export job
  async deleteExportJob(jobId: string): Promise<void> {
    this.exportJobs = this.exportJobs.filter(job => job.id !== jobId);
  }

  // Filter export data based on options
  private filterExportData(data: InventorySyncData, options: ExportOptions): any {
    let filteredEntities = data.entities;
    let filteredUsageLogs = data.usageLogs;

    // Filter by entity types
    if (options.entityTypes.length > 0) {
      filteredEntities = filteredEntities.filter(entity => 
        options.entityTypes.includes(entity.type)
      );
      filteredUsageLogs = filteredUsageLogs.filter(log => 
        options.entityTypes.includes(log.entityType)
      );
    }

    // Filter by date range
    if (options.dateRange.start && options.dateRange.end) {
      const startDate = new Date(options.dateRange.start);
      const endDate = new Date(options.dateRange.end);
      
      filteredUsageLogs = filteredUsageLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= startDate && logDate <= endDate;
      });
    }

    // Filter by stock status
    if (options.filters.stockStatus !== 'all') {
      filteredEntities = filteredEntities.filter(entity => {
        switch (options.filters.stockStatus) {
          case 'in-stock':
            return entity.stockLevel > (entity.reorderThreshold || 5);
          case 'low-stock':
            return entity.stockLevel > 0 && entity.stockLevel <= (entity.reorderThreshold || 5);
          case 'out-of-stock':
            return entity.stockLevel === 0;
          default:
            return true;
        }
      });
    }

    // Filter by location
    if (options.filters.location) {
      filteredEntities = filteredEntities.filter(entity => 
        entity.location === options.filters.location
      );
    }

    // Filter by vendor
    if (options.filters.vendor) {
      filteredEntities = filteredEntities.filter(entity => 
        entity.supplier === options.filters.vendor
      );
    }

    return {
      entities: filteredEntities,
      usageLogs: filteredUsageLogs,
      reorderSettings: data.reorderSettings.filter(setting => 
        filteredEntities.some(entity => entity.id === setting.entityId)
      ),
      syncMetadata: {
        ...data.syncMetadata,
        totalEntities: filteredEntities.length,
        totalUsageLogs: filteredUsageLogs.length,
        exportOptions: options
      }
    };
  }

  // Generate file content based on format
  private generateFileContent(data: any, options: ExportOptions): { content: string; mimeType: string } {
    switch (options.format) {
      case 'csv':
        return {
          content: this.generateCSV(data, options),
          mimeType: 'text/csv'
        };
      case 'json':
        return {
          content: JSON.stringify(data, null, 2),
          mimeType: 'application/json'
        };
      case 'excel':
        return {
          content: this.generateCSV(data, options),
          mimeType: 'text/csv'
        };
      default:
        throw new Error('Unsupported format');
    }
  }

  // Generate CSV content
  private generateCSV(data: any, options: ExportOptions): string {
    const { entities, usageLogs, reorderSettings, syncMetadata } = data;
    
    let csv = '';

    // Entities CSV
    if (options.includeStockLevels) {
      csv += '=== ENTITIES ===\n';
      csv += 'ID,Name,Type,Stock Level,Unit,Location,Supplier,Catalog Number,Cost,Reorder Threshold,Reorder Quantity,Last Updated\n';
      
      entities.forEach((entity: InventoryEntity) => {
        csv += `${entity.id},"${entity.name}",${entity.type},${entity.stockLevel},${entity.unit},"${entity.location || ''}","${entity.supplier || ''}","${entity.catalogNumber || ''}",${entity.cost || ''},${entity.reorderThreshold || ''},${entity.reorderQuantity || ''},"${entity.lastUpdated}"\n`;
      });
      csv += '\n';
    }

    // Usage Logs CSV
    if (options.includeUsageLogs) {
      csv += '=== USAGE LOGS ===\n';
      csv += 'ID,Entity ID,Entity Name,Quantity,Unit,Date,Experiment,User\n';
      
      usageLogs.forEach((log: InventoryUsageLog) => {
        csv += `${log.id},${log.entityId},"${log.entityName}",${log.quantity},${log.unit},"${log.date}","${log.experimentName || ''}","${log.userName || ''}"\n`;
      });
      csv += '\n';
    }

    // Reorder Settings CSV
    if (options.includeReorderSettings) {
      csv += '=== REORDER SETTINGS ===\n';
      csv += 'Entity ID,Entity Name,Threshold,Reorder Quantity,Auto Reorder,Preferred Vendor,Notes,Last Updated\n';
      
      reorderSettings.forEach((setting: InventoryReorderSettings) => {
        csv += `${setting.entityId},"${setting.entityName}",${setting.threshold},${setting.reorderQuantity},${setting.autoReorder},"${setting.preferredVendor || ''}","${setting.notes || ''}","${setting.lastUpdated}"\n`;
      });
      csv += '\n';
    }

    // Export Metadata
    csv += '=== EXPORT METADATA ===\n';
    csv += `Exported At,${syncMetadata.syncTimestamp}\n`;
    csv += `Total Entities,${syncMetadata.totalEntities}\n`;
    csv += `Total Usage Logs,${syncMetadata.totalUsageLogs}\n`;
    csv += `Sync Version,${syncMetadata.syncVersion}\n`;
    csv += `App Version,${syncMetadata.appVersion}\n`;

    return csv;
  }

  // Generate filename
  private generateFilename(format: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    return `inventory-export-${timestamp}.${format}`;
  }

  // Integrate with existing cloud sync system
  async integrateWithCloudSync(): Promise<void> {
    try {
      // This would integrate with the existing cloud sync system
      // For now, we'll just log the integration
      console.log('Integrating inventory data with cloud sync system...');
      
      // Simulate integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Inventory data successfully integrated with cloud sync system');
    } catch (error) {
      console.error('Failed to integrate with cloud sync system:', error);
      throw error;
    }
  }

  // Prepare data for LIMS integration
  async prepareForLIMSIntegration(): Promise<any> {
    try {
      const inventoryData = await this.prepareInventoryData();
      
      // Transform data for LIMS format
      const limsData = {
        inventory: {
          chemicals: inventoryData.entities.filter(e => e.type === 'chemical'),
          reagents: inventoryData.entities.filter(e => e.type === 'reagent'),
          equipment: inventoryData.entities.filter(e => e.type === 'equipment'),
          genes: inventoryData.entities.filter(e => e.type === 'gene')
        },
        usage: inventoryData.usageLogs,
        settings: inventoryData.reorderSettings,
        metadata: {
          ...inventoryData.syncMetadata,
          limsCompatible: true,
          exportFormat: 'lims-standard'
        }
      };

      return limsData;
    } catch (error) {
      console.error('Error preparing data for LIMS integration:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const inventorySyncService = new InventorySyncService(); 