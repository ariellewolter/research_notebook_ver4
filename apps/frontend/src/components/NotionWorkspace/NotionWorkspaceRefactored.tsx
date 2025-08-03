import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    IconButton,
    Chip,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Select,
    FormControl,
    InputLabel,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent
} from '@mui/material';
import SlashCommandMenu from './SlashCommands';
import LinkSelector from './LinkSelector';
import DatabaseSelector from './DatabaseSelector';
import CrossLinks from './CrossLinks';
import LinkCreator from './LinkCreator';
import { BlockRenderer } from './components/BlockRenderer';
import {
    useBlockHandlers,
    useKeyboardHandlers,
    useDragAndDrop,
    useContextMenu,
    useSlashCommands
} from './hooks';
import { useTableHandlers } from './handlers/tableHandlers';
import { Block, Page } from './types';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    Save as SaveIcon,
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
    Menu as MenuIcon,
    X as XIcon,
    ContentCopy as CopyIcon,
    Publish as PublishIcon,
    Notifications as NotificationsIcon,
    Person as PersonIcon,
    BarChart as BarChartIcon,
    ViewList as ViewListIcon,
    FilterList as FilterListIcon,
    Link as LinkIcon,
    DragIndicator as DragIndicatorIcon,
    Delete as DeleteIcon,
    ContentCopy as DuplicateIcon,
    Keyboard as SlashIcon,
    Storage as StorageIcon,
    AccountTree as CrossLinksIcon,
    Image as ImageIcon,
    Functions as MathIcon,
    ExpandMore as ExpandMoreIcon,
    ChevronRight as ChevronRightIcon,
    Folder as FolderIcon,
    FolderOpen as FolderOpenIcon,
    Description as DescriptionIcon,
    Close as CloseIcon
} from '@mui/icons-material';

const NotionWorkspaceRefactored: React.FC = () => {
    // Full page state
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [filter, setFilter] = useState('');
    const [selectedPage, setSelectedPage] = useState('1');

    // Tree state
    const [expandedItems, setExpandedItems] = useState<string[]>(['root', 'projects', 'research']);

    // Tree data structure
    const treeData = [
        {
            id: 'root',
            label: 'Workspace',
            type: 'folder',
            children: [
                {
                    id: 'current',
                    label: 'Welcome to Your Workspace',
                    type: 'page',
                    icon: <DescriptionIcon />
                }
            ]
        },
        {
            id: 'projects',
            label: 'Projects',
            type: 'folder',
            children: [
                {
                    id: 'project-1',
                    label: 'Project Alpha',
                    type: 'page',
                    icon: <DescriptionIcon />
                },
                {
                    id: 'project-2',
                    label: 'Project Beta',
                    type: 'page',
                    icon: <DescriptionIcon />
                }
            ]
        },
        {
            id: 'research',
            label: 'Research',
            type: 'folder',
            children: [
                {
                    id: 'research-1',
                    label: 'Literature Review',
                    type: 'page',
                    icon: <DescriptionIcon />
                },
                {
                    id: 'research-2',
                    label: 'Experiment Notes',
                    type: 'page',
                    icon: <DescriptionIcon />
                },
                {
                    id: 'research-3',
                    label: 'Data Analysis',
                    type: 'page',
                    icon: <DescriptionIcon />
                }
            ]
        },
        {
            id: 'protocols',
            label: 'Protocols',
            type: 'folder',
            children: [
                {
                    id: 'protocol-1',
                    label: 'Lab Safety',
                    type: 'page',
                    icon: <DescriptionIcon />
                },
                {
                    id: 'protocol-2',
                    label: 'Sample Preparation',
                    type: 'page',
                    icon: <DescriptionIcon />
                }
            ]
        }
    ];

    // Simple state for testing
    const [currentPage, setCurrentPage] = useState<Page>({
        id: '1',
        title: 'Welcome to Your Workspace',
        blocks: [
            {
                id: 'block-1',
                type: 'text',
                content: 'This is a text block. Try typing / to see slash commands!',
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 0
            },
            {
                id: 'block-2',
                type: 'heading',
                content: 'This is a heading',
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1,
                metadata: { level: 1 }
            },
            {
                id: 'block-3',
                type: 'text',
                content: 'Another text block. Press Enter to create a new block, or Backspace in an empty block to merge with the previous one.',
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 2
            }
        ],
        createdAt: new Date()
    });



    // Modular hooks
    const {
        handleBlockContentChange,
        handleDeleteBlock,
        handleMergeBlock,
        handleCreateBlock,
        handleConvertBlock
    } = useBlockHandlers(currentPage, setCurrentPage);

    const {
        slashCommandOpen,
        slashCommandAnchor,
        currentSlashBlockId,
        setSlashCommandOpen,
        setSlashCommandAnchor,
        setCurrentSlashBlockId,
        handleSlashCommand,
        closeSlashCommand
    } = useSlashCommands();

    const {
        draggedBlockId,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd
    } = useDragAndDrop(currentPage, setCurrentPage);

    const {
        contextMenuAnchor,
        contextMenuBlockId,
        handleContextMenuOpen,
        handleContextMenuClose,
        handleContextMenuAction
    } = useContextMenu();

    const {
        handleAddTableRow,
        handleAddTableColumn
    } = useTableHandlers(currentPage, setCurrentPage);

    const {
        handleKeyDown,
        handleHeadingKeyDown
    } = useKeyboardHandlers({
        currentPage,
        setCurrentPage,
        slashCommandOpen,
        setSlashCommandOpen,
        setSlashCommandAnchor,
        setCurrentSlashBlockId,
        handleMergeBlock,
        handleCreateBlock,
        handleConvertBlock
    });

    // Enhanced slash command handler
    // Tree handlers
    const handleToggleExpand = (itemId: string) => {
        setExpandedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleItemClick = (itemId: string, itemType: string) => {
        if (itemType === 'page') {
            setSelectedPage(itemId);
        }
    };

    // Recursive tree component
    const renderTreeItem = (item: any, level: number = 0) => {
        const isExpanded = expandedItems.includes(item.id);
        const isSelected = selectedPage === item.id;

        return (
            <Box key={item.id}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 1,
                        py: 0.5,
                        ml: level * 2,
                        cursor: 'pointer',
                        borderRadius: 1,
                        bgcolor: isSelected ? 'primary.50' : 'transparent',
                        border: isSelected ? '1px solid' : 'none',
                        borderColor: isSelected ? 'primary.200' : 'transparent',
                        '&:hover': {
                            bgcolor: 'action.hover'
                        }
                    }}
                    onClick={() => handleItemClick(item.id, item.type)}
                >
                    {item.type === 'folder' && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggleExpand(item.id);
                            }}
                            sx={{ mr: 0.5, p: 0.5 }}
                        >
                            {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                        </IconButton>
                    )}

                    {item.type === 'folder' ? (
                        isExpanded ? <FolderOpenIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} /> :
                            <FolderIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
                    ) : (
                        item.icon || <DescriptionIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    )}

                    <Typography
                        variant="body2"
                        sx={{
                            flex: 1,
                            fontSize: '0.875rem',
                            fontWeight: isSelected ? 600 : 400,
                            color: isSelected ? 'primary.main' : 'text.primary'
                        }}
                    >
                        {item.label}
                    </Typography>
                </Box>

                {item.type === 'folder' && isExpanded && item.children && (
                    <Box>
                        {item.children.map((child: any) => renderTreeItem(child, level + 1))}
                    </Box>
                )}
            </Box>
        );
    };

    const handleSlashCommandEnhanced = (blockId: string, command: string) => {
        const block = currentPage.blocks.find(b => b.id === blockId);
        if (!block) return;

        switch (command) {
            case 'text':
                handleConvertBlock(blockId, 'text');
                break;
            case 'heading':
                handleConvertBlock(blockId, 'heading');
                break;
            case 'table':
                const tableData = {
                    headers: ['Column 1', 'Column 2', 'Column 3'],
                    rows: [['', '', ''], ['', '', ''], ['', '', '']]
                };
                handleBlockContentChange(blockId, JSON.stringify(tableData));
                handleConvertBlock(blockId, 'table');
                break;
            case 'image':
                const imageData = {
                    url: '',
                    alt: '',
                    caption: '',
                    metadata: {}
                };
                handleConvertBlock(blockId, 'image');
                // Update metadata for image
                setCurrentPage(prev => ({
                    ...prev,
                    blocks: prev.blocks.map(b =>
                        b.id === blockId
                            ? { ...b, metadata: { ...b.metadata, imageData }, updatedAt: new Date() }
                            : b
                    )
                }));
                break;
            case 'math':
                const mathData = {
                    latex: 'E = mc^2',
                    displayMode: 'inline',
                    metadata: {}
                };
                handleConvertBlock(blockId, 'math');
                // Update metadata for math
                setCurrentPage(prev => ({
                    ...prev,
                    blocks: prev.blocks.map(b =>
                        b.id === blockId
                            ? { ...b, metadata: { ...b.metadata, mathData }, updatedAt: new Date() }
                            : b
                    )
                }));
                break;
            default:
                console.log('Unknown command:', command);
        }
        closeSlashCommand();
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
            {/* Sidebar */}
            <Box
                sx={{
                    width: sidebarOpen ? 280 : 0,
                    minWidth: sidebarOpen ? 280 : 0,
                    bgcolor: 'background.paper',
                    borderRight: 1,
                    borderColor: 'divider',
                    overflow: 'hidden',
                    transition: 'width 0.3s ease',
                    display: sidebarOpen ? 'block' : 'none'
                }}
            >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">
                            Workspace
                        </Typography>
                        <IconButton
                            onClick={() => setSidebarOpen(false)}
                            size="small"
                            sx={{
                                color: 'text.secondary',
                                p: 0.5,
                                '&:hover': {
                                    bgcolor: 'action.hover'
                                }
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search pages..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                    />
                </Box>
                <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
                    <Box sx={{ mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            fullWidth
                            size="small"
                            sx={{ mb: 2 }}
                        >
                            + NEW PAGE
                        </Button>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>
                                EXPORT/IMPORT
                            </Typography>
                            <Button
                                variant="text"
                                size="small"
                                fullWidth
                                startIcon={<DownloadIcon />}
                                sx={{ justifyContent: 'flex-start', mb: 0.5 }}
                            >
                                Export PDF
                            </Button>
                            <Button
                                variant="text"
                                size="small"
                                fullWidth
                                startIcon={<SaveIcon />}
                                sx={{ justifyContent: 'flex-start', mb: 0.5 }}
                            >
                                Export JSON
                            </Button>
                            <Button
                                variant="text"
                                size="small"
                                fullWidth
                                startIcon={<UploadIcon />}
                                sx={{ justifyContent: 'flex-start' }}
                            >
                                Import JSON
                            </Button>
                        </Box>
                    </Box>

                    <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>
                            PAGES
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            {treeData.map(item => renderTreeItem(item))}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box
                    sx={{
                        p: 2,
                        borderBottom: 1,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}
                >
                    {!sidebarOpen && (
                        <IconButton
                            onClick={() => setSidebarOpen(true)}
                            sx={{ color: 'text.secondary' }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    <TextField
                        value={currentPage.title}
                        onChange={(e) => setCurrentPage(prev => ({ ...prev, title: e.target.value }))}
                        variant="standard"
                        sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: '1.5rem', fontWeight: 'bold' } }}
                    />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Save">
                            <IconButton>
                                <SaveIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Fullscreen">
                            <IconButton onClick={() => setIsFullScreen(!isFullScreen)}>
                                {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Content Area */}
                <Box
                    sx={{
                        flex: 1,
                        p: 3,
                        overflow: 'auto',
                        bgcolor: 'background.default'
                    }}
                >
                    <Box sx={{ maxWidth: isFullScreen ? 'none' : 800, mx: 'auto' }}>
                        {currentPage.blocks.map((block) => (
                            <BlockRenderer
                                key={block.id}
                                block={block}
                                draggedBlockId={draggedBlockId}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onDragEnd={handleDragEnd}
                                onContextMenuOpen={handleContextMenuOpen}
                                onBlockContentChange={handleBlockContentChange}
                                onKeyDown={handleKeyDown}
                                onHeadingKeyDown={handleHeadingKeyDown}
                                onAddTableRow={handleAddTableRow}
                                onAddTableColumn={handleAddTableColumn}
                            />
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* Slash Command Menu */}
            <SlashCommandMenu
                anchorEl={slashCommandAnchor}
                open={slashCommandOpen}
                onClose={closeSlashCommand}
                onCommandSelect={(command) => handleSlashCommandEnhanced(currentSlashBlockId!, command)}
                searchQuery={currentSlashBlockId ?
                    currentPage.blocks.find(b => b.id === currentSlashBlockId)?.content || '' : ''
                }
            />

            {/* Context Menu */}
            <Menu
                anchorEl={contextMenuAnchor}
                open={Boolean(contextMenuAnchor)}
                onClose={handleContextMenuClose}
            >
                <MenuItem onClick={() => handleContextMenuAction('turn-into-text', contextMenuBlockId!)}>
                    <ListItemIcon><Typography>T</Typography></ListItemIcon>
                    <ListItemText>Turn into text</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleContextMenuAction('turn-into-heading', contextMenuBlockId!)}>
                    <ListItemIcon><Typography>H</Typography></ListItemIcon>
                    <ListItemText>Turn into heading</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleContextMenuAction('duplicate', contextMenuBlockId!)}>
                    <ListItemIcon><DuplicateIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Duplicate</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleContextMenuAction('delete', contextMenuBlockId!)}>
                    <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default NotionWorkspaceRefactored; 