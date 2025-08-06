import { apiClient } from './apiClient';
import { DrawingData } from '../../components/blocks/FreeformDrawingBlock';

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

export interface FreeformDrawingBlock {
  id: string;
  blockId: string;
  entityId: string;
  entityType: 'note' | 'project' | 'protocol' | 'task' | 'database';
  strokes: string;
  svgPath: string;
  pngThumbnail: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
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
    createdAt: string;
    updatedAt: string;
  }>;
}

export const blocksApi = {
  // Get all freeform drawing blocks for an entity
  getBlocksByEntity: (entityType: string, entityId: string, page = 1, limit = 20) =>
    apiClient.get<FreeformDrawingBlockResponse>(`/blocks/${entityType}/${entityId}/freeform`, {
      params: { page, limit }
    }),

  // Get a specific freeform drawing block by blockId
  getBlockByBlockId: (blockId: string) =>
    apiClient.get<FreeformDrawingBlock>(`/blocks/freeform/${blockId}`),

  // Create a new freeform drawing block
  createFreeformDrawingBlock: (data: CreateFreeformDrawingBlockRequest) =>
    apiClient.post<FreeformDrawingBlock>('/blocks/freeform', data),

  // Update an existing freeform drawing block
  updateFreeformDrawingBlock: (blockId: string, data: UpdateFreeformDrawingBlockRequest) =>
    apiClient.put<FreeformDrawingBlock>(`/blocks/freeform/${blockId}`, data),

  // Delete a freeform drawing block
  deleteFreeformDrawingBlock: (blockId: string) =>
    apiClient.delete(`/blocks/freeform/${blockId}`),

  // Get statistics for freeform drawing blocks
  getStats: () =>
    apiClient.get<FreeformDrawingBlockStats>('/blocks/freeform/stats'),

  // Bulk create freeform drawing blocks
  bulkCreateBlocks: (blocks: CreateFreeformDrawingBlockRequest[]) =>
    apiClient.post<{ message: string; count: number }>('/blocks/freeform/bulk', { blocks }),

  // Search freeform drawing blocks
  searchBlocks: (query?: string, entityType?: string, page = 1, limit = 20) =>
    apiClient.get<FreeformDrawingBlockResponse>('/blocks/freeform/search', {
      params: { q: query, entityType, page, limit }
    }),

  // Helper method to convert DrawingData to API format
  convertDrawingDataToApi: (drawingData: DrawingData, blockId: string, entityId: string, entityType: string): CreateFreeformDrawingBlockRequest => ({
    blockId,
    entityId,
    entityType,
    strokes: JSON.stringify(drawingData.strokes),
    svgPath: drawingData.svgPath,
    pngThumbnail: drawingData.pngThumbnail,
    width: drawingData.width,
    height: drawingData.height
  }),

  // Helper method to convert API response to DrawingData
  convertApiToDrawingData: (block: FreeformDrawingBlock): DrawingData => ({
    strokes: JSON.parse(block.strokes),
    svgPath: block.svgPath,
    pngThumbnail: block.pngThumbnail,
    width: block.width,
    height: block.height,
    createdAt: block.createdAt,
    updatedAt: block.updatedAt
  })
}; 