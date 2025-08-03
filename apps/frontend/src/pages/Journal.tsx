import React, { useState, useEffect, useCallback } from 'react';
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Snackbar,
    Tabs,
    Tab,
    Paper,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Fab,
    Tooltip,
    Badge,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Note as NoteIcon,
    Link as LinkIcon,
    Today as TodayIcon,
    Science as ScienceIcon,
    Book as BookIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    CalendarToday as CalendarIcon,
    AccessTime as TimeIcon,
} from '@mui/icons-material';
import { notesApi } from '../services/api';
import LinkManager from '../components/Links/LinkManager';

interface Note {
    id: string;
    title: string;
    content: string;
    type: 'daily' | 'experiment' | 'literature';
    date: string;
    createdAt: string;
    experimentId?: string;
    links?: any[];
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`journal-tabpanel-${index}`}
            aria-labelledby={`journal-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
        </div>
    );
}

const Journal: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [saving, setSaving] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [openLinkManager, setOpenLinkManager] = useState(false);
    const [selectedNoteId, setSelectedNoteId] = useState<string>('');

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'daily' as 'daily' | 'experiment' | 'literature',
        date: new Date().toISOString().split('T')[0],
    });

    // Load notes on component mount
    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = useCallback(async () => {
        try {
            setLoading(true);
            const response = await notesApi.getAll();
            setNotes(response.data.notes || response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load notes');
            console.error('Error loading notes:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleOpenDialog = (note?: Note, type?: 'daily' | 'experiment' | 'literature') => {
        if (note) {
            setEditingNote(note);
            setFormData({
                title: note.title,
                content: note.content,
                type: note.type,
                date: note.date,
            });
        } else {
            setEditingNote(null);
            setFormData({
                title: '',
                content: '',
                type: type || 'daily',
                date: new Date().toISOString().split('T')[0],
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingNote(null);
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            setSnackbar({
                open: true,
                message: 'Please fill in all required fields',
                severity: 'error',
            });
            return;
        }

        try {
            setSaving(true);
            if (editingNote) {
                await notesApi.update(editingNote.id, formData);
                setSnackbar({
                    open: true,
                    message: 'Note updated successfully',
                    severity: 'success',
                });
            } else {
                await notesApi.create(formData);
                setSnackbar({
                    open: true,
                    message: 'Note created successfully',
                    severity: 'success',
                });
            }
            handleCloseDialog();
            loadNotes();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to save note',
                severity: 'error',
            });
            console.error('Error saving note:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this note?')) {
            return;
        }

        try {
            await notesApi.delete(id);
            setSnackbar({
                open: true,
                message: 'Note deleted successfully',
                severity: 'success',
            });
            loadNotes();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to delete note',
                severity: 'error',
            });
            console.error('Error deleting note:', err);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'experiment':
                return 'primary';
            case 'literature':
                return 'secondary';
            case 'daily':
                return 'default';
            default:
                return 'default';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'experiment':
                return <ScienceIcon />;
            case 'literature':
                return <BookIcon />;
            case 'daily':
                return <TodayIcon />;
            default:
                return <NoteIcon />;
        }
    };

    const getFilteredNotes = () => {
        let filtered = notes;

        // Filter by tab
        const typeMap = ['daily', 'experiment', 'literature'];
        const selectedType = typeMap[tabValue];
        filtered = filtered.filter(note => note.type === selectedType);

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(note =>
                note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.content.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const getRecentNotes = (type: string, limit: number = 5) => {
        return notes
            .filter(note => note.type === type)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, limit);
    };

    const renderNoteCard = (note: Note) => (
        <Card key={note.id} sx={{ mb: 2, '&:hover': { boxShadow: 3 } }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                        {getTypeIcon(note.type)}
                        <Typography variant="h6" component="div" sx={{ ml: 1, flexGrow: 1 }}>
                            {note.title}
                        </Typography>
                    </Box>
                    <Box>
                        <Tooltip title="Manage Links">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setSelectedNoteId(note.id);
                                    setOpenLinkManager(true);
                                }}
                                sx={{ mr: 1 }}
                            >
                                <Badge badgeContent={note.links?.length || 0} color="primary">
                                    <LinkIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenDialog(note)}>
                                <EditIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(note.id)}>
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {note.content.length > 150
                        ? `${note.content.substring(0, 150)}...`
                        : note.content}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            label={note.type}
                            size="small"
                            color={getTypeColor(note.type)}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarIcon sx={{ fontSize: 12, mr: 0.5 }} />
                            {new Date(note.date).toLocaleDateString()}
                        </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimeIcon sx={{ fontSize: 12, mr: 0.5 }} />
                        {new Date(note.createdAt).toLocaleTimeString()}
                    </Typography>
                </Box>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Journal</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        size="small"
                        placeholder="Search notes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                        sx={{ width: 250 }}
                    />
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ width: '100%' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="journal tabs">
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TodayIcon />
                                Daily Notes
                                <Badge badgeContent={getRecentNotes('daily').length} color="primary" />
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ScienceIcon />
                                Experiments
                                <Badge badgeContent={getRecentNotes('experiment').length} color="primary" />
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BookIcon />
                                Literature
                                <Badge badgeContent={getRecentNotes('literature').length} color="primary" />
                            </Box>
                        }
                    />
                </Tabs>
            </Paper>

            <TabPanel value={tabValue} index={0}>
                <Box sx={{ mb: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog(undefined, 'daily')}
                    >
                        New Daily Note
                    </Button>
                </Box>
                {getFilteredNotes().length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No daily notes yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Create your first daily note to track your lab activities
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {getFilteredNotes().map((note) => (
                            <Grid item xs={12} key={note.id}>
                                {renderNoteCard(note)}
                            </Grid>
                        ))}
                    </Grid>
                )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Box sx={{ mb: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog(undefined, 'experiment')}
                    >
                        New Experiment Note
                    </Button>
                </Box>
                {getFilteredNotes().length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No experiment notes yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Document your experiments with detailed notes
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {getFilteredNotes().map((note) => (
                            <Grid item xs={12} key={note.id}>
                                {renderNoteCard(note)}
                            </Grid>
                        ))}
                    </Grid>
                )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <Box sx={{ mb: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog(undefined, 'literature')}
                    >
                        New Literature Note
                    </Button>
                </Box>
                {getFilteredNotes().length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No literature notes yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Add notes about research papers and references
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {getFilteredNotes().map((note) => (
                            <Grid item xs={12} key={note.id}>
                                {renderNoteCard(note)}
                            </Grid>
                        ))}
                    </Grid>
                )}
            </TabPanel>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingNote ? 'Edit Note' : 'Create New Note'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={formData.type}
                                label="Type"
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                disabled={saving}
                            >
                                <MenuItem value="daily">Daily Note</MenuItem>
                                <MenuItem value="experiment">Experiment Note</MenuItem>
                                <MenuItem value="literature">Literature Note</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            sx={{ mb: 2 }}
                            InputLabelProps={{ shrink: true }}
                            disabled={saving}
                        />

                        <TextField
                            fullWidth
                            label="Content"
                            multiline
                            rows={8}
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            disabled={saving}
                            placeholder={
                                formData.type === 'daily'
                                    ? "Today's lab activities, observations, and plans..."
                                    : formData.type === 'experiment'
                                        ? "Experiment details, procedures, results, and conclusions..."
                                        : "Paper summary, key findings, methodology, and relevance to your research..."
                            }
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
                        {saving ? 'Saving...' : (editingNote ? 'Update' : 'Create')}
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

            {/* Link Manager */}
            <LinkManager
                entityType="note"
                entityId={selectedNoteId}
                open={openLinkManager}
                onClose={() => setOpenLinkManager(false)}
            />
        </Box>
    );
};

export default Journal; 