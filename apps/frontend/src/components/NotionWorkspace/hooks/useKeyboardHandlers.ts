import { useCallback } from 'react';
import { Block, Page } from '../types';

interface KeyboardHandlersProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    slashCommandOpen: boolean;
    setSlashCommandOpen: (open: boolean) => void;
    setSlashCommandAnchor: (anchor: HTMLElement | null) => void;
    setCurrentSlashBlockId: (id: string | null) => void;
    handleMergeBlock: (blockId: string) => void;
    handleCreateBlock: (blockType: Block['type'], afterBlockId?: string, content?: string) => Block;
    handleConvertBlock: (blockId: string, newType: Block['type']) => void;
}

export const useKeyboardHandlers = ({
    currentPage,
    setCurrentPage,
    slashCommandOpen,
    setSlashCommandOpen,
    setSlashCommandAnchor,
    setCurrentSlashBlockId,
    handleMergeBlock,
    handleCreateBlock,
    handleConvertBlock
}: KeyboardHandlersProps) => {
    
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>, block: Block) => {
        const textContent = e.currentTarget.textContent || '';
        const cursorPosition = window.getSelection()?.anchorOffset || 0;

        if (e.key === '/') {
            // Check if cursor is at the beginning or if this is the first character
            if (cursorPosition === 0 || textContent === '/') {
                setSlashCommandOpen(true);
                setSlashCommandAnchor(e.currentTarget);
                setCurrentSlashBlockId(block.id);
            }
        } else if (slashCommandOpen && textContent.startsWith('/')) {
            // Allow typing to continue and update search in real-time
            // The SlashCommandMenu will receive this via searchQuery prop
        } else if (e.key === 'Backspace') {
            // Handle intuitive delete behavior
            if (cursorPosition === 0 && (textContent === '' || textContent.length === 1)) {
                e.preventDefault();

                // If it's the first block, just clear it
                const blockIndex = currentPage.blocks.findIndex(b => b.id === block.id);
                if (blockIndex === 0) {
                    // Keep the block but clear content
                    return;
                }

                // Merge with previous block
                handleMergeBlock(block.id);
            }
        } else if (e.key === 'Enter') {
            // Handle Enter to create new block
            if (e.shiftKey) {
                // Shift+Enter creates a line break
                return;
            }

            e.preventDefault();

            // Create new text block after current block
            const newBlock = handleCreateBlock('text', block.id);

            // Focus the new block after a short delay
            setTimeout(() => {
                const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"]`) as HTMLElement;
                if (newBlockElement) {
                    newBlockElement.focus();
                }
            }, 10);
        }
    }, [currentPage, slashCommandOpen, setSlashCommandOpen, setSlashCommandAnchor, setCurrentSlashBlockId, handleMergeBlock, handleCreateBlock]);

    const handleHeadingKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>, block: Block) => {
        const textContent = e.currentTarget.textContent || '';
        const cursorPosition = window.getSelection()?.anchorOffset || 0;

        if (e.key === 'Backspace') {
            // Handle intuitive delete behavior for headings
            if (cursorPosition === 0 && (textContent === '' || textContent.length === 1)) {
                e.preventDefault();

                // Convert to text block instead of deleting
                handleConvertBlock(block.id, 'text');
            }
        } else if (e.key === 'Enter') {
            // Handle Enter to create new block
            if (e.shiftKey) {
                // Shift+Enter creates a line break
                return;
            }

            e.preventDefault();

            // Create new text block after current block
            const newBlock = handleCreateBlock('text', block.id);

            // Focus the new block after a short delay
            setTimeout(() => {
                const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"]`) as HTMLElement;
                if (newBlockElement) {
                    newBlockElement.focus();
                }
            }, 10);
        }
    }, [handleConvertBlock, handleCreateBlock]);

    return {
        handleKeyDown,
        handleHeadingKeyDown
    };
}; 