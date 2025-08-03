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
    InputAdornment,
    Switch,
    Tooltip,
    Badge,
    Fab,
    Drawer,
    AppBar,
    Toolbar,
    LinearProgress,
    CardActions,
    CardMedia,
    Avatar,
    ListItemAvatar,
    ListItemIcon,
    Collapse,
    AlertTitle,
    Rating,
    Skeleton
} from '@mui/material';
import {
    Search as SearchIcon,
    ExpandMore as ExpandMoreIcon,
    Save as SaveIcon,
    History as HistoryIcon,
    Clear as ClearIcon,
    FilterList as FilterIcon,
    Bookmark as BookmarkIcon,
    Delete as DeleteIcon,
    Tune as TuneIcon,
    Sort as SortIcon,
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
    Download as DownloadIcon,
    Share as ShareIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon,
    AccessTime as AccessTimeIcon,
    Category as CategoryIcon,
    Tag as TagIcon,
    CalendarToday as CalendarIcon,
    Person as PersonIcon,
    Science as ScienceIcon,
    Note as NoteIcon,
    Storage as DatabaseIcon,
    PictureAsPdf as PdfIcon,
    Assignment as TaskIcon,
    Restaurant as RecipeIcon,
    Book as LiteratureIcon,
    TrendingUp as TrendingUpIcon,
    FilterAlt as FilterAltIcon,
    SearchOff as SearchOffIcon,
    AutoAwesome as AutoAwesomeIcon,
    Analytics as AnalyticsIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { searchApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface SearchResult {
    id: string;
    type: string;
    title: string;
    content: string;
    project?: string;
    createdAt: string;
    score?: number;
    tags?: string[];
    status?: string;
    priority?: string;
    author?: string;
    category?: string;
    metadata?: any;
}

interface SavedSearch {
    id: string;
    name: string;
    description?: string;
    searchQuery: string;
    createdAt: string;
    usageCount?: number;
    isPublic?: boolean;
}

interface SearchHistory {
    id: string;
    query: string;
    timestamp: string;
    resultCount?: number;
}

interface SearchFilters {
    types: string[];
    dateRange: {
        startDate: Date | null;
        endDate: Date | null;
    };
    status: string[];
    priority: string[];
    tags: string[];
    categories: string[];
    authors: string[];
    projects: string[];
    sortBy: 'relevance' | 'date' | 'name' | 'type' | 'priority' | 'status';
    sortOrder: 'asc' | 'desc';
    limit: number;
    includeArchived: boolean;
    exactMatch: boolean;
    caseSensitive: boolean;
    minScore: number;
    groupResults: boolean;
}

interface SearchCluster {
    name: string;
    type: string;
    results: SearchResult[];
    count: number;
    color: string;
}

interface SearchAnalytics {
    totalSearches: number;
    popularQueries: { query: string; count: number }[];
    searchTrends: { date: string; count: number }[];
    resultTypes: { type: string; count: number }[];
    averageResults: number;
    mostSearchedTags: { tag: string; count: number }[];
}

interface AdvancedSearchProps {
    onResultSelect?: (result: SearchResult) => void;
    initialQuery?: string;
    showDrawer?: boolean;
    onClose?: () => void;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
    onResultSelect,
    initialQuery = '',
    showDrawer = false,
    onClose
}) => {
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
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'clustered'>('list');
    const [selectedResults, setSelectedResults] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        types: [],
        dateRange: { startDate: null, endDate: null },
        status: [],
        priority: [],
        tags: [],
        categories: [],
        authors: [],
        projects: [],
        sortBy: 'relevance',
        sortOrder: 'desc',
        limit: 50,
        includeArchived: false,
        exactMatch: false,
        caseSensitive: false,
        minScore: 0,
        groupResults: false
    });
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    // Enhanced features state
    const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalytics>({
        totalSearches: 0,
        popularQueries: [],
        searchTrends: [],
        resultTypes: [],
        averageResults: 0,
        mostSearchedTags: []
    });
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [clusteredResults, setClusteredResults] = useState<SearchCluster[]>([]);

    // Available search types
    const searchTypes = [
        { value: 'projects', label: 'Projects', icon: <ScienceIcon />, color: 'primary' },
        { value: 'experiments', label: 'Experiments', icon: <ScienceIcon />, color: 'secondary' },
        { value: 'notes', label: 'Notes', icon: <NoteIcon />, color: 'info' },
        { value: 'database', label: 'Database', icon: <DatabaseIcon />, color: 'warning' },
        { value: 'literature', label: 'Literature', icon: <LiteratureIcon />, color: 'error' },
        { value: 'protocols', label: 'Protocols', icon: <ScienceIcon />, color: 'success' },
        { value: 'recipes', label: 'Recipes', icon: <RecipeIcon />, color: 'info' },
        { value: 'tasks', label: 'Tasks', icon: <TaskIcon />, color: 'warning' },
        { value: 'pdfs', label: 'PDFs', icon: <PdfIcon />, color: 'error' }
    ];

    // Available statuses
    const statusOptions = [
        'active', 'completed', 'pending', 'cancelled', 'archived', 'draft', 'published'
    ];

    // Available priorities
    const priorityOptions = [
        'low', 'medium', 'high', 'urgent', 'critical'
    ];

    // Load saved searches and history on mount
    useEffect(() => {
        loadSavedSearches();
        loadSearchHistory();
    }, []);

    // Load suggestions when query changes
    useEffect(() => {
        if (searchQuery.length >= 2) {
            loadSuggestions();
        } else {
            setSuggestions([]);
        }
    }, [searchQuery]);

    const loadSavedSearches = async () => {
        try {
            const response = await searchApi.getSaved();
            setSavedSearches(response.data);
        } catch (error) {
            console.error('Failed to load saved searches:', error);
        }
    };

    const loadSearchHistory = async () => {
        try {
            const response = await searchApi.getHistory();
            setSearchHistory(response.data);
        } catch (error) {
            console.error('Failed to load search history:', error);
        }
    };

    const loadSuggestions = async () => {
        try {
            const response = await searchApi.getSuggestions(searchQuery);
            setSuggestions(response.data.map((s: any) => s.text));
        } catch (error) {
            console.error('Failed to load suggestions:', error);
        }
    };

    const loadSearchAnalytics = async () => {
        try {
            const response = await searchApi.getSearchAnalytics();
            setSearchAnalytics(response.data);
        } catch (error) {
            console.error('Failed to load search analytics:', error);
        }
    };

    const groupResultsByType = (results: SearchResult[]): SearchCluster[] => {
        const clusters: { [key: string]: SearchResult[] } = {};

        results.forEach(result => {
            if (!clusters[result.type]) {
                clusters[result.type] = [];
            }
            clusters[result.type].push(result);
        });

        return Object.entries(clusters).map(([type, typeResults]) => ({
            name: type.charAt(0).toUpperCase() + type.slice(1),
            type,
            results: typeResults,
            count: typeResults.length,
            color: getTypeColor(type)
        }));
    };

    const saveSearchHistory = async (searchQuery: string, searchFilters: SearchFilters) => {
        try {
            await searchApi.saveSearchHistory({
                query: searchQuery,
                filters: searchFilters,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to save search history:', error);
        }
    };

    const performSearch = async (query?: string, searchFilters?: SearchFilters) => {
        const searchParams = {
            query: query || searchQuery,
            types: searchFilters?.types || filters.types,
            dateRange: searchFilters?.dateRange || filters.dateRange,
            status: searchFilters?.status || filters.status,
            priority: searchFilters?.priority || filters.priority,
            tags: searchFilters?.tags || filters.tags,
            categories: searchFilters?.categories || filters.categories,
            authors: searchFilters?.authors || filters.authors,
            projects: searchFilters?.projects || filters.projects,
            sortBy: searchFilters?.sortBy || filters.sortBy,
            sortOrder: searchFilters?.sortOrder || filters.sortOrder,
            limit: searchFilters?.limit || filters.limit,
            includeArchived: searchFilters?.includeArchived || filters.includeArchived,
            exactMatch: searchFilters?.exactMatch || filters.exactMatch,
            caseSensitive: searchFilters?.caseSensitive || filters.caseSensitive
        };

        try {
            setLoading(true);
            const response = await searchApi.advanced(searchParams);

            // Flatten and transform results
            const allResults: SearchResult[] = [];

            Object.entries(response.data).forEach(([type, items]: [string, any]) => {
                if (Array.isArray(items) && type !== 'totalResults' && type !== 'searchTime') {
                    items.forEach((item: any) => {
                        allResults.push({
                            id: item.id,
                            type,
                            title: item.title || item.name,
                            content: item.content || item.description || '',
                            project: item.project?.name || item.experiment?.project?.name,
                            createdAt: item.createdAt,
                            score: item.score,
                            tags: item.tags ? (typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags) : [],
                            status: item.status,
                            priority: item.priority,
                            author: item.author || item.user?.name,
                            category: item.category,
                            metadata: item.metadata
                        });
                    });
                }
            });

            setResults(allResults);

            // Enhanced features: clustering and analytics
            if (filters.groupResults) {
                setClusteredResults(groupResultsByType(allResults));
            }

            // Save search history
            await saveSearchHistory(query || searchQuery, searchFilters || filters);

            setShowSuggestions(false);
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
        if (searchQuery.trim()) {
            performSearch();
        }
    };

    const handleSaveSearch = async () => {
        if (!saveSearchName.trim()) {
            setSnackbar({
                open: true,
                message: 'Please enter a name for the saved search.',
                severity: 'error'
            });
            return;
        }

        try {
            const searchParams = {
                query: searchQuery,
                types: filters.types,
                dateRange: filters.dateRange,
                status: filters.status,
                priority: filters.priority,
                tags: filters.tags,
                categories: filters.categories,
                authors: filters.authors,
                projects: filters.projects,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                limit: filters.limit,
                includeArchived: filters.includeArchived,
                exactMatch: filters.exactMatch,
                caseSensitive: filters.caseSensitive
            };

            await searchApi.save({
                name: saveSearchName,
                description: saveSearchDescription,
                searchQuery: searchParams
            });

            setSaveDialogOpen(false);
            setSaveSearchName('');
            setSaveSearchDescription('');
            loadSavedSearches();

            setSnackbar({
                open: true,
                message: 'Search saved successfully!',
                severity: 'success'
            });
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
                types: searchParams.types || [],
                dateRange: searchParams.dateRange || { startDate: null, endDate: null },
                status: searchParams.status || [],
                priority: searchParams.priority || [],
                tags: searchParams.tags || [],
                categories: searchParams.categories || [],
                authors: searchParams.authors || [],
                projects: searchParams.projects || [],
                sortBy: searchParams.sortBy || 'relevance',
                sortOrder: searchParams.sortOrder || 'desc',
                limit: searchParams.limit || 50,
                includeArchived: searchParams.includeArchived || false,
                exactMatch: searchParams.exactMatch || false,
                caseSensitive: searchParams.caseSensitive || false
            }));

            if (searchParams.query) {
                performSearch(searchParams.query, searchParams);
            }
        } catch (error) {
            console.error('Failed to load saved search:', error);
            setSnackbar({
                open: true,
                message: 'Failed to load saved search.',
                severity: 'error'
            });
        }
    };

    const handleDeleteSavedSearch = async (id: string) => {
        try {
            await searchApi.deleteSaved(id);
            loadSavedSearches();
            setSnackbar({
                open: true,
                message: 'Saved search deleted successfully!',
                severity: 'success'
            });
        } catch (error) {
            console.error('Failed to delete saved search:', error);
            setSnackbar({
                open: true,
                message: 'Failed to delete saved search.',
                severity: 'error'
            });
        }
    };

    const handleClearFilters = () => {
        setFilters({
            types: [],
            dateRange: { startDate: null, endDate: null },
            status: [],
            priority: [],
            tags: [],
            categories: [],
            authors: [],
            projects: [],
            sortBy: 'relevance',
            sortOrder: 'desc',
            limit: 50,
            includeArchived: false,
            exactMatch: false,
            caseSensitive: false,
            minScore: 0,
            groupResults: false
        });
    };

    const handleClearHistory = async () => {
        try {
            await searchApi.clearHistory();
            setSearchHistory([]);
            setSnackbar({
                open: true,
                message: 'Search history cleared successfully!',
                severity: 'success'
            });
        } catch (error) {
            console.error('Failed to clear search history:', error);
            setSnackbar({
                open: true,
                message: 'Failed to clear search history.',
                severity: 'error'
            });
        }
    };

    const handleExportResults = () => {
        const csvContent = [
            ['Type', 'Title', 'Content', 'Project', 'Created At', 'Status', 'Priority', 'Tags'].join(','),
            ...results.map(result => [
                result.type,
                `"${result.title}"`,
                `"${result.content.replace(/"/g, '""')}"`,
                `"${result.project || ''}"`,
                result.createdAt,
                result.status || '',
                result.priority || '',
                `"${(result.tags || []).join('; ')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `search_results_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const getTypeIcon = (type: string) => {
        const typeConfig = searchTypes.find(t => t.value === type);
        return typeConfig?.icon || <NoteIcon />;
    };

    const getTypeColor = (type: string) => {
        const typeConfig = searchTypes.find(t => t.value === type);
        return typeConfig?.color || 'default';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const handleResultSelect = (result: SearchResult) => {
        if (onResultSelect) {
            onResultSelect(result);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setSearchQuery(suggestion);
        setShowSuggestions(false);
        performSearch(suggestion);
    };

    const toggleResultSelection = (resultId: string) => {
        setSelectedResults(prev =>
            prev.includes(resultId)
                ? prev.filter(id => id !== resultId)
                : [...prev, resultId]
        );
    };

    const renderSearchFilters = () => (
        <Accordion expanded={showAdvanced} onChange={() => setShowAdvanced(!showAdvanced)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                    <FilterAltIcon />
                    <Typography>Advanced Filters</Typography>
                    {Object.values(filters).some(v =>
                        Array.isArray(v) ? v.length > 0 : v !== null && v !== false && v !== 'relevance' && v !== 'desc' && v !== 50
                    ) && (
                            <Badge badgeContent="!" color="error" />
                        )}
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Grid container spacing={2}>
                    {/* Search Types */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                            Search Types
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {searchTypes.map(type => (
                                <FormControlLabel
                                    key={type.value}
                                    control={
                                        <Checkbox
                                            checked={filters.types.includes(type.value)}
                                            onChange={(e) => {
                                                setFilters(prev => ({
                                                    ...prev,
                                                    types: e.target.checked
                                                        ? [...prev.types, type.value]
                                                        : prev.types.filter(t => t !== type.value)
                                                }));
                                            }}
                                            size="small"
                                        />
                                    }
                                    label={
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            {type.icon}
                                            {type.label}
                                        </Box>
                                    }
                                />
                            ))}
                        </Box>
                    </Grid>

                    {/* Date Range */}
                    <Grid item xs={12} md={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Start Date"
                                value={filters.dateRange.startDate}
                                onChange={(date) => setFilters(prev => ({
                                    ...prev,
                                    dateRange: { ...prev.dateRange, startDate: date }
                                }))}
                                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="End Date"
                                value={filters.dateRange.endDate}
                                onChange={(date) => setFilters(prev => ({
                                    ...prev,
                                    dateRange: { ...prev.dateRange, endDate: date }
                                }))}
                                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                            />
                        </LocalizationProvider>
                    </Grid>

                    {/* Status and Priority */}
                    <Grid item xs={12} md={6}>
                        <Autocomplete
                            multiple
                            options={statusOptions}
                            value={filters.status}
                            onChange={(_, value) => setFilters(prev => ({ ...prev, status: value }))}
                            renderInput={(params) => (
                                <TextField {...params} label="Status" size="small" />
                            )}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        label={option}
                                        size="small"
                                        {...getTagProps({ index })}
                                    />
                                ))
                            }
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Autocomplete
                            multiple
                            options={priorityOptions}
                            value={filters.priority}
                            onChange={(_, value) => setFilters(prev => ({ ...prev, priority: value }))}
                            renderInput={(params) => (
                                <TextField {...params} label="Priority" size="small" />
                            )}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        label={option}
                                        size="small"
                                        {...getTagProps({ index })}
                                    />
                                ))
                            }
                        />
                    </Grid>

                    {/* Tags and Categories */}
                    <Grid item xs={12} md={6}>
                        <Autocomplete
                            multiple
                            freeSolo
                            options={[]}
                            value={filters.tags}
                            onChange={(_, value) => setFilters(prev => ({ ...prev, tags: value }))}
                            renderInput={(params) => (
                                <TextField {...params} label="Tags" size="small" />
                            )}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        label={option}
                                        size="small"
                                        {...getTagProps({ index })}
                                    />
                                ))
                            }
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Autocomplete
                            multiple
                            freeSolo
                            options={[]}
                            value={filters.categories}
                            onChange={(_, value) => setFilters(prev => ({ ...prev, categories: value }))}
                            renderInput={(params) => (
                                <TextField {...params} label="Categories" size="small" />
                            )}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        label={option}
                                        size="small"
                                        {...getTagProps({ index })}
                                    />
                                ))
                            }
                        />
                    </Grid>

                    {/* Sort Options */}
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={filters.sortBy}
                                label="Sort By"
                                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                            >
                                <MenuItem value="relevance">Relevance</MenuItem>
                                <MenuItem value="date">Date</MenuItem>
                                <MenuItem value="name">Name</MenuItem>
                                <MenuItem value="type">Type</MenuItem>
                                <MenuItem value="priority">Priority</MenuItem>
                                <MenuItem value="status">Status</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Sort Order</InputLabel>
                            <Select
                                value={filters.sortOrder}
                                label="Sort Order"
                                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                            >
                                <MenuItem value="desc">Descending</MenuItem>
                                <MenuItem value="asc">Ascending</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Search Options */}
                    <Grid item xs={12}>
                        <Box display="flex" gap={2} flexWrap="wrap">
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={filters.includeArchived}
                                        onChange={(e) => setFilters(prev => ({ ...prev, includeArchived: e.target.checked }))}
                                    />
                                }
                                label="Include Archived"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={filters.exactMatch}
                                        onChange={(e) => setFilters(prev => ({ ...prev, exactMatch: e.target.checked }))}
                                    />
                                }
                                label="Exact Match"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={filters.caseSensitive}
                                        onChange={(e) => setFilters(prev => ({ ...prev, caseSensitive: e.target.checked }))}
                                    />
                                }
                                label="Case Sensitive"
                            />
                        </Box>
                    </Grid>

                    {/* Clear Filters Button */}
                    <Grid item xs={12}>
                        <Button
                            variant="outlined"
                            onClick={handleClearFilters}
                            startIcon={<ClearIcon />}
                            size="small"
                        >
                            Clear All Filters
                        </Button>
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    );

    const renderSearchResults = () => (
        <Box>
            {loading && <LinearProgress />}

            {results.length > 0 && (
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                        {results.length} results found
                    </Typography>
                    <Box display="flex" gap={1}>
                        <Tooltip title="List View">
                            <IconButton
                                size="small"
                                onClick={() => setViewMode('list')}
                                color={viewMode === 'list' ? 'primary' : 'default'}
                            >
                                <ViewListIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Grid View">
                            <IconButton
                                size="small"
                                onClick={() => setViewMode('grid')}
                                color={viewMode === 'grid' ? 'primary' : 'default'}
                            >
                                <ViewModuleIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Clustered View">
                            <IconButton
                                size="small"
                                onClick={() => setViewMode('clustered')}
                                color={viewMode === 'clustered' ? 'primary' : 'default'}
                            >
                                <CategoryIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Export Results">
                            <IconButton size="small" onClick={handleExportResults}>
                                <DownloadIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            )}

            {viewMode === 'list' ? (
                <List>
                    {results.map((result) => (
                        <ListItem
                            key={`${result.type}-${result.id}`}
                            button
                            onClick={() => handleResultSelect(result)}
                            selected={selectedResults.includes(result.id)}
                        >
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: `${getTypeColor(result.type)}.main` }}>
                                    {getTypeIcon(result.type)}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="subtitle1" component="span">
                                            {result.title}
                                        </Typography>
                                        <Chip
                                            label={result.type}
                                            size="small"
                                            color={getTypeColor(result.type) as any}
                                        />
                                        {result.status && (
                                            <Chip
                                                label={result.status}
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                        {result.priority && (
                                            <Chip
                                                label={result.priority}
                                                size="small"
                                                variant="outlined"
                                                color={result.priority === 'high' ? 'error' : 'default'}
                                            />
                                        )}
                                    </Box>
                                }
                                secondary={
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {result.content.substring(0, 200)}
                                            {result.content.length > 200 && '...'}
                                        </Typography>
                                        <Box display="flex" gap={1} mt={1}>
                                            {result.project && (
                                                <Chip
                                                    label={result.project}
                                                    size="small"
                                                    variant="outlined"
                                                    icon={<ScienceIcon />}
                                                />
                                            )}
                                            <Chip
                                                label={formatDate(result.createdAt)}
                                                size="small"
                                                variant="outlined"
                                                icon={<CalendarIcon />}
                                            />
                                            {result.tags && result.tags.length > 0 && (
                                                <Chip
                                                    label={`${result.tags.length} tags`}
                                                    size="small"
                                                    variant="outlined"
                                                    icon={<TagIcon />}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                }
                            />
                            <ListItemSecondaryAction>
                                <IconButton
                                    edge="end"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleResultSelection(result.id);
                                    }}
                                >
                                    {selectedResults.includes(result.id) ? <StarIcon /> : <StarBorderIcon />}
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Grid container spacing={2}>
                    {results.map((result) => (
                        <Grid item xs={12} sm={6} md={4} key={`${result.type}-${result.id}`}>
                            <Card
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': { boxShadow: 4 },
                                    border: selectedResults.includes(result.id) ? 2 : 1,
                                    borderColor: selectedResults.includes(result.id) ? 'primary.main' : 'divider'
                                }}
                                onClick={() => handleResultSelect(result)}
                            >
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                        <Avatar sx={{ bgcolor: `${getTypeColor(result.type)}.main`, width: 32, height: 32 }}>
                                            {getTypeIcon(result.type)}
                                        </Avatar>
                                        <Typography variant="h6" noWrap>
                                            {result.title}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {result.content.substring(0, 100)}
                                        {result.content.length > 100 && '...'}
                                    </Typography>
                                    <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                                        <Chip
                                            label={result.type}
                                            size="small"
                                            color={getTypeColor(result.type) as any}
                                        />
                                        {result.status && (
                                            <Chip
                                                label={result.status}
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                        {result.priority && (
                                            <Chip
                                                label={result.priority}
                                                size="small"
                                                variant="outlined"
                                                color={result.priority === 'high' ? 'error' : 'default'}
                                            />
                                        )}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatDate(result.createdAt)}
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleResultSelection(result.id);
                                        }}
                                    >
                                        {selectedResults.includes(result.id) ? <StarIcon /> : <StarBorderIcon />}
                                    </IconButton>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {viewMode === 'clustered' && (
                <Grid container spacing={2}>
                    {clusteredResults.map((cluster) => (
                        <Grid item xs={12} key={cluster.type}>
                            <Card>
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                        <Avatar sx={{ bgcolor: cluster.color }}>
                                            {getTypeIcon(cluster.type)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6">
                                                {cluster.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {cluster.count} results
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <List dense>
                                        {cluster.results.slice(0, 5).map((result) => (
                                            <ListItem
                                                key={result.id}
                                                button
                                                onClick={() => handleResultSelect(result)}
                                            >
                                                <ListItemIcon>
                                                    {getTypeIcon(result.type)}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={result.title}
                                                    secondary={
                                                        <Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {result.content.substring(0, 100)}...
                                                            </Typography>
                                                            <Box display="flex" gap={1} mt={1}>
                                                                {result.tags?.slice(0, 2).map((tag) => (
                                                                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                    {cluster.results.length > 5 && (
                                        <Box textAlign="center" mt={2}>
                                            <Typography variant="body2" color="text.secondary">
                                                +{cluster.results.length - 5} more results
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {results.length === 0 && !loading && searchQuery && (
                <Box textAlign="center" py={4}>
                    <SearchOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        No results found
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Try adjusting your search terms or filters
                    </Typography>
                </Box>
            )}
        </Box>
    );

    const renderSavedSearches = () => (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Saved Searches</Typography>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSaveDialogOpen(true)}
                    startIcon={<SaveIcon />}
                >
                    Save Current Search
                </Button>
            </Box>

            {savedSearches.length === 0 ? (
                <Box textAlign="center" py={4}>
                    <BookmarkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        No saved searches
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Save your frequently used searches for quick access
                    </Typography>
                </Box>
            ) : (
                <List>
                    {savedSearches.map((savedSearch) => (
                        <ListItem key={savedSearch.id}>
                            <ListItemText
                                primary={savedSearch.name}
                                secondary={
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {savedSearch.description}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Created: {formatDate(savedSearch.createdAt)}
                                            {savedSearch.usageCount && ` • Used ${savedSearch.usageCount} times`}
                                        </Typography>
                                    </Box>
                                }
                            />
                            <ListItemSecondaryAction>
                                <IconButton
                                    onClick={() => handleLoadSavedSearch(savedSearch)}
                                    size="small"
                                >
                                    <SearchIcon />
                                </IconButton>
                                <IconButton
                                    onClick={() => handleDeleteSavedSearch(savedSearch.id)}
                                    size="small"
                                    color="error"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );

    const renderSearchHistory = () => (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Search History</Typography>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClearHistory}
                    startIcon={<ClearIcon />}
                >
                    Clear History
                </Button>
            </Box>

            {searchHistory.length === 0 ? (
                <Box textAlign="center" py={4}>
                    <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        No search history
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Your recent searches will appear here
                    </Typography>
                </Box>
            ) : (
                <List>
                    {searchHistory.map((history) => (
                        <ListItem key={history.id} button onClick={() => {
                            try {
                                const searchParams = JSON.parse(history.query);
                                setSearchQuery(searchParams.query || '');
                                if (searchParams.query) {
                                    performSearch(searchParams.query, searchParams);
                                }
                            } catch (error) {
                                console.error('Failed to load search history:', error);
                            }
                        }}>
                            <ListItemIcon>
                                <AccessTimeIcon />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography variant="body2" noWrap>
                                        {JSON.parse(history.query).query || 'Advanced search'}
                                    </Typography>
                                }
                                secondary={formatDate(history.timestamp)}
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );

    const renderSearchAnalytics = () => (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Search Analytics</Typography>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={loadSearchAnalytics}
                    startIcon={<RefreshIcon />}
                >
                    Refresh
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Overview Stats */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Overview</Typography>
                            <Box display="flex" justifyContent="space-between" mb={2}>
                                <Typography>Total Searches:</Typography>
                                <Typography variant="h6">{searchAnalytics.totalSearches}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" mb={2}>
                                <Typography>Average Results:</Typography>
                                <Typography variant="h6">{searchAnalytics.averageResults.toFixed(1)}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Popular Queries */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Popular Queries</Typography>
                            {searchAnalytics.popularQueries.slice(0, 5).map((query, index) => (
                                <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                                        {query.query}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {query.count}
                                    </Typography>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Result Types */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Result Types</Typography>
                            {searchAnalytics.resultTypes.map((type, index) => (
                                <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2">
                                        {type.type}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {type.count}
                                    </Typography>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Popular Tags */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Popular Tags</Typography>
                            {searchAnalytics.mostSearchedTags.slice(0, 5).map((tag, index) => (
                                <Chip
                                    key={index}
                                    label={`${tag.tag} (${tag.count})`}
                                    size="small"
                                    sx={{ mr: 1, mb: 1 }}
                                />
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );

    const content = (
        <Box sx={{ p: 2 }}>
            {/* Search Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Advanced Search
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Search across all your research data with powerful filters and saved searches
                </Typography>
            </Box>

            {/* Search Input */}
            <Box sx={{ mb: 2 }}>
                <Box sx={{ position: 'relative' }}>
                    <TextField
                        fullWidth
                        placeholder="Search across projects, experiments, notes, database, literature, protocols, recipes, tasks, PDFs..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        color={showAdvanced ? 'primary' : 'default'}
                                    >
                                        <TuneIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        size="medium"
                    />

                    {/* Search Suggestions */}
                    {showSuggestions && suggestions.length > 0 && (
                        <Paper
                            sx={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 1000,
                                mt: 1,
                                maxHeight: 200,
                                overflow: 'auto'
                            }}
                        >
                            <List>
                                {suggestions.map((suggestion, index) => (
                                    <ListItem
                                        key={index}
                                        button
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        <ListItemIcon>
                                            <SearchIcon />
                                        </ListItemIcon>
                                        <ListItemText primary={suggestion} />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                        variant="contained"
                        onClick={handleSearch}
                        disabled={!searchQuery.trim()}
                        startIcon={<SearchIcon />}
                    >
                        Search
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => setSaveDialogOpen(true)}
                        startIcon={<SaveIcon />}
                    >
                        Save Search
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handleClearFilters}
                        startIcon={<ClearIcon />}
                    >
                        Clear
                    </Button>
                </Box>
            </Box>

            {/* Advanced Filters */}
            {renderSearchFilters()}

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                    <Tab
                        label={
                            <Box display="flex" alignItems="center" gap={1}>
                                <SearchIcon />
                                Results
                                {results.length > 0 && (
                                    <Badge badgeContent={results.length} color="primary" />
                                )}
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box display="flex" alignItems="center" gap={1}>
                                <BookmarkIcon />
                                Saved Searches
                                {savedSearches.length > 0 && (
                                    <Badge badgeContent={savedSearches.length} color="secondary" />
                                )}
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box display="flex" alignItems="center" gap={1}>
                                <HistoryIcon />
                                History
                                {searchHistory.length > 0 && (
                                    <Badge badgeContent={searchHistory.length} color="info" />
                                )}
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box display="flex" alignItems="center" gap={1}>
                                <AnalyticsIcon />
                                Analytics
                            </Box>
                        }
                    />
                </Tabs>
            </Box>

            {/* Tab Content */}
            {activeTab === 0 && renderSearchResults()}
            {activeTab === 1 && renderSavedSearches()}
            {activeTab === 2 && renderSearchHistory()}
            {activeTab === 3 && renderSearchAnalytics()}
        </Box>
    );

    // Save Search Dialog
    const saveDialog = (
        <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Save Search</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="Search Name"
                    value={saveSearchName}
                    onChange={(e) => setSaveSearchName(e.target.value)}
                    sx={{ mb: 2, mt: 1 }}
                    placeholder="e.g., High Priority Tasks, Recent Literature"
                />
                <TextField
                    fullWidth
                    label="Description (Optional)"
                    value={saveSearchDescription}
                    onChange={(e) => setSaveSearchDescription(e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Describe what this search is for..."
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveSearch} variant="contained">Save Search</Button>
            </DialogActions>
        </Dialog>
    );

    // Snackbar
    const snackbarComponent = (
        <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
            <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                {snackbar.message}
            </Alert>
        </Snackbar>
    );

    if (showDrawer) {
        return (
            <>
                <Drawer
                    anchor="right"
                    open={showDrawer}
                    onClose={onClose}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: 600,
                            maxWidth: '90vw'
                        }
                    }}
                >
                    <AppBar position="static" elevation={0}>
                        <Toolbar>
                            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                                Advanced Search
                            </Typography>
                            <IconButton onClick={onClose}>
                                <ClearIcon />
                            </IconButton>
                        </Toolbar>
                    </AppBar>
                    {content}
                </Drawer>
                {saveDialog}
                {snackbarComponent}
            </>
        );
    }

    return (
        <Box>
            {content}
            {saveDialog}
            {snackbarComponent}
        </Box>
    );
};

export default AdvancedSearch; 