import { useState, useEffect } from 'react';

export const useCommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Open command palette with Ctrl+K, Cmd+K, Ctrl+P, or Cmd+P
            if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'p')) {
                e.preventDefault();
                setIsOpen(true);
            }
            
            // Close with Escape
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const openCommandPalette = () => setIsOpen(true);
    const closeCommandPalette = () => setIsOpen(false);
    const toggleCommandPalette = () => setIsOpen(!isOpen);

    return {
        isOpen,
        openCommandPalette,
        closeCommandPalette,
        toggleCommandPalette,
    };
}; 