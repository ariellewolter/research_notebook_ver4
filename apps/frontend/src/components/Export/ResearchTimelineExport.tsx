import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, 
    Box, Typography, FormControl, InputLabel, Select, MenuItem,
    TextField, Chip, Alert, CircularProgress, Grid, Card, CardContent,
    List, ListItem, ListItemText, ListItemIcon, Divider
} from '@mui/material';
import {
    Timeline as TimelineIcon, Download as DownloadIcon,
    Assessment as AssessmentIcon, CalendarToday as CalendarIcon,
    TrendingUp as TrendingUpIcon, CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { format, differenceInDays, isAfter, isBefore, startOfDay } from 'date-fns';

interface TimelineItem {
    id: string;
    name: string;
    type: 'project' | 'experiment' | 'protocol' | 'task' | 'milestone';
    startDate: Date;
    endDate: Date;
    status: 'not-started' | 'in-progress' | 'completed' | 'delayed';
    progress: number;
    priority: 'low' | 'medium' | 'high';
    description?: string;
    dependencies: string[];
    assignee?: string;
    tags?: string[];
}

interface ResearchTimelineExportProps {
    open: boolean;
    onClose: () => void;
    projects: any[];
    experiments: any[];
    protocols: any[];
    tasks: any[];
}

const ResearchTimelineExport: React.FC<ResearchTimelineExportProps> = ({
    open, onClose, projects, experiments, protocols, tasks
}) => {
    const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);
    const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx' | 'html'>('xlsx');
    const [filename, setFilename] = useState('research-timeline');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTypes, setSelectedTypes] = useState<string[]>(['project', 'experiment', 'protocol', 'task']);
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
        end: format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd')
    });

    useEffect(() => {
        if (open) {
            generateTimelineData();
        }
    }, [open, projects, experiments, protocols, tasks, selectedTypes, dateRange]);

    const generateTimelineData = () => {
        const items: TimelineItem[] = [];
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);

        // Add projects
        if (selectedTypes.includes('project')) {
            projects.forEach(project => {
                const projectStart = new Date(project.createdAt);
                const projectEnd = project.status === 'completed' 
                    ? new Date(project.updatedAt) 
                    : new Date();
                
                if (isAfter(projectStart, startDate) && isBefore(projectEnd, endDate)) {
                    items.push({
                        id: project.id,
                        name: project.name,
                        type: 'project',
                        startDate: projectStart,
                        endDate: projectEnd,
                        status: project.status as any,
                        progress: project.status === 'completed' ? 100 : 
                                 project.status === 'in-progress' ? 50 : 0,
                        priority: project.priority || 'medium',
                        description: project.description,
                        dependencies: [],
                        tags: project.tags ? project.tags.split(',').map((tag: string) => tag.trim()) : []
                    });
                }
            });
        }

        // Add experiments
        if (selectedTypes.includes('experiment')) {
            experiments.forEach(exp => {
                const expStart = new Date(exp.createdAt);
                const expEnd = exp.status === 'completed' 
                    ? new Date(exp.updatedAt) 
                    : new Date();
                
                if (isAfter(expStart, startDate) && isBefore(expEnd, endDate)) {
                    items.push({
                        id: exp.id,
                        name: exp.name,
                        type: 'experiment',
                        startDate: expStart,
                        endDate: expEnd,
                        status: exp.status as any,
                        progress: exp.status === 'completed' ? 100 : 
                                 exp.status === 'in-progress' ? 50 : 0,
                        priority: exp.priority || 'medium',
                        description: exp.description,
                        dependencies: exp.projectId ? [exp.projectId] : [],
                        tags: exp.tags ? exp.tags.split(',').map((tag: string) => tag.trim()) : []
                    });
                }
            });
        }

        // Add protocols
        if (selectedTypes.includes('protocol')) {
            protocols.forEach(protocol => {
                const protocolStart = new Date(protocol.createdAt);
                const protocolEnd = protocol.status === 'completed' 
                    ? new Date(protocol.updatedAt) 
                    : new Date();
                
                if (isAfter(protocolStart, startDate) && isBefore(protocolEnd, endDate)) {
                    items.push({
                        id: protocol.id,
                        name: protocol.name,
                        type: 'protocol',
                        startDate: protocolStart,
                        endDate: protocolEnd,
                        status: protocol.status as any,
                        progress: protocol.status === 'completed' ? 100 : 
                                 protocol.status === 'in-progress' ? 50 : 0,
                        priority: protocol.priority || 'medium',
                        description: protocol.description,
                        dependencies: [],
                        tags: protocol.tags ? protocol.tags.split(',').map((tag: string) => tag.trim()) : []
                    });
                }
            });
        }

        // Add tasks
        if (selectedTypes.includes('task')) {
            tasks.forEach(task => {
                if (task.date) {
                    const taskDate = new Date(task.date);
                    const taskEnd = new Date(taskDate);
                    taskEnd.setDate(taskEnd.getDate() + 1);
                    
                    if (isAfter(taskDate, startDate) && isBefore(taskEnd, endDate)) {
                        items.push({
                            id: task.id,
                            name: task.title,
                            type: 'task',
                            startDate: taskDate,
                            endDate: taskEnd,
                            status: task.completed ? 'completed' : 'in-progress',
                            progress: task.completed ? 100 : 0,
                            priority: task.priority || 'medium',
                            description: task.description,
                            dependencies: [],
                            tags: task.tags || []
                        });
                    }
                }
            });
        }

        // Sort by start date
        items.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        setTimelineData(items);
    };

    const exportTimeline = async () => {
        setLoading(true);
        setError(null);

        try {
            const exportData = timelineData.map(item => ({
                id: item.id,
                name: item.name,
                type: item.type,
                start_date: format(item.startDate, 'yyyy-MM-dd'),
                end_date: format(item.endDate, 'yyyy-MM-dd'),
                duration_days: differenceInDays(item.endDate, item.startDate) + 1,
                status: item.status,
                progress: item.progress,
                priority: item.priority,
                description: item.description || '',
                dependencies: item.dependencies.join(', '),
                tags: item.tags?.join(', ') || '',
                assignee: item.assignee || ''
            }));

            let content: any;
            let mimeType: string;
            let extension: string;

            switch (exportFormat) {
                case 'csv':
                    content = Papa.unparse(exportData);
                    mimeType = 'text/csv';
                    extension = 'csv';
                    break;
                case 'json':
                    content = JSON.stringify(exportData, null, 2);
                    mimeType = 'application/json';
                    extension = 'json';
                    break;
                case 'xlsx':
                    const ws = XLSX.utils.json_to_sheet(exportData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Research Timeline');
                    content = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                    mimeType = 'application/octet-stream';
                    extension = 'xlsx';
                    break;
                case 'html':
                    content = generateHTMLTimeline(exportData);
                    mimeType = 'text/html';
                    extension = 'html';
                    break;
            }

            const blob = new Blob([content], { type: mimeType });
            saveAs(blob, `${filename}.${extension}`);
        } catch (err) {
            setError('Failed to export timeline. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const generateHTMLTimeline = (data: any[]): string => {
        const htmlHeader = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Research Timeline</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #1976d2; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .timeline-item { 
            border-left: 3px solid #1976d2; 
            margin: 10px 0; 
            padding: 10px 20px; 
            background: #f8f9fa; 
            border-radius: 0 5px 5px 0; 
        }
        .project { border-left-color: #1976d2; }
        .experiment { border-left-color: #7b1fa2; }
        .protocol { border-left-color: #388e3c; }
        .task { border-left-color: #f57c00; }
        .status-completed { color: #388e3c; font-weight: bold; }
        .status-in-progress { color: #f57c00; font-weight: bold; }
        .status-delayed { color: #d32f2f; font-weight: bold; }
        .priority-high { background: #ffebee; }
        .priority-medium { background: #fff3e0; }
        .priority-low { background: #f1f8e9; }
        .progress-bar { 
            width: 100%; 
            height: 20px; 
            background: #ddd; 
            border-radius: 10px; 
            overflow: hidden; 
            margin: 5px 0; 
        }
        .progress-fill { 
            height: 100%; 
            background: linear-gradient(90deg, #4CAF50, #8BC34A); 
            transition: width 0.3s; 
        }
        .tags { margin-top: 5px; }
        .tag { 
            display: inline-block; 
            background: #e3f2fd; 
            color: #1976d2; 
            padding: 2px 8px; 
            border-radius: 12px; 
            font-size: 12px; 
            margin: 2px; 
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Research Timeline Report</h1>
        <p>Generated on ${format(new Date(), 'MMMM dd, yyyy')}</p>
    </div>
    
    <div class="summary">
        <h3>Timeline Summary</h3>
        <p><strong>Total Items:</strong> ${data.length}</p>
        <p><strong>Projects:</strong> ${data.filter(d => d.type === 'project').length}</p>
        <p><strong>Experiments:</strong> ${data.filter(d => d.type === 'experiment').length}</p>
        <p><strong>Protocols:</strong> ${data.filter(d => d.type === 'protocol').length}</p>
        <p><strong>Tasks:</strong> ${data.filter(d => d.type === 'task').length}</p>
        <p><strong>Completed:</strong> ${data.filter(d => d.status === 'completed').length}</p>
        <p><strong>In Progress:</strong> ${data.filter(d => d.status === 'in-progress').length}</p>
        <p><strong>Average Duration:</strong> ${Math.round(data.reduce((sum, item) => sum + item.duration_days, 0) / data.length)} days</p>
    </div>
    
    <h2>Timeline Items</h2>`;
        
        const timelineItems = data.map(item => {
            const statusClass = `status-${item.status}`;
            const priorityClass = `priority-${item.priority}`;
            const typeClass = item.type;
            
            return `
    <div class="timeline-item ${typeClass} ${priorityClass}">
        <h3>${item.name}</h3>
        <p><strong>Type:</strong> ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
        <p><strong>Duration:</strong> ${item.start_date} to ${item.end_date} (${item.duration_days} days)</p>
        <p><strong>Status:</strong> <span class="${statusClass}">${item.status}</span></p>
        <p><strong>Priority:</strong> ${item.priority}</p>
        <p><strong>Progress:</strong> ${item.progress}%</p>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${item.progress}%"></div>
        </div>
        ${item.description ? `<p><strong>Description:</strong> ${item.description}</p>` : ''}
        ${item.tags ? `<div class="tags"><strong>Tags:</strong> ${item.tags.split(', ').map((tag: string) => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
    </div>`;
        }).join('');
        
        const htmlFooter = `
</body>
</html>`;
        
        return htmlHeader + timelineItems + htmlFooter;
    };

    const handleTypeToggle = (type: string) => {
        setSelectedTypes(prev => 
            prev.includes(type) 
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'success';
            case 'in-progress': return 'warning';
            case 'delayed': return 'error';
            default: return 'default';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'project': return 'primary';
            case 'experiment': return 'secondary';
            case 'protocol': return 'success';
            case 'task': return 'info';
            default: return 'default';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'error';
            case 'medium': return 'warning';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    const timelineStats = {
        total: timelineData.length,
        completed: timelineData.filter(item => item.status === 'completed').length,
        inProgress: timelineData.filter(item => item.status === 'in-progress').length,
        delayed: timelineData.filter(item => item.status === 'delayed').length,
        averageDuration: timelineData.length > 0 
            ? Math.round(timelineData.reduce((sum, item) => sum + differenceInDays(item.endDate, item.startDate), 0) / timelineData.length)
            : 0
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon />
                    Research Timeline Export
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="h6" gutterBottom>Research Timeline Analysis</Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>Date Range:</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                size="small"
                            />
                            <TextField
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                size="small"
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>Item Types:</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {['project', 'experiment', 'protocol', 'task'].map(type => (
                                <Chip
                                    key={type}
                                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                                    color={selectedTypes.includes(type) ? 'primary' : 'default'}
                                    onClick={() => handleTypeToggle(type)}
                                    clickable
                                    size="small"
                                />
                            ))}
                        </Box>
                    </Grid>
                </Grid>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>Timeline Statistics:</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                            <Card>
                                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                                    <Typography variant="h4" color="primary">{timelineStats.total}</Typography>
                                    <Typography variant="body2">Total Items</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Card>
                                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                                    <Typography variant="h4" color="success.main">{timelineStats.completed}</Typography>
                                    <Typography variant="body2">Completed</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Card>
                                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                                    <Typography variant="h4" color="warning.main">{timelineStats.inProgress}</Typography>
                                    <Typography variant="body2">In Progress</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Card>
                                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                                    <Typography variant="h4" color="info.main">{timelineStats.averageDuration}</Typography>
                                    <Typography variant="body2">Avg Days</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Export Format</InputLabel>
                            <Select
                                value={exportFormat}
                                onChange={(e) => setExportFormat(e.target.value as any)}
                                label="Export Format"
                            >
                                <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
                                <MenuItem value="csv">CSV</MenuItem>
                                <MenuItem value="json">JSON</MenuItem>
                                <MenuItem value="html">HTML Report</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Filename"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>Timeline Preview:</Typography>
                    <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #eee', borderRadius: 1, p: 2 }}>
                        {timelineData.length === 0 ? (
                            <Typography color="text.secondary">No items in selected date range and types.</Typography>
                        ) : (
                            <List dense>
                                {timelineData.map(item => (
                                    <ListItem key={item.id} sx={{ borderBottom: '1px solid #eee' }}>
                                        <ListItemIcon>
                                            <Chip 
                                                label={item.type} 
                                                size="small" 
                                                color={getTypeColor(item.type) as any}
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.name}
                                            secondary={
                                                <Box>
                                                    <Typography variant="body2">
                                                        {format(item.startDate, 'MMM dd, yyyy')} - {format(item.endDate, 'MMM dd, yyyy')}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                        <Chip 
                                                            label={item.status} 
                                                            size="small" 
                                                            color={getStatusColor(item.status) as any}
                                                        />
                                                        <Chip 
                                                            label={item.priority} 
                                                            size="small" 
                                                            color={getPriorityColor(item.priority) as any}
                                                        />
                                                        <Typography variant="body2">
                                                            {item.progress}% complete
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        onClick={exportTimeline}
                        disabled={timelineData.length === 0 || loading}
                        startIcon={<DownloadIcon />}
                    >
                        Export Timeline
                    </Button>
                </Box>

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ResearchTimelineExport; 