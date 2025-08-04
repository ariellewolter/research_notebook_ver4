import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    TextField,
    InputAdornment,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Box,
    Chip,
    Divider,
    Avatar,
    Badge,
} from '@mui/material';
import {
    Search as SearchIcon,
    Dashboard as DashboardIcon,
    Note as NoteIcon,
    Folder as ProjectIcon,
    Science as ProtocolIcon,
    Storage as DatabaseIcon,
    CalendarToday as CalendarIcon,
    Settings as SettingsIcon,
    Assessment as AnalyticsIcon,
    Calculate as CalculateIcon,
    Book as LiteratureIcon,
    Restaurant as RecipeIcon,
    PictureAsPdf as PdfIcon,
    TableChart as TableIcon,
    Link as LinkIcon,
    CheckBox as TaskIcon,
    Add as AddIcon,
    History as HistoryIcon,
    Bookmark as BookmarkIcon,
    KeyboardCommandKey,
    FileUpload as ImportIcon,
    FileDownload as ExportIcon,
    Refresh as RefreshIcon,
    Help as HelpIcon,
    KeyboardArrowRight as ArrowRightIcon,
    Star as StarIcon,
    AccessTime as TimeIcon,
    TrendingUp as TrendingIcon,
} from '@mui/icons-material';

interface Command {
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    icon: React.ReactNode;
    action: () => void;
    category: 'navigation' | 'create' | 'recent' | 'settings' | 'actions' | 'search' | 'favorites';
    keywords: string[];
    shortcut?: string;
    priority?: number;
    tags?: string[];
    metadata?: {
        id?: string;
        type?: string;
        lastModified?: Date;
        size?: string;
        author?: string;
    };
}

interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
    onNavigate: (path: string) => void;
    onCreateNote: () => void;
    onCreateProject: () => void;
    onCreateWorkspace?: () => void;
    onCreateLabWorkspace?: () => void;
    recentItems?: Array<{ title: string; path: string; icon: React.ReactNode; id?: string; type?: string }>;
    workspaceCommands?: Array<{ id: string; title: string; subtitle?: string; icon: React.ReactNode; action: () => void; category: string; keywords: string[]; shortcut?: string }>;
    // New props for enhanced functionality
    onImportFile?: () => void;
    onExportProject?: () => void;
    onOpenSettings?: () => void;
    onSearch?: (query: string) => void;
    items?: Array<{
        id: string;
        title: string;
        type: 'note' | 'project' | 'pdf' | 'protocol' | 'recipe' | 'task';
        path: string;
        lastModified?: Date;
        tags?: string[];
    }>;
}

// Fuzzy search implementation
function fuzzySearch(text: string, query: string): { score: number; matches: number[] } {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    if (queryLower.length === 0) return { score: 0, matches: [] };
    
    let score = 0;
    let matches: number[] = [];
    let queryIndex = 0;
    let lastMatchIndex = -1;
    
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
        if (textLower[i] === queryLower[queryIndex]) {
            // Bonus for consecutive matches
            if (lastMatchIndex === i - 1) {
                score += 10;
            }
            // Bonus for matches at word boundaries
            if (i === 0 || textLower[i - 1] === ' ' || textLower[i - 1] === '-') {
                score += 5;
            }
            // Bonus for uppercase matches
            if (text[i] === query[queryIndex] && text[i] === text[i].toUpperCase()) {
                score += 3;
            }
            
            score += 1;
            matches.push(i);
            lastMatchIndex = i;
            queryIndex++;
        }
    }
    
    // Penalty for incomplete matches
    if (queryIndex < queryLower.length) {
        score = 0;
        matches = [];
    }
    
    return { score, matches };
}

const EnhancedCommandPalette: React.FC<CommandPaletteProps> = ({
    open,
    onClose,
    onNavigate,
    onCreateNote,
    onCreateProject,
    onCreateWorkspace,
    onCreateLabWorkspace,
    recentItems = [],
    workspaceCommands = [],
    onImportFile,
    onExportProject,
    onOpenSettings,
    onSearch,
    items = []
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchResults, setSearchResults] = useState<Array<Command & { score: number; matches: number[] }>>([]);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Define all available commands with enhanced functionality
    const baseCommands: Command[] = [
        // Navigation Commands
        {
            id: 'nav-dashboard',
            title: 'Go to Dashboard',
            subtitle: 'View overview and statistics',
            description: 'Navigate to the main dashboard',
            icon: <DashboardIcon />,
            action: () => onNavigate('/dashboard'),
            category: 'navigation',
            keywords: ['dashboard', 'home', 'overview', 'stats', 'main'],
            shortcut: 'Ctrl+1',
            priority: 10
        },
        {
            id: 'nav-notes',
            title: 'Go to Notes',
            subtitle: 'Browse your lab notes',
            description: 'View and manage all notes',
            icon: <NoteIcon />,
            action: () => onNavigate('/notes'),
            category: 'navigation',
            keywords: ['notes', 'lab notes', 'daily', 'journal'],
            shortcut: 'Ctrl+2',
            priority: 9
        },
        {
            id: 'nav-projects',
            title: 'Go to Projects',
            subtitle: 'Manage research projects',
            description: 'View and manage research projects',
            icon: <ProjectIcon />,
            action: () => onNavigate('/projects'),
            category: 'navigation',
            keywords: ['projects', 'research', 'experiments', 'studies'],
            shortcut: 'Ctrl+3',
            priority: 9
        },
        {
            id: 'nav-protocols',
            title: 'Go to Protocols',
            subtitle: 'View standard procedures',
            description: 'Browse and manage protocols',
            icon: <ProtocolIcon />,
            action: () => onNavigate('/protocols'),
            category: 'navigation',
            keywords: ['protocols', 'procedures', 'methods', 'sop'],
            shortcut: 'Ctrl+4',
            priority: 8
        },
        {
            id: 'nav-database',
            title: 'Go to Database',
            subtitle: 'Browse chemicals, genes, etc.',
            description: 'Access research database',
            icon: <DatabaseIcon />,
            action: () => onNavigate('/database'),
            category: 'navigation',
            keywords: ['database', 'chemicals', 'genes', 'compounds', 'data'],
            shortcut: 'Ctrl+5',
            priority: 8
        },
        {
            id: 'nav-calendar',
            title: 'Go to Calendar',
            subtitle: 'View schedule and deadlines',
            description: 'Check calendar and schedule',
            icon: <CalendarIcon />,
            action: () => onNavigate('/calendar'),
            category: 'navigation',
            keywords: ['calendar', 'schedule', 'deadlines', 'meetings', 'events'],
            priority: 7
        },
        {
            id: 'nav-analytics',
            title: 'Go to Analytics',
            subtitle: 'View research analytics',
            description: 'Research analytics and insights',
            icon: <AnalyticsIcon />,
            action: () => onNavigate('/analytics'),
            category: 'navigation',
            keywords: ['analytics', 'statistics', 'data', 'charts', 'insights'],
            priority: 7
        },
        {
            id: 'nav-calculators',
            title: 'Go to Calculators',
            subtitle: 'Scientific calculators',
            description: 'Access scientific calculators',
            icon: <CalculateIcon />,
            action: () => onNavigate('/calculators'),
            category: 'navigation',
            keywords: ['calculators', 'calculations', 'formulas', 'convert', 'math'],
            priority: 6
        },
        {
            id: 'nav-literature',
            title: 'Go to Literature',
            subtitle: 'Literature notes and reviews',
            description: 'Literature management and notes',
            icon: <LiteratureIcon />,
            action: () => onNavigate('/literature'),
            category: 'navigation',
            keywords: ['literature', 'papers', 'articles', 'research', 'reviews'],
            priority: 7
        },
        {
            id: 'nav-tasks',
            title: 'Go to Tasks',
            subtitle: 'Manage tasks and to-dos',
            description: 'Task management and tracking',
            icon: <TaskIcon />,
            action: () => onNavigate('/tasks'),
            category: 'navigation',
            keywords: ['tasks', 'todo', 'checklist', 'assignments'],
            priority: 7
        },
        {
            id: 'nav-pdfs',
            title: 'Go to PDFs',
            subtitle: 'Manage PDF documents',
            description: 'PDF document management',
            icon: <PdfIcon />,
            action: () => onNavigate('/pdfs'),
            category: 'navigation',
            keywords: ['pdfs', 'documents', 'files', 'papers'],
            priority: 7
        },

        // Create Commands
        {
            id: 'create-note',
            title: 'Create New Note',
            subtitle: 'Start a new lab note',
            description: 'Create a new laboratory note',
            icon: <AddIcon />,
            action: onCreateNote,
            category: 'create',
            keywords: ['new', 'create', 'note', 'add', 'lab note'],
            shortcut: 'Ctrl+N',
            priority: 10
        },
        {
            id: 'create-project',
            title: 'Create New Project',
            subtitle: 'Start a new research project',
            description: 'Create a new research project',
            icon: <AddIcon />,
            action: onCreateProject,
            category: 'create',
            keywords: ['new', 'create', 'project', 'research', 'experiment'],
            shortcut: 'Ctrl+Shift+N',
            priority: 9
        },
        {
            id: 'create-protocol',
            title: 'Create New Protocol',
            subtitle: 'Document a new procedure',
            description: 'Create a new laboratory protocol',
            icon: <AddIcon />,
            action: () => onNavigate('/protocols/new'),
            category: 'create',
            keywords: ['new', 'create', 'protocol', 'procedure', 'method'],
            priority: 8
        },
        {
            id: 'create-recipe',
            title: 'Create New Recipe',
            subtitle: 'Document a new recipe',
            description: 'Create a new experimental recipe',
            icon: <AddIcon />,
            action: () => onNavigate('/recipes/new'),
            category: 'create',
            keywords: ['new', 'create', 'recipe', 'experiment', 'formula'],
            priority: 8
        },

        // Action Commands
        {
            id: 'action-import',
            title: 'Import File',
            subtitle: 'Import data or documents',
            description: 'Import files into the system',
            icon: <ImportIcon />,
            action: onImportFile || (() => {}),
            category: 'actions',
            keywords: ['import', 'upload', 'file', 'data', 'load'],
            shortcut: 'Ctrl+I',
            priority: 8
        },
        {
            id: 'action-export',
            title: 'Export Project',
            subtitle: 'Export project data',
            description: 'Export project data and reports',
            icon: <ExportIcon />,
            action: onExportProject || (() => {}),
            category: 'actions',
            keywords: ['export', 'download', 'project', 'data', 'report'],
            shortcut: 'Ctrl+E',
            priority: 8
        },
        {
            id: 'action-refresh',
            title: 'Refresh Data',
            subtitle: 'Refresh all data sources',
            description: 'Refresh data from all sources',
            icon: <RefreshIcon />,
            action: () => window.location.reload(),
            category: 'actions',
            keywords: ['refresh', 'reload', 'update', 'sync'],
            shortcut: 'F5',
            priority: 6
        },
        {
            id: 'action-search',
            title: 'Search Everything',
            subtitle: 'Search across all content',
            description: 'Global search functionality',
            icon: <SearchIcon />,
            action: () => onNavigate('/search'),
            category: 'search',
            keywords: ['search', 'find', 'lookup', 'query'],
            shortcut: 'Ctrl+Shift+F',
            priority: 9
        },

        // Settings
        {
            id: 'settings',
            title: 'Open Settings',
            subtitle: 'Configure your workspace',
            description: 'Application settings and preferences',
            icon: <SettingsIcon />,
            action: onOpenSettings || (() => onNavigate('/settings')),
            category: 'settings',
            keywords: ['settings', 'preferences', 'config', 'setup', 'options'],
            shortcut: 'Ctrl+,',
            priority: 7
        },
        {
            id: 'help',
            title: 'Help & Documentation',
            subtitle: 'Get help and view docs',
            description: 'Access help and documentation',
            icon: <HelpIcon />,
            action: () => onNavigate('/help'),
            category: 'settings',
            keywords: ['help', 'docs', 'documentation', 'support', 'guide'],
            priority: 6
        }
    ];

    // Convert items to commands
    const itemCommands: Command[] = items.map(item => ({
        id: `item-${item.id}`,
        title: item.title,
        subtitle: `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} • ${item.lastModified ? new Date(item.lastModified).toLocaleDateString() : 'No date'}`,
        description: `Open ${item.type}`,
        icon: getItemIcon(item.type),
        action: () => onNavigate(item.path),
        category: 'recent',
        keywords: [item.title.toLowerCase(), item.type, ...(item.tags || [])],
        priority: 5,
        tags: item.tags,
        metadata: {
            id: item.id,
            type: item.type,
            lastModified: item.lastModified,
        }
    }));

    // Add recent items to commands
    const recentCommands: Command[] = recentItems.map((item, index) => ({
        id: `recent-${index}`,
        title: item.title,
        subtitle: 'Recently accessed',
        description: 'Recently accessed item',
        icon: item.icon,
        action: () => onNavigate(item.path),
        category: 'recent',
        keywords: [item.title.toLowerCase()],
        priority: 6,
        metadata: {
            id: item.id,
            type: item.type,
        }
    }));

    // Add workspace commands
    const workspaceCommandsList: Command[] = workspaceCommands.map(cmd => ({
        ...cmd,
        category: cmd.category as 'navigation' | 'create' | 'recent' | 'settings' | 'actions' | 'search' | 'favorites',
        priority: 5
    }));

    const allCommands = [...baseCommands, ...itemCommands, ...workspaceCommandsList, ...recentCommands];

    // Fuzzy search with scoring
    const performFuzzySearch = useMemo(() => {
        if (!searchTerm.trim()) {
            return allCommands.map(cmd => ({ ...cmd, score: 0, matches: [] }));
        }

        const results = allCommands.map(cmd => {
            const titleMatch = fuzzySearch(cmd.title, searchTerm);
            const subtitleMatch = fuzzySearch(cmd.subtitle || '', searchTerm);
            const descriptionMatch = fuzzySearch(cmd.description || '', searchTerm);
            const keywordMatches = cmd.keywords.map(keyword => fuzzySearch(keyword, searchTerm));

            // Calculate total score
            let totalScore = titleMatch.score * 3; // Title matches are most important
            totalScore += subtitleMatch.score * 2; // Subtitle matches are second
            totalScore += descriptionMatch.score; // Description matches are third
            totalScore += keywordMatches.reduce((sum, match) => sum + match.score, 0);

            // Priority bonus
            totalScore += (cmd.priority || 0) * 0.1;

            // Exact match bonus
            if (cmd.title.toLowerCase().includes(searchTerm.toLowerCase())) {
                totalScore += 50;
            }

            return {
                ...cmd,
                score: totalScore,
                matches: titleMatch.matches
            };
        });

        // Filter out zero scores and sort by score
        return results
            .filter(result => result.score > 0)
            .sort((a, b) => b.score - a.score);
    }, [searchTerm, allCommands]);

    // Update search results
    useEffect(() => {
        setSearchResults(performFuzzySearch);
        setSelectedIndex(0);
    }, [performFuzzySearch]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (searchResults[selectedIndex]) {
                        searchResults[selectedIndex].action();
                        onClose();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
                case 'Tab':
                    e.preventDefault();
                    // Cycle through categories
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, selectedIndex, searchResults, onClose]);

    // Reset search and selection when opened
    useEffect(() => {
        if (open) {
            setSearchTerm('');
            setSelectedIndex(0);
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [open]);

    // Group commands by category
    const groupedCommands = searchResults.reduce((groups, cmd) => {
        if (!groups[cmd.category]) {
            groups[cmd.category] = [];
        }
        groups[cmd.category].push(cmd);
        return groups;
    }, {} as Record<string, typeof searchResults>);

    const categoryLabels = {
        navigation: 'Navigate',
        create: 'Create New',
        recent: 'Recent Items',
        settings: 'Settings',
        actions: 'Actions',
        search: 'Search',
        favorites: 'Favorites'
    };

    const categoryOrder = ['favorites', 'recent', 'navigation', 'create', 'actions', 'search', 'settings'];

    // Helper function to get item icon
    function getItemIcon(type: string): React.ReactNode {
        switch (type) {
            case 'note': return <NoteIcon />;
            case 'project': return <ProjectIcon />;
            case 'pdf': return <PdfIcon />;
            case 'protocol': return <ProtocolIcon />;
            case 'recipe': return <RecipeIcon />;
            case 'task': return <TaskIcon />;
            default: return <NoteIcon />;
        }
    }

    // Highlight matching text
    const highlightText = (text: string, matches: number[]) => {
        if (matches.length === 0) return text;
        
        const parts = [];
        let lastIndex = 0;
        
        matches.forEach(matchIndex => {
            parts.push(text.slice(lastIndex, matchIndex));
            parts.push(
                <span key={matchIndex} style={{ backgroundColor: 'yellow', fontWeight: 'bold' }}>
                    {text[matchIndex]}
                </span>
            );
            lastIndex = matchIndex + 1;
        });
        
        parts.push(text.slice(lastIndex));
        return parts;
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden',
                    maxHeight: '80vh'
                }
            }}
            sx={{
                '& .MuiDialog-container': {
                    alignItems: 'flex-start',
                    pt: '10vh'
                }
            }}
        >
            <DialogContent sx={{ p: 0 }}>
                {/* Search Input */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <TextField
                        ref={searchInputRef}
                        fullWidth
                        placeholder="Search commands, notes, projects, PDFs... (Ctrl+P)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        variant="outlined"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    border: 'none',
                                },
                            },
                        }}
                    />
                </Box>

                {/* Commands List */}
                <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                    {categoryOrder.map(category => {
                        const commands = groupedCommands[category];
                        if (!commands || commands.length === 0) return null;

                        return (
                            <Box key={category}>
                                <Box sx={{ px: 2, py: 1, bgcolor: 'background.default' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        {categoryLabels[category]}
                                    </Typography>
                                </Box>
                                <List dense>
                                    {commands.map((cmd, categoryIndex) => {
                                        const globalIndex = searchResults.findIndex(c => c.id === cmd.id);
                                        const isSelected = globalIndex === selectedIndex;

                                        return (
                                            <ListItem key={cmd.id} disablePadding>
                                                <ListItemButton
                                                    selected={isSelected}
                                                    onClick={() => {
                                                        cmd.action();
                                                        onClose();
                                                    }}
                                                    sx={{
                                                        py: 1.5,
                                                        '&.Mui-selected': {
                                                            bgcolor: 'action.selected',
                                                        }
                                                    }}
                                                >
                                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                                        {cmd.metadata?.type === 'pdf' ? (
                                                            <Badge badgeContent="PDF" color="primary">
                                                                {cmd.icon}
                                                            </Badge>
                                                        ) : (
                                                            cmd.icon
                                                        )}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <Box>
                                                                {searchTerm ? highlightText(cmd.title, cmd.matches) : cmd.title}
                                                                {cmd.metadata?.lastModified && (
                                                                    <Chip
                                                                        size="small"
                                                                        label={new Date(cmd.metadata.lastModified).toLocaleDateString()}
                                                                        sx={{ ml: 1, height: 16, fontSize: '0.6rem' }}
                                                                    />
                                                                )}
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <span>{cmd.subtitle}</span>
                                                                {cmd.tags && cmd.tags.length > 0 && (
                                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                        {cmd.tags.slice(0, 2).map((tag, index) => (
                                                                            <Chip
                                                                                key={index}
                                                                                label={tag}
                                                                                size="small"
                                                                                variant="outlined"
                                                                                sx={{ height: 16, fontSize: '0.5rem' }}
                                                                            />
                                                                        ))}
                                                                        {cmd.tags.length > 2 && (
                                                                            <Chip
                                                                                label={`+${cmd.tags.length - 2}`}
                                                                                size="small"
                                                                                variant="outlined"
                                                                                sx={{ height: 16, fontSize: '0.5rem' }}
                                                                            />
                                                                        )}
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        }
                                                        primaryTypographyProps={{
                                                            variant: 'body2',
                                                            fontWeight: 500
                                                        }}
                                                        secondaryTypographyProps={{
                                                            variant: 'caption',
                                                            color: 'text.secondary'
                                                        }}
                                                    />
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        {cmd.shortcut && (
                                                            <Chip
                                                                label={cmd.shortcut}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize: '0.6rem',
                                                                    fontFamily: 'monospace'
                                                                }}
                                                            />
                                                        )}
                                                        <ArrowRightIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    </Box>
                                                </ListItemButton>
                                            </ListItem>
                                        );
                                    })}
                                </List>
                                {category !== categoryOrder[categoryOrder.length - 1] && <Divider />}
                            </Box>
                        );
                    })}
                </Box>

                {/* No Results */}
                {searchResults.length === 0 && searchTerm && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No results found for "{searchTerm}"
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Try different keywords or check your spelling
                        </Typography>
                    </Box>
                )}

                {/* Footer */}
                <Box sx={{ p: 2, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            Press ↑↓ to navigate, ⏎ to select, esc to close
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default EnhancedCommandPalette; 