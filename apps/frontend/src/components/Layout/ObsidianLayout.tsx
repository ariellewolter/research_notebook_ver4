import React, { useState, useRef, useEffect, createContext, useContext, useCallback } from 'react';
import {
    Box,
    IconButton,
    Typography,
    Button,
    Menu,
    MenuItem,
    Tooltip,
    TextField,
    InputAdornment,
    Divider,
    Paper,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    ButtonGroup,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Note as NoteIcon,
    Book as JournalIcon,
    CalendarToday as CalendarIcon,
    Folder as ProjectIcon,
    PictureAsPdf as PdfIcon,
    Storage as DatabaseIcon,
    TableChart as TableIcon,
    Science as ProtocolIcon,
    Restaurant as RecipeIcon,
    LibraryBooks as ZoteroIcon,
    Settings as SettingsIcon,
    CheckBox as CheckBoxIcon,
    Calculate as CalculateIcon,
    Search as SearchIcon,
    Assessment as AssessmentIcon,
    Link as LinkIcon,
    Close,
    Add,
    MoreVert,
    Splitscreen as SplitScreen,
    ExpandMore,
    ExpandLess,
    ViewColumn,
    ViewQuilt,
    ViewAgenda,
    Fullscreen,
    FullscreenExit,
    AccountCircle,
    Logout,
    Minimize,
    CropSquare,
    KeyboardCommandKey,
    PushPin,
    FileCopy,
    OpenInNew,
    History,
    FolderOpen,
    Menu as PanelLeft,
    Description,
    Rocket as RocketIcon,
    Timeline as TimelineIcon,
    Assessment as ReportingIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useWorkspaceTabs } from '../../pages/WorkspaceTabsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useEnhancedCommandPaletteContext } from '../CommandPalette/EnhancedCommandPaletteProvider';
import { CommandButton } from '../CommandPalette';
import { useNotionWorkspace } from '../../hooks/useNotionWorkspace';
import { getWorkspaceCommands } from '../CommandPalette/WorkspaceCommands';
import { WorkspaceIntegration } from '../NotionWorkspace/WorkspaceIntegration';
import { TouchSidebarHandler } from './TouchSidebarHandler';

// Enhanced Tab Interface
interface TabData {
    key: string;
    title: string;
    path: string;
    icon?: React.ReactNode;
    isDirty?: boolean;
    isPinned?: boolean;
    lastAccessed?: number;
    metadata?: Record<string, any>;
}

interface TabGroup {
    id: string;
    openTabs: TabData[];
    activeTab: string | null;
    layout: 'vertical' | 'horizontal';
    isMinimized?: boolean;
}

// Floating Action Panel
const FloatingActionPanel: React.FC<{
    onNewNote: () => void;
    onNewProject: () => void;
    onNewWorkspace: () => void;
    onSearch: () => void;
    onCommandPalette: () => void;
    onFileTree: () => void;
}> = ({ onNewNote, onNewProject, onNewWorkspace, onSearch, onCommandPalette, onFileTree }) => (
    <Box sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
    }}>
        <Paper sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Tooltip title="Command Palette (Ctrl+K)" placement="left">
                <IconButton
                    onClick={onCommandPalette}
                    sx={{ bgcolor: 'primary.main', color: 'white' }}
                >
                    <KeyboardCommandKey />
                </IconButton>
            </Tooltip>
            <Tooltip title="File Explorer" placement="left">
                <IconButton onClick={onFileTree}>
                    <FolderOpen />
                </IconButton>
            </Tooltip>
            <Tooltip title="New Note (Ctrl+N)" placement="left">
                <IconButton onClick={onNewNote}>
                    <NoteIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="New Project" placement="left">
                <IconButton onClick={onNewProject}>
                    <ProjectIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="New Workspace" placement="left">
                <IconButton onClick={onNewWorkspace}>
                    <Description />
                </IconButton>
            </Tooltip>
        </Paper>
    </Box>
);

// Enhanced Tab Component
const WorkspaceTab: React.FC<{
    tab: TabData;
    isActive: boolean;
    onSelect: () => void;
    onClose: () => void;
    onPin?: () => void;
    onDuplicate?: () => void;
}> = ({ tab, isActive, onSelect, onClose, onPin, onDuplicate }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    return (
        <Box sx={{ position: 'relative' }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 1,
                    cursor: 'pointer',
                    bgcolor: isActive ? 'action.selected' : 'transparent',
                    borderBottom: isActive ? 2 : 0,
                    borderColor: 'primary.main',
                    '&:hover': {
                        bgcolor: 'action.hover',
                    },
                    minWidth: 120,
                    maxWidth: 200,
                }}
                onClick={onSelect}
                onContextMenu={(e) => {
                    e.preventDefault();
                    setAnchorEl(e.currentTarget);
                }}
            >
                {tab.isPinned && (
                    <PushPin sx={{ fontSize: 14, mr: 0.5, color: 'primary.main' }} />
                )}
                {tab.icon && (
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        {tab.icon}
                    </Box>
                )}
                <Typography
                    variant="body2"
                    sx={{
                        flexGrow: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {tab.title}
                    {tab.isDirty && ' •'}
                </Typography>
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    sx={{ ml: 1, opacity: 0.7 }}
                >
                    <Close fontSize="small" />
                </IconButton>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem onClick={() => { onPin?.(); setAnchorEl(null); }}>
                    <PushPin sx={{ mr: 1 }} />
                    {tab.isPinned ? 'Unpin' : 'Pin'} Tab
                </MenuItem>
                <MenuItem onClick={() => { onDuplicate?.(); setAnchorEl(null); }}>
                    <FileCopy sx={{ mr: 1 }} />
                    Duplicate Tab
                </MenuItem>
                <MenuItem onClick={() => { onClose(); setAnchorEl(null); }}>
                    <Close sx={{ mr: 1 }} />
                    Close Tab
                </MenuItem>
            </Menu>
        </Box>
    );
};

// Main Workspace Panel
const WorkspacePanel: React.FC<{
    group: TabGroup;
    onTabSelect: (tabKey: string) => void;
    onTabClose: (tabKey: string) => void;
    onSplit: () => void;
    onMinimize: () => void;
    onClose: () => void;
    onTabPin: (tabKey: string) => void;
    onTabDuplicate: (tabKey: string) => void;
}> = ({ group, onTabSelect, onTabClose, onSplit, onMinimize, onClose, onTabPin, onTabDuplicate }) => {
    const activeTab = group.openTabs.find(tab => tab.key === group.activeTab);

    return (
        <Paper
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {/* Tab Bar */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper'
            }}>
                <Box sx={{
                    display: 'flex',
                    overflowX: 'auto',
                    flexGrow: 1,
                    '&::-webkit-scrollbar': { height: 4 },
                    '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: 'divider', borderRadius: 2 }
                }}>
                    {group.openTabs.map(tab => (
                        <WorkspaceTab
                            key={tab.key}
                            tab={tab}
                            isActive={tab.key === group.activeTab}
                            onSelect={() => onTabSelect(tab.key)}
                            onClose={() => onTabClose(tab.key)}
                            onPin={() => onTabPin(tab.key)}
                            onDuplicate={() => onTabDuplicate(tab.key)}
                        />
                    ))}
                </Box>

                {/* Panel Controls */}
                <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                    <Tooltip title="Split Panel">
                        <IconButton size="small" onClick={onSplit}>
                            <SplitScreen fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Minimize">
                        <IconButton size="small" onClick={onMinimize}>
                            <Minimize fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Close Panel">
                        <IconButton size="small" onClick={onClose}>
                            <Close fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Content Area */}
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {activeTab && group.openTabs.length > 0 ? (
                    <Box sx={{ height: '100%', width: '100%' }}>
                        <Outlet />
                    </Box>
                ) : (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'text.secondary'
                    }}>
                        <Typography variant="h6">
                            {group.openTabs.length === 0 ? 'No tabs open' : 'No active tab'}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

// Main Obsidian-Style Layout
const ObsidianLayout: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { tabGroups, setTabGroups, openTab, closeTab } = useWorkspaceTabs();
    const { openCommandPalette } = useEnhancedCommandPaletteContext();
    const { createNewWorkspace, createMixedWorkspace, recentWorkspaces } = useNotionWorkspace();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
    const [workspaceLayout, setWorkspaceLayout] = useState<'single' | 'split' | 'grid'>('single');

    // Routes that should be displayed directly without tabs
    const directRoutes = ['/settings', '/dashboard', '/analytics', '/calculators', '/advanced-features'];
    const isDirectRoute = directRoutes.includes(location.pathname);

    const handleNewNote = useCallback(() => {
        const tabKey = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        openTab({
            key: tabKey,
            title: 'New Note',
            path: '/notes/new',
            icon: <NoteIcon />,
            isDirty: true,
        });
        navigate('/notes/new');
    }, [openTab, navigate]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                handleNewNote();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
                e.preventDefault();
                setSidebarOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNewNote, setSidebarOpen]);

    const handleNewProject = () => {
        const tabKey = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('Opening new project tab with key:', tabKey);
        openTab({
            key: tabKey,
            title: 'New Project',
            path: '/projects/new',
            icon: <ProjectIcon />,
            isDirty: true,
        });
        console.log('Navigating to /projects/new');
        navigate('/projects/new');
    };

    const handleNewWorkspace = () => {
        createNewWorkspace('New Research Document');
    };

    const handleTabSelect = (groupIdx: number, tabKey: string) => {
        setTabGroups(prev => {
            const groups = [...prev];
            if (groups[groupIdx] && groups[groupIdx].openTabs.some(t => t.key === tabKey)) {
                groups[groupIdx].activeTab = tabKey;
                const activeTab = groups[groupIdx].openTabs.find(t => t.key === tabKey);
                if (activeTab) {
                    navigate(activeTab.path);
                }
            }
            return groups;
        });
    };

    const handleTabClose = (groupIdx: number, tabKey: string) => {
        closeTab(tabKey, groupIdx);
    };

    const handleSplitPanel = () => {
        setWorkspaceLayout('split');
        // Create a new tab group for the split layout
        const newGroupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setTabGroups(prev => {
            const groups = [...prev];
            // Add a new empty tab group
            groups.push({
                id: newGroupId,
                openTabs: [],
                activeTab: null,
                layout: 'vertical',
            });
            return groups;
        });
    };

    const handleTabPin = (groupIdx: number, tabKey: string) => {
        setTabGroups(prev => {
            const groups = [...prev];
            const group = groups[groupIdx];
            if (group) {
                const tab = group.openTabs.find(t => t.key === tabKey);
                if (tab) {
                    tab.isPinned = !tab.isPinned;
                }
            }
            return groups;
        });
    };

    const handleTabDuplicate = (groupIdx: number, tabKey: string) => {
        setTabGroups(prev => {
            const groups = [...prev];
            const group = groups[groupIdx];
            if (group) {
                const tab = group.openTabs.find(t => t.key === tabKey);
                if (tab) {
                    // Create a clean duplicate without potentially large metadata
                    const duplicatedTab: TabData = {
                        key: `${tab.key}-copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        title: `${tab.title} (Copy)`,
                        path: tab.path,
                        icon: tab.icon,
                        lastAccessed: Date.now(),
                        isDirty: false, // Reset dirty state for duplicated tab
                        isPinned: false, // Reset pin state for duplicated tab
                        // Don't copy metadata to prevent memory leaks
                    };
                    group.openTabs.push(duplicatedTab);
                    group.activeTab = duplicatedTab.key;
                    // Navigate to the duplicated tab
                    navigate(duplicatedTab.path);
                }
            }
            return groups;
        });
    };

    const sidebarItems = [
        { key: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { key: 'calendar', label: 'Calendar', icon: <CalendarIcon />, path: '/calendar' },
        { key: 'tasks', label: 'Tasks', icon: <CheckBoxIcon />, path: '/tasks' },
        { key: 'notes', label: 'Notes', icon: <NoteIcon />, path: '/notes' },
        { key: 'workspace', label: 'Mixed Workspace', icon: <Description />, path: '/workspace/new' },
        { key: 'protocols', label: 'Protocols', icon: <ProtocolIcon />, path: '/protocols' },
        { key: 'recipes', label: 'Recipes', icon: <RecipeIcon />, path: '/recipes' },
        { key: 'pdfs', label: 'PDFs', icon: <PdfIcon />, path: '/pdfs' },
        { key: 'projects', label: 'Projects', icon: <ProjectIcon />, path: '/projects' },
        { key: 'experiments', label: 'Experiments', icon: <ProtocolIcon />, path: '/experiments' },
        { key: 'tables', label: 'Tables', icon: <TableIcon />, path: '/tables' },
        { key: 'database', label: 'Database', icon: <DatabaseIcon />, path: '/database' },
        { key: 'literature', label: 'Literature Notes', icon: <JournalIcon />, path: '/literature' },
        { key: 'calculators', label: 'Calculators', icon: <CalculateIcon />, path: '/calculators' },
        { key: 'analytics', label: 'Analytics', icon: <AssessmentIcon />, path: '/analytics' },
        { key: 'experimental-variables', label: 'Variable Tracker', icon: <TimelineIcon />, path: '/experimental-variables' },
        { key: 'search', label: 'Search', icon: <SearchIcon />, path: '/search' },
        { key: 'links', label: 'Links', icon: <LinkIcon />, path: '/links' },
        { key: 'advanced-features', label: 'Advanced Features', icon: <RocketIcon />, path: '/advanced-features' },
        { key: 'advanced-reporting', label: 'Advanced Reporting', icon: <ReportingIcon />, path: '/advanced-reporting' },
    ];

    const handleSidebarItemClick = (item: any) => {
        const tabKey = `${item.key}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        openTab({
            key: tabKey,
            title: item.label,
            path: item.path,
            icon: item.icon,
        });
        setSidebarOpen(false);
        navigate(item.path);
    };



    return (
        <Box sx={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            overflow: 'hidden',
            bgcolor: 'background.default'
        }}>
            {/* Touch Sidebar Handler */}
            <TouchSidebarHandler
                onToggleSidebar={() => setSidebarOpen(prev => !prev)}
                sidebarOpen={sidebarOpen}
            />

            {/* Sidebar */}
            <Drawer
                variant="temporary"
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                PaperProps={{
                    sx: {
                        width: 280,
                        bgcolor: 'background.paper',
                        borderRight: 1,
                        borderColor: 'divider'
                    }
                }}
            >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Research Workspace
                    </Typography>
                </Box>
                <List sx={{ flexGrow: 1, py: 1 }}>
                    {sidebarItems.map((item) => (
                        <ListItem key={item.key} disablePadding>
                            <ListItemButton
                                onClick={() => handleSidebarItemClick(item)}
                                sx={{ mx: 1, borderRadius: 1 }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <Divider />
                <Box sx={{ p: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                        onClick={() => {
                            navigate('/settings');
                            setSidebarOpen(false);
                        }}
                    >
                        Settings
                    </Button>
                </Box>
            </Drawer>

            {/* Main Workspace */}
            <Box sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Top Status Bar */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1,
                    bgcolor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                    minHeight: 48
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                            onClick={() => setSidebarOpen(true)}
                            size="small"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="body2" color="text.secondary">
                            Research Notebook
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ButtonGroup size="small" variant="outlined">
                            <Tooltip title="Single Panel">
                                <IconButton
                                    onClick={() => setWorkspaceLayout('single')}
                                    color={workspaceLayout === 'single' ? 'primary' : 'default'}
                                >
                                    <ViewAgenda />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Split View">
                                <IconButton
                                    onClick={() => setWorkspaceLayout('split')}
                                    color={workspaceLayout === 'split' ? 'primary' : 'default'}
                                >
                                    <ViewColumn />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Grid View">
                                <IconButton
                                    onClick={() => setWorkspaceLayout('grid')}
                                    color={workspaceLayout === 'grid' ? 'primary' : 'default'}
                                >
                                    <ViewQuilt />
                                </IconButton>
                            </Tooltip>
                        </ButtonGroup>

                        <Button
                            variant="text"
                            startIcon={<AccountCircle />}
                            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                            sx={{ textTransform: 'none' }}
                        >
                            {user?.username}
                        </Button>
                        <Menu
                            anchorEl={userMenuAnchor}
                            open={Boolean(userMenuAnchor)}
                            onClose={() => setUserMenuAnchor(null)}
                        >
                            <MenuItem onClick={() => navigate('/settings')}>
                                Settings
                            </MenuItem>
                            <MenuItem onClick={logout}>
                                <Logout sx={{ mr: 1 }} />
                                Logout
                            </MenuItem>
                        </Menu>
                    </Box>
                </Box>

                {/* Content Area */}
                {isDirectRoute ? (
                    // Render direct routes (like Settings) without tabs
                    <Box sx={{
                        flexGrow: 1,
                        overflow: 'auto',
                        p: 2
                    }}>
                        <Outlet />
                    </Box>
                ) : (
                    // Render workspace with tabs for other routes
                    <WorkspaceIntegration>
                        <Box sx={{
                            flexGrow: 1,
                            display: 'flex',
                            overflow: 'hidden',
                            gap: workspaceLayout === 'split' ? 1.5 : 1,
                            p: 1,
                            minHeight: 0
                        }}>
                            {tabGroups.length === 0 ? (
                                <Box sx={{
                                    flexGrow: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    gap: 2
                                }}>
                                    <Typography variant="h4" color="text.secondary" gutterBottom>
                                        Welcome to your Research Workspace
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                        Press Ctrl+K to open the command palette or use the sidebar to get started
                                    </Typography>
                                    <ButtonGroup variant="contained">
                                        <Button startIcon={<NoteIcon />} onClick={handleNewNote}>
                                            New Note
                                        </Button>
                                        <Button startIcon={<ProjectIcon />} onClick={handleNewProject}>
                                            New Project
                                        </Button>
                                        <Button startIcon={<SearchIcon />} onClick={openCommandPalette}>
                                            Search
                                        </Button>
                                    </ButtonGroup>
                                </Box>
                            ) : (
                                tabGroups.map((group, groupIdx) => (
                                    <Box
                                        key={group.id || groupIdx}
                                        sx={{
                                            flex: workspaceLayout === 'split' && tabGroups.length > 1 ? '1 1 0' : 1,
                                            minWidth: workspaceLayout === 'split' ? '400px' : '300px',
                                            maxWidth: workspaceLayout === 'single' ? '100%' : 'none',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <WorkspacePanel
                                            group={group}
                                            onTabSelect={(tabKey) => handleTabSelect(groupIdx, tabKey)}
                                            onTabClose={(tabKey) => handleTabClose(groupIdx, tabKey)}
                                            onSplit={handleSplitPanel}
                                            onMinimize={() => {
                                                setTabGroups(prev => {
                                                    const groups = [...prev];
                                                    if (groups[groupIdx]) {
                                                        groups[groupIdx].isMinimized = !groups[groupIdx].isMinimized;
                                                    }
                                                    return groups;
                                                });
                                            }}
                                            onClose={() => {
                                                setTabGroups(prev => prev.filter((_, idx) => idx !== groupIdx));
                                            }}
                                            onTabPin={(tabKey) => handleTabPin(groupIdx, tabKey)}
                                            onTabDuplicate={(tabKey) => handleTabDuplicate(groupIdx, tabKey)}
                                        />
                                    </Box>
                                ))
                            )}
                        </Box>
                    </WorkspaceIntegration>
                )}
            </Box>

            {/* Floating Action Panel */}
            <FloatingActionPanel
                onNewNote={handleNewNote}
                onNewProject={handleNewProject}
                onNewWorkspace={handleNewWorkspace}
                onSearch={openCommandPalette}
                onCommandPalette={openCommandPalette}
                onFileTree={() => setSidebarOpen(true)}
            />
        </Box>
    );
};

export default ObsidianLayout; 