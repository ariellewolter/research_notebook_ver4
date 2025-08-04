import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Card,
    CardContent,
    CardActions,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Tooltip,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Switch,
    FormControlLabel,
    Grid,
    SelectChangeEvent
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    PlayArrow as PlayIcon,
    Schedule as ScheduleIcon,
    Analytics as AnalyticsIcon,
    Article as TemplateIcon,
    Description as DescriptionIcon,
    BarChart as BarChartIcon,
    PieChart as PieChartIcon,
    TableChart as TableChartIcon,
    TextFields as TextFieldsIcon,
    ExpandMore as ExpandMoreIcon,
    Download as DownloadIcon,
    Visibility as VisibilityIcon,
    Settings as SettingsIcon,
    Refresh as RefreshIcon,
    TrendingUp as TrendingUpIcon,
    CalendarToday as CalendarTodayIcon,
    Email as EmailIcon,
    AccessTime as AccessTimeIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Pending as PendingIcon
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { advancedReportingApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface ReportTemplate {
    id: string;
    name: string;
    description?: string;
    category: 'project' | 'experiment' | 'task' | 'analytics' | 'custom';
    dataSources: string[];
    layout: {
        sections: ReportSection[];
    };
    filters?: ReportFilter[];
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ReportSection {
    id: string;
    type: 'chart' | 'table' | 'summary' | 'text';
    title: string;
    config: any;
}

interface ReportFilter {
    field: string;
    type: 'date' | 'text' | 'select' | 'number';
    label: string;
    required: boolean;
}

interface CustomReport {
    id: string;
    name: string;
    description?: string;
    templateId?: string;
    template?: ReportTemplate;
    dataSources: string[];
    layout: {
        sections: ReportSection[];
    };
    filters?: any;
    schedule?: {
        enabled: boolean;
        frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
        dayOfWeek?: number;
        dayOfMonth?: number;
        time?: string;
        recipients?: string[];
    };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ScheduledReport {
    id: string;
    reportId: string;
    report: CustomReport;
    schedule: {
        frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
        dayOfWeek?: number;
        dayOfMonth?: number;
        time: string;
        recipients: string[];
        enabled: boolean;
    };
    lastRun?: string;
    nextRun?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ReportExecution {
    id: string;
    reportId: string;
    filters: any;
    format: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    data?: any;
    error?: string;
    startedAt: string;
    completedAt?: string;
    createdAt: string;
}

interface ReportAnalytics {
    summary: {
        totalReports: number;
        totalExecutions: number;
        averageExecutionsPerReport: number;
    };
    popularReports: Array<{
        reportId: string;
        _count: { reportId: number };
    }>;
    executionTrends: Array<{
        date: string;
        count: number;
    }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdvancedReporting: React.FC = () => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState(0);
    const [templates, setTemplates] = useState<ReportTemplate[]>([]);
    const [reports, setReports] = useState<CustomReport[]>([]);
    const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
    const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dialog states
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [scheduledDialogOpen, setScheduledDialogOpen] = useState(false);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);

    // Form states
    const [templateForm, setTemplateForm] = useState({
        name: '',
        description: '',
        category: 'project' as const,
        dataSources: [] as string[],
        layout: { sections: [] as ReportSection[] },
        filters: [] as ReportFilter[],
        isPublic: false
    });

    const [reportForm, setReportForm] = useState({
        name: '',
        description: '',
        templateId: '',
        dataSources: [] as string[],
        layout: { sections: [] as ReportSection[] },
        filters: {},
        schedule: {
            enabled: false,
            frequency: 'weekly' as const,
            dayOfWeek: 1,
            dayOfMonth: 1,
            time: '09:00',
            recipients: [] as string[]
        }
    });

    const [scheduledForm, setScheduledForm] = useState({
        reportId: '',
        schedule: {
            frequency: 'weekly' as const,
            dayOfWeek: 1,
            dayOfMonth: 1,
            time: '09:00',
            recipients: [] as string[],
            enabled: true
        }
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [templatesRes, reportsRes, scheduledRes, analyticsRes] = await Promise.all([
                advancedReportingApi.getTemplates(),
                advancedReportingApi.getReports(),
                advancedReportingApi.getScheduledReports(),
                advancedReportingApi.getAnalytics()
            ]);

            setTemplates(templatesRes.data);
            setReports(reportsRes.data);
            setScheduledReports(scheduledRes.data);
            setAnalytics(analyticsRes.data);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateSubmit = async () => {
        try {
            if (selectedTemplate) {
                await advancedReportingApi.updateTemplate(selectedTemplate.id, templateForm);
            } else {
                await advancedReportingApi.createTemplate(templateForm);
            }
            setTemplateDialogOpen(false);
            loadData();
        } catch (err) {
            console.error('Error saving template:', err);
            setError('Failed to save template');
        }
    };

    const handleReportSubmit = async () => {
        try {
            if (selectedReport) {
                await advancedReportingApi.updateReport(selectedReport.id, reportForm);
            } else {
                await advancedReportingApi.createReport(reportForm);
            }
            setReportDialogOpen(false);
            loadData();
        } catch (err) {
            console.error('Error saving report:', err);
            setError('Failed to save report');
        }
    };

    const handleScheduledSubmit = async () => {
        try {
            if (scheduledForm.reportId) {
                await advancedReportingApi.createScheduledReport(scheduledForm);
                setScheduledDialogOpen(false);
                loadData();
            }
        } catch (err) {
            console.error('Error saving scheduled report:', err);
            setError('Failed to save scheduled report');
        }
    };

    const handleGenerateReport = async (reportId: string) => {
        try {
            const response = await advancedReportingApi.generateReport(reportId, {
                format: 'json'
            });
            setSelectedReport(response.data);
            setPreviewDialogOpen(true);
        } catch (err) {
            console.error('Error generating report:', err);
            setError('Failed to generate report');
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            try {
                await advancedReportingApi.deleteTemplate(id);
                loadData();
            } catch (err) {
                console.error('Error deleting template:', err);
                setError('Failed to delete template');
            }
        }
    };

    const handleDeleteReport = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            try {
                await advancedReportingApi.deleteReport(id);
                loadData();
            } catch (err) {
                console.error('Error deleting report:', err);
                setError('Failed to delete report');
            }
        }
    };

    const handleDeleteScheduled = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this scheduled report?')) {
            try {
                await advancedReportingApi.deleteScheduledReport(id);
                loadData();
            } catch (err) {
                console.error('Error deleting scheduled report:', err);
                setError('Failed to delete scheduled report');
            }
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircleIcon color="success" />;
            case 'failed': return <ErrorIcon color="error" />;
            case 'running': return <RefreshIcon color="primary" />;
            default: return <PendingIcon color="action" />;
        }
    };

    const getFrequencyLabel = (frequency: string, dayOfWeek?: number, dayOfMonth?: number) => {
        switch (frequency) {
            case 'daily': return 'Daily';
            case 'weekly': return `Weekly (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek || 0]})`;
            case 'monthly': return `Monthly (${dayOfMonth || 1})`;
            case 'quarterly': return 'Quarterly';
            default: return frequency;
        }
    };

    const renderTemplatesTab = () => (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Report Templates</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setSelectedTemplate(null);
                        setTemplateForm({
                            name: '',
                            description: '',
                            category: 'project',
                            dataSources: [],
                            layout: { sections: [] },
                            filters: [],
                            isPublic: false
                        });
                        setTemplateDialogOpen(true);
                    }}
                >
                    New Template
                </Button>
            </Box>

            <Grid container spacing={2}>
                {templates.map((template) => (
                    <Grid item xs={12} md={6} lg={4} key={template.id}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                    <Box>
                                        <Typography variant="h6">{template.name}</Typography>
                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                            {template.description}
                                        </Typography>
                                        <Chip
                                            label={template.category}
                                            size="small"
                                            color="primary"
                                            sx={{ mr: 1 }}
                                        />
                                        <Chip
                                            label={`${template.dataSources.length} sources`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>
                                    <IconButton
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setTemplateForm({
                                                name: template.name,
                                                description: template.description || '',
                                                category: template.category,
                                                dataSources: template.dataSources,
                                                layout: template.layout,
                                                filters: template.filters || [],
                                                isPublic: template.isPublic
                                            });
                                            setTemplateDialogOpen(true);
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Box>
                            </CardContent>
                            <CardActions>
                                <Button size="small" startIcon={<DescriptionIcon />}>
                                    Use Template
                                </Button>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteTemplate(template.id)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );

    const renderReportsTab = () => (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Custom Reports</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setSelectedReport(null);
                        setReportForm({
                            name: '',
                            description: '',
                            templateId: '',
                            dataSources: [],
                            layout: { sections: [] },
                            filters: {},
                            schedule: {
                                enabled: false,
                                frequency: 'weekly',
                                dayOfWeek: 1,
                                dayOfMonth: 1,
                                time: '09:00',
                                recipients: []
                            }
                        });
                        setReportDialogOpen(true);
                    }}
                >
                    New Report
                </Button>
            </Box>

            <Grid container spacing={2}>
                {reports.map((report) => (
                    <Grid item xs={12} md={6} lg={4} key={report.id}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                    <Box>
                                        <Typography variant="h6">{report.name}</Typography>
                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                            {report.description}
                                        </Typography>
                                        <Box display="flex" gap={1} flexWrap="wrap">
                                            <Chip
                                                label={`${report.dataSources.length} sources`}
                                                size="small"
                                                variant="outlined"
                                            />
                                            {report.schedule?.enabled && (
                                                <Chip
                                                    label="Scheduled"
                                                    size="small"
                                                    color="secondary"
                                                    icon={<ScheduleIcon />}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                    <IconButton
                                        onClick={() => {
                                            setSelectedReport(report);
                                            setReportForm({
                                                name: report.name,
                                                description: report.description || '',
                                                templateId: report.templateId || '',
                                                dataSources: report.dataSources,
                                                layout: report.layout,
                                                filters: report.filters || {},
                                                schedule: report.schedule || {
                                                    enabled: false,
                                                    frequency: 'weekly',
                                                    dayOfWeek: 1,
                                                    dayOfMonth: 1,
                                                    time: '09:00',
                                                    recipients: []
                                                }
                                            });
                                            setReportDialogOpen(true);
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Box>
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    startIcon={<PlayIcon />}
                                    onClick={() => handleGenerateReport(report.id)}
                                >
                                    Generate
                                </Button>
                                <Button size="small" startIcon={<VisibilityIcon />}>
                                    Preview
                                </Button>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteReport(report.id)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );

    const renderScheduledTab = () => (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Scheduled Reports</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setScheduledForm({
                            reportId: '',
                            schedule: {
                                frequency: 'weekly',
                                dayOfWeek: 1,
                                dayOfMonth: 1,
                                time: '09:00',
                                recipients: [],
                                enabled: true
                            }
                        });
                        setScheduledDialogOpen(true);
                    }}
                >
                    New Schedule
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Report</TableCell>
                            <TableCell>Schedule</TableCell>
                            <TableCell>Next Run</TableCell>
                            <TableCell>Last Run</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {scheduledReports.map((scheduled) => (
                            <TableRow key={scheduled.id}>
                                <TableCell>
                                    <Typography variant="subtitle2">{scheduled.report.name}</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {scheduled.report.description}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {getFrequencyLabel(
                                            scheduled.schedule.frequency,
                                            scheduled.schedule.dayOfWeek,
                                            scheduled.schedule.dayOfMonth
                                        )}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {scheduled.schedule.time}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {scheduled.nextRun ? (
                                        <Typography variant="body2">
                                            {new Date(scheduled.nextRun).toLocaleDateString()}
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" color="textSecondary">
                                            Not scheduled
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {scheduled.lastRun ? (
                                        <Typography variant="body2">
                                            {new Date(scheduled.lastRun).toLocaleDateString()}
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" color="textSecondary">
                                            Never run
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={scheduled.isActive ? 'Active' : 'Inactive'}
                                        color={scheduled.isActive ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteScheduled(scheduled.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    const renderAnalyticsTab = () => (
        <Box>
            <Typography variant="h6" gutterBottom>Report Analytics</Typography>

            {analytics && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Reports
                                </Typography>
                                <Typography variant="h4">
                                    {analytics.summary.totalReports}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Executions
                                </Typography>
                                <Typography variant="h4">
                                    {analytics.summary.totalExecutions}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Avg Executions/Report
                                </Typography>
                                <Typography variant="h4">
                                    {analytics.summary.averageExecutionsPerReport.toFixed(1)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Execution Trends</Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={analytics.executionTrends}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="count" stroke="#8884d8" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Advanced Reporting
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                    <Tab label="Templates" icon={<TemplateIcon />} />
                    <Tab label="Reports" icon={<DescriptionIcon />} />
                    <Tab label="Scheduled" icon={<ScheduleIcon />} />
                    <Tab label="Analytics" icon={<AnalyticsIcon />} />
                </Tabs>
            </Box>

            {activeTab === 0 && renderTemplatesTab()}
            {activeTab === 1 && renderReportsTab()}
            {activeTab === 2 && renderScheduledTab()}
            {activeTab === 3 && renderAnalyticsTab()}

            {/* Template Dialog */}
            <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedTemplate ? 'Edit Template' : 'New Template'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Template Name"
                                value={templateForm.name}
                                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={templateForm.description}
                                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={templateForm.category}
                                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value as any })}
                                >
                                    <MenuItem value="project">Project</MenuItem>
                                    <MenuItem value="experiment">Experiment</MenuItem>
                                    <MenuItem value="task">Task</MenuItem>
                                    <MenuItem value="analytics">Analytics</MenuItem>
                                    <MenuItem value="custom">Custom</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={templateForm.isPublic}
                                        onChange={(e) => setTemplateForm({ ...templateForm, isPublic: e.target.checked })}
                                    />
                                }
                                label="Public Template"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleTemplateSubmit} variant="contained">
                        {selectedTemplate ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Report Dialog */}
            <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedReport ? 'Edit Report' : 'New Report'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Report Name"
                                value={reportForm.name}
                                onChange={(e) => setReportForm({ ...reportForm, name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={reportForm.description}
                                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Template (Optional)</InputLabel>
                                <Select
                                    value={reportForm.templateId}
                                    onChange={(e) => setReportForm({ ...reportForm, templateId: e.target.value })}
                                >
                                    <MenuItem value="">No Template</MenuItem>
                                    {templates.map((template) => (
                                        <MenuItem key={template.id} value={template.id}>
                                            {template.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={reportForm.schedule.enabled}
                                        onChange={(e) => setReportForm({
                                            ...reportForm,
                                            schedule: { ...reportForm.schedule, enabled: e.target.checked }
                                        })}
                                    />
                                }
                                label="Enable Scheduling"
                            />
                        </Grid>
                        {reportForm.schedule.enabled && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Frequency</InputLabel>
                                        <Select
                                            value={reportForm.schedule.frequency}
                                            onChange={(e) => setReportForm({
                                                ...reportForm,
                                                schedule: { ...reportForm.schedule, frequency: e.target.value as any }
                                            })}
                                        >
                                            <MenuItem value="daily">Daily</MenuItem>
                                            <MenuItem value="weekly">Weekly</MenuItem>
                                            <MenuItem value="monthly">Monthly</MenuItem>
                                            <MenuItem value="quarterly">Quarterly</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="time"
                                        label="Time"
                                        value={reportForm.schedule.time}
                                        onChange={(e) => setReportForm({
                                            ...reportForm,
                                            schedule: { ...reportForm.schedule, time: e.target.value }
                                        })}
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleReportSubmit} variant="contained">
                        {selectedReport ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Scheduled Report Dialog */}
            <Dialog open={scheduledDialogOpen} onClose={() => setScheduledDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Schedule Report</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Report</InputLabel>
                                <Select
                                    value={scheduledForm.reportId}
                                    onChange={(e) => setScheduledForm({ ...scheduledForm, reportId: e.target.value })}
                                >
                                    {reports.map((report) => (
                                        <MenuItem key={report.id} value={report.id}>
                                            {report.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Frequency</InputLabel>
                                <Select
                                    value={scheduledForm.schedule.frequency}
                                    onChange={(e) => setScheduledForm({
                                        ...scheduledForm,
                                        schedule: { ...scheduledForm.schedule, frequency: e.target.value as any }
                                    })}
                                >
                                    <MenuItem value="daily">Daily</MenuItem>
                                    <MenuItem value="weekly">Weekly</MenuItem>
                                    <MenuItem value="monthly">Monthly</MenuItem>
                                    <MenuItem value="quarterly">Quarterly</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="time"
                                label="Time"
                                value={scheduledForm.schedule.time}
                                onChange={(e) => setScheduledForm({
                                    ...scheduledForm,
                                    schedule: { ...scheduledForm.schedule, time: e.target.value }
                                })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setScheduledDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleScheduledSubmit} variant="contained">
                        Schedule
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle>
                    Report Preview
                    {selectedReport && (
                        <Typography variant="subtitle2" color="textSecondary">
                            {selectedReport.name}
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent>
                    {selectedReport && (
                        <Box>
                            <Typography variant="h6" gutterBottom>Report Data</Typography>
                            <pre style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto' }}>
                                {JSON.stringify(selectedReport, null, 2)}
                            </pre>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
                    <Button startIcon={<DownloadIcon />} variant="contained">
                        Export
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdvancedReporting; 