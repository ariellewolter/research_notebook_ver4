export type EntityType = 'note' | 'highlight' | 'databaseEntry' | 'project' | 'experiment';

export interface Link {
    id: string;
    sourceType: EntityType;
    sourceId: string;
    targetType: EntityType;
    targetId: string;
    metadata?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface LinkWithEntities extends Link {
    note?: {
        id: string;
        title: string;
        type: string;
    };
    highlight?: {
        id: string;
        text: string;
        page: number;
        pdf: {
            id: string;
            title: string;
        };
    };
    databaseEntry?: {
        id: string;
        name: string;
        type: string;
    };
    project?: {
        id: string;
        title: string;
        status: string;
    };
    experiment?: {
        id: string;
        title: string;
        status: string;
    };
}

export type CreateLinkData = Omit<Link, 'id' | 'createdAt' | 'updatedAt'>; 