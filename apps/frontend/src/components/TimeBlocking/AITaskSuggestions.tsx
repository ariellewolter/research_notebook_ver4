import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Button,
    IconButton,
    Collapse,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Tooltip,
    Badge,
    Alert,
    LinearProgress,
} from '@mui/material';
import {
    Lightbulb as LightbulbIcon,
    Schedule as ScheduleIcon,
    Assignment as TaskIcon,
    Note as NoteIcon,
    Science as ExperimentIcon,
    TrendingUp as TrendUpIcon,
    AccessTime as TimeIcon,
    Priority as PriorityIcon,
    Close as CloseIcon,
    Add as AddIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    AutoAwesome as AIIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export interface UnallocatedTask {
    id: string;
    title: string;
    type: 'task' | 'note' | 'experiment' | 'meeting' | 'custom';
    estimatedDuration: number; // minutes
    priority: 'low' | 'normal' | 'high' | 'urgent';
    deadline?: Date;
    linkedEntityType?: 'task' | 'note' | 'experiment' | 'project';
    linkedEntityId?: string;
    tags: string[];
    description?: string;
    suggestedTimes: Array<{
        start: string; // HH:MM format
        reason: string;
        confidence: number; // 0-100
        conflicts?: string[];
    }>;
    dependencies?: string[]; // Task IDs this depends on
    preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening';
    energyLevel?: 'low' | 'medium' | 'high'; // Required energy level
    location?: 'lab' | 'office' | 'home' | 'anywhere';
}

interface AITaskSuggestionsProps {
    selectedDate: Date;
    existingBlocks: any[]; // Current time blocks
    unallocatedTasks: UnallocatedTask[];
    onTaskSchedule: (task: UnallocatedTask, startTime: string, endTime: string) => void;
    onTaskDismiss: (taskId: string) => void;
    onRefreshSuggestions: () => void;
    isVisible?: boolean;
    onToggleVisibility?: () => void;
}

const AITaskSuggestions: React.FC<AITaskSuggestionsProps> = ({
    selectedDate,
    existingBlocks,
    unallocatedTasks,
    onTaskSchedule,
    onTaskDismiss,
    onRefreshSuggestions,
    isVisible = true,
    onToggleVisibility,
}) => {
    const theme = useTheme();
    const [expandedTasks, setExpandedTasks] = useState < Set < string >> (new Set());
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [aiInsights, setAiInsights] = useState < {
        optimalWorkload: number;
        suggestedBreaks: string[];
        productivityScore: number;
        recommendations: string[];
    } | null > (null);

    // Calculate AI insights when data changes
    useEffect(() => {
        calculateAIInsights();
    }, [existingBlocks, unallocatedTasks, selectedDate]);

    const calculateAIInsights = () => {
        setSuggestionsLoading(true);

        // Simulate AI processing delay
        setTimeout(() => {
            const totalAllocatedTime = existingBlocks.reduce((total, block) => {
                const duration = (new Date(block.endTime).getTime() - new Date(block.startTime).getTime()) / (1000 * 60);
                return total + duration;
            }, 0);

            const totalUnallocatedTime = unallocatedTasks.reduce((total, task) => total + task.estimatedDuration, 0);

            const workingHours = 8 * 60; // 8 hours in minutes
            const optimalWorkload = Math.min(100, ((totalAllocatedTime + totalUnallocatedTime) / workingHours) * 100);

            const suggestions = [];
            if (optimalWorkload > 90) {
                suggestions.push('Consider moving some tasks to tomorrow - you\'re at risk of overload');
            } else if (optimalWorkload < 60) {
                suggestions.push('You have capacity for additional research activities');
            }

            // Suggest breaks based on block density
            const suggestedBreaks = [];
            if (existingBlocks.length > 4) {
                suggestedBreaks.push('15:30', '11:00'); // Suggest break times
            }

            // Calculate productivity score based on task types and timing
            let productivityScore = 85;
            const morningBlocks = existingBlocks.filter(block =>
                new Date(block.startTime).getHours() < 12
            );
            if (morningBlocks.some(block => block.type === 'experiment')) {
                productivityScore += 5; // Bonus for morning lab work
            }

            setAiInsights({
                optimalWorkload,
                suggestedBreaks,
                productivityScore,
                recommendations: suggestions,
            });
            setSuggestionsLoading(false);
        }, 1000);
    };

    const toggleTaskExpansion = (taskId: string) => {
        const newExpanded = new Set(expandedTasks);
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId);
        } else {
            newExpanded.add(taskId);
        }
        setExpandedTasks(newExpanded);
    };

    const getTypeIcon = (type: string) => {
        const icons = {
            task: <TaskIcon fontSize="small" />,
            note: <NoteIcon fontSize="small" />,
            experiment: <ExperimentIcon fontSize="small" />,
            meeting: <ScheduleIcon fontSize="small" />,
            custom: <ScheduleIcon fontSize="small" />,
        };
        return icons[type] || icons.custom;
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return theme.palette.error.main;
            case 'high': return theme.palette.warning.main;
            case 'normal': return theme.palette.info.main;
            case 'low': return theme.palette.grey[500];
            default: return theme.palette.grey[500];
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) return theme.palette.success.main;
        if (confidence >= 60) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    const formatTimeSlot = (start: string, duration: number) => {
        const [hours, minutes] = start.split(':').map(Number);
        const startTime = new Date();
        startTime.setHours(hours, minutes, 0, 0);

        const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

        return `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    };

    const handleScheduleTask = (task: UnallocatedTask, suggestion: any) => {
        const [hours, minutes] = suggestion.start.split(':').map(Number);
        const startTime = new Date(selectedDate);
        startTime.setHours(hours, minutes, 0, 0);

        const endTime = new Date(startTime.getTime() + task.estimatedDuration * 60 * 1000);

        onTaskSchedule(task, startTime.toISOString(), endTime.toISOString());
    };

    // Sort tasks by priority and deadline urgency
    const sortedTasks = [...unallocatedTasks].sort((a, b) => {
        const priorityWeight = { urgent: 4, high: 3, normal: 2, low: 1 };
        const aPriority = priorityWeight[a.priority];
        const bPriority = priorityWeight[b.priority];

        if (aPriority !== bPriority) return bPriority - aPriority;

        // If same priority, sort by deadline
        if (a.deadline && b.deadline) {
            return a.deadline.getTime() - b.deadline.getTime();
        }
        return 0;
    });

    if (!isVisible) {
        return (
            <Box
                sx={{
                    position: 'fixed',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1000,
                }}
            >
                <Tooltip title="Show AI Suggestions" placement="left">
                    <IconButton
                        onClick={onToggleVisibility}
                        sx={{
                            backgroundColor: theme.palette.primary.main,
                            color: 'white',
                            '&:hover': {
                                backgroundColor: theme.palette.primary.dark,
                            },
                            boxShadow: theme.shadows[4],
                        }}
                    >
                        <Badge badgeContent={unallocatedTasks.length} color="error">
                            <AIIcon />
                        </Badge>
                    </IconButton>
                </Tooltip>
            </Box>
        );
    }

    return (
        <Card
            sx={{
                position: 'fixed',
                right: 16,
                top: 100,
                bottom: 16,
                width: 400,
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 116px)',
                boxShadow: theme.shadows[8],
            }}
        >
            {/* Header */}
            <CardContent sx={{ pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <AIIcon color="primary" />
                        <Typography variant="h6" fontWeight="medium">
                            AI Suggestions
                        </Typography>
                        <Badge badgeContent={unallocatedTasks.length} color="primary" />
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <IconButton
                            size="small"
                            onClick={onRefreshSuggestions}
                            disabled={suggestionsLoading}
                        >
                            <TrendUpIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={onToggleVisibility}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                {/* AI Insights Summary */}
                {aiInsights && (
                    <Box mt={2}>
                        <Box display="flex" alignItems="center" gap={2} mb={1}>
                            <Typography variant="body2" color="textSecondary">
                                Productivity Score:
                            </Typography>
                            <Chip
                                label={`${aiInsights.productivityScore}%`}
                                size="small"
                                color={(aiInsights.productivityScore >= 80) ? 'success' :
                                    (aiInsights.productivityScore >= 60) ? 'warning' : 'error'}
                            />
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={aiInsights.optimalWorkload}
                            sx={{ mb: 1 }}
                            color={(aiInsights.optimalWorkload <= 80) ? 'success' : 'warning'}
                        />
                        <Typography variant="caption" color="textSecondary">
                            Workload: {Math.round(aiInsights.optimalWorkload)}% optimal
                        </Typography>
                    </Box>
                )}

                {suggestionsLoading && (
                    <LinearProgress sx={{ mt: 1 }} />
                )}
            </CardContent>

            {/* AI Recommendations */}
            {aiInsights?.recommendations.length > 0 && (
                <Box sx={{ p: 2, pb: 1 }}>
                    {aiInsights.recommendations.map((rec, index) => (
                        <Alert key={index} severity="info" sx={{ mb: 1, py: 0 }}>
                            <Typography variant="body2">{rec}</Typography>
                        </Alert>
                    ))}
                </Box>
            )}

            {/* Task Suggestions List */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 0 }}>
                {sortedTasks.length === 0 ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '200px',
                            color: 'text.secondary',
                        }}
                    >
                        <LightbulbIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                        <Typography variant="body2" textAlign="center">
                            All tasks are scheduled!<br />
                            Great job staying organized.
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {sortedTasks.map((task, index) => (
                            <React.Fragment key={task.id}>
                                <ListItem
                                    sx={{
                                        flexDirection: 'column',
                                        alignItems: 'stretch',
                                        py: 1.5,
                                        '&:hover': {
                                            backgroundColor: theme.palette.action.hover,
                                        }
                                    }}
                                >
                                    {/* Task Header */}
                                    <Box display="flex" alignItems="center" width="100%" mb={1}>
                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                            {getTypeIcon(task.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" fontWeight="medium">
                                                    {task.title}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                                    <TimeIcon sx={{ fontSize: 14 }} />
                                                    <Typography variant="caption">
                                                        {task.estimatedDuration}min
                                                    </Typography>
                                                    <Chip
                                                        label={task.priority}
                                                        size="small"
                                                        sx={{
                                                            height: 16,
                                                            fontSize: '0.7rem',
                                                            backgroundColor: getPriorityColor(task.priority) + '20',
                                                            color: getPriorityColor(task.priority),
                                                        }}
                                                    />
                                                    {task.deadline && (
                                                        <Typography variant="caption" color="textSecondary">
                                                            Due: {task.deadline.toLocaleDateString()}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <IconButton
                                                size="small"
                                                onClick={() => toggleTaskExpansion(task.id)}
                                            >
                                                {expandedTasks.has(task.id) ?
                                                    <ExpandLessIcon fontSize="small" /> :
                                                    <ExpandMoreIcon fontSize="small" />
                                                }
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => onTaskDismiss(task.id)}
                                                sx={{ color: 'text.disabled' }}
                                            >
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {/* Suggested Time Slots */}
                                    <Collapse in={expandedTasks.has(task.id)}>
                                        <Box sx={{ ml: 4, mb: 1 }}>
                                            {task.description && (
                                                <Typography variant="caption" color="textSecondary" paragraph>
                                                    {task.description}
                                                </Typography>
                                            )}

                                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <LightbulbIcon fontSize="small" color="primary" />
                                                Suggested Times:
                                            </Typography>

                                            {task.suggestedTimes.map((suggestion, sugIndex) => (
                                                <Card
                                                    key={sugIndex}
                                                    variant="outlined"
                                                    sx={{
                                                        mb: 1,
                                                        p: 1,
                                                        cursor: 'pointer',
                                                        '&:hover': {
                                                            backgroundColor: 'action.hover',
                                                            borderColor: 'primary.main',
                                                        }
                                                    }}
                                                    onClick={() => handleScheduleTask(task, suggestion)}
                                                >
                                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {formatTimeSlot(suggestion.start, task.estimatedDuration)}
                                                            </Typography>
                                                            <Typography variant="caption" color="textSecondary">
                                                                {suggestion.reason}
                                                            </Typography>
                                                        </Box>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Chip
                                                                label={`${suggestion.confidence}%`}
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize: '0.7rem',
                                                                    backgroundColor: getConfidenceColor(suggestion.confidence) + '20',
                                                                    color: getConfidenceColor(suggestion.confidence),
                                                                }}
                                                            />
                                                            <IconButton size="small">
                                                                <AddIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>

                                                    {suggestion.conflicts && suggestion.conflicts.length > 0 && (
                                                        <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
                                                            <Typography variant="caption">
                                                                Conflicts: {suggestion.conflicts.join(', ')}
                                                            </Typography>
                                                        </Alert>
                                                    )}
                                                </Card>
                                            ))}
                                        </Box>
                                    </Collapse>
                                </ListItem>
                                {index < sortedTasks.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Box>

            {/* Footer Actions */}
            <Box
                sx={{
                    p: 2,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.grey[50],
                }}
            >
                <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<TrendUpIcon />}
                    onClick={onRefreshSuggestions}
                    disabled={suggestionsLoading}
                >
                    Refresh AI Suggestions
                </Button>
            </Box>
        </Card>
    );
};

export default AITaskSuggestions; 