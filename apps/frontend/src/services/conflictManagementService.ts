import { notificationService } from './notificationService';
import { entityCloudSyncApi } from './api/entityCloudSyncApi';

export interface SyncConflict {
  id: string;
  entityType: 'note' | 'project' | 'pdf';
  entityId: string;
  entityTitle: string;
  cloudService: string;
  localVersion: {
    content: string;
    lastModified: string;
    size?: number;
  };
  cloudVersion: {
    content: string;
    lastModified: string;
    size?: number;
  };
  conflictType: 'content' | 'metadata' | 'deletion';
  detectedAt: string;
}

export interface ConflictResolution {
  action: 'keep-local' | 'keep-cloud' | 'merge' | 'skip';
  mergedContent?: string;
  note?: string;
}

class ConflictManagementService {
  private conflicts: SyncConflict[] = [];
  private listeners: Array<(conflicts: SyncConflict[]) => void> = [];

  /**
   * Detect conflicts between local and cloud versions
   */
  async detectConflicts(
    entityType: 'note' | 'project' | 'pdf',
    entityId: string,
    localContent: string,
    cloudContent: string,
    cloudService: string,
    entityTitle: string
  ): Promise<SyncConflict | null> {
    try {
      // Simple conflict detection based on content differences
      if (localContent !== cloudContent) {
        const conflict: SyncConflict = {
          id: this.generateId(),
          entityType,
          entityId,
          entityTitle,
          cloudService,
          localVersion: {
            content: localContent,
            lastModified: new Date().toISOString(),
            size: new Blob([localContent]).size
          },
          cloudVersion: {
            content: cloudContent,
            lastModified: new Date().toISOString(),
            size: new Blob([cloudContent]).size
          },
          conflictType: 'content',
          detectedAt: new Date().toISOString()
        };

        this.conflicts.push(conflict);
        this.notifyListeners();

        // Log conflict to notifications
        notificationService.logSyncConflict(
          entityType,
          entityTitle,
          cloudService,
          'content',
          {
            entityId,
            detectedAt: conflict.detectedAt
          }
        );

        return conflict;
      }

      return null;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      return null;
    }
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution
  ): Promise<boolean> {
    try {
      const conflict = this.conflicts.find(c => c.id === conflictId);
      if (!conflict) {
        throw new Error('Conflict not found');
      }

      // Update entity sync status based on resolution
      let newContent: string | undefined;
      let newStatus: 'synced' | 'error' = 'synced';

      switch (resolution.action) {
        case 'keep-local':
          newContent = conflict.localVersion.content;
          break;
        case 'keep-cloud':
          newContent = conflict.cloudVersion.content;
          break;
        case 'merge':
          newContent = resolution.mergedContent || conflict.localVersion.content;
          break;
        case 'skip':
          newStatus = 'error';
          break;
      }

      // Update entity in database
      if (newContent && resolution.action !== 'skip') {
        await entityCloudSyncApi.updateSyncStatus(
          conflict.entityType,
          conflict.entityId,
          newStatus,
          new Date().toISOString()
        );
      }

      // Remove conflict from list
      this.conflicts = this.conflicts.filter(c => c.id !== conflictId);
      this.notifyListeners();

      // Log resolution to notifications
      const actionLabels = {
        'keep-local': 'Kept Local Version',
        'keep-cloud': 'Used Cloud Version',
        'merge': 'Merged Versions',
        'skip': 'Skipped Conflict'
      };

      notificationService.logSyncConflictResolved(
        conflict.entityType,
        conflict.entityTitle,
        conflict.cloudService,
        actionLabels[resolution.action],
        {
          entityId: conflict.entityId,
          resolution: resolution.action,
          note: resolution.note
        }
      );

      return true;
    } catch (error) {
      console.error('Error resolving conflict:', error);
      return false;
    }
  }

  /**
   * Get all active conflicts
   */
  getActiveConflicts(): SyncConflict[] {
    return [...this.conflicts];
  }

  /**
   * Get conflicts for a specific entity
   */
  getConflictsForEntity(entityId: string): SyncConflict[] {
    return this.conflicts.filter(c => c.entityId === entityId);
  }

  /**
   * Get conflicts by type
   */
  getConflictsByType(conflictType: string): SyncConflict[] {
    return this.conflicts.filter(c => c.conflictType === conflictType);
  }

  /**
   * Get conflicts by cloud service
   */
  getConflictsByService(cloudService: string): SyncConflict[] {
    return this.conflicts.filter(c => c.cloudService === cloudService);
  }

  /**
   * Clear all conflicts
   */
  clearConflicts(): void {
    this.conflicts = [];
    this.notifyListeners();
  }

  /**
   * Clear conflicts for a specific entity
   */
  clearConflictsForEntity(entityId: string): void {
    this.conflicts = this.conflicts.filter(c => c.entityId !== entityId);
    this.notifyListeners();
  }

  /**
   * Subscribe to conflict changes
   */
  subscribe(listener: (conflicts: SyncConflict[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get conflict statistics
   */
  getConflictStats() {
    const total = this.conflicts.length;
    const byType = this.conflicts.reduce((acc, conflict) => {
      acc[conflict.conflictType] = (acc[conflict.conflictType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byService = this.conflicts.reduce((acc, conflict) => {
      acc[conflict.cloudService] = (acc[conflict.cloudService] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byEntityType = this.conflicts.reduce((acc, conflict) => {
      acc[conflict.entityType] = (acc[conflict.entityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byType,
      byService,
      byEntityType
    };
  }

  /**
   * Auto-resolve simple conflicts
   */
  async autoResolveSimpleConflicts(): Promise<number> {
    let resolvedCount = 0;

    for (const conflict of this.conflicts) {
      // Auto-resolve deletion conflicts (keep local if cloud was deleted)
      if (conflict.conflictType === 'deletion') {
        const resolution: ConflictResolution = {
          action: 'keep-local',
          note: 'Auto-resolved: Kept local version after cloud deletion'
        };
        
        if (await this.resolveConflict(conflict.id, resolution)) {
          resolvedCount++;
        }
      }

      // Auto-resolve metadata conflicts (use most recent)
      if (conflict.conflictType === 'metadata') {
        const localDate = new Date(conflict.localVersion.lastModified);
        const cloudDate = new Date(conflict.cloudVersion.lastModified);
        
        const resolution: ConflictResolution = {
          action: localDate > cloudDate ? 'keep-local' : 'keep-cloud',
          note: `Auto-resolved: Used ${localDate > cloudDate ? 'local' : 'cloud'} version (more recent)`
        };
        
        if (await this.resolveConflict(conflict.id, resolution)) {
          resolvedCount++;
        }
      }
    }

    return resolvedCount;
  }

  private generateId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.conflicts]));
  }
}

export const conflictManagementService = new ConflictManagementService(); 