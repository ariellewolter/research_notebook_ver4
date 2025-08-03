import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Paper,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Chip,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Switch,
    FormControlLabel,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    Assessment,
    Timeline,
    BarChart,
    PieChart,
    Refresh,
    FilterList,
    Download,
    Compare,
    Analytics as AnalyticsIcon,
    ShowChart,
    Timeline as TimelineIcon,
    Speed,
    CheckCircle,
    Warning,
    Error,
    ExpandMore,
    CalendarToday,
    TrendingFlat,
    AutoGraph,
    ViewTimeline,
    PlaylistPlay,
    Rule,
    IntegrationInstructions,
    PlayArrow,
    Pause,
    Stop,
    Save,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    BarChart as RechartsBarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    ComposedChart,
    ScatterChart,
    Scatter,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface AnalyticsData {
    experimentSuccess?: any;
    productivity?: any;
    resourceUsage?: any;
    dashboard?: any;
    comparative?: any;
    predictive?: any;
}

interface ExportOptions {
    format: 'csv' | 'json' | 'xlsx';
    dateRange: string;
    includeCharts: boolean;
    includeRawData: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

const Analytics: React.FC = () => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState(0);
    const [data, setData] = useState<AnalyticsData>({});
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState('30');
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [exportOptions, setExportOptions] = useState<ExportOptions>({
        format: 'csv',
        dateRange: '30',
        includeCharts: true,
        includeRawData: true
    });
    const [comparisonMode, setComparisonMode] = useState(false);
    const [comparisonDateRange, setComparisonDateRange] = useState('30');
    const [realTimeUpdates, setRealTimeUpdates] = useState(false);
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(30000); // 30 seconds
    const [showPredictiveAnalytics, setShowPredictiveAnalytics] = useState(false);

    useEffect(() => {
        fetchProjects();
        fetchDashboardData();
        if (comparisonMode) {
            fetchComparativeData();
        }
        if (showPredictiveAnalytics) {
            fetchPredictiveData();
        }
    }, [dateRange, selectedProjects, comparisonMode, comparisonDateRange, showPredictiveAnalytics]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (realTimeUpdates) {
            interval = setInterval(() => {
                fetchDashboardData();
                if (comparisonMode) fetchComparativeData();
                if (showPredictiveAnalytics) fetchPredictiveData();
            }, autoRefreshInterval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [realTimeUpdates, autoRefreshInterval, comparisonMode, showPredictiveAnalytics]);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(response.data);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/analytics/dashboard', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    dateRange,
                    projects: selectedProjects.join(',')
                }
            });
            setData(prev => ({ ...prev, dashboard: response.data }));
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComparativeData = async () => {
        try {
            const response = await api.get('/analytics/comparative', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    currentRange: dateRange,
                    comparisonRange: comparisonDateRange,
                    projects: selectedProjects.join(',')
                }
            });
            setData(prev => ({ ...prev, comparative: response.data }));
        } catch (error) {
            console.error('Failed to fetch comparative data:', error);
        }
    };

    const fetchPredictiveData = async () => {
        try {
            const response = await api.get('/analytics/predictive', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    dateRange,
                    projects: selectedProjects.join(','),
                    forecastPeriod: '30' // 30 days forecast
                }
            });
            setData(prev => ({ ...prev, predictive: response.data }));
        } catch (error) {
            console.error('Failed to fetch predictive data:', error);
        }
    };

    const fetchExperimentSuccess = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (dateRange !== 'all') {
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - parseInt(dateRange));
                filters.dateRange = {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                };
            }
            if (selectedProjects.length > 0) {
                filters.projects = selectedProjects;
            }

            const response = await api.get('/analytics/experiment-success', {
                headers: { Authorization: `Bearer ${token}` },
                params: filters
            });
            setData(prev => ({ ...prev, experimentSuccess: response.data }));
        } catch (error) {
            console.error('Failed to fetch experiment success data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProductivity = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (dateRange !== 'all') {
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - parseInt(dateRange));
                filters.dateRange = {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                };
            }
            if (selectedProjects.length > 0) {
                filters.projects = selectedProjects;
            }

            const response = await api.get('/analytics/productivity', {
                headers: { Authorization: `Bearer ${token}` },
                params: filters
            });
            setData(prev => ({ ...prev, productivity: response.data }));
        } catch (error) {
            console.error('Failed to fetch productivity data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchResourceUsage = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (dateRange !== 'all') {
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - parseInt(dateRange));
                filters.dateRange = {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                };
            }
            if (selectedProjects.length > 0) {
                filters.projects = selectedProjects;
            }

            const response = await api.get('/analytics/resource-usage', {
                headers: { Authorization: `Bearer ${token}` },
                params: filters
            });
            setData(prev => ({ ...prev, resourceUsage: response.data }));
        } catch (error) {
            console.error('Failed to fetch resource usage data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        switch (newValue) {
            case 1:
                fetchExperimentSuccess();
                break;
            case 2:
                fetchProductivity();
                break;
            case 3:
                fetchResourceUsage();
                break;
            default:
                fetchDashboardData();
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/analytics/export', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    ...exportOptions,
                    dateRange,
                    projects: selectedProjects.join(',')
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `analytics-export-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setExportDialogOpen(false);
        } catch (error) {
            console.error('Failed to export analytics data:', error);
        }
    };

    const StatCard: React.FC<{
        title: string;
        value: string | number;
        subtitle?: string;
        trend?: number;
        icon?: React.ReactNode;
        color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
        comparison?: { value: number; label: string };
    }> = ({ title, value, subtitle, trend, icon, color = 'primary', comparison }) => (
        <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div" color={color}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" color="textSecondary">
                                {subtitle}
                            </Typography>
                        )}
                        {trend !== undefined && (
                            <Box display="flex" alignItems="center" mt={1}>
                                {trend > 0 ? (
                                    <TrendingUp color="success" fontSize="small" />
                                ) : trend < 0 ? (
                                    <TrendingDown color="error" fontSize="small" />
                                ) : (
                                    <TrendingFlat color="action" fontSize="small" />
                                )}
                                <Typography
                                    variant="body2"
                                    color={trend > 0 ? 'success.main' : trend < 0 ? 'error.main' : 'text.secondary'}
                                    ml={0.5}
                                >
                                    {Math.abs(trend)}%
                                </Typography>
                            </Box>
                        )}
                        {comparison && (
                            <Box display="flex" alignItems="center" mt={1}>
                                <Typography variant="caption" color="textSecondary">
                                    vs {comparison.label}: {comparison.value > 0 ? '+' : ''}{comparison.value}%
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    {icon && (
                        <Box
                            sx={{
                                p: 1,
                                borderRadius: 1,
                                bgcolor: `${color}.light`,
                                color: `${color}.main`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );

    const DashboardTab = () => (
        <Box>
            {loading && <LinearProgress />}
            {data.dashboard && (
                <>
                    <Grid container spacing={3} mb={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Total Projects"
                                value={data.dashboard.quickStats.totalProjects}
                                icon={<Assessment />}
                                color="primary"
                                trend={data.comparative?.projects?.trend}
                                comparison={data.comparative?.projects?.comparison}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Active Projects"
                                value={data.dashboard.quickStats.activeProjects}
                                subtitle={`${Math.round((data.dashboard.quickStats.activeProjects / data.dashboard.quickStats.totalProjects) * 100)}% of total`}
                                icon={<Timeline />}
                                color="success"
                                trend={data.comparative?.activeProjects?.trend}
                                comparison={data.comparative?.activeProjects?.comparison}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Total Experiments"
                                value={data.dashboard.quickStats.totalExperiments}
                                icon={<BarChart />}
                                color="info"
                                trend={data.comparative?.experiments?.trend}
                                comparison={data.comparative?.experiments?.comparison}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Task Completion"
                                value={`${data.dashboard.quickStats.taskCompletionRate}%`}
                                subtitle={`${data.dashboard.quickStats.completedTasks}/${data.dashboard.quickStats.pendingTasks + data.dashboard.quickStats.completedTasks} tasks`}
                                icon={<TrendingUp />}
                                color="warning"
                                trend={data.comparative?.taskCompletion?.trend}
                                comparison={data.comparative?.taskCompletion?.comparison}
                            />
                        </Grid>
                    </Grid>

                    {/* Enhanced Charts Section */}
                    <Grid container spacing={3} mb={3}>
                        <Grid item xs={12} md={8}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Productivity Trends
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <ComposedChart data={data.dashboard.productivityTrends}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Legend />
                                            <Area type="monotone" dataKey="tasks" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                                            <Bar dataKey="experiments" fill="#82ca9d" />
                                            <Line type="monotone" dataKey="efficiency" stroke="#ff7300" strokeWidth={2} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Project Distribution
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsPieChart>
                                            <Pie
                                                data={data.dashboard.projectDistribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {data.dashboard.projectDistribution.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Predictive Analytics Section */}
                    {showPredictiveAnalytics && data.predictive && (
                        <Grid container spacing={3} mb={3}>
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Predictive Analytics - 30-Day Forecast
                                        </Typography>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={data.predictive.forecast}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <RechartsTooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="actual" stroke="#8884d8" strokeWidth={2} />
                                                <Line type="monotone" dataKey="predicted" stroke="#ff7300" strokeWidth={2} strokeDasharray="5 5" />
                                                <Line type="monotone" dataKey="upperBound" stroke="#82ca9d" strokeWidth={1} strokeDasharray="3 3" />
                                                <Line type="monotone" dataKey="lowerBound" stroke="#82ca9d" strokeWidth={1} strokeDasharray="3 3" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Recent Experiments
                                    </Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Name</TableCell>
                                                    <TableCell>Project</TableCell>
                                                    <TableCell>Date</TableCell>
                                                    <TableCell>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.dashboard.recentActivity.experiments.map((exp: any) => (
                                                    <TableRow key={exp.id}>
                                                        <TableCell>{exp.name}</TableCell>
                                                        <TableCell>{exp.project.name}</TableCell>
                                                        <TableCell>{new Date(exp.createdAt).toLocaleDateString()}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={exp.status}
                                                                size="small"
                                                                color={exp.status === 'completed' ? 'success' : exp.status === 'in_progress' ? 'warning' : 'default'}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Recent Tasks
                                    </Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Title</TableCell>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>Project</TableCell>
                                                    <TableCell>Priority</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.dashboard.recentActivity.tasks.map((task: any) => (
                                                    <TableRow key={task.id}>
                                                        <TableCell>{task.title}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={task.status}
                                                                size="small"
                                                                color={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'default'}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{task.project.name}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={task.priority}
                                                                size="small"
                                                                color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );

    const ExperimentSuccessTab = () => (
        <Box>
            {loading && <LinearProgress />}
            {data.experimentSuccess && (
                <>
                    <Grid container spacing={3} mb={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Success Rate"
                                value={`${data.experimentSuccess.successRate}%`}
                                icon={<CheckCircle />}
                                color="success"
                                trend={data.experimentSuccess.successRateTrend}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Total Experiments"
                                value={data.experimentSuccess.totalExperiments}
                                icon={<Assessment />}
                                color="primary"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Failed Experiments"
                                value={data.experimentSuccess.failedExperiments}
                                icon={<Error />}
                                color="error"
                                trend={data.experimentSuccess.failureRateTrend}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Average Duration"
                                value={`${data.experimentSuccess.averageDuration} days`}
                                icon={<Timeline />}
                                color="info"
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={3} mb={3}>
                        <Grid item xs={12} md={8}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Success Rate Over Time
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={data.experimentSuccess.successRateOverTime}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Area type="monotone" dataKey="successRate" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                                            <Line type="monotone" dataKey="trend" stroke="#ff7300" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Experiment Status Distribution
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsPieChart>
                                            <Pie
                                                data={data.experimentSuccess.statusDistribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {data.experimentSuccess.statusDistribution.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Top Performing Projects
                                    </Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Project</TableCell>
                                                    <TableCell>Success Rate</TableCell>
                                                    <TableCell>Experiments</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.experimentSuccess.topProjects.map((project: any) => (
                                                    <TableRow key={project.id}>
                                                        <TableCell>{project.name}</TableCell>
                                                        <TableCell>
                                                            <Box display="flex" alignItems="center">
                                                                <LinearProgress
                                                                    variant="determinate"
                                                                    value={project.successRate}
                                                                    sx={{ width: 60, mr: 1 }}
                                                                />
                                                                {project.successRate}%
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>{project.experimentCount}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Common Failure Reasons
                                    </Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Reason</TableCell>
                                                    <TableCell>Count</TableCell>
                                                    <TableCell>Percentage</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.experimentSuccess.failureReasons.map((reason: any) => (
                                                    <TableRow key={reason.reason}>
                                                        <TableCell>{reason.reason}</TableCell>
                                                        <TableCell>{reason.count}</TableCell>
                                                        <TableCell>{reason.percentage}%</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );

    const ProductivityTab = () => (
        <Box>
            {loading && <LinearProgress />}
            {data.productivity && (
                <>
                    <Grid container spacing={3} mb={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Task Completion Rate"
                                value={`${data.productivity.taskCompletionRate}%`}
                                icon={<CheckCircle />}
                                color="success"
                                trend={data.productivity.taskCompletionTrend}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Average Task Duration"
                                value={`${data.productivity.averageTaskDuration} days`}
                                icon={<Timeline />}
                                color="info"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Productivity Score"
                                value={data.productivity.productivityScore}
                                icon={<Speed />}
                                color="primary"
                                trend={data.productivity.productivityTrend}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Overdue Tasks"
                                value={data.productivity.overdueTasks}
                                icon={<Warning />}
                                color="error"
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={3} mb={3}>
                        <Grid item xs={12} md={8}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Productivity Trends
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <ComposedChart data={data.productivity.productivityTrends}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Legend />
                                            <Bar dataKey="tasksCompleted" fill="#8884d8" />
                                            <Line type="monotone" dataKey="productivityScore" stroke="#ff7300" strokeWidth={2} />
                                            <Area type="monotone" dataKey="efficiency" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Task Priority Distribution
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsPieChart>
                                            <Pie
                                                data={data.productivity.priorityDistribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {data.productivity.priorityDistribution.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Most Productive Time Periods
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={data.productivity.timeAnalysis}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="timePeriod" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Bar dataKey="productivity" fill="#8884d8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Task Status Breakdown
                                    </Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>Count</TableCell>
                                                    <TableCell>Percentage</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.productivity.statusBreakdown.map((status: any) => (
                                                    <TableRow key={status.status}>
                                                        <TableCell>
                                                            <Chip
                                                                label={status.status}
                                                                size="small"
                                                                color={status.status === 'completed' ? 'success' : status.status === 'in_progress' ? 'warning' : 'default'}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{status.count}</TableCell>
                                                        <TableCell>{status.percentage}%</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );

    const ResourceUsageTab = () => (
        <Box>
            {loading && <LinearProgress />}
            {data.resourceUsage && (
                <>
                    <Grid container spacing={3} mb={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Total Resources"
                                value={data.resourceUsage.totalResources}
                                icon={<Assessment />}
                                color="primary"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Active Resources"
                                value={data.resourceUsage.activeResources}
                                icon={<CheckCircle />}
                                color="success"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Utilization Rate"
                                value={`${data.resourceUsage.utilizationRate}%`}
                                icon={<Speed />}
                                color="info"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Low Stock Items"
                                value={data.resourceUsage.lowStockItems}
                                icon={<Warning />}
                                color="error"
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={3} mb={3}>
                        <Grid item xs={12} md={8}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Resource Usage Over Time
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={data.resourceUsage.usageOverTime}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Legend />
                                            <Area type="monotone" dataKey="usage" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                                            <Line type="monotone" dataKey="capacity" stroke="#ff7300" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Resource Categories
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsPieChart>
                                            <Pie
                                                data={data.resourceUsage.categoryDistribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {data.resourceUsage.categoryDistribution.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Top Resources by Usage
                                    </Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Resource</TableCell>
                                                    <TableCell>Usage Count</TableCell>
                                                    <TableCell>Last Used</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.resourceUsage.topResources.map((resource: any) => (
                                                    <TableRow key={resource.name}>
                                                        <TableCell>{resource.name}</TableCell>
                                                        <TableCell>{resource.usageCount}</TableCell>
                                                        <TableCell>{new Date(resource.lastUsed).toLocaleDateString()}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Resource Efficiency
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RadarChart data={data.resourceUsage.efficiencyMetrics}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="metric" />
                                            <PolarRadiusAxis />
                                            <Radar name="Efficiency" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Advanced Analytics Dashboard</Typography>
                <Box display="flex" gap={2} alignItems="center">
                    {/* Advanced Controls */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={comparisonMode}
                                onChange={(e) => setComparisonMode(e.target.checked)}
                            />
                        }
                        label="Comparison Mode"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={realTimeUpdates}
                                onChange={(e) => setRealTimeUpdates(e.target.checked)}
                            />
                        }
                        label="Real-time Updates"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showPredictiveAnalytics}
                                onChange={(e) => setShowPredictiveAnalytics(e.target.checked)}
                            />
                        }
                        label="Predictive Analytics"
                    />

                    {/* Date Range Controls */}
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Date Range</InputLabel>
                        <Select
                            value={dateRange}
                            label="Date Range"
                            onChange={(e) => setDateRange(e.target.value)}
                        >
                            <MenuItem value="7">Last 7 days</MenuItem>
                            <MenuItem value="30">Last 30 days</MenuItem>
                            <MenuItem value="90">Last 90 days</MenuItem>
                            <MenuItem value="all">All time</MenuItem>
                        </Select>
                    </FormControl>

                    {comparisonMode && (
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Compare With</InputLabel>
                            <Select
                                value={comparisonDateRange}
                                label="Compare With"
                                onChange={(e) => setComparisonDateRange(e.target.value)}
                            >
                                <MenuItem value="30">Previous 30 days</MenuItem>
                                <MenuItem value="90">Previous 90 days</MenuItem>
                                <MenuItem value="180">Previous 180 days</MenuItem>
                            </Select>
                        </FormControl>
                    )}

                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Projects</InputLabel>
                        <Select
                            multiple
                            value={selectedProjects}
                            label="Projects"
                            onChange={(e) => setSelectedProjects(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                        >
                            {projects.map((project) => (
                                <MenuItem key={project.id} value={project.id}>
                                    {project.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Action Buttons */}
                    <Tooltip title="Export Data">
                        <IconButton onClick={() => setExportDialogOpen(true)}>
                            <Download />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh Data">
                        <IconButton onClick={fetchDashboardData}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Real-time Status Indicator */}
            {realTimeUpdates && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Real-time updates enabled - Data refreshes every {autoRefreshInterval / 1000} seconds
                </Alert>
            )}

            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
                    <Tab label="Dashboard" />
                    <Tab label="Experiment Success" />
                    <Tab label="Productivity" />
                    <Tab label="Resource Usage" />
                </Tabs>
            </Paper>

            {activeTab === 0 && <DashboardTab />}
            {activeTab === 1 && <ExperimentSuccessTab />}
            {activeTab === 2 && <ProductivityTab />}
            {activeTab === 3 && <ResourceUsageTab />}

            {/* Export Dialog */}
            <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Export Analytics Data</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Export Format</InputLabel>
                                <Select
                                    value={exportOptions.format}
                                    label="Export Format"
                                    onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                                >
                                    <MenuItem value="csv">CSV</MenuItem>
                                    <MenuItem value="json">JSON</MenuItem>
                                    <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={exportOptions.includeCharts}
                                        onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                                    />
                                }
                                label="Include Chart Data"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={exportOptions.includeRawData}
                                        onChange={(e) => setExportOptions(prev => ({ ...prev, includeRawData: e.target.checked }))}
                                    />
                                }
                                label="Include Raw Data"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleExport} variant="contained" startIcon={<Download />}>
                        Export
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Analytics; 