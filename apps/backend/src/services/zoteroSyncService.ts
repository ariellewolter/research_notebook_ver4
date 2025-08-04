import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

export interface ZoteroConfig {
    apiKey: string;
    userId: string;
    groupId?: string;
    baseUrl: string;
}

export interface SyncResult {
    success: boolean;
    message: string;
    totalItems: number;
    syncedCount: number;
    newItems: Array<{
        key: string;
        title: string;
        type: string;
        authors?: string[];
    }>;
    updatedItems: Array<{
        key: string;
        title: string;
        type: string;
        changes: string[];
    }>;
    errors: string[];
}

export interface ZoteroItem {
    key: string;
    data: {
        title: string;
        creators?: Array<{ firstName: string; lastName: string; creatorType: string }>;
        date?: string;
        publicationTitle?: string;
        abstractNote?: string;
        tags?: Array<{ tag: string }>;
        itemType?: string;
        DOI?: string;
        url?: string;
        version?: number;
    };
    meta?: {
        version?: number;
        lastModified?: string;
    };
}

class ZoteroSyncService {
    private config: ZoteroConfig | null = null;
    private lastSyncTime: Date | null = null;
    private syncInterval: NodeJS.Timeout | null = null;
    private isSyncing = false;

    setConfig(config: ZoteroConfig) {
        this.config = config;
    }

    getConfig(): ZoteroConfig | null {
        return this.config;
    }

    getLastSyncTime(): Date | null {
        return this.lastSyncTime;
    }

    isSyncInProgress(): boolean {
        return this.isSyncing;
    }

    async performSync(): Promise<SyncResult> {
        if (!this.config) {
            return {
                success: false,
                message: 'Zotero not configured',
                totalItems: 0,
                syncedCount: 0,
                newItems: [],
                updatedItems: [],
                errors: ['Zotero configuration not found']
            };
        }

        if (this.isSyncing) {
            return {
                success: false,
                message: 'Sync already in progress',
                totalItems: 0,
                syncedCount: 0,
                newItems: [],
                updatedItems: [],
                errors: ['Another sync operation is currently running']
            };
        }

        this.isSyncing = true;
        const result: SyncResult = {
            success: true,
            message: '',
            totalItems: 0,
            syncedCount: 0,
            newItems: [],
            updatedItems: [],
            errors: []
        };

        try {
            // Get all items from Zotero
            const url = `${this.config.baseUrl}/users/${this.config.userId}/items`;
            const response = await axios.get(url, {
                headers: {
                    'Zotero-API-Key': this.config.apiKey,
                    'Zotero-API-Version': '3'
                },
                params: {
                    limit: 100,
                    format: 'json'
                }
            });

            const items: ZoteroItem[] = response.data;
            result.totalItems = items.length;

            // Process each item
            for (const item of items) {
                try {
                    const itemResult = await this.processItem(item);
                    if (itemResult.isNew) {
                        result.syncedCount++;
                        result.newItems.push({
                            key: item.key,
                            title: item.data.title,
                            type: item.data.itemType || 'unknown',
                            authors: item.data.creators?.map(creator => 
                                `${creator.firstName} ${creator.lastName}`.trim()
                            )
                        });
                    } else if (itemResult.isUpdated) {
                        result.updatedItems.push({
                            key: item.key,
                            title: item.data.title,
                            type: item.data.itemType || 'unknown',
                            changes: itemResult.changes || []
                        });
                    }
                } catch (error) {
                    const errorMsg = `Failed to process item ${item.key}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    result.errors.push(errorMsg);
                    console.error(errorMsg, error);
                }
            }

            this.lastSyncTime = new Date();
            result.message = `Successfully synced ${result.syncedCount} new items and updated ${result.updatedItems.length} items from Zotero`;

        } catch (error) {
            result.success = false;
            result.message = 'Failed to sync Zotero library';
            result.errors.push(error instanceof Error ? error.message : 'Unknown error');
            console.error('Error syncing Zotero library:', error);
        } finally {
            this.isSyncing = false;
        }

        return result;
    }

    private async processItem(item: ZoteroItem): Promise<{
        isNew: boolean;
        isUpdated: boolean;
        changes?: string[];
    }> {
        // Check if item already exists
        const existingEntry = await prisma.databaseEntry.findFirst({
            where: {
                properties: {
                    contains: `"zoteroKey":"${item.key}"`
                }
            }
        });

        const properties = JSON.stringify({
            title: item.data.title || 'Untitled',
            authors: item.data.creators?.map(creator => 
                `${creator.firstName} ${creator.lastName}`.trim()
            ) || [],
            abstract: item.data.abstractNote || '',
            publicationYear: item.data.date ? new Date(item.data.date).getFullYear().toString() : undefined,
            journal: item.data.publicationTitle || '',
            doi: item.data.DOI || '',
            url: item.data.url || '',
            tags: item.data.tags?.map(tag => tag.tag) || [],
            itemType: item.data.itemType || '',
            importedFrom: 'zotero',
            lastModified: item.meta?.lastModified || '',
            version: item.meta?.version || 0
        });

        if (!existingEntry) {
            // Create new entry
            await prisma.databaseEntry.create({
                data: {
                    type: 'REFERENCE',
                    name: item.data.title || 'Untitled',
                    description: item.data.abstractNote || '',
                    properties
                }
            });

            return { isNew: true, isUpdated: false };
        } else {
            // Check if item needs updating
            const existingProperties = JSON.parse(existingEntry.properties || '{}');
            const changes: string[] = [];

            // Compare properties to detect changes
            if (existingProperties.title !== (item.data.title || 'Untitled')) {
                changes.push('title');
            }
            if (existingProperties.abstract !== item.data.abstractNote) {
                changes.push('abstract');
            }
            if (existingProperties.version !== item.meta?.version) {
                changes.push('content');
            }

            if (changes.length > 0) {
                // Update existing entry
                await prisma.databaseEntry.update({
                    where: { id: existingEntry.id },
                    data: {
                        name: item.data.title || 'Untitled',
                        description: item.data.abstractNote || '',
                        properties
                    }
                });

                return { isNew: false, isUpdated: true, changes };
            }

            return { isNew: false, isUpdated: false };
        }
    }

    startBackgroundSync(intervalMinutes: number) {
        if (this.syncInterval) {
            this.stopBackgroundSync();
        }

        const intervalMs = intervalMinutes * 60 * 1000;
        this.syncInterval = setInterval(async () => {
            try {
                const result = await this.performSync();
                if (result.success && (result.newItems.length > 0 || result.updatedItems.length > 0)) {
                    // Emit notification event (will be handled by the main process)
                    console.log(`Background sync completed: ${result.message}`);
                }
            } catch (error) {
                console.error('Background sync failed:', error);
            }
        }, intervalMs);

        console.log(`Background sync started with ${intervalMinutes} minute interval`);
    }

    stopBackgroundSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('Background sync stopped');
        }
    }

    isBackgroundSyncActive(): boolean {
        return this.syncInterval !== null;
    }

    getBackgroundSyncInterval(): number | null {
        return this.syncInterval ? (this.syncInterval as any).refresh : null;
    }
}

// Export singleton instance
export const zoteroSyncService = new ZoteroSyncService(); 