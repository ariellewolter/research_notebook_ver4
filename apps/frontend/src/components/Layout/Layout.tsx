import React, { useState } from 'react';
import {
    AppBar,
    Box,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Divider,
    Button,
    Avatar,
    Menu,
    MenuItem,
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
    FileDownload as FileDownloadIcon,
    Timeline as TimelineIcon,
    Assessment as AssessmentIcon,
    Link as LinkIcon,
    ViewColumn as WorkspaceIcon,
} from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import SearchBar from '../Search/SearchBar';
import AdvancedSearch from '../Search/AdvancedSearch';
import DataExport from '../Export/DataExport';
import GanttChartExport from '../Export/GanttChartExport';
import ResearchTimelineExport from '../Export/ResearchTimelineExport';
import NotificationCenter from '../Notifications/NotificationCenter';
import { useTheme } from '@mui/material/styles';
import { useWorkspaceTabs } from '../../pages/WorkspaceTabsContext';
import { createNoteTab, createProjectTab, createProtocolTab, createDatabaseEntryTab } from '../../services/tabUtils';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;



const Layout: React.FC = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});
    const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
    const [dataExportOpen, setDataExportOpen] = useState(false);
    const [ganttChartOpen, setGanttChartOpen] = useState(false);
    const [researchTimelineOpen, setResearchTimelineOpen] = useState(false);
    const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { openTab } = useWorkspaceTabs();
    const { user, logout } = useAuth();

    const scienceMenuSections = [
        {
            key: 'workspace',
            label: 'Workspace',
            icon: <WorkspaceIcon fontSize="large" />,
            path: '/workspace',
        },
        {
            key: 'dashboard',
            label: 'Dashboard',
            icon: <DashboardIcon fontSize="large" />,
            path: '/dashboard',
        },
        {
            key: 'calendar',
            label: 'Calendar',
            icon: <CalendarIcon fontSize="large" />,
            path: '/calendar',
        },
        {
            key: 'tasks',
            label: 'Tasks',
            icon: <CheckBoxIcon fontSize="large" />, // Tasks icon
            path: '/tasks',
        },
        {
            key: 'notes',
            label: 'Notes',
            icon: <NoteIcon fontSize="large" />,
            path: '/notes',
        },
        {
            key: 'protocols',
            label: 'Protocols',
            icon: <ProtocolIcon fontSize="large" />,
            path: '/protocols',
        },
        {
            key: 'recipes',
            label: 'Recipes',
            icon: <RecipeIcon fontSize="large" />,
            path: '/recipes',
        },
        {
            key: 'pdfs',
            label: 'PDFs',
            icon: <PdfIcon fontSize="large" />,
            path: '/pdfs',
        },
        {
            key: 'projects',
            label: 'Projects',
            icon: <ProjectIcon fontSize="large" />,
            path: '/projects',
        },
        {
            key: 'experiments',
            label: 'Experiments',
            icon: <ProtocolIcon fontSize="large" />, // or use a different icon if preferred
            path: '/experiments',
        },
        {
            key: 'tables',
            label: 'Tables',
            icon: <TableIcon fontSize="large" />,
            path: '/tables',
        },
        {
            key: 'database',
            label: 'Database',
            icon: <DatabaseIcon fontSize="large" />,
            path: '/database',
        },
        {
            key: 'literature',
            label: 'Literature Notes',
            icon: <JournalIcon fontSize="large" />, // or use LibraryBooks if preferred
            path: '/literature',
        },
        {
            key: 'calculators',
            label: 'Calculators',
            icon: <CalculateIcon fontSize="large" />,
            path: '/calculators',
        },
        {
            key: 'analytics',
            label: 'Analytics',
            icon: <AssessmentIcon fontSize="large" />,
            path: '/analytics',
        },
        {
            key: 'search',
            label: 'Search',
            icon: <SearchIcon fontSize="large" />,
            path: '/search',
        },
        {
            key: 'links',
            label: 'Links',
            icon: <LinkIcon fontSize="large" />,
            path: '/links',
        },
    ] as const;

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };
    const handleSidebarCollapse = () => {
        setSidebarCollapsed((prev) => !prev);
    };
    const handleSectionToggle = (key: string) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    const handleNavigation = (path: string) => {
        navigate(path);
        setMobileOpen(false);
    };

    const handleSidebarItemClick = (section: any) => {
        // For now, just navigate to the route
        // In the future, we can open specific entities in tabs
        navigate(section.path);
    };

    const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setUserMenuAnchor(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setUserMenuAnchor(null);
    };

    const handleLogout = () => {
        logout();
        handleUserMenuClose();
    };

    // Sidebar content
    const sidebarContent = (
        <div style={{ background: theme.palette.background.paper, height: '100%', color: theme.palette.text.primary, display: 'flex', flexDirection: 'column' }}>
            <List sx={{ flex: 1, py: 2 }}>
                {scienceMenuSections.map((section) => (
                    <React.Fragment key={section.key}>
                        <Tooltip title={section.label} placement="right" arrow disableHoverListener={!sidebarCollapsed}>
                            <ListItem disablePadding sx={{ display: 'block', mb: sidebarCollapsed ? 2.5 : 0 }}>
                                <ListItemButton
                                    selected={location.pathname === section.path}
                                    onClick={() => handleSidebarItemClick(section)}
                                    sx={{
                                        minHeight: 48,
                                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                        px: 2.5,
                                        borderRadius: 2,
                                        mb: sidebarCollapsed ? 2.5 : 0,
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            mr: sidebarCollapsed ? 0 : 2,
                                            justifyContent: 'center',
                                            color: theme.palette.text.primary,
                                        }}
                                    >
                                        {section.icon}
                                    </ListItemIcon>
                                    {!sidebarCollapsed && <ListItemText primary={section.label} />}
                                </ListItemButton>
                            </ListItem>
                        </Tooltip>
                    </React.Fragment>
                ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <List>
                <Tooltip title="Settings" placement="right" arrow disableHoverListener={!sidebarCollapsed}>
                    <ListItem disablePadding sx={{ display: 'block' }}>
                        <ListItemButton
                            selected={location.pathname === '/settings'}
                            onClick={() => handleNavigation('/settings')}
                            sx={{
                                minHeight: 48,
                                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                px: 2.5,
                                borderRadius: 2,
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: sidebarCollapsed ? 0 : 2,
                                    justifyContent: 'center',
                                    color: theme.palette.text.primary,
                                }}
                            >
                                <SettingsIcon />
                            </ListItemIcon>
                            {!sidebarCollapsed && <ListItemText primary="Settings" />}
                        </ListItemButton>
                    </ListItem>
                </Tooltip>
            </List>
        </div>
    );

    // Check if we're on the NotionWorkspace (root path or notion-workspace path)
    const isNotionWorkspace = location.pathname === '/' || location.pathname === '/notion-workspace';

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: isNotionWorkspace ? '100%' : `calc(100% - ${sidebarCollapsed ? 64 : drawerWidth}px)` },
                    ml: { sm: isNotionWorkspace ? 0 : `${sidebarCollapsed ? 64 : drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ mr: 3, minWidth: { xs: 120, sm: 200 } }}>
                        Electronic Lab Notebook
                    </Typography>
                    {!isNotionWorkspace && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate('/')}
                            startIcon={<WorkspaceIcon />}
                            sx={{ mr: 2, color: 'inherit', borderColor: 'inherit' }}
                        >
                            Back to Workspace
                        </Button>
                    )}
                    {/* Search Bar */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }}>
                        <SearchBar />
                    </Box>
                    <IconButton
                        color="inherit"
                        onClick={() => setAdvancedSearchOpen(true)}
                        sx={{ ml: 1, display: { xs: 'none', sm: 'flex' } }}
                    >
                        <SearchIcon />
                    </IconButton>
                    <IconButton
                        color="inherit"
                        onClick={() => setDataExportOpen(true)}
                        sx={{ ml: 1, display: { xs: 'none', sm: 'flex' } }}
                    >
                        <FileDownloadIcon />
                    </IconButton>
                    <IconButton
                        color="inherit"
                        onClick={() => setGanttChartOpen(true)}
                        sx={{ ml: 1, display: { xs: 'none', sm: 'flex' } }}
                    >
                        <TimelineIcon />
                    </IconButton>
                    <IconButton
                        color="inherit"
                        onClick={() => setResearchTimelineOpen(true)}
                        sx={{ ml: 1, display: { xs: 'none', sm: 'flex' } }}
                    >
                        <AssessmentIcon />
                    </IconButton>
                    <NotificationCenter />

                    {/* User Menu */}
                    <Box sx={{ ml: 2 }}>
                        <Button
                            onClick={handleUserMenuOpen}
                            sx={{ color: 'inherit', textTransform: 'none' }}
                            startIcon={
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                    {user?.username?.charAt(0).toUpperCase()}
                                </Avatar>
                            }
                        >
                            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                {user?.username}
                            </Typography>
                        </Button>
                        <Menu
                            anchorEl={userMenuAnchor}
                            open={Boolean(userMenuAnchor)}
                            onClose={handleUserMenuClose}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                        >
                            <MenuItem onClick={() => navigate('/settings')}>
                                Settings
                            </MenuItem>
                            <MenuItem onClick={handleLogout}>
                                Logout
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>
            {!isNotionWorkspace && (
                <Box
                    component="nav"
                    sx={{ width: { sm: sidebarCollapsed ? 64 : drawerWidth }, flexShrink: { sm: 0 } }}
                >
                    {/* Mobile Drawer */}
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{
                            keepMounted: true, // Better open performance on mobile.
                        }}
                        sx={{
                            display: { xs: 'block', sm: 'none' },
                            '& .MuiDrawer-paper': {
                                boxSizing: 'border-box',
                                width: drawerWidth,
                                background: theme.palette.background.paper,
                                color: theme.palette.text.primary,
                            },
                        }}
                    >
                        {sidebarContent}
                    </Drawer>

                    {/* Desktop Drawer */}
                    <Drawer
                        variant="permanent"
                        sx={{
                            display: { xs: 'none', sm: 'block' },
                            '& .MuiDrawer-paper': {
                                boxSizing: 'border-box',
                                width: sidebarCollapsed ? 64 : drawerWidth,
                                background: theme.palette.background.paper,
                                color: theme.palette.text.primary,
                                transition: 'width 0.2s',
                                overflowX: 'hidden',
                            },
                        }}
                        open
                    >
                        {sidebarContent}
                    </Drawer>
                </Box>
            )}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { sm: isNotionWorkspace ? '100%' : `calc(100% - ${sidebarCollapsed ? 64 : drawerWidth}px)` },
                    p: { xs: 1, sm: isNotionWorkspace ? 0 : 2 },
                }}
            >
                <Toolbar />
                <Box sx={{
                    maxWidth: '100%',
                    overflowX: 'auto',
                    '& .MuiGrid-container': {
                        margin: { xs: 0, sm: 'auto' },
                    }
                }}>
                    <Outlet />
                </Box>
            </Box>

            {advancedSearchOpen && (
                <Box sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'background.paper',
                    zIndex: 1300,
                    overflow: 'auto'
                }}>
                    <Box sx={{
                        position: 'sticky',
                        top: 0,
                        bgcolor: 'background.paper',
                        borderBottom: 1,
                        borderColor: 'divider',
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Typography variant="h6">Advanced Search</Typography>
                        <Button onClick={() => setAdvancedSearchOpen(false)}>Close</Button>
                    </Box>
                    <AdvancedSearch
                        onResultSelect={(result) => {
                            setAdvancedSearchOpen(false);
                            // Navigate to the appropriate page based on result type
                            switch (result.type) {
                                case 'note':
                                    navigate(`/notes`);
                                    break;
                                case 'project':
                                    navigate(`/projects`);
                                    break;
                                case 'protocol':
                                    navigate(`/protocols`);
                                    break;
                                case 'recipe':
                                    navigate(`/recipes`);
                                    break;
                                case 'database':
                                    navigate(`/database`);
                                    break;
                                case 'pdf':
                                    navigate(`/pdfs`);
                                    break;
                                case 'table':
                                    navigate(`/tables`);
                                    break;
                                case 'task':
                                    navigate(`/tasks`);
                                    break;
                                case 'literature':
                                    navigate(`/literature`);
                                    break;
                                default:
                                    navigate(`/`);
                            }
                        }}
                    />
                </Box>
            )}
            <DataExport
                open={dataExportOpen}
                onClose={() => setDataExportOpen(false)}
            />
            <GanttChartExport
                open={ganttChartOpen}
                onClose={() => setGanttChartOpen(false)}
                projects={[]}
                experiments={[]}
                protocols={[]}
                tasks={[]}
            />
            <ResearchTimelineExport
                open={researchTimelineOpen}
                onClose={() => setResearchTimelineOpen(false)}
                projects={[]}
                experiments={[]}
                protocols={[]}
                tasks={[]}
            />
        </Box>
    );
};

export default Layout;