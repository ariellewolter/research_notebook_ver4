import { useCallback, useState } from 'react';
import { Block } from '../types';

export const useContextMenu = () => {
    const [contextMenuAnchor, setContextMenuAnchor] = useState<HTMLElement | null>(null);
    const [contextMenuBlockId, setContextMenuBlockId] = useState<string | null>(null);

    const handleContextMenuOpen = useCallback((e: React.MouseEvent, blockId: string) => {
        e.preventDefault();
        setContextMenuAnchor(e.currentTarget);
        setContextMenuBlockId(blockId);
    }, []);

    const handleContextMenuClose = useCallback(() => {
        setContextMenuAnchor(null);
        setContextMenuBlockId(null);
    }, []);

    const handleContextMenuAction = useCallback((action: string, blockId: string) => {
        // This will be handled by the parent component
        console.log(`Context menu action: ${action} for block: ${blockId}`);
        handleContextMenuClose();
    }, [handleContextMenuClose]);

    return {
        contextMenuAnchor,
        contextMenuBlockId,
        handleContextMenuOpen,
        handleContextMenuClose,
        handleContextMenuAction
    };
}; 