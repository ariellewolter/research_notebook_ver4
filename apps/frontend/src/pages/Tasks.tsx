import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, Button, List, ListItem, ListItemText, IconButton, Checkbox, MenuItem, Grid, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Card, CardContent, CardActions, Divider, FormControl,
  InputLabel, Select, Switch, FormControlLabel, Badge, Tooltip, Alert, Snackbar, LinearProgress, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Accordion, AccordionSummary,
  AccordionDetails, ListItemIcon, ListItemSecondaryAction, Autocomplete
} from '@mui/material';
import {
  Delete, Edit, Add, FilterList, ViewList, ViewModule, Schedule, Comment,
  AttachFile, Notifications, Timer, ExpandMore, CheckCircle, Cancel,
  PriorityHigh, MoreVert, Download, Upload, AccountTree, AccountTree as WorkflowIcon
} from '@mui/icons-material';
import { projectsApi, tasksApi, taskTemplatesApi, protocolsApi, tablesApi, notesApi, pdfsApi, notificationsApi, taskDependenciesApi } from '../services/api';
import { format, isToday, parseISO, addDays, addWeeks, addMonths, addYears, isBefore } from 'date-fns';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import * as chrono from 'chrono-node';
import TaskDependencies from '../components/Tasks/TaskDependencies';
import CriticalPathAnalysis from '../components/Tasks/CriticalPathAnalysis';
import TaskFlowManagement from '../components/Tasks/TaskFlowManagement';

// Enhanced natural language parsing
const parseNaturalLanguage = (text: string) => {
  const result = {
    title: text,
    date: '',
    time: '',
    recurring: undefined as any,
    priority: 'medium' as 'low' | 'medium' | 'high',
    type: 'general',

    tags: [] as string[]
  };

  // Parse date patterns
  const today = new Date();

  if (text.toLowerCase().includes('tomorrow')) {
    result.date = format(addDays(today, 1), 'yyyy-MM-dd');
    result.title = result.title.replace(/tomorrow/gi, '').trim();
  } else if (text.toLowerCase().includes('next week')) {
    result.date = format(addWeeks(today, 1), 'yyyy-MM-dd');
    result.title = result.title.replace(/next week/gi, '').trim();
  } else if (text.toLowerCase().includes('next month')) {
    result.date = format(addMonths(today, 1), 'yyyy-MM-dd');
    result.title = result.title.replace(/next month/gi, '').trim();
  } else if (text.toLowerCase().includes('next year')) {
    result.date = format(addYears(today, 1), 'yyyy-MM-dd');
    result.title = result.title.replace(/next year/gi, '').trim();
  }

  // Parse time patterns
  const timeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3]?.toLowerCase();

    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    result.time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    result.title = result.title.replace(timeMatch[0], '').trim();
  }

  // Parse recurring patterns
  if (text.toLowerCase().includes('daily') || text.toLowerCase().includes('every day')) {
    result.recurring = { type: 'daily', interval: 1 };
    result.title = result.title.replace(/(daily|every day)/gi, '').trim();
  } else if (text.toLowerCase().includes('weekly') || text.toLowerCase().includes('every week')) {
    result.recurring = { type: 'weekly', interval: 1 };
    result.title = result.title.replace(/(weekly|every week)/gi, '').trim();
  } else if (text.toLowerCase().includes('monthly') || text.toLowerCase().includes('every month')) {
    result.recurring = { type: 'monthly', interval: 1 };
    result.title = result.title.replace(/(monthly|every month)/gi, '').trim();
  }

  // Parse priority
  if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('asap')) {
    result.priority = 'high';
    result.title = result.title.replace(/(urgent|asap)/gi, '').trim();
  } else if (text.toLowerCase().includes('low priority')) {
    result.priority = 'low';
    result.title = result.title.replace(/low priority/gi, '').trim();
  }

  // Parse estimated time
  const timeMatch2 = text.match(/(\d+)\s*(hour|hr|h)s?/i);
  if (timeMatch2) {

    result.title = result.title.replace(timeMatch2[0], '').trim();
  }

  // Parse tags
  const tagMatches = text.match(/#(\w+)/g);
  if (tagMatches) {
    result.tags = tagMatches.map(tag => tag.substring(1));
    result.title = result.title.replace(/#\w+/g, '').trim();
  }

  return result;
};

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled'; // Updated to match backend
  priority: 'low' | 'medium' | 'high';
  deadline?: string;
  isRecurring: boolean;
  recurringPattern?: string;
  tags?: string;
  // Backend uses single fields, not arrays
  projectId?: string | null;
  experimentId?: string | null;
  protocolId?: string | null;
  noteId?: string | null;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  timeEntries?: TaskTimeEntry[];
  totalTimeSpent?: number; // Calculated total time in minutes
  createdAt: string;
  updatedAt: string;
}

interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

interface TaskTimeEntry {
  id: string;
  taskId: string;
  startTime: string;
  endTime?: string;
  description?: string;
  duration?: number; // Duration in minutes
  createdAt: string;
}

interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  title: string;
  defaultPriority: string;
  defaultStatus: string;
  isRecurring: boolean;
  recurringPattern?: string;
  tags?: string;
  category?: string; // New: Template category
  variables?: string; // New: JSON object for template variables
  usageCount?: number; // New: Track how many times template is used
  isPublic?: boolean; // New: Whether template can be shared
  createdAt: string;
  updatedAt: string;
}

const defaultRecurrence = { freq: 'daily', interval: 1 };

// Template categories
const templateCategories = [
  'General', 'Research', 'Lab Work', 'Analysis', 'Writing', 'Review',
  'Meeting', 'Administrative', 'Data Collection', 'Equipment', 'Custom'
];

function RecurrenceRuleBuilder({ value, onChange }: { value: any, onChange: (val: any) => void }) {
  const [freq, setFreq] = React.useState(value?.frequency || 'weekly');
  const [interval, setInterval] = React.useState(value?.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = React.useState(value?.daysOfWeek || []);
  const [endType, setEndType] = React.useState(value?.end?.type || 'never');
  const [endValue, setEndValue] = React.useState(value?.end?.value || null);

  React.useEffect(() => {
    const pattern = { frequency: freq, interval, daysOfWeek, end: { type: endType, value: endValue } };
    onChange(JSON.stringify(pattern));
  }, [freq, interval, daysOfWeek, endType, endValue]);

  const freqOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];
  const weekDays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Frequency</InputLabel>
            <Select value={freq} label="Frequency" onChange={e => setFreq(e.target.value)}>
              {freqOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            type="number"
            label="Interval"
            value={interval}
            onChange={e => setInterval(Number(e.target.value))}
            sx={{ maxWidth: 100 }}
            inputProps={{ min: 1 }}
          />
        </Grid>
        {freq === 'weekly' && (
          <Grid item xs={12} sm={4}>
            <Grid container spacing={0}>
              {weekDays.map((day) => (
                <Grid item xs={4} key={day.value}>
                  <FormControlLabel
                    control={<Checkbox checked={daysOfWeek.includes(day.value)} onChange={e => {
                      setDaysOfWeek(e.target.checked
                        ? [...daysOfWeek, day.value]
                        : daysOfWeek.filter((d: number) => d !== day.value));
                    }} />}
                    label={day.label}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>End</InputLabel>
            <Select value={endType} label="End" onChange={e => setEndType(e.target.value)}>
              <MenuItem value="never">Never</MenuItem>
              <MenuItem value="after">After N Occurrences</MenuItem>
              <MenuItem value="on">On Date</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {endType === 'after' && (
          <Grid item xs={12} sm={6}>
            <TextField
              type="number"
              label="Occurrences"
              value={endValue || ''}
              onChange={e => setEndValue(Number(e.target.value))}
              fullWidth
              inputProps={{ min: 1 }}
            />
          </Grid>
        )}
        {endType === 'on' && (
          <Grid item xs={12} sm={6}>
            <TextField
              type="date"
              label="End Date"
              value={endValue || ''}
              onChange={e => setEndValue(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        )}
      </Grid>
      {/* Human-readable summary */}
      <Box mt={2}>
        <Typography variant="body2" color="text.secondary">
          {(() => {
            let summary = `Every ${interval} ${freq}`;
            if (freq === 'weekly' && daysOfWeek.length) {
              summary += ' on ' + daysOfWeek.map((d: number) => weekDays[d].label).join(', ');
            }
            if (endType === 'after') summary += `, ${endValue} times`;
            if (endType === 'on') summary += `, until ${endValue}`;
            return summary;
          })()}
        </Typography>
      </Box>
    </Box>
  );
}

interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  cancelledTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  tasksByPriority: { high: number; medium: number; low: number };
  tasksByStatus: { todo: number; in_progress: number; done: number; cancelled: number };
  recentActivity: { date: string; count: number }[];
  topTags: { tag: string; count: number }[];
  topTagCategories: { category: string; count: number }[];
  timeTrackingStats: {
    totalTimeSpent: number;
    averageTimePerTask: number;
    mostTimeSpentTask: string;
  };
}

const Tasks: React.FC = () => {
  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [pdfs, setPdfs] = useState<any[]>([]);

  // View state
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [agendaView, setAgendaView] = useState<'today' | 'tomorrow' | 'week'>('today');

  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    projectIds: [] as string[],
    search: '',
    tagCategories: [] as string[],
    tags: [] as string[]
  });

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalTasks, setTotalTasks] = useState(0);

  // Dialog states
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateManagementDialogOpen, setTemplateManagementDialogOpen] = useState(false);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('');
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState<TaskTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [templateStats, setTemplateStats] = useState<any>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [timeTrackingDialogOpen, setTimeTrackingDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailsDialogOpen, setTaskDetailsDialogOpen] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  const [fileUploadProgress, setFileUploadProgress] = useState<Record<string, number>>({});
  const [activeTimeTracking, setActiveTimeTracking] = useState<Record<string, string>>({});
  const [timeTrackingStartTime, setTimeTrackingStartTime] = useState<Record<string, Date>>({});

  // Dependency and workflow states
  const [dependenciesDialogOpen, setDependenciesDialogOpen] = useState(false);
  const [criticalPathDialogOpen, setCriticalPathDialogOpen] = useState(false);
  const [taskFlowDialogOpen, setTaskFlowDialogOpen] = useState(false);
  const [selectedTaskForDependencies, setSelectedTaskForDependencies] = useState<Task | null>(null);
  const [selectedTasksForCriticalPath, setSelectedTasksForCriticalPath] = useState<Task[]>([]);

  // Form states
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'todo', // Changed from 'pending' to 'todo' to match backend
    priority: 'medium',
    deadline: '',
    isRecurring: false,
    recurringPattern: JSON.stringify(defaultRecurrence),
    tags: '',
    projectId: null,
    experimentId: null,
    protocolId: null,
    noteId: null,
  });

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    title: '',
    defaultPriority: 'medium' as 'low' | 'medium' | 'high',
    defaultStatus: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    isRecurring: false,
    recurringPattern: JSON.stringify(defaultRecurrence),
    tags: '',
    category: 'General',
    variables: '{}',
    isPublic: false,
  });

  // Load task data when editing
  useEffect(() => {
    if (selectedTask) {
      // Load task data for editing
      setNewTask({
        title: selectedTask.title,
        description: selectedTask.description || '',
        status: selectedTask.status,
        priority: selectedTask.priority,
        deadline: selectedTask.deadline || '',
        isRecurring: selectedTask.isRecurring,
        recurringPattern: selectedTask.recurringPattern || JSON.stringify(defaultRecurrence),
        tags: selectedTask.tags || '',
        projectId: selectedTask.projectId || null,
        experimentId: selectedTask.experimentId || null,
        protocolId: selectedTask.protocolId || null,
        noteId: selectedTask.noteId || null,
      });
    } else {
      resetNewTask();
    }
  }, [selectedTask]);

  const [newComment, setNewComment] = useState({ content: '', author: 'User' });
  const [timeEntry, setTimeEntry] = useState({ startTime: '', endTime: '', description: '' });

  // Natural language input
  const naturalLanguageInputRef = useRef<HTMLInputElement>(null);

  // Bulk selection
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });

  // State for natural language input and parsed result
  const [nlDueDate, setNlDueDate] = useState('');
  const [parsedDueDate, setParsedDueDate] = useState<Date | null>(null);
  const [nlRecurrence, setNlRecurrence] = useState('');
  const [parsedRecurrence, setParsedRecurrence] = useState<string>('');
  const [recurrencePreview, setRecurrencePreview] = useState<string[]>([]);

  // Notification states
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [notificationSettings, setNotificationSettings] = useState({
    enableReminders: true,
    reminderAdvanceTime: '1_day', // '15_min', '1_hour', '1_day', '1_week'
    enableOverdueAlerts: true,
    enableCompletionNotifications: true,
    deliveryMethod: 'in_app' as 'in_app' | 'email' | 'push' | 'sms'
  });

  // Analytics state
  const [analytics, setAnalytics] = useState<TaskAnalytics>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    cancelledTasks: 0,
    completionRate: 0,
    averageCompletionTime: 0,
    tasksByPriority: { high: 0, medium: 0, low: 0 },
    tasksByStatus: { todo: 0, in_progress: 0, done: 0, cancelled: 0 },
    recentActivity: [],
    topTags: [],
    topTagCategories: [],
    timeTrackingStats: {
      totalTimeSpent: 0,
      averageTimePerTask: 0,
      mostTimeSpentTask: ''
    }
  });
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);

  // Load data
  useEffect(() => {
    loadData();

    // Set up periodic checks for overdue notifications
    const overdueCheckInterval = setInterval(() => {
      checkAndCreateOverdueNotifications();
    }, 60000); // Check every minute

    return () => {
      clearInterval(overdueCheckInterval);
    };
  }, []);

  const calculateAnalytics = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Basic counts
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const pendingTasks = tasks.filter(t => t.status === 'todo').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const overdueTasks = tasks.filter(t =>
      t.deadline && isBefore(parseISO(t.deadline), now) && t.status !== 'done' && t.status !== 'cancelled'
    ).length;
    const cancelledTasks = tasks.filter(t => t.status === 'cancelled').length;

    // Completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Average completion time (for completed tasks with creation and update dates)
    const completedTasksWithDates = tasks.filter(t =>
      t.status === 'done' && t.createdAt && t.updatedAt
    );
    const totalCompletionTime = completedTasksWithDates.reduce((sum, task) => {
      const created = parseISO(task.createdAt);
      const updated = parseISO(task.updatedAt);
      return sum + (updated.getTime() - created.getTime());
    }, 0);
    const averageCompletionTime = completedTasksWithDates.length > 0
      ? totalCompletionTime / completedTasksWithDates.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Tasks by priority
    const tasksByPriority = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    };

    // Tasks by status
    const tasksByStatus = {
      todo: pendingTasks,
      in_progress: inProgressTasks,
      done: completedTasks,
      cancelled: cancelledTasks
    };

    // Recent activity (last 30 days)
    const recentActivity = tasks
      .filter(t => parseISO(t.createdAt) >= thirtyDaysAgo)
      .reduce((acc, task) => {
        const date = format(parseISO(task.createdAt), 'yyyy-MM-dd');
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, [] as { date: string; count: number }[])
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7); // Last 7 days

    // Top tags and tag categories
    const tagCounts: Record<string, number> = {};
    const tagCategoryCounts: Record<string, number> = {};
    tasks.forEach(task => {
      const taskTags = getTaskTags(task);
      taskTags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        const category = categorizeTag(tag);
        tagCategoryCounts[category] = (tagCategoryCounts[category] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topTagCategories = Object.entries(tagCategoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Time tracking stats
    const totalTimeSpent = tasks.reduce((sum, task) => sum + (task.totalTimeSpent || 0), 0);
    const averageTimePerTask = totalTasks > 0 ? totalTimeSpent / totalTasks : 0;
    const mostTimeSpentTask = tasks.length > 0 ? tasks.reduce((max, task) =>
      (task.totalTimeSpent || 0) > (max.totalTimeSpent || 0) ? task : max
    ).title : 'No tasks';

    setAnalytics({
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      cancelledTasks,
      completionRate,
      averageCompletionTime,
      tasksByPriority,
      tasksByStatus,
      recentActivity,
      topTags,
      topTagCategories,
      timeTrackingStats: {
        totalTimeSpent,
        averageTimePerTask,
        mostTimeSpentTask
      }
    });
  };

  // Calculate analytics when tasks change
  useEffect(() => {
    calculateAnalytics();
  }, [tasks]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        tasksResponse,
        projectsResponse,
        protocolsResponse,
        notesResponse,
        tablesResponse,
        pdfsResponse,
        templatesResponse,
        statsResponse
      ] = await Promise.all([
        tasksApi.getAll({
          ...filters,
          page: page + 1,
          limit: rowsPerPage,
          tags: filters.tags?.length ? filters.tags.join(',') : undefined,
          tagCategories: filters.tagCategories?.length ? filters.tagCategories.join(',') : undefined
        }),
        projectsApi.getAll(),
        protocolsApi.getAll(),
        notesApi.getAll(),
        tablesApi.getAll(),
        pdfsApi.getAll(),
        taskTemplatesApi.getAll(),
        taskTemplatesApi.getStats()
      ]);

      setTasks(tasksResponse.data.tasks || tasksResponse.data || []);
      setProjects(projectsResponse.data.projects || projectsResponse.data || []);
      setProtocols(protocolsResponse.data.protocols || protocolsResponse.data || []);
      setNotes(notesResponse.data.notes || notesResponse.data || []);
      setTables(tablesResponse.data.tables || tablesResponse.data || []);
      setPdfs(pdfsResponse.data.pdfs || pdfsResponse.data || []);
      setTemplates(templatesResponse.data || []);
      setTemplateStats(statsResponse.data);
      setTotalTasks(tasksResponse.data.pagination?.total || tasksResponse.data.length || 0);

      // Load experiments for all projects
      const experimentsPromises = (projectsResponse.data.projects || projectsResponse.data || []).map(
        (project: any) => projectsApi.getExperiments(project.id)
      );
      const experimentsResponses = await Promise.all(experimentsPromises);
      const allExperiments = experimentsResponses.flatMap(response => response.data || []);
      setExperiments(allExperiments);

    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Task operations
  const handleCreateTask = async () => {
    try {
      // Only send fields that the backend expects
      const taskData: any = {
        title: newTask.title || 'Untitled Task', // Ensure title is not empty
        status: newTask.status,
        priority: newTask.priority,
        isRecurring: newTask.isRecurring,
        projectId: newTask.projectId,
        experimentId: newTask.experimentId,
        protocolId: newTask.protocolId,
        noteId: newTask.noteId,
      };

      // Only add optional fields if they have values
      if (newTask.description) {
        taskData.description = newTask.description;
      }
      if (newTask.deadline) {
        taskData.deadline = newTask.deadline;
      }
      if (newTask.recurringPattern) {
        taskData.recurringPattern = newTask.recurringPattern;
      }
      if (newTask.tags) {
        taskData.tags = newTask.tags;
      }

      console.log('Sending task data:', taskData);
      const response = await tasksApi.create(taskData);
      const createdTask = response.data;

      // Create notifications for the new task
      if (createdTask.deadline) {
        await createTaskNotifications(createdTask.id, createdTask.deadline);
      }

      setTasks(prev => [...prev, createdTask]);
      setTaskDialogOpen(false);
      setSelectedTask(null);
      resetNewTask();
      showNotification('Task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      showNotification('Failed to create task', 'error');
    }
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      // Convert frontend data to backend format
      const taskData: any = {
        title: updates.title || 'Untitled Task',
        status: updates.status,
        priority: updates.priority,
        isRecurring: updates.isRecurring,
        projectId: updates.projectId,
        experimentId: updates.experimentId,
        protocolId: updates.protocolId,
        noteId: updates.noteId,
      };

      // Only add optional fields if they have values
      if (updates.description) {
        taskData.description = updates.description;
      }
      if (updates.deadline) {
        taskData.deadline = updates.deadline;
      }
      if (updates.recurringPattern) {
        taskData.recurringPattern = updates.recurringPattern;
      }
      if (updates.tags) {
        taskData.tags = updates.tags;
      }

      console.log('Sending update data:', taskData);
      const response = await tasksApi.update(taskId, taskData);
      const updatedTask = response.data;

      // Handle status change notifications
      const originalTask = tasks.find(t => t.id === taskId);
      if (originalTask && updates.status === 'done' && originalTask.status !== 'done') {
        await createCompletionNotification(taskId, updatedTask.title);
      }

      // Handle deadline changes
      if (updates.deadline && updates.deadline !== originalTask?.deadline) {
        await createTaskNotifications(taskId, updates.deadline);
      }

      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
      setTaskDialogOpen(false);
      setSelectedTask(null);
      resetNewTask();
      showNotification('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      showNotification('Failed to update task', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await tasksApi.delete(taskId);
      loadData();
      showNotification('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      showNotification('Failed to delete task', 'error');
    }
  };

  const handleBulkOperation = async (action: 'update' | 'delete' | 'complete') => {
    if (selectedTasks.length === 0) {
      showNotification('No tasks selected', 'warning');
      return;
    }

    try {
      let data;
      switch (action) {
        case 'complete':
          data = { status: 'done', completedAt: new Date().toISOString() };
          break;
        case 'update':
          data = { status: 'in_progress' };
          break;
        default:
          data = undefined;
      }

      await tasksApi.bulk(action, selectedTasks, data);
      setSelectedTasks([]);
      loadData();
      showNotification(`Bulk ${action} completed successfully`);
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      showNotification('Failed to perform bulk operation', 'error');
    }
  };

  // Template operations
  const handleCreateTemplate = async () => {
    try {
      const templateData = {
        name: newTemplate.name,
        description: newTemplate.description,
        title: newTemplate.title,
        defaultPriority: newTemplate.defaultPriority,
        defaultStatus: newTemplate.defaultStatus,
        isRecurring: newTemplate.isRecurring,
        recurringPattern: newTemplate.recurringPattern || null,
        tags: newTemplate.tags ? JSON.stringify(newTemplate.tags.split(',').map(t => t.trim())) : null,
        category: newTemplate.category,
        variables: newTemplate.variables,
        isPublic: newTemplate.isPublic
      };

      await taskTemplatesApi.create(templateData);
      setTemplateDialogOpen(false);
      resetNewTemplate();
      loadData();
      showNotification('Template created successfully');
    } catch (error) {
      console.error('Error creating template:', error);
      showNotification('Failed to create template', 'error');
    }
  };

  const handleCreateTaskFromTemplate = async (templateId: string) => {
    try {
      await taskTemplatesApi.createTaskFromTemplate(templateId, {
        projectId: newTask.projectId || '',
        experimentId: newTask.experimentId || '',
        protocolId: newTask.protocolId || '',
        noteId: newTask.noteId || '',
        deadline: newTask.deadline,
        customTitle: newTask.title
      });
      setTaskDialogOpen(false);
      resetNewTask();
      loadData();
      showNotification('Task created from template successfully');
    } catch (error) {
      console.error('Error creating task from template:', error);
      showNotification('Failed to create task from template', 'error');
    }
  };

  // Enhanced template functions
  const handleEditTemplate = (template: TaskTemplate) => {
    setSelectedTemplateForEdit(template);
    setNewTemplate({
      name: template.name,
      description: template.description || '',
      title: template.title,
      defaultPriority: template.defaultPriority as 'low' | 'medium' | 'high',
      defaultStatus: template.defaultStatus as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      isRecurring: template.isRecurring,
      recurringPattern: template.recurringPattern || JSON.stringify(defaultRecurrence),
      tags: template.tags || '',
      category: template.category || 'General',
      variables: template.variables || '{}',
      isPublic: template.isPublic || false
    });
    setTemplateDialogOpen(true);
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplateForEdit) return;

    try {
      const templateData = {
        name: newTemplate.name,
        description: newTemplate.description,
        title: newTemplate.title,
        defaultPriority: newTemplate.defaultPriority,
        defaultStatus: newTemplate.defaultStatus,
        isRecurring: newTemplate.isRecurring,
        recurringPattern: newTemplate.recurringPattern || null,
        tags: newTemplate.tags ? JSON.stringify(newTemplate.tags.split(',').map(t => t.trim())) : null,
        category: newTemplate.category,
        variables: newTemplate.variables,
        isPublic: newTemplate.isPublic
      };

      await taskTemplatesApi.update(selectedTemplateForEdit.id, templateData);
      setTemplateDialogOpen(false);
      setSelectedTemplateForEdit(null);
      resetNewTemplate();
      loadData();
      showNotification('Template updated successfully');
    } catch (error) {
      console.error('Error updating template:', error);
      showNotification('Failed to update template', 'error');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await taskTemplatesApi.delete(templateId);
      loadData();
      showNotification('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      showNotification('Failed to delete template', 'error');
    }
  };

  const processTemplateVariables = (template: TaskTemplate, variables: Record<string, string>) => {
    let processedTitle = template.title;
    let processedDescription = template.description || '';

    // Replace variables in title and description
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processedTitle = processedTitle.replace(new RegExp(placeholder, 'g'), value);
      processedDescription = processedDescription.replace(new RegExp(placeholder, 'g'), value);
    });

    return { title: processedTitle, description: processedDescription };
  };

  const handleQuickTemplateApply = async (template: TaskTemplate) => {
    try {
      // Process variables if any
      const processed = processTemplateVariables(template, templateVariables);

      await taskTemplatesApi.createTaskFromTemplate(template.id, {
        projectId: newTask.projectId || '',
        experimentId: newTask.experimentId || '',
        protocolId: newTask.protocolId || '',
        noteId: newTask.noteId || '',
        deadline: newTask.deadline,
        customTitle: processed.title
      });

      // Update the task description if it was modified by variables
      if (processed.description !== template.description) {
        // You might want to update the task description here
      }

      loadData();
      showNotification(`Task created from template "${template.name}" successfully`);
    } catch (error) {
      console.error('Error applying template:', error);
      showNotification('Failed to apply template', 'error');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
      template.title.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(templateSearchTerm.toLowerCase()));
    const matchesCategory = !templateCategoryFilter || template.category === templateCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Comments
  const handleAddComment = async () => {
    if (!selectedTaskId) return;

    try {
      await tasksApi.createComment(selectedTaskId, newComment);
      setCommentDialogOpen(false);
      setNewComment({ content: '', author: 'User' });
      loadData();
      showNotification('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      showNotification('Failed to add comment', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await tasksApi.deleteComment(commentId);
      loadData();
      showNotification('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      showNotification('Failed to delete comment', 'error');
    }
  };

  // Enhanced Time tracking
  const handleAddTimeEntry = async () => {
    if (!selectedTaskId) return;

    try {
      await tasksApi.createTimeEntry(selectedTaskId, timeEntry);
      setTimeTrackingDialogOpen(false);
      setTimeEntry({ startTime: '', endTime: '', description: '' });
      loadData();
      showNotification('Time entry added successfully');
    } catch (error) {
      console.error('Error adding time entry:', error);
      showNotification('Failed to add time entry', 'error');
    }
  };

  const handleStartTimeTracking = async (taskId: string) => {
    try {
      const startTime = new Date();
      setTimeTrackingStartTime({ ...timeTrackingStartTime, [taskId]: startTime });
      setActiveTimeTracking({ ...activeTimeTracking, [taskId]: startTime.toISOString() });
      showNotification('Time tracking started');
    } catch (error) {
      console.error('Error starting time tracking:', error);
      showNotification('Failed to start time tracking', 'error');
    }
  };

  const handleStopTimeTracking = async (taskId: string) => {
    try {
      const startTime = timeTrackingStartTime[taskId];
      if (!startTime) return;

      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000); // minutes

      await tasksApi.createTimeEntry(taskId, {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        description: 'Time tracked session'
      });

      setActiveTimeTracking(prev => {
        const newState = { ...prev };
        delete newState[taskId];
        return newState;
      });
      setTimeTrackingStartTime(prev => {
        const newState = { ...prev };
        delete newState[taskId];
        return newState;
      });

      loadData();
      showNotification(`Time tracking stopped. Duration: ${duration} minutes`);
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      showNotification('Failed to stop time tracking', 'error');
    }
  };

  const handleDeleteTimeEntry = async (timeEntryId: string) => {
    try {
      await tasksApi.deleteTimeEntry(timeEntryId);
      loadData();
      showNotification('Time entry deleted successfully');
    } catch (error) {
      console.error('Error deleting time entry:', error);
      showNotification('Failed to delete time entry', 'error');
    }
  };

  // Enhanced File upload
  const handleFileUpload = async (taskId: string, file: File) => {
    try {
      setFileUploadProgress({ ...fileUploadProgress, [taskId]: 0 });

      await tasksApi.uploadAttachment(taskId, file, (progress) => {
        setFileUploadProgress(prev => ({ ...prev, [taskId]: progress }));
      });

      setFileUploadProgress(prev => {
        const newState = { ...prev };
        delete newState[taskId];
        return newState;
      });

      loadData();
      showNotification('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      showNotification('Failed to upload file', 'error');

      setFileUploadProgress(prev => {
        const newState = { ...prev };
        delete newState[taskId];
        return newState;
      });
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await tasksApi.deleteAttachment(attachmentId);
      loadData();
      showNotification('Attachment deleted successfully');
    } catch (error) {
      console.error('Error deleting attachment:', error);
      showNotification('Failed to delete attachment', 'error');
    }
  };

  const handleDownloadAttachment = async (attachment: TaskAttachment) => {
    try {
      const response = await tasksApi.downloadAttachment(attachment.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      showNotification('Failed to download attachment', 'error');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Reset forms
  const resetNewTask = () => {
    setNewTask({
      title: '',
      description: '',
      status: 'todo', // Changed from 'pending' to 'todo' to match backend
      priority: 'medium',
      deadline: '',
      isRecurring: false,
      recurringPattern: JSON.stringify(defaultRecurrence),
      tags: '',
      projectId: null,
      experimentId: null,
      protocolId: null,
      noteId: null,
      tableIds: [], // Changed from tableId to array
      pdfIds: [], // Changed from pdfId to array
    });
    setNlDueDate('');
    setParsedDueDate(null);
    setNlRecurrence('');
    setParsedRecurrence('');
    setRecurrencePreview([]);
  };

  const resetNewTemplate = () => {
    setNewTemplate({
      name: '',
      description: '',
      title: '',
      defaultPriority: 'medium',
      defaultStatus: 'pending',

      isRecurring: false,
      recurringPattern: '',
      tags: '',
      category: 'General',
      variables: '{}',
      isPublic: false
    });
  };

  // Kanban board
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    const newStatus = destination.droppableId;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    try {
      await handleUpdateTask(draggableId, { status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Filter handlers
  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <PriorityHigh color="error" />;
      case 'medium': return <PriorityHigh color="warning" />;
      case 'low': return <PriorityHigh color="success" />;
      default: return <PriorityHigh />;
    }
  };

  // Status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Render task card
  const renderTaskCard = (task: Task) => (
    <Card key={task.id} sx={{ mb: 2, border: selectedTasks.includes(task.id) ? 2 : 1, borderColor: selectedTasks.includes(task.id) ? 'primary.main' : 'divider' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Checkbox
            checked={selectedTasks.includes(task.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedTasks([...selectedTasks, task.id]);
              } else {
                setSelectedTasks(selectedTasks.filter(id => id !== task.id));
              }
            }}
          />
          <Typography variant="h6" sx={{ flexGrow: 1, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
            {task.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getPriorityIcon(task.priority)}
            <Chip label={task.status} color={getStatusColor(task.status)} size="small" />
            {task.isRecurring && <Chip label="Recurring" size="small" />}
          </Box>
        </Box>

        {task.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {task.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {task.projectIds && task.projectIds.length > 0 && (
            <Chip
              label={`Projects: ${task.projectIds.map(id => projects.find(p => p.id === id)?.name).filter(Boolean).join(', ')}`}
              size="small"
              variant="outlined"
            />
          )}
          {task.experimentIds && task.experimentIds.length > 0 && (
            <Chip
              label={`Experiments: ${task.experimentIds.map(id => experiments.find(e => e.id === id)?.name).filter(Boolean).join(', ')}`}
              size="small"
              variant="outlined"
            />
          )}
          {task.protocolIds && task.protocolIds.length > 0 && (
            <Chip
              label={`Protocols: ${task.protocolIds.map(id => protocols.find(p => p.id === id)?.name).filter(Boolean).join(', ')}`}
              size="small"
              variant="outlined"
            />
          )}
          {task.noteIds && task.noteIds.length > 0 && (
            <Chip
              label={`Notes: ${task.noteIds.map(id => notes.find(n => n.id === id)?.title).filter(Boolean).join(', ')}`}
              size="small"
              variant="outlined"
            />
          )}
          {task.tableIds && task.tableIds.length > 0 && (
            <Chip
              label={`Tables: ${task.tableIds.map(id => tables.find(t => t.id === id)?.name).filter(Boolean).join(', ')}`}
              size="small"
              variant="outlined"
            />
          )}
          {task.pdfIds && task.pdfIds.length > 0 && (
            <Chip
              label={`PDFs: ${task.pdfIds.map(id => pdfs.find(p => p.id === id)?.title).filter(Boolean).join(', ')}`}
              size="small"
              variant="outlined"
            />
          )}
          {task.deadline && (
            <Chip
              label={format(new Date(task.deadline), 'MMM dd, yyyy HH:mm')}
              size="small"
              color={isBefore(new Date(task.deadline), new Date()) ? 'error' : 'default'}
            />
          )}
        </Box>

        {/* Tags Display with Category Colors */}
        {(() => {
          const taskTags = getTaskTags(task);
          if (taskTags.length > 0) {
            return (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {taskTags.map((tag, index) => {
                  const category = categorizeTag(tag);
                  const getCategoryColor = (cat: string) => {
                    switch (cat) {
                      case 'Work': return 'primary';
                      case 'Personal': return 'success';
                      case 'Urgent': return 'error';
                      case 'Project': return 'warning';
                      case 'Learning': return 'info';
                      case 'Maintenance': return 'default';
                      case 'Communication': return 'secondary';
                      case 'Planning': return 'primary';
                      default: return 'default';
                    }
                  };

                  return (
                    <Chip
                      key={`${task.id}-tag-${index}`}
                      label={tag}
                      size="small"
                      color={getCategoryColor(category)}
                      variant="outlined"
                      sx={{
                        fontSize: '0.7rem',
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  );
                })}
              </Box>
            );
          }
          return null;
        })()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Add Comment">
              <IconButton size="small" onClick={() => { setSelectedTaskId(task.id); setCommentDialogOpen(true); }}>
                <Comment />
              </IconButton>
            </Tooltip>
            <Tooltip title="Time Tracking">
              <IconButton size="small" onClick={() => { setSelectedTaskId(task.id); setTimeTrackingDialogOpen(true); }}>
                <Timer />
              </IconButton>
            </Tooltip>
            <Tooltip title="Attachments">
              <IconButton size="small" onClick={() => { setSelectedTaskId(task.id); }}>
                <AttachFile />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => { setSelectedTask(task); setTaskDialogOpen(true); }}>
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => handleDeleteTask(task.id)}>
                <Delete />
              </IconButton>
            </Tooltip>
            <Tooltip title="Dependencies">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedTaskForDependencies(task);
                  setDependenciesDialogOpen(true);
                }}
              >
                <AccountTree />
              </IconButton>
            </Tooltip>
            <IconButton
              onClick={() => {
                setSelectedTaskForDetails(task);
                setTaskDetailsDialogOpen(true);
              }}
              size="small"
              color="primary"
            >
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Render kanban board
  const renderKanbanBoard = () => {
    const columns = [
      { id: 'todo', title: 'To Do', tasks: tasks.filter(t => t.status === 'todo') },
      { id: 'in_progress', title: 'In Progress', tasks: tasks.filter(t => t.status === 'in_progress') },
      { id: 'done', title: 'Done', tasks: tasks.filter(t => t.status === 'done') },
      { id: 'cancelled', title: 'Cancelled', tasks: tasks.filter(t => t.status === 'cancelled') }
    ];
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid container spacing={2}>
          {columns.map(column => (
            <Grid item xs={12} sm={6} md={3} key={column.id}>
              <Paper sx={{ p: 2, minHeight: 400 }}>
                <Typography variant="h6" gutterBottom>
                  {column.title} ({column.tasks.length})
                </Typography>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ minHeight: 300, background: snapshot.isDraggingOver ? 'rgba(0,0,0,0.04)' : undefined }}
                    >
                      {column.tasks.map((task, idx) => (
                        <Draggable key={task.id} draggableId={task.id} index={idx}>
                          {(provided, snapshot) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{ mb: 2, opacity: snapshot.isDragging ? 0.7 : 1 }}
                            >
                              {renderTaskCard(task)}
                            </Box>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DragDropContext>
    );
  };

  // Aggregate unique tags from all tasks
  // Tag categories for organization
  const tagCategories = {
    'Work': ['meeting', 'deadline', 'report', 'presentation', 'review', 'analysis', 'research', 'writing', 'coding', 'testing', 'deployment'],
    'Personal': ['health', 'exercise', 'family', 'friends', 'hobby', 'travel', 'shopping', 'cleaning', 'cooking'],
    'Urgent': ['urgent', 'asap', 'critical', 'emergency', 'important', 'priority'],
    'Project': ['project', 'milestone', 'deliverable', 'sprint', 'iteration', 'phase'],
    'Learning': ['study', 'course', 'training', 'workshop', 'conference', 'reading', 'practice'],
    'Maintenance': ['maintenance', 'update', 'upgrade', 'backup', 'cleanup', 'optimization'],
    'Communication': ['email', 'call', 'message', 'discussion', 'feedback', 'approval'],
    'Planning': ['planning', 'strategy', 'roadmap', 'budget', 'timeline', 'schedule']
  };

  // Helper function to categorize a tag
  const categorizeTag = (tag: string): string => {
    const lowerTag = tag.toLowerCase();
    for (const [category, tags] of Object.entries(tagCategories)) {
      if (tags.some(catTag => lowerTag.includes(catTag.toLowerCase()) || catTag.toLowerCase().includes(lowerTag))) {
        return category;
      }
    }
    return 'Other';
  };

  // Get all unique tags from tasks
  const allTags = Array.from(new Set(
    tasks.flatMap(task =>
      (task.tags ? (Array.isArray(task.tags) ? task.tags : JSON.parse(task.tags)) : [])
    ).filter((t: string) => !!t)
  ));

  // Get all available tag categories
  const allTagCategories = Array.from(new Set([
    ...Object.keys(tagCategories),
    'Other',
    ...allTags.map(tag => categorizeTag(tag))
  ]));

  // Helper function to get tags for a task
  const getTaskTags = (task: Task): string[] => {
    if (!task.tags) return [];
    try {
      return Array.isArray(task.tags) ? task.tags : JSON.parse(task.tags);
    } catch {
      return task.tags.split(',').map(t => t.trim()).filter(t => t);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = !filters.status || task.status === filters.status;
    const matchesPriority = !filters.priority || task.priority === filters.priority;
    const matchesProject = !filters.projectIds.length ||
      (task.projectIds && task.projectIds.some(id => filters.projectIds.includes(id)));
    const matchesSearch = !filters.search ||
      task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(filters.search.toLowerCase()));

    // Tag filtering
    const taskTags = getTaskTags(task);
    const matchesTags = !filters.tags.length ||
      filters.tags.some(filterTag => taskTags.includes(filterTag));

    // Tag category filtering
    const taskTagCategories = Array.from(new Set(taskTags.map(tag => categorizeTag(tag))));
    const matchesTagCategories = !filters.tagCategories.length ||
      filters.tagCategories.some(category => taskTagCategories.includes(category));

    return matchesStatus && matchesPriority && matchesProject && matchesSearch && matchesTags && matchesTagCategories;
  });

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading tasks...</Typography>
      </Box>
    );
  }

  // Notification management functions
  const createTaskNotifications = async (taskId: string, deadline?: string) => {
    if (!notificationSettings.enableReminders || !deadline) return;

    try {
      const deadlineDate = new Date(deadline);
      const reminderTimes: string[] = [];

      // Calculate reminder times based on settings
      switch (notificationSettings.reminderAdvanceTime) {
        case '15_min':
          reminderTimes.push(new Date(deadlineDate.getTime() - 15 * 60 * 1000).toISOString());
          break;
        case '1_hour':
          reminderTimes.push(new Date(deadlineDate.getTime() - 60 * 60 * 1000).toISOString());
          break;
        case '1_day':
          reminderTimes.push(new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000).toISOString());
          break;
        case '1_week':
          reminderTimes.push(new Date(deadlineDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
          break;
      }

      if (reminderTimes.length > 0) {
        await notificationsApi.createReminders(taskId, reminderTimes);
      }
    } catch (error) {
      console.error('Error creating task notifications:', error);
    }
  };

  const createOverdueNotification = async (taskId: string, taskTitle: string) => {
    if (!notificationSettings.enableOverdueAlerts) return;

    try {
      await notificationsApi.create({
        taskId,
        type: 'overdue',
        message: `Task "${taskTitle}" is overdue`,
        scheduledFor: new Date().toISOString(),
        deliveryMethod: notificationSettings.deliveryMethod,
        priority: 'high'
      });
    } catch (error) {
      console.error('Error creating overdue notification:', error);
    }
  };

  const createCompletionNotification = async (taskId: string, taskTitle: string) => {
    if (!notificationSettings.enableCompletionNotifications) return;

    try {
      await notificationsApi.create({
        taskId,
        type: 'completed',
        message: `Task "${taskTitle}" has been completed`,
        scheduledFor: new Date().toISOString(),
        deliveryMethod: notificationSettings.deliveryMethod,
        priority: 'normal'
      });
    } catch (error) {
      console.error('Error creating completion notification:', error);
    }
  };

  const checkAndCreateOverdueNotifications = async () => {
    const overdueTasks = tasks.filter(task =>
      task.deadline &&
      isBefore(parseISO(task.deadline), new Date()) &&
      task.status !== 'done' &&
      task.status !== 'cancelled'
    );

    for (const task of overdueTasks) {
      await createOverdueNotification(task.id, task.title);
    }
  };



  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto', mt: { xs: 2, sm: 4 } }}>
      <Typography variant="h4" gutterBottom>Task Management</Typography>

      {/* Statistics */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Total Tasks</Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>To Do</Typography>
                <Typography variant="h4" color="primary">{stats.todo}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>In Progress</Typography>
                <Typography variant="h4" color="warning.main">{stats.inProgress}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Completed</Typography>
                <Typography variant="h4" color="success.main">{stats.done}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setTaskDialogOpen(true)}
        >
          New Task
        </Button>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setTemplateDialogOpen(true)}
          sx={{ mr: 1 }}
        >
          Create Template
        </Button>
        <Button
          variant="outlined"
          startIcon={<ViewList />}
          onClick={() => setTemplateManagementDialogOpen(true)}
          sx={{ mr: 1 }}
        >
          Manage Templates
        </Button>
        <Button
          variant="outlined"
          startIcon={<Schedule />}
          onClick={() => setAnalyticsDialogOpen(true)}
          sx={{ mr: 1 }}
        >
          Analytics
        </Button>
        <Button
          variant="outlined"
          startIcon={<AccountTree />}
          onClick={() => {
            setSelectedTasksForCriticalPath(filteredTasks);
            setCriticalPathDialogOpen(true);
          }}
          sx={{ mr: 1 }}
        >
          Critical Path
        </Button>
        <Button
          variant="outlined"
          startIcon={<WorkflowIcon />}
          onClick={() => setTaskFlowDialogOpen(true)}
          sx={{ mr: 1 }}
        >
          Task Flow
        </Button>
        <Button
          variant="outlined"
          startIcon={<FilterList />}
          onClick={() => {/* Toggle filter panel */ }}
        >
          Filters
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            startIcon={<ViewList />}
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'contained' : 'outlined'}
            startIcon={<ViewModule />}
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search tasks..."
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="todo">To Do</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="done">Done</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                label="Priority"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Project Filter</InputLabel>
              <Select
                multiple
                value={filters.projectIds}
                onChange={(e) => handleFilterChange('projectIds', e.target.value)}
                label="Project Filter"
              >
                {projects.map(project => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              multiple
              options={allTagCategories}
              value={filters.tagCategories}
              onChange={(_, newValue) => handleFilterChange('tagCategories', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tag Categories"
                  placeholder="Select categories..."
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              multiple
              options={allTags}
              value={filters.tags}
              onChange={(_, newValue) => handleFilterChange('tags', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  placeholder="Select tags..."
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                ))
              }
            />
          </Grid>
        </Grid>

        {/* Active Filters Display */}
        {(filters.tagCategories.length > 0 || filters.tags.length > 0) && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" sx={{ mr: 1, alignSelf: 'center' }}>
              Active filters:
            </Typography>
            {filters.tagCategories.map((category) => (
              <Chip
                key={`cat-${category}`}
                label={`Category: ${category}`}
                onDelete={() => handleFilterChange('tagCategories', filters.tagCategories.filter(c => c !== category))}
                size="small"
                color="primary"
              />
            ))}
            {filters.tags.map((tag) => (
              <Chip
                key={`tag-${tag}`}
                label={`Tag: ${tag}`}
                onDelete={() => handleFilterChange('tags', filters.tags.filter(t => t !== tag))}
                size="small"
                color="secondary"
              />
            ))}
            <Button
              size="small"
              onClick={() => {
                handleFilterChange('tagCategories', []);
                handleFilterChange('tags', []);
              }}
              sx={{ ml: 1 }}
            >
              Clear All
            </Button>
          </Box>
        )}

        {/* Tag Category Legend */}
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" sx={{ mr: 1 }}>
            Tag Categories:
          </Typography>
          {Object.entries(tagCategories).map(([category, tags]) => (
            <Chip
              key={category}
              label={category}
              size="small"
              color={
                category === 'Work' ? 'primary' :
                  category === 'Personal' ? 'success' :
                    category === 'Urgent' ? 'error' :
                      category === 'Project' ? 'warning' :
                        category === 'Learning' ? 'info' :
                          category === 'Communication' ? 'secondary' :
                            'default'
              }
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          ))}
        </Box>
      </Paper>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {selectedTasks.length} task(s) selected
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" onClick={() => handleBulkOperation('complete')}>
              Mark Complete
            </Button>
            <Button size="small" onClick={() => handleBulkOperation('update')}>
              Mark In Progress
            </Button>
            <Button size="small" color="error" onClick={() => handleBulkOperation('delete')}>
              Delete Selected
            </Button>
          </Box>
        </Box>
      )}

      {/* Task List/Board */}
      {viewMode === 'kanban' ? (
        renderKanbanBoard()
      ) : (
        <Box>
          {filteredTasks.map(task => renderTaskCard(task))}

          {/* Pagination */}
          <TablePagination
            component="div"
            count={totalTasks}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Box>
      )}

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>Link to Entities</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={projects}
                        getOptionLabel={(option) => option.name}
                        value={projects.find(p => p.id === newTask.projectId) || null}
                        onChange={(_, newValue) => {
                          setNewTask({
                            ...newTask,
                            projectId: newValue?.id || null
                          });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Project"
                            placeholder="Select project..."
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={experiments}
                        getOptionLabel={(option) => option.name}
                        value={experiments.find(e => e.id === newTask.experimentId) || null}
                        onChange={(_, newValue) => {
                          setNewTask({
                            ...newTask,
                            experimentId: newValue?.id || null
                          });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Experiment"
                            placeholder="Select experiment..."
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={protocols}
                        getOptionLabel={(option) => option.name}
                        value={protocols.find(p => p.id === newTask.protocolId) || null}
                        onChange={(_, newValue) => {
                          setNewTask({
                            ...newTask,
                            protocolId: newValue?.id || null
                          });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Protocol"
                            placeholder="Select protocol..."
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={notes}
                        getOptionLabel={(option) => option.title}
                        value={notes.find(n => n.id === newTask.noteId) || null}
                        onChange={(_, newValue) => {
                          setNewTask({
                            ...newTask,
                            noteId: newValue?.id || null
                          });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Note"
                            placeholder="Select note..."
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value as any })}
                  label="Status"
                >
                  <MenuItem value="todo">To Do</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="done">Done</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date (natural language allowed)"
                type="text"
                value={nlDueDate}
                onChange={e => {
                  setNlDueDate(e.target.value);
                  const result = chrono.parseDate(e.target.value);
                  setParsedDueDate(result || null);
                  if (result) {
                    setNewTask({ ...newTask, deadline: result.toISOString() });
                  }
                }}
                helperText={parsedDueDate ? `Interpreted as: ${parsedDueDate.toLocaleString()}` : 'e.g. "next Friday", "in 3 days", "tomorrow"'}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newTask.isRecurring}
                    onChange={(e) => setNewTask({ ...newTask, isRecurring: e.target.checked })}
                  />
                }
                label="Recurring Task"
              />
            </Grid>
            {
              newTask.isRecurring && (
                <Grid item xs={12}>
                  <RecurrenceRuleBuilder
                    value={newTask.recurringPattern ? JSON.parse(newTask.recurringPattern) : null}
                    onChange={(value) => setNewTask({ ...newTask, recurringPattern: value })}
                  />
                </Grid>
              )
            }

            {/* Notification Settings */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Notifications />
                    <Typography>Notification Settings</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.enableReminders}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              enableReminders: e.target.checked
                            })}
                          />
                        }
                        label="Enable Reminders"
                      />
                    </Grid>
                    {notificationSettings.enableReminders && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Reminder Time</InputLabel>
                            <Select
                              value={notificationSettings.reminderAdvanceTime}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                reminderAdvanceTime: e.target.value
                              })}
                              label="Reminder Time"
                            >
                              <MenuItem value="15_min">15 minutes before</MenuItem>
                              <MenuItem value="1_hour">1 hour before</MenuItem>
                              <MenuItem value="1_day">1 day before</MenuItem>
                              <MenuItem value="1_week">1 week before</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Delivery Method</InputLabel>
                            <Select
                              value={notificationSettings.deliveryMethod}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                deliveryMethod: e.target.value as any
                              })}
                              label="Delivery Method"
                            >
                              <MenuItem value="in_app">In App</MenuItem>
                              <MenuItem value="email">Email</MenuItem>
                              <MenuItem value="push">Push Notification</MenuItem>
                              <MenuItem value="sms">SMS</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </>
                    )}
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.enableOverdueAlerts}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              enableOverdueAlerts: e.target.checked
                            })}
                          />
                        }
                        label="Overdue Alerts"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.enableCompletionNotifications}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              enableCompletionNotifications: e.target.checked
                            })}
                          />
                        }
                        label="Completion Notifications"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid >
        </DialogContent >
        <DialogActions>
          <Button onClick={() => {
            setTaskDialogOpen(false);
            setSelectedTask(null);
            resetNewTask();
          }}>Cancel</Button>
          <Button onClick={selectedTask ? () => handleUpdateTask(selectedTask.id, newTask) : handleCreateTask} variant="contained">
            {selectedTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog >

      {/* Template Dialog */}
      < Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth >
        <DialogTitle>
          {selectedTemplateForEdit ? 'Edit Task Template' : 'Create Task Template'}
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task Title"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                required
                helperText="Use {{variable}} for dynamic content"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                helperText="Use {{variable}} for dynamic content"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  label="Category"
                >
                  {templateCategories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Default Priority</InputLabel>
                <Select
                  value={newTemplate.defaultPriority}
                  onChange={(e) => setNewTemplate({ ...newTemplate, defaultPriority: e.target.value as any })}
                  label="Default Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newTemplate.isPublic}
                    onChange={(e) => setNewTemplate({ ...newTemplate, isPublic: e.target.checked })}
                  />
                }
                label="Public Template"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Variables (JSON)"
                value={newTemplate.variables}
                onChange={(e) => setNewTemplate({ ...newTemplate, variables: e.target.value })}
                multiline
                rows={2}
                helperText="Define variables as JSON object, e.g., {'project': 'Project Name', 'date': '2024-01-01'}"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma-separated)"
                value={newTemplate.tags}
                onChange={(e) => setNewTemplate({ ...newTemplate, tags: e.target.value })}
                helperText="Tags to help organize templates"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newTemplate.isRecurring}
                    onChange={(e) => setNewTemplate({ ...newTemplate, isRecurring: e.target.checked })}
                  />
                }
                label="Recurring Task"
              />
            </Grid>
            {newTemplate.isRecurring && (
              <Grid item xs={12}>
                <RecurrenceRuleBuilder
                  value={newTemplate.recurringPattern}
                  onChange={(value) => setNewTemplate({ ...newTemplate, recurringPattern: value })}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setTemplateDialogOpen(false);
            setSelectedTemplateForEdit(null);
            resetNewTemplate();
          }}>Cancel</Button>
          <Button
            onClick={selectedTemplateForEdit ? handleUpdateTemplate : handleCreateTemplate}
            variant="contained"
          >
            {selectedTemplateForEdit ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogActions>
      </Dialog >

      {/* Template Management Dialog */}
      < Dialog open={templateManagementDialogOpen} onClose={() => setTemplateManagementDialogOpen(false)} maxWidth="lg" fullWidth >
        <DialogTitle>Template Management</DialogTitle>
        <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Search Templates"
                value={templateSearchTerm}
                onChange={(e) => setTemplateSearchTerm(e.target.value)}
                placeholder="Search by name, title, or description..."
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Category Filter</InputLabel>
                <Select
                  value={templateCategoryFilter}
                  onChange={(e) => setTemplateCategoryFilter(e.target.value)}
                  label="Category Filter"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {templateCategories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Template Statistics */}
          {templateStats && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>Template Analytics</Typography>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">{templateStats.totalTemplates}</Typography>
                    <Typography variant="body2">Total Templates</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="secondary">{templateStats.totalUsage}</Typography>
                    <Typography variant="body2">Total Usage</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">{templateStats.publicTemplates}</Typography>
                    <Typography variant="body2">Public Templates</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main">
                      {templateStats.totalTemplates > 0 ? Math.round(templateStats.totalUsage / templateStats.totalTemplates) : 0}
                    </Typography>
                    <Typography variant="body2">Avg Usage</Typography>
                  </Box>
                </Grid>
              </Grid>

              {templateStats.mostUsedTemplates && templateStats.mostUsedTemplates.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Most Used Templates</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {templateStats.mostUsedTemplates.map((template: any) => (
                      <Chip
                        key={template.id}
                        label={`${template.name} (${template.usageCount}x)`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          <Grid container spacing={2}>
            {filteredTemplates.map(template => (
              <Grid item xs={12} md={6} key={template.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="h6" gutterBottom>{template.name}</Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {template.title}
                        </Typography>
                        {template.description && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {template.description}
                          </Typography>
                        )}
                        <Box display="flex" gap={1} flexWrap="wrap" sx={{ mb: 1 }}>
                          <Chip label={template.category || 'General'} size="small" />
                          <Chip label={template.defaultPriority} size="small" color="primary" />
                          {template.usageCount && (
                            <Chip label={`Used ${template.usageCount}x`} size="small" color="secondary" />
                          )}
                        </Box>
                      </Box>
                      <Box>
                        <IconButton onClick={() => handleEditTemplate(template)} size="small">
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteTemplate(template.id)} size="small" color="error">
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => handleQuickTemplateApply(template)}
                      startIcon={<Add />}
                    >
                      Apply Template
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {filteredTemplates.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="textSecondary">
                No templates found. Create your first template to get started!
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateManagementDialogOpen(false)}>Close</Button>
          <Button onClick={() => {
            setTemplateManagementDialogOpen(false);
            setTemplateDialogOpen(true);
          }} variant="contained">
            Create New Template
          </Button>
        </DialogActions>
      </Dialog >

      {/* Comment Dialog */}
      < Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="sm" fullWidth >
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comment"
            value={newComment.content}
            onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddComment} variant="contained">Add Comment</Button>
        </DialogActions>
      </Dialog >

      {/* Time Tracking Dialog */}
      < Dialog open={timeTrackingDialogOpen} onClose={() => setTimeTrackingDialogOpen(false)} maxWidth="sm" fullWidth >
        <DialogTitle>Add Time Entry</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Start Time"
                value={timeEntry.startTime}
                onChange={(e) => setTimeEntry({ ...timeEntry, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="End Time"
                value={timeEntry.endTime}
                onChange={(e) => setTimeEntry({ ...timeEntry, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={timeEntry.description}
                onChange={(e) => setTimeEntry({ ...timeEntry, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimeTrackingDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddTimeEntry} variant="contained">Add Time Entry</Button>
        </DialogActions>
      </Dialog >

      {/* Snackbar */}
      < Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar >

      {/* Task Details Dialog */}
      < Dialog open={taskDetailsDialogOpen} onClose={() => setTaskDetailsDialogOpen(false)} maxWidth="lg" fullWidth >
        <DialogTitle>
          Task Details: {selectedTaskForDetails?.title}
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {selectedTaskForDetails && (
            <Box>
              {/* Task Info */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{selectedTaskForDetails.title}</Typography>
                  {selectedTaskForDetails.description && (
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {selectedTaskForDetails.description}
                    </Typography>
                  )}
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip label={selectedTaskForDetails.status} color="primary" size="small" />
                    <Chip label={selectedTaskForDetails.priority} color="secondary" size="small" />
                    {selectedTaskForDetails.deadline && (
                      <Chip label={`Due: ${format(parseISO(selectedTaskForDetails.deadline), 'MMM dd, yyyy')}`} size="small" />
                    )}
                    {selectedTaskForDetails.totalTimeSpent && (
                      <Chip label={`Time: ${formatDuration(selectedTaskForDetails.totalTimeSpent)}`} size="small" />
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Tabs for different sections */}
              <Tabs value={0} sx={{ mb: 2 }}>
                <Tab label="Comments" />
                <Tab label="Attachments" />
                <Tab label="Time Tracking" />
              </Tabs>

              {/* Comments Section */}
              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6">Comments</Typography>
                  <Button
                    size="small"
                    startIcon={<Add />}
                    onClick={() => {
                      setSelectedTaskId(selectedTaskForDetails.id);
                      setCommentDialogOpen(true);
                    }}
                  >
                    Add Comment
                  </Button>
                </Box>

                {selectedTaskForDetails.comments && selectedTaskForDetails.comments.length > 0 ? (
                  <Box>
                    {selectedTaskForDetails.comments.map((comment) => (
                      <Card key={comment.id} sx={{ mb: 1 }}>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box flex={1}>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {comment.content}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                By {comment.author} on {format(parseISO(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteComment(comment.id)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
                    No comments yet. Add the first comment!
                  </Typography>
                )}
              </Box>

              {/* Attachments Section */}
              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6">Attachments</Typography>
                  <Button
                    size="small"
                    startIcon={<AttachFile />}
                    component="label"
                  >
                    Upload File
                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(selectedTaskForDetails.id, file);
                        }
                      }}
                    />
                  </Button>
                </Box>

                {/* Upload Progress */}
                {fileUploadProgress[selectedTaskForDetails.id] !== undefined && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={fileUploadProgress[selectedTaskForDetails.id]}
                    />
                    <Typography variant="caption">
                      Uploading... {fileUploadProgress[selectedTaskForDetails.id]}%
                    </Typography>
                  </Box>
                )}

                {selectedTaskForDetails.attachments && selectedTaskForDetails.attachments.length > 0 ? (
                  <Box>
                    {selectedTaskForDetails.attachments.map((attachment) => (
                      <Card key={attachment.id} sx={{ mb: 1 }}>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box display="flex" alignItems="center" gap={1}>
                              <AttachFile />
                              <Box>
                                <Typography variant="body2">{attachment.fileName}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {formatFileSize(attachment.fileSize)} • {format(parseISO(attachment.uploadedAt), 'MMM dd, yyyy')}
                                </Typography>
                              </Box>
                            </Box>
                            <Box>
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadAttachment(attachment)}
                              >
                                <Download />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
                    No attachments yet. Upload your first file!
                  </Typography>
                )}
              </Box>

              {/* Time Tracking Section */}
              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6">Time Tracking</Typography>
                  <Box>
                    {activeTimeTracking[selectedTaskForDetails.id] ? (
                      <Button
                        size="small"
                        startIcon={<Timer />}
                        onClick={() => handleStopTimeTracking(selectedTaskForDetails.id)}
                        color="error"
                      >
                        Stop Tracking
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        startIcon={<Timer />}
                        onClick={() => handleStartTimeTracking(selectedTaskForDetails.id)}
                      >
                        Start Tracking
                      </Button>
                    )}
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => {
                        setSelectedTaskId(selectedTaskForDetails.id);
                        setTimeTrackingDialogOpen(true);
                      }}
                      sx={{ ml: 1 }}
                    >
                      Add Entry
                    </Button>
                  </Box>
                </Box>

                {/* Active Time Tracking Display */}
                {activeTimeTracking[selectedTaskForDetails.id] && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Time tracking is active since {format(parseISO(activeTimeTracking[selectedTaskForDetails.id]), 'HH:mm')}
                    </Typography>
                  </Alert>
                )}

                {selectedTaskForDetails.timeEntries && selectedTaskForDetails.timeEntries.length > 0 ? (
                  <Box>
                    {selectedTaskForDetails.timeEntries.map((timeEntry) => (
                      <Card key={timeEntry.id} sx={{ mb: 1 }}>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="body2">
                                {format(parseISO(timeEntry.startTime), 'MMM dd, yyyy HH:mm')}
                                {timeEntry.endTime && (
                                  <> - {format(parseISO(timeEntry.endTime), 'HH:mm')}</>
                                )}
                              </Typography>
                              {timeEntry.description && (
                                <Typography variant="caption" color="textSecondary">
                                  {timeEntry.description}
                                </Typography>
                              )}
                              {timeEntry.duration && (
                                <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                                  {formatDuration(timeEntry.duration)}
                                </Typography>
                              )}
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteTimeEntry(timeEntry.id)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
                    No time entries yet. Start tracking your time!
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog >

      {/* Analytics Dialog */}
      < Dialog open={analyticsDialogOpen} onClose={() => setAnalyticsDialogOpen(false)} maxWidth="lg" fullWidth >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Task Analytics & Statistics</Typography>
            <IconButton onClick={() => setAnalyticsDialogOpen(false)}>
              <Cancel />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Grid container spacing={3}>
            {/* Overview Cards */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Total Tasks</Typography>
                  <Typography variant="h4">{analytics.totalTasks}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Completed</Typography>
                  <Typography variant="h4" color="success.main">{analytics.completedTasks}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {analytics.completionRate.toFixed(1)}% completion rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>In Progress</Typography>
                  <Typography variant="h4" color="warning.main">{analytics.inProgressTasks}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Overdue</Typography>
                  <Typography variant="h4" color="error.main">{analytics.overdueTasks}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Priority Distribution */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Tasks by Priority</Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <PriorityHigh color="error" />
                        <Typography>High Priority</Typography>
                      </Box>
                      <Typography variant="h6">{analytics.tasksByPriority.high}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography>Medium Priority</Typography>
                      <Typography variant="h6">{analytics.tasksByPriority.medium}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography>Low Priority</Typography>
                      <Typography variant="h6">{analytics.tasksByPriority.low}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Status Distribution */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Tasks by Status</Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography>Pending</Typography>
                      <Typography variant="h6">{analytics.tasksByStatus.pending}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography>In Progress</Typography>
                      <Typography variant="h6">{analytics.tasksByStatus.in_progress}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography>Completed</Typography>
                      <Typography variant="h6">{analytics.tasksByStatus.completed}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography>Cancelled</Typography>
                      <Typography variant="h6">{analytics.tasksByStatus.cancelled}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Time Tracking Stats */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Time Tracking</Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography>Total Time Spent</Typography>
                      <Typography variant="h6">{formatDuration(analytics.timeTrackingStats.totalTimeSpent)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography>Average per Task</Typography>
                      <Typography variant="h6">{formatDuration(analytics.timeTrackingStats.averageTimePerTask)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography>Most Time Spent</Typography>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {analytics.timeTrackingStats.mostTimeSpentTask}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Performance Metrics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Performance</Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography>Completion Rate</Typography>
                      <Typography variant="h6">{analytics.completionRate.toFixed(1)}%</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography>Avg Completion Time</Typography>
                      <Typography variant="h6">{analytics.averageCompletionTime.toFixed(1)} days</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Tags */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Top Tags</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {analytics.topTags.map((tag) => (
                      <Chip
                        key={tag.tag}
                        label={`${tag.tag} (${tag.count})`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Tag Categories */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Tag Categories</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {analytics.topTagCategories.map((category) => (
                      <Chip
                        key={category.category}
                        label={`${category.category} (${category.count})`}
                        size="small"
                        color={
                          category.category === 'Work' ? 'primary' :
                            category.category === 'Personal' ? 'success' :
                              category.category === 'Urgent' ? 'error' :
                                category.category === 'Project' ? 'warning' :
                                  category.category === 'Learning' ? 'info' :
                                    category.category === 'Communication' ? 'secondary' :
                                      'default'
                        }
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Recent Activity (Last 7 Days)</Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {analytics.recentActivity.map((activity) => (
                      <Box key={activity.date} display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">{format(parseISO(activity.date), 'MMM dd')}</Typography>
                        <Typography variant="h6">{activity.count} tasks</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyticsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog >

      {/* Task Dependencies Dialog */}
      {
        selectedTaskForDependencies && (
          <TaskDependencies
            open={dependenciesDialogOpen}
            onClose={() => {
              setDependenciesDialogOpen(false);
              setSelectedTaskForDependencies(null);
            }}
            taskId={selectedTaskForDependencies.id}
            taskTitle={selectedTaskForDependencies.title}
            allTasks={tasks}
          />
        )
      }

      {/* Critical Path Analysis Dialog */}
      <CriticalPathAnalysis
        open={criticalPathDialogOpen}
        onClose={() => setCriticalPathDialogOpen(false)}
        selectedTasks={selectedTasksForCriticalPath}
      />

      {/* Task Flow Management Dialog */}
      <TaskFlowManagement
        open={taskFlowDialogOpen}
        onClose={() => setTaskFlowDialogOpen(false)}
        selectedTasks={selectedTasks}
      />
    </Box >
  );
};

export default Tasks; 