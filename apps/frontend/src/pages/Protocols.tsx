import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Snackbar,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Paper,
    InputAdornment,
    Tooltip,
    Badge,
    FormControlLabel,
    Checkbox,
    Drawer,
    List as MUIList,
    ListItem as MUIListItem,
    ListItemText as MUIListItemText,
} from '@mui/material';
import {
    Science as ProtocolIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Search as SearchIcon,
    ExpandMore as ExpandMoreIcon,
    PlayArrow as ExecuteIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    Category as CategoryIcon,
    Timer as TimerIcon,
    TrendingUp as TrendingUpIcon,
    Assignment as AssignmentIcon,
    Build as BuildIcon,
} from '@mui/icons-material';
import { protocolsApi, projectsApi, databaseApi, linksApi, notesApi } from '../services/api';
import ColorLegend from '../components/Legend/ColorLegend';
import { useThemePalette } from '../services/ThemePaletteContext';
import { NOTE_TYPE_TO_PALETTE_ROLE } from '../services/colorPalettes';
import ImportExportDialog from '../components/ImportExportDialog';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useWorkspaceTabs } from './WorkspaceTabsContext'; // adjust import path as needed
import ProtocolDashboard from './ProtocolDashboard';
import Autocomplete from '@mui/material/Autocomplete';
import EntityLinksSidebar from '../components/EntityLinksSidebar';

interface ProtocolStep {
    id: string;
    stepNumber: number;
    title: string;
    description: string;
    duration?: string;
    critical?: boolean;
    notes?: string;
}

interface ProtocolReagent {
    name: string;
    concentration?: string;
    supplier?: string;
    catalogNumber?: string;
}

interface ProtocolExecution {
    id: string;
    status: 'planned' | 'in_progress' | 'completed' | 'failed' | 'abandoned';
    startDate?: string;
    endDate?: string;
    notes?: string;
    modifications: Array<{
        stepId: string;
        originalValue: string;
        newValue: string;
        reason: string;
    }>;
    results: Array<{
        parameter: string;
        value: string;
        unit?: string;
        notes?: string;
    }>;
    issues: Array<{
        stepId?: string;
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        resolved: boolean;
        resolution?: string;
    }>;
    nextSteps?: string;
    executedBy?: string;
    experiment?: { id: string; name: string; project?: { id: string; name: string } };
    createdAt: string;
    updatedAt: string;
}

interface Protocol {
    id: string;
    name: string;
    description?: string;
    category: string;
    version: string;
    steps: ProtocolStep[];
    equipment: string[];
    reagents: ProtocolReagent[];
    safetyNotes?: string;
    expectedDuration?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    successRate?: number;
    executions: ProtocolExecution[];
    createdAt: string;
    updatedAt: string;
}

interface Experiment {
    id: string;
    name: string;
    project?: { id: string; name: string };
}

interface ProtocolsProps {
    onOpenProtocolTab?: (id: string) => void;
    openTabs?: any[];
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

// 1. Implement handleLinkAllEntities to iterate over entityMentions and call linksApi.create for each, linking to the current protocol.
// 2. Enable the 'Link All' button in the Drawer, and call handleLinkAllEntities on click.
// 3. Show a snackbar notification when linking is complete.
async function handleLinkAllEntities(editingProtocol: Protocol, entityMentions: { start: number, end: number, entry: any }[], onExecutionUpdated: () => void) {
    if (!editingProtocol) return;
    const newLinks: any[] = [];
    for (const mention of entityMentions) {
        const link = await linksApi.create({
            sourceType: 'protocol',
            sourceId: editingProtocol.id,
            targetType: mention.entry.type,
            targetId: mention.entry.id,
        });
        newLinks.push(link);
    }
    onExecutionUpdated(); // Reload data to reflect new links
    return newLinks;
}

const Protocols: React.FC<ProtocolsProps> = ({ onOpenProtocolTab, openTabs }) => {
    // All hooks must be called here, at the top of the component
    const navigate = useNavigate();
    const [entityModalOpen, setEntityModalOpen] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState<any>(null);
    const { openTab } = useWorkspaceTabs();
    const [databaseEntries, setDatabaseEntries] = useState<any[]>([]);
    useEffect(() => {
        databaseApi.getAll().then(res => setDatabaseEntries(res.data.entries || res.data || []));
    }, []);

    const [protocols, setProtocols] = useState<any[]>([]);
    const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(null);
    const [loadingProtocols, setLoadingProtocols] = useState(true);
    const [filteredProtocols, setFilteredProtocols] = useState<Protocol[]>([]);
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openProtocolDialog, setOpenProtocolDialog] = useState(false);
    const [openExecutionDialog, setOpenExecutionDialog] = useState(false);
    const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const [importExportOpen, setImportExportOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    const [protocolFormData, setProtocolFormData] = useState({
        name: '',
        description: '',
        category: '',
        version: '1.0',
        steps: [] as ProtocolStep[],
        equipment: [] as string[],
        reagents: [] as ProtocolReagent[],
        safetyNotes: '',
        expectedDuration: '',
        difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    });

    const [executionFormData, setExecutionFormData] = useState({
        experimentId: '',
        status: 'planned' as 'planned' | 'in_progress' | 'completed' | 'failed' | 'abandoned',
        startDate: '',
        endDate: '',
        notes: '',
        modifications: [] as Array<{
            stepId: string;
            originalValue: string;
            newValue: string;
            reason: string;
        }>,
        results: [] as Array<{
            parameter: string;
            value: string;
            unit: string;
            notes: string;
        }>,
        issues: [] as Array<{
            stepId: string;
            description: string;
            severity: 'low' | 'medium' | 'high' | 'critical';
            resolved: boolean;
            resolution: string;
        }>,
        nextSteps: '',
        executedBy: '',
        completedSteps: [] as string[], // New state for completed steps
    });

    const [entitySidebarOpen, setEntitySidebarOpen] = useState(false);
    const [entityMentions, setEntityMentions] = useState<{ start: number, end: number, entry: any }[]>([]);
    const [linkedNotes, setLinkedNotes] = useState<any[]>([]);
    const [linkedDatabaseEntries, setLinkedDatabaseEntries] = useState<any[]>([]);
    const [allNotes, setAllNotes] = useState<any[]>([]);
    const [allDatabaseEntries, setAllDatabaseEntries] = useState<any[]>([]);
    const [creatingNote, setCreatingNote] = useState(false);
    const [creatingDatabaseEntry, setCreatingDatabaseEntry] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Filter protocols when search query or category filter changes
    useEffect(() => {
        filterProtocols();
    }, [searchQuery, selectedCategory, protocols]);

    // When protocol description/steps change, update entityMentions
    useEffect(() => {
        if (editingProtocol && editingProtocol.description) {
            setEntityMentions(findEntityMentions(editingProtocol.description, databaseEntries));
        } else {
            setEntityMentions([]);
        }
    }, [editingProtocol, databaseEntries]);

    useEffect(() => {
        setLoadingProtocols(true);
        protocolsApi.getAll().then(res => {
            setProtocols(res.data.protocols || []);
            setLoadingProtocols(false);
        });
    }, []);

    // Fetch all notes and database entries for linking
    useEffect(() => {
        if (openProtocolDialog && editingProtocol) {
            notesApi.getAll().then(res => setAllNotes(res.data || []));
            databaseApi.getAll().then(res => setAllDatabaseEntries(res.data || []));
            // Fetch existing links for this protocol
            linksApi.getOutgoing('protocol', editingProtocol.id).then(res => {
                setLinkedNotes((res.data || []).filter((l: any) => l.targetType === 'note').map((l: any) => l.note));
                setLinkedDatabaseEntries((res.data || []).filter((l: any) => l.targetType === 'databaseEntry').map((l: any) => l.databaseEntry));
            });
        }
    }, [openProtocolDialog, editingProtocol]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [protocolsRes, experimentsRes] = await Promise.allSettled([
                protocolsApi.getAll(),
                projectsApi.getAll(),
            ]);

            if (protocolsRes.status === 'fulfilled') {
                const loadedProtocols = protocolsRes.value.data.protocols || protocolsRes.value.data || [];
                setProtocols(loadedProtocols);
                setFilteredProtocols(loadedProtocols);
            }

            if (experimentsRes.status === 'fulfilled') {
                const projects = experimentsRes.value.data || [];
                const allExperiments: Experiment[] = [];
                projects.forEach((project: any) => {
                    if (project.experiments) {
                        allExperiments.push(...project.experiments.map((exp: any) => ({
                            ...exp,
                            project: { id: project.id, name: project.name }
                        })));
                    }
                });
                setExperiments(allExperiments);
            }

            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load data');
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterProtocols = () => {
        let filtered = protocols;

        if (selectedCategory) {
            filtered = filtered.filter(protocol => protocol.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            filtered = filtered.filter(protocol =>
                protocol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (protocol.description && protocol.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                protocol.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredProtocols(filtered);
    };

    const handleOpenProtocolDialog = (protocol?: Protocol) => {
        if (protocol) {
            setEditingProtocol(protocol);
            setProtocolFormData({
                name: protocol.name,
                description: protocol.description || '',
                category: protocol.category,
                version: protocol.version,
                steps: protocol.steps,
                equipment: protocol.equipment,
                reagents: protocol.reagents,
                safetyNotes: protocol.safetyNotes || '',
                expectedDuration: protocol.expectedDuration || '',
                difficulty: protocol.difficulty || 'Medium',
            });
        } else {
            setEditingProtocol(null);
            setProtocolFormData({
                name: '',
                description: '',
                category: '',
                version: '1.0',
                steps: [],
                equipment: [],
                reagents: [],
                safetyNotes: '',
                expectedDuration: '',
                difficulty: 'Medium',
            });
        }
        setOpenProtocolDialog(true);
    };

    const handleOpenExecutionDialog = (protocol: Protocol) => {
        setEditingProtocol(protocol); // Set editing protocol for execution form
        setExecutionFormData({
            experimentId: '',
            status: 'planned',
            startDate: '',
            endDate: '',
            notes: '',
            modifications: [],
            results: [],
            issues: [],
            nextSteps: '',
            executedBy: '',
            completedSteps: [], // Initialize completedSteps
        });
        setOpenExecutionDialog(true);
    };

    const handleCloseProtocolDialog = () => {
        setOpenProtocolDialog(false);
        setEditingProtocol(null);
    };

    const handleCloseExecutionDialog = () => {
        setOpenExecutionDialog(false);
        setEditingProtocol(null); // Reset editing protocol
    };

    const handleSaveProtocol = async () => {
        if (!protocolFormData.name.trim()) {
            setSnackbar({
                open: true,
                message: 'Please enter a protocol name',
                severity: 'error',
            });
            return;
        }

        if (!protocolFormData.category.trim()) {
            setSnackbar({
                open: true,
                message: 'Please select a category',
                severity: 'error',
            });
            return;
        }

        if (protocolFormData.steps.length === 0) {
            setSnackbar({
                open: true,
                message: 'Please add at least one step',
                severity: 'error',
            });
            return;
        }

        try {
            setSaving(true);
            if (editingProtocol) {
                await protocolsApi.update(editingProtocol.id, protocolFormData);
                setSnackbar({
                    open: true,
                    message: 'Protocol updated successfully',
                    severity: 'success',
                });
            } else {
                await protocolsApi.create(protocolFormData);
                setSnackbar({
                    open: true,
                    message: 'Protocol created successfully',
                    severity: 'success',
                });
            }
            handleCloseProtocolDialog();
            loadData();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to save protocol',
                severity: 'error',
            });
            console.error('Error saving protocol:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveExecution = async () => {
        if (!editingProtocol) return;

        try {
            setSaving(true);
            await protocolsApi.createExecution(editingProtocol.id, executionFormData);
            setSnackbar({
                open: true,
                message: 'Protocol execution created successfully',
                severity: 'success',
            });
            handleCloseExecutionDialog();
            loadData();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to create execution',
                severity: 'error',
            });
            console.error('Error creating execution:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProtocol = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this protocol? This will also delete all its executions.')) {
            return;
        }

        try {
            await protocolsApi.delete(id);
            setSnackbar({
                open: true,
                message: 'Protocol deleted successfully',
                severity: 'success',
            });
            loadData();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to delete protocol',
                severity: 'error',
            });
            console.error('Error deleting protocol:', err);
        }
    };

    const addStep = () => {
        const newStep: ProtocolStep = {
            id: `step_${Date.now()}`,
            stepNumber: protocolFormData.steps.length + 1,
            title: '',
            description: '',
            duration: '',
            critical: false,
            notes: '',
        };
        setProtocolFormData({
            ...protocolFormData,
            steps: [...protocolFormData.steps, newStep],
        });
    };

    const updateStep = (index: number, field: keyof ProtocolStep, value: any) => {
        const updatedSteps = [...protocolFormData.steps];
        updatedSteps[index] = { ...updatedSteps[index], [field]: value };
        setProtocolFormData({
            ...protocolFormData,
            steps: updatedSteps,
        });
    };

    const removeStep = (index: number) => {
        const updatedSteps = protocolFormData.steps.filter((_, i) => i !== index);
        // Renumber steps
        const renumberedSteps = updatedSteps.map((step, i) => ({
            ...step,
            stepNumber: i + 1,
        }));
        setProtocolFormData({
            ...protocolFormData,
            steps: renumberedSteps,
        });
    };

    const addEquipment = () => {
        setProtocolFormData({
            ...protocolFormData,
            equipment: [...protocolFormData.equipment, ''],
        });
    };

    const updateEquipment = (index: number, value: string) => {
        const updatedEquipment = [...protocolFormData.equipment];
        updatedEquipment[index] = value;
        setProtocolFormData({
            ...protocolFormData,
            equipment: updatedEquipment,
        });
    };

    const removeEquipment = (index: number) => {
        const updatedEquipment = protocolFormData.equipment.filter((_, i) => i !== index);
        setProtocolFormData({
            ...protocolFormData,
            equipment: updatedEquipment,
        });
    };

    const addReagent = () => {
        const newReagent: ProtocolReagent = {
            name: '',
            concentration: '',
            supplier: '',
            catalogNumber: '',
        };
        setProtocolFormData({
            ...protocolFormData,
            reagents: [...protocolFormData.reagents, newReagent],
        });
    };

    const updateReagent = (index: number, field: keyof ProtocolReagent, value: string) => {
        const updatedReagents = [...protocolFormData.reagents];
        updatedReagents[index] = { ...updatedReagents[index], [field]: value };
        setProtocolFormData({
            ...protocolFormData,
            reagents: updatedReagents,
        });
    };

    const removeReagent = (index: number) => {
        const updatedReagents = protocolFormData.reagents.filter((_, i) => i !== index);
        setProtocolFormData({
            ...protocolFormData,
            reagents: updatedReagents,
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <SuccessIcon color="success" />;
            case 'failed':
                return <ErrorIcon color="error" />;
            case 'in_progress':
                return <TrendingUpIcon color="primary" />;
            case 'abandoned':
                return <WarningIcon color="warning" />;
            default:
                return <ScheduleIcon color="action" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'failed':
                return 'error';
            case 'in_progress':
                return 'primary';
            case 'abandoned':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy':
                return 'success';
            case 'Medium':
                return 'warning';
            case 'Hard':
                return 'error';
            default:
                return 'default';
        }
    };

    const handleImport = async (rows: any[]) => {
        for (const row of rows) {
            await protocolsApi.create(row);
        }
        await loadData();
        setSnackbar({ open: true, message: 'Import successful!', severity: 'success' });
    };
    const handleExport = (format: 'csv' | 'json' | 'xlsx') => {
        const exportData = protocols.map(p => ({
            name: p.name,
            description: p.description,
            category: p.category,
            version: p.version,
            steps: p.steps,
            equipment: p.equipment,
            reagents: p.reagents,
            safetyNotes: p.safetyNotes,
            expectedDuration: p.expectedDuration,
            difficulty: p.difficulty,
            successRate: p.successRate,
        }));
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            saveAs(blob, 'protocols.json');
        } else if (format === 'csv') {
            const csv = Papa.unparse(exportData);
            const blob = new Blob([csv], { type: 'text/csv' });
            saveAs(blob, 'protocols.csv');
        } else if (format === 'xlsx') {
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Protocols');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            saveAs(blob, 'protocols.xlsx');
        }
        setSnackbar({ open: true, message: `Exported as ${format.toUpperCase()}`, severity: 'success' });
    };

    const PROTOCOL_FIELDS = [
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'category', label: 'Category' },
        { key: 'version', label: 'Version' },
        { key: 'steps', label: 'Steps' },
        { key: 'equipment', label: 'Equipment' },
        { key: 'reagents', label: 'Reagents' },
        { key: 'safetyNotes', label: 'Safety Notes' },
        { key: 'expectedDuration', label: 'Expected Duration' },
        { key: 'difficulty', label: 'Difficulty' },
        { key: 'successRate', label: 'Success Rate' },
    ];
    const protocolCategories = [
        'Cell Culture',
        'PCR',
        'Western Blot',
        'Microscopy',
        'Protein Purification',
        'DNA Sequencing',
        'Flow Cytometry',
        'ELISA',
        'Immunohistochemistry',
        'Electrophoresis',
        'Bioprinting',
        'Other',
    ];
    const { palette } = useThemePalette();

    function handleOpenEntity(entry: any) {
        // Navigate to entity details based on type
        if (entry.type === 'note') {
            navigate(`/notes/${entry.id}`);
        } else if (entry.type === 'project') {
            navigate(`/projects/${entry.id}`);
        } else if (entry.type === 'protocol') {
            navigate(`/protocols/${entry.id}`);
        } else if (entry.type === 'recipe') {
            navigate(`/recipes/${entry.id}`);
        } else if (entry.type === 'experiment') {
            navigate(`/experiments/${entry.id}`);
        } else if (entry.type === 'task') {
            navigate(`/tasks/${entry.id}`);
        } else if (entry.type === 'databaseEntry') {
            navigate(`/database/${entry.id}`);
        } else if (entry.type === 'table') {
            navigate(`/tables/${entry.id}`);
        } else if (entry.type === 'pdf') {
            navigate(`/pdfs/${entry.id}`);
        } else if (entry.type === 'literatureNote') {
            navigate(`/literature/${entry.id}`);
        } else {
            // Fallback to modal for unknown types
            setSelectedEntity(entry);
            setEntityModalOpen(true);
        }
    }

    function handleOpenEntityInTab() {
        if (selectedEntity) {
            // Navigate to entity details based on type
            if (selectedEntity.type === 'note') {
                navigate(`/notes/${selectedEntity.id}`);
            } else if (selectedEntity.type === 'project') {
                navigate(`/projects/${selectedEntity.id}`);
            } else if (selectedEntity.type === 'protocol') {
                navigate(`/protocols/${selectedEntity.id}`);
            } else if (selectedEntity.type === 'recipe') {
                navigate(`/recipes/${selectedEntity.id}`);
            } else if (selectedEntity.type === 'experiment') {
                navigate(`/experiments/${selectedEntity.id}`);
            } else if (selectedEntity.type === 'task') {
                navigate(`/tasks/${selectedEntity.id}`);
            } else if (selectedEntity.type === 'databaseEntry') {
                navigate(`/database/${selectedEntity.id}`);
            } else if (selectedEntity.type === 'table') {
                navigate(`/tables/${selectedEntity.id}`);
            } else if (selectedEntity.type === 'pdf') {
                navigate(`/pdfs/${selectedEntity.id}`);
            } else if (selectedEntity.type === 'literatureNote') {
                navigate(`/literature/${selectedEntity.id}`);
            } else {
                console.warn('Unknown entity type for navigation:', selectedEntity.type);
            }
            setEntityModalOpen(false);
        }
    }

    const handleLinkNote = async (noteId: string) => {
        if (!editingProtocol) return;
        await linksApi.create({ sourceType: 'protocol', sourceId: editingProtocol.id, targetType: 'note', targetId: noteId });
        const note = allNotes.find((n: any) => n.id === noteId);
        setLinkedNotes(prev => [...prev, note]);
    };
    const handleUnlinkNote = async (noteId: string) => {
        if (!editingProtocol) return;
        // Find the link id
        const links = await linksApi.getOutgoing('protocol', editingProtocol.id);
        const link = (links.data || []).find((l: any) => l.targetType === 'note' && l.targetId === noteId);
        if (link) {
            await linksApi.delete(link.id);
            setLinkedNotes(prev => prev.filter((n: any) => n.id !== noteId));
        }
    };
    const handleCreateNote = async (title: string) => {
        setCreatingNote(true);
        try {
            const res = await notesApi.create({ title, content: '', type: 'protocol' });
            setAllNotes(prev => [...prev, res.data]);
            if (editingProtocol) await handleLinkNote(res.data.id);
        } finally {
            setCreatingNote(false);
        }
    };
    const handleLinkDatabaseEntry = async (entryId: string) => {
        if (!editingProtocol) return;
        await linksApi.create({ sourceType: 'protocol', sourceId: editingProtocol.id, targetType: 'databaseEntry', targetId: entryId });
        const entry = allDatabaseEntries.find((e: any) => e.id === entryId);
        setLinkedDatabaseEntries(prev => [...prev, entry]);
    };
    const handleUnlinkDatabaseEntry = async (entryId: string) => {
        if (!editingProtocol) return;
        const links = await linksApi.getOutgoing('protocol', editingProtocol.id);
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
            if (editingProtocol) await handleLinkDatabaseEntry(res.data.id);
        } finally {
            setCreatingDatabaseEntry(false);
        }
    };

    // In the Protocols component's return:
    return (
        <Box>
            <ProtocolDashboard />
            <Typography variant="h5" sx={{ mb: 2 }}>Protocols</Typography>
            {loadingProtocols ? (
                <div>Loading protocols...</div>
            ) : (
                <List>
                    {protocols.map((protocol: any) => (
                        <ListItem button key={protocol.id} onClick={() => setSelectedProtocolId(protocol.id)}>
                            <ListItemText
                                primary={protocol.name}
                                secondary={<>
                                    <span>Category: {protocol.category}</span><br />
                                    <span>{protocol.description}</span>
                                </>}
                            />
                        </ListItem>
                    ))}
                    {protocols.length === 0 && <Typography>No protocols found.</Typography>}
                </List>
            )}
            {selectedProtocolId && <ProtocolDashboard />}
            <ColorLegend types={['protocol', 'experiment', 'project']} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Protocols</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenProtocolDialog()}
                >
                    Create Protocol
                </Button>
                <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setImportExportOpen(true)}>Import/Export</Button>
                <ImportExportDialog
                    open={importExportOpen}
                    onClose={() => setImportExportOpen(false)}
                    entityType="Protocol"
                    fields={PROTOCOL_FIELDS}
                    onImport={handleImport}
                    onExport={handleExport}
                    data={protocols}
                />
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Create and manage reusable laboratory protocols with execution tracking and cross-linking.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Search and Filter */}
            <Box sx={{ mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="Search protocols..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Filter by Category</InputLabel>
                            <Select
                                value={selectedCategory}
                                label="Filter by Category"
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <MenuItem value="">All Categories</MenuItem>
                                {protocolCategories.map((category) => (
                                    <MenuItem key={category} value={category}>
                                        {category}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Box>

            {filteredProtocols.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No protocols yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create your first protocol to get started
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {filteredProtocols.map((protocol) => (
                        <Grid item xs={12} md={6} lg={4} key={protocol.id}>
                            <Card sx={{ borderLeft: `8px solid ${palette[NOTE_TYPE_TO_PALETTE_ROLE['protocol']]}` }}>
                                <CardContent
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => onOpenProtocolTab && onOpenProtocolTab(protocol.id)}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" component="div">
                                                {protocol.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                {protocol.description || 'No description'}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                <Chip
                                                    icon={<CategoryIcon />}
                                                    label={protocol.category}
                                                    size="small"
                                                />
                                                <Chip
                                                    label={protocol.difficulty || 'Medium'}
                                                    size="small"
                                                    color={getDifficultyColor(protocol.difficulty || 'Medium')}
                                                />
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                {protocol.steps.length} steps • {protocol.executions.length} executions
                                                {protocol.expectedDuration && ` • ${protocol.expectedDuration}`}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    {/* View and Edit Completed Steps for Executions */}
                                    {protocol.executions && protocol.executions.length > 0 && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="subtitle1">Executions</Typography>
                                            {protocol.executions.map((execution: any) => (
                                                <ExecutionStepCompletionView
                                                    key={execution.id}
                                                    execution={execution}
                                                    steps={protocol.steps}
                                                    protocolId={protocol.id}
                                                    onExecutionUpdated={loadData}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Create/Edit Protocol Dialog */}
            <Dialog open={openProtocolDialog} onClose={handleCloseProtocolDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingProtocol ? 'Edit Protocol' : 'Create New Protocol'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={8}>
                                <TextField
                                    fullWidth
                                    label="Protocol Name"
                                    value={protocolFormData.name}
                                    onChange={(e) => setProtocolFormData({ ...protocolFormData, name: e.target.value })}
                                    sx={{ mb: 2 }}
                                    disabled={saving}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={protocolFormData.category}
                                        label="Category"
                                        onChange={(e) => setProtocolFormData({ ...protocolFormData, category: e.target.value })}
                                        disabled={saving}
                                    >
                                        {protocolCategories.map((category) => (
                                            <MenuItem key={category} value={category}>
                                                {category}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={3}
                            value={protocolFormData.description}
                            onChange={(e) => setProtocolFormData({ ...protocolFormData, description: e.target.value })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Version"
                                    value={protocolFormData.version}
                                    onChange={(e) => setProtocolFormData({ ...protocolFormData, version: e.target.value })}
                                    disabled={saving}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Difficulty</InputLabel>
                                    <Select
                                        value={protocolFormData.difficulty}
                                        label="Difficulty"
                                        onChange={(e) => setProtocolFormData({ ...protocolFormData, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' })}
                                        disabled={saving}
                                    >
                                        <MenuItem value="Easy">Easy</MenuItem>
                                        <MenuItem value="Medium">Medium</MenuItem>
                                        <MenuItem value="Hard">Hard</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Expected Duration"
                                    value={protocolFormData.expectedDuration}
                                    onChange={(e) => setProtocolFormData({ ...protocolFormData, expectedDuration: e.target.value })}
                                    placeholder="e.g., 2 hours, overnight"
                                    disabled={saving}
                                />
                            </Grid>
                        </Grid>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">Protocol Steps</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                {protocolFormData.steps.map((step, index) => (
                                    <Box key={step.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={12} sm={3}>
                                                <TextField
                                                    fullWidth
                                                    label="Step Title"
                                                    value={step.title}
                                                    onChange={(e) => updateStep(index, 'title', e.target.value)}
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={2}>
                                                <TextField
                                                    fullWidth
                                                    label="Duration"
                                                    value={step.duration || ''}
                                                    onChange={(e) => updateStep(index, 'duration', e.target.value)}
                                                    size="small"
                                                    placeholder="e.g., 30 min"
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={2}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={step.critical || false}
                                                            onChange={(e) => updateStep(index, 'critical', e.target.checked)}
                                                        />
                                                    }
                                                    label="Critical"
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={3}>
                                                <IconButton
                                                    color="error"
                                                    onClick={() => removeStep(index)}
                                                    size="small"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                        <TextField
                                            fullWidth
                                            label="Step Description"
                                            multiline
                                            rows={2}
                                            value={step.description}
                                            onChange={(e) => updateStep(index, 'description', e.target.value)}
                                            sx={{ mt: 1 }}
                                            size="small"
                                        />
                                        <TextField
                                            fullWidth
                                            label="Notes"
                                            value={step.notes || ''}
                                            onChange={(e) => updateStep(index, 'notes', e.target.value)}
                                            sx={{ mt: 1 }}
                                            size="small"
                                        />
                                    </Box>
                                ))}
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={addStep}
                                    sx={{ mt: 1 }}
                                    disabled={saving}
                                >
                                    Add Step
                                </Button>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">Equipment & Reagents</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="subtitle1" gutterBottom>Equipment</Typography>
                                {protocolFormData.equipment.map((equipment, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                        <TextField
                                            fullWidth
                                            label="Equipment"
                                            value={equipment}
                                            onChange={(e) => updateEquipment(index, e.target.value)}
                                            size="small"
                                        />
                                        <IconButton
                                            color="error"
                                            onClick={() => removeEquipment(index)}
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                ))}
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={addEquipment}
                                    sx={{ mt: 1, mb: 2 }}
                                    disabled={saving}
                                >
                                    Add Equipment
                                </Button>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="subtitle1" gutterBottom>Reagents</Typography>
                                {protocolFormData.reagents.map((reagent, index) => (
                                    <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Reagent Name"
                                                    value={reagent.name}
                                                    onChange={(e) => updateReagent(index, 'name', e.target.value)}
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Concentration"
                                                    value={reagent.concentration || ''}
                                                    onChange={(e) => updateReagent(index, 'concentration', e.target.value)}
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Supplier"
                                                    value={reagent.supplier || ''}
                                                    onChange={(e) => updateReagent(index, 'supplier', e.target.value)}
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="Catalog Number"
                                                        value={reagent.catalogNumber || ''}
                                                        onChange={(e) => updateReagent(index, 'catalogNumber', e.target.value)}
                                                        size="small"
                                                    />
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => removeReagent(index)}
                                                        size="small"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                ))}
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={addReagent}
                                    sx={{ mt: 1 }}
                                    disabled={saving}
                                >
                                    Add Reagent
                                </Button>
                            </AccordionDetails>
                        </Accordion>

                        <TextField
                            fullWidth
                            label="Safety Notes"
                            multiline
                            rows={3}
                            value={protocolFormData.safetyNotes}
                            onChange={(e) => setProtocolFormData({ ...protocolFormData, safetyNotes: e.target.value })}
                            sx={{ mt: 2 }}
                            disabled={saving}
                            placeholder="Important safety considerations..."
                        />
                    </Box>
                    {editingProtocol && (
                        <Box sx={{ mt: 3, mb: 2 }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>Linked Entities</Typography>
                            <Autocomplete
                                multiple
                                options={allNotes}
                                getOptionLabel={option => option.title}
                                value={linkedNotes}
                                onChange={(_, value, reason, details) => {
                                    // Add or remove links
                                    if (details && details.option && details.option.id === '__new__') {
                                        handleCreateNote(details.option.title.replace(/^Add \"|\" as new Note$/g, ''));
                                    } else {
                                        // Link new notes
                                        value.forEach((n: any) => {
                                            if (!linkedNotes.some((ln: any) => ln.id === n.id)) handleLinkNote(n.id);
                                        });
                                        // Unlink removed notes
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
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseProtocolDialog} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveProtocol}
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} /> : undefined}
                    >
                        {saving ? 'Saving...' : (editingProtocol ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Execute Protocol Dialog */}
            <Dialog open={openExecutionDialog} onClose={handleCloseExecutionDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    Execute Protocol: {editingProtocol?.name}
                </DialogTitle>
                <DialogContent>
                    {editingProtocol && (
                        <Box sx={{ pt: 1 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Experiment (Optional)</InputLabel>
                                        <Select
                                            value={executionFormData.experimentId}
                                            label="Experiment (Optional)"
                                            onChange={(e) => setExecutionFormData({
                                                ...executionFormData,
                                                experimentId: e.target.value
                                            })}
                                        >
                                            <MenuItem value="">No Experiment</MenuItem>
                                            {experiments.map((experiment) => (
                                                <MenuItem key={experiment.id} value={experiment.id}>
                                                    {experiment.project?.name} - {experiment.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={executionFormData.status}
                                            label="Status"
                                            onChange={(e) => setExecutionFormData({
                                                ...executionFormData,
                                                status: e.target.value as any
                                            })}
                                        >
                                            <MenuItem value="planned">Planned</MenuItem>
                                            <MenuItem value="in_progress">In Progress</MenuItem>
                                            <MenuItem value="completed">Completed</MenuItem>
                                            <MenuItem value="failed">Failed</MenuItem>
                                            <MenuItem value="abandoned">Abandoned</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Start Date"
                                        type="datetime-local"
                                        value={executionFormData.startDate}
                                        onChange={(e) => setExecutionFormData({
                                            ...executionFormData,
                                            startDate: e.target.value
                                        })}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="End Date"
                                        type="datetime-local"
                                        value={executionFormData.endDate}
                                        onChange={(e) => setExecutionFormData({
                                            ...executionFormData,
                                            endDate: e.target.value
                                        })}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                            </Grid>

                            <TextField
                                fullWidth
                                label="Executed By"
                                value={executionFormData.executedBy}
                                onChange={(e) => setExecutionFormData({
                                    ...executionFormData,
                                    executedBy: e.target.value
                                })}
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                fullWidth
                                label="Notes"
                                multiline
                                rows={3}
                                value={executionFormData.notes}
                                onChange={(e) => setExecutionFormData({
                                    ...executionFormData,
                                    notes: e.target.value
                                })}
                                sx={{ mb: 2 }}
                                placeholder="Execution-specific notes..."
                            />

                            <TextField
                                fullWidth
                                label="Next Steps"
                                multiline
                                rows={2}
                                value={executionFormData.nextSteps}
                                onChange={(e) => setExecutionFormData({
                                    ...executionFormData,
                                    nextSteps: e.target.value
                                })}
                                placeholder="What to do next..."
                            />

                            {/* Step Completion Checkboxes */}
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h6" sx={{ mb: 1 }}>Step Completion</Typography>
                                {editingProtocol.steps.map((step: any, idx: number) => (
                                    <FormControlLabel
                                        key={step.id}
                                        control={
                                            <Checkbox
                                                checked={Array.isArray(executionFormData.completedSteps) && executionFormData.completedSteps.includes(step.id)}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setExecutionFormData((prev: any) => {
                                                        let completed = Array.isArray(prev.completedSteps) ? [...prev.completedSteps] : [];
                                                        if (checked) {
                                                            if (!completed.includes(step.id)) completed.push(step.id);
                                                        } else {
                                                            completed = completed.filter((id: string) => id !== step.id);
                                                        }
                                                        return { ...prev, completedSteps: completed };
                                                    });
                                                }}
                                            />
                                        }
                                        label={`Step ${step.stepNumber}: ${step.title}`}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseExecutionDialog} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveExecution}
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} /> : undefined}
                    >
                        {saving ? 'Saving...' : 'Create Execution'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
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
                    <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={() => handleLinkAllEntities(editingProtocol!, entityMentions, loadData).then(() => setSnackbar({ open: true, message: 'All suggested entities linked!', severity: 'success' }))}>Link All</Button>
                </Box>
            </Drawer>

            {/* Entity Modal */}
            <Dialog open={entityModalOpen} onClose={() => setEntityModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedEntity?.name} ({selectedEntity?.type})</DialogTitle>
                <DialogContent>
                    <div>
                        <strong>ID:</strong> {selectedEntity?.id}<br />
                        <strong>Description:</strong> {selectedEntity?.description || 'No description'}
                        {/* Add more fields as needed */}
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleOpenEntityInTab} variant="contained">Open in Tab</Button>
                    <Button onClick={() => setEntityModalOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Box sx={{ display: 'flex', height: '100%' }}>
                {sidebarOpen && selectedProtocolId && (
                    <EntityLinksSidebar
                        entityType="protocol"
                        entityId={selectedProtocolId}
                        open={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                    />
                )}
                <Box sx={{ flex: 1, p: 3 }}>
                    <Button onClick={() => setSidebarOpen(o => !o)} sx={{ mb: 2 }}>
                        {sidebarOpen ? 'Hide Connections' : 'Show Connections'}
                    </Button>
                    {/* Render protocol content here, e.g., ProtocolReadView for selectedProtocolId */}
                    {selectedProtocolId && <ProtocolDashboard />}
                </Box>
            </Box>
        </Box>
    );
};

export default Protocols;

function ExecutionStepCompletionView({ execution, steps, protocolId, onExecutionUpdated }: { execution: any, steps: any[], protocolId: string, onExecutionUpdated: () => void }) {
    const [editing, setEditing] = React.useState(false);
    const [completedSteps, setCompletedSteps] = React.useState<string[]>(execution.completedSteps || []);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        setCompletedSteps(execution.completedSteps || []);
    }, [execution.completedSteps]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await protocolsApi.updateExecution(protocolId, execution.id, { completedSteps });
            setEditing(false);
            onExecutionUpdated();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
                Execution: {execution.status} • {execution.startDate ? new Date(execution.startDate).toLocaleString() : 'No start date'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                {steps.map((step: any) => (
                    <FormControlLabel
                        key={step.id}
                        control={
                            <Checkbox
                                checked={completedSteps.includes(step.id)}
                                disabled={!editing}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setCompletedSteps(prev => {
                                        if (checked) return [...prev, step.id];
                                        return prev.filter(id => id !== step.id);
                                    });
                                }}
                            />
                        }
                        label={`Step ${step.stepNumber}: ${step.title}`}
                    />
                ))}
            </Box>
            {editing ? (
                <Box sx={{ mt: 1 }}>
                    <Button onClick={handleSave} variant="contained" size="small" disabled={saving} sx={{ mr: 1 }}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button onClick={() => setEditing(false)} size="small" disabled={saving}>Cancel</Button>
                </Box>
            ) : (
                <Button onClick={() => setEditing(true)} size="small" sx={{ mt: 1 }}>Edit</Button>
            )}
        </Box>
    );
} 