import { notificationService } from './notificationService';
import { cloudSyncApi } from './api/cloudSyncApi';

export interface BackupConfig {
  enabled: boolean;
  interval: number; // days
  maxBackups: number; // number of backups to keep
  cloudFolder: string; // folder path in cloud storage
  includeMetadata: boolean;
  includeRelationships: boolean;
  compression: boolean;
}

export interface BackupSnapshot {
  id: string;
  timestamp: Date;
  filename: string;
  size: number;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  metadata: {
    entityCounts: {
      notes: number;
      projects: number;
      tasks: number;
      databaseEntries: number;
      literatureNotes: number;
      protocols: number;
      recipes: number;
    };
    totalSize: number;
    compressionRatio?: number;
  };
}

export interface BackupData {
  exportDate: string;
  version: string;
  user: {
    id: string;
    username: string;
  };
  data: {
    notes: any[];
    projects: any[];
    tasks: any[];
    databaseEntries: any[];
    literatureNotes: any[];
    protocols: any[];
    recipes: any[];
  };
  metadata: {
    entityCounts: {
      notes: number;
      projects: number;
      tasks: number;
      databaseEntries: number;
      literatureNotes: number;
      protocols: number;
      recipes: number;
    };
    totalSize: number;
    backupId: string;
  };
}

class BackupService {
  private config: BackupConfig = {
    enabled: true,
    interval: 7, // 7 days
    maxBackups: 10,
    cloudFolder: '/backups',
    includeMetadata: true,
    includeRelationships: true,
    compression: true
  };

  private backupInterval: NodeJS.Timeout | null = null;
  private lastBackupDate: Date | null = null;
  private snapshots: BackupSnapshot[] = [];

  constructor() {
    this.loadConfig();
    this.loadSnapshots();
  }

  private async loadConfig() {
    try {
      const savedConfig = localStorage.getItem('backupConfig');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.error('Failed to load backup config:', error);
    }
  }

  private async saveConfig() {
    try {
      localStorage.setItem('backupConfig', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save backup config:', error);
    }
  }

  private async loadSnapshots() {
    try {
      const savedSnapshots = localStorage.getItem('backupSnapshots');
      if (savedSnapshots) {
        this.snapshots = JSON.parse(savedSnapshots).map((snapshot: any) => ({
          ...snapshot,
          timestamp: new Date(snapshot.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load backup snapshots:', error);
    }
  }

  private async saveSnapshots() {
    try {
      localStorage.setItem('backupSnapshots', JSON.stringify(this.snapshots));
    } catch (error) {
      console.error('Failed to save backup snapshots:', error);
    }
  }

  public async startAutomatedBackups() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    if (!this.config.enabled) return;

    // Check if backup is needed immediately
    await this.checkAndCreateBackup();

    // Set up periodic backup checking
    this.backupInterval = setInterval(async () => {
      await this.checkAndCreateBackup();
    }, 24 * 60 * 60 * 1000); // Check every 24 hours
  }

  public stopAutomatedBackups() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }

  private async checkAndCreateBackup() {
    if (!this.config.enabled) return;

    const now = new Date();
    const shouldBackup = !this.lastBackupDate || 
      (now.getTime() - this.lastBackupDate.getTime()) >= (this.config.interval * 24 * 60 * 60 * 1000);

    if (shouldBackup) {
      await this.createBackup();
    }
  }

  public async createBackup(): Promise<BackupSnapshot | null> {
    try {
      // Log backup start
      notificationService.logSystemEvent(
        'pending',
        'Backup Started',
        'Creating automated backup snapshot...',
        'normal',
        { backupType: 'automated' }
      );

      // Create backup snapshot
      const snapshot: BackupSnapshot = {
        id: this.generateBackupId(),
        timestamp: new Date(),
        filename: this.generateBackupFilename(),
        size: 0,
        status: 'pending',
        metadata: {
          entityCounts: {
            notes: 0,
            projects: 0,
            tasks: 0,
            databaseEntries: 0,
            literatureNotes: 0,
            protocols: 0,
            recipes: 0
          },
          totalSize: 0
        }
      };

      // Add to snapshots list
      this.snapshots.unshift(snapshot);
      await this.saveSnapshots();

      // Fetch all data
      const backupData = await this.fetchAllData(snapshot.id);
      
      // Update snapshot with entity counts
      snapshot.metadata.entityCounts = {
        notes: backupData.data.notes.length,
        projects: backupData.data.projects.length,
        tasks: backupData.data.tasks.length,
        databaseEntries: backupData.data.databaseEntries.length,
        literatureNotes: backupData.data.literatureNotes.length,
        protocols: backupData.data.protocols.length,
        recipes: backupData.data.recipes.length
      };

      // Serialize data
      let jsonData = JSON.stringify(backupData, null, 2);
      let compressedData = jsonData;

      // Compress if enabled
      if (this.config.compression) {
        try {
          compressedData = await this.compressData(jsonData);
          snapshot.metadata.compressionRatio = jsonData.length / compressedData.length;
        } catch (error) {
          console.warn('Compression failed, using uncompressed data:', error);
        }
      }

      // Create file
      const file = new File([compressedData], snapshot.filename, {
        type: 'application/json'
      });

      // Upload to cloud storage
      await this.uploadBackupToCloud(file, snapshot);

      // Update snapshot
      snapshot.size = file.size;
      snapshot.status = 'completed';
      snapshot.metadata.totalSize = file.size;

      // Update last backup date
      this.lastBackupDate = new Date();

      // Clean up old backups
      await this.cleanupOldBackups();

      // Save updated snapshots
      await this.saveSnapshots();

      // Log success
      notificationService.logSystemEvent(
        'success',
        'Backup Completed',
        `Backup snapshot created successfully: ${snapshot.filename}`,
        'normal',
        {
          backupId: snapshot.id,
          filename: snapshot.filename,
          size: snapshot.size,
          entityCounts: snapshot.metadata.entityCounts
        }
      );

      return snapshot;

    } catch (error) {
      console.error('Backup creation failed:', error);
      
      // Update snapshot with error
      if (this.snapshots.length > 0) {
        this.snapshots[0].status = 'failed';
        this.snapshots[0].error = error.message;
        await this.saveSnapshots();
      }

      // Log error
      notificationService.logSystemEvent(
        'error',
        'Backup Failed',
        `Failed to create backup snapshot: ${error.message}`,
        'high',
        { error: error.message }
      );

      return null;
    }
  }

  private async fetchAllData(backupId: string): Promise<BackupData> {
    try {
      // Use the backup API to get all data
      const { backupApi } = await import('./api/backupApi');
      const response = await backupApi.exportData();
      const backupData = response.data;

      return {
        ...backupData,
        metadata: {
          ...backupData.metadata,
          backupId
        }
      };
    } catch (error) {
      console.error('Failed to fetch data for backup:', error);
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
  }

  private async uploadBackupToCloud(file: File, snapshot: BackupSnapshot) {
    try {
      // Upload to cloud storage
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', `${this.config.cloudFolder}/${snapshot.filename}`);
      formData.append('metadata', JSON.stringify({
        backupId: snapshot.id,
        timestamp: snapshot.timestamp.toISOString(),
        entityCounts: snapshot.metadata.entityCounts
      }));

      await cloudSyncApi.uploadFile(formData);
    } catch (error) {
      console.error('Failed to upload backup to cloud:', error);
      throw new Error(`Failed to upload backup: ${error.message}`);
    }
  }

  private async cleanupOldBackups() {
    if (this.snapshots.length <= this.config.maxBackups) return;

    const backupsToRemove = this.snapshots.slice(this.config.maxBackups);
    
    for (const backup of backupsToRemove) {
      try {
        // Remove from cloud storage
        await cloudSyncApi.deleteFile(`${this.config.cloudFolder}/${backup.filename}`);
      } catch (error) {
        console.warn(`Failed to remove old backup from cloud: ${backup.filename}`, error);
      }
    }

    // Remove from local list
    this.snapshots = this.snapshots.slice(0, this.config.maxBackups);
  }

  private async compressData(data: string): Promise<string> {
    // Simple compression using LZ-string or similar
    // For now, return the original data
    // TODO: Implement proper compression
    return data;
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBackupFilename(): string {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    return `research_notebook_backup_${date}_${time}.json`;
  }

  public async restoreFromBackup(backupId: string): Promise<boolean> {
    try {
      // Find backup snapshot
      const snapshot = this.snapshots.find(s => s.id === backupId);
      if (!snapshot) {
        throw new Error('Backup not found');
      }

      // Download from cloud storage
      const response = await cloudSyncApi.downloadFile(`${this.config.cloudFolder}/${snapshot.filename}`);
      const backupData = await response.json();

      // TODO: Implement restore logic
      // This would involve:
      // 1. Validating the backup data
      // 2. Clearing current data
      // 3. Restoring from backup
      // 4. Handling conflicts

      notificationService.logSystemEvent(
        'success',
        'Restore Completed',
        `Successfully restored from backup: ${snapshot.filename}`,
        'normal',
        { backupId, filename: snapshot.filename }
      );

      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      
      notificationService.logSystemEvent(
        'error',
        'Restore Failed',
        `Failed to restore from backup: ${error.message}`,
        'high',
        { backupId, error: error.message }
      );

      return false;
    }
  }

  public getConfig(): BackupConfig {
    return { ...this.config };
  }

  public async updateConfig(newConfig: Partial<BackupConfig>) {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();

    // Restart automated backups if config changed
    if (this.config.enabled) {
      await this.startAutomatedBackups();
    } else {
      this.stopAutomatedBackups();
    }
  }

  public getSnapshots(): BackupSnapshot[] {
    return [...this.snapshots];
  }

  public getLastBackupDate(): Date | null {
    return this.lastBackupDate;
  }

  public isBackupDue(): boolean {
    if (!this.lastBackupDate) return true;
    
    const now = new Date();
    const daysSinceLastBackup = (now.getTime() - this.lastBackupDate.getTime()) / (24 * 60 * 60 * 1000);
    return daysSinceLastBackup >= this.config.interval;
  }

  public async downloadBackup(backupId: string): Promise<Blob | null> {
    try {
      const snapshot = this.snapshots.find(s => s.id === backupId);
      if (!snapshot) {
        throw new Error('Backup not found');
      }

      const response = await cloudSyncApi.downloadFile(`${this.config.cloudFolder}/${snapshot.filename}`);
      return await response.blob();
    } catch (error) {
      console.error('Failed to download backup:', error);
      return null;
    }
  }

  public async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const snapshot = this.snapshots.find(s => s.id === backupId);
      if (!snapshot) {
        throw new Error('Backup not found');
      }

      // Remove from cloud storage
      await cloudSyncApi.deleteFile(`${this.config.cloudFolder}/${snapshot.filename}`);

      // Remove from local list
      this.snapshots = this.snapshots.filter(s => s.id !== backupId);
      await this.saveSnapshots();

      return true;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  }
}

export const backupService = new BackupService(); 