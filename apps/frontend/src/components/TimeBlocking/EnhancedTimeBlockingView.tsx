import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Typography,
    Paper,
    Alert,
    Snackbar,
    CircularProgress,
    Fab,
    SpeedDial,
    SpeedDialAction,
    SpeedDialIcon,
    Switch,
    FormControlLabel,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Assignment as TaskIcon,
    Note as NoteIcon,
    Science as ExperimentIcon,
    Schedule as ScheduleIcon,
    Settings as SettingsIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    Delete as DeleteIcon,
    Link as LinkIcon,
    AutoAwesome as AIIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// import TimeGrid from './TimeGrid';
// import TimeViewSwitcher, { TimeView } from './TimeViewSwitcher';
// import MonthlyView from './MonthlyView';
import DraggableTimeBlock from './DraggableTimeBlock';

// Temporary type definition
type TimeView = 'daily' | 'weekly' | 'monthly';
import AITaskSuggestions, { UnallocatedTask } from './AITaskSuggestions';
import { TimeBlockData } from './TimeBlock';

// Mock API functions - replace with actual API calls
import { tasksApi, notesApi, projectsApi, experimentsApi } from '../services/api';

interface EnhancedTimeBlockingViewProps {
    // Integration props
    onNavigateToTask?: (taskId: string) => void;
    onNavigateToNote?: (noteId: string) => void;
    onNavigateToExperiment?: (experimentId: string) => void;
    onNavigateToProject?: (projectId: string) => void;
}

interface BlockFormData {
    title: string;
    type: 'task' | 'note' | 'experiment' | 'meeting' | 'break' | 'focus' | 'custom';
    startTime: Date;
    endTime: Date;
    description: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    linkedEntityId?: string;
    linkedEntityType?: 'task' | 'note' | 'experiment' | 'project';
    tags: string[];
    isRecurring: boolean;
    recurrencePattern?: string;
    color?: string;
}

const EnhancedTimeBlockingView: React.FC<EnhancedTimeBlockingViewProps> = ({
    onNavigateToTask,
    onNavigateToNote,
    onNavigateToExperiment,
    onNavigateToProject,
}) => {
    const theme = useTheme();

    // State management
    const [currentView, setCurrentView] = useState<TimeView>('daily');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [blocks, setBlocks] = useState<TimeBlockData[]>([]);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Dialog states
    const [blockFormOpen, setBlockFormOpen] = useState(false);
    const [editingBlock, setEditingBlock] = useState<TimeBlockData | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // AI Suggestions
    const [unallocatedTasks, setUnallocatedTasks] = useState<UnallocatedTask[]>([]);
    const [aiSuggestionsVisible, setAiSuggestionsVisible] = useState(true);
    const [aiEnabled, setAiEnabled] = useState(true);

    // Settings
    const [timeUnit, setTimeUnit] = useState(30); // minutes
    const [startHour, setStartHour] = useState(6);
    const [endHour, setEndHour] = useState(22);
    const [showWeekends, setShowWeekends] = useState(true);
    const [gridHeight, setGridHeight] = useState(60); // pixels per time unit
    const [enableDragDrop, setEnableDragDrop] = useState(true);

    // Form state
    const [formData, setFormData] = useState<BlockFormData>({
        title: '',
        type: 'custom',
        startTime: new Date(),
        endTime: new Date(),
        description: '',
        priority: 'normal',
        tags: [],
        isRecurring: false,
    });

    // Available entities for linking and rescheduling
    const [availableEntities, setAvailableEntities] = useState<{
        tasks: any[];
        notes: any[];
        experiments: any[];
        projects: any[];
    }>({
        tasks: [],
        notes: [],
        experiments: [],
        projects: [],
    });

    // Notification state
    const [notification, setNotification] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'warning' | 'info';
    }>({ open: false, message: '', severity: 'info' });

    // Load data on mount and date change
    useEffect(() => {
        loadTimeBlocks();
        loadAvailableEntities();
        if (aiEnabled) {
            loadUnallocatedTasks();
        }
    }, [selectedDate, currentView, aiEnabled]);

    // Load time blocks from API/localStorage
    const loadTimeBlocks = async () => {
        setIsLoading(true);
        try {
            // Mock data - replace with actual API call
            const mockBlocks: TimeBlockData[] = [
                {
                    id: '1',
                    title: 'Research literature review',
                    type: 'note',
                    startTime: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 9, 0).toISOString(),
                    endTime: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 10, 30).toISOString(),
                    status: 'scheduled',
                    priority: 'high',
                    description: 'Review papers on CRISPR applications',
                    linkedEntityId: 'note-123',
                    linkedEntityType: 'note',
                    tags: ['research', 'literature'],
                },
                {
                    id: '2',
                    title: 'Lab experiment - PCR',
                    type: 'experiment',
                    startTime: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 14, 0).toISOString(),
                    endTime: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 16, 0).toISOString(),
                    status: 'scheduled',
                    priority: 'urgent',
                    description: 'Run PCR for samples A1-A12',
                    linkedEntityId: 'exp-456',
                    linkedEntityType: 'experiment',
                    tags: ['lab', 'pcr'],
                },
            ];

            setBlocks(mockBlocks);
        } catch (error) {
            showNotification('Failed to load time blocks', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Load unallocated tasks for AI suggestions
    const loadUnallocatedTasks = async () => {
        try {
            // Mock data - replace with actual API call to get unscheduled tasks
            const mockUnallocatedTasks: UnallocatedTask[] = [
                {
                    id: 'task-unalloc-1',
                    title: 'Analyze Western Blot Results',
                    type: 'task',
                    estimatedDuration: 45,
                    priority: 'high',
                    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                    linkedEntityType: 'experiment',
                    linkedEntityId: 'exp-456',
                    tags: ['analysis', 'western-blot'],
                    description: 'Quantify protein expression levels from yesterday\'s blots',
                    suggestedTimes: [
                        { start: '09:00', reason: 'Fresh morning focus for detailed analysis', confidence: 85 },
                        { start: '14:00', reason: 'Post-lunch concentration period', confidence: 75 }
                    ]
                },
                {
                    id: 'task-unalloc-2',
                    title: 'Update Lab Notebook - Cell Culture',
                    type: 'note',
                    estimatedDuration: 30,
                    priority: 'normal',
                    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                    linkedEntityType: 'experiment',
                    linkedEntityId: 'exp-789',
                    tags: ['documentation', 'cell-culture'],
                    description: 'Document passage numbers and cell viability observations',
                    suggestedTimes: [
                        { start: '16:00', reason: 'End-of-day documentation time', confidence: 90 },
                        { start: '10:30', reason: 'After morning literature review', confidence: 70 }
                    ]
                },
                {
                    id: 'task-unalloc-3',
                    title: 'Prepare Reagents for Tomorrow\'s Experiment',
                    type: 'experiment',
                    estimatedDuration: 60,
                    priority: 'urgent',
                    deadline: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000),
                    linkedEntityType: 'experiment',
                    linkedEntityId: 'exp-next',
                    tags: ['preparation', 'reagents'],
                    description: 'Prepare buffers, dilute antibodies, check equipment',
                    suggestedTimes: [
                        { start: '15:00', reason: 'Before lab closing, allows overnight equilibration', confidence: 95 },
                        { start: '17:00', reason: 'Late afternoon prep for next day', confidence: 80 }
                    ]
                },
            ];

            setUnallocatedTasks(mockUnallocatedTasks);
        } catch (error) {
            console.error('Failed to load unallocated tasks:', error);
        }
    };

    // Load available entities for linking
    const loadAvailableEntities = async () => {
        try {
            // Mock data - replace with actual API calls
            setAvailableEntities({
                tasks: [
                    { id: 'task-1', title: 'Complete data analysis', status: 'in_progress' },
                    { id: 'task-2', title: 'Write methodology section', status: 'pending' },
                ],
                notes: [
                    { id: 'note-1', title: 'Literature review notes', type: 'literature' },
                    { id: 'note-2', title: 'Experiment observations', type: 'experiment' },
                ],
                experiments: [
                    { id: 'exp-1', title: 'PCR Optimization', status: 'active' },
                    { id: 'exp-2', title: 'Western Blot Analysis', status: 'planned' },
                ],
                projects: [
                    { id: 'proj-1', title: 'Cancer Cell Study', status: 'active' },
                    { id: 'proj-2', title: 'Drug Screening', status: 'planning' },
                ],
            });
        } catch (error) {
            console.error('Failed to load entities:', error);
        }
    };

    // Show notification
    const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
        setNotification({ open: true, message, severity });
    };

    // Handle block creation
    const handleBlockCreate = (startTime: string, endTime: string, day?: Date) => {
        const start = new Date(startTime);
        const end = new Date(endTime);

        setFormData({
            title: '',
            type: 'custom',
            startTime: start,
            endTime: end,
            description: '',
            priority: 'normal',
            tags: [],
            isRecurring: false,
        });
        setEditingBlock(null);
        setBlockFormOpen(true);
    };

    // Handle block edit
    const handleBlockEdit = (block: TimeBlockData) => {
        setFormData({
            title: block.title,
            type: block.type,
            startTime: new Date(block.startTime),
            endTime: new Date(block.endTime),
            description: block.description || '',
            priority: block.priority,
            linkedEntityId: block.linkedEntityId,
            linkedEntityType: block.linkedEntityType,
            tags: block.tags || [],
            isRecurring: block.isRecurring || false,
            recurrencePattern: block.recurrencePattern,
            color: block.color,
        });
        setEditingBlock(block);
        setBlockFormOpen(true);
    };

    // Handle block save
    const handleBlockSave = async () => {
        try {
            setIsLoading(true);

            const blockData: TimeBlockData = {
                id: editingBlock?.id || `block-${Date.now()}`,
                title: formData.title,
                type: formData.type,
                startTime: formData.startTime.toISOString(),
                endTime: formData.endTime.toISOString(),
                status: editingBlock?.status || 'scheduled',
                priority: formData.priority,
                description: formData.description,
                linkedEntityId: formData.linkedEntityId,
                linkedEntityType: formData.linkedEntityType,
                tags: formData.tags,
                isRecurring: formData.isRecurring,
                recurrencePattern: formData.recurrencePattern,
                color: formData.color,
            };

            if (editingBlock) {
                // Update existing block
                setBlocks(prev => prev.map(b => b.id === editingBlock.id ? blockData : b));
                showNotification('Time block updated successfully', 'success');
            } else {
                // Create new block
                setBlocks(prev => [...prev, blockData]);
                showNotification('Time block created successfully', 'success');
            }

            setBlockFormOpen(false);
            setEditingBlock(null);
        } catch (error) {
            showNotification('Failed to save time block', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle block delete
    const handleBlockDelete = async (blockId: string) => {
        try {
            setBlocks(prev => prev.filter(b => b.id !== blockId));
            showNotification('Time block deleted successfully', 'success');
        } catch (error) {
            showNotification('Failed to delete time block', 'error');
        }
    };

    // Handle block move (for drag and drop)
    const handleBlockMove = async (blockId: string, newStartTime: string, newEndTime: string) => {
        try {
            setBlocks(prev => prev.map(block =>
                block.id === blockId
                    ? { ...block, startTime: newStartTime, endTime: newEndTime }
                    : block
            ));
            showNotification('Time block moved successfully', 'success');
        } catch (error) {
            showNotification('Failed to move time block', 'error');
        }
    };

    // Handle entity link click
    const handleEntityLinkClick = (entityType: string, entityId: string) => {
        switch (entityType) {
            case 'task':
                onNavigateToTask?.(entityId);
                break;
            case 'note':
                onNavigateToNote?.(entityId);
                break;
            case 'experiment':
                onNavigateToExperiment?.(entityId);
                break;
            case 'project':
                onNavigateToProject?.(entityId);
                break;
        }
    };

    // Handle AI task scheduling
    const handleTaskSchedule = (task: UnallocatedTask, startTime: string, endTime: string) => {
        // Create a new time block from the AI suggestion
        const newBlock: TimeBlockData = {
            id: `block-${Date.now()}`,
            title: task.title,
            type: task.type,
            startTime: startTime,
            endTime: endTime,
            status: 'scheduled',
            priority: task.priority,
            description: task.description,
            linkedEntityId: task.linkedEntityId,
            linkedEntityType: task.linkedEntityType,
            tags: task.tags,
        };

        setBlocks(prev => [...prev, newBlock]);
        setUnallocatedTasks(prev => prev.filter(t => t.id !== task.id));
        showNotification(`Scheduled: ${task.title}`, 'success');
    };

    // Handle task dismiss
    const handleTaskDismiss = (taskId: string) => {
        setUnallocatedTasks(prev => prev.filter(t => t.id !== taskId));
    };

    // Handle refresh AI suggestions
    const handleRefreshSuggestions = () => {
        loadUnallocatedTasks();
        showNotification('AI suggestions refreshed', 'info');
    };

    // Handle form field changes
    const handleFormChange = (field: keyof BlockFormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle tag input
    const handleTagAdd = (tag: string) => {
        if (tag && !formData.tags.includes(tag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tag],
            }));
        }
    };

    const handleTagRemove = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove),
        }));
    };

    // Get blocks count for current view
    const getBlocksCount = () => {
        const start = new Date(selectedDate);
        const end = new Date(selectedDate);

        switch (currentView) {
            case 'daily':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'weekly':
                start.setDate(selectedDate.getDate() - selectedDate.getDay());
                start.setHours(0, 0, 0, 0);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'monthly':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(selectedDate.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);
                break;
        }

        return blocks.filter(block => {
            const blockDate = new Date(block.startTime);
            return blockDate >= start && blockDate <= end;
        }).length;
    };

    // Get linked tasks count
    const getTasksCount = () => {
        return blocks.filter(block => block.linkedEntityType === 'task').length;
    };

    // Speed dial actions
    const speedDialActions = [
        {
            icon: <TaskIcon />,
            name: 'Task Block',
            onClick: () => {
                const now = new Date();
                const start = new Date(now.getTime() + 30 * 60000); // 30 minutes from now
                const end = new Date(start.getTime() + 60 * 60000); // 1 hour duration
                handleBlockCreate(start.toISOString(), end.toISOString());
            },
        },
        {
            icon: <NoteIcon />,
            name: 'Note Block',
            onClick: () => {
                const now = new Date();
                const start = new Date(now.getTime() + 30 * 60000);
                const end = new Date(start.getTime() + 30 * 60000);
                setFormData(prev => ({ ...prev, type: 'note' }));
                handleBlockCreate(start.toISOString(), end.toISOString());
            },
        },
        {
            icon: <ExperimentIcon />,
            name: 'Experiment Block',
            onClick: () => {
                const now = new Date();
                const start = new Date(now.getTime() + 60 * 60000);
                const end = new Date(start.getTime() + 120 * 60000);
                setFormData(prev => ({ ...prev, type: 'experiment' }));
                handleBlockCreate(start.toISOString(), end.toISOString());
            },
        },
        {
            icon: <ScheduleIcon />,
            name: 'Meeting Block',
            onClick: () => {
                const now = new Date();
                const start = new Date(now.getTime() + 30 * 60000);
                const end = new Date(start.getTime() + 60 * 60000);
                setFormData(prev => ({ ...prev, type: 'meeting' }));
                handleBlockCreate(start.toISOString(), end.toISOString());
            },
        },
    ];

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <TimeViewSwitcher
                    currentView={currentView}
                    selectedDate={selectedDate}
                    onViewChange={setCurrentView}
                    onDateChange={setSelectedDate}
                    onSettingsClick={() => setSettingsOpen(true)}
                    timeUnit={timeUnit}
                    onTimeUnitChange={setTimeUnit}
                    startHour={startHour}
                    endHour={endHour}
                    onHoursChange={(start, end) => {
                        setStartHour(start);
                        setEndHour(end);
                    }}
                    showWeekends={showWeekends}
                    onWeekendsToggle={setShowWeekends}
                    blocksCount={getBlocksCount()}
                    tasksCount={getTasksCount()}
                />

                {/* Main Content */}
                <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    {isLoading ? (
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    ) : currentView === 'monthly' ? (
                        <MonthlyView
                            selectedDate={selectedDate}
                            blocks={blocks}
                            onDateClick={(date) => {
                                setSelectedDate(date);
                                setCurrentView('daily');
                            }}
                            onBlockClick={handleBlockEdit}
                            onCreateBlock={(date) => {
                                const start = new Date(date);
                                start.setHours(9, 0, 0, 0);
                                const end = new Date(start);
                                end.setHours(10, 0, 0, 0);
                                handleBlockCreate(start.toISOString(), end.toISOString(), date);
                            }}
                        />
                    ) : (
                        <TimeGrid
                            view={currentView}
                            selectedDate={selectedDate}
                            blocks={blocks}
                            timeUnit={timeUnit}
                            startHour={startHour}
                            endHour={endHour}
                            gridHeight={gridHeight}
                            showWeekends={showWeekends}
                            onBlockSelect={(block) => setSelectedBlockId(block.id)}
                            onBlockEdit={handleBlockEdit}
                            onBlockDelete={handleBlockDelete}
                            onBlockCreate={handleBlockCreate}
                            onTimeSlotClick={handleBlockCreate}
                            selectedBlockId={selectedBlockId}
                            onLinkClick={handleEntityLinkClick}
                        />
                    )}

                    {/* Speed Dial for Quick Actions */}
                    <SpeedDial
                        ariaLabel="Create time block"
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            right: 16,
                        }}
                        icon={<SpeedDialIcon />}
                    >
                        {speedDialActions.map((action) => (
                            <SpeedDialAction
                                key={action.name}
                                icon={action.icon}
                                tooltipTitle={action.name}
                                onClick={action.onClick}
                            />
                        ))}
                    </SpeedDial>
                </Box>

                {/* AI Task Suggestions */}
                {aiEnabled && (
                    <AITaskSuggestions
                        selectedDate={selectedDate}
                        existingBlocks={blocks}
                        unallocatedTasks={unallocatedTasks}
                        onTaskSchedule={handleTaskSchedule}
                        onTaskDismiss={handleTaskDismiss}
                        onRefreshSuggestions={handleRefreshSuggestions}
                        isVisible={aiSuggestionsVisible}
                        onToggleVisibility={() => setAiSuggestionsVisible(!aiSuggestionsVisible)}
                    />
                )}

                {/* Block Form Dialog */}
                <Dialog
                    open={blockFormOpen}
                    onClose={() => setBlockFormOpen(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: { minHeight: 500 }
                    }}
                >
                    <DialogTitle>
                        {editingBlock ? 'Edit Time Block' : 'Create Time Block'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Title */}
                            <TextField
                                label="Title"
                                value={formData.title}
                                onChange={(e) => handleFormChange('title', e.target.value)}
                                fullWidth
                                required
                            />

                            {/* Type and Priority */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControl sx={{ flex: 1 }}>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={formData.type}
                                        onChange={(e) => handleFormChange('type', e.target.value)}
                                        label="Type"
                                    >
                                        <MenuItem value="task">Task</MenuItem>
                                        <MenuItem value="note">Note</MenuItem>
                                        <MenuItem value="experiment">Experiment</MenuItem>
                                        <MenuItem value="meeting">Meeting</MenuItem>
                                        <MenuItem value="break">Break</MenuItem>
                                        <MenuItem value="focus">Focus Time</MenuItem>
                                        <MenuItem value="custom">Custom</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl sx={{ flex: 1 }}>
                                    <InputLabel>Priority</InputLabel>
                                    <Select
                                        value={formData.priority}
                                        onChange={(e) => handleFormChange('priority', e.target.value)}
                                        label="Priority"
                                    >
                                        <MenuItem value="low">Low</MenuItem>
                                        <MenuItem value="normal">Normal</MenuItem>
                                        <MenuItem value="high">High</MenuItem>
                                        <MenuItem value="urgent">Urgent</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Time Range */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <DateTimePicker
                                    label="Start Time"
                                    value={formData.startTime}
                                    onChange={(date) => handleFormChange('startTime', date)}
                                    sx={{ flex: 1 }}
                                />
                                <DateTimePicker
                                    label="End Time"
                                    value={formData.endTime}
                                    onChange={(date) => handleFormChange('endTime', date)}
                                    sx={{ flex: 1 }}
                                />
                            </Box>

                            {/* Description */}
                            <TextField
                                label="Description"
                                value={formData.description}
                                onChange={(e) => handleFormChange('description', e.target.value)}
                                multiline
                                rows={3}
                                fullWidth
                            />

                            {/* Linked Entity */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControl sx={{ flex: 1 }}>
                                    <InputLabel>Link Type</InputLabel>
                                    <Select
                                        value={formData.linkedEntityType || ''}
                                        onChange={(e) => {
                                            handleFormChange('linkedEntityType', e.target.value || undefined);
                                            handleFormChange('linkedEntityId', undefined);
                                        }}
                                        label="Link Type"
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        <MenuItem value="task">Task</MenuItem>
                                        <MenuItem value="note">Note</MenuItem>
                                        <MenuItem value="experiment">Experiment</MenuItem>
                                        <MenuItem value="project">Project</MenuItem>
                                    </Select>
                                </FormControl>

                                {formData.linkedEntityType && (
                                    <FormControl sx={{ flex: 1 }}>
                                        <InputLabel>
                                            {formData.linkedEntityType.charAt(0).toUpperCase() + formData.linkedEntityType.slice(1)}
                                        </InputLabel>
                                        <Select
                                            value={formData.linkedEntityId || ''}
                                            onChange={(e) => handleFormChange('linkedEntityId', e.target.value)}
                                            label={formData.linkedEntityType}
                                        >
                                            {availableEntities[formData.linkedEntityType + 's' as keyof typeof availableEntities]?.map((entity: any) => (
                                                <MenuItem key={entity.id} value={entity.id}>
                                                    {entity.title || entity.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            </Box>

                            {/* Tags */}
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Tags
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                    {formData.tags.map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            onDelete={() => handleTagRemove(tag)}
                                            size="small"
                                        />
                                    ))}
                                </Box>
                                <TextField
                                    size="small"
                                    placeholder="Add tag and press Enter"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const target = e.target as HTMLInputElement;
                                            handleTagAdd(target.value);
                                            target.value = '';
                                        }
                                    }}
                                />
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setBlockFormOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBlockSave}
                            variant="contained"
                            disabled={!formData.title}
                            startIcon={<SaveIcon />}
                        >
                            {editingBlock ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Settings Dialog */}
                <Dialog
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Time Blocking Settings</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* AI Settings */}
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    AI Features
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={aiEnabled}
                                            onChange={(e) => setAiEnabled(e.target.checked)}
                                        />
                                    }
                                    label="Enable AI Suggestions"
                                />
                            </Box>

                            {/* Display Settings */}
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    Display Settings
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={enableDragDrop}
                                            onChange={(e) => setEnableDragDrop(e.target.checked)}
                                        />
                                    }
                                    label="Enable Drag & Drop"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={showWeekends}
                                            onChange={(e) => setShowWeekends(e.target.checked)}
                                        />
                                    }
                                    label="Show Weekends"
                                />
                            </Box>

                            {/* Time Settings */}
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    Time Settings
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        label="Start Hour"
                                        type="number"
                                        value={startHour}
                                        onChange={(e) => setStartHour(Number(e.target.value))}
                                        inputProps={{ min: 0, max: 23 }}
                                        sx={{ width: 120 }}
                                    />
                                    <TextField
                                        label="End Hour"
                                        type="number"
                                        value={endHour}
                                        onChange={(e) => setEndHour(Number(e.target.value))}
                                        inputProps={{ min: 0, max: 23 }}
                                        sx={{ width: 120 }}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setSettingsOpen(false)}>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Notification Snackbar */}
                <Snackbar
                    open={notification.open}
                    autoHideDuration={6000}
                    onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                >
                    <Alert
                        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                        severity={notification.severity}
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default EnhancedTimeBlockingView; 