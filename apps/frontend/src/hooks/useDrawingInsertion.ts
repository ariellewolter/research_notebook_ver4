import { useState, useCallback } from 'react';
import { DrawingData } from '../components/blocks/FreeformDrawingBlock';
import { blocksApi } from '../services/api';

interface UseDrawingInsertionProps {
  entityId: string;
  entityType: 'note' | 'project' | 'protocol' | 'task' | 'database';
  onContentUpdate?: (newContent: string) => void;
  onDrawingAdded?: (drawingData: DrawingData, blockId: string) => void;
}

export const useDrawingInsertion = ({
  entityId,
  entityType,
  onContentUpdate,
  onDrawingAdded
}: UseDrawingInsertionProps) => {
  const [isInserting, setIsInserting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insertDrawing = useCallback(async (drawingData: DrawingData, blockId: string) => {
    try {
      setIsInserting(true);
      setError(null);

      // Save drawing block to backend
      const blockResponse = await blocksApi.createFreeformDrawingBlock({
        blockId,
        entityId,
        entityType,
        strokes: JSON.stringify(drawingData.strokes),
        svgPath: drawingData.svgPath,
        pngThumbnail: drawingData.pngThumbnail,
        width: drawingData.width,
        height: drawingData.height
      });

      // Create drawing block reference for content
      const drawingBlock = {
        type: 'freeform-drawing',
        id: blockId,
        content: JSON.stringify({
          entityId,
          entityType,
          drawingData,
          blockId: blockResponse.data.id
        }),
        metadata: {
          drawingData,
          width: drawingData.width,
          height: drawingData.height,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      // Insert drawing block reference into content
      const drawingBlockMarkdown = `\n\n\`\`\`freeform-drawing
${JSON.stringify(drawingBlock, null, 2)}
\`\`\`\n\n`;

      // Update content with drawing block
      if (onContentUpdate) {
        onContentUpdate(drawingBlockMarkdown);
      }

      // Call success callback
      if (onDrawingAdded) {
        onDrawingAdded(drawingData, blockId);
      }

      return blockResponse.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to insert drawing';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsInserting(false);
    }
  }, [entityId, entityType, onContentUpdate, onDrawingAdded]);

  const insertDrawingAtPosition = useCallback(async (
    drawingData: DrawingData, 
    blockId: string, 
    currentContent: string, 
    position: number
  ) => {
    try {
      setIsInserting(true);
      setError(null);

      // Save drawing block to backend
      const blockResponse = await blocksApi.createFreeformDrawingBlock({
        blockId,
        entityId,
        entityType,
        strokes: JSON.stringify(drawingData.strokes),
        svgPath: drawingData.svgPath,
        pngThumbnail: drawingData.pngThumbnail,
        width: drawingData.width,
        height: drawingData.height
      });

      // Create drawing block reference
      const drawingBlock = {
        type: 'freeform-drawing',
        id: blockId,
        content: JSON.stringify({
          entityId,
          entityType,
          drawingData,
          blockId: blockResponse.data.id
        }),
        metadata: {
          drawingData,
          width: drawingData.width,
          height: drawingData.height,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      // Insert at specific position
      const drawingBlockMarkdown = `\n\n\`\`\`freeform-drawing
${JSON.stringify(drawingBlock, null, 2)}
\`\`\`\n\n`;

      const newContent = 
        currentContent.slice(0, position) + 
        drawingBlockMarkdown + 
        currentContent.slice(position);

      // Update content
      if (onContentUpdate) {
        onContentUpdate(newContent);
      }

      // Call success callback
      if (onDrawingAdded) {
        onDrawingAdded(drawingData, blockId);
      }

      return blockResponse.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to insert drawing';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsInserting(false);
    }
  }, [entityId, entityType, onContentUpdate, onDrawingAdded]);

  const insertDrawingAsBlock = useCallback(async (
    drawingData: DrawingData, 
    blockId: string,
    blocks: any[],
    insertIndex?: number
  ) => {
    try {
      setIsInserting(true);
      setError(null);

      // Save drawing block to backend
      const blockResponse = await blocksApi.createFreeformDrawingBlock({
        blockId,
        entityId,
        entityType,
        strokes: JSON.stringify(drawingData.strokes),
        svgPath: drawingData.svgPath,
        pngThumbnail: drawingData.pngThumbnail,
        width: drawingData.width,
        height: drawingData.height
      });

      // Create new block
      const newBlock = {
        id: blockId,
        type: 'freeform-drawing',
        content: JSON.stringify({
          entityId,
          entityType,
          drawingData,
          blockId: blockResponse.data.id
        }),
        metadata: {
          drawingData,
          width: drawingData.width,
          height: drawingData.height,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      // Insert block at specified position or at the end
      const newBlocks = [...blocks];
      const insertAt = insertIndex !== undefined ? insertIndex : newBlocks.length;
      newBlocks.splice(insertAt, 0, newBlock);

      // Call success callback with updated blocks
      if (onDrawingAdded) {
        onDrawingAdded(drawingData, blockId);
      }

      return { block: newBlock, blocks: newBlocks };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to insert drawing';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsInserting(false);
    }
  }, [entityId, entityType, onDrawingAdded]);

  const removeDrawing = useCallback(async (blockId: string) => {
    try {
      setIsInserting(true);
      setError(null);

      // Remove from backend
      await blocksApi.deleteFreeformDrawingBlock(blockId);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove drawing';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsInserting(false);
    }
  }, []);

  const updateDrawing = useCallback(async (blockId: string, drawingData: DrawingData) => {
    try {
      setIsInserting(true);
      setError(null);

      // Update in backend
      const response = await blocksApi.updateFreeformDrawingBlock(blockId, {
        strokes: JSON.stringify(drawingData.strokes),
        svgPath: drawingData.svgPath,
        pngThumbnail: drawingData.pngThumbnail,
        width: drawingData.width,
        height: drawingData.height
      });

      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update drawing';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsInserting(false);
    }
  }, []);

  return {
    insertDrawing,
    insertDrawingAtPosition,
    insertDrawingAsBlock,
    removeDrawing,
    updateDrawing,
    isInserting,
    error,
    clearError: () => setError(null)
  };
}; 