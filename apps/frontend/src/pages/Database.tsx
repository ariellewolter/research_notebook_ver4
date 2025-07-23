import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Button,
    Tabs,
    Tab,
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
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Paper,
    InputAdornment,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    Tooltip,
    Badge,
    Drawer,
    List as MUIList,
    ListItem as MUIListItem,
    ListItemText as MUIListItemText,
} from '@mui/material';
import {
    Storage as DatabaseIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Visibility as ViewIcon,
    Download as ExportIcon,
    Upload as ImportIcon,
    ExpandMore as ExpandMoreIcon,
    Science as ScienceIcon,
    Biotech as GeneIcon,
    TrendingUp as GrowthFactorIcon,
    MenuBook as ProtocolIcon,
    Warning as WarningIcon,
    CheckCircle as ValidIcon,
} from '@mui/icons-material';
import { databaseApi } from '../services/api';
import { literatureNotesApi } from '../services/api';
import ColorLegend from '../components/Legend/ColorLegend';
import { useThemePalette } from '../services/ThemePaletteContext';
import { NOTE_TYPE_TO_PALETTE_ROLE } from '../services/colorPalettes';
import ZoteroCitationModal from '../components/Zotero/ZoteroCitationModal';
import Fuse from 'fuse.js';
import DatabaseFuzzyMatchModal from '../components/Database/DatabaseFuzzyMatchModal';
import type { DatabaseEntry } from '../../../../packages/shared/types';
import type { LiteratureNote } from '../../../../packages/shared/types';
import jsPDF from 'jspdf';
import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
// Add a module declaration for @orcid/bibtex-parse-js if needed
// @ts-ignore
import { BibtexParser } from '@orcid/bibtex-parse-js';
import ImportExportDialog from '../components/ImportExportDialog';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Add these option arrays for model/organism fields
const MODEL_TYPE_OPTIONS = [
    { value: 'mouse', label: 'Mouse' },
    { value: 'rat', label: 'Rat' },
    { value: 'monkey', label: 'Monkey' },
    { value: 'human', label: 'Human' },
    { value: 'cell_line', label: 'Cell Line' },
    { value: 'other', label: 'Other' },
];
const SEX_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'unknown', label: 'Unknown' },
];
const CONDITION_OPTIONS = [
    { value: 'live', label: 'Live' },
    { value: 'anesthetized', label: 'Anesthetized' },
    { value: 'fixed', label: 'Fixed' },
    { value: 'other', label: 'Other' },
];

// Demo synonym/alias map
const SYNONYM_MAP: Record<string, string[]> = {
    'EGF': ['Epidermal Growth Factor'],
    'PDGF': ['Platelet Derived Growth Factor'],
    'BSA': ['Bovine Serum Albumin'],
    // Add more as needed
};

function getCitationStyle() {
    return localStorage.getItem('biblioStyle') || 'apa';
}

function formatCitation(note: any, style: string) {
    const author = note.authors || '';
    const year = note.year || '';
    const title = note.title || '';
    const journal = note.journal || '';
    const doi = note.doi ? `https://doi.org/${note.doi}` : '';
    switch (style) {
        case 'mla':
            return `${author}. "${title}." ${journal}, ${year}. ${doi}`;
        case 'chicago':
            return `${author}. "${title}." ${journal} (${year}). ${doi}`;
        case 'apa':
        default:
            return `${author} (${year}). ${title}. ${journal}. ${doi}`;
    }
}

// Utility: Fuzzy match entity names in text and return match positions
function findEntityMentions(text: string, entries: DatabaseEntry[]): { start: number, end: number, entry: DatabaseEntry }[] {
    const matches: { start: number, end: number, entry: DatabaseEntry }[] = [];
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

// Utility: Render description with inline entity highlights
function renderDescriptionWithEntities(text: string, entries: DatabaseEntry[], onEntityClick: (entry: DatabaseEntry) => void) {
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

const DATABASE_FIELDS = [
    { key: 'type', label: 'Type' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'properties', label: 'Properties' },
    { key: 'relatedResearch', label: 'Related Research' },
    // Add metadata fields as needed
];

const Database: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [entries, setEntries] = useState<DatabaseEntry[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<DatabaseEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [editingEntry, setEditingEntry] = useState<DatabaseEntry | null>(null);
    const [viewingEntry, setViewingEntry] = useState<DatabaseEntry | null>(null);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const [formData, setFormData] = useState({
        type: 'CHEMICAL',
        name: '',
        description: '',
        properties: '',
        relatedResearch: '',
        metadata: {
            molecularWeight: '',
            concentration: '',
            storage: '',
            supplier: '',
            catalogNumber: '',
            purity: '',
            sequence: '',
            organism: '',
            function: '',
            protocol: '',
            equipment: '',
            duration: '',
            temperature: '',
            pH: '',
            synonyms: '',
            modelType: '',
            species: '',
            strain: '',
            geneticModification: '',
            sex: '',
            age: '',
            anatomicalLocation: '',
            condition: '',
            notes: '',
        },
    });

    const tabLabels = [
        'Chemicals',
        'Genes',
        'Growth Factors',
        'Protocols',
        'Animal Models',
        'Genetic Modifications',
        'Tissues',
        'Organisms',
    ];
    // Update tabTypes to include organism/model types
    const tabTypes = [
        'CHEMICAL',
        'GENE',
        'GROWTH_FACTOR',
        'PROTOCOL',
        'ANIMAL_MODEL',
        'GENETIC_MODIFICATION',
        'TISSUE',
        'ORGANISM',
    ];

    const { palette } = useThemePalette();

    const [fuzzyModalOpen, setFuzzyModalOpen] = useState(false);
    const [fuzzyMatches, setFuzzyMatches] = useState<DatabaseEntry[]>([]);
    const [pendingZoteroItem, setPendingZoteroItem] = useState<any>(null);
    const [allLitNotes, setAllLitNotes] = useState<LiteratureNote[]>([]);
    const [openLitNoteDialog, setOpenLitNoteDialog] = useState(false);
    const [selectedLitNote, setSelectedLitNote] = useState<LiteratureNote | null>(null);
    const [entitySidebarOpen, setEntitySidebarOpen] = useState(false);
    const [entityMentions, setEntityMentions] = useState<{ start: number, end: number, entry: DatabaseEntry }[]>([]);
    const [importExportOpen, setImportExportOpen] = useState(false);

    // Load entries on component mount and when tab changes
    useEffect(() => {
        loadEntries();
        literatureNotesApi.getAll().then(res => setAllLitNotes(res.data));
    }, [activeTab]);

    // Filter entries when search query changes
    useEffect(() => {
        filterEntries();
    }, [searchQuery, entries]);

    // When description changes (in edit/view dialog), update entityMentions
    useEffect(() => {
        if (editingEntry && editingEntry.description) {
            setEntityMentions(findEntityMentions(editingEntry.description, entries));
        } else if (viewingEntry && viewingEntry.description) {
            setEntityMentions(findEntityMentions(viewingEntry.description, entries));
        } else {
            setEntityMentions([]);
        }
    }, [editingEntry, viewingEntry, entries]);

    const loadEntries = async () => {
        try {
            setLoading(true);
            const type = tabTypes[activeTab];
            const response = await databaseApi.getByType(type);
            const loadedEntries = response.data.entries || response.data || [];
            setEntries(loadedEntries);
            setFilteredEntries(loadedEntries);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load database entries');
            console.error('Error loading database entries:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterEntries = () => {
        if (!searchQuery.trim()) {
            setFilteredEntries(entries);
            return;
        }

        const filtered = entries.filter(entry =>
            entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (entry.description && entry.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (entry.metadata?.supplier && entry.metadata.supplier.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (entry.metadata?.organism && entry.metadata.organism.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setFilteredEntries(filtered);
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        setSearchQuery('');
        setSelectedEntries([]);
    };

    const handleOpenDialog = (entry?: DatabaseEntry) => {
        if (entry) {
            setEditingEntry(entry);
            setFormData({
                type: entry.type,
                name: entry.name,
                description: entry.description || '',
                properties: typeof entry.properties === 'string' ? entry.properties : JSON.stringify(entry.properties || {}),
                relatedResearch: entry.relatedResearch || '',
                metadata: {
                    molecularWeight: entry.metadata?.molecularWeight?.toString() || '',
                    concentration: entry.metadata?.concentration || '',
                    storage: entry.metadata?.storage || '',
                    supplier: entry.metadata?.supplier || '',
                    catalogNumber: entry.metadata?.catalogNumber || '',
                    purity: entry.metadata?.purity || '',
                    sequence: entry.metadata?.sequence || '',
                    organism: entry.metadata?.organism || '',
                    function: entry.metadata?.function || '',
                    protocol: entry.metadata?.protocol || '',
                    equipment: Array.isArray(entry.metadata?.equipment) ? entry.metadata.equipment.join(', ') : (entry.metadata?.equipment || ''),
                    duration: entry.metadata?.duration || '',
                    temperature: entry.metadata?.temperature || '',
                    pH: entry.metadata?.pH || '',
                    synonyms: Array.isArray((entry.metadata as any)?.synonyms) ? (entry.metadata as any).synonyms.join(', ') : ((entry.metadata as any)?.synonyms || ''),
                    modelType: entry.metadata?.modelType || '',
                    species: entry.metadata?.species || '',
                    strain: entry.metadata?.strain || '',
                    geneticModification: entry.metadata?.geneticModification || '',
                    sex: entry.metadata?.sex || '',
                    age: entry.metadata?.age || '',
                    anatomicalLocation: entry.metadata?.anatomicalLocation || '',
                    condition: entry.metadata?.condition || '',
                    notes: entry.metadata?.notes || '',
                },
            });
        } else {
            setEditingEntry(null);
            setFormData({
                type: tabTypes[activeTab],
                name: '',
                description: '',
                properties: '',
                relatedResearch: '',
                metadata: {
                    molecularWeight: '',
                    concentration: '',
                    storage: '',
                    supplier: '',
                    catalogNumber: '',
                    purity: '',
                    sequence: '',
                    organism: '',
                    function: '',
                    protocol: '',
                    equipment: '',
                    duration: '',
                    temperature: '',
                    pH: '',
                    synonyms: '',
                    modelType: '',
                    species: '',
                    strain: '',
                    geneticModification: '',
                    sex: '',
                    age: '',
                    anatomicalLocation: '',
                    condition: '',
                    notes: '',
                },
            });
        }
        setOpenDialog(true);
    };

    const handleOpenViewDialog = (entry: DatabaseEntry) => {
        setViewingEntry(entry);
        setOpenViewDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingEntry(null);
    };

    const handleCloseViewDialog = () => {
        setOpenViewDialog(false);
        setViewingEntry(null);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setSnackbar({
                open: true,
                message: 'Please enter a name',
                severity: 'error',
            });
            return;
        }

        // Validate metadata based on type
        const validationError = validateMetadata();
        if (validationError) {
            setSnackbar({
                open: true,
                message: validationError,
                severity: 'error',
            });
            return;
        }

        try {
            setSaving(true);
            const entryData = {
                ...formData,
                properties: typeof formData.properties === 'string' ? formData.properties : JSON.stringify(formData.properties || {}),
                metadata: {
                    ...formData.metadata,
                    equipment: typeof formData.metadata.equipment === 'string'
                        ? formData.metadata.equipment
                        : Array.isArray(formData.metadata.equipment)
                            ? (formData.metadata.equipment as string[]).join(', ')
                            : '',
                    synonyms: formData.metadata.synonyms ? formData.metadata.synonyms.split(',').map(s => s.trim()).filter(Boolean) : [],
                },
            };

            if (editingEntry) {
                await databaseApi.update(editingEntry.id, entryData);
                setSnackbar({
                    open: true,
                    message: 'Entry updated successfully',
                    severity: 'success',
                });
            } else {
                await databaseApi.create(entryData);
                setSnackbar({
                    open: true,
                    message: 'Entry created successfully',
                    severity: 'success',
                });
            }
            handleCloseDialog();
            loadEntries();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to save entry',
                severity: 'error',
            });
            console.error('Error saving database entry:', err);
        } finally {
            setSaving(false);
        }
    };

    const validateMetadata = (): string | null => {
        const type = formData.type;

        if (type === 'CHEMICAL') {
            if (!formData.metadata.molecularWeight && !formData.metadata.supplier) {
                return 'Please provide either molecular weight or supplier for chemicals';
            }
        }

        if (type === 'GENE') {
            if (!formData.metadata.sequence && !formData.metadata.organism) {
                return 'Please provide either sequence or organism for genes';
            }
        }

        if (type === 'PROTOCOL') {
            if (!formData.metadata.protocol && !formData.metadata.equipment) {
                return 'Please provide either protocol steps or equipment for protocols';
            }
        }

        return null;
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) {
            return;
        }

        try {
            await databaseApi.delete(id);
            setSnackbar({
                open: true,
                message: 'Entry deleted successfully',
                severity: 'success',
            });
            loadEntries();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to delete entry',
                severity: 'error',
            });
            console.error('Error deleting database entry:', err);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedEntries.length === 0) {
            setSnackbar({
                open: true,
                message: 'Please select entries to delete',
                severity: 'error',
            });
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${selectedEntries.length} entries?`)) {
            return;
        }

        try {
            await Promise.all(selectedEntries.map(id => databaseApi.delete(id)));
            setSnackbar({
                open: true,
                message: `${selectedEntries.length} entries deleted successfully`,
                severity: 'success',
            });
            setSelectedEntries([]);
            loadEntries();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: 'Failed to delete some entries',
                severity: 'error',
            });
            console.error('Error bulk deleting entries:', err);
        }
    };

    const handleSelectAll = () => {
        if (selectedEntries.length === filteredEntries.length) {
            setSelectedEntries([]);
        } else {
            setSelectedEntries(filteredEntries.map(entry => entry.id));
        }
    };

    const handleSelectEntry = (id: string) => {
        setSelectedEntries(prev =>
            prev.includes(id)
                ? prev.filter(entryId => entryId !== id)
                : [...prev, id]
        );
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'CHEMICAL':
                return <ScienceIcon />;
            case 'GENE':
                return <GeneIcon />;
            case 'GROWTH_FACTOR':
                return <GrowthFactorIcon />;
            case 'PROTOCOL':
                return <ProtocolIcon />;
            default:
                return <DatabaseIcon />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'CHEMICAL':
                return 'primary';
            case 'GENE':
                return 'secondary';
            case 'GROWTH_FACTOR':
                return 'success';
            case 'PROTOCOL':
                return 'warning';
            default:
                return 'default';
        }
    };

    const renderMetadataFields = () => {
        const type = formData.type;

        if ([
            'CELL_TYPE',
            'ANIMAL_MODEL',
            'GENETIC_MODIFICATION',
            'TISSUE',
            'ORGANISM',
        ].includes(type)) {
            return (
                <>
                    <FormControl fullWidth sx={{ mb: 2 }} disabled={saving}>
                        <InputLabel>Model Type</InputLabel>
                        <Select
                            value={formData.metadata.modelType || ''}
                            label="Model Type"
                            onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, modelType: e.target.value } })}
                        >
                            {MODEL_TYPE_OPTIONS.map(opt => (
                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        label="Species"
                        value={formData.metadata.species || ''}
                        onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, species: e.target.value } })}
                        sx={{ mb: 2 }}
                        disabled={saving}
                    />
                    <TextField
                        fullWidth
                        label="Strain"
                        value={formData.metadata.strain || ''}
                        onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, strain: e.target.value } })}
                        sx={{ mb: 2 }}
                        disabled={saving}
                    />
                    <TextField
                        fullWidth
                        label="Genetic Modification"
                        value={formData.metadata.geneticModification || ''}
                        onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, geneticModification: e.target.value } })}
                        sx={{ mb: 2 }}
                        disabled={saving}
                    />
                    <FormControl fullWidth sx={{ mb: 2 }} disabled={saving}>
                        <InputLabel>Sex</InputLabel>
                        <Select
                            value={formData.metadata.sex || ''}
                            label="Sex"
                            onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, sex: e.target.value } })}
                        >
                            {SEX_OPTIONS.map(opt => (
                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        label="Age"
                        value={formData.metadata.age || ''}
                        onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, age: e.target.value } })}
                        sx={{ mb: 2 }}
                        disabled={saving}
                        placeholder="e.g., 8 weeks, adult"
                    />
                    <TextField
                        fullWidth
                        label="Anatomical Location"
                        value={formData.metadata.anatomicalLocation || ''}
                        onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, anatomicalLocation: e.target.value } })}
                        sx={{ mb: 2 }}
                        disabled={saving}
                        placeholder="e.g., fat pad, kidney capsule"
                    />
                    <FormControl fullWidth sx={{ mb: 2 }} disabled={saving}>
                        <InputLabel>Condition</InputLabel>
                        <Select
                            value={formData.metadata.condition || ''}
                            label="Condition"
                            onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, condition: e.target.value } })}
                        >
                            {CONDITION_OPTIONS.map(opt => (
                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        label="Notes"
                        value={formData.metadata.notes || ''}
                        onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, notes: e.target.value } })}
                        sx={{ mb: 2 }}
                        disabled={saving}
                        multiline
                        rows={2}
                    />
                </>
            );
        }

        switch (type) {
            case 'CHEMICAL':
                return (
                    <>
                        <TextField
                            fullWidth
                            label="Molecular Weight (g/mol)"
                            type="number"
                            value={formData.metadata.molecularWeight}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, molecularWeight: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />
                        <TextField
                            fullWidth
                            label="Concentration"
                            value={formData.metadata.concentration}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, concentration: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                            placeholder="e.g., 1M, 10mg/mL"
                        />
                        <TextField
                            fullWidth
                            label="Storage Conditions"
                            value={formData.metadata.storage}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, storage: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                            placeholder="e.g., -20°C, 4°C, RT"
                        />
                        <TextField
                            fullWidth
                            label="Supplier"
                            value={formData.metadata.supplier}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, supplier: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />
                        <TextField
                            fullWidth
                            label="Catalog Number"
                            value={formData.metadata.catalogNumber}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, catalogNumber: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />
                        <TextField
                            fullWidth
                            label="Purity"
                            value={formData.metadata.purity}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, purity: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                            placeholder="e.g., >95%, HPLC grade"
                        />
                    </>
                );

            case 'GENE':
                return (
                    <>
                        <TextField
                            fullWidth
                            label="Sequence"
                            multiline
                            rows={3}
                            value={formData.metadata.sequence}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, sequence: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                            placeholder="DNA/RNA sequence"
                        />
                        <TextField
                            fullWidth
                            label="Organism"
                            value={formData.metadata.organism}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, organism: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                            placeholder="e.g., Homo sapiens, E. coli"
                        />
                        <TextField
                            fullWidth
                            label="Function"
                            multiline
                            rows={2}
                            value={formData.metadata.function}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, function: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                            placeholder="Gene function or role"
                        />
                    </>
                );

            case 'GROWTH_FACTOR':
                return (
                    <>
                        <TextField
                            fullWidth
                            label="Concentration"
                            value={formData.metadata.concentration}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, concentration: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                            placeholder="e.g., 10ng/mL"
                        />
                        <TextField
                            fullWidth
                            label="Storage Conditions"
                            value={formData.metadata.storage}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, storage: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                            placeholder="e.g., -80°C, aliquoted"
                        />
                        <TextField
                            fullWidth
                            label="Supplier"
                            value={formData.metadata.supplier}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, supplier: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />
                        <TextField
                            fullWidth
                            label="Catalog Number"
                            value={formData.metadata.catalogNumber}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, catalogNumber: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />
                    </>
                );

            case 'PROTOCOL':
                return (
                    <>
                        <TextField
                            fullWidth
                            label="Protocol Steps"
                            multiline
                            rows={4}
                            value={formData.metadata.protocol}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, protocol: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                            placeholder="Step-by-step protocol instructions"
                        />
                        <TextField
                            fullWidth
                            label="Equipment (comma-separated)"
                            value={formData.metadata.equipment}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, equipment: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                            placeholder="e.g., centrifuge, pipettes, incubator"
                        />
                        <TextField
                            fullWidth
                            label="Duration"
                            value={formData.metadata.duration}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, duration: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                            placeholder="e.g., 2 hours, overnight"
                        />
                        <TextField
                            fullWidth
                            label="Temperature"
                            value={formData.metadata.temperature}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, temperature: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                            placeholder="e.g., 37°C, 4°C"
                        />
                        <TextField
                            fullWidth
                            label="pH"
                            value={formData.metadata.pH}
                            onChange={(e) => setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, pH: e.target.value }
                            })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                            placeholder="e.g., 7.4, 8.0"
                        />
                    </>
                );

            default:
                return null;
        }
    };

    const descriptionRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const [zoteroModalOpen, setZoteroModalOpen] = useState(false);
    const handleInsertCitation = (citation: { id: number; title: string }) => {
        const match = citation.title.match(/^(.*?) \((\d{4})\)/);
        const citeText = match ? `(${match[1]}, ${match[2]})` : citation.title;
        const textarea = descriptionRef.current;
        if (!textarea) return;
        const cursor = textarea.selectionStart || 0;
        const value = formData.description;
        const before = value.slice(0, cursor);
        const after = value.slice(cursor);
        const newValue = before + citeText + after;
        setFormData({ ...formData, description: newValue });
        setZoteroModalOpen(false);
        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = cursor + citeText.length;
        }, 0);
    };

    // Enhanced fuzzy search for database entries by name/title/type, authors, year, and synonyms
    const fuzzySearchEntries = (query: string, type?: string, zoteroMeta?: { authors?: string[]; year?: string; altTitles?: string[] }) => {
        let searchTerms = [query];
        if (zoteroMeta?.altTitles) searchTerms.push(...zoteroMeta.altTitles);
        if (zoteroMeta?.authors) searchTerms.push(...zoteroMeta.authors);
        if (zoteroMeta?.year) searchTerms.push(zoteroMeta.year);
        // Add synonyms
        if (SYNONYM_MAP[query]) searchTerms.push(...SYNONYM_MAP[query]);
        // Remove duplicates
        searchTerms = Array.from(new Set(searchTerms));
        const fuse = new Fuse(entries, {
            keys: [
                'name',
                'description',
                'metadata.supplier',
                'metadata.organism',
            ],
            threshold: 0.4,
        });
        let results: any[] = [];
        for (const term of searchTerms) {
            results = results.concat(fuse.search(term));
        }
        // Remove duplicate results
        const seen = new Set();
        const uniqueResults = results.filter(r => {
            if (seen.has(r.item.id)) return false;
            seen.add(r.item.id);
            return true;
        });
        if (type) {
            return uniqueResults.filter(r => r.item.type === type).map(r => r.item);
        }
        return uniqueResults.map(r => r.item);
    };

    const handleZoteroCitation = (citation: { id: number; title: string; type?: string; authors?: string[]; year?: string; altTitles?: string[] }) => {
        // Use citation.title and citation.type for fuzzy search
        setPendingZoteroItem(citation);
        const matches = fuzzySearchEntries(citation.title, citation.type, {
            authors: citation.authors,
            year: citation.year,
            altTitles: citation.altTitles,
        });
        setFuzzyMatches(matches);
        setFuzzyModalOpen(true);
    };

    const handleSelectFuzzyMatch = async (entryId: string) => {
        const entry = entries.find(e => e.id === entryId);
        if (!entry) return;
        const newRelated = (entry.relatedResearch ? entry.relatedResearch + '\n' : '') + pendingZoteroItem.title;
        // Convert metadata fields to string as required by API
        const meta = entry.metadata || {};
        const metadata = {
            molecularWeight: meta.molecularWeight !== undefined ? String(meta.molecularWeight) : '',
            concentration: meta.concentration || '',
            storage: meta.storage || '',
            supplier: meta.supplier || '',
            catalogNumber: meta.catalogNumber || '',
            purity: meta.purity || '',
            sequence: meta.sequence || '',
            organism: meta.organism || '',
            function: meta.function || '',
            protocol: meta.protocol || '',
            equipment: Array.isArray(meta.equipment) ? meta.equipment.join(', ') : (meta.equipment || ''),
            duration: meta.duration || '',
            temperature: meta.temperature || '',
            pH: meta.pH || '',
            modelType: meta.modelType || '',
            species: meta.species || '',
            strain: meta.strain || '',
            geneticModification: meta.geneticModification || '',
            sex: meta.sex || '',
            age: meta.age || '',
            anatomicalLocation: meta.anatomicalLocation || '',
            condition: meta.condition || '',
            notes: meta.notes || '',
        };
        const updatePayload = {
            name: entry.name,
            description: entry.description,
            properties: typeof entry.properties === 'string' ? entry.properties : JSON.stringify(entry.properties || {}),
            relatedResearch: newRelated,
            metadata,
        };
        await databaseApi.update(entryId, updatePayload);
        setSnackbar({ open: true, message: 'Citation added to existing entry.', severity: 'success' });
        setFuzzyModalOpen(false);
        setPendingZoteroItem(null);
        loadEntries();
    };

    const handleCreateNewFromZotero = () => {
        // Pre-fill formData with Zotero metadata and citation
        setFormData({
            ...formData,
            name: pendingZoteroItem.title,
            type: pendingZoteroItem.type || tabTypes[activeTab],
            description: pendingZoteroItem.abstract || pendingZoteroItem.notes || '',
            relatedResearch: [
                pendingZoteroItem.title,
                pendingZoteroItem.authors ? `Authors: ${pendingZoteroItem.authors.join(', ')}` : '',
                pendingZoteroItem.year ? `Year: ${pendingZoteroItem.year}` : '',
                pendingZoteroItem.journal ? `Journal: ${pendingZoteroItem.journal}` : '',
                pendingZoteroItem.doi ? `DOI: ${pendingZoteroItem.doi}` : '',
            ].filter(Boolean).join('\n'),
            metadata: {
                ...formData.metadata,
                supplier: pendingZoteroItem.supplier || '',
                organism: pendingZoteroItem.organism || '',
                protocol: pendingZoteroItem.protocol || '',
                // Add more mappings as needed
            },
        });
        setFuzzyModalOpen(false);
        setOpenDialog(true);
        setPendingZoteroItem(null);
    };

    function handleExportPDF() {
        const doc = new jsPDF();
        const citations = entries.map(n => formatCitation(n, getCitationStyle())).join("\n\n");
        doc.text(citations, 10, 10);
        doc.save("database-citations.pdf");
    }
    function handleExportWord() {
        const doc = new DocxDocument({
            sections: [{
                properties: {},
                children: entries.map(n => new Paragraph({ children: [new TextRun(formatCitation(n, getCitationStyle()))] }))
            }]
        });
        Packer.toBlob(doc).then(blob => saveAs(blob, "database-citations.docx"));
    }
    function handleExportBibTeX() {
        // DatabaseEntry does not have citation fields. Export only name and type.
        const bibtex = filteredEntries.map(n => `@misc{${n.id},\n  name={${n.name}},\n  type={${n.type}},\n  description={${n.description || ''}}\n}`).join("\n\n");
        const blob = new Blob([bibtex], { type: 'text/x-bibtex' });
        saveAs(blob, "database-entries.bib");
    }
    function handleExportMarkdown() {
        const md = entries.map(n => `- ${formatCitation(n, getCitationStyle())}`).join("\n");
        const blob = new Blob([md], { type: 'text/markdown' });
        saveAs(blob, "database-citations.md");
    }

    const handleImport = async (rows: any[]) => {
        // Bulk create/update logic (simple: create all)
        for (const row of rows) {
            await databaseApi.create(row);
        }
        await loadEntries();
    };
    const handleExport = (format: 'csv' | 'json' | 'xlsx') => {
        const exportData = filteredEntries.map(e => ({
            type: e.type,
            name: e.name,
            description: e.description,
            properties: e.properties,
            relatedResearch: e.relatedResearch,
            // Add metadata fields as needed
        }));
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            saveAs(blob, 'database-entries.json');
        } else if (format === 'csv') {
            const csv = Papa.unparse(exportData);
            const blob = new Blob([csv], { type: 'text/csv' });
            saveAs(blob, 'database-entries.csv');
        } else if (format === 'xlsx') {
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Database');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            saveAs(blob, 'database-entries.xlsx');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <ColorLegend types={['database', 'protocol', 'project', 'table']} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Database</Typography>
                <Box>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setImportExportOpen(true)}>Import/Export</Button>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportPDF}>Export PDF</Button>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportWord}>Export Word</Button>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportBibTeX}>Export BibTeX</Button>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportMarkdown}>Export MD</Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Add Entry
                    </Button>
                </Box>
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Manage your scientific database entries with detailed metadata.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Search and Bulk Actions */}
            <Box sx={{ mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="Search entries..."
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
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {selectedEntries.length > 0 && (
                                <>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={handleBulkDelete}
                                        startIcon={<DeleteIcon />}
                                    >
                                        Delete Selected ({selectedEntries.length})
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setSelectedEntries([])}
                                    >
                                        Clear Selection
                                    </Button>
                                </>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
                {tabLabels.map((label, index) => (
                    <Tab key={label} label={label} />
                ))}
            </Tabs>

            {filteredEntries.length === 0 && !loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No {tabLabels[activeTab].toLowerCase()} yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create your first {tabLabels[activeTab].toLowerCase().slice(0, -1)} to get started
                    </Typography>
                </Box>
            ) : viewMode === 'grid' ? (
                <Grid container spacing={3}>
                    {filteredEntries.map((entry) => (
                        <Grid item xs={12} md={6} lg={4} key={entry.id}>
                            <Card sx={{ borderLeft: `8px solid ${palette[NOTE_TYPE_TO_PALETTE_ROLE[entry.type.toLowerCase()]] || palette.primary}` }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" component="div">
                                                {entry.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                {entry.description || 'No description'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                Created: {new Date(entry.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ background: palette[NOTE_TYPE_TO_PALETTE_ROLE[entry.type.toLowerCase()]] }}>
                                            <IconButton size="small" onClick={() => handleOpenViewDialog(entry)}>
                                                <ViewIcon />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleOpenDialog(entry)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDelete(entry.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Chip
                                            label={entry.type.replace('_', ' ')}
                                            size="small"
                                            color={getTypeColor(entry.type)}
                                        />
                                        {entry.metadata?.supplier && (
                                            <Typography variant="caption" color="text.secondary">
                                                {entry.metadata.supplier}
                                            </Typography>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedEntries.length === filteredEntries.length && filteredEntries.length > 0}
                                        indeterminate={selectedEntries.length > 0 && selectedEntries.length < filteredEntries.length}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Supplier</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredEntries.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedEntries.includes(entry.id)}
                                            onChange={() => handleSelectEntry(entry.id)}
                                        />
                                    </TableCell>
                                    <TableCell>{entry.name}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={entry.type.replace('_', ' ')}
                                            size="small"
                                            color={getTypeColor(entry.type)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {entry.description?.substring(0, 50)}
                                        {entry.description && entry.description.length > 50 && '...'}
                                    </TableCell>
                                    <TableCell>{entry.metadata?.supplier || '-'}</TableCell>
                                    <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={() => handleOpenViewDialog(entry)}>
                                            <ViewIcon />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleOpenDialog(entry)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDelete(entry.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingEntry ? 'Edit Entry' : 'Create New Entry'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={formData.type}
                                label="Type"
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                disabled={saving}
                            >
                                <MenuItem value="CHEMICAL">Chemical</MenuItem>
                                <MenuItem value="GENE">Gene</MenuItem>
                                <MenuItem value="GROWTH_FACTOR">Growth Factor</MenuItem>
                                <MenuItem value="PROTOCOL">Protocol</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />

                        <Button
                            variant="outlined"
                            startIcon={<ScienceIcon />}
                            sx={{ mb: 2 }}
                            onClick={() => setZoteroModalOpen(true)}
                            disabled={saving}
                        >
                            Cite from Zotero
                        </Button>
                        <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                            inputRef={descriptionRef}
                        />
                        <Button size="small" onClick={() => setEntitySidebarOpen(true)}>See All Entity Suggestions</Button>
                        <TextField
                            fullWidth
                            label="Related Research"
                            multiline
                            rows={3}
                            value={formData.relatedResearch}
                            onChange={(e) => setFormData({ ...formData, relatedResearch: e.target.value })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">Scientific Metadata</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                {renderMetadataFields()}
                            </AccordionDetails>
                        </Accordion>

                        <TextField
                            fullWidth
                            label="Synonyms (comma-separated)"
                            value={formData.metadata.synonyms || ''}
                            onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, synonyms: e.target.value } })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />

                        <TextField
                            fullWidth
                            label="Additional Properties (JSON)"
                            multiline
                            rows={3}
                            value={formData.properties}
                            onChange={(e) => setFormData({ ...formData, properties: e.target.value })}
                            helperText="Optional: Additional properties in JSON format"
                            disabled={saving}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} /> : undefined}
                    >
                        {saving ? 'Saving...' : (editingEntry ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Entry Dialog */}
            <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTypeIcon(viewingEntry?.type || '')}
                        {viewingEntry?.name}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {viewingEntry && (
                        <Box sx={{ pt: 1 }}>
                            <Typography variant="h6" gutterBottom>Basic Information</Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                <strong>Type:</strong> {viewingEntry.type.replace('_', ' ')}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                <strong>Description:</strong> {viewingEntry.description || 'No description'}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 3 }}>
                                <strong>Created:</strong> {new Date(viewingEntry.createdAt).toLocaleDateString()}
                            </Typography>

                            {viewingEntry.metadata && (
                                <>
                                    <Typography variant="h6" gutterBottom>Scientific Metadata</Typography>
                                    <Grid container spacing={2}>
                                        {Object.entries(viewingEntry.metadata).map(([key, value]) => {
                                            if (!value || (Array.isArray(value) && value.length === 0)) return null;
                                            return (
                                                <Grid item xs={12} sm={6} key={key}>
                                                    <Typography variant="body2">
                                                        <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong>
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {Array.isArray(value) ? value.join(', ') : value}
                                                    </Typography>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </>
                            )}

                            {viewingEntry.properties && (
                                <>
                                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Additional Properties</Typography>
                                    <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                                        <Typography variant="body2" fontFamily="monospace">
                                            {typeof viewingEntry.properties === 'string' ? viewingEntry.properties : JSON.stringify(viewingEntry.properties || {}, null, 2)}
                                        </Typography>
                                    </Paper>
                                </>
                            )}
                            <Box sx={{ mt: 2, mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ mb: 1 }}>Related Literature Notes</Typography>
                                <List dense>
                                    {allLitNotes.filter(note => note.relatedEntries?.includes(viewingEntry?.id || '')).map(note => (
                                        <ListItem key={note.id} button onClick={() => { setSelectedLitNote(note); setOpenLitNoteDialog(true); }}>
                                            <ListItemText
                                                primary={note.title}
                                                secondary={note.authors ? `${note.authors}${note.year ? ` (${note.year})` : ''}` : note.year}
                                            />
                                        </ListItem>
                                    ))}
                                    {allLitNotes.filter(note => note.relatedEntries?.includes(viewingEntry?.id || '')).length === 0 && (
                                        <ListItem><ListItemText primary="No related literature notes." /></ListItem>
                                    )}
                                </List>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseViewDialog}>Close</Button>
                    <Button
                        onClick={() => {
                            handleCloseViewDialog();
                            handleOpenDialog(viewingEntry || undefined);
                        }}
                        variant="contained"
                    >
                        Edit
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
            <ZoteroCitationModal
                open={zoteroModalOpen}
                onClose={() => setZoteroModalOpen(false)}
                onSelectCitation={handleZoteroCitation}
            />
            <DatabaseFuzzyMatchModal
                open={fuzzyModalOpen}
                matches={fuzzyMatches}
                zoteroItem={pendingZoteroItem || { title: '', type: '' }}
                onSelectMatch={handleSelectFuzzyMatch}
                onCreateNew={handleCreateNewFromZotero}
                onClose={() => setFuzzyModalOpen(false)}
            />
            {/* Literature Note Dialog (view only) */}
            <Dialog open={openLitNoteDialog} onClose={() => setOpenLitNoteDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>{selectedLitNote?.title}</DialogTitle>
                <DialogContent>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>{selectedLitNote?.authors} {selectedLitNote?.year}</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>{selectedLitNote?.journal}</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>{selectedLitNote?.abstract}</Typography>
                    <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>{selectedLitNote?.citation}</Typography>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">Your Notes</Typography>
                        <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 1, background: '#fafafa' }}>
                            {selectedLitNote?.userNote}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenLitNoteDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
            <Drawer anchor="right" open={entitySidebarOpen} onClose={() => setEntitySidebarOpen(false)}>
                <Box sx={{ width: 320, p: 2 }}>
                    <Typography variant="h6">Entity Suggestions</Typography>
                    <MUIList>
                        {entityMentions.map((m, i) => (
                            <MUIListItem button key={i} onClick={() => { setEntitySidebarOpen(false); handleOpenViewDialog(m.entry); }}>
                                <MUIListItemText primary={m.entry.name} secondary={m.entry.type} />
                            </MUIListItem>
                        ))}
                        {entityMentions.length === 0 && <Typography>No suggestions found.</Typography>}
                    </MUIList>
                </Box>
            </Drawer>
            <ImportExportDialog
                open={importExportOpen}
                onClose={() => setImportExportOpen(false)}
                entityType="Database Entry"
                fields={DATABASE_FIELDS}
                onImport={handleImport}
                onExport={handleExport}
                data={filteredEntries}
            />
        </Box>
    );
};

export default Database; 