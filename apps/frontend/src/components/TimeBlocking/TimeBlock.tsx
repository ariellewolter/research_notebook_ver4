import React, { useState, useRef } from 'react';
import { 
    Box, 
    Typography, 
    Chip, 
    IconButton, 
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Assignment as TaskIcon,
    Note as NoteIcon,
    Science as ExperimentIcon,
    Event as EventIcon,
    Schedule as ScheduleIcon,
    Link as LinkIcon
} from '@mui/icons-material';

export interface TimeBlockData {
    id: string;
    title: string;
    type: 'task' | 'note' | 'experiment' | 'meeting' | 'break' | 'focus' | 'custom';
    startTime: string; // ISO string
    endTime: string; // ISO string
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'overdue';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    description?: string;
    linkedEntityId?: string;
    linkedEntityType?: 'task' | 'note' | 'experiment' | 'project';
    tags?: string[];
    isRecurring?: boolean;
    recurrencePattern?: string;
    color?: string;
}

interface TimeBlockProps {
    block: TimeBlockData;
    isSelected?: boolean;
    timeUnit?: number;
    gridHeight?: number;
    onSelect?: (block: TimeBlockData) => void;
    onEdit?: (block: TimeBlockData) => void;
    onDelete?: (blockId: string) => void;
    onResize?: (blockId: string, newStartTime: string, newEndTime: string) => void;
    onMove?: (blockId: string, newStartTime: string) => void;
    onLinkClick?: (entityType: string, entityId: string) => void;
}

const TimeBlock: React.FC<TimeBlockProps> = ({ 
    block, 
    isSelected = false,
    timeUnit = 15,
    gridHeight = 60,
    onSelect,
    onEdit,
    onDelete,
    onResize,
    onMove,
    onLinkClick
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragRef = useRef<HTMLDivElement>(null);
    const resizeRef = useRef<HTMLDivElement>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'task': return <TaskIcon fontSize="small" />;
            case 'note': return <NoteIcon fontSize="small" />;
            case 'experiment': return <ExperimentIcon fontSize="small" />;
            case 'meeting': return <EventIcon fontSize="small" />;
            case 'break': return <ScheduleIcon fontSize="small" />;
            case 'focus': return <ScheduleIcon fontSize="small" />;
            default: return <ScheduleIcon fontSize="small" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'task': return '#1976d2';
            case 'note': return '#388e3c';
            case 'experiment': return '#f57c00';
            case 'meeting': return '#7b1fa2';
            case 'break': return '#757575';
            case 'focus': return '#2e7d32';
            default: return '#757575';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return '#d32f2f';
            case 'high': return '#f57c00';
            case 'normal': return '#1976d2';
            case 'low': return '#388e3c';
            default: return '#757575';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#388e3c';
            case 'in-progress': return '#1976d2';
            case 'overdue': return '#d32f2f';
            case 'cancelled': return '#757575';
            default: return '#757575';
        }
    };

    const formatTime = (time: string) => {
        const date = new Date(time);
        const hour = date.getHours();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const calculateBlockHeight = () => {
        const start = new Date(block.startTime);
        const end = new Date(block.endTime);
        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        return Math.max(gridHeight, (durationMinutes / timeUnit) * 15);
    };

    const blockHeight = calculateBlockHeight();

    return (
        <Box
            ref={dragRef}
            sx={{
                position: 'absolute',
                width: '95%',
                height: `${blockHeight}px`,
                backgroundColor: block.color || getTypeColor(block.type),
                borderRadius: 1,
                p: 1,
                cursor: 'pointer',
                border: isSelected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)',
                boxShadow: isSelected ? '0 4px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease',
                '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
                opacity: block.status === 'cancelled' ? 0.6 : 1,
            }}
            onClick={() => onSelect && onSelect(block)}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {getTypeIcon(block.type)}
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            lineHeight: 1
                        }}
                    >
                        {block.title}
                    </Typography>
                </Box>
                
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e);
                    }}
                    sx={{ 
                        color: 'white', 
                        p: 0,
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                    }}
                >
                    <MoreVertIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography 
                    variant="caption" 
                    sx={{ 
                        color: 'rgba(255,255,255,0.9)', 
                        fontSize: '0.7rem',
                        lineHeight: 1.2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}
                >
                    {block.description || `${formatTime(block.startTime)} - ${formatTime(block.endTime)}`}
                </Typography>
            </Box>

            {/* Footer */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {block.priority && (
                        <Chip
                            label={block.priority}
                            size="small"
                            sx={{
                                backgroundColor: getPriorityColor(block.priority),
                                color: 'white',
                                fontSize: '0.6rem',
                                height: '16px',
                                '& .MuiChip-label': { px: 0.5 }
                            }}
                        />
                    )}
                    
                    {block.status && (
                        <Chip
                            label={block.status}
                            size="small"
                            variant="outlined"
                            sx={{
                                borderColor: 'rgba(255,255,255,0.5)',
                                color: 'white',
                                fontSize: '0.6rem',
                                height: '16px',
                                '& .MuiChip-label': { px: 0.5 }
                            }}
                        />
                    )}
                </Box>

                {block.linkedEntityId && (
                    <Tooltip title={`View linked ${block.linkedEntityType}`}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onLinkClick && onLinkClick(block.linkedEntityType!, block.linkedEntityId!);
                            }}
                            sx={{ 
                                color: 'white', 
                                p: 0,
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            <LinkIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {/* Resize handle */}
            <Box
                ref={resizeRef}
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    cursor: 'ns-resize',
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.6)',
                    }
                }}
            />

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
            >
                <MenuItem onClick={() => {
                    onEdit && onEdit(block);
                    handleMenuClose();
                }}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => {
                    onDelete && onDelete(block.id);
                    handleMenuClose();
                }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default TimeBlock; 