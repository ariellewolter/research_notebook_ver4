import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Divider,
    CircularProgress,
    Alert,
    Snackbar,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Drawer,
    List as MUIList,
    ListItem as MUIListItem,
    ListItemText as MUIListItemText,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Science as ScienceIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    Biotech as ExperimentIcon,
} from '@mui/icons-material';
import { projectsApi } from '../services/api';
import ColorLegend from '../components/Legend/ColorLegend';
import { useThemePalette } from '../services/ThemePaletteContext';
import { NOTE_TYPE_TO_PALETTE_ROLE } from '../services/colorPalettes';
import ImportExportDialog from '../components/ImportExportDialog';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { databaseApi } from '../services/api';
import { linksApi, notesApi, protocolsApi, recipesApi, pdfsApi } from '../services/api';
import Autocomplete from '@mui/material/Autocomplete';

// Update Project interface
type ProjectStatus = 'active' | 'archived' | 'future';
interface Project {
    id: string;
    name: string;
    description?: string;
    status: ProjectStatus;
    startDate?: string | null;
    lastActivity?: string | null;
    createdAt: string;
    experiments?: Experiment[];
}

interface Experiment {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
}

// Utility: Fuzzy match entity names in text and return match positions
function findEntityMentions(text: string, entries: any[]): { start: number, end: number, entry: any }[] {
    const matches: { start: number, end: number, entry: any }[] = [];
    if (!text) return matches;
    for (const entry of entries) {
        const names = [entry.name, ...(entry.properties?.synonyms || [])];
        for (const name of names) {
            if (!name) continue;
            const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({ start: match.index, end: match.index + match[0].length, entry });
            }
        }
    }
    return matches;
}

function renderTextWithEntities(text: string, entries: any[], onEntityClick: (entry: any) => void) {
    const mentions = findEntityMentions(text, entries).sort((a, b) => a.start - b.start);
    if (mentions.length === 0) return text;
    const parts = [];
    let last = 0;
    mentions.forEach((m, i) => {
        if (m.start > last) parts.push(<span key={last}>{text.slice(last, m.start)}</span>);
        parts.push(
            <span
                key={m.start}
                style={{ textDecoration: 'underline', color: '#1976d2', cursor: 'pointer', fontWeight: 500 }}
                onClick={() => onEntityClick(m.entry)}
                title={`Go to ${m.entry.name}`}
            >
                {text.slice(m.start, m.end)}
            </span>
        );
        last = m.end;
    });
    if (last < text.length) parts.push(<span key={last}>{text.slice(last)}</span>);
    return parts;
}

const PROJECT_FIELDS = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'lastActivity', label: 'Last Activity' },
    { key: 'createdAt', label: 'Created At' },
];

const PROJECT_STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
    { value: 'future', label: 'Future' },
];

const Projects: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openProjectDialog, setOpenProjectDialog] = useState(false);
    const [openExperimentDialog, setOpenExperimentDialog] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editingExperiment, setEditingExperiment] = useState<Experiment | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const [projectForm, setProjectForm] = useState({
        id: '',
        name: '',
        description: '',
        status: 'active' as ProjectStatus,
        startDate: '',
        lastActivity: '',
    });

    const [experimentFormData, setExperimentFormData] = useState({
        name: '',
        description: '',
    });

    const [statusTab, setStatusTab] = useState<ProjectStatus>('active');

    const { palette } = useThemePalette();

    // Add state for sidebar/modal
    const [entitySidebarOpen, setEntitySidebarOpen] = useState(false);
    const [entityMentions, setEntityMentions] = useState<{ start: number, end: number, entry: any }[]>([]);

    // Add state for import/export dialog
    const [importExportOpen, setImportExportOpen] = useState(false);

    // Add state for linked entities
    const [linkedNotes, setLinkedNotes] = useState<any[]>([]);
    const [linkedDatabaseEntries, setLinkedDatabaseEntries] = useState<any[]>([]);
    const [allNotes, setAllNotes] = useState<any[]>([]);
    const [allDatabaseEntries, setAllDatabaseEntries] = useState<any[]>([]);
    const [creatingNote, setCreatingNote] = useState(false);
    const [creatingDatabaseEntry, setCreatingDatabaseEntry] = useState(false);
    const [linkedProtocols, setLinkedProtocols] = useState<any[]>([]);
    const [linkedRecipes, setLinkedRecipes] = useState<any[]>([]);
    const [linkedPDFs, setLinkedPDFs] = useState<any[]>([]);
    const [allProtocols, setAllProtocols] = useState<any[]>([]);
    const [allRecipes, setAllRecipes] = useState<any[]>([]);
    const [allPDFs, setAllPDFs] = useState<any[]>([]);
    const [creatingRecipe, setCreatingRecipe] = useState(false);
    const [creatingPDF, setCreatingPDF] = useState(false);

    // Load projects on component mount
    useEffect(() => {
        loadProjects();
    }, []);

    const [databaseEntries, setDatabaseEntries] = useState<any[]>([]);

    useEffect(() => {
        databaseApi.getAll().then(res => setDatabaseEntries(res.data.entries || res.data || []));
    }, []);

    // When project description changes, update entityMentions
    useEffect(() => {
        if (editingProject && editingProject.description) {
            setEntityMentions(findEntityMentions(editingProject.description, databaseEntries));
        } else {
            setEntityMentions([]);
        }
    }, [editingProject, databaseEntries]);

    // Fetch all notes and database entries for linking
    useEffect(() => {
        if (openProjectDialog && editingProject) {
            notesApi.getAll().then(res => setAllNotes(res.data || []));
            databaseApi.getAll().then(res => setAllDatabaseEntries(res.data || []));
            // Fetch existing links for this project
            linksApi.getOutgoing('project', editingProject.id).then(res => {
                setLinkedNotes((res.data || []).filter((l: any) => l.targetType === 'note').map((l: any) => l.note));
                setLinkedDatabaseEntries((res.data || []).filter((l: any) => l.targetType === 'databaseEntry').map((l: any) => l.databaseEntry));
            });
        }
    }, [openProjectDialog, editingProject]);

    // Fetch all protocols, recipes, and PDFs for linking
    useEffect(() => {
        if (openProjectDialog && editingProject) {
            protocolsApi.getAll().then(res => setAllProtocols(res.data || []));
            recipesApi.getAll().then(res => setAllRecipes(res.data || []));
            pdfsApi.getAll().then(res => setAllPDFs(res.data || []));
            // Fetch existing links for this project
            linksApi.getOutgoing('project', editingProject.id).then(res => {
                setLinkedProtocols((res.data || []).filter((l: any) => l.targetType === 'protocol').map((l: any) => l.protocol));
                setLinkedRecipes((res.data || []).filter((l: any) => l.targetType === 'recipe').map((l: any) => l.recipe));
                setLinkedPDFs((res.data || []).filter((l: any) => l.targetType === 'pdf').map((l: any) => l.pdf));
            });
        }
    }, [openProjectDialog, editingProject]);

    // Filter projects by status
    useEffect(() => {
        setFilteredProjects(projects.filter(p => p.status === statusTab));
    }, [projects, statusTab]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const response = await projectsApi.getAll();
            setProjects(response.data || []);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load projects');
            console.error('Error loading projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenProjectDialog = async (project?: Project) => {
        const today = new Date().toISOString();
        if (project) {
            try {
                await projectsApi.update(project.id, { lastActivity: today });
                await loadProjects();
            } catch (err) { }
            setEditingProject({ ...project, lastActivity: today });
            setProjectForm({
                id: project.id,
                name: project.name,
                description: project.description || '',
                status: project.status,
                startDate: project.startDate || '',
                lastActivity: today,
            });
        } else {
            setEditingProject(null);
            setProjectForm({
                id: '',
                name: '',
                description: '',
                status: 'active' as ProjectStatus,
                startDate: '',
                lastActivity: today,
            });
        }
        setOpenProjectDialog(true);
    };

    const handleCloseProjectDialog = () => {
        setOpenProjectDialog(false);
        setEditingProject(null);
    };

    const handleSaveProject = async () => {
        if (!projectForm.name.trim()) {
            setSnackbar({
                open: true,
                message: 'Please enter a project name',
                severity: 'error',
            });
            return;
        }

        try {
            setSaving(true);
            if (editingProject) {
                await projectsApi.update(editingProject.id, projectForm);
                setSnackbar({
                    open: true,
                    message: 'Project updated successfully',
                    severity: 'success',
                });
            } else {
                await projectsApi.create({ ...projectForm, lastActivity: projectForm.lastActivity });
                setSnackbar({
                    open: true,
                    message: 'Project created successfully',
                    severity: 'success',
                });
            }
            handleCloseProjectDialog();
            loadProjects();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to save project',
                severity: 'error',
            });
            console.error('Error saving project:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this project? This will also delete all associated experiments.')) {
            return;
        }

        try {
            await projectsApi.delete(id);
            setSnackbar({
                open: true,
                message: 'Project deleted successfully',
                severity: 'success',
            });
            loadProjects();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to delete project',
                severity: 'error',
            });
            console.error('Error deleting project:', err);
        }
    };

    const handleOpenExperimentDialog = (projectId: string, experiment?: Experiment) => {
        setSelectedProjectId(projectId);
        if (experiment) {
            setEditingExperiment(experiment);
            setExperimentFormData({
                name: experiment.name,
                description: experiment.description || '',
            });
        } else {
            setEditingExperiment(null);
            setExperimentFormData({
                name: '',
                description: '',
            });
        }
        setOpenExperimentDialog(true);
    };

    const handleCloseExperimentDialog = () => {
        setOpenExperimentDialog(false);
        setEditingExperiment(null);
        setSelectedProjectId(null);
    };

    const handleSaveExperiment = async () => {
        if (!experimentFormData.name.trim() || !selectedProjectId) {
            setSnackbar({
                open: true,
                message: 'Please enter an experiment name',
                severity: 'error',
            });
            return;
        }

        try {
            setSaving(true);
            if (editingExperiment) {
                await projectsApi.updateExperiment(editingExperiment.id, experimentFormData);
                setSnackbar({
                    open: true,
                    message: 'Experiment updated successfully',
                    severity: 'success',
                });
            } else {
                await projectsApi.createExperiment(selectedProjectId, experimentFormData);
                setSnackbar({
                    open: true,
                    message: 'Experiment created successfully',
                    severity: 'success',
                });
            }
            handleCloseExperimentDialog();
            loadProjects();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to save experiment',
                severity: 'error',
            });
            console.error('Error saving experiment:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteExperiment = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this experiment?')) {
            return;
        }

        try {
            await projectsApi.deleteExperiment(id);
            setSnackbar({
                open: true,
                message: 'Experiment deleted successfully',
                severity: 'success',
            });
            loadProjects();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to delete experiment',
                severity: 'error',
            });
            console.error('Error deleting experiment:', err);
        }
    };

    const handleImport = async (rows: any[]) => {
        for (const row of rows) {
            await projectsApi.create(row);
        }
        await loadProjects();
        setSnackbar({ open: true, message: 'Import successful!', severity: 'success' });
    };
    const handleExport = (format: 'csv' | 'json' | 'xlsx') => {
        const exportData = projects.map(p => ({
            name: p.name,
            description: p.description,
            status: p.status,
            startDate: p.startDate,
            lastActivity: p.lastActivity,
            createdAt: p.createdAt,
        }));
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            saveAs(blob, 'projects.json');
        } else if (format === 'csv') {
            const csv = Papa.unparse(exportData);
            const blob = new Blob([csv], { type: 'text/csv' });
            saveAs(blob, 'projects.csv');
        } else if (format === 'xlsx') {
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Projects');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            saveAs(blob, 'projects.xlsx');
        }
        setSnackbar({ open: true, message: `Exported as ${format.toUpperCase()}`, severity: 'success' });
    };

    const handleLinkNote = async (noteId: string) => {
        if (!editingProject) return;
        await linksApi.create({ sourceType: 'project', sourceId: editingProject.id, targetType: 'note', targetId: noteId });
        const note = allNotes.find((n: any) => n.id === noteId);
        setLinkedNotes(prev => [...prev, note]);
    };
    const handleUnlinkNote = async (noteId: string) => {
        if (!editingProject) return;
        const links = await linksApi.getOutgoing('project', editingProject.id);
        const link = (links.data || []).find((l: any) => l.targetType === 'note' && l.targetId === noteId);
        if (link) {
            await linksApi.delete(link.id);
            setLinkedNotes(prev => prev.filter((n: any) => n.id !== noteId));
        }
    };
    const handleCreateNote = async (title: string) => {
        setCreatingNote(true);
        try {
            const res = await notesApi.create({ title, content: '', type: 'project' });
            setAllNotes(prev => [...prev, res.data]);
            if (editingProject) await handleLinkNote(res.data.id);
        } finally {
            setCreatingNote(false);
        }
    };
    const handleLinkDatabaseEntry = async (entryId: string) => {
        if (!editingProject) return;
        await linksApi.create({ sourceType: 'project', sourceId: editingProject.id, targetType: 'databaseEntry', targetId: entryId });
        const entry = allDatabaseEntries.find((e: any) => e.id === entryId);
        setLinkedDatabaseEntries(prev => [...prev, entry]);
    };
    const handleUnlinkDatabaseEntry = async (entryId: string) => {
        if (!editingProject) return;
        const links = await linksApi.getOutgoing('project', editingProject.id);
        const link = (links.data || []).find((l: any) => l.targetType === 'databaseEntry' && l.targetId === entryId);
        if (link) {
            await linksApi.delete(link.id);
            setLinkedDatabaseEntries(prev => prev.filter((e: any) => e.id !== entryId));
        }
    };
    const handleCreateDatabaseEntry = async (name: string) => {
        setCreatingDatabaseEntry(true);
        try {
            const res = await databaseApi.create({ type: 'GENERIC', name });
            setAllDatabaseEntries(prev => [...prev, res.data]);
            if (editingProject) await handleLinkDatabaseEntry(res.data.id);
        } finally {
            setCreatingDatabaseEntry(false);
        }
    };

    const handleLinkProtocol = async (protocolId: string) => {
        if (!editingProject) return;
        await linksApi.create({ sourceType: 'project', sourceId: editingProject.id, targetType: 'protocol', targetId: protocolId });
        const protocol = allProtocols.find((p: any) => p.id === protocolId);
        setLinkedProtocols(prev => [...prev, protocol]);
    };
    const handleUnlinkProtocol = async (protocolId: string) => {
        if (!editingProject) return;
        const links = await linksApi.getOutgoing('project', editingProject.id);
        const link = (links.data || []).find((l: any) => l.targetType === 'protocol' && l.targetId === protocolId);
        if (link) {
            await linksApi.delete(link.id);
            setLinkedProtocols(prev => prev.filter((p: any) => p.id !== protocolId));
        }
    };
    const handleLinkRecipe = async (recipeId: string) => {
        if (!editingProject) return;
        await linksApi.create({ sourceType: 'project', sourceId: editingProject.id, targetType: 'recipe', targetId: recipeId });
        const recipe = allRecipes.find((r: any) => r.id === recipeId);
        setLinkedRecipes(prev => [...prev, recipe]);
    };
    const handleUnlinkRecipe = async (recipeId: string) => {
        if (!editingProject) return;
        const links = await linksApi.getOutgoing('project', editingProject.id);
        const link = (links.data || []).find((l: any) => l.targetType === 'recipe' && l.targetId === recipeId);
        if (link) {
            await linksApi.delete(link.id);
            setLinkedRecipes(prev => prev.filter((r: any) => r.id !== recipeId));
        }
    };
    const handleCreateRecipe = async (name: string) => {
        setCreatingRecipe(true);
        try {
            const res = await recipesApi.create({ name });
            setAllRecipes(prev => [...prev, res.data]);
            if (editingProject) await handleLinkRecipe(res.data.id);
        } finally {
            setCreatingRecipe(false);
        }
    };
    const handleLinkPDF = async (pdfId: string) => {
        if (!editingProject) return;
        await linksApi.create({ sourceType: 'project', sourceId: editingProject.id, targetType: 'pdf', targetId: pdfId });
        const pdf = allPDFs.find((p: any) => p.id === pdfId);
        setLinkedPDFs(prev => [...prev, pdf]);
    };
    const handleUnlinkPDF = async (pdfId: string) => {
        if (!editingProject) return;
        const links = await linksApi.getOutgoing('project', editingProject.id);
        const link = (links.data || []).find((l: any) => l.targetType === 'pdf' && l.targetId === pdfId);
        if (link) {
            await linksApi.delete(link.id);
            setLinkedPDFs(prev => prev.filter((p: any) => p.id !== pdfId));
        }
    };
    const handleCreatePDF = async (title: string) => {
        setCreatingPDF(true);
        try {
            const res = await pdfsApi.create({ title });
            setAllPDFs(prev => [...prev, res.data]);
            if (editingProject) await handleLinkPDF(res.data.id);
        } finally {
            setCreatingPDF(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    function handleOpenEntity(entity: any) {
        alert(`Open entity: ${entity.name} (type: ${entity.type})`);
    }

    return (
        <Box>
            <ColorLegend types={['project', 'experiment']} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Projects</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenProjectDialog()}
                >
                    New Project
                </Button>
                <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setImportExportOpen(true)}>Import/Export</Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {projects.length === 0 && !loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No projects yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create your first project to get started
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {filteredProjects.map((project) => (
                        <Grid item xs={12} key={project.id}>
                            <Card sx={{ borderLeft: `8px solid ${palette[NOTE_TYPE_TO_PALETTE_ROLE['project']]}` }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" component="div">
                                                {project.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                {project.description || 'No description'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Start: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}<br />
                                                Last Activity: {project.lastActivity ? new Date(project.lastActivity).toLocaleDateString() : 'N/A'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                Created: {new Date(project.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenExperimentDialog(project.id)}
                                                sx={{ mr: 1 }}
                                            >
                                                <AddIcon />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleOpenProjectDialog(project)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDeleteProject(project.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    <Typography variant="subtitle2" gutterBottom>
                                        Experiments ({project.experiments?.length || 0})
                                    </Typography>

                                    {project.experiments && project.experiments.length > 0 ? (
                                        <List dense>
                                            {project.experiments.map((experiment) => (
                                                <ListItem key={experiment.id} sx={{ pl: 0 }}>
                                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                                        <Box sx={{
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: '50%',
                                                            background: palette[NOTE_TYPE_TO_PALETTE_ROLE['experiment']],
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#fff',
                                                            fontWeight: 700,
                                                            fontSize: 14,
                                                        }}>
                                                            <ExperimentIcon fontSize="small" />
                                                        </Box>
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={experiment.name}
                                                        secondary={experiment.description || 'No description'}
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleOpenExperimentDialog(project.id, experiment)}
                                                            sx={{ mr: 1 }}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteExperiment(experiment.id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                            No experiments yet. Click the + button to add one.
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Project Dialog */}
            <Dialog open={openProjectDialog} onClose={handleCloseProjectDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingProject ? 'Edit Project' : 'Create New Project'}
                </DialogTitle>
                <DialogContent>
                    <Box>
                        <Box sx={{ pt: 1 }}>
                            <TextField
                                fullWidth
                                label="Project Name"
                                value={projectForm.name}
                                onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                                sx={{ mb: 2 }}
                                disabled={saving}
                            />
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={projectForm.description}
                                onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                                disabled={saving}
                            />
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={projectForm.status}
                                    label="Status"
                                    onChange={e => setProjectForm({ ...projectForm, status: e.target.value as ProjectStatus })}
                                >
                                    {PROJECT_STATUS_OPTIONS.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth
                                label="Start Date"
                                type="date"
                                value={projectForm.startDate ? projectForm.startDate.slice(0, 10) : ''}
                                onChange={e => setProjectForm({ ...projectForm, startDate: e.target.value })}
                                sx={{ mb: 2 }}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                fullWidth
                                label="Last Activity"
                                type="date"
                                value={projectForm.lastActivity ? projectForm.lastActivity.slice(0, 10) : ''}
                                onChange={e => setProjectForm({ ...projectForm, lastActivity: e.target.value })}
                                sx={{ mb: 2 }}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                        {editingProject && (
                            <>
                                <Box sx={{ mt: 3, mb: 2 }}>
                                    <Typography variant="h6" sx={{ mb: 1 }}>Linked Entities</Typography>
                                    <Autocomplete
                                        multiple
                                        options={allNotes}
                                        getOptionLabel={option => option.title}
                                        value={linkedNotes}
                                        onChange={(_, value, reason, details) => {
                                            if (details && details.option && details.option.id === '__new__') {
                                                handleCreateNote(details.option.title.replace(/^Add \"|\" as new Note$/g, ''));
                                            } else {
                                                value.forEach((n: any) => {
                                                    if (!linkedNotes.some((ln: any) => ln.id === n.id)) handleLinkNote(n.id);
                                                });
                                                linkedNotes.forEach((ln: any) => {
                                                    if (!value.some((n: any) => n.id === ln.id)) handleUnlinkNote(ln.id);
                                                });
                                            }
                                        }}
                                        renderInput={params => <TextField {...params} label="Linked Notes" margin="dense" fullWidth />}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => (
                                                <Chip label={option.title} {...getTagProps({ index })} key={option.id} onDelete={() => handleUnlinkNote(option.id)} />
                                            ))
                                        }
                                        loading={creatingNote}
                                        filterOptions={(options, state) => {
                                            const filtered = options.filter(opt => opt.title.toLowerCase().includes(state.inputValue.toLowerCase()));
                                            if (state.inputValue && !options.some(opt => opt.title.toLowerCase() === state.inputValue.toLowerCase())) {
                                                filtered.push({ id: '__new__', title: `Add "${state.inputValue}" as new Note` });
                                            }
                                            return filtered;
                                        }}
                                        sx={{ my: 1 }}
                                    />
                                    <Autocomplete
                                        multiple
                                        options={allDatabaseEntries}
                                        getOptionLabel={option => option.name}
                                        value={linkedDatabaseEntries}
                                        onChange={(_, value, reason, details) => {
                                            if (details && details.option && details.option.id === '__new__') {
                                                handleCreateDatabaseEntry(details.option.name.replace(/^Add \"|\" as new Entry$/g, ''));
                                            } else {
                                                value.forEach((e: any) => {
                                                    if (!linkedDatabaseEntries.some((le: any) => le.id === e.id)) handleLinkDatabaseEntry(e.id);
                                                });
                                                linkedDatabaseEntries.forEach((le: any) => {
                                                    if (!value.some((e: any) => e.id === le.id)) handleUnlinkDatabaseEntry(le.id);
                                                });
                                            }
                                        }}
                                        renderInput={params => <TextField {...params} label="Linked Database Entries" margin="dense" fullWidth />}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => (
                                                <Chip label={option.name} {...getTagProps({ index })} key={option.id} onDelete={() => handleUnlinkDatabaseEntry(option.id)} />
                                            ))
                                        }
                                        loading={creatingDatabaseEntry}
                                        filterOptions={(options, state) => {
                                            const filtered = options.filter(opt => opt.name.toLowerCase().includes(state.inputValue.toLowerCase()));
                                            if (state.inputValue && !options.some((opt: any) => opt.name.toLowerCase() === state.inputValue.toLowerCase())) {
                                                filtered.push({ id: '__new__', name: `Add "${state.inputValue}" as new Entry` });
                                            }
                                            return filtered;
                                        }}
                                        sx={{ my: 1 }}
                                    />
                                </Box>
                                <Box sx={{ mt: 3, mb: 2 }}>
                                    <Typography variant="h6" sx={{ mb: 1 }}>Linked Protocols</Typography>
                                    <Autocomplete
                                        multiple
                                        options={allProtocols}
                                        getOptionLabel={option => option.name}
                                        value={linkedProtocols}
                                        onChange={(_, value, reason, details) => {
                                            if (details && details.option && details.option.id === '__new__') {
                                                // Optionally support inline creation for protocols
                                            } else {
                                                value.forEach((p: any) => {
                                                    if (!linkedProtocols.some((lp: any) => lp.id === p.id)) handleLinkProtocol(p.id);
                                                });
                                                linkedProtocols.forEach((lp: any) => {
                                                    if (!value.some((p: any) => p.id === lp.id)) handleUnlinkProtocol(lp.id);
                                                });
                                            }
                                        }}
                                        renderInput={params => <TextField {...params} label="Linked Protocols" margin="dense" fullWidth />}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => (
                                                <Chip label={option.name} {...getTagProps({ index })} key={option.id} onDelete={() => handleUnlinkProtocol(option.id)} />
                                            ))
                                        }
                                        loading={false}
                                        filterOptions={(options, state) => {
                                            const filtered = options.filter(opt => opt.name.toLowerCase().includes(state.inputValue.toLowerCase()));
                                            return filtered;
                                        }}
                                        sx={{ my: 1 }}
                                    />
                                    <Typography variant="h6" sx={{ mb: 1 }}>Linked Recipes</Typography>
                                    <Autocomplete
                                        multiple
                                        options={allRecipes}
                                        getOptionLabel={option => option.name}
                                        value={linkedRecipes}
                                        onChange={(_, value, reason, details) => {
                                            if (details && details.option && details.option.id === '__new__') {
                                                handleCreateRecipe(details.option.name.replace(/^Add \"|\" as new Recipe$/g, ''));
                                            } else {
                                                value.forEach((r: any) => {
                                                    if (!linkedRecipes.some((lr: any) => lr.id === r.id)) handleLinkRecipe(r.id);
                                                });
                                                linkedRecipes.forEach((lr: any) => {
                                                    if (!value.some((r: any) => r.id === lr.id)) handleUnlinkRecipe(lr.id);
                                                });
                                            }
                                        }}
                                        renderInput={params => <TextField {...params} label="Linked Recipes" margin="dense" fullWidth />}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => (
                                                <Chip label={option.name} {...getTagProps({ index })} key={option.id} onDelete={() => handleUnlinkRecipe(option.id)} />
                                            ))
                                        }
                                        loading={creatingRecipe}
                                        filterOptions={(options, state) => {
                                            const filtered = options.filter(opt => opt.name.toLowerCase().includes(state.inputValue.toLowerCase()));
                                            if (state.inputValue && !options.some(opt => opt.name.toLowerCase() === state.inputValue.toLowerCase())) {
                                                filtered.push({ id: '__new__', name: `Add "${state.inputValue}" as new Recipe` });
                                            }
                                            return filtered;
                                        }}
                                        sx={{ my: 1 }}
                                    />
                                    <Typography variant="h6" sx={{ mb: 1 }}>Linked PDFs</Typography>
                                    <Autocomplete
                                        multiple
                                        options={allPDFs}
                                        getOptionLabel={option => option.title}
                                        value={linkedPDFs}
                                        onChange={(_, value, reason, details) => {
                                            if (details && details.option && details.option.id === '__new__') {
                                                handleCreatePDF(details.option.title.replace(/^Add \"|\" as new PDF$/g, ''));
                                            } else {
                                                value.forEach((p: any) => {
                                                    if (!linkedPDFs.some((lp: any) => lp.id === p.id)) handleLinkPDF(p.id);
                                                });
                                                linkedPDFs.forEach((lp: any) => {
                                                    if (!value.some((p: any) => p.id === lp.id)) handleUnlinkPDF(lp.id);
                                                });
                                            }
                                        }}
                                        renderInput={params => <TextField {...params} label="Linked PDFs" margin="dense" fullWidth />}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => (
                                                <Chip label={option.title} {...getTagProps({ index })} key={option.id} onDelete={() => handleUnlinkPDF(option.id)} />
                                            ))
                                        }
                                        loading={creatingPDF}
                                        filterOptions={(options, state) => {
                                            const filtered = options.filter(opt => opt.title.toLowerCase().includes(state.inputValue.toLowerCase()));
                                            if (state.inputValue && !options.some(opt => opt.title.toLowerCase() === state.inputValue.toLowerCase())) {
                                                filtered.push({ id: '__new__', title: `Add "${state.inputValue}" as new PDF` });
                                            }
                                            return filtered;
                                        }}
                                        sx={{ my: 1 }}
                                    />
                                </Box>
                            </>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseProjectDialog} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveProject}
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} /> : undefined}
                    >
                        {saving ? 'Saving...' : (editingProject ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Experiment Dialog */}
            <Dialog open={openExperimentDialog} onClose={handleCloseExperimentDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingExperiment ? 'Edit Experiment' : 'Create New Experiment'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Experiment Name"
                            value={experimentFormData.name}
                            onChange={(e) => setExperimentFormData({ ...experimentFormData, name: e.target.value })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />

                        <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={3}
                            value={experimentFormData.description}
                            onChange={(e) => setExperimentFormData({ ...experimentFormData, description: e.target.value })}
                            disabled={saving}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseExperimentDialog} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveExperiment}
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} /> : undefined}
                    >
                        {saving ? 'Saving...' : (editingExperiment ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Add the sidebar/modal: */}
            <Drawer anchor="right" open={entitySidebarOpen} onClose={() => setEntitySidebarOpen(false)}>
                <Box sx={{ width: 320, p: 2 }}>
                    <Typography variant="h6">Entity Suggestions</Typography>
                    <MUIList>
                        {entityMentions.map((m, i) => (
                            <MUIListItem button key={i} onClick={() => { setEntitySidebarOpen(false); handleOpenEntity(m.entry); }}>
                                <MUIListItemText primary={m.entry.name} secondary={m.entry.type} />
                            </MUIListItem>
                        ))}
                        {entityMentions.length === 0 && <Typography>No suggestions found.</Typography>}
                    </MUIList>
                </Box>
            </Drawer>

            {/* Add status tabs or filter buttons */}
            <Box sx={{ mb: 2 }}>
                {PROJECT_STATUS_OPTIONS.map(opt => (
                    <Button
                        key={opt.value}
                        variant={statusTab === opt.value ? 'contained' : 'outlined'}
                        onClick={() => setStatusTab(opt.value as ProjectStatus)}
                        sx={{ mr: 1 }}
                    >
                        {opt.label}
                    </Button>
                ))}
            </Box>

            {/* Import/Export Dialog */}
            <ImportExportDialog
                open={importExportOpen}
                onClose={() => setImportExportOpen(false)}
                entityType="Project"
                fields={PROJECT_FIELDS}
                onImport={handleImport}
                onExport={handleExport}
                data={projects}
            />
        </Box >
    );
};

export default Projects; 