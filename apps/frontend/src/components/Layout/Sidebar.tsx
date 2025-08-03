import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
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
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Description as DocumentIcon,
    FolderOpen as FolderOpenIcon,
    Rocket as RocketIcon,
    Schedule as TimeBlockingIcon,
} from '@mui/icons-material';

// Import our new UI components
import { Button, SidebarNav } from '../UI/index.js';

const RefactoredSidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['workspace', 'projects', 'research']));
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([]));
    const [expandedMainSections, setExpandedMainSections] = useState<Set<string>>(new Set(['Main', 'Research', 'Lab Resources', 'Tools', 'Pages']));
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    const toggleFolder = (folderId: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    const toggleSection = (sectionId: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    };

    const toggleMainSection = (sectionName: string) => {
        const newExpanded = new Set(expandedMainSections);
        if (newExpanded.has(sectionName)) {
            newExpanded.delete(sectionName);
        } else {
            newExpanded.add(sectionName);
        }
        setExpandedMainSections(newExpanded);
    };

    // Workspace file tree data
    const workspaceTree = [
        {
            id: 'workspace',
            name: 'Workspace',
            type: 'folder',
            icon: FolderOpenIcon,
            children: [
                { id: 'welcome', name: 'Welcome to Your Workspace', type: 'document', icon: DocumentIcon, path: '/workspace/welcome' }
            ]
        },
        {
            id: 'projects',
            name: 'Projects',
            type: 'folder',
            icon: FolderOpenIcon,
            children: [
                { id: 'project-alpha', name: 'Project Alpha', type: 'document', icon: DocumentIcon, path: '/projects/alpha' },
                { id: 'project-beta', name: 'Project Beta', type: 'document', icon: DocumentIcon, path: '/projects/beta' }
            ]
        },
        {
            id: 'research',
            name: 'Research',
            type: 'folder',
            icon: FolderOpenIcon,
            children: [
                { id: 'literature-review', name: 'Literature Review', type: 'document', icon: DocumentIcon, path: '/research/literature' },
                { id: 'experiment-notes', name: 'Experiment Notes', type: 'document', icon: DocumentIcon, path: '/research/experiments' },
                { id: 'data-analysis', name: 'Data Analysis', type: 'document', icon: DocumentIcon, path: '/research/analysis' }
            ]
        },
        {
            id: 'protocols',
            name: 'Protocols',
            type: 'folder',
            icon: FolderOpenIcon,
            children: []
        }
    ];

    const navigationItems = [
        {
            section: 'Main',
            items: [
                { path: '/dashboard', icon: DashboardIcon, label: 'Dashboard', badge: null },
                {
                    path: '/notes',
                    icon: NoteIcon,
                    label: 'Notes',
                    badge: 5,
                    children: [
                        { path: '/notes/protein-expression', label: 'Protein Expression Results', type: 'note' },
                        { path: '/notes/crispr-optimization', label: 'CRISPR Optimization Notes', type: 'note' },
                        { path: '/notes/lab-meeting', label: 'Lab Meeting Notes', type: 'note' },
                        { path: '/notes/experiment-1', label: 'Experiment #1 Results', type: 'note' },
                        { path: '/notes/literature-review', label: 'Literature Review Notes', type: 'note' }
                    ]
                },
                {
                    path: '/journal',
                    icon: JournalIcon,
                    label: 'Journal',
                    badge: 7,
                    children: [
                        { path: '/journal/daily-log', label: 'Daily Lab Log', type: 'journal' },
                        { path: '/journal/weekly-summary', label: 'Weekly Research Summary', type: 'journal' },
                        { path: '/journal/experiment-observations', label: 'Experiment Observations', type: 'journal' },
                        { path: '/journal/progress-notes', label: 'Research Progress Notes', type: 'journal' },
                        { path: '/journal/ideas-brainstorming', label: 'Ideas & Brainstorming', type: 'journal' },
                        { path: '/journal/collaboration-notes', label: 'Collaboration Notes', type: 'journal' },
                        { path: '/journal/future-plans', label: 'Future Research Plans', type: 'journal' }
                    ]
                },
                { path: '/tasks', icon: CheckBoxIcon, label: 'Tasks', badge: 3 },
                { path: '/calendar', icon: CalendarIcon, label: 'Calendar', badge: null },
                { path: '/time-blocking', icon: TimeBlockingIcon, label: 'Time Blocking', badge: 'new' },
            ]
        },
        {
            section: 'Research',
            items: [
                {
                    path: '/projects',
                    icon: ProjectIcon,
                    label: 'Projects',
                    badge: 3,
                    children: [
                        { path: '/projects/crispr-study', label: 'CRISPR Gene Editing Study', type: 'project' },
                        { path: '/projects/protein-analysis', label: 'Protein Expression Analysis', type: 'project' },
                        { path: '/projects/drug-screening', label: 'Drug Screening Pipeline', type: 'project' }
                    ]
                },
                {
                    path: '/pdfs',
                    icon: PdfIcon,
                    label: 'PDFs',
                    badge: 12,
                    children: [
                        { path: '/pdfs/nature-paper-1', label: 'Nature Paper on Gene Editing', type: 'pdf' },
                        { path: '/pdfs/cell-journal-article', label: 'Cell Journal Article', type: 'pdf' },
                        { path: '/pdfs/protocol-manual', label: 'Lab Protocol Manual', type: 'pdf' },
                        { path: '/pdfs/research-proposal', label: 'Research Proposal Draft', type: 'pdf' }
                    ]
                },
                {
                    path: '/database',
                    icon: DatabaseIcon,
                    label: 'Database',
                    badge: 156,
                    children: [
                        { path: '/database/chemicals', label: 'Chemical Compounds', type: 'database' },
                        { path: '/database/proteins', label: 'Protein Database', type: 'database' },
                        { path: '/database/experiments', label: 'Experiment Records', type: 'database' }
                    ]
                },
                {
                    path: '/tables',
                    icon: TableIcon,
                    label: 'Tables',
                    badge: 9,
                    children: [
                        { path: '/tables/experiment-results', label: 'Experiment Results Table', type: 'table' },
                        { path: '/tables/chemical-inventory', label: 'Chemical Inventory Table', type: 'table' },
                        { path: '/tables/protein-data', label: 'Protein Expression Data', type: 'table' },
                        { path: '/tables/statistical-analysis', label: 'Statistical Analysis Table', type: 'table' },
                        { path: '/tables/sample-tracking', label: 'Sample Tracking Table', type: 'table' },
                        { path: '/tables/equipment-log', label: 'Equipment Usage Log', type: 'table' },
                        { path: '/tables/collaboration-contacts', label: 'Collaboration Contacts', type: 'table' },
                        { path: '/tables/publication-tracker', label: 'Publication Tracker', type: 'table' },
                        { path: '/tables/grant-deadlines', label: 'Grant Deadlines Table', type: 'table' }
                    ]
                },
            ]
        },
        {
            section: 'Lab Resources',
            items: [
                {
                    path: '/protocols',
                    icon: ProtocolIcon,
                    label: 'Protocols',
                    badge: 8,
                    children: [
                        { path: '/protocols/pcr-protocol', label: 'PCR Amplification Protocol', type: 'protocol' },
                        { path: '/protocols/gel-electrophoresis', label: 'Gel Electrophoresis', type: 'protocol' },
                        { path: '/protocols/cell-culture', label: 'Cell Culture Protocol', type: 'protocol' },
                        { path: '/protocols/protein-purification', label: 'Protein Purification', type: 'protocol' }
                    ]
                },
                {
                    path: '/recipes',
                    icon: RecipeIcon,
                    label: 'Recipes',
                    badge: 15,
                    children: [
                        { path: '/recipes/lb-medium', label: 'LB Medium Preparation', type: 'recipe' },
                        { path: '/recipes/antibiotic-solution', label: 'Antibiotic Solution', type: 'recipe' },
                        { path: '/recipes/buffer-solutions', label: 'Buffer Solutions', type: 'recipe' },
                        { path: '/recipes/agar-plates', label: 'Agar Plates Preparation', type: 'recipe' }
                    ]
                },
                {
                    path: '/zotero',
                    icon: ZoteroIcon,
                    label: 'Zotero',
                    badge: 'new',
                    children: [
                        { path: '/zotero/collections', label: 'Collections', type: 'zotero' },
                        { path: '/zotero/recent-papers', label: 'Recent Papers', type: 'zotero' },
                        { path: '/zotero/citations', label: 'Citations', type: 'zotero' },
                        { path: '/zotero/bibliography', label: 'Bibliography', type: 'zotero' },
                        { path: '/zotero/notes', label: 'Paper Notes', type: 'zotero' },
                        { path: '/zotero/tags', label: 'Tags & Keywords', type: 'zotero' },
                        { path: '/zotero/sync', label: 'Sync Status', type: 'zotero' },
                        { path: '/zotero/import', label: 'Import Papers', type: 'zotero' }
                    ]
                },
            ]
        },
        {
            section: 'Tools',
            items: [
                { path: '/search', icon: SearchIcon, label: 'Advanced Search', badge: null },
                { path: '/calculators', icon: CalculateIcon, label: 'Calculator', badge: null },
                { path: '/analytics', icon: AssessmentIcon, label: 'Analytics', badge: null },
                { path: '/links', icon: LinkIcon, label: 'Link Manager', badge: null },
                { path: '/advanced-features', icon: RocketIcon, label: 'Advanced Features', badge: 'new' },
            ]
        }
    ];

    const bottomItems = [
        { path: '/settings', icon: SettingsIcon, label: 'Settings', badge: null }
    ];

    return (
        <SidebarNav
            collapsed={collapsed}
            onToggle={toggleSidebar}
            className="h-full flex flex-col"
        >
            {/* Header */}
            <SidebarNav.Header collapsed={collapsed}>
                <div className="flex items-center justify-between">
                    {!collapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">RN</span>
                            </div>
                            <span className="font-semibold text-gray-900">Research Notebook</span>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleSidebar}
                        className="p-1 h-8 w-8"
                    >
                        {collapsed ? (
                            <ChevronRightIcon className="w-4 h-4" />
                        ) : (
                            <ChevronLeftIcon className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </SidebarNav.Header>

            {/* Main Navigation */}
            <div className="flex-1 overflow-y-auto">
                {navigationItems.map((section) => (
                    <div key={section.section}>
                        {/* Main Section Header */}
                        <div
                            className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                            onClick={() => toggleMainSection(section.section)}
                        >
                            <div className="flex items-center gap-2">
                                {expandedMainSections.has(section.section) ? (
                                    <ExpandLessIcon className="w-4 h-4 text-gray-600" />
                                ) : (
                                    <ExpandMoreIcon className="w-4 h-4 text-gray-600" />
                                )}
                                <span>{section.section}</span>
                            </div>
                        </div>

                        {/* Section Content */}
                        {expandedMainSections.has(section.section) && (
                            <div className="ml-4">
                                {section.items.map((item) => (
                                    <div key={item.path}>
                                        {/* Main Item */}
                                        <div
                                            className={`flex items-center justify-between px-3 py-2 text-sm rounded transition-colors mb-1 ${isActive(item.path)
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-gray-700'
                                                }`}
                                        >
                                            <div
                                                className="flex items-center gap-2 flex-1 cursor-pointer hover:bg-gray-100 rounded px-1 py-1"
                                                onClick={() => navigate(item.path)}
                                            >
                                                <item.icon className="w-4 h-4" />
                                                {!collapsed && <span>{item.label}</span>}
                                            </div>
                                            {item.children && (
                                                <div
                                                    className="flex items-center cursor-pointer hover:bg-gray-100 rounded p-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSection(item.path);
                                                    }}
                                                >
                                                    {expandedSections.has(item.path) ? (
                                                        <ExpandLessIcon className="w-3 h-3 text-gray-500" />
                                                    ) : (
                                                        <ExpandMoreIcon className="w-3 h-3 text-gray-500" />
                                                    )}
                                                </div>
                                            )}
                                            {item.badge && !collapsed && (
                                                <div className={`px-2 py-0.5 text-xs rounded-full ${typeof item.badge === 'number'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {item.badge}
                                                </div>
                                            )}
                                        </div>

                                        {/* Children */}
                                        {item.children && expandedSections.has(item.path) && !collapsed && (
                                            <div className="ml-6 space-y-1 mb-2">
                                                {item.children.map((child) => (
                                                    <div
                                                        key={child.path}
                                                        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded cursor-pointer transition-colors ${isActive(child.path)
                                                            ? 'bg-blue-50 text-blue-600'
                                                            : 'text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                        onClick={() => navigate(child.path)}
                                                    >
                                                        <DocumentIcon className="w-3 h-3" />
                                                        <span className="truncate">{child.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Workspace File Tree */}
                {!collapsed && (
                    <div>
                        {/* Pages Section Header */}
                        <div
                            className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                            onClick={() => toggleMainSection('Pages')}
                        >
                            <div className="flex items-center gap-2">
                                {expandedMainSections.has('Pages') ? (
                                    <ExpandLessIcon className="w-4 h-4 text-gray-600" />
                                ) : (
                                    <ExpandMoreIcon className="w-4 h-4 text-gray-600" />
                                )}
                                <span>Pages</span>
                            </div>
                        </div>

                        {/* Pages Content */}
                        {expandedMainSections.has('Pages') && (
                            <div className="ml-4">
                                <div className="space-y-1">
                                    {workspaceTree.map((item) => (
                                        <div key={item.id}>
                                            {/* Folder */}
                                            <div
                                                className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                                                onClick={() => toggleFolder(item.id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {expandedFolders.has(item.id) ? (
                                                        <ExpandLessIcon className="w-4 h-4 text-gray-500" />
                                                    ) : (
                                                        <ExpandMoreIcon className="w-4 h-4 text-gray-500" />
                                                    )}
                                                    <item.icon className="w-4 h-4" />
                                                    <span className="font-medium">{item.name}</span>
                                                </div>
                                            </div>

                                            {/* Children */}
                                            {expandedFolders.has(item.id) && item.children && (
                                                <div className="ml-6 space-y-1">
                                                    {item.children.map((child) => (
                                                        <div
                                                            key={child.id}
                                                            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded cursor-pointer transition-colors ${isActive(child.path)
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'text-gray-600 hover:bg-gray-50'
                                                                }`}
                                                            onClick={() => navigate(child.path)}
                                                        >
                                                            <child.icon className="w-3 h-3" />
                                                            <span className="truncate">{child.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Divider */}
            <SidebarNav.Divider />

            {/* Bottom Navigation */}
            <SidebarNav.Footer>
                {bottomItems.map((item) => (
                    <SidebarNav.Item
                        key={item.path}
                        active={isActive(item.path)}
                        onClick={() => navigate(item.path)}
                    >
                        <SidebarNav.Icon icon={item.icon} />
                        <SidebarNav.Text collapsed={collapsed}>
                            {item.label}
                        </SidebarNav.Text>
                        {item.badge && !collapsed && (
                            <SidebarNav.Badge variant="warning">
                                {item.badge}
                            </SidebarNav.Badge>
                        )}
                    </SidebarNav.Item>
                ))}
            </SidebarNav.Footer>
        </SidebarNav>
    );
};

export default RefactoredSidebar; 