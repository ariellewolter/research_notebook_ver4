import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    Tooltip,
    Badge,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    Alert,
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Link as LinkIcon,
    Schedule as ScheduleIcon,
    Assignment as TaskIcon,
    Note as NoteIcon,
    Science as ExperimentIcon,
    DragIndicator as DragIcon,
    Warning as WarningIcon,
    CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { TimeBlockData } from './TimeBlock';

export interface DragState {
    isDragging: boolean;
    isResizing: boolean;
    dragType: 'move' | 'resize-top' | 'resize-bottom' | null;
    startY: number;
    originalTop: number;
    originalHeight: number;
    currentY: number;
    snapToGrid: boolean;
}

interface DraggableTimeBlockProps {
    block: TimeBlockData;
    isSelected?: boolean;
    gridHeight: number;
    timeUnit: number;
    startHour: number;
    endHour: number;
    onSelect?: (block: TimeBlockData) => void;
    onEdit?: (block: TimeBlockData) => void;
    onDelete?: (blockId: string) => void;
    onMove?: (blockId: string, newStartTime: string, newEndTime: string) => void;
    onLinkClick?: (entityType: string, entityId: string) => void;
    style?: React.CSSProperties;
    conflictsWithBlocks?: string[]; // IDs of conflicting blocks
    availableExperiments?: Array<{ id: string; title: string; status: string; estimatedDuration?: number }>;
    onRescheduleExperiment?: (experimentId: string, newStartTime: string, newEndTime: string) => void;
}

const DraggableTimeBlock: React.FC<DraggableTimeBlockProps> = ({
    block,
    isSelected = false,
    gridHeight,
    timeUnit,
    startHour,
    endHour,
    onSelect,
    onEdit,
    onDelete,
    onMove,
    onLinkClick,
    style,
    conflictsWithBlocks = [],
    availableExperiments = [],
    onRescheduleExperiment,
}) => {
    const theme = useTheme();
    const blockRef = useRef < HTMLDivElement > (null);
    const [anchorEl, setAnchorEl] = useState < null | HTMLElement > (null);
    const [isHovered, setIsHovered] = useState(false);
    const [dragState, setDragState] = useState < DragState > ({
        isDragging: false,
        isResizing: false,
        dragType: null,
        startY: 0,
        originalTop: 0,
        originalHeight: 0,
        currentY: 0,
        snapToGrid: true,
    });
    const [rescheduleDialog, setRescheduleDialog] = useState(false);
    const [selectedExperiment, setSelectedExperiment] = useState('');
    const [dragPreview, setDragPreview] = useState < {
        show: boolean;
        top: number;
        height: number;
        isValid: boolean;
        newStartTime?: string;
        newEndTime?: string;
        conflicts?: string[];
    } > ({ show: false, top: 0, height: 0, isValid: true });

    // Calculate block dimensions
    const startTime = new Date(block.startTime);
    const endTime = new Date(block.endTime);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const blockHeight = Math.max((durationMinutes / timeUnit) * gridHeight, 40);

    // Calculate position within grid
    const getBlockPosition = () => {
        const blockStartMinutes = startTime.getHours() * 60 + startTime.getMinutes();
        const gridStartMinutes = startHour * 60;
        const relativeStartMinutes = blockStartMinutes - gridStartMinutes;
        const top = (relativeStartMinutes / timeUnit) * gridHeight;
        return { top, height: blockHeight };
    };

    const position = getBlockPosition();

    // Snap position to grid
    const snapToTimeGrid = (yPosition: number) => {
        const slotHeight = gridHeight;
        const snappedSlot = Math.round(yPosition / slotHeight);
        return snappedSlot * slotHeight;
    };

    // Convert Y position to time
    const yPositionToTime = (yPos: number, date: Date = new Date(block.startTime)) => {
        const gridStartMinutes = startHour * 60;
        const relativeMinutes = (yPos / gridHeight) * timeUnit;
        const totalMinutes = gridStartMinutes + relativeMinutes;

        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);

        const newTime = new Date(date);
        newTime.setHours(hours, minutes, 0, 0);
        return newTime;
    };

    // Check for conflicts with other blocks
    const checkConflicts = (newStartTime: Date, newEndTime: Date): string[] => {
        // Mock conflict detection - replace with actual logic
        const conflicts = [];

        // Check if the new time overlaps with existing blocks
        const newStart = newStartTime.getTime();
        const newEnd = newEndTime.getTime();

        // Simulate some conflicts for demo
        if (newStartTime.getHours() === 12 && newStartTime.getMinutes() === 0) {
            conflicts.push('Lunch break conflict');
        }
        if (newStartTime.getHours() < 8 || newEndTime.getHours() > 18) {
            conflicts.push('Outside working hours');
        }

        return conflicts;
    };

    // Mouse event handlers for dragging
    const handleMouseDown = (e: React.MouseEvent, dragType: 'move' | 'resize-top' | 'resize-bottom') => {
        if (!blockRef.current) return;

        e.preventDefault();
        e.stopPropagation();

        const rect = blockRef.current.getBoundingClientRect();
        const startY = e.clientY;

        setDragState({
            isDragging: dragType === 'move',
            isResizing: dragType.startsWith('resize'),
            dragType,
            startY,
            originalTop: position.top,
            originalHeight: blockHeight,
            currentY: startY,
            snapToGrid: true,
        });

        // Add global mouse event listeners
        const handleMouseMove = (e: MouseEvent) => {
            const deltaY = e.clientY - startY;
            const currentY = e.clientY;

            setDragState(prev => ({ ...prev, currentY }));

            if (dragType === 'move') {
                const newTop = dragState.snapToGrid ?
                    snapToTimeGrid(position.top + deltaY) :
                    position.top + deltaY;

                const newStartTime = yPositionToTime(newTop);
                const newEndTime = new Date(newStartTime.getTime() + durationMinutes * 60 * 1000);
                const conflicts = checkConflicts(newStartTime, newEndTime);

                setDragPreview({
                    show: true,
                    top: newTop,
                    height: blockHeight,
                    isValid: conflicts.length === 0,
                    newStartTime: newStartTime.toISOString(),
                    newEndTime: newEndTime.toISOString(),
                    conflicts,
                });
            } else if (dragType === 'resize-bottom') {
                const newHeight = Math.max(40, blockHeight + deltaY);
                const newDuration = (newHeight / gridHeight) * timeUnit;
                const newEndTime = new Date(startTime.getTime() + newDuration * 60 * 1000);
                const conflicts = checkConflicts(startTime, newEndTime);

                setDragPreview({
                    show: true,
                    top: position.top,
                    height: newHeight,
                    isValid: conflicts.length === 0,
                    newStartTime: block.startTime,
                    newEndTime: newEndTime.toISOString(),
                    conflicts,
                });
            } else if (dragType === 'resize-top') {
                const newTop = dragState.snapToGrid ?
                    snapToTimeGrid(position.top + deltaY) :
                    position.top + deltaY;
                const newHeight = blockHeight + (position.top - newTop);

                if (newHeight >= 40) {
                    const newStartTime = yPositionToTime(newTop);
                    const conflicts = checkConflicts(newStartTime, endTime);

                    setDragPreview({
                        show: true,
                        top: newTop,
                        height: newHeight,
                        isValid: conflicts.length === 0,
                        newStartTime: newStartTime.toISOString(),
                        newEndTime: block.endTime,
                        conflicts,
                    });
                }
            }
        };

        const handleMouseUp = () => {
            if (dragPreview.show && dragPreview.isValid && onMove) {
                onMove(
                    block.id,
                    dragPreview.newStartTime!,
                    dragPreview.newEndTime!
                );
            }

            setDragState({
                isDragging: false,
                isResizing: false,
                dragType: null,
                startY: 0,
                originalTop: 0,
                originalHeight: 0,
                currentY: 0,
                snapToGrid: true,
            });
            setDragPreview({ show: false, top: 0, height: 0, isValid: true });

            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Get type-specific styling
    const getTypeStyle = () => {
        const baseStyles = {
            task: {
                backgroundColor: theme.palette.primary.light,
                borderColor: theme.palette.primary.main,
                icon: <TaskIcon fontSize="small" />
            },
            note: {
                backgroundColor: theme.palette.info.light,
                borderColor: theme.palette.info.main,
                icon: <NoteIcon fontSize="small" />
            },
            experiment: {
                backgroundColor: theme.palette.secondary.light,
                borderColor: theme.palette.secondary.main,
                icon: <ExperimentIcon fontSize="small" />
            },
            meeting: {
                backgroundColor: theme.palette.warning.light,
                borderColor: theme.palette.warning.main,
                icon: <ScheduleIcon fontSize="small" />
            },
            break: {
                backgroundColor: theme.palette.grey[200],
                borderColor: theme.palette.grey[400],
                icon: <ScheduleIcon fontSize="small" />
            },
            focus: {
                backgroundColor: theme.palette.success.light,
                borderColor: theme.palette.success.main,
                icon: <ScheduleIcon fontSize="small" />
            },
            custom: {
                backgroundColor: block.color || theme.palette.grey[200],
                borderColor: block.color || theme.palette.grey[400],
                icon: <ScheduleIcon fontSize="small" />
            }
        };
        return baseStyles[block.type] || baseStyles.custom;
    };

    // Get status styling
    const getStatusStyle = () => {
        switch (block.status) {
            case 'completed':
                return { opacity: 0.7, textDecoration: 'line-through' };
            case 'cancelled':
                return { opacity: 0.5, filter: 'grayscale(0.5)' };
            case 'overdue':
                return {
                    borderLeftWidth: 4,
                    borderLeftColor: theme.palette.error.main,
                    backgroundColor: theme.palette.error.light
                };
            case 'in-progress':
                return {
                    boxShadow: `0 0 8px ${theme.palette.primary.main}`,
                    borderWidth: 2
                };
            default:
                return {};
        }
    };

    const typeStyle = getTypeStyle();
    const statusStyle = getStatusStyle();
    const hasConflicts = conflictsWithBlocks.length > 0;

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleBlockClick = () => {
        if (!dragState.isDragging && !dragState.isResizing) {
            onSelect?.(block);
        }
    };

    const handleEdit = () => {
        handleMenuClose();
        onEdit?.(block);
    };

    const handleDelete = () => {
        handleMenuClose();
        onDelete?.(block.id);
    };

    const handleLinkClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (block.linkedEntityId && block.linkedEntityType) {
            onLinkClick?.(block.linkedEntityType, block.linkedEntityId);
        }
    };

    const handleRescheduleExperiment = () => {
        handleMenuClose();
        setRescheduleDialog(true);
    };

    const handleConfirmReschedule = () => {
        if (selectedExperiment && onRescheduleExperiment) {
            const selectedExp = availableExperiments.find(exp => exp.id === selectedExperiment);
            if (selectedExp) {
                const newEndTime = new Date(startTime.getTime() + (selectedExp.estimatedDuration || 60) * 60 * 1000);
                onRescheduleExperiment(selectedExperiment, block.startTime, newEndTime.toISOString());
            }
        }
        setRescheduleDialog(false);
        setSelectedExperiment('');
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getPriorityColor = () => {
        switch (block.priority) {
            case 'urgent': return theme.palette.error.main;
            case 'high': return theme.palette.warning.main;
            case 'normal': return theme.palette.info.main;
            case 'low': return theme.palette.grey[500];
            default: return theme.palette.grey[500];
        }
    };

    return (
        <>
            {/* Drag Preview */}
            {dragPreview.show && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: dragPreview.top,
                        left: 0,
                        right: 0,
                        height: dragPreview.height,
                        backgroundColor: dragPreview.isValid ?
                            theme.palette.primary.light + '60' :
                            theme.palette.error.light + '60',
                        border: `2px dashed ${dragPreview.isValid ?
                            theme.palette.primary.main :
                            theme.palette.error.main}`,
                        borderRadius: 1,
                        zIndex: 1000,
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Box textAlign="center">
                        {dragPreview.isValid ? (
                            <SuccessIcon sx={{ color: theme.palette.primary.main, mb: 0.5 }} />
                        ) : (
                            <WarningIcon sx={{ color: theme.palette.error.main, mb: 0.5 }} />
                        )}
                        <Typography variant="caption" display="block">
                            {dragPreview.newStartTime && formatTime(dragPreview.newStartTime)} -
                            {dragPreview.newEndTime && formatTime(dragPreview.newEndTime)}
                        </Typography>
                        {dragPreview.conflicts && dragPreview.conflicts.length > 0 && (
                            <Typography variant="caption" color="error" display="block">
                                {dragPreview.conflicts.join(', ')}
                            </Typography>
                        )}
                    </Box>
                </Box>
            )}

            {/* Main Time Block */}
            <Card
                ref={blockRef}
                sx={{
                    height: blockHeight,
                    minHeight: 40,
                    position: 'relative',
                    cursor: dragState.isDragging ? 'grabbing' : 'grab',
                    transition: dragState.isDragging ? 'none' : 'all 0.2s ease-in-out',
                    border: `2px solid ${typeStyle.borderColor}`,
                    backgroundColor: typeStyle.backgroundColor,
                    '&:hover': !dragState.isDragging ? {
                        transform: 'translateY(-1px)',
                        boxShadow: theme.shadows[4],
                        borderColor: theme.palette.primary.main,
                    } : {},
                    ...(isSelected && {
                        borderColor: theme.palette.primary.main,
                        boxShadow: theme.shadows[8],
                        transform: 'translateY(-1px)',
                    }),
                    ...(dragState.isDragging && {
                        opacity: 0.8,
                        transform: 'rotate(1deg)',
                        boxShadow: theme.shadows[12],
                        zIndex: 1001,
                    }),
                    ...(hasConflicts && {
                        borderColor: theme.palette.warning.main,
                        backgroundColor: theme.palette.warning.light + '40',
                    }),
                    ...statusStyle,
                    ...style,
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleBlockClick}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
            >
                <CardContent sx={{
                    padding: '8px 12px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:last-child': { paddingBottom: '8px' }
                }}>
                    {/* Header */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                            {typeStyle.icon}
                            <Badge
                                variant="dot"
                                sx={{
                                    '& .MuiBadge-badge': {
                                        backgroundColor: getPriorityColor(),
                                        width: 6,
                                        height: 6,
                                        minWidth: 6,
                                    }
                                }}
                            >
                                <Typography variant="caption" color="textSecondary">
                                    {formatTime(block.startTime)}
                                </Typography>
                            </Badge>
                            {block.isRecurring && (
                                <Chip
                                    label="R"
                                    size="small"
                                    sx={{
                                        height: 16,
                                        minWidth: 16,
                                        fontSize: '0.6rem',
                                        backgroundColor: 'rgba(0,0,0,0.1)'
                                    }}
                                />
                            )}
                            {hasConflicts && (
                                <Tooltip title={`Conflicts with: ${conflictsWithBlocks.join(', ')}`}>
                                    <WarningIcon
                                        fontSize="small"
                                        sx={{ color: theme.palette.warning.main }}
                                    />
                                </Tooltip>
                            )}
                        </Box>

                        <Box display="flex" alignItems="center" gap={0.5}>
                            {block.linkedEntityId && (
                                <Tooltip title={`Linked ${block.linkedEntityType}`}>
                                    <IconButton
                                        size="small"
                                        onClick={handleLinkClick}
                                        sx={{ padding: 0.25 }}
                                    >
                                        <LinkIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {(isHovered || isSelected) && !dragState.isDragging && (
                                <>
                                    <Tooltip title="Drag to move">
                                        <DragIcon
                                            fontSize="small"
                                            sx={{
                                                cursor: 'grab',
                                                opacity: 0.6,
                                                '&:hover': { opacity: 1 }
                                            }}
                                        />
                                    </Tooltip>
                                    <IconButton
                                        size="small"
                                        onClick={handleMenuOpen}
                                        sx={{ padding: 0.25 }}
                                    >
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                </>
                            )}
                        </Box>
                    </Box>

                    {/* Title */}
                    <Typography
                        variant="body2"
                        fontWeight="medium"
                        sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: blockHeight > 60 ? 2 : 1,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.2,
                            flex: 1,
                        }}
                        title={block.title}
                    >
                        {block.title}
                    </Typography>

                    {/* Duration & Description */}
                    {blockHeight > 50 && (
                        <Box mt={0.5}>
                            <Typography variant="caption" color="textSecondary">
                                {Math.round(durationMinutes)}min
                            </Typography>
                            {block.description && blockHeight > 80 && (
                                <Typography
                                    variant="caption"
                                    color="textSecondary"
                                    sx={{
                                        display: 'block',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        mt: 0.25
                                    }}
                                    title={block.description}
                                >
                                    {block.description}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Tags */}
                    {block.tags && block.tags.length > 0 && blockHeight > 100 && (
                        <Box display="flex" flexWrap="wrap" gap={0.25} mt={0.5}>
                            {block.tags.slice(0, 2).map((tag, index) => (
                                <Chip
                                    key={index}
                                    label={tag}
                                    size="small"
                                    sx={{
                                        height: 16,
                                        fontSize: '0.6rem',
                                        backgroundColor: 'rgba(0,0,0,0.1)'
                                    }}
                                />
                            ))}
                            {block.tags.length > 2 && (
                                <Chip
                                    label={`+${block.tags.length - 2}`}
                                    size="small"
                                    sx={{
                                        height: 16,
                                        fontSize: '0.6rem',
                                        backgroundColor: 'rgba(0,0,0,0.1)'
                                    }}
                                />
                            )}
                        </Box>
                    )}
                </CardContent>

                {/* Context Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{
                        sx: { minWidth: 160 }
                    }}
                >
                    <MenuItem onClick={handleEdit}>
                        <EditIcon fontSize="small" sx={{ mr: 1 }} />
                        Edit Block
                    </MenuItem>
                    {block.linkedEntityId && (
                        <MenuItem onClick={handleLinkClick}>
                            <LinkIcon fontSize="small" sx={{ mr: 1 }} />
                            View Linked {block.linkedEntityType}
                        </MenuItem>
                    )}
                    {block.type === 'experiment' && availableExperiments.length > 0 && (
                        <MenuItem onClick={handleRescheduleExperiment}>
                            <ExperimentIcon fontSize="small" sx={{ mr: 1 }} />
                            Reschedule Experiment
                        </MenuItem>
                    )}
                    <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                        <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                        Delete Block
                    </MenuItem>
                </Menu>

                {/* Resize Handles */}
                {(isHovered || isSelected) && !dragState.isDragging && (
                    <>
                        {/* Top resize handle */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -2,
                                left: 0,
                                right: 0,
                                height: 6,
                                cursor: 'ns-resize',
                                backgroundColor: 'transparent',
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.main + '40',
                                }
                            }}
                            onMouseDown={(e) => handleMouseDown(e, 'resize-top')}
                        />
                        {/* Bottom resize handle */}
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: -2,
                                left: 0,
                                right: 0,
                                height: 6,
                                cursor: 'ns-resize',
                                backgroundColor: 'transparent',
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.main + '40',
                                }
                            }}
                            onMouseDown={(e) => handleMouseDown(e, 'resize-bottom')}
                        />
                    </>
                )}
            </Card>

            {/* Experiment Reschedule Dialog */}
            <Dialog
                open={rescheduleDialog}
                onClose={() => setRescheduleDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Reschedule Experiment in Time Block
                </DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Select a different experiment to schedule in this time slot, or choose the same experiment to confirm the current scheduling.
                    </Alert>

                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Select Experiment</InputLabel>
                        <Select
                            value={selectedExperiment}
                            onChange={(e) => setSelectedExperiment(e.target.value)}
                            label="Select Experiment"
                        >
                            {availableExperiments.map((exp) => (
                                <MenuItem key={exp.id} value={exp.id}>
                                    <Box>
                                        <Typography variant="body2" fontWeight="medium">
                                            {exp.title}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Status: {exp.status} | Duration: {exp.estimatedDuration || 'Unknown'}min
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ mt: 2, p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                            <strong>Current Time Slot:</strong><br />
                            {formatTime(block.startTime)} - {formatTime(block.endTime)}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRescheduleDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmReschedule}
                        variant="contained"
                        disabled={!selectedExperiment}
                    >
                        Reschedule Experiment
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default DraggableTimeBlock; 