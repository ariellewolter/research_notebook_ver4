import { useCallback, useState } from 'react';
import { Block, Page } from '../types';

export const useDragAndDrop = (currentPage: Page, setCurrentPage: (page: Page) => void) => {
    const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

    const handleDragStart = useCallback((e: React.DragEvent, blockId: string) => {
        setDraggedBlockId(blockId);
        e.dataTransfer.setData('text/plain', blockId);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetBlockId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        
        if (draggedId === targetBlockId) return;

        setCurrentPage(prev => {
            const draggedIndex = prev.blocks.findIndex(block => block.id === draggedId);
            const targetIndex = prev.blocks.findIndex(block => block.id === targetBlockId);
            
            if (draggedIndex === -1 || targetIndex === -1) return prev;

            const updatedBlocks = [...prev.blocks];
            const [draggedBlock] = updatedBlocks.splice(draggedIndex, 1);
            
            // Insert at target position
            updatedBlocks.splice(targetIndex, 0, draggedBlock);
            
            // Update order for all blocks
            updatedBlocks.forEach((block, index) => {
                block.order = index;
            });

            return {
                ...prev,
                blocks: updatedBlocks
            };
        });
    }, [setCurrentPage]);

    const handleDragEnd = useCallback(() => {
        setDraggedBlockId(null);
    }, []);

    return {
        draggedBlockId,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd
    };
}; 