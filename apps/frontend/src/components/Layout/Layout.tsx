import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    AccountCircle as AccountIcon,
    Settings as SettingsIcon,
    Search as SearchIcon
} from '@mui/icons-material';

// Import our new UI components
import { Button, Card, Input, PanelLayout, SidebarNav } from '../UI/index.js';

// Import the refactored sidebar
import RefactoredSidebar from './Sidebar';

const ResearchNotebookLayout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const location = useLocation();

    // Get page title based on current route
    const getPageTitle = () => {
        const path = location.pathname;
        const titleMap = {
            '/dashboard': 'Dashboard',
            '/notes': 'Notes',
            '/journal': 'Journal',
            '/calendar': 'Calendar',
            '/projects': 'Projects',
            '/pdfs': 'PDF Documents',
            '/database': 'Database',
            '/tables': 'Tables',
            '/protocols': 'Protocols',
            '/recipes': 'Recipes',
            '/zotero': 'Zotero Integration',
            '/search': 'Advanced Search',
            '/calculator': 'Calculator',
            '/tasks': 'Tasks',
            '/export': 'Export Data',
            '/timeline': 'Timeline',
            '/analytics': 'Analytics',
            '/links': 'Link Manager',
            '/settings': 'Settings'
        };
        return titleMap[path] || 'Research Notebook';
    };

    // Top Navigation Bar Component
    const TopNavigation = () => (
        <Card variant="flat" className="border-b border-gray-200 rounded-none">
            <Card.Content padding="sm">
                <div className="flex items-center justify-between h-12">
                    {/* Left side - Menu toggle for mobile */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="lg:hidden p-2"
                        >
                            <MenuIcon className="w-5 h-5" />
                        </Button>

                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold text-gray-900">
                                {getPageTitle()}
                            </h1>
                            {location.pathname !== '/dashboard' && (
                                <span className="text-sm text-gray-500">
                                    • Research Notebook
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Center - Global Search */}
                    <div className="flex-1 max-w-md mx-4">
                        {showSearch ? (
                            <Input
                                placeholder="Search across all content..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                                onBlur={() => {
                                    if (!searchTerm) setShowSearch(false);
                                }}
                                autoFocus
                            />
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setShowSearch(true)}
                                className="w-full justify-start text-gray-500"
                            >
                                <SearchIcon className="w-4 h-4 mr-2" />
                                Search...
                            </Button>
                        )}
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="relative p-2"
                            onClick={() => {
                                // TODO: Implement notification center
                                console.log('Open notification center');
                            }}
                        >
                            <NotificationsIcon className="w-5 h-5" />
                            {notifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {notifications.length}
                                </span>
                            )}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                            onClick={() => {
                                // TODO: Implement account settings
                                console.log('Open account settings');
                            }}
                        >
                            <AccountIcon className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </Card.Content>
        </Card>
    );

    // Sidebar Panel
    const sidebarPanel = (
        <div className={`h-full transition-all duration-200 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
            <RefactoredSidebar />
        </div>
    );

    // Main Content Panel
    const mainContentPanel = (
        <PanelLayout.Panel className="h-full bg-gray-50" scrollable={false}>
            {/* Top Navigation */}
            <div className="flex-shrink-0">
                <TopNavigation />
            </div>

            {/* Page Content */}
            <div className="flex-1 overflow-hidden">
                <Outlet />
            </div>
        </PanelLayout.Panel>
    );

    return (
        <div className="h-screen bg-white">
            <PanelLayout
                leftPanel={sidebarPanel}
                rightPanel={mainContentPanel}
                leftSize="sm"
                className="h-full"
                leftClassName="border-r border-gray-200"
            />
        </div>
    );
};

// Enhanced Layout for Dual-Pane Views (like Notes, PDFs)
export const DualPaneLayout = ({
    leftPanel,
    rightPanel,
    leftTitle,
    rightTitle,
    leftActions,
    rightActions,
    leftSize = 'sm'
}: {
    leftPanel: React.ReactNode;
    rightPanel: React.ReactNode;
    leftTitle?: string;
    rightTitle?: string;
    leftActions?: React.ReactNode;
    rightActions?: React.ReactNode;
    leftSize?: 'sm' | 'default' | 'lg';
}) => {
    return (
        <div className="h-full p-4">
            <PanelLayout
                leftPanel={
                    <Card className="h-full">
                        {leftTitle && (
                            <Card.Header>
                                <div className="flex items-center justify-between">
                                    <Card.Title>{leftTitle}</Card.Title>
                                    {leftActions && (
                                        <div className="flex gap-2">
                                            {leftActions}
                                        </div>
                                    )}
                                </div>
                            </Card.Header>
                        )}
                        <Card.Content padding="none" className="h-full">
                            {leftPanel}
                        </Card.Content>
                    </Card>
                }
                rightPanel={
                    <Card className="h-full">
                        {rightTitle && (
                            <Card.Header>
                                <div className="flex items-center justify-between">
                                    <Card.Title>{rightTitle}</Card.Title>
                                    {rightActions && (
                                        <div className="flex gap-2">
                                            {rightActions}
                                        </div>
                                    )}
                                </div>
                            </Card.Header>
                        )}
                        <Card.Content padding="none" className="h-full">
                            {rightPanel}
                        </Card.Content>
                    </Card>
                }
                leftSize={leftSize}
                className="h-full gap-4"
            />
        </div>
    );
};

// Single Panel Layout for simple views
export const SinglePanelLayout = ({
    children,
    title,
    actions,
    padding = 'default'
}: {
    children: React.ReactNode;
    title?: string;
    actions?: React.ReactNode;
    padding?: 'none' | 'sm' | 'default' | 'lg';
}) => {
    return (
        <div className="h-full p-4">
            <Card className="h-full">
                {title && (
                    <Card.Header>
                        <div className="flex items-center justify-between">
                            <Card.Title>{title}</Card.Title>
                            {actions && (
                                <div className="flex gap-2">
                                    {actions}
                                </div>
                            )}
                        </div>
                    </Card.Header>
                )}
                <Card.Content padding={padding} className="h-full">
                    {children}
                </Card.Content>
            </Card>
        </div>
    );
};

// Grid Layout for dashboard-style views
export const GridLayout = ({
    children,
    title,
    actions,
    columns = 'auto'
}: {
    children: React.ReactNode;
    title?: string;
    actions?: React.ReactNode;
    columns?: 'auto' | '1' | '2' | '3' | '4';
}) => {
    const gridClasses = {
        'auto': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        '1': 'grid-cols-1',
        '2': 'grid-cols-1 md:grid-cols-2',
        '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    };

    return (
        <div className="h-full p-4">
            <Card className="h-full">
                {title && (
                    <Card.Header>
                        <div className="flex items-center justify-between">
                            <Card.Title>{title}</Card.Title>
                            {actions && (
                                <div className="flex gap-2">
                                    {actions}
                                </div>
                            )}
                        </div>
                    </Card.Header>
                )}
                <Card.Content className="h-full overflow-auto">
                    <div className={`grid gap-4 ${gridClasses[columns]}`}>
                        {children}
                    </div>
                </Card.Content>
            </Card>
        </div>
    );
};

// Responsive Layout Component that adapts based on screen size
export const ResponsiveLayout = ({
    children,
    breakpoint = 'lg',
    mobileLayout = 'stack',
    desktopLayout = 'dual'
}: {
    children: React.ReactNode;
    breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
    mobileLayout?: 'stack' | 'tabs';
    desktopLayout?: 'dual' | 'single';
}) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 };
            setIsMobile(window.innerWidth < breakpoints[breakpoint]);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, [breakpoint]);

    if (isMobile && mobileLayout === 'stack') {
        return (
            <div className="h-full flex flex-col">
                {children}
            </div>
        );
    }

    return (
        <div className="h-full">
            {children}
        </div>
    );
};

export default ResearchNotebookLayout;