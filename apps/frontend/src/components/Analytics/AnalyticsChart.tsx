import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { notesApi, projectsApi, pdfsApi, databaseApi } from '../../services/api';

interface ChartData {
    name: string;
    value?: number;
    [key: string]: any;
}

interface AnalyticsChartProps {
    type: 'activity' | 'entities' | 'progress';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ type }) => {
    const [data, setData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<string>('7d');

    useEffect(() => {
        loadChartData();
    }, [type, timeRange]);

    const loadChartData = async () => {
        try {
            setLoading(true);
            let chartData: ChartData[] = [];

            switch (type) {
                case 'activity':
                    chartData = await loadActivityData();
                    break;
                case 'entities':
                    chartData = await loadEntityData();
                    break;
                case 'progress':
                    chartData = await loadProgressData();
                    break;
            }

            setData(chartData);
            setError(null);
        } catch (err: any) {
            setError('Failed to load chart data');
            console.error('Error loading chart data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadActivityData = async (): Promise<ChartData[]> => {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const activityData: ChartData[] = [];

        // Generate date labels
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            activityData.push({
                name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                date: date.toISOString().split('T')[0],
                notes: 0,
                projects: 0,
                pdfs: 0,
                database: 0,
            });
        }

        // Load actual data
        try {
            const [notesRes, projectsRes, pdfsRes, databaseRes] = await Promise.allSettled([
                notesApi.getAll(),
                projectsApi.getAll(),
                pdfsApi.getAll(),
                databaseApi.getAll(),
            ]);

            // Process notes
            if (notesRes.status === 'fulfilled') {
                const notes = notesRes.value.data.notes || notesRes.value.data || [];
                notes.forEach((note: any) => {
                    const noteDate = new Date(note.createdAt).toISOString().split('T')[0];
                    const dataPoint = activityData.find(d => d.date === noteDate);
                    if (dataPoint) {
                        dataPoint.notes++;
                    }
                });
            }

            // Process projects
            if (projectsRes.status === 'fulfilled') {
                const projects = projectsRes.value.data || [];
                projects.forEach((project: any) => {
                    const projectDate = new Date(project.createdAt).toISOString().split('T')[0];
                    const dataPoint = activityData.find(d => d.date === projectDate);
                    if (dataPoint) {
                        dataPoint.projects++;
                    }
                });
            }

            // Process PDFs
            if (pdfsRes.status === 'fulfilled') {
                const pdfs = pdfsRes.value.data.pdfs || pdfsRes.value.data || [];
                pdfs.forEach((pdf: any) => {
                    const pdfDate = new Date(pdf.uploadedAt || pdf.createdAt).toISOString().split('T')[0];
                    const dataPoint = activityData.find(d => d.date === pdfDate);
                    if (dataPoint) {
                        dataPoint.pdfs++;
                    }
                });
            }

            // Process database entries
            if (databaseRes.status === 'fulfilled') {
                const entries = databaseRes.value.data.entries || databaseRes.value.data || [];
                entries.forEach((entry: any) => {
                    const entryDate = new Date(entry.createdAt).toISOString().split('T')[0];
                    const dataPoint = activityData.find(d => d.date === entryDate);
                    if (dataPoint) {
                        dataPoint.database++;
                    }
                });
            }
        } catch (error) {
            console.error('Error processing activity data:', error);
        }

        return activityData;
    };

    const loadEntityData = async (): Promise<ChartData[]> => {
        const entityData: ChartData[] = [];

        try {
            const [notesRes, projectsRes, pdfsRes, databaseRes] = await Promise.allSettled([
                notesApi.getAll(),
                projectsApi.getAll(),
                pdfsApi.getAll(),
                databaseApi.getAll(),
            ]);

            // Count notes by type
            if (notesRes.status === 'fulfilled') {
                const notes = notesRes.value.data.notes || notesRes.value.data || [];
                const noteTypes: { [key: string]: number } = {};
                notes.forEach((note: any) => {
                    noteTypes[note.type] = (noteTypes[note.type] || 0) + 1;
                });
                Object.entries(noteTypes).forEach(([type, count]) => {
                    entityData.push({
                        name: type.charAt(0).toUpperCase() + type.slice(1),
                        value: count,
                        type: 'notes',
                    });
                });
            }

            // Count database entries by type
            if (databaseRes.status === 'fulfilled') {
                const entries = databaseRes.value.data.entries || databaseRes.value.data || [];
                const entryTypes: { [key: string]: number } = {};
                entries.forEach((entry: any) => {
                    entryTypes[entry.type] = (entryTypes[entry.type] || 0) + 1;
                });
                Object.entries(entryTypes).forEach(([type, count]) => {
                    entityData.push({
                        name: type.replace('_', ' '),
                        value: count,
                        type: 'database',
                    });
                });
            }

            // Add project count
            if (projectsRes.status === 'fulfilled') {
                const projects = projectsRes.value.data || [];
                entityData.push({
                    name: 'Projects',
                    value: projects.length,
                    type: 'projects',
                });
            }

            // Add PDF count
            if (pdfsRes.status === 'fulfilled') {
                const pdfs = pdfsRes.value.data.pdfs || pdfsRes.value.data || [];
                entityData.push({
                    name: 'PDFs',
                    value: pdfs.length,
                    type: 'pdfs',
                });
            }
        } catch (error) {
            console.error('Error processing entity data:', error);
        }

        return entityData;
    };

    const loadProgressData = async (): Promise<ChartData[]> => {
        const progressData: ChartData[] = [];

        try {
            const [notesRes, projectsRes] = await Promise.allSettled([
                notesApi.getAll(),
                projectsApi.getAll(),
            ]);

            // Calculate completion based on note types
            if (notesRes.status === 'fulfilled') {
                const notes = notesRes.value.data.notes || notesRes.value.data || [];
                const totalNotes = notes.length;
                const experimentNotes = notes.filter((note: any) => note.type === 'experiment').length;
                const literatureNotes = notes.filter((note: any) => note.type === 'literature').length;
                const dailyNotes = notes.filter((note: any) => note.type === 'daily').length;

                progressData.push(
                    { name: 'Experiment Notes', value: experimentNotes, total: totalNotes },
                    { name: 'Literature Notes', value: literatureNotes, total: totalNotes },
                    { name: 'Daily Notes', value: dailyNotes, total: totalNotes }
                );
            }

            // Calculate project progress
            if (projectsRes.status === 'fulfilled') {
                const projects = projectsRes.value.data || [];
                const totalProjects = projects.length;
                const projectsWithExperiments = projects.filter((project: any) =>
                    project.experiments && project.experiments.length > 0
                ).length;

                progressData.push(
                    { name: 'Projects with Experiments', value: projectsWithExperiments, total: totalProjects }
                );
            }
        } catch (error) {
            console.error('Error processing progress data:', error);
        }

        return progressData;
    };

    const renderChart = () => {
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (error) {
            return (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            );
        }

        if (data.length === 0) {
            return (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No data available for this chart
                </Typography>
            );
        }

        switch (type) {
            case 'activity':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="notes" stroke="#8884d8" name="Notes" />
                            <Line type="monotone" dataKey="projects" stroke="#82ca9d" name="Projects" />
                            <Line type="monotone" dataKey="pdfs" stroke="#ffc658" name="PDFs" />
                            <Line type="monotone" dataKey="database" stroke="#ff7300" name="Database" />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'entities':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'progress':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={false} // Remove direct labels to prevent overlap
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    const getChartTitle = () => {
        switch (type) {
            case 'activity':
                return 'Activity Timeline';
            case 'entities':
                return 'Entity Distribution';
            case 'progress':
                return 'Research Progress';
            default:
                return 'Chart';
        }
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">{getChartTitle()}</Typography>
                    {type === 'activity' && (
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Time Range</InputLabel>
                            <Select
                                value={timeRange}
                                label="Time Range"
                                onChange={(e) => setTimeRange(e.target.value)}
                            >
                                <MenuItem value="7d">Last 7 Days</MenuItem>
                                <MenuItem value="30d">Last 30 Days</MenuItem>
                                <MenuItem value="90d">Last 90 Days</MenuItem>
                            </Select>
                        </FormControl>
                    )}
                </Box>
                {renderChart()}
            </CardContent>
        </Card>
    );
};

export default AnalyticsChart; 