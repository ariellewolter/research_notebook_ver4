import React, { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import { useWorkspaceTabs } from '../../pages/WorkspaceTabsContext';
import { useNotionWorkspace } from '../../hooks/useNotionWorkspace';
import { getWorkspaceCommands } from './WorkspaceCommands';
import CommandPalette from './CommandPalette';
import {
    Note as NoteIcon,
    Folder as ProjectIcon,
    Dashboard as DashboardIcon,
    Science as ProtocolIcon,
    Storage as DatabaseIcon,
    CalendarToday as CalendarIcon,
    Assessment as AnalyticsIcon,
    Calculate as CalculateIcon,
    Book as LiteratureIcon,
    Search as SearchIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';

interface CommandPaletteContextType {
    isOpen: boolean;
    openCommandPalette: () => void;
    closeCommandPalette: () => void;
    toggleCommandPalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | null>(null);

export const CommandPaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const { openTab } = useWorkspaceTabs();
    const commandPalette = useCommandPalette();
    const { createNewWorkspace, createMixedWorkspace, recentWorkspaces } = useNotionWorkspace();

    const handleNavigate = (path: string) => {
        // Map paths to their corresponding page titles and icons
        const pathMap: Record<string, { title: string; icon: React.ReactNode }> = {
            '/dashboard': { title: 'Dashboard', icon: <DashboardIcon /> },
            '/notes': { title: 'Notes', icon: <NoteIcon /> },
            '/projects': { title: 'Projects', icon: <ProjectIcon /> },
            '/protocols': { title: 'Protocols', icon: <ProtocolIcon /> },
            '/database': { title: 'Database', icon: <DatabaseIcon /> },
            '/calendar': { title: 'Calendar', icon: <CalendarIcon /> },
            '/analytics': { title: 'Analytics', icon: <AnalyticsIcon /> },
            '/calculators': { title: 'Calculators', icon: <CalculateIcon /> },
            '/literature': { title: 'Literature', icon: <LiteratureIcon /> },
            '/search': { title: 'Search', icon: <SearchIcon /> },
            '/settings': { title: 'Settings', icon: <SettingsIcon /> },
        };

        const pageInfo = pathMap[path];
        if (pageInfo) {
            // Open a new tab for the page
            const newTab = {
                key: `${path}-${Date.now()}`,
                title: pageInfo.title,
                path: path,
                icon: pageInfo.icon,
                lastAccessed: Date.now(),
            };
            openTab(newTab);
        }

        navigate(path);
    };

    const handleCreateNote = () => {
        const newTab = {
            key: `note-${Date.now()}`,
            title: 'New Note',
            path: '/notes/new',
            icon: <NoteIcon />,
            isDirty: true,
        };
        openTab(newTab);
        navigate('/notes/new');
    };

    const handleCreateProject = () => {
        const newTab = {
            key: `project-${Date.now()}`,
            title: 'New Project',
            path: '/projects/new',
            icon: <ProjectIcon />,
            isDirty: true,
        };
        openTab(newTab);
        navigate('/projects/new');
    };

    const handleCreateWorkspace = () => {
        createNewWorkspace('New Research Document');
    };

    const handleCreateLabWorkspace = () => {
        createMixedWorkspace('Lab Experiment Workspace');
    };

    // Mock recent items - replace with real data from your app
    const recentItems = [
        { title: 'COVID-19 Research', path: '/projects/covid-19', icon: <ProjectIcon /> },
        { title: 'Daily Notes - March 15', path: '/notes/daily/2024-03-15', icon: <NoteIcon /> },
        { title: 'CRISPR Protocol v2.1', path: '/protocols/crispr-v2', icon: <NoteIcon /> },
    ];

    // Get workspace commands
    const workspaceCommands = getWorkspaceCommands(
        createNewWorkspace,
        createMixedWorkspace,
        recentWorkspaces
    );

    return (
        <CommandPaletteContext.Provider value={commandPalette}>
            {children}
            <CommandPalette
                open={commandPalette.isOpen}
                onClose={commandPalette.closeCommandPalette}
                onNavigate={handleNavigate}
                onCreateNote={handleCreateNote}
                onCreateProject={handleCreateProject}
                onCreateWorkspace={handleCreateWorkspace}
                onCreateLabWorkspace={handleCreateLabWorkspace}
                recentItems={recentItems}
                workspaceCommands={workspaceCommands}
            />
        </CommandPaletteContext.Provider>
    );
};

export const useCommandPaletteContext = () => {
    const context = useContext(CommandPaletteContext);
    if (!context) {
        throw new Error('useCommandPaletteContext must be used within CommandPaletteProvider');
    }
    return context;
}; 