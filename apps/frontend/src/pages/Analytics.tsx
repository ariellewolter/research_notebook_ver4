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
    Tooltip
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    Assessment,
    Timeline,
    BarChart,
    PieChart,
    Refresh,
    FilterList
} from '@mui/icons-material';
import { LineChart, Line, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface AnalyticsData {
    experimentSuccess?: any;
    productivity?: any;
    resourceUsage?: any;
    dashboard?: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Analytics: React.FC = () => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState(0);
    const [data, setData] = useState<AnalyticsData>({});
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState('30');
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        fetchProjects();
        fetchDashboardData();
    }, []);

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
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(prev => ({ ...prev, dashboard: response.data }));
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
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
                filters.projectIds = selectedProjects;
            }

            const response = await api.post('/analytics/experiment-success', filters, {
                headers: { Authorization: `Bearer ${token}` }
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
                filters.projectIds = selectedProjects;
            }

            const response = await api.post('/analytics/productivity', filters, {
                headers: { Authorization: `Bearer ${token}` }
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

            const response = await api.post('/analytics/resource-usage', filters, {
                headers: { Authorization: `Bearer ${token}` }
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
        if (newValue === 1 && !data.experimentSuccess) {
            fetchExperimentSuccess();
        } else if (newValue === 2 && !data.productivity) {
            fetchProductivity();
        } else if (newValue === 3 && !data.resourceUsage) {
            fetchResourceUsage();
        }
    };

    const StatCard: React.FC<{ title: string; value: string | number; subtitle?: string; trend?: number; icon?: React.ReactNode }> = ({ title, value, subtitle, trend, icon }) => (
        <Card>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div">
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
                                ) : (
                                    <TrendingDown color="error" fontSize="small" />
                                )}
                                <Typography variant="body2" color={trend > 0 ? 'success.main' : 'error.main'} ml={0.5}>
                                    {Math.abs(trend)}%
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    {icon && (
                        <Box color="primary.main">
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
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Active Projects"
                                value={data.dashboard.quickStats.activeProjects}
                                subtitle={`${Math.round((data.dashboard.quickStats.activeProjects / data.dashboard.quickStats.totalProjects) * 100)}% of total`}
                                icon={<Timeline />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Total Experiments"
                                value={data.dashboard.quickStats.totalExperiments}
                                icon={<BarChart />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Task Completion"
                                value={`${data.dashboard.quickStats.taskCompletionRate}%`}
                                subtitle={`${data.dashboard.quickStats.completedTasks}/${data.dashboard.quickStats.pendingTasks + data.dashboard.quickStats.completedTasks} tasks`}
                                icon={<TrendingUp />}
                            />
                        </Grid>
                    </Grid>

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
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.dashboard.recentActivity.experiments.map((exp: any) => (
                                                    <TableRow key={exp.id}>
                                                        <TableCell>{exp.name}</TableCell>
                                                        <TableCell>{exp.project.name}</TableCell>
                                                        <TableCell>{new Date(exp.createdAt).toLocaleDateString()}</TableCell>
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
                                value={`${data.experimentSuccess.summary.successRate}%`}
                                subtitle={`${data.experimentSuccess.summary.successfulExperiments}/${data.experimentSuccess.summary.totalExperiments} experiments`}
                                icon={<TrendingUp />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Failure Rate"
                                value={`${data.experimentSuccess.summary.failureRate}%`}
                                subtitle={`${data.experimentSuccess.summary.failedExperiments} experiments`}
                                icon={<TrendingDown />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Inconclusive"
                                value={`${data.experimentSuccess.summary.inconclusiveRate}%`}
                                subtitle={`${data.experimentSuccess.summary.inconclusiveExperiments} experiments`}
                                icon={<Assessment />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Total Experiments"
                                value={data.experimentSuccess.summary.totalExperiments}
                                icon={<BarChart />}
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Monthly Success Trends
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={data.experimentSuccess.monthlyTrends}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="successRate" stroke="#8884d8" name="Success Rate (%)" />
                                            <Line type="monotone" dataKey="total" stroke="#82ca9d" name="Total Experiments" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Success by Project
                                    </Typography>
                                    <Box>
                                        {data.experimentSuccess.byProject.map((project: any, index: number) => (
                                            <Box key={project.projectId} mb={2}>
                                                <Box display="flex" justifyContent="space-between" mb={1}>
                                                    <Typography variant="body2">{project.projectName}</Typography>
                                                    <Typography variant="body2">{project.successRate.toFixed(1)}%</Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={project.successRate}
                                                    color={project.successRate > 70 ? 'success' : project.successRate > 40 ? 'warning' : 'error'}
                                                />
                                            </Box>
                                        ))}
                                    </Box>
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
                                title="Total Activities"
                                value={data.productivity.summary.totalActivities}
                                icon={<Assessment />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Task Completion"
                                value={`${data.productivity.summary.taskCompletionRate}%`}
                                subtitle={`${data.productivity.summary.completedTasks}/${data.productivity.summary.totalTasks} tasks`}
                                icon={<TrendingUp />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Avg Notes/Experiment"
                                value={data.productivity.summary.avgNotesPerExperiment}
                                icon={<BarChart />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Total Notes"
                                value={data.productivity.summary.totalNotes}
                                icon={<Timeline />}
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Activity by Day of Week
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsBarChart data={Object.entries(data.productivity.activityPatterns.byDayOfWeek).map(([day, count]) => ({ day, count }))}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="day" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Bar dataKey="count" fill="#8884d8" />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Activity by Hour
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsBarChart data={Object.entries(data.productivity.activityPatterns.byHour).map(([hour, count]) => ({ hour, count }))}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="hour" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Bar dataKey="count" fill="#82ca9d" />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
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
                                value={data.resourceUsage.summary.totalResources}
                                icon={<Assessment />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Resource Types"
                                value={data.resourceUsage.summary.uniqueResourceTypes}
                                icon={<BarChart />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Protocols"
                                value={data.resourceUsage.summary.totalProtocols}
                                icon={<Timeline />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Recipes"
                                value={data.resourceUsage.summary.totalRecipes}
                                icon={<TrendingUp />}
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Resource Usage by Type
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsPieChart>
                                            <Pie
                                                data={data.resourceUsage.resourceUsage.byType}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="count"
                                            >
                                                {data.resourceUsage.resourceUsage.byType.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Top Resources
                                    </Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Resource</TableCell>
                                                    <TableCell>Usage Count</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.resourceUsage.resourceUsage.topResources.map((resource: any) => (
                                                    <TableRow key={resource.name}>
                                                        <TableCell>{resource.name}</TableCell>
                                                        <TableCell>{resource.usageCount}</TableCell>
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

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Analytics Dashboard</Typography>
                <Box display="flex" gap={2}>
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
                    <Tooltip title="Refresh Data">
                        <IconButton onClick={fetchDashboardData}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

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
        </Box>
    );
};

export default Analytics; 