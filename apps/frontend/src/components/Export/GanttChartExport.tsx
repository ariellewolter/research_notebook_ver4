import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, 
    Box, Typography, FormControl, InputLabel, Select, MenuItem,
    TextField, Chip, Alert, CircularProgress, Grid, Card, CardContent
} from '@mui/material';
import {
    Timeline as TimelineIcon, Download as DownloadIcon,
    Assessment as AssessmentIcon, CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { saveFileDialog } from '../../utils/fileSystemAPI';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface GanttItem {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies: string[];
    type: 'project' | 'experiment' | 'protocol' | 'task';
    status: 'not-started' | 'in-progress' | 'completed' | 'delayed';
    assignee?: string;
    description?: string;
}

interface GanttChartExportProps {
    open: boolean;
    onClose: () => void;
    projects: any[];
    experiments: any[];
    protocols: any[];
    tasks: any[];
}

const GanttChartExport: React.FC<GanttChartExportProps> = ({
    open, onClose, projects, experiments, protocols, tasks
}) => {
    const [ganttData, setGanttData] = useState<GanttItem[]>([]);
    const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx' | 'html'>('xlsx');
    const [filename, setFilename] = useState('research-gantt-chart');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedTypes, setSelectedTypes] = useState<string[]>(['project', 'experiment', 'protocol', 'task']);

    useEffect(() => {
        if (open) {
            generateGanttData();
        }
    }, [open, projects, experiments, protocols, tasks, selectedTypes]);

    const generateGanttData = () => {
        const items: GanttItem[] = [];

        // Add projects
        if (selectedTypes.includes('project')) {
            projects.forEach(project => {
                const projectExperiments = experiments.filter(exp => exp.projectId === project.id);
                const startDate = new Date(project.createdAt);
                const endDate = project.status === 'completed' 
                    ? new Date(project.updatedAt) 
                    : new Date();
                
                items.push({
                    id: project.id,
                    name: project.name,
                    start: startDate.toISOString().split('T')[0],
                    end: endDate.toISOString().split('T')[0],
                    progress: project.status === 'completed' ? 100 : 
                             project.status === 'in-progress' ? 50 : 0,
                    dependencies: [],
                    type: 'project',
                    status: project.status as any,
                    description: project.description
                });

                // Add child experiments
                projectExperiments.forEach(exp => {
                    const expStart = new Date(exp.createdAt);
                    const expEnd = exp.status === 'completed' 
                        ? new Date(exp.updatedAt) 
                        : new Date();
                    
                    items.push({
                        id: exp.id,
                        name: exp.name,
                        start: expStart.toISOString().split('T')[0],
                        end: expEnd.toISOString().split('T')[0],
                        progress: exp.status === 'completed' ? 100 : 
                                 exp.status === 'in-progress' ? 50 : 0,
                        dependencies: [project.id],
                        type: 'experiment',
                        status: exp.status as any,
                        description: exp.description
                    });
                });
            });
        }

        // Add protocols
        if (selectedTypes.includes('protocol')) {
            protocols.forEach(protocol => {
                const startDate = new Date(protocol.createdAt);
                const endDate = protocol.status === 'completed' 
                    ? new Date(protocol.updatedAt) 
                    : new Date();
                
                items.push({
                    id: protocol.id,
                    name: protocol.name,
                    start: startDate.toISOString().split('T')[0],
                    end: endDate.toISOString().split('T')[0],
                    progress: protocol.status === 'completed' ? 100 : 
                             protocol.status === 'in-progress' ? 50 : 0,
                    dependencies: [],
                    type: 'protocol',
                    status: protocol.status as any,
                    description: protocol.description
                });
            });
        }

        // Add tasks
        if (selectedTypes.includes('task')) {
            tasks.forEach(task => {
                if (task.date) {
                    const taskDate = new Date(task.date);
                    const endDate = new Date(taskDate);
                    endDate.setDate(endDate.getDate() + 1); // Tasks typically last 1 day
                    
                    items.push({
                        id: task.id,
                        name: task.title,
                        start: taskDate.toISOString().split('T')[0],
                        end: endDate.toISOString().split('T')[0],
                        progress: task.completed ? 100 : 0,
                        dependencies: [],
                        type: 'task',
                        status: task.completed ? 'completed' : 'in-progress',
                        description: task.description
                    });
                }
            });
        }

        setGanttData(items);
    };

    const exportGanttChart = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const exportData = ganttData.map(item => ({
                id: item.id,
                name: item.name,
                type: item.type,
                start_date: item.start,
                end_date: item.end,
                progress: item.progress,
                status: item.status,
                dependencies: item.dependencies.join(', '),
                description: item.description || '',
                duration_days: Math.ceil((new Date(item.end).getTime() - new Date(item.start).getTime()) / (1000 * 60 * 60 * 24))
            }));

            let content: string;
            let extension: string;

            switch (exportFormat) {
                case 'csv':
                    content = Papa.unparse(exportData);
                    extension = 'csv';
                    break;
                case 'json':
                    content = JSON.stringify(exportData, null, 2);
                    extension = 'json';
                    break;
                case 'xlsx':
                    const ws = XLSX.utils.json_to_sheet(exportData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Gantt Chart');
                    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                    // Convert ArrayBuffer to string for fileSystemAPI
                    const uint8Array = new Uint8Array(excelBuffer);
                    content = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
                    extension = 'xlsx';
                    break;
                case 'html':
                    content = generateHTMLGanttChart(exportData);
                    extension = 'html';
                    break;
            }

            const exportFilename = `${filename}.${extension}`;
            
            // Use fileSystemAPI for native file dialog
            const result = await saveFileDialog(content, exportFilename);
            
            if (result.success) {
                setSuccess(`Successfully exported Gantt chart to ${exportFilename}`);
            } else if (result.canceled) {
                setSuccess('Export canceled');
            } else {
                setError(result.error || 'Export failed');
            }
        } catch (err) {
            setError('Failed to export Gantt chart. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const generateHTMLGanttChart = (data: any[]): string => {
        const htmlHeader = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Research Gantt Chart</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .gantt-container { margin: 20px 0; }
        .gantt-item { 
            display: flex; 
            align-items: center; 
            margin: 5px 0; 
            padding: 10px; 
            border-radius: 5px; 
            background: #f5f5f5; 
        }
        .gantt-bar { 
            height: 20px; 
            background: linear-gradient(90deg, #4CAF50 var(--progress), #ddd var(--progress)); 
            border-radius: 10px; 
            margin-left: 10px; 
            flex-grow: 1; 
            position: relative; 
        }
        .gantt-label { 
            min-width: 200px; 
            font-weight: bold; 
        }
        .gantt-dates { 
            min-width: 150px; 
            color: #666; 
            font-size: 12px; 
        }
        .gantt-progress { 
            min-width: 60px; 
            text-align: right; 
            font-weight: bold; 
        }
        .project { background: #e3f2fd; }
        .experiment { background: #f3e5f5; }
        .protocol { background: #e8f5e8; }
        .task { background: #fff3e0; }
        h1 { color: #1976d2; }
        .summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Research Gantt Chart</h1>
    <div class="summary">
        <h3>Summary</h3>
        <p>Total Items: ${data.length}</p>
        <p>Projects: ${data.filter(d => d.type === 'project').length}</p>
        <p>Experiments: ${data.filter(d => d.type === 'experiment').length}</p>
        <p>Protocols: ${data.filter(d => d.type === 'protocol').length}</p>
        <p>Tasks: ${data.filter(d => d.type === 'task').length}</p>
    </div>
    <div class="gantt-container">`;
        
        const ganttItems = data.map(item => {
            const progress = item.progress || 0;
            const startDate = new Date(item.start_date).toLocaleDateString();
            const endDate = new Date(item.end_date).toLocaleDateString();
            
            return `
        <div class="gantt-item ${item.type}">
            <div class="gantt-label">${item.name}</div>
            <div class="gantt-dates">${startDate} - ${endDate}</div>
            <div class="gantt-bar" style="--progress: ${progress}%"></div>
            <div class="gantt-progress">${progress}%</div>
        </div>`;
        }).join('');
        
        const htmlFooter = `
    </div>
</body>
</html>`;
        
        return htmlHeader + ganttItems + htmlFooter;
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

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon />
                    Gantt Chart Export
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="h6" gutterBottom>Research Timeline Visualization</Typography>
                
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>Select Item Types:</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {['project', 'experiment', 'protocol', 'task'].map(type => (
                            <Chip
                                key={type}
                                label={type.charAt(0).toUpperCase() + type.slice(1)}
                                color={selectedTypes.includes(type) ? 'primary' : 'default'}
                                onClick={() => handleTypeToggle(type)}
                                clickable
                            />
                        ))}
                    </Box>
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
                                <MenuItem value="html">HTML Chart</MenuItem>
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
                    <Typography variant="subtitle2" gutterBottom>Gantt Chart Preview:</Typography>
                    <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #eee', borderRadius: 1, p: 2 }}>
                        {ganttData.length === 0 ? (
                            <Typography color="text.secondary">No items to display. Select item types above.</Typography>
                        ) : (
                            ganttData.map(item => (
                                <Card key={item.id} sx={{ mb: 1, p: 1 }}>
                                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip 
                                                label={item.type} 
                                                size="small" 
                                                color={getTypeColor(item.type) as any}
                                            />
                                            <Typography variant="body2" sx={{ flex: 1 }}>
                                                {item.name}
                                            </Typography>
                                            <Chip 
                                                label={item.status} 
                                                size="small" 
                                                color={getStatusColor(item.status) as any}
                                            />
                                            <Typography variant="body2" color="text.secondary">
                                                {item.start} - {item.end}
                                            </Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {item.progress}%
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        onClick={exportGanttChart}
                        disabled={ganttData.length === 0 || loading}
                        startIcon={<DownloadIcon />}
                    >
                        Export Gantt Chart
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
                {success && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        {success}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default GanttChartExport; 