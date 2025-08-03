import { useCallback, useState } from 'react';
import { Block, SlashCommand } from '../types';

export const useSlashCommands = () => {
    const [slashCommandOpen, setSlashCommandOpen] = useState(false);
    const [slashCommandAnchor, setSlashCommandAnchor] = useState<HTMLElement | null>(null);
    const [currentSlashBlockId, setCurrentSlashBlockId] = useState<string | null>(null);

    const handleSlashCommand = useCallback((blockId: string, command: string) => {
        // This will be handled by the parent component
        console.log(`Slash command: ${command} for block: ${blockId}`);
        setSlashCommandOpen(false);
    }, []);

    const closeSlashCommand = useCallback(() => {
        setSlashCommandOpen(false);
        setSlashCommandAnchor(null);
        setCurrentSlashBlockId(null);
    }, []);

    return {
        slashCommandOpen,
        slashCommandAnchor,
        currentSlashBlockId,
        setSlashCommandOpen,
        setSlashCommandAnchor,
        setCurrentSlashBlockId,
        handleSlashCommand,
        closeSlashCommand
    };
}; 