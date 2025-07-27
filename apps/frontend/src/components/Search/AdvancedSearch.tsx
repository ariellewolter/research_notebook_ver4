import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Divider,
    IconButton,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Badge
} from '@mui/material';
import {
    Search as SearchIcon,
    History as HistoryIcon,
    Clear as ClearIcon,
    FilterList as FilterIcon,
    Save as SaveIcon,
    Bookmark as BookmarkIcon,
    Note as NoteIcon,
    Folder as ProjectIcon,
    Science as ProtocolIcon,
    Restaurant as RecipeIcon,
    Storage as DatabaseIcon,
    PictureAsPdf as PdfIcon,
    TableChart as TableIcon,
    CheckBox as TaskIcon,
    Calculate as CalculatorIcon
} from '@mui/icons-material';

interface SearchResult {
    id: string;
    type: 'note' | 'project' | 'protocol' | 'recipe' | 'database' | 'pdf' | 'table' | 'task' | 'literature';
    title: string;
    description?: string;
    content?: string;
    date?: string;
    tags?: string[];
    score: number;
}

interface SavedSearch {
    id: string;
    name: string;
    query: string;
    filters: SearchFilters;
    createdAt: string;
}

interface SearchFilters {
    types: string[];
    dateRange: {
        start?: string;
        end?: string;
    };
    tags: string[];
    contentOnly: boolean;
}

interface AdvancedSearchProps {
    open: boolean;
    onClose: () => void;
    onSelectResult: (result: SearchResult) => void;
}

const entityTypes = [
    { key: 'note', label: 'Notes', icon: <NoteIcon /> },
    { key: 'project', label: 'Projects', icon: <ProjectIcon /> },
    { key: 'protocol', label: 'Protocols', icon: <ProtocolIcon /> },
    { key: 'recipe', label: 'Recipes', icon: <RecipeIcon /> },
    { key: 'database', label: 'Database', icon: <DatabaseIcon /> },
    { key: 'pdf', label: 'PDFs', icon: <PdfIcon /> },
    { key: 'table', label: 'Tables', icon: <TableIcon /> },
    { key: 'task', label: 'Tasks', icon: <TaskIcon /> },
    { key: 'literature', label: 'Literature', icon: <BookmarkIcon /> },
];

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ open, onClose, onSelectResult }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        types: [],
        dateRange: {},
        tags: [],
        contentOnly: false
    });
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load search history and saved searches from localStorage
    useEffect(() => {
        const history = localStorage.getItem('searchHistory');
        const saved = localStorage.getItem('savedSearches');
        
        if (history) {
            setSearchHistory(JSON.parse(history));
        }
        if (saved) {
            setSavedSearches(JSON.parse(saved));
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (query.trim()) {
            searchTimeoutRef.current = setTimeout(() => {
                performSearch();
            }, 500);
        } else {
            setResults([]);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [query, filters]);

    const performSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // Search across all entity types
            const searchPromises = entityTypes
                .filter(type => filters.types.length === 0 || filters.types.includes(type.key))
                .map(async (type) => {
                    try {
                        const response = await fetch(`/api/${type.key}/search?q=${encodeURIComponent(query)}&limit=10`);
                        if (response.ok) {
                            const data = await response.json();
                            return data.items?.map((item: any) => ({
                                id: item.id,
                                type: type.key as SearchResult['type'],
                                title: item.title || item.name || 'Untitled',
                                description: item.description || item.content?.substring(0, 100),
                                content: item.content,
                                date: item.createdAt || item.date,
                                tags: item.tags ? item.tags.split(',').map((t: string) => t.trim()) : [],
                                score: 1.0 // Simple scoring for now
                            })) || [];
                        }
                        return [];
                    } catch (err) {
                        console.warn(`Failed to search ${type.key}:`, err);
                        return [];
                    }
                });

            const allResults = await Promise.all(searchPromises);
            const flatResults = allResults.flat();

            // Apply additional filters
            let filteredResults = flatResults;

            if (filters.dateRange.start || filters.dateRange.end) {
                filteredResults = filteredResults.filter(result => {
                    if (!result.date) return true;
                    const resultDate = new Date(result.date);
                    const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
                    const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;
                    
                    if (startDate && resultDate < startDate) return false;
                    if (endDate && resultDate > endDate) return false;
                    return true;
                });
            }

            if (filters.tags.length > 0) {
                filteredResults = filteredResults.filter(result => 
                    result.tags?.some((tag: string) => filters.tags.includes(tag))
                );
            }

            if (filters.contentOnly) {
                filteredResults = filteredResults.filter(result => 
                    result.content && result.content.toLowerCase().includes(query.toLowerCase())
                );
            }

            // Sort by relevance (simple implementation)
            filteredResults.sort((a, b) => {
                const aScore = a.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 1;
                const bScore = b.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 1;
                return bScore - aScore;
            });

            setResults(filteredResults);

            // Update search history
            if (query.trim() && !searchHistory.includes(query.trim())) {
                const newHistory = [query.trim(), ...searchHistory.slice(0, 9)];
                setSearchHistory(newHistory);
                localStorage.setItem('searchHistory', JSON.stringify(newHistory));
            }

        } catch (err) {
            setError('Search failed. Please try again.');
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSearch = () => {
        const newSearch: SavedSearch = {
            id: Date.now().toString(),
            name: `Search ${savedSearches.length + 1}`,
            query,
            filters,
            createdAt: new Date().toISOString()
        };

        const updatedSearches = [newSearch, ...savedSearches];
        setSavedSearches(updatedSearches);
        localStorage.setItem('savedSearches', JSON.stringify(updatedSearches));
    };

    const handleLoadSearch = (savedSearch: SavedSearch) => {
        setQuery(savedSearch.query);
        setFilters(savedSearch.filters);
        setActiveTab(0);
    };

    const handleClearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('searchHistory');
    };

    const getEntityIcon = (type: string) => {
        const entityType = entityTypes.find(t => t.key === type);
        return entityType?.icon || <NoteIcon />;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SearchIcon />
                    Advanced Search
                </Box>
            </DialogTitle>
            <DialogContent>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                    <Tab label="Search" />
                    <Tab label="History" />
                    <Tab label="Saved Searches" />
                </Tabs>

                {activeTab === 0 && (
                    <>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                                fullWidth
                                placeholder="Search across all entities..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                }}
                            />
                            <IconButton 
                                onClick={() => setShowFilters(!showFilters)}
                                color={showFilters ? 'primary' : 'default'}
                            >
                                <Badge badgeContent={filters.types.length + filters.tags.length} color="primary">
                                    <FilterIcon />
                                </Badge>
                            </IconButton>
                        </Box>

                        {showFilters && (
                            <Box sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>Filters</Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <FormControl size="small" sx={{ minWidth: 200 }}>
                                        <InputLabel>Entity Types</InputLabel>
                                        <Select
                                            multiple
                                            value={filters.types}
                                            onChange={(e) => setFilters(prev => ({ ...prev, types: e.target.value as string[] }))}
                                            label="Entity Types"
                                        >
                                            {entityTypes.map(type => (
                                                <MenuItem key={type.key} value={type.key}>
                                                    {type.icon} {type.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        size="small"
                                        label="Start Date"
                                        type="date"
                                        value={filters.dateRange.start || ''}
                                        onChange={(e) => setFilters(prev => ({ 
                                            ...prev, 
                                            dateRange: { ...prev.dateRange, start: e.target.value }
                                        }))}
                                        InputLabelProps={{ shrink: true }}
                                    />

                                    <TextField
                                        size="small"
                                        label="End Date"
                                        type="date"
                                        value={filters.dateRange.end || ''}
                                        onChange={(e) => setFilters(prev => ({ 
                                            ...prev, 
                                            dateRange: { ...prev.dateRange, end: e.target.value }
                                        }))}
                                        InputLabelProps={{ shrink: true }}
                                    />

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={filters.contentOnly}
                                                onChange={(e) => setFilters(prev => ({ ...prev, contentOnly: e.target.checked }))}
                                            />
                                        }
                                        label="Content only"
                                    />
                                </Box>
                            </Box>
                        )}

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {loading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                <CircularProgress />
                            </Box>
                        )}

                        {!loading && results.length === 0 && query.trim() && (
                            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                No results found
                            </Typography>
                        )}

                        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {results.map((result) => (
                                <ListItem
                                    key={`${result.type}-${result.id}`}
                                    button
                                    onClick={() => onSelectResult(result)}
                                    sx={{ 
                                        border: '1px solid #eee', 
                                        borderRadius: 1, 
                                        mb: 1,
                                        '&:hover': {
                                            backgroundColor: 'action.hover'
                                        }
                                    }}
                                >
                                    <ListItemIcon>
                                        {getEntityIcon(result.type)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle1">
                                                    {result.title}
                                                </Typography>
                                                <Chip 
                                                    label={result.type} 
                                                    size="small" 
                                                    color="primary" 
                                                    variant="outlined"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {result.description}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                    {result.tags?.slice(0, 3).map(tag => (
                                                        <Chip key={tag} label={tag} size="small" />
                                                    ))}
                                                    {result.date && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatDate(result.date)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </>
                )}

                {activeTab === 1 && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Search History</Typography>
                            <Button size="small" onClick={handleClearHistory}>
                                Clear History
                            </Button>
                        </Box>
                        <List>
                            {searchHistory.map((searchTerm, index) => (
                                <ListItem
                                    key={index}
                                    button
                                    onClick={() => {
                                        setQuery(searchTerm);
                                        setActiveTab(0);
                                    }}
                                >
                                    <ListItemIcon>
                                        <HistoryIcon />
                                    </ListItemIcon>
                                    <ListItemText primary={searchTerm} />
                                </ListItem>
                            ))}
                            {searchHistory.length === 0 && (
                                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                    No search history
                                </Typography>
                            )}
                        </List>
                    </Box>
                )}

                {activeTab === 2 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Saved Searches</Typography>
                        <List>
                            {savedSearches.map((savedSearch) => (
                                <ListItem
                                    key={savedSearch.id}
                                    button
                                    onClick={() => handleLoadSearch(savedSearch)}
                                >
                                    <ListItemIcon>
                                        <BookmarkIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={savedSearch.name}
                                        secondary={`${savedSearch.query} • ${formatDate(savedSearch.createdAt)}`}
                                    />
                                </ListItem>
                            ))}
                            {savedSearches.length === 0 && (
                                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                    No saved searches
                                </Typography>
                            )}
                        </List>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                {activeTab === 0 && query.trim() && (
                    <Button
                        startIcon={<SaveIcon />}
                        onClick={handleSaveSearch}
                        disabled={savedSearches.some(s => s.query === query)}
                    >
                        Save Search
                    </Button>
                )}
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdvancedSearch; 