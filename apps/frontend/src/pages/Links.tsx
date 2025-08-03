import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Tooltip,
    Grid,
    Card,
    CardContent,
    CardActions,
    Alert,
    Snackbar,
    CircularProgress,
    Divider,
    Tabs,
    Tab,
    Badge,
    Autocomplete
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Link as LinkIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
    Visibility as ViewIcon,
    LinkOff as UnlinkIcon,
    TrendingUp as TrendingUpIcon,
    Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { linksApi } from '../services/api';

interface Link {
    id: string;
    sourceType: string;
    sourceId: string;
    targetType: string;
    targetId: string;
    createdAt: string;
    source?: {
        id: string;
        title?: string;
        name?: string;
        type?: string;
        text?: string;
        page?: number;
        pdf?: {
            id: string;
            title: string;
        };
    };
    target?: {
        id: string;
        title?: string;
        name?: string;
        type?: string;
        text?: string;
        page?: number;
        pdf?: {
            id: string;
            title: string;
        };
    };
}

interface LinkFormData {
    sourceType: string;
    sourceId: string;
    targetType: string;
    targetId: string;
}

const Links: React.FC = () => {
    const navigate = useNavigate();
    const [links, setLinks] = useState<Link[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<Link | null>(null);
    const [formData, setFormData] = useState<LinkFormData>({
        sourceType: '',
        sourceId: '',
        targetType: '',
        targetId: ''
    });
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info';
    }>({ open: false, message: '', severity: 'info' });
    const [activeTab, setActiveTab] = useState(0);
    const [filterType, setFilterType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [dateFilter, setDateFilter] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

    const linkTypes = [
        { value: 'note', label: 'Note', color: '#2196F3' },
        { value: 'highlight', label: 'PDF Highlight', color: '#FF9800' },
        { value: 'databaseEntry', label: 'Database Entry', color: '#4CAF50' },
        { value: 'project', label: 'Project', color: '#9C27B0' },
        { value: 'experiment', label: 'Experiment', color: '#F44336' },
        { value: 'protocol', label: 'Protocol', color: '#00BCD4' },
        { value: 'recipe', label: 'Recipe', color: '#795548' },
        { value: 'task', label: 'Task', color: '#607D8B' },
        { value: 'literatureNote', label: 'Literature Note', color: '#E91E63' }
    ];

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            setLoading(true);
            const response = await linksApi.getAll();
            setLinks(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching links:', err);
            setError('Failed to fetch links');
            setSnackbar({
                open: true,
                message: 'Failed to fetch links',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLink = () => {
        setEditingLink(null);
        setFormData({
            sourceType: '',
            sourceId: '',
            targetType: '',
            targetId: ''
        });
        setDialogOpen(true);
    };

    const handleEditLink = (link: Link) => {
        setEditingLink(link);
        setFormData({
            sourceType: link.sourceType,
            sourceId: link.sourceId,
            targetType: link.targetType,
            targetId: link.targetId
        });
        setDialogOpen(true);
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
                severity: 'success'
            });
            fetchLinks();
        } catch (err) {
            console.error('Error deleting link:', err);
            setSnackbar({
                open: true,
                message: 'Failed to delete link',
                severity: 'error'
            });
        }
    };

    const handleSubmit = async () => {
        // Validate form data
        if (!formData.sourceType || !formData.sourceId || !formData.targetType || !formData.targetId) {
            setSnackbar({
                open: true,
                message: 'Please fill in all required fields',
                severity: 'error'
            });
            return;
        }

        try {
            if (editingLink) {
                // Since update is not supported, delete and recreate
                await linksApi.delete(editingLink.id);
                await linksApi.create(formData);
                setSnackbar({
                    open: true,
                    message: 'Link updated successfully',
                    severity: 'success'
                });
            } else {
                await linksApi.create(formData);
                setSnackbar({
                    open: true,
                    message: 'Link created successfully',
                    severity: 'success'
                });
            }
            setDialogOpen(false);
            fetchLinks();
        } catch (err) {
            console.error('Error saving link:', err);
            setSnackbar({
                open: true,
                message: 'Failed to save link',
                severity: 'error'
            });
        }
    };

    const getDisplayName = (item: any, type: string) => {
        if (!item) return 'Unknown';

        switch (type) {
            case 'note':
                return item.title || 'Untitled Note';
            case 'highlight':
                return `${item.pdf?.title || 'PDF'} - Page ${item.page}`;
            case 'databaseEntry':
                return item.name || 'Unnamed Entry';
            case 'project':
                return item.name || 'Untitled Project';
            case 'experiment':
                return item.name || 'Untitled Experiment';
            case 'protocol':
                return item.name || 'Untitled Protocol';
            case 'recipe':
                return item.name || 'Untitled Recipe';
            case 'task':
                return item.title || 'Untitled Task';
            case 'literatureNote':
                return item.title || 'Untitled Literature Note';
            default:
                return 'Unknown';
        }
    };

    const getTypeColor = (type: string) => {
        const typeConfig = linkTypes.find(t => t.value === type);
        return typeConfig?.color || '#757575';
    };

    const filteredLinks = links.filter(link => {
        // Filter by type
        if (filterType !== 'all' && link.sourceType !== filterType && link.targetType !== filterType) {
            return false;
        }

        // Filter by search query
        if (searchQuery) {
            const sourceName = getDisplayName(link.source, link.sourceType).toLowerCase();
            const targetName = getDisplayName(link.target, link.targetType).toLowerCase();
            const query = searchQuery.toLowerCase();
            if (!sourceName.includes(query) && !targetName.includes(query)) {
                return false;
            }
        }

        // Filter by date
        if (dateFilter) {
            const linkDate = new Date(link.createdAt);
            const filterDate = new Date(dateFilter);
            if (linkDate.toDateString() !== filterDate.toDateString()) {
                return false;
            }
        }

        return true;
    });

    const renderTableView = () => (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Source</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Target</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredLinks.map((link) => (
                        <TableRow key={link.id} hover>
                            <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Chip
                                        label={getDisplayName(link.source, link.sourceType)}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        clickable
                                        onClick={() => {
                                            // Navigate to source item based on type
                                            if (link.sourceType === 'note') {
                                                navigate(`/notes/${link.sourceId}`);
                                            } else if (link.sourceType === 'project') {
                                                navigate(`/projects/${link.sourceId}`);
                                            } else if (link.sourceType === 'protocol') {
                                                navigate(`/protocols/${link.sourceId}`);
                                            } else if (link.sourceType === 'recipe') {
                                                navigate(`/recipes/${link.sourceId}`);
                                            } else if (link.sourceType === 'pdf') {
                                                navigate(`/pdfs/${link.sourceId}`);
                                            } else if (link.sourceType === 'table') {
                                                navigate(`/tables/${link.sourceId}`);
                                            } else if (link.sourceType === 'experiment') {
                                                navigate(`/experiments/${link.sourceId}`);
                                            } else if (link.sourceType === 'literatureNote') {
                                                navigate(`/literature/${link.sourceId}`);
                                            } else if (link.sourceType === 'highlight') {
                                                navigate(`/pdfs/${link.sourceId}`);
                                            } else if (link.sourceType === 'databaseEntry') {
                                                navigate(`/database/${link.sourceId}`);
                                            } else if (link.sourceType === 'task') {
                                                navigate(`/tasks/${link.sourceId}`);
                                            } else {
                                                console.warn('Unknown source type for navigation:', link.sourceType);
                                            }
                                        }}
                                    />
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={link.sourceType}
                                    size="small"
                                    style={{ backgroundColor: getTypeColor(link.sourceType), color: 'white' }}
                                />
                            </TableCell>
                            <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <LinkIcon fontSize="small" color="action" />
                                    <Chip
                                        label={getDisplayName(link.target, link.targetType)}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                        clickable
                                        onClick={() => {
                                            // Navigate to target item based on type
                                            if (link.targetType === 'note') {
                                                navigate(`/notes/${link.targetId}`);
                                            } else if (link.targetType === 'project') {
                                                navigate(`/projects/${link.targetId}`);
                                            } else if (link.targetType === 'protocol') {
                                                navigate(`/protocols/${link.targetId}`);
                                            } else if (link.targetType === 'recipe') {
                                                navigate(`/recipes/${link.targetId}`);
                                            } else if (link.targetType === 'pdf') {
                                                navigate(`/pdfs/${link.targetId}`);
                                            } else if (link.targetType === 'table') {
                                                navigate(`/tables/${link.targetId}`);
                                            } else if (link.targetType === 'experiment') {
                                                navigate(`/experiments/${link.targetId}`);
                                            } else if (link.targetType === 'literatureNote') {
                                                navigate(`/literature/${link.targetId}`);
                                            } else if (link.targetType === 'highlight') {
                                                navigate(`/pdfs/${link.targetId}`);
                                            } else if (link.targetType === 'databaseEntry') {
                                                navigate(`/database/${link.targetId}`);
                                            } else if (link.targetType === 'task') {
                                                navigate(`/tasks/${link.targetId}`);
                                            } else {
                                                console.warn('Unknown target type for navigation:', link.targetType);
                                            }
                                        }}
                                    />
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={link.targetType}
                                    size="small"
                                    style={{ backgroundColor: getTypeColor(link.targetType), color: 'white' }}
                                />
                            </TableCell>
                            <TableCell>
                                {new Date(link.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                                <Tooltip title="Edit Link">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEditLink(link)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Link">
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteLink(link.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    const renderCardView = () => (
        <Grid container spacing={2}>
            {filteredLinks.map((link) => (
                <Grid item xs={12} sm={6} md={4} key={link.id}>
                    <Card
                        sx={{
                            height: '100%',
                            '&:hover': { boxShadow: 4 }
                        }}
                    >
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Chip
                                    label={link.sourceType}
                                    size="small"
                                    style={{ backgroundColor: getTypeColor(link.sourceType), color: 'white' }}
                                />
                                <LinkIcon fontSize="small" color="action" />
                                <Chip
                                    label={link.targetType}
                                    size="small"
                                    style={{ backgroundColor: getTypeColor(link.targetType), color: 'white' }}
                                />
                            </Box>

                            <Typography variant="subtitle2" gutterBottom>
                                Source
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    mb: 2,
                                    cursor: 'pointer',
                                    '&:hover': { color: 'primary.main', textDecoration: 'underline' }
                                }}
                                onClick={() => {
                                    // Navigate to source item based on type
                                    if (link.sourceType === 'note') {
                                        navigate(`/notes/${link.sourceId}`);
                                    } else if (link.sourceType === 'project') {
                                        navigate(`/projects/${link.sourceId}`);
                                    } else if (link.sourceType === 'protocol') {
                                        navigate(`/protocols/${link.sourceId}`);
                                    } else if (link.sourceType === 'recipe') {
                                        navigate(`/recipes/${link.sourceId}`);
                                    } else if (link.sourceType === 'pdf') {
                                        navigate(`/pdfs/${link.sourceId}`);
                                    } else if (link.sourceType === 'table') {
                                        navigate(`/tables/${link.sourceId}`);
                                    } else if (link.sourceType === 'experiment') {
                                        navigate(`/experiments/${link.sourceId}`);
                                    } else if (link.sourceType === 'literatureNote') {
                                        navigate(`/literature/${link.sourceId}`);
                                    } else if (link.sourceType === 'highlight') {
                                        navigate(`/pdfs/${link.sourceId}`);
                                    } else if (link.sourceType === 'databaseEntry') {
                                        navigate(`/database/${link.sourceId}`);
                                    } else if (link.sourceType === 'task') {
                                        navigate(`/tasks/${link.sourceId}`);
                                    } else {
                                        console.warn('Unknown source type for navigation:', link.sourceType);
                                    }
                                }}
                            >
                                {getDisplayName(link.source, link.sourceType)}
                            </Typography>

                            <Typography variant="subtitle2" gutterBottom>
                                Target
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    mb: 2,
                                    cursor: 'pointer',
                                    '&:hover': { color: 'primary.main', textDecoration: 'underline' }
                                }}
                                onClick={() => {
                                    // Navigate to target item based on type
                                    if (link.targetType === 'note') {
                                        navigate(`/notes/${link.targetId}`);
                                    } else if (link.targetType === 'project') {
                                        navigate(`/projects/${link.targetId}`);
                                    } else if (link.targetType === 'protocol') {
                                        navigate(`/protocols/${link.targetId}`);
                                    } else if (link.targetType === 'recipe') {
                                        navigate(`/recipes/${link.targetId}`);
                                    } else if (link.targetType === 'pdf') {
                                        navigate(`/pdfs/${link.targetId}`);
                                    } else if (link.targetType === 'table') {
                                        navigate(`/tables/${link.targetId}`);
                                    } else if (link.targetType === 'experiment') {
                                        navigate(`/experiments/${link.targetId}`);
                                    } else if (link.targetType === 'literatureNote') {
                                        navigate(`/literature/${link.targetId}`);
                                    } else if (link.targetType === 'highlight') {
                                        navigate(`/pdfs/${link.targetId}`);
                                    } else if (link.targetType === 'databaseEntry') {
                                        navigate(`/database/${link.targetId}`);
                                    } else if (link.targetType === 'task') {
                                        navigate(`/tasks/${link.targetId}`);
                                    } else {
                                        console.warn('Unknown target type for navigation:', link.targetType);
                                    }
                                }}
                            >
                                {getDisplayName(link.target, link.targetType)}
                            </Typography>

                            <Typography variant="caption" color="text.secondary">
                                Created: {new Date(link.createdAt).toLocaleDateString()}
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Tooltip title="Edit Link">
                                <IconButton
                                    size="small"
                                    onClick={() => handleEditLink(link)}
                                >
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Link">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteLink(link.id)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        </CardActions>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );

    const getTabContent = () => {
        switch (activeTab) {
            case 0: // All Links
                return viewMode === 'table' ? renderTableView() : renderCardView();

            case 1: // Link Statistics
                const linkStats = {
                    total: links.length,
                    byType: links.reduce((acc, link) => {
                        acc[link.sourceType] = (acc[link.sourceType] || 0) + 1;
                        acc[link.targetType] = (acc[link.targetType] || 0) + 1;
                        return acc;
                    }, {} as { [key: string]: number }),
                    recent: links.filter(link => {
                        const linkDate = new Date(link.createdAt);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return linkDate > weekAgo;
                    }).length,
                    byDay: links.reduce((acc, link) => {
                        const date = new Date(link.createdAt).toDateString();
                        acc[date] = (acc[date] || 0) + 1;
                        return acc;
                    }, {} as { [key: string]: number })
                };

                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <LinkIcon color="primary" />
                                        <Typography variant="h6" gutterBottom>
                                            Total Links
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" color="primary">
                                        {linkStats.total}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <TrendingUpIcon color="secondary" />
                                        <Typography variant="h6" gutterBottom>
                                            Recent Links (7 days)
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" color="secondary">
                                        {linkStats.recent}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Link Types Distribution
                                    </Typography>
                                    <Box display="flex" flexWrap="wrap" gap={1}>
                                        {Object.entries(linkStats.byType).map(([type, count]) => (
                                            <Chip
                                                key={type}
                                                label={`${type}: ${count}`}
                                                size="small"
                                                style={{ backgroundColor: getTypeColor(type), color: 'white' }}
                                            />
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Recent Activity
                                    </Typography>
                                    <Box display="flex" flexWrap="wrap" gap={1}>
                                        {Object.entries(linkStats.byDay)
                                            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                                            .slice(0, 10)
                                            .map(([date, count]) => (
                                                <Chip
                                                    key={date}
                                                    label={`${new Date(date).toLocaleDateString()}: ${count}`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" component="h1">
                        Links Management
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateLink}
                    >
                        Create Link
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Filters */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth>
                                <InputLabel>Filter by Type</InputLabel>
                                <Select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    label="Filter by Type"
                                >
                                    <MenuItem value="all">All Types</MenuItem>
                                    {linkTypes.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <DatePicker
                                label="Filter by Date"
                                value={dateFilter}
                                onChange={(date) => setDateFilter(date)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth>
                                <InputLabel>View Mode</InputLabel>
                                <Select
                                    value={viewMode}
                                    onChange={(e) => setViewMode(e.target.value as 'table' | 'cards')}
                                    label="View Mode"
                                >
                                    <MenuItem value="table">Table View</MenuItem>
                                    <MenuItem value="cards">Card View</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={fetchLinks}
                                fullWidth
                            >
                                Refresh
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                        <Tab
                            label={
                                <Box display="flex" alignItems="center" gap={1}>
                                    <LinkIcon />
                                    All Links
                                    {links.length > 0 && (
                                        <Badge badgeContent={links.length} color="primary" />
                                    )}
                                </Box>
                            }
                        />
                        <Tab
                            label={
                                <Box display="flex" alignItems="center" gap={1}>
                                    <AnalyticsIcon />
                                    Statistics
                                </Box>
                            }
                        />
                    </Tabs>
                </Box>

                {/* Tab Content */}
                {getTabContent()}

                {filteredLinks.length === 0 && !loading && (
                    <Box textAlign="center" py={4}>
                        <UnlinkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            No links found
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {searchQuery || filterType !== 'all' || dateFilter
                                ? 'Try adjusting your filters'
                                : 'Create your first link to get started'
                            }
                        </Typography>
                    </Box>
                )}

                {/* Create/Edit Dialog */}
                <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>
                        {editingLink ? 'Edit Link' : 'Create New Link'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Source Type</InputLabel>
                                    <Select
                                        value={formData.sourceType}
                                        onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                                        label="Source Type"
                                    >
                                        {linkTypes.map((type) => (
                                            <MenuItem key={type.value} value={type.value}>
                                                {type.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Source ID"
                                    value={formData.sourceId}
                                    onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                                    helperText="Enter the ID of the source item"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Target Type</InputLabel>
                                    <Select
                                        value={formData.targetType}
                                        onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                                        label="Target Type"
                                    >
                                        {linkTypes.map((type) => (
                                            <MenuItem key={type.value} value={type.value}>
                                                {type.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Target ID"
                                    value={formData.targetId}
                                    onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                                    helperText="Enter the ID of the target item"
                                    required
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={!formData.sourceType || !formData.sourceId || !formData.targetType || !formData.targetId}
                        >
                            {editingLink ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar */}
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
        </LocalizationProvider>
    );
};

export default Links; 