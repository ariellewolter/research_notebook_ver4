export interface DatabaseEntry {
    id: string;
    name: string;
    description?: string;
    type: string;
    properties?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface DatabaseEntryWithLinks extends DatabaseEntry {
    links?: Array<{
        id: string;
        sourceType: string;
        sourceId: string;
        targetType: string;
        targetId: string;
    }>;
}

export type CreateDatabaseEntryData = Omit<DatabaseEntry, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateDatabaseEntryData = Partial<CreateDatabaseEntryData>;

export interface DatabaseStats {
    total: number;
    byType: Record<string, number>;
    recent: DatabaseEntry[];
} 