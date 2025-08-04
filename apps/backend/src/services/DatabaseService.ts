import { DatabaseRepository } from '../repositories/DatabaseRepository';
import { CreateDatabaseEntryData, UpdateDatabaseEntryData, DatabaseEntryWithLinks, DatabaseStats } from '../types/database.types';

export class DatabaseService {
    constructor(
        private databaseRepository: DatabaseRepository = new DatabaseRepository()
    ) {}

    async getAllEntries(filters?: {
        type?: string;
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{ entries: DatabaseEntryWithLinks[]; total: number; pagination: any }> {
        const { page = 1, limit = 10, ...filterParams } = filters || {};
        const skip = (page - 1) * limit;

        const [entries, total] = await Promise.all([
            this.databaseRepository.findMany({
                ...filterParams,
                skip,
                take: limit,
            }),
            this.databaseRepository.count({ ...filterParams }),
        ]);

        return {
            entries,
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    }

    async getEntryById(id: string): Promise<DatabaseEntryWithLinks | null> {
        return this.databaseRepository.findById(id);
    }

    async getEntriesByType(type: string, filters?: { page?: number; limit?: number }): Promise<{ entries: DatabaseEntryWithLinks[]; total: number; pagination: any }> {
        const { page = 1, limit = 10 } = filters || {};
        const skip = (page - 1) * limit;

        const [entries, total] = await Promise.all([
            this.databaseRepository.findByType(type, { skip, take: limit }),
            this.databaseRepository.count({ type }),
        ]);

        return {
            entries,
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    }

    async createEntry(data: CreateDatabaseEntryData): Promise<DatabaseEntryWithLinks> {
        return this.databaseRepository.create(data);
    }

    async updateEntry(id: string, data: UpdateDatabaseEntryData): Promise<DatabaseEntryWithLinks> {
        const existingEntry = await this.databaseRepository.findById(id);
        if (!existingEntry) {
            throw new Error('Database entry not found');
        }

        return this.databaseRepository.update(id, data);
    }

    async deleteEntry(id: string): Promise<void> {
        const existingEntry = await this.databaseRepository.findById(id);
        if (!existingEntry) {
            throw new Error('Database entry not found');
        }

        await this.databaseRepository.delete(id);
    }

    async getStats(): Promise<DatabaseStats> {
        return this.databaseRepository.getStats();
    }

    async searchEntries(query: string, filters?: { type?: string; limit?: number }): Promise<DatabaseEntryWithLinks[]> {
        return this.databaseRepository.search(query, filters);
    }

    async getTypes(): Promise<Array<{ type: string; count: number }>> {
        return this.databaseRepository.getTypes();
    }

    async bulkCreateEntries(entries: CreateDatabaseEntryData[]): Promise<DatabaseEntryWithLinks[]> {
        const createdEntries = [];
        
        for (const entry of entries) {
            const created = await this.databaseRepository.create(entry);
            createdEntries.push(created);
        }
        
        return createdEntries;
    }

    async bulkUpdateEntries(updates: Array<{ id: string; data: UpdateDatabaseEntryData }>): Promise<DatabaseEntryWithLinks[]> {
        const updatedEntries = [];
        
        for (const update of updates) {
            const existingEntry = await this.databaseRepository.findById(update.id);
            if (!existingEntry) {
                throw new Error(`Database entry with id ${update.id} not found`);
            }
            
            const updated = await this.databaseRepository.update(update.id, update.data);
            updatedEntries.push(updated);
        }
        
        return updatedEntries;
    }

    async bulkDeleteEntries(ids: string[]): Promise<void> {
        for (const id of ids) {
            const existingEntry = await this.databaseRepository.findById(id);
            if (!existingEntry) {
                throw new Error(`Database entry with id ${id} not found`);
            }
            
            await this.databaseRepository.delete(id);
        }
    }
} 