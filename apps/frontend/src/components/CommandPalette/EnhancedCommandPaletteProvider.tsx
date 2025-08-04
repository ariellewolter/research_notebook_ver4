import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceTabs } from '../../pages/WorkspaceTabsContext';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import { useNotionWorkspace } from '../../hooks/useNotionWorkspace';
import EnhancedCommandPalette from './EnhancedCommandPalette';

// Icons
import {
    Dashboard as DashboardIcon,
    Note as NoteIcon,
    Assignment as ProjectIcon,
    Science as ProtocolIcon,
    Storage as DatabaseIcon,
    CalendarToday as CalendarIcon,
    Analytics as AnalyticsIcon,
    Calculate as CalculateIcon,
    MenuBook as LiteratureIcon,
    Search as SearchIcon,
    Settings as SettingsIcon,
    Task as TaskIcon,
    PictureAsPdf as PdfIcon,
    Restaurant as RecipeIcon,
    Add as AddIcon,
    FileUpload as ImportIcon,
    FileDownload as ExportIcon,
    Settings as SettingsIcon2
} from '@mui/icons-material';

interface CommandPaletteContextType {
    isOpen: boolean;
    openCommandPalette: () => void;
    closeCommandPalette: () => void;
    toggleCommandPalette: () => void;
    addRecentItem: (item: { title: string; path: string; icon: React.ReactNode; id?: string; type?: string }) => void;
    getRecentItems: () => Array<{ title: string; path: string; icon: React.ReactNode; id?: string; type?: string }>;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | null>(null);

// Wrapper component that provides navigation
export const CommandPaletteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    return <EnhancedCommandPaletteProvider navigate={navigate}>{children}</EnhancedCommandPaletteProvider>;
};

export const EnhancedCommandPaletteProvider: React.FC<{ 
    children: React.ReactNode;
    navigate?: (path: string) => void;
}> = ({ children, navigate }) => {
    const { openTab } = useWorkspaceTabs();
    const commandPalette = useCommandPalette();
    const { createNewWorkspace, createMixedWorkspace, recentWorkspaces } = useNotionWorkspace();
    
    // State for recent items and searchable items
    const [recentItems, setRecentItems] = useState<Array<{ title: string; path: string; icon: React.ReactNode; id?: string; type?: string }>>([]);
    const [searchableItems, setSearchableItems] = useState<Array<{
        id: string;
        title: string;
        type: 'note' | 'project' | 'pdf' | 'protocol' | 'recipe' | 'task';
        path: string;
        lastModified?: Date;
        tags?: string[];
    }>>([]);

    // Load recent items from localStorage on mount
    useEffect(() => {
        const savedRecentItems = localStorage.getItem('commandPaletteRecentItems');
        if (savedRecentItems) {
            try {
                const parsed = JSON.parse(savedRecentItems);
                setRecentItems(parsed.slice(0, 10)); // Keep only last 10 items
            } catch (error) {
                console.warn('Failed to parse recent items from localStorage:', error);
            }
        }
    }, []);

    // Load searchable items from localStorage on mount
    useEffect(() => {
        const savedSearchableItems = localStorage.getItem('commandPaletteSearchableItems');
        if (savedSearchableItems) {
            try {
                const parsed = JSON.parse(savedSearchableItems);
                setSearchableItems(parsed);
            } catch (error) {
                console.warn('Failed to parse searchable items from localStorage:', error);
            }
        }
    }, []);

    // Add recent item function
    const addRecentItem = (item: { title: string; path: string; icon: React.ReactNode; id?: string; type?: string }) => {
        setRecentItems(prev => {
            const newItems = [item, ...prev.filter(existing => existing.path !== item.path)].slice(0, 10);
            localStorage.setItem('commandPaletteRecentItems', JSON.stringify(newItems));
            return newItems;
        });
    };

    // Get recent items function
    const getRecentItems = () => recentItems;

    // Add searchable item function
    const addSearchableItem = (item: {
        id: string;
        title: string;
        type: 'note' | 'project' | 'pdf' | 'protocol' | 'recipe' | 'task';
        path: string;
        lastModified?: Date;
        tags?: string[];
    }) => {
        setSearchableItems(prev => {
            const newItems = [item, ...prev.filter(existing => existing.id !== item.id)];
            localStorage.setItem('commandPaletteSearchableItems', JSON.stringify(newItems));
            return newItems;
        });
    };

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
            '/tasks': { title: 'Tasks', icon: <TaskIcon /> },
            '/pdfs': { title: 'PDFs', icon: <PdfIcon /> },
            '/recipes': { title: 'Recipes', icon: <RecipeIcon /> },
        };

        const pageInfo = pathMap[path];
        if (pageInfo) {
            // Add to recent items
            addRecentItem({
                title: pageInfo.title,
                path: path,
                icon: pageInfo.icon,
                type: path.split('/')[1] as any
            });

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

        navigate?.(path);
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
        navigate?.(`/notes/new`);
        
        // Add to recent items
        addRecentItem({
            title: 'New Note',
            path: '/notes/new',
            icon: <NoteIcon />,
            type: 'note'
        });
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
        navigate?.(`/projects/new`);
        
        // Add to recent items
        addRecentItem({
            title: 'New Project',
            path: '/projects/new',
            icon: <ProjectIcon />,
            type: 'project'
        });
    };

    const handleCreateWorkspace = () => {
        createNewWorkspace('New Research Document');
    };

    const handleCreateLabWorkspace = () => {
        createMixedWorkspace('Lab Experiment Workspace');
    };

    // Enhanced action handlers
    const handleImportFile = () => {
        // Trigger file import dialog
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.pdf,.txt,.doc,.docx,.csv,.json';
        input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                // Handle file import logic here
                console.log('Importing files:', files);
                // You can add the imported files to searchable items
                Array.from(files).forEach(file => {
                    addSearchableItem({
                        id: `file-${Date.now()}-${Math.random()}`,
                        title: file.name,
                        type: file.type.includes('pdf') ? 'pdf' : 'note',
                        path: `/files/${file.name}`,
                        lastModified: new Date(file.lastModified),
                        tags: ['imported']
                    });
                });
            }
        };
        input.click();
    };

    const handleExportProject = () => {
        // Trigger export dialog
        console.log('Export project functionality');
        // Add export logic here
    };

    const handleOpenSettings = () => {
        navigate?.(`/settings`);
        addRecentItem({
            title: 'Settings',
            path: '/settings',
            icon: <SettingsIcon />,
            type: 'settings'
        });
    };

    const handleSearch = (query: string) => {
        navigate?.(`/search?q=${encodeURIComponent(query)}`);
    };

    // Get workspace commands
    const workspaceCommands = [
        {
            id: 'create-workspace',
            title: 'Create New Workspace',
            subtitle: 'Start a new workspace',
            icon: <AddIcon />,
            action: handleCreateWorkspace,
            category: 'create',
            keywords: ['workspace', 'new', 'create', 'start']
        },
        {
            id: 'create-lab-workspace',
            title: 'Create Lab Workspace',
            subtitle: 'Start a new lab workspace',
            icon: <ProtocolIcon />,
            action: handleCreateLabWorkspace,
            category: 'create',
            keywords: ['lab', 'workspace', 'new', 'create', 'start']
        }
    ];

    // Mock recent items - replace with real data from your app
    const mockRecentItems = [
        { title: 'COVID-19 Research', path: '/projects/covid-19', icon: <ProjectIcon />, type: 'project' },
        { title: 'Daily Notes - March 15', path: '/notes/daily/2024-03-15', icon: <NoteIcon />, type: 'note' },
        { title: 'CRISPR Protocol v2.1', path: '/protocols/crispr-v2', icon: <ProtocolIcon />, type: 'protocol' },
    ];

    // Mock searchable items - replace with real data from your app
    const mockSearchableItems = [
        {
            id: 'note-1',
            title: 'Lab Notes - March 15',
            type: 'note' as const,
            path: '/notes/lab-notes-march-15',
            lastModified: new Date('2024-03-15'),
            tags: ['lab', 'daily', 'experiment']
        },
        {
            id: 'project-1',
            title: 'COVID-19 Research Project',
            type: 'project' as const,
            path: '/projects/covid-19',
            lastModified: new Date('2024-03-14'),
            tags: ['research', 'covid', 'virology']
        },
        {
            id: 'pdf-1',
            title: 'Research Paper - CRISPR Applications',
            type: 'pdf' as const,
            path: '/pdfs/crispr-applications',
            lastModified: new Date('2024-03-13'),
            tags: ['crispr', 'research', 'paper']
        },
        {
            id: 'protocol-1',
            title: 'DNA Extraction Protocol',
            type: 'protocol' as const,
            path: '/protocols/dna-extraction',
            lastModified: new Date('2024-03-12'),
            tags: ['dna', 'extraction', 'protocol']
        },
        {
            id: 'recipe-1',
            title: 'PCR Master Mix Recipe',
            type: 'recipe' as const,
            path: '/recipes/pcr-master-mix',
            lastModified: new Date('2024-03-11'),
            tags: ['pcr', 'master mix', 'recipe']
        },
        {
            id: 'task-1',
            title: 'Review Literature for CRISPR Project',
            type: 'task' as const,
            path: '/tasks/review-literature',
            lastModified: new Date('2024-03-10'),
            tags: ['literature', 'review', 'crispr']
        }
    ];

    // Combine mock data with stored data
    const allRecentItems = [...recentItems, ...mockRecentItems].slice(0, 10);
    const allSearchableItems = [...searchableItems, ...mockSearchableItems];

    return (
        <CommandPaletteContext.Provider value={{
            ...commandPalette,
            addRecentItem,
            getRecentItems
        }}>
            {children}
            <EnhancedCommandPalette
                open={commandPalette.isOpen}
                onClose={commandPalette.closeCommandPalette}
                onNavigate={handleNavigate}
                onCreateNote={handleCreateNote}
                onCreateProject={handleCreateProject}
                onCreateWorkspace={handleCreateWorkspace}
                onCreateLabWorkspace={handleCreateLabWorkspace}
                recentItems={allRecentItems}
                workspaceCommands={workspaceCommands}
                onImportFile={handleImportFile}
                onExportProject={handleExportProject}
                onOpenSettings={handleOpenSettings}
                onSearch={handleSearch}
                items={allSearchableItems}
            />
        </CommandPaletteContext.Provider>
    );
};

export const useEnhancedCommandPaletteContext = () => {
    const context = useContext(CommandPaletteContext);
    if (!context) {
        throw new Error('useEnhancedCommandPaletteContext must be used within EnhancedCommandPaletteProvider');
    }
    return context;
}; 