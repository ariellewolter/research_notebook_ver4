export type EntityType = 'note' | 'highlight' | 'databaseEntry' | 'protocol' | 'protocolExecution' | 'recipeExecution' | 'table';

export interface Link {
    id: string;
    sourceType: EntityType;
    sourceId: string;
    targetType: EntityType;
    targetId: string;
    createdAt: Date;
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
    protocol?: {
        id: string;
        name: string;
        description: string;
    };
    protocolExecution?: {
        id: string;
        status: string;
        startDate: Date;
    };
    recipeExecution?: {
        id: string;
        status: string;
        startDate: Date;
    };
    table?: {
        id: string;
        name: string;
        description: string;
    };
}

export type CreateLinkData = Omit<Link, 'id' | 'createdAt'>; 