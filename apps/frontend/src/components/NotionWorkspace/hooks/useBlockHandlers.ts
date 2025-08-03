import { useCallback } from 'react';
import { Block, Page } from '../types';

export const useBlockHandlers = (currentPage: Page, setCurrentPage: (page: Page) => void) => {
    // Update block content handler
    const handleBlockContentChange = useCallback((blockId: string, content: string) => {
        setCurrentPage(prev => ({
            ...prev,
            blocks: prev.blocks.map(block =>
                block.id === blockId
                    ? { ...block, content, updatedAt: new Date() }
                    : block
            )
        }));
    }, [setCurrentPage]);

    // Delete block handler
    const handleDeleteBlock = useCallback((blockId: string) => {
        setCurrentPage(prev => ({
            ...prev,
            blocks: prev.blocks.filter(block => block.id !== blockId)
        }));
    }, [setCurrentPage]);

    // Merge block with previous block
    const handleMergeBlock = useCallback((blockId: string) => {
        setCurrentPage(prev => {
            const blockIndex = prev.blocks.findIndex(block => block.id === blockId);
            if (blockIndex <= 0) return prev; // Can't merge first block

            const currentBlock = prev.blocks[blockIndex];
            const previousBlock = prev.blocks[blockIndex - 1];

            // Merge content
            const mergedContent = previousBlock.content + currentBlock.content;

            // Update previous block with merged content
            const updatedBlocks = [...prev.blocks];
            updatedBlocks[blockIndex - 1] = {
                ...previousBlock,
                content: mergedContent,
                updatedAt: new Date()
            };

            // Remove current block
            updatedBlocks.splice(blockIndex, 1);

            return {
                ...prev,
                blocks: updatedBlocks
            };
        });
    }, [setCurrentPage]);

    // Create new block
    const handleCreateBlock = useCallback((blockType: Block['type'], afterBlockId?: string, content: string = '') => {
        const newBlock: Block = {
            id: `block-${Date.now()}-${Math.random()}`,
            type: blockType,
            content,
            createdAt: new Date(),
            updatedAt: new Date(),
            order: 0
        };

        setCurrentPage(prev => {
            let insertIndex = prev.blocks.length;
            
            if (afterBlockId) {
                const afterIndex = prev.blocks.findIndex(b => b.id === afterBlockId);
                if (afterIndex !== -1) {
                    insertIndex = afterIndex + 1;
                    newBlock.order = prev.blocks[afterIndex].order + 1;
                }
            }

            const updatedBlocks = [...prev.blocks];
            updatedBlocks.splice(insertIndex, 0, newBlock);

            // Update order for blocks after the new block
            for (let i = insertIndex + 1; i < updatedBlocks.length; i++) {
                updatedBlocks[i].order = updatedBlocks[i].order + 1;
            }

            return {
                ...prev,
                blocks: updatedBlocks
            };
        });

        return newBlock;
    }, [setCurrentPage]);

    // Convert block type
    const handleConvertBlock = useCallback((blockId: string, newType: Block['type']) => {
        setCurrentPage(prev => ({
            ...prev,
            blocks: prev.blocks.map(block =>
                block.id === blockId
                    ? { ...block, type: newType, updatedAt: new Date() }
                    : block
            )
        }));
    }, [setCurrentPage]);

    return {
        handleBlockContentChange,
        handleDeleteBlock,
        handleMergeBlock,
        handleCreateBlock,
        handleConvertBlock
    };
}; 