import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    InputAdornment,
    IconButton,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Typography,
    Chip,
    CircularProgress,
    Collapse,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
} from '@mui/material';
import {
    Search as SearchIcon,
    Clear as ClearIcon,
    Note as NoteIcon,
    Science as ScienceIcon,
    PictureAsPdf as PdfIcon,
    Storage as DatabaseIcon,
    FilterList as FilterIcon,
} from '@mui/icons-material';
import { notesApi, projectsApi, pdfsApi, databaseApi, linksApi } from '../../services/api';

interface SearchResult {
    id: string;
    title: string;
    type: 'note' | 'project' | 'pdf' | 'database';
    subtype?: string;
    description?: string;
    date?: string;
    score?: number;
}

const SearchBar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Perform search when debounced query changes
    useEffect(() => {
        if (debouncedQuery.trim().length >= 2) {
            performSearch();
        } else {
            setResults([]);
            setShowResults(false);
        }
    }, [debouncedQuery, filterType]);

    const performSearch = async () => {
        if (!debouncedQuery.trim()) return;

        try {
            setLoading(true);
            const searchPromises = [];

            // Search notes
            if (filterType === 'all' || filterType === 'notes') {
                searchPromises.push(
                    notesApi.getAll({
                        limit: 5
                    }).then(response => {
                        const notes = response.data.notes || response.data || [];
                        const filtered = notes.filter((note: any) =>
                            note.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                            (note.content && note.content.toLowerCase().includes(debouncedQuery.toLowerCase()))
                        );
                        return {
                            type: 'notes' as const,
                            data: filtered.slice(0, 5)
                        };
                    })
                );
            }

            // Search projects
            if (filterType === 'all' || filterType === 'projects') {
                searchPromises.push(
                    projectsApi.getAll().then(response => {
                        const projects = response.data || [];
                        const filtered = projects.filter((project: any) =>
                            project.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                            (project.description && project.description.toLowerCase().includes(debouncedQuery.toLowerCase()))
                        );
                        return {
                            type: 'projects' as const,
                            data: filtered.slice(0, 5)
                        };
                    })
                );
            }

            // Search PDFs
            if (filterType === 'all' || filterType === 'pdfs') {
                searchPromises.push(
                    pdfsApi.getAll({ limit: 5 }).then(response => {
                        const pdfs = response.data.pdfs || response.data || [];
                        const filtered = pdfs.filter((pdf: any) =>
                            pdf.title.toLowerCase().includes(debouncedQuery.toLowerCase())
                        );
                        return {
                            type: 'pdfs' as const,
                            data: filtered.slice(0, 5)
                        };
                    })
                );
            }

            // Search database
            if (filterType === 'all' || filterType === 'database') {
                searchPromises.push(
                    databaseApi.search(debouncedQuery, { limit: 5 }).then(response => ({
                        type: 'database' as const,
                        data: response.data.entries || response.data || []
                    }))
                );
            }

            const searchResults = await Promise.allSettled(searchPromises);

            const allResults: SearchResult[] = [];

            searchResults.forEach((result) => {
                if (result.status === 'fulfilled') {
                    const { type, data } = result.value;
                    data.forEach((item: any) => {
                        allResults.push({
                            id: item.id,
                            title: item.title || item.name,
                            type: type === 'notes' ? 'note' : type === 'projects' ? 'project' : type === 'pdfs' ? 'pdf' : 'database',
                            subtype: item.type,
                            description: item.description || item.content,
                            date: item.createdAt || item.date,
                        });
                    });
                }
            });

            setResults(allResults);
            setShowResults(true);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setShowResults(false);
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
            default:
                return <NoteIcon />;
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
            default:
                return 'default';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const truncateText = (text: string, maxLength: number = 100) => {
        if (!text) return '';
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

    return (
        <Box sx={{ position: 'relative', width: '100%', maxWidth: 600 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                    fullWidth
                    placeholder="Search notes, projects, PDFs, database..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                        endAdornment: query && (
                            <InputAdornment position="end">
                                {loading ? (
                                    <CircularProgress size={20} />
                                ) : (
                                    <IconButton size="small" onClick={handleClear}>
                                        <ClearIcon />
                                    </IconButton>
                                )}
                            </InputAdornment>
                        ),
                    }}
                    size="small"
                />

                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Filter</InputLabel>
                    <Select
                        value={filterType}
                        label="Filter"
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="notes">Notes</MenuItem>
                        <MenuItem value="projects">Projects</MenuItem>
                        <MenuItem value="pdfs">PDFs</MenuItem>
                        <MenuItem value="database">Database</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Collapse in={showResults}>
                <Paper
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        maxHeight: 400,
                        overflow: 'auto',
                        boxShadow: 3,
                    }}
                >
                    {results.length > 0 ? (
                        <List dense>
                            {results.map((result, index) => (
                                <React.Fragment key={result.id}>
                                    <ListItem
                                        button
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                            },
                                        }}
                                    >
                                        <ListItemIcon>
                                            {getTypeIcon(result.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {result.title}
                                                    </Typography>
                                                    <Chip
                                                        label={result.type}
                                                        size="small"
                                                        color={getTypeColor(result.type)}
                                                    />
                                                    {result.subtype && (
                                                        <Chip
                                                            label={result.subtype}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    {result.description && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {truncateText(result.description)}
                                                        </Typography>
                                                    )}
                                                    {result.date && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                            {formatDate(result.date)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < results.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    ) : (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                No results found for "{debouncedQuery}"
                            </Typography>
                        </Box>
                    )}
                </Paper>
            </Collapse>
        </Box>
    );
};

export default SearchBar; 