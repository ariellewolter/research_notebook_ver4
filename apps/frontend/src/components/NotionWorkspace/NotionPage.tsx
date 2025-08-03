import React, { useState, useCallback } from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Button,
    Paper,
    Container,
} from '@mui/material';
import {
    Add as AddIcon,
    Settings as SettingsIcon,
    Share as ShareIcon,
    MoreVert as MoreIcon,
} from '@mui/icons-material';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import BlockEditor from './BlockEditor';
import { Block, NotionPage as NotionPageType } from './types';

interface NotionPageProps {
    page: NotionPageType;
    onUpdatePage: (page: NotionPageType) => void;
    readOnly?: boolean;
}

const NotionPage: React.FC<NotionPageProps> = ({
    page,
    onUpdatePage,
    readOnly = false
}) => {
    const [blocks, setBlocks] = useState<Block[]>(page.blocks);

    const generateBlockId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const updateBlock = useCallback((blockId: string, content: any) => {
        setBlocks(prev => {
            const updated = prev.map(block =>
                block.id === blockId
                    ? { 
                        ...block, 
                        content, 
                        metadata: { 
                            ...block.metadata, 
                            updatedAt: new Date(),
                            createdAt: block.metadata?.createdAt || new Date()
                        } 
                    }
                    : block
            );
            onUpdatePage({ ...page, blocks: updated });
            return updated;
        });
    }, [page, onUpdatePage]);

    const deleteBlock = useCallback((blockId: string) => {
        setBlocks(prev => {
            const updated = prev.filter(block => block.id !== blockId);
            onUpdatePage({ ...page, blocks: updated });
            return updated;
        });
    }, [page, onUpdatePage]);

    const duplicateBlock = useCallback((blockId: string) => {
        setBlocks(prev => {
            const blockIndex = prev.findIndex(b => b.id === blockId);
            if (blockIndex === -1) return prev;

            const originalBlock = prev[blockIndex];
            const duplicatedBlock: Block = {
                ...originalBlock,
                id: generateBlockId(),
                metadata: {
                    ...originalBlock.metadata,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            };

            const updated = [
                ...prev.slice(0, blockIndex + 1),
                duplicatedBlock,
                ...prev.slice(blockIndex + 1)
            ];
            onUpdatePage({ ...page, blocks: updated });
            return updated;
        });
    }, [page, onUpdatePage]);

    const moveBlock = useCallback((dragIndex: number, hoverIndex: number) => {
        setBlocks(prev => {
            const draggedBlock = prev[dragIndex];
            const updated = [...prev];
            updated.splice(dragIndex, 1);
            updated.splice(hoverIndex, 0, draggedBlock);
            onUpdatePage({ ...page, blocks: updated });
            return updated;
        });
    }, [page, onUpdatePage]);

    const addBlock = useCallback((afterIndex: number, type: Block['type']) => {
        const newBlock: Block = {
            id: generateBlockId(),
            type,
            content: getDefaultContent(type),
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        };

        setBlocks(prev => {
            const updated = [
                ...prev.slice(0, afterIndex + 1),
                newBlock,
                ...prev.slice(afterIndex + 1)
            ];
            onUpdatePage({ ...page, blocks: updated });
            return updated;
        });
    }, [page, onUpdatePage]);

    const getDefaultContent = (type: Block['type']) => {
        switch (type) {
            case 'text':
                return { text: '' };
            case 'heading':
                return { text: '', level: 1 };
            case 'protocol':
                return { title: '', steps: '', materials: [] };
            case 'note':
                return { title: '', text: '', tags: [] };
            case 'pdf':
                return { filename: '', file: null };
            case 'callout':
                return { text: '', type: 'info' };
            case 'divider':
                return {};
            case 'code':
                return { code: '', language: 'javascript' };
            case 'equation':
                return { latex: '' };
            default:
                return {};
        }
    };

    const handleTitleChange = (newTitle: string) => {
        onUpdatePage({
            ...page,
            title: newTitle,
            metadata: {
                ...page.metadata,
                updatedAt: new Date(),
            }
        });
    };

    const addNewBlock = () => {
        addBlock(blocks.length - 1, 'text');
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <Container maxWidth="md" sx={{ py: 4 }}>
                {/* Page Header */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {page.icon && (
                                <Typography variant="h4">{page.icon}</Typography>
                            )}
                            <TextField
                                variant="standard"
                                value={page.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="Untitled"
                                InputProps={{
                                    disableUnderline: true,
                                    sx: { fontSize: '2rem', fontWeight: 600 }
                                }}
                                disabled={readOnly}
                            />
                        </Box>

                        {!readOnly && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton size="small">
                                    <ShareIcon />
                                </IconButton>
                                <IconButton size="small">
                                    <SettingsIcon />
                                </IconButton>
                                <IconButton size="small">
                                    <MoreIcon />
                                </IconButton>
                            </Box>
                        )}
                    </Box>

                    {/* Page metadata */}
                    <Typography variant="caption" color="text.secondary">
                        Last edited {page.metadata?.updatedAt ? new Date(page.metadata.updatedAt).toLocaleDateString() : 'Unknown'}
                    </Typography>
                </Box>

                {/* Blocks */}
                <Box sx={{ pl: 4 }}>
                    {blocks.map((block, index) => (
                        <BlockEditor
                            key={block.id}
                            block={block}
                            index={index}
                            onUpdate={updateBlock}
                            onDelete={deleteBlock}
                            onDuplicate={duplicateBlock}
                            onMove={moveBlock}
                            onAddBlock={addBlock}
                        />
                    ))}

                    {/* Add Block Button */}
                    {!readOnly && (
                        <Button
                            startIcon={<AddIcon />}
                            onClick={addNewBlock}
                            sx={{ mt: 2, color: 'text.secondary' }}
                            variant="text"
                        >
                            Add a block
                        </Button>
                    )}
                </Box>
            </Container>
        </DndProvider>
    );
};

export default NotionPage; 