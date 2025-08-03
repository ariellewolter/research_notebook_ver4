import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Link as LinkIcon,
    Science as ScienceIcon,
    Assignment as ProjectIcon,
    Build as ProtocolIcon,
    Restaurant as RecipeIcon,
    MenuBook as LiteratureIcon,
    Task as TaskIcon,
    PictureAsPdf as PdfIcon,
    Storage as DatabaseIcon,
    Description as NoteIcon
} from '@mui/icons-material';

export interface LinkableEntity {
    id: string;
    title: string;
    type: string;
    description?: string;
}

interface LinkCreatorProps {
    open: boolean;
    onClose: () => void;
    sourceType: string;
    sourceId: string;
    sourceTitle: string;
    onLinkCreated?: () => void;
}

const LinkCreator: React.FC<LinkCreatorProps> = ({
    open,
    onClose,
    sourceType,
    sourceId,
    sourceTitle,
    onLinkCreated
}) => {
    const [targetType, setTargetType] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<LinkableEntity[]>([]);
    const [selectedTarget, setSelectedTarget] = useState<LinkableEntity | null>(null);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string>('');

    const entityTypes = [
        { value: 'note', label: 'Note', icon: <NoteIcon /> },
        { value: 'experiment', label: 'Experiment', icon: <ScienceIcon /> },
        { value: 'project', label: 'Project', icon: <ProjectIcon /> },
        { value: 'protocol', label: 'Protocol', icon: <ProtocolIcon /> },
        { value: 'recipe', label: 'Recipe', icon: <RecipeIcon /> },
        { value: 'literature', label: 'Literature', icon: <LiteratureIcon /> },
        { value: 'task', label: 'Task', icon: <TaskIcon /> },
        { value: 'pdf', label: 'PDF', icon: <PdfIcon /> },
        { value: 'databaseEntry', label: 'Database Entry', icon: <DatabaseIcon /> }
    ];

    const getIconForType = (type: string) => {
        const entityType = entityTypes.find(t => t.value === type);
        return entityType?.icon || <LinkIcon />;
    };

    const getTypeLabel = (type: string) => {
        const entityType = entityTypes.find(t => t.value === type);
        return entityType?.label || type;
    };

    const searchEntities = async () => {
        if (!targetType || !searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        try {
            let url = '';
            switch (targetType) {
                case 'note':
                    url = `/api/notes?search=${encodeURIComponent(searchQuery)}`;
                    break;
                case 'experiment':
                    url = `/api/experiments?search=${encodeURIComponent(searchQuery)}`;
                    break;
                case 'project':
                    url = `/api/projects?search=${encodeURIComponent(searchQuery)}`;
                    break;
                case 'protocol':
                    url = `/api/protocols?search=${encodeURIComponent(searchQuery)}`;
                    break;
                case 'recipe':
                    url = `/api/recipes?search=${encodeURIComponent(searchQuery)}`;
                    break;
                case 'literature':
                    url = `/api/literature?search=${encodeURIComponent(searchQuery)}`;
                    break;
                case 'task':
                    url = `/api/tasks?search=${encodeURIComponent(searchQuery)}`;
                    break;
                case 'pdf':
                    url = `/api/pdfs?search=${encodeURIComponent(searchQuery)}`;
                    break;
                case 'databaseEntry':
                    url = `/api/database/search/${encodeURIComponent(searchQuery)}`;
                    break;
                default:
                    setSearchResults([]);
                    return;
            }

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                // Transform the data to match LinkableEntity interface
                const entities = (data.data || data || []).map((item: any) => ({
                    id: item.id,
                    title: item.title || item.name || item.name,
                    type: targetType,
                    description: item.description
                }));
                setSearchResults(entities);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Error searching entities:', error);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            setTargetType('');
            setSearchQuery('');
            setSearchResults([]);
            setSelectedTarget(null);
            setError('');
        }
    }, [open]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim()) {
                searchEntities();
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, targetType]);

    const handleCreateLink = async () => {
        if (!selectedTarget) {
            setError('Please select a target entity');
            return;
        }

        setCreating(true);
        setError('');

        try {
            const response = await fetch('/api/links', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceType,
                    sourceId,
                    targetType: selectedTarget.type,
                    targetId: selectedTarget.id
                })
            });

            if (response.ok) {
                onLinkCreated?.();
                onClose();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to create link');
            }
        } catch (error) {
            console.error('Error creating link:', error);
            setError('Failed to create link');
        } finally {
            setCreating(false);
        }
    };

    const handleClose = () => {
        onClose();
        setTargetType('');
        setSearchQuery('');
        setSearchResults([]);
        setSelectedTarget(null);
        setError('');
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinkIcon />
                    Create Link
                </Box>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        From: {sourceTitle} ({getTypeLabel(sourceType)})
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Target Type</InputLabel>
                        <Select
                            value={targetType}
                            onChange={(e) => setTargetType(e.target.value)}
                            label="Target Type"
                        >
                            {entityTypes.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {type.icon}
                                        {type.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {targetType && (
                        <TextField
                            fullWidth
                            placeholder={`Search ${getTypeLabel(targetType)}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            variant="outlined"
                            size="small"
                        />
                    )}
                </Box>

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                )}

                {searchResults.length > 0 && (
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Search Results ({searchResults.length})
                        </Typography>
                        {searchResults.map((entity) => (
                            <Box
                                key={entity.id}
                                sx={{
                                    p: 2,
                                    border: '1px solid',
                                    borderColor: selectedTarget?.id === entity.id ? 'primary.main' : 'grey.200',
                                    borderRadius: 1,
                                    mb: 1,
                                    cursor: 'pointer',
                                    bgcolor: selectedTarget?.id === entity.id ? 'primary.50' : 'transparent',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        bgcolor: 'grey.50'
                                    }
                                }}
                                onClick={() => setSelectedTarget(entity)}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    {getIconForType(entity.type)}
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        {entity.title}
                                    </Typography>
                                </Box>
                                {entity.description && (
                                    <Typography variant="body2" color="text.secondary">
                                        {entity.description}
                                    </Typography>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}

                {selectedTarget && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="success.main" gutterBottom>
                            Selected Target
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getIconForType(selectedTarget.type)}
                            <Typography variant="body1">
                                {selectedTarget.title}
                            </Typography>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    onClick={handleCreateLink}
                    variant="contained"
                    disabled={!selectedTarget || creating}
                    startIcon={creating ? <CircularProgress size={16} /> : <LinkIcon />}
                >
                    {creating ? 'Creating...' : 'Create Link'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LinkCreator; 