import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Chip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Snackbar,
    Divider,
    Paper,
} from '@mui/material';
import {
    Link as LinkIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Note as NoteIcon,
    Science as ScienceIcon,
    PictureAsPdf as PdfIcon,
    Storage as DatabaseIcon,
    Highlight as HighlightIcon,
} from '@mui/icons-material';
import { linksApi, notesApi, projectsApi, pdfsApi, databaseApi } from '../../services/api';

interface Link {
    id: string;
    sourceType: string;
    sourceId: string;
    targetType: string;
    targetId: string;
    createdAt: string;
    source?: any;
    target?: any;
}

interface LinkManagerProps {
    entityType: string;
    entityId: string;
    open: boolean;
    onClose: () => void;
}

const LinkManager: React.FC<LinkManagerProps> = ({ entityType, entityId, open, onClose }) => {
    const [links, setLinks] = useState<Link[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedTarget, setSelectedTarget] = useState<any>(null);
    const [targetType, setTargetType] = useState<string>('note');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Load links when dialog opens
    useEffect(() => {
        if (open && entityId) {
            loadLinks();
        }
    }, [open, entityId]);

    const loadLinks = async () => {
        try {
            setLoading(true);
            const [backlinksRes, outgoingRes] = await Promise.allSettled([
                linksApi.getBacklinks(entityType, entityId),
                linksApi.getOutgoing(entityType, entityId),
            ]);

            const allLinks: Link[] = [];

            if (backlinksRes.status === 'fulfilled') {
                allLinks.push(...(backlinksRes.value.data || []));
            }

            if (outgoingRes.status === 'fulfilled') {
                allLinks.push(...(outgoingRes.value.data || []));
            }

            setLinks(allLinks);
        } catch (err: any) {
            console.error('Error loading links:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const searchPromises = [];

            // Search notes
            if (targetType === 'all' || targetType === 'note') {
                searchPromises.push(
                    notesApi.getAll({ limit: 5 }).then(response => {
                        const notes = response.data.notes || response.data || [];
                        return notes.filter((note: any) =>
                            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()))
                        ).map((note: any) => ({ ...note, type: 'note' }));
                    })
                );
            }

            // Search projects
            if (targetType === 'all' || targetType === 'project') {
                searchPromises.push(
                    projectsApi.getAll().then(response => {
                        const projects = response.data || [];
                        return projects.filter((project: any) =>
                            project.name.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((project: any) => ({ ...project, type: 'project' }));
                    })
                );
            }

            // Search PDFs
            if (targetType === 'all' || targetType === 'pdf') {
                searchPromises.push(
                    pdfsApi.getAll({ limit: 5 }).then(response => {
                        const pdfs = response.data.pdfs || response.data || [];
                        return pdfs.filter((pdf: any) =>
                            pdf.title.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((pdf: any) => ({ ...pdf, type: 'pdf' }));
                    })
                );
            }

            // Search database
            if (targetType === 'all' || targetType === 'database') {
                searchPromises.push(
                    databaseApi.search(searchQuery, { limit: 5 }).then(response => {
                        const entries = response.data.entries || response.data || [];
                        return entries.map((entry: any) => ({ ...entry, type: 'database' }));
                    })
                );
            }

            const results = await Promise.allSettled(searchPromises);
            const allResults: any[] = [];

            results.forEach((result) => {
                if (result.status === 'fulfilled') {
                    allResults.push(...result.value);
                }
            });

            setSearchResults(allResults);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        }
    };

    const handleCreateLink = async () => {
        if (!selectedTarget) {
            setSnackbar({
                open: true,
                message: 'Please select a target item',
                severity: 'error',
            });
            return;
        }

        try {
            setSaving(true);
            await linksApi.create({
                sourceType: entityType,
                sourceId: entityId,
                targetType: selectedTarget.type,
                targetId: selectedTarget.id,
            });

            setSnackbar({
                open: true,
                message: 'Link created successfully',
                severity: 'success',
            });

            setOpenCreateDialog(false);
            setSelectedTarget(null);
            setSearchQuery('');
            setSearchResults([]);
            loadLinks();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to create link',
                severity: 'error',
            });
            console.error('Error creating link:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLink = async (linkId: string) => {
        if (!window.confirm('Are you sure you want to delete this link?')) {
            return;
        }

        try {
            await linksApi.delete(linkId);
            setSnackbar({
                open: true,
                message: 'Link deleted successfully',
                severity: 'success',
            });
            loadLinks();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to delete link',
                severity: 'error',
            });
            console.error('Error deleting link:', err);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'note':
                return <NoteIcon />;
            case 'project':
                return <ScienceIcon />;
            case 'pdf':
                return <PdfIcon />;
            case 'database':
                return <DatabaseIcon />;
            case 'highlight':
                return <HighlightIcon />;
            default:
                return <LinkIcon />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'note':
                return 'primary';
            case 'project':
                return 'success';
            case 'pdf':
                return 'error';
            case 'database':
                return 'secondary';
            case 'highlight':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getEntityTitle = (entity: any) => {
        return entity.title || entity.name || 'Untitled';
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Manage Links</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenCreateDialog(true)}
                        >
                            Add Link
                        </Button>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                Connected Items ({links.length})
                            </Typography>

                            {links.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                    No links yet. Click "Add Link" to connect this item to others.
                                </Typography>
                            ) : (
                                <List>
                                    {links.map((link, index) => (
                                        <React.Fragment key={link.id}>
                                            <ListItem>
                                                <ListItemIcon>
                                                    {getTypeIcon(link.targetType)}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {getEntityTitle(link.target || link)}
                                                            </Typography>
                                                            <Chip
                                                                label={link.targetType}
                                                                size="small"
                                                                color={getTypeColor(link.targetType)}
                                                            />
                                                        </Box>
                                                    }
                                                    secondary={`Linked on ${new Date(link.createdAt).toLocaleDateString()}`}
                                                />
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteLink(link.id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItem>
                                            {index < links.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Create Link Dialog */}
            <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Link</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Target Type</InputLabel>
                            <Select
                                value={targetType}
                                label="Target Type"
                                onChange={(e) => setTargetType(e.target.value)}
                            >
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="note">Notes</MenuItem>
                                <MenuItem value="project">Projects</MenuItem>
                                <MenuItem value="pdf">PDFs</MenuItem>
                                <MenuItem value="database">Database</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Search for items to link"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{ mb: 2 }}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />

                        <Button
                            variant="outlined"
                            onClick={handleSearch}
                            sx={{ mb: 2 }}
                        >
                            Search
                        </Button>

                        {searchResults.length > 0 && (
                            <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
                                <List dense>
                                    {searchResults.map((result) => (
                                        <ListItem
                                            key={result.id}
                                            button
                                            selected={selectedTarget?.id === result.id}
                                            onClick={() => setSelectedTarget(result)}
                                        >
                                            <ListItemIcon>
                                                {getTypeIcon(result.type)}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="body2">
                                                            {getEntityTitle(result)}
                                                        </Typography>
                                                        <Chip
                                                            label={result.type}
                                                            size="small"
                                                            color={getTypeColor(result.type)}
                                                        />
                                                    </Box>
                                                }
                                                secondary={result.description || result.content}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreateDialog(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateLink}
                        variant="contained"
                        disabled={saving || !selectedTarget}
                        startIcon={saving ? <CircularProgress size={16} /> : undefined}
                    >
                        {saving ? 'Creating...' : 'Create Link'}
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
        </>
    );
};

export default LinkManager; 