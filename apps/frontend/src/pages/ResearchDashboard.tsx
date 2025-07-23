import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Paper,
    Chip,
    CircularProgress,
    Alert,
    LinearProgress,
    Divider,
    Tooltip,
} from '@mui/material';
import {
    Note as NoteIcon,
    Folder as ProjectIcon,
    PictureAsPdf as PdfIcon,
    Storage as DatabaseIcon,
    TableChart as TableIcon,
    Science as ProtocolIcon,
    Restaurant as RecipeIcon,
    LibraryBooks as ZoteroIcon,
    Event as EventIcon,
    Timeline as TimelineIcon,
    TrendingUp as TrendingUpIcon,
    BarChart as BarChartIcon,
    Group as GroupIcon,
    Biotech as DnaIcon,
    LocalFlorist as ChemicalIcon,
    DeviceHub as PathwayIcon,
    Assignment as ProtocolsIcon,
    Star as StarIcon,
    FlashOn as FlashOnIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { notesApi, projectsApi, pdfsApi, databaseApi, tablesApi, protocolsApi, recipesApi } from '../services/api';
import DatabaseStats from '../components/Database/DatabaseStats';

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({
    title,
    value,
    icon,
    color,
}) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ color, mr: 1 }}>{icon}</Box>
                <Typography variant="h4" component="div">
                    {value}
                </Typography>
            </Box>
            <Typography color="text.secondary" variant="body2">
                {title}
            </Typography>
        </CardContent>
    </Card>
);

const ResearchDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState({
        notes: 0,
        projects: 0,
        pdfs: 0,
        databaseEntries: 0,
        tables: 0,
        protocols: 0,
        recipes: 0,
    });
    const [recentNotes, setRecentNotes] = useState<any[]>([]);
    const [recentProjects, setRecentProjects] = useState<any[]>([]);
    const [experiments, setExperiments] = useState<any[]>([]);

    // --- Mock Data for Option C ---
    const productivity = {
        tasksCompleted: 18,
        notesCreated: 34,
        averageDaily: 4.2,
    };
    const citationData = {
        totalCitations: 247,
        recentCitations: 12,
        topCited: [
            { title: 'CRISPR Gene Editing Review', citations: 34, type: 'review' },
            { title: 'Protein Folding Mechanisms', citations: 28, type: 'research' },
            { title: 'Cell Cycle Analysis', citations: 19, type: 'methodology' },
        ],
    };
    const entityStats = {
        genes: { total: 156, active: 42, linked: 89 },
        chemicals: { total: 89, active: 23, linked: 67 },
        pathways: { total: 34, active: 8, linked: 28 },
        protocols: { total: 67, active: 12, linked: 45 },
    };
    const recentEntities = [
        { name: 'BRCA1', type: 'gene', experiments: 3, lastUsed: '2 days ago' },
        { name: 'Cisplatin', type: 'chemical', experiments: 2, lastUsed: '1 day ago' },
        { name: 'p53 Pathway', type: 'pathway', experiments: 1, lastUsed: '3 days ago' },
        { name: 'Western Blot', type: 'protocol', experiments: 4, lastUsed: '5 days ago' },
    ];
    const upcomingDeadlines = [
        { title: 'Submit Grant Application', date: '2025-07-25', priority: 'high' },
        { title: 'Conference Abstract Deadline', date: '2025-07-28', priority: 'medium' },
        { title: 'Complete Pilot Study', date: '2025-08-02', priority: 'medium' },
    ];

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [notesRes, projectsRes, pdfsRes, databaseRes, tablesRes, protocolsRes, recipesRes] = await Promise.allSettled([
                notesApi.getAll({ limit: 3 }),
                projectsApi.getAll(),
                pdfsApi.getAll({ limit: 1 }),
                databaseApi.getAll({ limit: 1 }),
                tablesApi.getAll({ limit: 1 }),
                protocolsApi.getAll({ limit: 1 }),
                recipesApi.getAll({ limit: 1 }),
            ]);
            const notesCount = notesRes.status === 'fulfilled' ? (notesRes.value.data.notes?.length || notesRes.value.data.length || 0) : 0;
            const projectsCount = projectsRes.status === 'fulfilled' ? (projectsRes.value.data.length || 0) : 0;
            const pdfsCount = pdfsRes.status === 'fulfilled' ? (pdfsRes.value.data.pdfs?.length || pdfsRes.value.data.length || 0) : 0;
            const databaseCount = databaseRes.status === 'fulfilled' ? (databaseRes.value.data.entries?.length || databaseRes.value.data.length || 0) : 0;
            const tablesCount = tablesRes.status === 'fulfilled' ? (tablesRes.value.data.tables?.length || tablesRes.value.data.length || 0) : 0;
            const protocolsCount = protocolsRes.status === 'fulfilled' ? (protocolsRes.value.data.protocols?.length || protocolsRes.value.data.length || 0) : 0;
            const recipesCount = recipesRes.status === 'fulfilled' ? (recipesRes.value.data.recipes?.length || recipesRes.value.data.length || 0) : 0;
            setStats({
                notes: notesCount,
                projects: projectsCount,
                pdfs: pdfsCount,
                databaseEntries: databaseCount,
                tables: tablesCount,
                protocols: protocolsCount,
                recipes: recipesCount,
            });
            if (notesRes.status === 'fulfilled') {
                const notes = notesRes.value.data.notes || notesRes.value.data || [];
                setRecentNotes(notes.slice(0, 3));
            }
            if (projectsRes.status === 'fulfilled') {
                const projects = projectsRes.value.data || [];
                setRecentProjects(projects.slice(0, 3));
                // Fetch experiments for the first project as a demo
                if (projects.length > 0) {
                    try {
                        const expRes = await projectsApi.getExperiments(projects[0].id);
                        setExperiments(expRes.data || []);
                    } catch {
                        setExperiments([]);
                    }
                }
            }
            setError(null);
        } catch (err: any) {
            setError('Failed to load dashboard data');
            console.error('Error loading dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Mock progress for experiments (replace with real progress if available)
    const getExperimentProgress = (exp: any) => Math.floor(Math.random() * 100);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Research Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Welcome to your research dashboard. Here’s an overview of your lab activities.
            </Typography>
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}
            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Notes" value={stats.notes} icon={<NoteIcon />} color="#1976d2" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Active Projects" value={stats.projects} icon={<ProjectIcon />} color="#2e7d32" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="PDF Documents" value={stats.pdfs} icon={<PdfIcon />} color="#ed6c02" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Protocols" value={stats.protocols} icon={<ProtocolIcon />} color="#4caf50" />
                </Grid>
            </Grid>
            {/* Productivity Analytics (Mock) */}
            <Paper sx={{ p: 2, mb: 4, background: '#f5f5fa' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Productivity Analytics</Typography>
                    <Chip label="Mock Data" size="small" color="warning" sx={{ ml: 2 }} />
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <Typography variant="subtitle2">Tasks Completed</Typography>
                        <Typography variant="h5">{productivity.tasksCompleted}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Typography variant="subtitle2">Notes Created</Typography>
                        <Typography variant="h5">{productivity.notesCreated}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Typography variant="subtitle2">Avg. Daily</Typography>
                        <Typography variant="h5">{productivity.averageDaily}</Typography>
                    </Grid>
                </Grid>
            </Paper>
            {/* Citation Analytics (Mock) */}
            <Paper sx={{ p: 2, mb: 4, background: '#f5f5fa' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BarChartIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Citation Analytics</Typography>
                    <Chip label="Mock Data" size="small" color="warning" sx={{ ml: 2 }} />
                </Box>
                <Typography>Total Citations: <b>{citationData.totalCitations}</b></Typography>
                <Typography>Recent: <b>+{citationData.recentCitations}</b></Typography>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Top Cited:</Typography>
                    <List>
                        {citationData.topCited.map((c, idx) => (
                            <ListItem key={idx}>
                                <ListItemIcon><StarIcon color="warning" /></ListItemIcon>
                                <ListItemText primary={c.title} secondary={`Citations: ${c.citations}`} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Paper>
            {/* Entity Stats (Mock) */}
            <Paper sx={{ p: 2, mb: 4, background: '#f5f5fa' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <GroupIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="h6">Entity Stats</Typography>
                    <Chip label="Mock Data" size="small" color="warning" sx={{ ml: 2 }} />
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <Box sx={{ p: 2, background: '#e3f2fd', borderRadius: 2 }}>
                            <DnaIcon color="primary" />
                            <Typography variant="subtitle2">Genes</Typography>
                            <Typography>{entityStats.genes.total} total</Typography>
                            <Typography>{entityStats.genes.active} active</Typography>
                            <Typography>{entityStats.genes.linked} linked</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Box sx={{ p: 2, background: '#fce4ec', borderRadius: 2 }}>
                            <ChemicalIcon color="secondary" />
                            <Typography variant="subtitle2">Chemicals</Typography>
                            <Typography>{entityStats.chemicals.total} total</Typography>
                            <Typography>{entityStats.chemicals.active} active</Typography>
                            <Typography>{entityStats.chemicals.linked} linked</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Box sx={{ p: 2, background: '#e8f5e9', borderRadius: 2 }}>
                            <PathwayIcon color="success" />
                            <Typography variant="subtitle2">Pathways</Typography>
                            <Typography>{entityStats.pathways.total} total</Typography>
                            <Typography>{entityStats.pathways.active} active</Typography>
                            <Typography>{entityStats.pathways.linked} linked</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Box sx={{ p: 2, background: '#fffde7', borderRadius: 2 }}>
                            <ProtocolsIcon color="warning" />
                            <Typography variant="subtitle2">Protocols</Typography>
                            <Typography>{entityStats.protocols.total} total</Typography>
                            <Typography>{entityStats.protocols.active} active</Typography>
                            <Typography>{entityStats.protocols.linked} linked</Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
            {/* Experiment Progress (Real+Mock) */}
            <Paper sx={{ p: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TimelineIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Experiment Progress</Typography>
                    <Chip label={experiments.length === 0 ? 'Mock Data' : 'Real Data'} size="small" color={experiments.length === 0 ? 'warning' : 'success'} sx={{ ml: 2 }} />
                </Box>
                {experiments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No experiments found for your projects. (Showing mock data)
                    </Typography>
                ) : (
                    <List>
                        {experiments.map((exp: any) => (
                            <ListItem key={exp.id} divider>
                                <ListItemIcon>
                                    <FlashOnIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={exp.name}
                                    secondary={exp.description || 'No description'}
                                />
                                <Box sx={{ minWidth: 120 }}>
                                    <LinearProgress variant="determinate" value={getExperimentProgress(exp)} sx={{ height: 8, borderRadius: 4 }} />
                                    <Typography variant="caption" color="text.secondary">
                                        {getExperimentProgress(exp)}% Complete
                                    </Typography>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>
            {/* Recent Activity (Real) */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Notes
                        </Typography>
                        {recentNotes.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                No notes yet. Create your first note to get started.
                            </Typography>
                        ) : (
                            <List>
                                {recentNotes.map((note) => (
                                    <ListItem key={note.id} divider>
                                        <ListItemIcon>
                                            <NoteIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={note.title}
                                            secondary={`${note.type} • ${new Date(note.date || note.createdAt).toLocaleDateString()}`}
                                        />
                                        <Chip
                                            label={note.type}
                                            size="small"
                                            color={note.type === 'experiment' ? 'primary' : 'secondary'}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Active Projects
                        </Typography>
                        {recentProjects.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                No projects yet. Create your first project to get started.
                            </Typography>
                        ) : (
                            <List>
                                {recentProjects.map((project) => (
                                    <ListItem key={project.id} divider>
                                        <ListItemIcon>
                                            <ProjectIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={project.name}
                                            secondary={project.description || 'No description'}
                                        />
                                        <Chip
                                            label="Active"
                                            size="small"
                                            color="success"
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>
            </Grid>
            {/* Upcoming Deadlines (Mock) */}
            <Paper sx={{ p: 2, mt: 4, background: '#f5f5fa' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EventIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Upcoming Deadlines</Typography>
                    <Chip label="Mock Data" size="small" color="warning" sx={{ ml: 2 }} />
                </Box>
                <List>
                    {upcomingDeadlines.map((d, idx) => (
                        <ListItem key={idx} divider>
                            <ListItemIcon>
                                <EventIcon color={d.priority === 'high' ? 'error' : d.priority === 'medium' ? 'warning' : 'success'} />
                            </ListItemIcon>
                            <ListItemText
                                primary={d.title}
                                secondary={`Due: ${d.date}`}
                            />
                            <Chip label={d.priority.charAt(0).toUpperCase() + d.priority.slice(1)} color={d.priority === 'high' ? 'error' : d.priority === 'medium' ? 'warning' : 'success'} size="small" />
                        </ListItem>
                    ))}
                </List>
            </Paper>
            {/* Recent Entities (Mock) */}
            <Paper sx={{ p: 2, mt: 4, background: '#f5f5fa' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FlashOnIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Recent Entities</Typography>
                    <Chip label="Mock Data" size="small" color="warning" sx={{ ml: 2 }} />
                </Box>
                <Grid container spacing={2}>
                    {recentEntities.map((e, idx) => (
                        <Grid item xs={12} sm={3} key={idx}>
                            <Box sx={{ background: '#f0f0f0', borderRadius: 2, p: 2, textAlign: 'center' }}>
                                <Typography variant="subtitle1" fontWeight="bold">{e.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{e.type}</Typography>
                                <Typography variant="caption" color="text.secondary">{e.lastUsed}</Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Paper>
            {/* Entities Overview (Real) */}
            <Grid container spacing={3} sx={{ mt: 4 }}>
                <Grid item xs={12}>
                    <DatabaseStats />
                </Grid>
            </Grid>
        </Box>
    );
};

export default ResearchDashboard; 