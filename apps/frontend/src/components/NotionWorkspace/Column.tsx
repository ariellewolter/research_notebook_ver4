import React from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    DragHandle as DragHandleIcon,
    Add as AddIcon,
    RemoveCircle as RemoveCircleIcon
} from '@mui/icons-material';
import { Draggable, Droppable, DropResult, DragStart, DragUpdate } from '@hello-pangea/dnd';
import BlockComponent, { Block } from './Block';

export interface Column {
    id: string;
    title: string;
    blocks: Block[];
    width?: number;
    minWidth?: number;
}

interface ColumnProps {
    column: Column;
    index: number;
    isResizing: boolean;
    resizingColumn: string | null;
    dropZoneActive: string | null;
    ghostBlock: { block: Block; columnId: string; index: number } | null;
    isDragging: boolean;
    onUpdateColumnTitle: (columnId: string, title: string) => void;
    onAddBlockToColumn: (columnId: string, afterBlockId?: string) => void;
    onRemoveColumn: (columnId: string) => void;
    onResizeStart: (e: React.MouseEvent, columnId: string) => void;
    onContentChange: (blockId: string, content: string, columnId: string) => void;
    onEditBlock: (blockId: string, columnId: string) => void;
    onSaveBlock: (blockId: string, columnId: string) => void;
    onDeleteBlock: (blockId: string, columnId: string) => void;
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
    fullWidth?: boolean;
}

const ColumnComponent: React.FC<ColumnProps> = ({
    column,
    index,
    isResizing,
    resizingColumn,
    dropZoneActive,
    ghostBlock,
    isDragging,
    onUpdateColumnTitle,
    onAddBlockToColumn,
    onRemoveColumn,
    onResizeStart,
    onContentChange,
    onEditBlock,
    onSaveBlock,
    onDeleteBlock,
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
    renderBlockContent,
    fullWidth
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                opacity: 1,
                transition: 'all 0.2s ease',
                position: 'relative',
                bgcolor: 'transparent',
                borderRadius: 0,
                boxShadow: 'none',
                border: 'none',
                overflow: 'visible',
                '&:hover': {
                    boxShadow: 'none',
                    transform: 'none'
                },
                ...(fullWidth ? {
                    width: '100%',
                    minWidth: 0,
                    maxWidth: '100%',
                } : {
                    minWidth: 280,
                    maxWidth: 600,
                    width: 'auto',
                })
            }}
        >
            {/* Column Content */}
            <Box
                sx={{
                    flex: 1,
                    bgcolor: 'transparent',
                    border: 'none',
                    borderRadius: 0,
                    p: 2,
                    overflow: 'auto',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    // minHeight and height removed for Notion-like dynamic sizing
                }}
                onClick={(e) => {
                    // Create new block when clicking in empty space
                    if (e.target === e.currentTarget && column.blocks.length === 0) {
                        onAddBlockToColumn(column.id);
                    }
                }}
            >
                {/* Droppable area for blocks */}
                <Droppable droppableId={column.id} type="BLOCK">
                    {(provided, snapshot) => (
                        <Box
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            sx={{
                                minHeight: '100%',
                                position: 'relative',
                                zIndex: 2
                            }}
                        >
                            {/* Ghost Block at the beginning */}
                            {ghostBlock && ghostBlock.columnId === column.id && ghostBlock.index === 0 && (
                                <BlockComponent
                                    block={ghostBlock.block}
                                    index={-1}
                                    columnId={column.id}
                                    isGhost={true}
                                    onContentChange={onContentChange}
                                    onEditBlock={onEditBlock}
                                    onSaveBlock={onSaveBlock}
                                    onDeleteBlock={onDeleteBlock}
                                    onAddBlock={onAddBlockToColumn}
                                    onKeyDown={onKeyDown}
                                    onMouseEnter={onMouseEnter}
                                    onMouseLeave={onMouseLeave}
                                    focusedBlockId={focusedBlockId}
                                    hoveredBlockId={hoveredBlockId}
                                    getBlockIcon={getBlockIcon}
                                    getFontSize={getFontSize}
                                    getFontWeight={getFontWeight}
                                    getTextColor={getTextColor}
                                    getPlaceholder={getPlaceholder}
                                    renderBlockContent={renderBlockContent}
                                />
                            )}

                            {/* Regular blocks */}
                            {column.blocks.map((block, blockIndex) => (
                                <React.Fragment key={block.id}>
                                    <BlockComponent
                                        block={block}
                                        index={blockIndex}
                                        columnId={column.id}
                                        onContentChange={onContentChange}
                                        onEditBlock={onEditBlock}
                                        onSaveBlock={onSaveBlock}
                                        onDeleteBlock={onDeleteBlock}
                                        onAddBlock={onAddBlockToColumn}
                                        onKeyDown={onKeyDown}
                                        onMouseEnter={onMouseEnter}
                                        onMouseLeave={onMouseLeave}
                                        focusedBlockId={focusedBlockId}
                                        hoveredBlockId={hoveredBlockId}
                                        getBlockIcon={getBlockIcon}
                                        getFontSize={getFontSize}
                                        getFontWeight={getFontWeight}
                                        getTextColor={getTextColor}
                                        getPlaceholder={getPlaceholder}
                                        renderBlockContent={renderBlockContent}
                                    />

                                    {/* Ghost Block after this block */}
                                    {ghostBlock && ghostBlock.columnId === column.id && ghostBlock.index === blockIndex + 1 && (
                                        <BlockComponent
                                            block={ghostBlock.block}
                                            index={-1}
                                            columnId={column.id}
                                            isGhost={true}
                                            onContentChange={onContentChange}
                                            onEditBlock={onEditBlock}
                                            onSaveBlock={onSaveBlock}
                                            onDeleteBlock={onDeleteBlock}
                                            onAddBlock={onAddBlockToColumn}
                                            onKeyDown={onKeyDown}
                                            onMouseEnter={onMouseEnter}
                                            onMouseLeave={onMouseLeave}
                                            focusedBlockId={focusedBlockId}
                                            hoveredBlockId={hoveredBlockId}
                                            getBlockIcon={getBlockIcon}
                                            getFontSize={getFontSize}
                                            getFontWeight={getFontWeight}
                                            getTextColor={getTextColor}
                                            getPlaceholder={getPlaceholder}
                                            renderBlockContent={renderBlockContent}
                                        />
                                    )}
                                </React.Fragment>
                            ))}

                            {/* Empty column indicator when dragging */}
                            {isDragging && column.blocks.length === 0 && dropZoneActive === column.id && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: 120,
                                        border: '3px dashed #667eea',
                                        borderRadius: 2,
                                        bgcolor: 'rgba(102, 126, 234, 0.08)',
                                        color: '#667eea',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        animation: 'pulse 2s infinite',
                                        position: 'relative',
                                        zIndex: 5,
                                        backdropFilter: 'blur(4px)'
                                    }}
                                >
                                    <Box sx={{ textAlign: 'center' }}>
                                        <AddIcon sx={{ fontSize: 36, mb: 1, opacity: 0.8 }} />
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            Drop block here
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}
                </Droppable>
            </Box>
            {/* Resize Handle - Removed for Notion-like experience */}
        </Box>
    );
};

export default ColumnComponent; 