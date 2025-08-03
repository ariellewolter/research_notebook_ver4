import React, { useState, useEffect, useRef } from 'react';
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
} from '@mui/icons-material';

interface Command {
    id: string;
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    action: () => void;
    category: 'navigation' | 'create' | 'recent' | 'settings';
    keywords: string[];
    shortcut?: string;
}

interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
    onNavigate: (path: string) => void;
    onCreateNote: () => void;
    onCreateProject: () => void;
    onCreateWorkspace?: () => void;
    onCreateLabWorkspace?: () => void;
    recentItems?: Array<{ title: string; path: string; icon: React.ReactNode }>;
    workspaceCommands?: Array<{ id: string; title: string; subtitle?: string; icon: React.ReactNode; action: () => void; category: string; keywords: string[]; shortcut?: string }>;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
    open,
    onClose,
    onNavigate,
    onCreateNote,
    onCreateProject,
    onCreateWorkspace,
    onCreateLabWorkspace,
    recentItems = [],
    workspaceCommands = []
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Define all available commands
    const commands: Command[] = [
        // Navigation Commands
        {
            id: 'nav-dashboard',
            title: 'Go to Dashboard',
            subtitle: 'View overview and statistics',
            icon: <DashboardIcon />,
            action: () => onNavigate('/dashboard'),
            category: 'navigation',
            keywords: ['dashboard', 'home', 'overview', 'stats'],
            shortcut: 'Ctrl+1'
        },
        {
            id: 'nav-notes',
            title: 'Go to Notes',
            subtitle: 'Browse your lab notes',
            icon: <NoteIcon />,
            action: () => onNavigate('/notes'),
            category: 'navigation',
            keywords: ['notes', 'lab notes', 'daily'],
            shortcut: 'Ctrl+2'
        },
        {
            id: 'nav-projects',
            title: 'Go to Projects',
            subtitle: 'Manage research projects',
            icon: <ProjectIcon />,
            action: () => onNavigate('/projects'),
            category: 'navigation',
            keywords: ['projects', 'research', 'experiments'],
            shortcut: 'Ctrl+3'
        },
        {
            id: 'nav-protocols',
            title: 'Go to Protocols',
            subtitle: 'View standard procedures',
            icon: <ProtocolIcon />,
            action: () => onNavigate('/protocols'),
            category: 'navigation',
            keywords: ['protocols', 'procedures', 'methods'],
            shortcut: 'Ctrl+4'
        },
        {
            id: 'nav-database',
            title: 'Go to Database',
            subtitle: 'Browse chemicals, genes, etc.',
            icon: <DatabaseIcon />,
            action: () => onNavigate('/database'),
            category: 'navigation',
            keywords: ['database', 'chemicals', 'genes', 'compounds'],
            shortcut: 'Ctrl+5'
        },
        {
            id: 'nav-calendar',
            title: 'Go to Calendar',
            subtitle: 'View schedule and deadlines',
            icon: <CalendarIcon />,
            action: () => onNavigate('/calendar'),
            category: 'navigation',
            keywords: ['calendar', 'schedule', 'deadlines', 'meetings']
        },
        {
            id: 'nav-analytics',
            title: 'Go to Analytics',
            subtitle: 'View research analytics',
            icon: <AnalyticsIcon />,
            action: () => onNavigate('/analytics'),
            category: 'navigation',
            keywords: ['analytics', 'statistics', 'data', 'charts']
        },
        {
            id: 'nav-calculators',
            title: 'Go to Calculators',
            subtitle: 'Scientific calculators',
            icon: <CalculateIcon />,
            action: () => onNavigate('/calculators'),
            category: 'navigation',
            keywords: ['calculators', 'calculations', 'formulas', 'convert']
        },
        {
            id: 'nav-literature',
            title: 'Go to Literature',
            subtitle: 'Literature notes and reviews',
            icon: <LiteratureIcon />,
            action: () => onNavigate('/literature'),
            category: 'navigation',
            keywords: ['literature', 'papers', 'articles', 'research']
        },

        // Create Commands
        {
            id: 'create-note',
            title: 'Create New Note',
            subtitle: 'Start a new lab note',
            icon: <AddIcon />,
            action: onCreateNote,
            category: 'create',
            keywords: ['new', 'create', 'note', 'add'],
            shortcut: 'Ctrl+N'
        },
        {
            id: 'create-project',
            title: 'Create New Project',
            subtitle: 'Start a new research project',
            icon: <AddIcon />,
            action: onCreateProject,
            category: 'create',
            keywords: ['new', 'create', 'project', 'research']
        },
        {
            id: 'create-protocol',
            title: 'Create New Protocol',
            subtitle: 'Document a new procedure',
            icon: <AddIcon />,
            action: () => onNavigate('/protocols/new'),
            category: 'create',
            keywords: ['new', 'create', 'protocol', 'procedure']
        },

        // Settings
        {
            id: 'settings',
            title: 'Open Settings',
            subtitle: 'Configure your workspace',
            icon: <SettingsIcon />,
            action: () => onNavigate('/settings'),
            category: 'settings',
            keywords: ['settings', 'preferences', 'config', 'setup'],
            shortcut: 'Ctrl+,'
        }
    ];

    // Add recent items to commands
    const recentCommands: Command[] = recentItems.map((item, index) => ({
        id: `recent-${index}`,
        title: item.title,
        subtitle: 'Recently accessed',
        icon: item.icon,
        action: () => onNavigate(item.path),
        category: 'recent',
        keywords: [item.title.toLowerCase()]
    }));

    // Add workspace commands
    const workspaceCommandsList: Command[] = workspaceCommands.map(cmd => ({
        ...cmd,
        category: cmd.category as 'navigation' | 'create' | 'recent' | 'settings'
    }));

    const allCommands = [...commands, ...workspaceCommandsList, ...recentCommands];

    // Filter commands based on search term
    const filteredCommands = allCommands.filter(cmd => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            cmd.title.toLowerCase().includes(searchLower) ||
            cmd.subtitle?.toLowerCase().includes(searchLower) ||
            cmd.keywords.some(keyword => keyword.includes(searchLower))
        );
    });

    // Group commands by category
    const groupedCommands = filteredCommands.reduce((groups, cmd) => {
        if (!groups[cmd.category]) {
            groups[cmd.category] = [];
        }
        groups[cmd.category].push(cmd);
        return groups;
    }, {} as Record<string, Command[]>);

    // Handle keyboard navigation
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredCommands[selectedIndex]) {
                        filteredCommands[selectedIndex].action();
                        onClose();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, selectedIndex, filteredCommands, onClose]);

    // Reset search and selection when opened
    useEffect(() => {
        if (open) {
            setSearchTerm('');
            setSelectedIndex(0);
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [open]);

    // Update selected index when filtered commands change
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchTerm]);

    const categoryLabels = {
        navigation: 'Navigate',
        create: 'Create New',
        recent: 'Recent',
        settings: 'Settings'
    };

    const categoryOrder = ['recent', 'navigation', 'create', 'settings'];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden'
                }
            }}
            sx={{
                '& .MuiDialog-container': {
                    alignItems: 'flex-start',
                    pt: '20vh'
                }
            }}
        >
            <DialogContent sx={{ p: 0 }}>
                {/* Search Input */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <TextField
                        ref={searchInputRef}
                        fullWidth
                        placeholder="Type a command or search..."
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
                                        const globalIndex = filteredCommands.findIndex(c => c.id === cmd.id);
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
                                                        {cmd.icon}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={cmd.title}
                                                        secondary={cmd.subtitle}
                                                        primaryTypographyProps={{
                                                            variant: 'body2',
                                                            fontWeight: 500
                                                        }}
                                                        secondaryTypographyProps={{
                                                            variant: 'caption',
                                                            color: 'text.secondary'
                                                        }}
                                                    />
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
                {filteredCommands.length === 0 && searchTerm && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No commands found for "{searchTerm}"
                        </Typography>
                    </Box>
                )}

                {/* Footer */}
                <Box sx={{ p: 2, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                        Press ↑↓ to navigate, ⏎ to select, esc to close
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default CommandPalette; 