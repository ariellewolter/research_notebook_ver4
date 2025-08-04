import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
    Stack,
} from '@mui/material';
import {
    Science as ScienceIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    Biotech as ExperimentIcon,
    CloudUpload as ImportIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import { projectsApi } from '../services/api';
import ColorLegend from '../components/Legend/ColorLegend';
import { useThemePalette } from '../services/ThemePaletteContext';
import { NOTE_TYPE_TO_PALETTE_ROLE } from '../services/colorPalettes';
import ImportExportDialog from '../components/ImportExportDialog';
import ExportModal, { ExportData } from '../components/ExportModal';
import { exportService, ExportOptions } from '../services/exportService';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { databaseApi } from '../services/api';
import { linksApi, notesApi, protocolsApi, recipesApi, pdfsApi } from '../services/api';
import Autocomplete from '@mui/material/Autocomplete';
import UniversalLinking from '../components/UniversalLinking/UniversalLinking';
import LinkRenderer from '../components/UniversalLinking/LinkRenderer';
import { ZoteroItem } from '../types/zotero';

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
    const location = useLocation();
    const navigate = useNavigate();

    console.log('Projects component rendered, location:', location.pathname);
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openProjectDialog, setOpenProjectDialog] = useState(false);
    const [openExperimentDialog, setOpenExperimentDialog] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editingExperiment, setEditingExperiment] = useState<Experiment | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState<any>(null);
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
    const [openImportDialog, setOpenImportDialog] = useState(false);
    const [openExportModal, setOpenExportModal] = useState(false);
    const [selectedImportItems, setSelectedImportItems] = useState<ZoteroItem[]>([]);

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

    // Auto-open new project dialog when on /projects/new route
    useEffect(() => {
        if (location.pathname === '/projects/new') {
            console.log('Auto-opening new project dialog for path:', location.pathname);
            handleOpenProjectDialog();
        }
    }, [location.pathname]);

    // Reset editData when selectedProjectId changes
    useEffect(() => {
        if (!selectedProjectId) {
            setEditData(null);
            setEditMode(false);
        }
    }, [selectedProjectId]);

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
            notesApi.getAll().then(res => setAllNotes(Array.isArray(res.data) ? res.data : []))
                .catch(err => {
                    console.error('Error loading notes:', err);
                    setAllNotes([]);
                });
            databaseApi.getAll().then(res => setAllDatabaseEntries(Array.isArray(res.data) ? res.data : []))
                .catch(err => {
                    console.error('Error loading database entries:', err);
                    setAllDatabaseEntries([]);
                });
            // Fetch existing links for this project
            linksApi.getOutgoing('project', editingProject.id).then(res => {
                const links = Array.isArray(res.data) ? res.data : [];
                setLinkedNotes(links.filter((l: any) => l.targetType === 'note').map((l: any) => l.note));
                setLinkedDatabaseEntries(links.filter((l: any) => l.targetType === 'databaseEntry').map((l: any) => l.databaseEntry));
            }).catch(err => {
                console.error('Error loading links:', err);
                setLinkedNotes([]);
                setLinkedDatabaseEntries([]);
            });
        }
    }, [openProjectDialog, editingProject]);

    // Fetch all protocols, recipes, and PDFs for linking
    useEffect(() => {
        if (openProjectDialog && editingProject) {
            protocolsApi.getAll().then(res => setAllProtocols(Array.isArray(res.data) ? res.data : []))
                .catch(err => {
                    console.error('Error loading protocols:', err);
                    setAllProtocols([]);
                });
            recipesApi.getAll().then(res => setAllRecipes(Array.isArray(res.data) ? res.data : []))
                .catch(err => {
                    console.error('Error loading recipes:', err);
                    setAllRecipes([]);
                });
            pdfsApi.getAll().then(res => setAllPDFs(Array.isArray(res.data) ? res.data : []))
                .catch(err => {
                    console.error('Error loading PDFs:', err);
                    setAllPDFs([]);
                });
            // Fetch existing links for this project
            linksApi.getOutgoing('project', editingProject.id).then(res => {
                const links = Array.isArray(res.data) ? res.data : [];
                setLinkedProtocols(links.filter((l: any) => l.targetType === 'protocol').map((l: any) => l.protocol));
                setLinkedRecipes(links.filter((l: any) => l.targetType === 'recipe').map((l: any) => l.recipe));
                setLinkedPDFs(links.filter((l: any) => l.targetType === 'pdf').map((l: any) => l.pdf));
            }).catch(err => {
                console.error('Error loading links:', err);
                setLinkedProtocols([]);
                setLinkedRecipes([]);
                setLinkedPDFs([]);
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
        console.log('Project dialog opened, editingProject:', editingProject);
    };

    const handleCloseProjectDialog = () => {
        console.log('Closing project dialog');
        setOpenProjectDialog(false);
        setEditingProject(null);
        // If we're on the /projects/new route, navigate back to /projects
        if (location.pathname === '/projects/new') {
            navigate('/projects');
        }
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
                // Clean up the data before sending to API
                const projectData = {
                    name: projectForm.name,
                    description: projectForm.description || undefined,
                    status: projectForm.status,
                    startDate: projectForm.startDate || null,
                    lastActivity: projectForm.lastActivity || null,
                };

                await projectsApi.create(projectData);
                setSnackbar({
                    open: true,
                    message: 'Project created successfully',
                    severity: 'success',
                });
            }
            handleCloseProjectDialog();
            loadProjects();
            // Navigate back to projects list after successful creation
            if (!editingProject) {
                navigate('/projects');
            }
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
        const data = projects.map(project => ({
            name: project.name,
            description: project.description,
            status: project.status,
            startDate: project.startDate,
            lastActivity: project.lastActivity,
            createdAt: project.createdAt
        }));

        if (format === 'csv') {
            const csv = Papa.unparse(data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, `projects_export_${new Date().toISOString().split('T')[0]}.csv`);
        } else if (format === 'json') {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
            saveAs(blob, `projects_export_${new Date().toISOString().split('T')[0]}.json`);
        } else if (format === 'xlsx') {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `projects_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        }
    };

    const handleExportWithModal = async (format: string, options: string[], filename?: string) => {
        try {
            // Prepare export data
            const exportData: ExportData = {
                projects: projects,
                experiments: projects.flatMap(project => project.experiments || [])
            };

            // Prepare export options
            const exportOptions: ExportOptions = {
                includeMetadata: options.includes('includeMetadata'),
                includeRelationships: options.includes('includeRelationships'),
                includeNotes: options.includes('includeNotes'),
                includeFiles: options.includes('includeFiles')
            };

            // Perform export
            await exportService.exportData(format, exportData, exportOptions, filename || 'projects_export');
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
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

    // 1. Implement handleLinkAllEntities to iterate over entityMentions and call linksApi.create for each, linking to the current project.
    // 2. Enable the 'Link All' button in the Drawer, and call handleLinkAllEntities on click.
    // 3. Show a snackbar notification when linking is complete.
    const handleLinkAllEntities = async () => {
        if (!editingProject) return;
        const newLinkedNotes: any[] = [];
        const newLinkedDatabaseEntries: any[] = [];
        const newLinkedProtocols: any[] = [];
        const newLinkedRecipes: any[] = [];
        const newLinkedPDFs: any[] = [];

        for (const mention of entityMentions) {
            const entry = mention.entry;
            if (entry.type === 'note') {
                await handleLinkNote(entry.id);
                newLinkedNotes.push(entry);
            } else if (entry.type === 'databaseEntry') {
                await handleLinkDatabaseEntry(entry.id);
                newLinkedDatabaseEntries.push(entry);
            } else if (entry.type === 'protocol') {
                await handleLinkProtocol(entry.id);
                newLinkedProtocols.push(entry);
            } else if (entry.type === 'recipe') {
                await handleLinkRecipe(entry.id);
                newLinkedRecipes.push(entry);
            } else if (entry.type === 'pdf') {
                await handleLinkPDF(entry.id);
                newLinkedPDFs.push(entry);
            }
        }

        setSnackbar({
            open: true,
            message: `Linked ${newLinkedNotes.length} notes, ${newLinkedDatabaseEntries.length} database entries, ${newLinkedProtocols.length} protocols, ${newLinkedRecipes.length} recipes, ${newLinkedPDFs.length} PDFs.`,
            severity: 'success',
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    console.log('Projects component rendering, loading:', loading, 'projects count:', projects.length);

    // Simple fallback to ensure component always renders
    if (!loading && projects.length === 0 && location.pathname === '/projects/new') {
        console.log('Rendering new project view');
        return (
            <Box sx={{ p: 3, minHeight: '100vh' }}>
                <Typography variant="h4" sx={{ mb: 2 }}>Create New Project</Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                    Loading project creation form...
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenProjectDialog()}
                >
                    Open Project Dialog
                </Button>
            </Box>
        );
    }

    function handleOpenEntity(entity: any) {
        // Navigate to entity details based on type
        if (entity.type === 'note') {
            navigate(`/notes/${entity.id}`);
        } else if (entity.type === 'project') {
            navigate(`/projects/${entity.id}`);
        } else if (entity.type === 'protocol') {
            navigate(`/protocols/${entity.id}`);
        } else if (entity.type === 'recipe') {
            navigate(`/recipes/${entity.id}`);
        } else if (entity.type === 'experiment') {
            navigate(`/experiments/${entity.id}`);
        } else if (entity.type === 'task') {
            navigate(`/tasks/${entity.id}`);
        } else if (entity.type === 'databaseEntry') {
            navigate(`/database/${entity.id}`);
        } else if (entity.type === 'table') {
            navigate(`/tables/${entity.id}`);
        } else if (entity.type === 'pdf') {
            navigate(`/pdfs/${entity.id}`);
        } else if (entity.type === 'literatureNote') {
            navigate(`/literature/${entity.id}`);
        } else {
            console.warn('Unknown entity type for navigation:', entity.type);
        }
    }

    let detailPane = null;
    if (selectedProjectId) {
        const project = projects.find(p => p.id === selectedProjectId);
        if (project) {
            // Initialize editData if not already set
            if (!editData) {
                setEditData({ ...project });
            }

            const handleEditChange = (field: string, value: any) => setEditData((prev: any) => ({ ...prev, [field]: value }));
            const handleSaveEdit = async () => {
                if (!editData) return;
                const updateData = {
                    name: editData.name,
                    description: editData.description,
                    status: editData.status,
                    startDate: editData.startDate || undefined,
                    lastActivity: editData.lastActivity || undefined,
                };
                await projectsApi.update(project.id, updateData);
                setEditMode(false);
                setEditData(null);
                loadProjects();
                setSnackbar({ open: true, message: 'Project updated successfully', severity: 'success' });
            };
            if (!editMode) {
                detailPane = (
                    <Box sx={{ mb: 4, p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5">{project.name}</Typography>
                            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => {
                                setEditMode(true);
                                setEditData({ ...project });
                            }}>Edit</Button>
                        </Box>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            <LinkRenderer content={project.description || ''} />
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>Status: {project.status}</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>Start Date: {project.startDate}</Typography>
                        {/* Add more fields as needed for display */}
                    </Box>
                );
            } else {
                detailPane = (
                    <Box sx={{ mb: 4, p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
                        <TextField
                            fullWidth
                            label="Project Name"
                            value={editData.name}
                            onChange={e => handleEditChange('name', e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            value={editData.description}
                            onChange={e => handleEditChange('description', e.target.value)}
                            multiline
                            rows={2}
                            sx={{ mb: 2 }}
                        />
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={editData.status}
                                onChange={e => handleEditChange('status', e.target.value)}
                                label="Status"
                            >
                                <MenuItem value="planning">Planning</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="on_hold">On Hold</MenuItem>
                                <MenuItem value="cancelled">Cancelled</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Start Date"
                            type="date"
                            value={editData.startDate || ''}
                            onChange={e => handleEditChange('startDate', e.target.value)}
                            sx={{ mb: 2 }}
                            InputLabelProps={{ shrink: true }}
                        />
                        {/* Add more editable fields as needed */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button variant="contained" onClick={handleSaveEdit}>Save</Button>
                            <Button variant="outlined" onClick={() => {
                                setEditMode(false);
                                setEditData(null);
                            }}>Cancel</Button>
                        </Box>
                    </Box>
                );
            }
        }
    }

    return (
        <Box sx={{ p: 3, minHeight: '100vh' }}>
            <ColorLegend types={['project', 'experiment']} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Projects</Typography>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<ImportIcon />}
                        onClick={() => setOpenImportDialog(true)}
                    >
                        Import
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => setOpenExportModal(true)}
                    >
                        Export
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenProjectDialog()}
                    >
                        New Project
                    </Button>
                </Stack>
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
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenProjectDialog()}
                        sx={{ mt: 2 }}
                    >
                        Create First Project
                    </Button>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {detailPane}
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
                                                <LinkRenderer content={project.description || 'No description'} />
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <UniversalLinking
                                    value={projectForm.description || ''}
                                    onChange={(value) => setProjectForm({ ...projectForm, description: value })}
                                    multiline={true}
                                    rows={3}
                                    placeholder="Type your project description here. Use [[ to link to other items or / for commands..."
                                />
                            </div>
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
                                        options={Array.isArray(allNotes) ? allNotes : []}
                                        getOptionLabel={option => option.title}
                                        value={Array.isArray(linkedNotes) ? linkedNotes : []}
                                        onChange={(_, value, reason, details) => {
                                            if (details && details.option && details.option.id === '__new__') {
                                                handleCreateNote(details.option.title.replace(/^Add \"|\" as new Note$/g, ''));
                                            } else {
                                                const currentLinkedNotes = Array.isArray(linkedNotes) ? linkedNotes : [];
                                                value.forEach((n: any) => {
                                                    if (!currentLinkedNotes.some((ln: any) => ln.id === n.id)) handleLinkNote(n.id);
                                                });
                                                currentLinkedNotes.forEach((ln: any) => {
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
                                            if (!Array.isArray(options)) return [];
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
                                        options={Array.isArray(allDatabaseEntries) ? allDatabaseEntries : []}
                                        getOptionLabel={option => option.name}
                                        value={Array.isArray(linkedDatabaseEntries) ? linkedDatabaseEntries : []}
                                        onChange={(_, value, reason, details) => {
                                            if (details && details.option && details.option.id === '__new__') {
                                                handleCreateDatabaseEntry(details.option.name.replace(/^Add \"|\" as new Entry$/g, ''));
                                            } else {
                                                const currentLinkedEntries = Array.isArray(linkedDatabaseEntries) ? linkedDatabaseEntries : [];
                                                value.forEach((e: any) => {
                                                    if (!currentLinkedEntries.some((le: any) => le.id === e.id)) handleLinkDatabaseEntry(e.id);
                                                });
                                                currentLinkedEntries.forEach((le: any) => {
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
                                            if (!Array.isArray(options)) return [];
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
                                        options={Array.isArray(allProtocols) ? allProtocols : []}
                                        getOptionLabel={option => option.name}
                                        value={Array.isArray(linkedProtocols) ? linkedProtocols : []}
                                        onChange={(_, value, reason, details) => {
                                            if (details && details.option && details.option.id === '__new__') {
                                                // Optionally support inline creation for protocols
                                            } else {
                                                const currentLinkedProtocols = Array.isArray(linkedProtocols) ? linkedProtocols : [];
                                                value.forEach((p: any) => {
                                                    if (!currentLinkedProtocols.some((lp: any) => lp.id === p.id)) handleLinkProtocol(p.id);
                                                });
                                                currentLinkedProtocols.forEach((lp: any) => {
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
                                            if (!Array.isArray(options)) return [];
                                            const filtered = options.filter(opt => opt.name.toLowerCase().includes(state.inputValue.toLowerCase()));
                                            return filtered;
                                        }}
                                        sx={{ my: 1 }}
                                    />
                                    <Typography variant="h6" sx={{ mb: 1 }}>Linked Recipes</Typography>
                                    <Autocomplete
                                        multiple
                                        options={Array.isArray(allRecipes) ? allRecipes : []}
                                        getOptionLabel={option => option.name}
                                        value={Array.isArray(linkedRecipes) ? linkedRecipes : []}
                                        onChange={(_, value, reason, details) => {
                                            if (details && details.option && details.option.id === '__new__') {
                                                handleCreateRecipe(details.option.name.replace(/^Add \"|\" as new Recipe$/g, ''));
                                            } else {
                                                const currentLinkedRecipes = Array.isArray(linkedRecipes) ? linkedRecipes : [];
                                                value.forEach((r: any) => {
                                                    if (!currentLinkedRecipes.some((lr: any) => lr.id === r.id)) handleLinkRecipe(r.id);
                                                });
                                                currentLinkedRecipes.forEach((lr: any) => {
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
                                            if (!Array.isArray(options)) return [];
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
                                        options={Array.isArray(allPDFs) ? allPDFs : []}
                                        getOptionLabel={option => option.title}
                                        value={Array.isArray(linkedPDFs) ? linkedPDFs : []}
                                        onChange={(_, value, reason, details) => {
                                            if (details && details.option && details.option.id === '__new__') {
                                                handleCreatePDF(details.option.title.replace(/^Add \"|\" as new PDF$/g, ''));
                                            } else {
                                                const currentLinkedPDFs = Array.isArray(linkedPDFs) ? linkedPDFs : [];
                                                value.forEach((p: any) => {
                                                    if (!currentLinkedPDFs.some((lp: any) => lp.id === p.id)) handleLinkPDF(p.id);
                                                });
                                                currentLinkedPDFs.forEach((lp: any) => {
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
                                            if (!Array.isArray(options)) return [];
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
                        <ListItem button onClick={handleLinkAllEntities}>
                            <ListItemText primary="Link All Suggested Entities" />
                        </ListItem>
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
                entityType="projects"
                fields={[
                    { key: 'name', label: 'Name' },
                    { key: 'description', label: 'Description' },
                    { key: 'status', label: 'Status' },
                    { key: 'startDate', label: 'Start Date' }
                ]}
                onImport={handleImport}
                onExport={handleExport}
                data={projects}
            />

            {/* Export Modal */}
            <ExportModal
                open={openExportModal}
                onClose={() => setOpenExportModal(false)}
                title="Projects"
                data={{
                    projects: projects,
                    experiments: projects.flatMap(project => project.experiments || [])
                }}
                onExport={handleExportWithModal}
            />
        </Box >
    );
};

export default Projects; 