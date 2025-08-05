export interface DrawingPoint {
    x: number;
    y: number;
    pressure?: number;
    timestamp: number;
}

export interface DrawingStroke {
    id: string;
    points: DrawingPoint[];
    color: string;
    width: number;
    opacity: number;
}

export interface DrawingData {
    strokes: DrawingStroke[];
    svgPath: string;
    pngThumbnail: string;
    width: number;
    height: number;
    createdAt: string;
    updatedAt: string;
}

export interface FreeformDrawingBlock {
    id: string;
    blockId: string;
    entityId: string;
    entityType: 'note' | 'project' | 'protocol' | 'task' | 'database';
    strokes: string; // JSON string of DrawingStroke[]
    svgPath: string;
    pngThumbnail: string;
    width: number;
    height: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateFreeformDrawingBlockRequest {
    blockId: string;
    entityId: string;
    entityType: 'note' | 'project' | 'protocol' | 'task' | 'database';
    strokes?: string;
    svgPath?: string;
    pngThumbnail?: string;
    width?: number;
    height?: number;
}

export interface UpdateFreeformDrawingBlockRequest {
    strokes?: string;
    svgPath?: string;
    pngThumbnail?: string;
    width?: number;
    height?: number;
}

export interface FreeformDrawingBlockResponse {
    blocks: FreeformDrawingBlock[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface FreeformDrawingBlockStats {
    total: number;
    byEntityType: Record<string, number>;
    recent: Array<{
        id: string;
        blockId: string;
        entityType: string;
        entityId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}

export interface BulkCreateFreeformDrawingBlockRequest {
    blocks: CreateFreeformDrawingBlockRequest[];
}

export interface BulkCreateFreeformDrawingBlockResponse {
    message: string;
    count: number;
} 