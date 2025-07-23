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
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Note as NoteIcon,
    Folder as ProjectIcon,
    PictureAsPdf as PdfIcon,
    Storage as DatabaseIcon,
    TableChart as TableIcon,
    Science as ProtocolIcon,
    Restaurant as RecipeIcon,
    LibraryBooks as ZoteroIcon,
} from '@mui/icons-material';
import { notesApi, projectsApi, pdfsApi, databaseApi, tablesApi, protocolsApi, recipesApi } from '../services/api';
import AnalyticsChart from '../components/Analytics/AnalyticsChart';
import DatabaseStats from '../components/Database/DatabaseStats';

const OldDashboard: React.FC = () => {
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

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load data in parallel
            const [notesRes, projectsRes, pdfsRes, databaseRes, tablesRes, protocolsRes, recipesRes] = await Promise.allSettled([
                notesApi.getAll({ limit: 3 }),
                projectsApi.getAll(),
                pdfsApi.getAll({ limit: 1 }),
                databaseApi.getAll({ limit: 1 }),
                tablesApi.getAll({ limit: 1 }),
                protocolsApi.getAll({ limit: 1 }),
                recipesApi.getAll({ limit: 1 }),
            ]);

            // Calculate stats
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

            // Set recent notes
            if (notesRes.status === 'fulfilled') {
                const notes = notesRes.value.data.notes || notesRes.value.data || [];
                setRecentNotes(notes.slice(0, 3));
            }

            // Set recent projects
            if (projectsRes.status === 'fulfilled') {
                const projects = projectsRes.value.data || [];
                setRecentProjects(projects.slice(0, 3));
            }

            setError(null);
        } catch (err: any) {
            setError('Failed to load dashboard data');
            console.error('Error loading dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

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
                Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Welcome to your electronic lab notebook. Here's an overview of your research activities.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Notes"
                        value={stats.notes}
                        icon={<NoteIcon />}
                        color="#1976d2"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Active Projects"
                        value={stats.projects}
                        icon={<ProjectIcon />}
                        color="#2e7d32"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="PDF Documents"
                        value={stats.pdfs}
                        icon={<PdfIcon />}
                        color="#ed6c02"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Database Entries"
                        value={stats.databaseEntries}
                        icon={<DatabaseIcon />}
                        color="#9c27b0"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Data Tables"
                        value={stats.tables}
                        icon={<TableIcon />}
                        color="#ff9800"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Protocols"
                        value={stats.protocols}
                        icon={<ProtocolIcon />}
                        color="#4caf50"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Recipes"
                        value={stats.recipes}
                        icon={<RecipeIcon />}
                        color="#f44336"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Zotero"
                        value={0} // Placeholder for Zotero count
                        icon={<ZoteroIcon />}
                        color="#607d8b"
                    />
                </Grid>
            </Grid>

            {/* Recent Activity */}
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

            {/* Analytics Charts */}
            <Grid container spacing={3} sx={{ mt: 4 }}>
                <Grid item xs={12}>
                    <Typography variant="h5" gutterBottom>
                        Analytics & Insights
                    </Typography>
                </Grid>
                <Grid item xs={12} lg={8}>
                    <AnalyticsChart type="activity" />
                </Grid>
                <Grid item xs={12} lg={4}>
                    <AnalyticsChart type="entities" />
                </Grid>
                <Grid item xs={12}>
                    <AnalyticsChart type="progress" />
                </Grid>
            </Grid>

            {/* Database Statistics */}
            <Grid container spacing={3} sx={{ mt: 4 }}>
                <Grid item xs={12}>
                    <DatabaseStats />
                </Grid>
            </Grid>

            {/* Quick Actions */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Quick Actions
                </Typography>
                <Grid container spacing={2}>
                    <Grid item>
                        <Chip
                            icon={<NoteIcon />}
                            label="Create New Note"
                            clickable
                            color="primary"
                        />
                    </Grid>
                    <Grid item>
                        <Chip
                            icon={<ProjectIcon />}
                            label="Start New Project"
                            clickable
                            color="primary"
                        />
                    </Grid>
                    <Grid item>
                        <Chip
                            icon={<PdfIcon />}
                            label="Upload PDF"
                            clickable
                            color="primary"
                        />
                    </Grid>
                    <Grid item>
                        <Chip
                            icon={<DatabaseIcon />}
                            label="Add Database Entry"
                            clickable
                            color="primary"
                        />
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default OldDashboard; 