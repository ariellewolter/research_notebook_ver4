import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    Paper,
    Tabs,
    Tab,
    Grid,
    Card,
    CardContent,
    CardActions,
    Chip,
    Menu,
    MenuItem as MenuItemComponent,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIcon,
    Link as LinkIcon,
    MoreVert as MoreIcon,
    Search as SearchIcon,
    ViewColumn as ViewIcon,
    Dashboard as DashboardIcon,
    Note as NoteIcon,
    Folder as ProjectIcon,
    Science as ProtocolIcon,
    Storage as DatabaseIcon,
    PictureAsPdf as PdfIcon,
    Close as CloseIcon,
    Science as ExperimentIcon,
    Restaurant as RecipeIcon,
    Book as LiteratureIcon,
    Assignment as TaskIcon,
    ViewColumn as ColumnsIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { notesApi, projectsApi, protocolsApi, databaseApi, pdfsApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Block {
    id: string;
    type: 'text' | 'note' | 'project' | 'protocol' | 'database' | 'pdf' | 'page' | 'experiment' | 'recipe' | 'literature' | 'task' | 'columns';
    content: string;
    title: string;
    entityId?: string;
    createdAt: Date;
    updatedAt: Date;
    order: number;
    isEditing?: boolean;
    columns?: Block[][]; // For multi-column blocks
    columnCount?: number; // Number of columns (2, 3, etc.)
}

interface TabData {
    id: string;
    label: string;
    content: Block[];
    type?: string;
}

interface Template {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    type: string;
    color: string;
    defaultContent: string;
}

const NotionWorkspace: React.FC = () => {
    const navigate = useNavigate();
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [tabs, setTabs] = useState<TabData[]>([
        { id: 'main', label: 'Main', content: [] },
        { id: 'research', label: 'Research', content: [] },
        { id: 'notes', label: 'Notes', content: [] }
    ]);
    const [activeTab, setActiveTab] = useState('main');
    const [searchTerm, setSearchTerm] = useState('');
    const [slashMenuOpen, setSlashMenuOpen] = useState(false);
    const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
    const [slashMenuTarget, setSlashMenuTarget] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showTabMenu, setShowTabMenu] = useState(false);
    const [tabMenuAnchor, setTabMenuAnchor] = useState<null | HTMLElement>(null);
    const [showLandingPage, setShowLandingPage] = useState(true);
    const [newTabDialogOpen, setNewTabDialogOpen] = useState(false);
    const [newTabName, setNewTabName] = useState('');
    const [newTabType, setNewTabType] = useState('');
    const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const [lastSaved, setLastSaved] = useState<Date>(new Date());

    const textFieldRef = useRef<HTMLInputElement>(null);
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

    const templates: Template[] = [
        {
            id: 'project',
            name: 'Project',
            description: 'Start a new research project with structured planning',
            icon: <ProjectIcon />,
            type: 'project',
            color: '#2e7d32',
            defaultContent: 'Project Overview:\n\nObjectives:\n• \n• \n• \n\nTimeline:\n• Phase 1: \n• Phase 2: \n• Phase 3: \n\nResources Needed:\n• \n• \n• \n\nNotes:\n'
        },
        {
            id: 'experiment',
            name: 'Experiment',
            description: 'Document experimental procedures and results',
            icon: <ExperimentIcon />,
            type: 'experiment',
            color: '#ed6c02',
            defaultContent: 'Experiment: \n\nHypothesis:\n\nMaterials:\n• \n• \n• \n\nProcedure:\n1. \n2. \n3. \n\nResults:\n\nConclusions:\n\nNext Steps:\n'
        },
        {
            id: 'protocol',
            name: 'Protocol',
            description: 'Create a standardized laboratory protocol',
            icon: <ProtocolIcon />,
            type: 'protocol',
            color: '#1976d2',
            defaultContent: 'Protocol: \n\nPurpose:\n\nMaterials:\n• \n• \n• \n\nProcedure:\n1. \n2. \n3. \n\nSafety Notes:\n\nTroubleshooting:\n\nReferences:\n'
        },
        {
            id: 'recipe',
            name: 'Recipe',
            description: 'Document chemical or biological recipes',
            icon: <RecipeIcon />,
            type: 'recipe',
            color: '#9c27b0',
            defaultContent: 'Recipe: \n\nIngredients:\n• \n• \n• \n\nInstructions:\n1. \n2. \n3. \n\nNotes:\n\nStorage:\n\nYield:\n'
        },
        {
            id: 'literature',
            name: 'Literature Review',
            description: 'Organize literature notes and reviews',
            icon: <LiteratureIcon />,
            type: 'literature',
            color: '#d32f2f',
            defaultContent: 'Literature Review: \n\nTopic:\n\nKey Papers:\n1. \n2. \n3. \n\nMain Findings:\n\nGaps in Research:\n\nFuture Directions:\n\nNotes:\n'
        },
        {
            id: 'task',
            name: 'Task List',
            description: 'Create a task list with priorities',
            icon: <TaskIcon />,
            type: 'task',
            color: '#666',
            defaultContent: 'Task List: \n\nHigh Priority:\n□ \n□ \n□ \n\nMedium Priority:\n□ \n□ \n□ \n\nLow Priority:\n□ \n□ \n□ \n\nNotes:\n'
        }
    ];

    useEffect(() => {
        loadWorkspaceData();
    }, []);

    // Auto-save functionality
    const autoSave = async (blocksToSave: Block[]) => {
        try {
            setAutoSaveStatus('saving');

            // Save to localStorage for immediate persistence
            localStorage.setItem('workspace-blocks', JSON.stringify(blocksToSave));

            // Simulate API save (replace with actual API calls)
            await new Promise(resolve => setTimeout(resolve, 500));

            setAutoSaveStatus('saved');
            setLastSaved(new Date());
        } catch (error) {
            console.error('Auto-save error:', error);
            setAutoSaveStatus('error');
        }
    };

    const debouncedAutoSave = (blocksToSave: Block[]) => {
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        autoSaveTimeoutRef.current = setTimeout(() => {
            autoSave(blocksToSave);
        }, 1000); // 1 second delay
    };

    const loadWorkspaceData = async () => {
        try {
            setLoading(true);
            // Load recent items from different APIs
            const [notes, projects, protocols] = await Promise.all([
                notesApi.getAll({ limit: 10 }),
                projectsApi.getAll({ limit: 10 }),
                protocolsApi.getAll({ limit: 10 })
            ]);

            const defaultBlocks: Block[] = [
                {
                    id: 'welcome',
                    type: 'text',
                    content: 'Welcome to your Research Workspace! This is your central hub for all your research activities.\n\nYou can:\n• Use [[wiki links]] to link to other pages\n• Type / to create new content\n• Drag blocks to reorder them\n• Create new tabs for different projects',
                    title: 'Welcome',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    order: 0,
                    isEditing: true
                },
                {
                    id: 'quick-actions',
                    type: 'text',
                    content: 'Quick Actions:\n/note - Create a new note\n/project - Start a new project\n/protocol - Add a new protocol\n/page - Create a new page\n\nRecent Items:\n[[My Research Project]]\n[[Lab Protocol 1]]\n[[Literature Review]]',
                    title: 'Quick Actions',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    order: 1,
                    isEditing: true
                }
            ];

            // Convert recent items to blocks
            const recentBlocks: Block[] = [
                ...notes.data.map((note: any, index: number) => ({
                    id: `note-${note.id}`,
                    type: 'note' as const,
                    content: note.content,
                    title: note.title,
                    entityId: note.id,
                    createdAt: new Date(note.createdAt),
                    updatedAt: new Date(note.updatedAt),
                    order: index + 2,
                    isEditing: true
                })),
                ...projects.data.map((project: any, index: number) => ({
                    id: `project-${project.id}`,
                    type: 'project' as const,
                    content: project.description || '',
                    title: project.name,
                    entityId: project.id,
                    createdAt: new Date(project.createdAt),
                    updatedAt: new Date(project.updatedAt),
                    order: index + notes.data.length + 2,
                    isEditing: true
                }))
            ];

            setBlocks([...defaultBlocks, ...recentBlocks]);
        } catch (error) {
            console.error('Error loading workspace data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFromTemplate = (template: Template) => {
        const newBlock: Block = {
            id: `block-${Date.now()}`,
            type: template.type as any,
            content: template.defaultContent,
            title: `New ${template.name}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            order: blocks.length,
            isEditing: true
        };

        const updatedBlocks = [...blocks, newBlock];
        setBlocks(updatedBlocks);
        setShowLandingPage(false);

        // Trigger auto-save
        debouncedAutoSave(updatedBlocks);
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(blocks);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update order property
        const updatedItems = items.map((item, index) => ({
            ...item,
            order: index
        }));

        setBlocks(updatedItems);
    };

    const handleAddBlock = () => {
        const newBlock: Block = {
            id: `block-${Date.now()}`,
            type: 'text',
            content: '',
            title: 'New Block',
            createdAt: new Date(),
            updatedAt: new Date(),
            order: blocks.length,
            isEditing: true
        };

        const updatedBlocks = [...blocks, newBlock];
        setBlocks(updatedBlocks);

        // Trigger auto-save
        debouncedAutoSave(updatedBlocks);
    };

    const handleEditBlock = (block: Block) => {
        setBlocks(prev => prev.map(b =>
            b.id === block.id ? { ...b, isEditing: true } : b
        ));
    };

    const handleSaveBlock = (blockId: string) => {
        // Keep blocks in editing mode - just update the timestamp
        setBlocks(prev => prev.map(b =>
            b.id === blockId ? { ...b, updatedAt: new Date() } : b
        ));
    };

    const handleDeleteBlock = (blockId: string) => {
        const updatedBlocks = blocks.filter(block => block.id !== blockId);
        setBlocks(updatedBlocks);

        // Trigger auto-save
        debouncedAutoSave(updatedBlocks);
    };

    const handleContentChange = (blockId: string, content: string) => {
        // Check for slash commands
        if (content.includes('/') && content.endsWith('/')) {
            const rect = textFieldRef.current?.getBoundingClientRect();
            if (rect) {
                setSlashMenuPosition({ x: rect.left, y: rect.bottom });
                setSlashMenuTarget(blockId);
                setSlashMenuOpen(true);
            }
        } else {
            setSlashMenuOpen(false);
        }

        // Update block content
        const updatedBlocks = blocks.map(block =>
            block.id === blockId ? { ...block, content, updatedAt: new Date() } : block
        );
        setBlocks(updatedBlocks);

        // Trigger auto-save
        debouncedAutoSave(updatedBlocks);
    };

    const handleTitleChange = (blockId: string, title: string) => {
        const updatedBlocks = blocks.map(block =>
            block.id === blockId ? { ...block, title, updatedAt: new Date() } : block
        );
        setBlocks(updatedBlocks);

        // Trigger auto-save
        debouncedAutoSave(updatedBlocks);
    };

    const handleSlashCommand = (command: string) => {
        if (!slashMenuTarget) return;

        let newBlock: Block;

        if (command.startsWith('columns-')) {
            const columnCount = parseInt(command.split('-')[1]);
            newBlock = {
                id: `block-${Date.now()}`,
                type: 'columns',
                content: '',
                title: `${columnCount} Column Layout`,
                createdAt: new Date(),
                updatedAt: new Date(),
                order: blocks.length,
                isEditing: true,
                columnCount: columnCount,
                columns: Array(columnCount).fill(null).map(() => [])
            };
        } else {
            newBlock = {
                id: `block-${Date.now()}`,
                type: command as any,
                content: '',
                title: `New ${command.charAt(0).toUpperCase() + command.slice(1)}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                order: blocks.length,
                isEditing: true
            };
        }

        setBlocks(prev => [...prev, newBlock]);
        setSlashMenuOpen(false);
        setSlashMenuTarget(null);
    };

    const getBlockIcon = (type: string) => {
        switch (type) {
            case 'note': return <NoteIcon />;
            case 'project': return <ProjectIcon />;
            case 'protocol': return <ProtocolIcon />;
            case 'database': return <DatabaseIcon />;
            case 'pdf': return <PdfIcon />;
            case 'page': return <DashboardIcon />;
            case 'experiment': return <ExperimentIcon />;
            case 'recipe': return <RecipeIcon />;
            case 'literature': return <LiteratureIcon />;
            case 'task': return <TaskIcon />;
            case 'columns': return <ColumnsIcon />;
            default: return <NoteIcon />;
        }
    };

    const getBlockColor = (type: string) => {
        switch (type) {
            case 'note': return '#1976d2';
            case 'project': return '#2e7d32';
            case 'protocol': return '#1976d2';
            case 'database': return '#9c27b0';
            case 'pdf': return '#d32f2f';
            case 'page': return '#666';
            case 'experiment': return '#ed6c02';
            case 'recipe': return '#9c27b0';
            case 'literature': return '#d32f2f';
            case 'task': return '#666';
            case 'columns': return '#ff9800';
            default: return '#666';
        }
    };

    const filteredBlocks = blocks.filter(block =>
        block.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        block.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const slashCommands = [
        { command: 'text', label: 'Text', icon: <NoteIcon /> },
        { command: 'note', label: 'Note', icon: <NoteIcon /> },
        { command: 'project', label: 'Project', icon: <ProjectIcon /> },
        { command: 'protocol', label: 'Protocol', icon: <ProtocolIcon /> },
        { command: 'database', label: 'Database', icon: <DatabaseIcon /> },
        { command: 'pdf', label: 'PDF', icon: <PdfIcon /> },
        { command: 'page', label: 'Page', icon: <DashboardIcon /> },
        { command: 'experiment', label: 'Experiment', icon: <ExperimentIcon /> },
        { command: 'recipe', label: 'Recipe', icon: <RecipeIcon /> },
        { command: 'literature', label: 'Literature', icon: <LiteratureIcon /> },
        { command: 'task', label: 'Task', icon: <TaskIcon /> },
        { command: 'columns-2', label: '2 Columns', icon: <ColumnsIcon /> },
        { command: 'columns-3', label: '3 Columns', icon: <ColumnsIcon /> }
    ];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography>Loading workspace...</Typography>
            </Box>
        );
    }

    // Show landing page if no blocks exist
    if (showLandingPage && blocks.length === 0) {
        return (
            <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
                {/* Top Header */}
                <Box sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    px: 2
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                        <Typography variant="h6" sx={{ mr: 2 }}>
                            Research Workspace
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button variant="outlined" onClick={() => setShowLandingPage(false)}>
                            Skip Templates
                        </Button>
                    </Box>
                </Box>

                {/* Landing Page Content */}
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 4 }}>
                    <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <Box sx={{ textAlign: 'center', mb: 6 }}>
                            <Typography variant="h3" gutterBottom>
                                Welcome to Your Research Workspace
                            </Typography>
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                                Choose a template to get started, or create a blank workspace
                            </Typography>
                        </Box>

                        <Grid container spacing={3}>
                            {templates.map((template) => (
                                <Grid item xs={12} sm={6} md={4} key={template.id}>
                                    <Card
                                        sx={{
                                            height: '200px',
                                            cursor: 'pointer',
                                            borderLeft: `4px solid ${template.color}`,
                                            '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => handleCreateFromTemplate(template)}
                                    >
                                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                <Box sx={{ color: template.color }}>
                                                    {template.icon}
                                                </Box>
                                                <Typography variant="h6">{template.name}</Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                                                {template.description}
                                            </Typography>
                                        </CardContent>
                                        <CardActions>
                                            <Button size="small" startIcon={<AddIcon />}>
                                                Create {template.name}
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        <Box sx={{ textAlign: 'center', mt: 4 }}>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={handleAddBlock}
                                startIcon={<AddIcon />}
                            >
                                Start with Blank Workspace
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Top Header with Tabs */}
            <Box sx={{
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                px: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                    <Typography variant="h6" sx={{ mr: 2 }}>
                        Research Workspace
                    </Typography>

                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ flexGrow: 1 }}
                    >
                        {tabs.map((tab) => (
                            <Tab key={tab.id} value={tab.id} label={tab.label} />
                        ))}
                    </Tabs>

                    <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                    {/* Main Navigation Buttons */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<NoteIcon />}
                            onClick={() => navigate('/notes')}
                        >
                            Notes
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ProjectIcon />}
                            onClick={() => navigate('/projects')}
                        >
                            Projects
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ProtocolIcon />}
                            onClick={() => navigate('/protocols')}
                        >
                            Protocols
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<RecipeIcon />}
                            onClick={() => navigate('/recipes')}
                        >
                            Recipes
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DatabaseIcon />}
                            onClick={() => navigate('/database')}
                        >
                            Database
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PdfIcon />}
                            onClick={() => navigate('/pdfs')}
                        >
                            PDFs
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<TaskIcon />}
                            onClick={() => navigate('/tasks')}
                        >
                            Tasks
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<LiteratureIcon />}
                            onClick={() => navigate('/literature')}
                        >
                            Literature
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DashboardIcon />}
                            onClick={() => navigate('/dashboard')}
                        >
                            Dashboard
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ExperimentIcon />}
                            onClick={() => navigate('/experiments')}
                        >
                            Experiments
                        </Button>
                    </Box>

                    <IconButton onClick={(e) => setTabMenuAnchor(e.currentTarget)}>
                        <MoreIcon />
                    </IconButton>

                    <TextField
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                        sx={{ minWidth: 200 }}
                    />

                    {/* Auto-save status indicator */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                        <Box sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: autoSaveStatus === 'saved' ? '#4caf50' :
                                autoSaveStatus === 'saving' ? '#ff9800' : '#f44336'
                        }} />
                        <Typography variant="caption" color="text.secondary">
                            {autoSaveStatus === 'saved' ? 'All changes saved' :
                                autoSaveStatus === 'saving' ? 'Saving...' : 'Save error'}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Main Content Area - Full Width */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 4 }}>
                <Box sx={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="blocks">
                            {(provided) => (
                                <Box
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                                >
                                    {filteredBlocks.map((block, index) => (
                                        <Draggable key={block.id} draggableId={block.id} index={index}>
                                            {(provided, snapshot) => (
                                                <Paper
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    elevation={snapshot.isDragging ? 8 : 1}
                                                    sx={{
                                                        p: 4,
                                                        mb: 4,
                                                        minHeight: '300px',
                                                        borderLeft: `4px solid ${getBlockColor(block.type)}`,
                                                        '&:hover': {
                                                            boxShadow: 4,
                                                            transform: 'translateY(-1px)'
                                                        },
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                                                        <Box {...provided.dragHandleProps} sx={{ cursor: 'grab', mt: 0.5 }}>
                                                            <DragIcon color="action" />
                                                        </Box>

                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                                                            {getBlockIcon(block.type)}
                                                            {block.isEditing ? (
                                                                <TextField
                                                                    value={block.title}
                                                                    onChange={(e) => handleTitleChange(block.id, e.target.value)}
                                                                    variant="standard"
                                                                    fullWidth
                                                                    sx={{
                                                                        '& .MuiInputBase-input': {
                                                                            fontSize: '1.5rem',
                                                                            fontWeight: 600,
                                                                            padding: '8px 0'
                                                                        }
                                                                    }}
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <Typography variant="h6">{block.title}</Typography>
                                                            )}
                                                            <Chip
                                                                label={block.type}
                                                                size="small"
                                                                sx={{ bgcolor: getBlockColor(block.type), color: 'white' }}
                                                            />
                                                        </Box>

                                                        <Box>
                                                            <Tooltip title="Update timestamp">
                                                                <IconButton size="small" onClick={() => handleSaveBlock(block.id)}>
                                                                    <EditIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Delete block">
                                                                <IconButton size="small" onClick={() => handleDeleteBlock(block.id)}>
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </Box>

                                                    {block.type === 'columns' ? (
                                                        <Box sx={{ mt: 2 }}>
                                                            <Typography variant="h6" sx={{ mb: 2 }}>
                                                                {block.columnCount} Column Layout
                                                            </Typography>
                                                            <Grid container spacing={2}>
                                                                {Array(block.columnCount || 2).fill(null).map((_, columnIndex) => (
                                                                    <Grid item xs={12} md={12 / (block.columnCount || 2)} key={columnIndex}>
                                                                        <Paper
                                                                            elevation={1}
                                                                            sx={{
                                                                                p: 2,
                                                                                minHeight: '200px',
                                                                                border: '2px dashed #ddd',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                '&:hover': {
                                                                                    borderColor: '#1976d2',
                                                                                    backgroundColor: '#f5f5f5'
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Button
                                                                                variant="outlined"
                                                                                startIcon={<AddIcon />}
                                                                                onClick={() => {
                                                                                    // Add a new block to this column
                                                                                    const newColumnBlock: Block = {
                                                                                        id: `column-block-${Date.now()}-${columnIndex}`,
                                                                                        type: 'text',
                                                                                        content: '',
                                                                                        title: 'New Block',
                                                                                        createdAt: new Date(),
                                                                                        updatedAt: new Date(),
                                                                                        order: 0,
                                                                                        isEditing: true
                                                                                    };

                                                                                    const updatedBlocks = blocks.map(b => {
                                                                                        if (b.id === block.id && b.columns) {
                                                                                            const newColumns = [...b.columns];
                                                                                            newColumns[columnIndex] = [...(newColumns[columnIndex] || []), newColumnBlock];
                                                                                            return { ...b, columns: newColumns };
                                                                                        }
                                                                                        return b;
                                                                                    });

                                                                                    setBlocks(updatedBlocks);
                                                                                    debouncedAutoSave(updatedBlocks);
                                                                                }}
                                                                            >
                                                                                Add Block to Column {columnIndex + 1}
                                                                            </Button>
                                                                        </Paper>
                                                                    </Grid>
                                                                ))}
                                                            </Grid>
                                                        </Box>
                                                    ) : (
                                                        <TextField
                                                            ref={textFieldRef}
                                                            multiline
                                                            fullWidth
                                                            variant="outlined"
                                                            value={block.content}
                                                            onChange={(e) => handleContentChange(block.id, e.target.value)}
                                                            placeholder="Type / for commands, use [[wiki links]] for linking..."
                                                            minRows={8}
                                                            maxRows={50}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    border: 'none',
                                                                    '&:hover': {
                                                                        border: '1px solid #ddd'
                                                                    }
                                                                },
                                                                '& .MuiInputBase-input': {
                                                                    fontSize: '1.1rem',
                                                                    lineHeight: 1.7,
                                                                    padding: '20px',
                                                                    minHeight: '200px'
                                                                },
                                                                '& .MuiOutlinedInput-notchedOutline': {
                                                                    border: 'none'
                                                                },
                                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                    border: '1px solid #ddd'
                                                                },
                                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                    border: '2px solid #1976d2'
                                                                }
                                                            }}
                                                        />
                                                    )}

                                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                                        Updated {block.updatedAt.toLocaleDateString()}
                                                    </Typography>
                                                </Paper>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </Box>
                            )}
                        </Droppable>
                    </DragDropContext>

                    {/* Add Block Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={handleAddBlock}
                        >
                            Add Block
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* Slash Command Menu */}
            <Menu
                open={slashMenuOpen}
                anchorReference="anchorPosition"
                anchorPosition={{ top: slashMenuPosition.y, left: slashMenuPosition.x }}
                onClose={() => setSlashMenuOpen(false)}
            >
                {slashCommands.map((cmd) => (
                    <MenuItemComponent
                        key={cmd.command}
                        onClick={() => handleSlashCommand(cmd.command)}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                        {cmd.icon}
                        {cmd.label}
                    </MenuItemComponent>
                ))}
            </Menu>

            {/* Tab Menu */}
            <Menu
                anchorEl={tabMenuAnchor}
                open={Boolean(tabMenuAnchor)}
                onClose={() => setTabMenuAnchor(null)}
            >
                <MenuItemComponent onClick={() => {
                    setNewTabDialogOpen(true);
                    setTabMenuAnchor(null);
                }}>
                    New Tab
                </MenuItemComponent>
                <MenuItemComponent onClick={() => setTabMenuAnchor(null)}>
                    Rename Tab
                </MenuItemComponent>
                <Divider />
                <MenuItemComponent onClick={() => setTabMenuAnchor(null)}>
                    Close Tab
                </MenuItemComponent>
            </Menu>

            {/* New Tab Dialog */}
            <Dialog open={newTabDialogOpen} onClose={() => setNewTabDialogOpen(false)}>
                <DialogTitle>Create New Tab</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Tab Name"
                            value={newTabName}
                            onChange={(e) => setNewTabName(e.target.value)}
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={newTabType}
                                onChange={(e) => setNewTabType(e.target.value)}
                            >
                                <MenuItem value="">None</MenuItem>
                                <MenuItem value="project">Project</MenuItem>
                                <MenuItem value="experiment">Experiment</MenuItem>
                                <MenuItem value="protocol">Protocol</MenuItem>
                                <MenuItem value="recipe">Recipe</MenuItem>
                                <MenuItem value="literature">Literature</MenuItem>
                                <MenuItem value="task">Task</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNewTabDialogOpen(false)}>Cancel</Button>
                    <Button onClick={() => {
                        if (newTabName.trim()) {
                            const newTab: TabData = {
                                id: `tab-${Date.now()}`,
                                label: newTabName,
                                content: [],
                                type: newTabType || undefined
                            };
                            setTabs(prev => [...prev, newTab]);
                            setNewTabName('');
                            setNewTabType('');
                            setNewTabDialogOpen(false);
                        }
                    }} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default NotionWorkspace; 