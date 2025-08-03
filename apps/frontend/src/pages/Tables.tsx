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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Checkbox,
    Switch,
    FormControlLabel,
    InputAdornment,
    Tooltip,
    Badge,
    Drawer,
    List as MUIList,
    ListItem as MUIListItem,
    ListItemText as MUIListItemText,
} from '@mui/material';
import {
    TableChart as TableIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Search as SearchIcon,
    ExpandMore as ExpandMoreIcon,
    Add as AddRowIcon,
    DeleteSweep as DeleteSweepIcon,
    Download as ExportIcon,
    Upload as ImportIcon,
    FilterList as FilterIcon,
    Sort as SortIcon,
    Science as ExperimentIcon,
} from '@mui/icons-material';
import { tablesApi, projectsApi, databaseApi } from '../services/api';
import ColorLegend from '../components/Legend/ColorLegend';
import { useThemePalette } from '../services/ThemePaletteContext';
import { NOTE_TYPE_TO_PALETTE_ROLE } from '../services/colorPalettes';
import ImportExportDialog from '../components/ImportExportDialog';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface TableColumn {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select';
    required?: boolean;
    options?: string[];
    defaultValue?: any;
}

interface TableRow {
    id: string;
    data: Record<string, any>;
    rowNumber: number;
    createdAt: string;
    updatedAt: string;
}

interface Table {
    id: string;
    name: string;
    description?: string;
    experimentId?: string;
    experiment?: { id: string; name: string };
    columns: TableColumn[];
    rows: TableRow[];
    createdAt: string;
    updatedAt: string;
}

interface Experiment {
    id: string;
    name: string;
    project?: { id: string; name: string };
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

const TABLE_FIELDS = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'columns', label: 'Columns' },
    { key: 'rows', label: 'Rows' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
];

const Tables: React.FC = () => {
    const navigate = useNavigate();
    const [tables, setTables] = useState<Table[]>([]);
    const [filteredTables, setFilteredTables] = useState<Table[]>([]);
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openTableDialog, setOpenTableDialog] = useState(false);
    const [openRowDialog, setOpenRowDialog] = useState(false);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [editingTable, setEditingTable] = useState<Table | null>(null);
    const [viewingTable, setViewingTable] = useState<Table | null>(null);
    const [selectedExperimentId, setSelectedExperimentId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const [tableFormData, setTableFormData] = useState({
        name: '',
        description: '',
        experimentId: '',
        columns: [] as TableColumn[],
    });

    const [rowFormData, setRowFormData] = useState<Record<string, any>>({});

    const { palette } = useThemePalette();

    // Add state for sidebar/modal
    const [entitySidebarOpen, setEntitySidebarOpen] = useState(false);
    const [entityMentions, setEntityMentions] = useState<{ start: number, end: number, entry: any }[]>([]);

    // Add state for import/export dialog
    const [importExportOpen, setImportExportOpen] = useState(false);

    // Add state for database entries
    const [databaseEntries, setDatabaseEntries] = useState<any[]>([]);

    // Load tables, experiments, and database entries on component mount
    useEffect(() => {
        loadData();
        databaseApi.getAll().then(res => setDatabaseEntries(res.data.entries || res.data || []));
    }, []);

    // Filter tables when search query or experiment filter changes
    useEffect(() => {
        filterTables();
    }, [searchQuery, selectedExperimentId, tables]);

    // When table description/notes change, update entityMentions
    useEffect(() => {
        if (editingTable && editingTable.description) {
            setEntityMentions(findEntityMentions(editingTable.description, databaseEntries));
        } else {
            setEntityMentions([]);
        }
    }, [editingTable, databaseEntries]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [tablesRes, experimentsRes] = await Promise.allSettled([
                tablesApi.getAll(),
                projectsApi.getAll(),
            ]);

            if (tablesRes.status === 'fulfilled') {
                const loadedTables = tablesRes.value.data.tables || tablesRes.value.data || [];
                setTables(loadedTables);
                setFilteredTables(loadedTables);
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

    const filterTables = () => {
        let filtered = tables;

        if (selectedExperimentId) {
            filtered = filtered.filter(table => table.experimentId === selectedExperimentId);
        }

        if (searchQuery.trim()) {
            filtered = filtered.filter(table =>
                table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (table.description && table.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        setFilteredTables(filtered);
    };

    const handleOpenTableDialog = (table?: Table) => {
        if (table) {
            setEditingTable(table);
            setTableFormData({
                name: table.name,
                description: table.description || '',
                experimentId: table.experimentId || '',
                columns: table.columns,
            });
        } else {
            setEditingTable(null);
            setTableFormData({
                name: '',
                description: '',
                experimentId: '',
                columns: [],
            });
        }
        setOpenTableDialog(true);
    };

    const handleOpenRowDialog = (table: Table) => {
        setViewingTable(table);
        const initialData: Record<string, any> = {};
        table.columns.forEach(column => {
            initialData[column.id] = column.defaultValue || '';
        });
        setRowFormData(initialData);
        setOpenRowDialog(true);
    };

    const handleOpenViewDialog = (table: Table) => {
        setViewingTable(table);
        setOpenViewDialog(true);
    };

    const handleCloseTableDialog = () => {
        setOpenTableDialog(false);
        setEditingTable(null);
    };

    const handleCloseRowDialog = () => {
        setOpenRowDialog(false);
        setViewingTable(null);
        setRowFormData({});
    };

    const handleCloseViewDialog = () => {
        setOpenViewDialog(false);
        setViewingTable(null);
    };

    const handleSaveTable = async () => {
        if (!tableFormData.name.trim()) {
            setSnackbar({
                open: true,
                message: 'Please enter a table name',
                severity: 'error',
            });
            return;
        }

        if (tableFormData.columns.length === 0) {
            setSnackbar({
                open: true,
                message: 'Please add at least one column',
                severity: 'error',
            });
            return;
        }

        try {
            setSaving(true);
            if (editingTable) {
                await tablesApi.update(editingTable.id, tableFormData);
                setSnackbar({
                    open: true,
                    message: 'Table updated successfully',
                    severity: 'success',
                });
            } else {
                await tablesApi.create(tableFormData);
                setSnackbar({
                    open: true,
                    message: 'Table created successfully',
                    severity: 'success',
                });
            }
            handleCloseTableDialog();
            loadData();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to save table',
                severity: 'error',
            });
            console.error('Error saving table:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveRow = async () => {
        if (!viewingTable) return;

        try {
            setSaving(true);
            await tablesApi.addRow(viewingTable.id, { data: rowFormData });
            setSnackbar({
                open: true,
                message: 'Row added successfully',
                severity: 'success',
            });
            handleCloseRowDialog();
            loadData();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to add row',
                severity: 'error',
            });
            console.error('Error adding row:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTable = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this table? This will also delete all its rows.')) {
            return;
        }

        try {
            await tablesApi.delete(id);
            setSnackbar({
                open: true,
                message: 'Table deleted successfully',
                severity: 'success',
            });
            loadData();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to delete table',
                severity: 'error',
            });
            console.error('Error deleting table:', err);
        }
    };

    const handleDeleteRow = async (tableId: string, rowId: string) => {
        if (!window.confirm('Are you sure you want to delete this row?')) {
            return;
        }

        try {
            await tablesApi.deleteRow(tableId, rowId);
            setSnackbar({
                open: true,
                message: 'Row deleted successfully',
                severity: 'success',
            });
            loadData();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to delete row',
                severity: 'error',
            });
            console.error('Error deleting row:', err);
        }
    };

    const addColumn = () => {
        const newColumn: TableColumn = {
            id: `col_${Date.now()}`,
            name: '',
            type: 'text',
            required: false,
        };
        setTableFormData({
            ...tableFormData,
            columns: [...tableFormData.columns, newColumn],
        });
    };

    const updateColumn = (index: number, field: keyof TableColumn, value: any) => {
        const updatedColumns = [...tableFormData.columns];
        updatedColumns[index] = { ...updatedColumns[index], [field]: value };
        setTableFormData({
            ...tableFormData,
            columns: updatedColumns,
        });
    };

    const removeColumn = (index: number) => {
        const updatedColumns = tableFormData.columns.filter((_, i) => i !== index);
        setTableFormData({
            ...tableFormData,
            columns: updatedColumns,
        });
    };

    const renderColumnEditor = (column: TableColumn, index: number) => (
        <Box key={column.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                    <TextField
                        fullWidth
                        label="Column Name"
                        value={column.name}
                        onChange={(e) => updateColumn(index, 'name', e.target.value)}
                        size="small"
                    />
                </Grid>
                <Grid item xs={12} sm={2}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Type</InputLabel>
                        <Select
                            value={column.type}
                            label="Type"
                            onChange={(e) => updateColumn(index, 'type', e.target.value)}
                        >
                            <MenuItem value="text">Text</MenuItem>
                            <MenuItem value="number">Number</MenuItem>
                            <MenuItem value="date">Date</MenuItem>
                            <MenuItem value="boolean">Boolean</MenuItem>
                            <MenuItem value="select">Select</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={column.required || false}
                                onChange={(e) => updateColumn(index, 'required', e.target.checked)}
                            />
                        }
                        label="Required"
                    />
                </Grid>
                {column.type === 'select' && (
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            label="Options (comma-separated)"
                            value={column.options?.join(', ') || ''}
                            onChange={(e) => updateColumn(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                            size="small"
                        />
                    </Grid>
                )}
                <Grid item xs={12} sm={2}>
                    <IconButton
                        color="error"
                        onClick={() => removeColumn(index)}
                        size="small"
                    >
                        <DeleteIcon />
                    </IconButton>
                </Grid>
            </Grid>
        </Box>
    );

    const renderCellValue = (value: any, column: TableColumn) => {
        if (value === null || value === undefined) return '-';

        switch (column.type) {
            case 'boolean':
                return value ? 'Yes' : 'No';
            case 'date':
                return new Date(value).toLocaleDateString();
            case 'select':
                return value;
            default:
                return String(value);
        }
    };

    const handleImport = async (rows: any[]) => {
        for (const row of rows) {
            await tablesApi.create(row);
        }
        await loadData();
        setSnackbar({ open: true, message: 'Import successful!', severity: 'success' });
    };
    const handleExport = (format: 'csv' | 'json' | 'xlsx') => {
        const exportData = tables.map(t => ({
            name: t.name,
            description: t.description,
            columns: t.columns,
            rows: t.rows,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
        }));
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            saveAs(blob, 'tables.json');
        } else if (format === 'csv') {
            const csv = Papa.unparse(exportData);
            const blob = new Blob([csv], { type: 'text/csv' });
            saveAs(blob, 'tables.csv');
        } else if (format === 'xlsx') {
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Tables');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            saveAs(blob, 'tables.xlsx');
        }
        setSnackbar({ open: true, message: `Exported as ${format.toUpperCase()}`, severity: 'success' });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const handleOpenEntity = (entry: any) => {
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
            console.warn('Unknown entity type for navigation:', entry.type);
        }
    };

    return (
        <Box>
            <ColorLegend types={['table', 'experiment', 'project']} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Tables</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenTableDialog()}
                >
                    Create Table
                </Button>
                <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setImportExportOpen(true)}>Import/Export</Button>
                <ImportExportDialog
                    open={importExportOpen}
                    onClose={() => setImportExportOpen(false)}
                    entityType="Table"
                    fields={TABLE_FIELDS}
                    onImport={handleImport}
                    onExport={handleExport}
                    data={tables}
                />
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Create and manage structured data tables for your experiments and research.
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
                            placeholder="Search tables..."
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
                            <InputLabel>Filter by Experiment</InputLabel>
                            <Select
                                value={selectedExperimentId}
                                label="Filter by Experiment"
                                onChange={(e) => setSelectedExperimentId(e.target.value)}
                            >
                                <MenuItem value="">All Experiments</MenuItem>
                                {experiments.map((experiment) => (
                                    <MenuItem key={experiment.id} value={experiment.id}>
                                        {experiment.project?.name} - {experiment.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Box>

            {filteredTables.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No tables yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create your first table to get started
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {filteredTables.map((table) => (
                        <Grid item xs={12} md={6} lg={4} key={table.id}>
                            <Card sx={{ borderLeft: `8px solid ${palette[NOTE_TYPE_TO_PALETTE_ROLE['table']]}` }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" component="div">
                                                {table.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                {table.description || 'No description'}
                                            </Typography>
                                            {table.experiment && (
                                                <Chip
                                                    icon={<ExperimentIcon />}
                                                    label={table.experiment.name}
                                                    size="small"
                                                    sx={{ mt: 1, background: palette[NOTE_TYPE_TO_PALETTE_ROLE['experiment']] }}
                                                />
                                            )}
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                {table.columns.length} columns • {table.rows.length} rows
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <IconButton size="small" onClick={() => handleOpenViewDialog(table)}>
                                                <ViewIcon />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleOpenTableDialog(table)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDeleteTable(table.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<AddIcon />}
                                            onClick={() => handleOpenRowDialog(table)}
                                        >
                                            Add Row
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<ViewIcon />}
                                            onClick={() => handleOpenViewDialog(table)}
                                        >
                                            View Data
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Create/Edit Table Dialog */}
            <Dialog open={openTableDialog} onClose={handleCloseTableDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingTable ? 'Edit Table' : 'Create New Table'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Table Name"
                            value={tableFormData.name}
                            onChange={(e) => setTableFormData({ ...tableFormData, name: e.target.value })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />

                        <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={2}
                            value={tableFormData.description}
                            onChange={(e) => setTableFormData({ ...tableFormData, description: e.target.value })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Experiment (Optional)</InputLabel>
                            <Select
                                value={tableFormData.experimentId}
                                label="Experiment (Optional)"
                                onChange={(e) => setTableFormData({ ...tableFormData, experimentId: e.target.value })}
                                disabled={saving}
                            >
                                <MenuItem value="">No Experiment</MenuItem>
                                {experiments.map((experiment) => (
                                    <MenuItem key={experiment.id} value={experiment.id}>
                                        {experiment.project?.name} - {experiment.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Typography variant="h6" gutterBottom>
                            Columns
                        </Typography>

                        {tableFormData.columns.map((column, index) => renderColumnEditor(column, index))}

                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={addColumn}
                            sx={{ mt: 1 }}
                            disabled={saving}
                        >
                            Add Column
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseTableDialog} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveTable}
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} /> : undefined}
                    >
                        {saving ? 'Saving...' : (editingTable ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Row Dialog */}
            <Dialog open={openRowDialog} onClose={handleCloseRowDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    Add Row to {viewingTable?.name}
                </DialogTitle>
                <DialogContent>
                    {viewingTable && (
                        <Box sx={{ pt: 1 }}>
                            {viewingTable.columns.map((column) => (
                                <Box key={column.id} sx={{ mb: 2 }}>
                                    {column.type === 'boolean' ? (
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={rowFormData[column.id] || false}
                                                    onChange={(e) => setRowFormData({
                                                        ...rowFormData,
                                                        [column.id]: e.target.checked
                                                    })}
                                                />
                                            }
                                            label={column.name}
                                        />
                                    ) : column.type === 'select' ? (
                                        <FormControl fullWidth>
                                            <InputLabel>{column.name}</InputLabel>
                                            <Select
                                                value={rowFormData[column.id] || ''}
                                                label={column.name}
                                                onChange={(e) => setRowFormData({
                                                    ...rowFormData,
                                                    [column.id]: e.target.value
                                                })}
                                            >
                                                {column.options?.map((option) => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    ) : column.type === 'date' ? (
                                        <TextField
                                            fullWidth
                                            label={column.name}
                                            type="date"
                                            value={rowFormData[column.id] || ''}
                                            onChange={(e) => setRowFormData({
                                                ...rowFormData,
                                                [column.id]: e.target.value
                                            })}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    ) : (
                                        <TextField
                                            fullWidth
                                            label={column.name}
                                            type={column.type === 'number' ? 'number' : 'text'}
                                            value={rowFormData[column.id] || ''}
                                            onChange={(e) => setRowFormData({
                                                ...rowFormData,
                                                [column.id]: e.target.value
                                            })}
                                            required={column.required}
                                        />
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseRowDialog} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveRow}
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} /> : undefined}
                    >
                        {saving ? 'Saving...' : 'Add Row'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Table Dialog */}
            <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="lg" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TableIcon />
                        {viewingTable?.name}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {viewingTable && (
                        <Box sx={{ pt: 1 }}>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                {viewingTable.description || 'No description'}
                            </Typography>

                            {viewingTable.rows.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                                    No data yet. Add your first row to get started.
                                </Typography>
                            ) : (
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                {viewingTable.columns.map((column) => (
                                                    <TableCell key={column.id}>
                                                        {column.name}
                                                        {column.required && <span style={{ color: 'red' }}> *</span>}
                                                    </TableCell>
                                                ))}
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {viewingTable.rows.map((row) => (
                                                <TableRow key={row.id}>
                                                    {viewingTable.columns.map((column) => (
                                                        <TableCell key={column.id}>
                                                            {renderCellValue(row.data[column.id], column)}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteRow(viewingTable.id, row.id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseViewDialog}>Close</Button>
                    <Button
                        onClick={() => {
                            handleCloseViewDialog();
                            if (viewingTable) handleOpenRowDialog(viewingTable);
                        }}
                        variant="contained"
                    >
                        Add Row
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
        </Box>
    );
};

export default Tables; 