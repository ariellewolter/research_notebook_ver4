export interface DatabaseEntry {
    id: string;
    name: string;
    description: string | null;
    type: string;
    properties: string | null;
    metadata: string | null;
    createdAt: Date;
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

export interface DatabaseEntrySummary {
    id: string;
    name: string;
    type: string;
    createdAt: Date;
}

export type CreateDatabaseEntryData = Omit<DatabaseEntry, 'id' | 'createdAt'>;
export type UpdateDatabaseEntryData = Partial<CreateDatabaseEntryData>;

export interface DatabaseStats {
    total: number;
    byType: Record<string, number>;
    recent: DatabaseEntrySummary[];
} 