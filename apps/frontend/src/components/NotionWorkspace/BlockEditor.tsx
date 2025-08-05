import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    Chip,
    Button,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    Add as AddIcon,
    DragIndicator as DragIcon,
    MoreVert as MoreIcon,
    Delete as DeleteIcon,
    ContentCopy as CopyIcon,
    FormatBold as BoldIcon,
    FormatItalic as ItalicIcon,
    FormatUnderlined as UnderlineIcon,
    Code as CodeIcon,
    Link as LinkIcon,
} from '@mui/icons-material';
import { useDrag, useDrop } from 'react-dnd';
import { Block } from './types';
import FreeformDrawingBlock, { DrawingData } from '../blocks/FreeformDrawingBlock';

interface BlockEditorProps {
    block: Block;
    index: number;
    onUpdate: (blockId: string, content: any) => void;
    onDelete: (blockId: string) => void;
    onDuplicate: (blockId: string) => void;
    onMove: (dragIndex: number, hoverIndex: number) => void;
    onAddBlock: (afterIndex: number, type: Block['type']) => void;
}

const BlockEditor: React.FC<BlockEditorProps> = ({
    block,
    index,
    onUpdate,
    onDelete,
    onDuplicate,
    onMove,
    onAddBlock,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showBlockMenu, setShowBlockMenu] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Drag and drop setup
    const [{ isDragging }, drag] = useDrag({
        type: 'block',
        item: { index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [, drop] = useDrop({
        accept: 'block',
        hover: (item: { index: number }) => {
            if (!ref.current) return;
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) return;
            onMove(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    drag(drop(ref));

    const handleContentChange = (newContent: any) => {
        onUpdate(block.id, newContent);
    };

    const renderBlockContent = () => {
        switch (block.type) {
            case 'text':
                return (
                    <TextField
                        fullWidth
                        multiline
                        variant="standard"
                        placeholder="Type something..."
                        value={block.content.text || ''}
                        onChange={(e) => handleContentChange({ ...block.content, text: e.target.value })}
                        InputProps={{
                            disableUnderline: true,
                            sx: { fontSize: '14px', lineHeight: 1.6 }
                        }}
                        onFocus={() => setIsEditing(true)}
                        onBlur={() => setIsEditing(false)}
                    />
                );

            case 'heading':
                return (
                    <TextField
                        fullWidth
                        variant="standard"
                        placeholder="Heading"
                        value={block.content.text || ''}
                        onChange={(e) => handleContentChange({ ...block.content, text: e.target.value })}
                        InputProps={{
                            disableUnderline: true,
                            sx: { 
                                fontSize: block.content.level === 1 ? '28px' : block.content.level === 2 ? '24px' : '20px',
                                fontWeight: 600 
                            }
                        }}
                        onFocus={() => setIsEditing(true)}
                        onBlur={() => setIsEditing(false)}
                    />
                );

            case 'protocol':
                return (
                    <Paper sx={{ p: 2, bgcolor: 'primary.50', border: 1, borderColor: 'primary.200' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Chip icon={<CodeIcon />} label="Protocol" color="primary" size="small" />
                            <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 600 }}>
                                {block.content.title || 'Untitled Protocol'}
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            placeholder="Protocol title"
                            value={block.content.title || ''}
                            onChange={(e) => handleContentChange({ ...block.content, title: e.target.value })}
                            variant="standard"
                            InputProps={{ disableUnderline: true }}
                            sx={{ mb: 1 }}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            placeholder="Protocol steps..."
                            value={block.content.steps || ''}
                            onChange={(e) => handleContentChange({ ...block.content, steps: e.target.value })}
                            variant="outlined"
                            size="small"
                        />
                    </Paper>
                );

            case 'note':
                return (
                    <Paper sx={{ p: 2, bgcolor: 'success.50', border: 1, borderColor: 'success.200' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Chip icon={<AddIcon />} label="Note" color="success" size="small" />
                            <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 600 }}>
                                {block.content.title || 'Untitled Note'}
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            placeholder="Note title"
                            value={block.content.title || ''}
                            onChange={(e) => handleContentChange({ ...block.content, title: e.target.value })}
                            variant="standard"
                            InputProps={{ disableUnderline: true }}
                            sx={{ mb: 1 }}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Note content..."
                            value={block.content.text || ''}
                            onChange={(e) => handleContentChange({ ...block.content, text: e.target.value })}
                            variant="outlined"
                            size="small"
                        />
                    </Paper>
                );

            case 'pdf':
                return (
                    <Paper sx={{ p: 2, bgcolor: 'error.50', border: 1, borderColor: 'error.200' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Chip icon={<AddIcon />} label="PDF" color="error" size="small" />
                            <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 600 }}>
                                {block.content.filename || 'No PDF selected'}
                            </Typography>
                        </Box>
                        <Button variant="outlined" size="small" component="label">
                            Upload PDF
                            <input type="file" accept=".pdf" hidden onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    handleContentChange({ ...block.content, filename: file.name, file });
                                }
                            }} />
                        </Button>
                        {block.content.filename && (
                            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                📄 {block.content.filename}
                            </Typography>
                        )}
                    </Paper>
                );

            case 'callout':
                return (
                    <Paper sx={{ 
                        p: 2, 
                        bgcolor: block.content.type === 'warning' ? 'warning.50' : 'info.50',
                        border: 1, 
                        borderColor: block.content.type === 'warning' ? 'warning.200' : 'info.200',
                        borderLeft: 4,
                        borderLeftColor: block.content.type === 'warning' ? 'warning.main' : 'info.main'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
                                <Select
                                    value={block.content.type || 'info'}
                                    onChange={(e) => handleContentChange({ ...block.content, type: e.target.value })}
                                >
                                    <MenuItem value="info">💡 Info</MenuItem>
                                    <MenuItem value="warning">⚠️ Warning</MenuItem>
                                    <MenuItem value="success">✅ Success</MenuItem>
                                    <MenuItem value="error">❌ Error</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Callout content..."
                            value={block.content.text || ''}
                            onChange={(e) => handleContentChange({ ...block.content, text: e.target.value })}
                            variant="standard"
                            InputProps={{ disableUnderline: true }}
                        />
                    </Paper>
                );

            case 'divider':
                return (
                    <Box sx={{ py: 2 }}>
                        <Box sx={{ 
                            height: 1, 
                            bgcolor: 'divider',
                            width: '100%'
                        }} />
                    </Box>
                );

            case 'freeform-drawing':
                return (
                    <Paper sx={{ p: 2, bgcolor: 'info.50', border: 1, borderColor: 'info.200' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Chip label="Drawing" color="info" size="small" />
                            <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 600 }}>
                                Freeform Drawing Block
                            </Typography>
                        </Box>
                        <FreeformDrawingBlock
                            blockId={block.id}
                            entityId={block.content?.entityId || 'unknown'}
                            entityType={block.content?.entityType || 'note'}
                            onSave={(drawingData: DrawingData) => {
                                handleContentChange({
                                    ...block.content,
                                    drawingData,
                                    entityId: block.content?.entityId || 'unknown',
                                    entityType: block.content?.entityType || 'note'
                                });
                            }}
                            initialData={block.content?.drawingData}
                            width={block.content?.width || 600}
                            height={block.content?.height || 400}
                        />
                    </Paper>
                );

            default:
                return (
                    <Typography color="text.secondary">
                        Unknown block type: {block.type}
                    </Typography>
                );
        }
    };

    const blockTypeOptions = [
        { value: 'text', label: '📝 Text', description: 'Plain text paragraph' },
        { value: 'heading', label: '📋 Heading', description: 'Section heading' },
        { value: 'protocol', label: '🧪 Protocol', description: 'Lab protocol block' },
        { value: 'note', label: '📄 Note', description: 'Research note' },
        { value: 'pdf', label: '📎 PDF', description: 'PDF document' },
        { value: 'callout', label: '💡 Callout', description: 'Highlighted box' },
        { value: 'divider', label: '➖ Divider', description: 'Section separator' },
        { value: 'code', label: '💻 Code', description: 'Code block' },
        { value: 'equation', label: '🔢 Equation', description: 'Math equation' },
        { value: 'freeform-drawing', label: '🎨 Drawing', description: 'Freeform drawing canvas' },
    ];

    return (
        <Box
            ref={ref}
            sx={{
                position: 'relative',
                opacity: isDragging ? 0.5 : 1,
                mb: 1,
                group: 'block',
                '&:hover .block-controls': {
                    opacity: 1,
                },
            }}
            onMouseEnter={() => setIsEditing(true)}
            onMouseLeave={() => !anchorEl && setIsEditing(false)}
        >
            {/* Block Controls */}
            <Box
                className="block-controls"
                sx={{
                    position: 'absolute',
                    left: -40,
                    top: 0,
                    opacity: isEditing ? 1 : 0,
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                }}
            >
                <IconButton size="small" sx={{ cursor: 'grab' }}>
                    <DragIcon fontSize="small" />
                </IconButton>
                <IconButton 
                    size="small" 
                    onClick={() => setShowBlockMenu(true)}
                >
                    <AddIcon fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                    <MoreIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Block Content */}
            <Box sx={{ pl: 2 }}>
                {renderBlockContent()}
            </Box>

            {/* Block Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem onClick={() => { onDuplicate(block.id); setAnchorEl(null); }}>
                    <CopyIcon sx={{ mr: 1 }} />
                    Duplicate
                </MenuItem>
                <MenuItem onClick={() => { onDelete(block.id); setAnchorEl(null); }}>
                    <DeleteIcon sx={{ mr: 1 }} />
                    Delete
                </MenuItem>
            </Menu>

            {/* Add Block Menu */}
            <Menu
                anchorEl={showBlockMenu ? ref.current : null}
                open={showBlockMenu}
                onClose={() => setShowBlockMenu(false)}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                {blockTypeOptions.map((option) => (
                    <MenuItem
                        key={option.value}
                        onClick={() => {
                            onAddBlock(index, option.value as Block['type']);
                            setShowBlockMenu(false);
                        }}
                    >
                        <Box>
                            <Typography variant="body2">{option.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {option.description}
                            </Typography>
                        </Box>
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
};

export default BlockEditor; 