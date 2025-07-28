import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar,
    Divider,
    Paper,
    Tabs,
    Tab,
    Autocomplete,
    Slider,
    InputAdornment
} from '@mui/material';
import {
    Search as SearchIcon,
    ExpandMore as ExpandMoreIcon,
    Save as SaveIcon,
    History as HistoryIcon,
    Clear as ClearIcon,
    FilterList as FilterIcon,
    Bookmark as BookmarkIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface SearchResult {
    id: string;
    type: string;
    title: string;
    content: string;
    project?: string;
    createdAt: string;
    score?: number;
}

interface SavedSearch {
    id: string;
    name: string;
    description?: string;
    searchQuery: string;
    createdAt: string;
}

interface SearchHistory {
    id: string;
    query: string;
    timestamp: string;
}

interface AdvancedSearchProps {
    onResultSelect?: (result: SearchResult) => void;
    initialQuery?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ onResultSelect, initialQuery = '' }) => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [saveSearchName, setSaveSearchName] = useState('');
    const [saveSearchDescription, setSaveSearchDescription] = useState('');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    // Advanced search filters
    const [filters, setFilters] = useState({
        models: ['projects', 'experiments', 'notes', 'database', 'protocols', 'recipes', 'tasks'],
        dateRange: {
            startDate: null as Date | null,
            endDate: null as Date | null
        },
        projects: [] as string[],
        types: [] as string[],
        status: [] as string[],
        tags: [] as string[]
    });

    // Load saved searches and history
    useEffect(() => {
        loadSavedSearches();
        loadSearchHistory();
    }, []);

    const loadSavedSearches = async () => {
        try {
            const response = await api.get('/search/saved', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSavedSearches(response.data);
        } catch (error) {
            console.error('Failed to load saved searches:', error);
        }
    };

    const loadSearchHistory = async () => {
        try {
            const response = await api.get('/search/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSearchHistory(response.data);
        } catch (error) {
            console.error('Failed to load search history:', error);
        }
    };

    const performSearch = async (query?: string, searchFilters?: any) => {
        if (!query && !searchQuery) return;

        setLoading(true);
        try {
            const searchParams = {
                query: query || searchQuery,
                models: filters.models,
                dateRange: filters.dateRange.startDate || filters.dateRange.endDate ? {
                    startDate: filters.dateRange.startDate?.toISOString(),
                    endDate: filters.dateRange.endDate?.toISOString()
                } : undefined,
                projects: filters.projects.length > 0 ? filters.projects : undefined,
                types: filters.types.length > 0 ? filters.types : undefined,
                status: filters.status.length > 0 ? filters.status : undefined,
                tags: filters.tags.length > 0 ? filters.tags : undefined,
                ...searchFilters
            };

            const response = await api.post('/search', searchParams, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setResults(response.data.results || []);
        } catch (error) {
            console.error('Search failed:', error);
            setSnackbar({
                open: true,
                message: 'Search failed. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        performSearch();
    };

    const handleSaveSearch = async () => {
        if (!saveSearchName.trim()) return;

        try {
            const searchParams = {
                query: searchQuery,
                models: filters.models,
                dateRange: filters.dateRange.startDate || filters.dateRange.endDate ? {
                    startDate: filters.dateRange.startDate?.toISOString(),
                    endDate: filters.dateRange.endDate?.toISOString()
                } : undefined,
                projects: filters.projects.length > 0 ? filters.projects : undefined,
                types: filters.types.length > 0 ? filters.types : undefined,
                status: filters.status.length > 0 ? filters.status : undefined,
                tags: filters.tags.length > 0 ? filters.tags : undefined
            };

            await api.post('/search/saved', {
                name: saveSearchName,
                description: saveSearchDescription,
                searchQuery: JSON.stringify(searchParams)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSnackbar({
                open: true,
                message: 'Search saved successfully!',
                severity: 'success'
            });
            setSaveDialogOpen(false);
            setSaveSearchName('');
            setSaveSearchDescription('');
            loadSavedSearches();
        } catch (error) {
            console.error('Failed to save search:', error);
            setSnackbar({
                open: true,
                message: 'Failed to save search.',
                severity: 'error'
            });
        }
    };

    const handleLoadSavedSearch = async (savedSearch: SavedSearch) => {
        try {
            const searchParams = JSON.parse(savedSearch.searchQuery);
            setSearchQuery(searchParams.query || '');
            setFilters(prev => ({
                ...prev,
                models: searchParams.models || prev.models,
                dateRange: searchParams.dateRange ? {
                    startDate: searchParams.dateRange.startDate ? new Date(searchParams.dateRange.startDate) : null,
                    endDate: searchParams.dateRange.endDate ? new Date(searchParams.dateRange.endDate) : null
                } : prev.dateRange,
                projects: searchParams.projects || prev.projects,
                types: searchParams.types || prev.types,
                status: searchParams.status || prev.status,
                tags: searchParams.tags || prev.tags
            }));
            await performSearch(searchParams.query, searchParams);
        } catch (error) {
            console.error('Failed to load saved search:', error);
        }
    };

    const handleDeleteSavedSearch = async (id: string) => {
        try {
            await api.delete(`/search/saved/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSnackbar({
                open: true,
                message: 'Saved search deleted.',
                severity: 'success'
            });
            loadSavedSearches();
        } catch (error) {
            console.error('Failed to delete saved search:', error);
        }
    };

    const handleClearFilters = () => {
        setFilters({
            models: ['projects', 'experiments', 'notes', 'database', 'protocols', 'recipes', 'tasks'],
            dateRange: { startDate: null, endDate: null },
            projects: [],
            types: [],
            status: [],
            tags: []
        });
    };

    const getModelIcon = (type: string) => {
        switch (type) {
            case 'project': return '📁';
            case 'experiment': return '🧪';
            case 'note': return '📝';
            case 'database': return '🗄️';
            case 'protocol': return '📋';
            case 'recipe': return '📖';
            case 'task': return '✅';
            default: return '📄';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <Box sx={{ p: 2 }}>

            {/* Search Bar */}
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={8}>
                            <TextField
                                fullWidth
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search across all content..."
                                variant="outlined"
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleSearch}
                                    disabled={loading}
                                    startIcon={<SearchIcon />}
                                    fullWidth
                                >
                                    Search
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    startIcon={<FilterIcon />}
                                >
                                    Filters
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setSaveDialogOpen(true)}
                                    startIcon={<SaveIcon />}
                                >
                                    Save
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Advanced Filters */}
            {showAdvanced && (
                <Card sx={{ mb: 2 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Advanced Filters
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Search Models</InputLabel>
                                    <Select
                                        multiple
                                        value={filters.models}
                                        onChange={(e) => setFilters(prev => ({ ...prev, models: e.target.value as string[] }))}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip key={value} label={value} size="small" />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        <MenuItem value="projects">Projects</MenuItem>
                                        <MenuItem value="experiments">Experiments</MenuItem>
                                        <MenuItem value="notes">Notes</MenuItem>
                                        <MenuItem value="database">Database</MenuItem>
                                        <MenuItem value="protocols">Protocols</MenuItem>
                                        <MenuItem value="recipes">Recipes</MenuItem>
                                        <MenuItem value="tasks">Tasks</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <DatePicker
                                                label="Start Date"
                                                value={filters.dateRange.startDate}
                                                onChange={(date: Date | null) => setFilters(prev => ({ 
                                                    ...prev, 
                                                    dateRange: { ...prev.dateRange, startDate: date } 
                                                }))}
                                                slotProps={{ textField: { fullWidth: true } }}
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <DatePicker
                                                label="End Date"
                                                value={filters.dateRange.endDate}
                                                onChange={(date: Date | null) => setFilters(prev => ({ 
                                                    ...prev, 
                                                    dateRange: { ...prev.dateRange, endDate: date } 
                                                }))}
                                                slotProps={{ textField: { fullWidth: true } }}
                                            />
                                        </Grid>
                                    </Grid>
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    variant="outlined"
                                    onClick={handleClearFilters}
                                    startIcon={<ClearIcon />}
                                >
                                    Clear Filters
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Tabs for Results, Saved Searches, and History */}
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                <Tab label={`Results (${results.length})`} />
                <Tab label={`Saved Searches (${savedSearches.length})`} />
                <Tab label={`History (${searchHistory.length})`} />
            </Tabs>

            {/* Results Tab */}
            {activeTab === 0 && (
                <Box>
                    {loading && <Typography>Searching...</Typography>}
                    {!loading && results.length === 0 && searchQuery && (
                        <Typography color="textSecondary">No results found.</Typography>
                    )}
                    {results.map((result) => (
                        <Card key={result.id} sx={{ mb: 1, cursor: 'pointer' }} onClick={() => onResultSelect?.(result)}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="h6" sx={{ mr: 1 }}>
                                        {getModelIcon(result.type)}
                                    </Typography>
                                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                                        {result.title}
                                    </Typography>
                                    <Chip label={result.type} size="small" />
                                    {result.score && (
                                        <Chip label={`Score: ${result.score.toFixed(2)}`} size="small" color="primary" />
                                    )}
                                </Box>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                    {result.content.substring(0, 200)}...
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" color="textSecondary">
                                        {formatDate(result.createdAt)}
                                    </Typography>
                                    {result.project && (
                                        <Chip label={result.project} size="small" variant="outlined" />
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {/* Saved Searches Tab */}
            {activeTab === 1 && (
                <Box>
                    {savedSearches.map((savedSearch) => (
                        <Card key={savedSearch.id} sx={{ mb: 1 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="h6">{savedSearch.name}</Typography>
                                        {savedSearch.description && (
                                            <Typography variant="body2" color="textSecondary">
                                                {savedSearch.description}
                                            </Typography>
                                        )}
                                        <Typography variant="caption" color="textSecondary">
                                            {formatDate(savedSearch.createdAt)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <IconButton onClick={() => handleLoadSavedSearch(savedSearch)}>
                                            <SearchIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDeleteSavedSearch(savedSearch.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {/* History Tab */}
            {activeTab === 2 && (
                <Box>
                    {searchHistory.map((history) => (
                        <Card key={history.id} sx={{ mb: 1 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body1" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => {
                                        setSearchQuery(history.query);
                                        performSearch(history.query);
                                        setActiveTab(0);
                                    }}>
                                        {history.query}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {formatDate(history.timestamp)}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {/* Save Search Dialog */}
            <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
                <DialogTitle>Save Search</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Search Name"
                        value={saveSearchName}
                        onChange={(e) => setSaveSearchName(e.target.value)}
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <TextField
                        fullWidth
                        label="Description (optional)"
                        value={saveSearchDescription}
                        onChange={(e) => setSaveSearchDescription(e.target.value)}
                        multiline
                        rows={3}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveSearch} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdvancedSearch; 