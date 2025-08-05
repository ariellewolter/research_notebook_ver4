import React, { useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    DragIndicator as DragIcon,
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { Draggable } from '@hello-pangea/dnd';

export interface Block {
    id: string;
    type: 'text' | 'heading' | 'note' | 'project' | 'protocol' | 'database' | 'pdf' | 'page' | 'experiment' | 'recipe' | 'literature' | 'task' | 'columns' | 'list' | 'code' | 'quote' | 'divider' | 'image' | 'table' | 'math' | 'horizontal' | 'freeform-drawing';
    content: string;
    title?: string;
    entityId?: string;
    createdAt: Date;
    updatedAt: Date;
    order: number;
    isEditing?: boolean;
    isFocused?: boolean;
    columns?: Block[][];
    columnCount?: number;
    layout?: 'vertical' | 'horizontal' | 'grid';
    metadata?: {
        level?: number;
        checked?: boolean;
        language?: string;
        url?: string;
        rows?: number;
        cols?: number;
        width?: number;
        height?: number;
        drawingData?: any; // For storing FreeformDrawingBlock data
    };
}

interface BlockProps {
    block: Block;
    index: number;
    columnId: string;
    isGhost?: boolean;
    onContentChange: (blockId: string, content: string, columnId: string) => void;
    onEditBlock: (blockId: string, columnId: string) => void;
    onSaveBlock: (blockId: string, columnId: string) => void;
    onDeleteBlock: (blockId: string, columnId: string) => void;
    onAddBlock: (columnId: string, afterBlockId?: string) => void;
    onKeyDown: (e: React.KeyboardEvent, blockId: string, columnId?: string) => void;
    onMouseEnter: (blockId: string) => void;
    onMouseLeave: () => void;
    focusedBlockId: string | null;
    hoveredBlockId: string | null;
    getBlockIcon: (type: string) => React.ReactNode;
    getFontSize: (type: string) => string;
    getFontWeight: (type: string) => number;
    getTextColor: (type: string) => string;
    getPlaceholder: (type: string) => string;
    renderBlockContent: (block: Block) => React.ReactNode;
}

const BlockComponent: React.FC<BlockProps> = ({
    block,
    index,
    columnId,
    isGhost = false,
    onContentChange,
    onEditBlock,
    onSaveBlock,
    onDeleteBlock,
    onAddBlock,
    onKeyDown,
    onMouseEnter,
    onMouseLeave,
    focusedBlockId,
    hoveredBlockId,
    getBlockIcon,
    getFontSize,
    getFontWeight,
    getTextColor,
    getPlaceholder,
    renderBlockContent
}) => {
    const textFieldRef = useRef<HTMLTextAreaElement>(null);

    // Remove unused function

    const blockContent = (
        <Box
            sx={{
                position: 'relative',
                p: 0,
                borderRadius: 0,
                bgcolor: 'transparent',
                border: 'none',
                boxShadow: 'none',
                transition: 'all 0.15s ease',
                '&:hover': {
                    bgcolor: 'transparent',
                    '& .block-actions': {
                        opacity: 1
                    }
                },
                opacity: isGhost ? 0.6 : 1,
                transform: isGhost ? 'scale(0.98)' : 'none',
                '&.focused': {
                    bgcolor: 'transparent',
                    borderRadius: 0
                }
            }}
            className={focusedBlockId === block.id ? 'focused' : ''}
            onMouseEnter={() => onMouseEnter(block.id)}
            onMouseLeave={onMouseLeave}
        >
            {/* Drag Handle - Positioned absolutely */}
            {!isGhost && (
                <Box
                    sx={{
                        position: 'absolute',
                        left: -20,
                        top: 2,
                        opacity: 0,
                        cursor: 'grab',
                        transition: 'opacity 0.2s ease',
                        '&:hover': { opacity: 0.8 }
                    }}
                    className="block-actions"
                >
                    <DragIcon sx={{ fontSize: 16, color: '#999' }} />
                </Box>
            )}

            {/* Block Content */}
            <Box sx={{ width: '100%' }}>
                {block.isEditing ? (
                    <TextField
                        inputRef={textFieldRef}
                        multiline
                        fullWidth
                        variant="standard"
                        value={block.content}
                        onChange={(e) => onContentChange(block.id, e.target.value, columnId)}
                        onKeyDown={(e) => onKeyDown(e, block.id, columnId)}
                        onBlur={() => onSaveBlock(block.id, columnId)}
                        placeholder={getPlaceholder(block.type)}
                        sx={{
                            width: '100%',
                            '& .MuiInputBase-input': {
                                fontSize: getFontSize(block.type),
                                fontWeight: getFontWeight(block.type),
                                lineHeight: 1.6,
                                color: getTextColor(block.type),
                                fontFamily: block.type === 'code' ? 'monospace' : 'inherit',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                '&::placeholder': {
                                    color: '#999',
                                    opacity: 1
                                }
                            },
                            '& .MuiInput-underline:before': { borderBottom: 'none' },
                            '& .MuiInput-underline:after': { borderBottom: 'none' },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' }
                        }}
                    />
                ) : (
                    <Box
                        onClick={() => onEditBlock(block.id, columnId)}
                        sx={{
                            cursor: 'text',
                            fontSize: getFontSize(block.type),
                            fontWeight: getFontWeight(block.type),
                            lineHeight: 1.6,
                            color: getTextColor(block.type),
                            fontFamily: block.type === 'code' ? 'monospace' : 'inherit',
                            bgcolor: block.type === 'code' ? '#f5f5f5' : 'transparent',
                            p: block.type === 'code' ? 1 : 0,
                            borderRadius: block.type === 'code' ? 1 : 0,
                            border: block.type === 'code' ? '1px solid #e0e0e0' : 'none',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            minHeight: '1.6em',
                            width: '100%',
                            '&:hover': {
                                bgcolor: block.type === 'code' ? '#f0f0f0' : 'transparent'
                            }
                        }}
                    >
                        {renderBlockContent(block)}
                    </Box>
                )}
            </Box>

            {/* Block Actions - Positioned absolutely */}
            {!isGhost && (
                <Box
                    className="block-actions"
                    sx={{
                        position: 'absolute',
                        right: -60,
                        top: 0,
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        display: 'flex',
                        gap: 0.5
                    }}
                >
                    <Tooltip title="Add block below">
                        <IconButton
                            size="small"
                            onClick={() => onAddBlock(columnId, block.id)}
                            sx={{ color: '#666' }}
                        >
                            <AddIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete block">
                        <IconButton
                            size="small"
                            onClick={() => onDeleteBlock(block.id, columnId)}
                            sx={{ color: '#666' }}
                        >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}
        </Box>
    );

    if (isGhost) {
        return (
            <Box
                sx={{
                    mb: 1,
                    opacity: 0.4,
                    transform: 'scale(0.99)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    zIndex: 5,
                    border: '2px dashed rgba(35, 131, 226, 0.3)',
                    borderRadius: 1,
                    bgcolor: 'rgba(35, 131, 226, 0.02)'
                }}
            >
                {blockContent}
            </Box>
        );
    }

    return (
        <Draggable draggableId={block.id} index={index}>
            {(provided, snapshot) => (
                <Box
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    sx={{
                        mb: 1,
                        opacity: snapshot.isDragging ? 0.8 : 1,
                        transform: snapshot.isDragging ? 'rotate(2deg) scale(1.02)' : 'none',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        zIndex: snapshot.isDragging ? 1000 : 1
                    }}
                >
                    {blockContent}
                </Box>
            )}
        </Draggable>
    );
};

export default BlockComponent; 