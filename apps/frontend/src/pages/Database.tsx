import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Card,
    CardContent,
    Grid,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    InputAdornment,
    Tabs,
    Tab
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import { databaseApi } from '../services/api';
import DrawingInsertionToolbar from '../components/DrawingInsertionToolbar';
import { useDrawingInsertion } from '../hooks/useDrawingInsertion';

interface DatabaseEntry {
    id: string;
    name: string;
    type: string;
    description: string;
    properties: string;
    metadata: any;
    createdAt: string;
    relatedResearch?: string;
}

const Database: React.FC = () => {
    const [entries, setEntries] = useState<DatabaseEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingEntry, setEditingEntry] = useState<DatabaseEntry | null>(null);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const [formData, setFormData] = useState({
        name: '',
        type: 'CHEMICAL',
        description: '',
        properties: '',
        metadata: {
            synonyms: '',
            supplier: '',
            catalogNumber: '',
            molecularWeight: '',
            purity: '',
            storageConditions: '',
            hazards: '',
            notes: ''
        },
        relatedResearch: ''
    });

    const { insertDrawing } = useDrawingInsertion({
        entityId: editingEntry?.id || 'new',
        entityType: 'database',
        onContentUpdate: (newContent) => {
            setFormData(prev => ({ ...prev, description: (prev.description || '') + newContent }));
        }
    });

    const loadEntries = async () => {
        try {
            setLoading(true);
            const response = await databaseApi.getAll();
            // The backend returns { entries: [...], pagination: {...} }
            setEntries(response.data.entries || []);
        } catch (error) {
            setError('Failed to load database entries');
            console.error('Error loading entries:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEntries();
    }, []);

    const handleOpenDialog = (entry?: DatabaseEntry) => {
        if (entry) {
            setEditingEntry(entry);
            setFormData({
                name: entry.name,
                type: entry.type,
                description: entry.description,
                properties: entry.properties,
                metadata: entry.metadata || {},
                relatedResearch: entry.relatedResearch || ''
            });
        } else {
            setEditingEntry(null);
            setFormData({
                name: '',
                type: 'CHEMICAL',
                description: '',
                properties: '',
                metadata: {
                    synonyms: '',
                    supplier: '',
                    catalogNumber: '',
                    molecularWeight: '',
                    purity: '',
                    storageConditions: '',
                    hazards: '',
                    notes: ''
                },
                relatedResearch: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingEntry(null);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const data = {
                ...formData,
                properties: formData.properties || '{}'
            };

            if (editingEntry) {
                await databaseApi.update(editingEntry.id, data);
                setSnackbar({ open: true, message: 'Entry updated successfully', severity: 'success' });
            } else {
                await databaseApi.create(data);
                setSnackbar({ open: true, message: 'Entry created successfully', severity: 'success' });
            }

            handleCloseDialog();
            loadEntries();
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to save entry', severity: 'error' });
            console.error('Error saving entry:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await databaseApi.delete(id);
            setSnackbar({ open: true, message: 'Entry deleted successfully', severity: 'success' });
            loadEntries();
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to delete entry', severity: 'error' });
            console.error('Error deleting entry:', error);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const getTypeColor = (type: string) => {
        const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
            'CHEMICAL': 'primary',
            'GENE': 'secondary',
            'PROTOCOL': 'success',
            'ORGANISM': 'info'
        };
        return colors[type] || 'default';
    };

    const filteredEntries = entries.filter(entry => 
        entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const tabLabels = ['All', 'Chemical', 'Gene', 'Protocol', 'Organism'];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Database</Typography>
                <Box>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}>
                        {viewMode === 'grid' ? 'Table' : 'Grid'}
                    </Button>
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

            {/* Search */}
            <Box sx={{ mb: 3 }}>
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
            </Box>

            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
                {tabLabels.map((label, index) => (
                    <Tab key={label} label={label} />
                ))}
            </Tabs>

            {filteredEntries.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No entries found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create your first entry to get started
                    </Typography>
                </Box>
            ) : viewMode === 'grid' ? (
                <Grid container spacing={3}>
                    {filteredEntries.map((entry) => (
                        <Grid item xs={12} md={6} lg={4} key={entry.id}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box>
                                            <Typography variant="h6" gutterBottom>
                                                {entry.name}
                                            </Typography>
                                            <Chip
                                                label={entry.type.replace('_', ' ')}
                                                size="small"
                                                color={getTypeColor(entry.type)}
                                            />
                                        </Box>
                                        <Box>
                                            <IconButton size="small" onClick={() => handleOpenDialog(entry)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDelete(entry.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {entry.description?.substring(0, 100)}
                                        {entry.description && entry.description.length > 100 && '...'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Created: {new Date(entry.createdAt).toLocaleDateString()}
                                    </Typography>
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
                                <TableCell>Name</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredEntries.map((entry) => (
                                <TableRow key={entry.id}>
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
                                    <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
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
                                <MenuItem value="PROTOCOL">Protocol</MenuItem>
                                <MenuItem value="ORGANISM">Organism</MenuItem>
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

                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Description
                                </Typography>
                                <DrawingInsertionToolbar
                                    entityId={editingEntry?.id || 'new'}
                                    entityType="database"
                                    onInsertDrawing={insertDrawing}
                                    variant="button"
                                    size="small"
                                />
                            </Box>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                disabled={saving}
                            />
                        </Box>

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
                    >
                        {saving ? 'Saving...' : (editingEntry ? 'Update' : 'Create')}
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
        </Box>
    );
};

export default Database; 