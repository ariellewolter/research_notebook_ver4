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
} from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import SearchBar from '../Search/SearchBar';
import { useTheme } from '@mui/material/styles';
import { useWorkspaceTabs } from '../../pages/WorkspaceTabsContext';
import Notes from '../../pages/Notes';
import Protocols from '../../pages/Protocols';
import Recipes from '../../pages/Recipes';
import PDFs from '../../pages/PDFs';
import Projects from '../../pages/Projects';
import Tables from '../../pages/Tables';
import Database from '../../pages/Database';
import { ProtocolsTabWrapper, RecipesTabWrapper, PDFsTabWrapper, ProjectsTabWrapper, TablesTabWrapper, DatabaseTabWrapper, LiteratureNotesTabWrapper } from '../../pages/WorkspaceTabWrappers';

const drawerWidth = 240;

const workspaceTabMap = {
    notes: { key: 'notes', label: 'Notes', component: Notes },
    protocols: { key: 'protocols', label: 'Protocols', component: ProtocolsTabWrapper },
    recipes: { key: 'recipes', label: 'Recipes', component: RecipesTabWrapper },
    pdfs: { key: 'pdfs', label: 'PDFs', component: PDFsTabWrapper },
    projects: { key: 'projects', label: 'Projects', component: ProjectsTabWrapper },
    tables: { key: 'tables', label: 'Tables', component: TablesTabWrapper },
    database: { key: 'database', label: 'Database', component: DatabaseTabWrapper },
    literature: { key: 'literature', label: 'Literature Notes', component: LiteratureNotesTabWrapper },
} as const;

const Layout: React.FC = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { openTab } = useWorkspaceTabs();

    const scienceMenuSections = [
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

    const handleSidebarItemClick = (section: typeof scienceMenuSections[number]) => {
        const key = section.key as string;
        if (key in workspaceTabMap) {
            openTab(workspaceTabMap[key as keyof typeof workspaceTabMap]);
            navigate('/');
            setMobileOpen(false);
        } else {
            handleNavigation(section.path);
        }
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

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${sidebarCollapsed ? 64 : drawerWidth}px)` },
                    ml: { sm: `${sidebarCollapsed ? 64 : drawerWidth}px` },
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
                    <Typography variant="h6" noWrap component="div" sx={{ mr: 3, minWidth: 200 }}>
                        Electronic Lab Notebook
                    </Typography>
                    {/* Search Bar */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }}>
                        <SearchBar />
                    </Box>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: sidebarCollapsed ? 64 : drawerWidth }, flexShrink: { sm: 0 } }}
            >
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
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { sm: `calc(100% - ${sidebarCollapsed ? 64 : drawerWidth}px)` },
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;