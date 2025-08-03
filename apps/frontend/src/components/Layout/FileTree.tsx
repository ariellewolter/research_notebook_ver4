import React, { useState, useEffect } from 'react';
import {
    Box,
    IconButton,
    Typography,
    TextField,
    InputAdornment,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Collapse,
    Button,
} from '@mui/material';
import {
    Search as SearchIcon,
    Close as CloseIcon,
    Folder as FolderIcon,
    FolderOpen as FolderOpenIcon,
    Note as NoteIcon,
    Description as FileIcon,
    Science as ProtocolIcon,
    Book as LiteratureIcon,
    Assessment as DataIcon,
    Image as ImageIcon,
    PictureAsPdf as PdfIcon,
    ExpandMore as ExpandMoreIcon,
    ChevronRight as ChevronRightIcon,
    Add as AddIcon,
    CreateNewFolder as CreateFolderIcon,
    NoteAdd as NoteAddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    FileCopy as CopyIcon,
} from '@mui/icons-material';

// File/Folder interfaces
interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    path: string;
    parentId?: string;
    children?: FileNode[];
    isExpanded?: boolean;
    metadata?: {
        size?: number;
        modified?: string;
        created?: string;
        tags?: string[];
        fileType?: 'note' | 'protocol' | 'project' | 'literature' | 'data' | 'image' | 'pdf';
    };
}

interface FileTreeProps {
    isOpen: boolean;
    onClose: () => void;
    onFileSelect?: (file: FileNode) => void;
    width?: number;
}

// File icon component
const FileIconComponent: React.FC<{
    fileType?: string;
    type: 'file' | 'folder';
    isExpanded?: boolean;
}> = ({ fileType, type, isExpanded = false }) => {
    if (type === 'folder') {
        return isExpanded ? (
            <FolderOpenIcon sx={{ color: 'primary.main' }} />
        ) : (
            <FolderIcon sx={{ color: 'text.secondary' }} />
        );
    }

    switch (fileType) {
        case 'note':
            return <NoteIcon sx={{ color: 'success.main' }} />;
        case 'protocol':
            return <ProtocolIcon sx={{ color: 'secondary.main' }} />;
        case 'project':
            return <FolderIcon sx={{ color: 'error.main' }} />;
        case 'literature':
            return <LiteratureIcon sx={{ color: 'warning.main' }} />;
        case 'data':
            return <DataIcon sx={{ color: 'info.main' }} />;
        case 'image':
            return <ImageIcon sx={{ color: 'success.light' }} />;
        case 'pdf':
            return <PdfIcon sx={{ color: 'error.main' }} />;
        default:
            return <FileIcon sx={{ color: 'text.secondary' }} />;
    }
};

// File/Folder node component
const FileTreeNode: React.FC<{
    node: FileNode;
    level?: number;
    onToggle: (nodeId: string) => void;
    onFileClick: (node: FileNode) => void;
    onContextMenu: (node: FileNode, event: React.MouseEvent) => void;
    expandedNodes: Set<string>;
    selectedNode?: string;
}> = ({ node, level = 0, onToggle, onFileClick, onContextMenu, expandedNodes, selectedNode }) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
        <Box>
            <ListItemButton
                sx={{
                    pl: level * 2 + 1,
                    bgcolor: isSelected ? 'action.selected' : 'transparent',
                    borderLeft: isSelected ? 3 : 0,
                    borderColor: 'primary.main',
                    '&:hover': {
                        bgcolor: isSelected ? 'action.selected' : 'action.hover',
                    },
                }}
                onClick={() => {
                    if (node.type === 'folder') {
                        onToggle(node.id);
                    } else {
                        onFileClick(node);
                    }
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onContextMenu(node, e);
                }}
            >
                {/* Expand/collapse icon */}
                <ListItemIcon sx={{ minWidth: 32 }}>
                    {hasChildren && (
                        <IconButton size="small" sx={{ p: 0 }}>
                            {isExpanded ? (
                                <ExpandMoreIcon fontSize="small" />
                            ) : (
                                <ChevronRightIcon fontSize="small" />
                            )}
                        </IconButton>
                    )}
                </ListItemIcon>

                {/* File/folder icon */}
                <ListItemIcon sx={{ minWidth: 40 }}>
                    <FileIconComponent
                        fileType={node.metadata?.fileType}
                        type={node.type}
                        isExpanded={isExpanded}
                    />
                </ListItemIcon>

                {/* Name and metadata */}
                <ListItemText
                    primary={node.name}
                    secondary={
                        node.type === 'file' && node.metadata?.modified
                            ? node.metadata.modified
                            : undefined
                    }
                    primaryTypographyProps={{
                        variant: 'body2',
                        sx: {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        },
                    }}
                    secondaryTypographyProps={{
                        variant: 'caption',
                        color: 'text.disabled',
                    }}
                />
            </ListItemButton>

            {/* Render children */}
            {hasChildren && (
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {node.children!.map(child => (
                            <FileTreeNode
                                key={child.id}
                                node={child}
                                level={level + 1}
                                onToggle={onToggle}
                                onFileClick={onFileClick}
                                onContextMenu={onContextMenu}
                                expandedNodes={expandedNodes}
                                selectedNode={selectedNode}
                            />
                        ))}
                    </List>
                </Collapse>
            )}
        </Box>
    );
};

// Context menu component
const FileContextMenu: React.FC<{
    node: FileNode | null;
    anchorEl: HTMLElement | null;
    onClose: () => void;
    onAction: (action: string, node: FileNode) => void;
}> = ({ node, anchorEl, onClose, onAction }) => {
    if (!node) return null;

    const menuItems = node.type === 'folder' ? [
        { icon: NoteAddIcon, label: 'New File', action: 'newFile' },
        { icon: CreateFolderIcon, label: 'New Folder', action: 'newFolder' },
        { icon: EditIcon, label: 'Rename', action: 'rename' },
        { icon: CopyIcon, label: 'Copy', action: 'copy' },
        { icon: DeleteIcon, label: 'Delete', action: 'delete' }
    ] : [
        { icon: EditIcon, label: 'Rename', action: 'rename' },
        { icon: CopyIcon, label: 'Copy', action: 'copy' },
        { icon: DeleteIcon, label: 'Delete', action: 'delete' }
    ];

    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                    <MenuItem
                        key={index}
                        onClick={() => {
                            onAction(item.action, node);
                            onClose();
                        }}
                        sx={{
                            color: item.action === 'delete' ? 'error.main' : 'inherit',
                        }}
                    >
                        <ListItemIcon>
                            <IconComponent fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>{item.label}</ListItemText>
                    </MenuItem>
                );
            })}
        </Menu>
    );
};

// Sample file tree data - replace with your actual data fetching logic
const getSampleFileTree = (): FileNode[] => [
    {
        id: '1',
        name: 'Projects',
        type: 'folder',
        path: '/projects',
        isExpanded: true,
        children: [
            {
                id: '1-1',
                name: 'COVID-19 Vaccine Development',
                type: 'folder',
                path: '/projects/covid-vaccine',
                parentId: '1',
                isExpanded: false,
                children: [
                    {
                        id: '1-1-1',
                        name: 'Project Overview.md',
                        type: 'file',
                        path: '/projects/covid-vaccine/overview',
                        parentId: '1-1',
                        metadata: { fileType: 'project', modified: '2 hours ago' }
                    },
                    {
                        id: '1-1-2',
                        name: 'Experiment Log.md',
                        type: 'file',
                        path: '/projects/covid-vaccine/experiments',
                        parentId: '1-1',
                        metadata: { fileType: 'note', modified: '1 day ago' }
                    },
                    {
                        id: '1-1-3',
                        name: 'Data Analysis',
                        type: 'folder',
                        path: '/projects/covid-vaccine/data',
                        parentId: '1-1',
                        children: [
                            {
                                id: '1-1-3-1',
                                name: 'trial_results.csv',
                                type: 'file',
                                path: '/projects/covid-vaccine/data/trial_results',
                                parentId: '1-1-3',
                                metadata: { fileType: 'data', modified: '3 days ago' }
                            }
                        ]
                    }
                ]
            },
            {
                id: '1-2',
                name: 'Gene Therapy for DMD',
                type: 'folder',
                path: '/projects/gene-therapy',
                parentId: '1',
                isExpanded: false,
                children: [
                    {
                        id: '1-2-1',
                        name: 'Research Proposal.md',
                        type: 'file',
                        path: '/projects/gene-therapy/proposal',
                        parentId: '1-2',
                        metadata: { fileType: 'project', modified: '1 week ago' }
                    }
                ]
            }
        ]
    },
    {
        id: '2',
        name: 'Daily Notes',
        type: 'folder',
        path: '/notes/daily',
        isExpanded: true,
        children: [
            {
                id: '2-1',
                name: '2024-03-15.md',
                type: 'file',
                path: '/notes/daily/2024-03-15',
                parentId: '2',
                metadata: { fileType: 'note', modified: '2 hours ago' }
            },
            {
                id: '2-2',
                name: '2024-03-14.md',
                type: 'file',
                path: '/notes/daily/2024-03-14',
                parentId: '2',
                metadata: { fileType: 'note', modified: '1 day ago' }
            },
            {
                id: '2-3',
                name: '2024-03-13.md',
                type: 'file',
                path: '/notes/daily/2024-03-13',
                parentId: '2',
                metadata: { fileType: 'note', modified: '2 days ago' }
            }
        ]
    },
    {
        id: '3',
        name: 'Protocols',
        type: 'folder',
        path: '/protocols',
        isExpanded: false,
        children: [
            {
                id: '3-1',
                name: 'CRISPR Protocol v2.1.md',
                type: 'file',
                path: '/protocols/crispr-v2',
                parentId: '3',
                metadata: { fileType: 'protocol', modified: '1 day ago' }
            },
            {
                id: '3-2',
                name: 'Protein Purification.md',
                type: 'file',
                path: '/protocols/protein-purification',
                parentId: '3',
                metadata: { fileType: 'protocol', modified: '3 days ago' }
            },
            {
                id: '3-3',
                name: 'Cell Culture Maintenance.md',
                type: 'file',
                path: '/protocols/cell-culture',
                parentId: '3',
                metadata: { fileType: 'protocol', modified: '1 week ago' }
            }
        ]
    },
    {
        id: '4',
        name: 'Literature',
        type: 'folder',
        path: '/literature',
        isExpanded: false,
        children: [
            {
                id: '4-1',
                name: 'mRNA Therapeutics Review.md',
                type: 'file',
                path: '/literature/mrna-review',
                parentId: '4',
                metadata: { fileType: 'literature', modified: '2 days ago' }
            },
            {
                id: '4-2',
                name: 'CRISPR Recent Advances.md',
                type: 'file',
                path: '/literature/crispr-advances',
                parentId: '4',
                metadata: { fileType: 'literature', modified: '1 week ago' }
            }
        ]
    },
    {
        id: '5',
        name: 'References',
        type: 'folder',
        path: '/references',
        isExpanded: false,
        children: [
            {
                id: '5-1',
                name: 'Images',
                type: 'folder',
                path: '/references/images',
                parentId: '5',
                children: [
                    {
                        id: '5-1-1',
                        name: 'cell_microscopy.jpg',
                        type: 'file',
                        path: '/references/images/cell_microscopy',
                        parentId: '5-1',
                        metadata: { fileType: 'image', modified: '2 hours ago' }
                    }
                ]
            },
            {
                id: '5-2',
                name: 'PDFs',
                type: 'folder',
                path: '/references/pdfs',
                parentId: '5',
                children: [
                    {
                        id: '5-2-1',
                        name: 'Nature_Paper_2024.pdf',
                        type: 'file',
                        path: '/references/pdfs/nature_2024',
                        parentId: '5-2',
                        metadata: { fileType: 'pdf', modified: '1 day ago' }
                    }
                ]
            }
        ]
    }
];

// Main File Tree Component
const FileTree: React.FC<FileTreeProps> = ({
    isOpen,
    onClose,
    onFileSelect,
    width = 350
}) => {
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '2']));
    const [selectedNode, setSelectedNode] = useState<string>();
    const [contextMenu, setContextMenu] = useState<{
        node: FileNode;
        anchorEl: HTMLElement;
    } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Initialize file tree
    useEffect(() => {
        // In a real app, you'd fetch this from your API
        setFileTree(getSampleFileTree());
    }, []);

    // Toggle folder expand/collapse
    const handleToggle = (nodeId: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    // Handle file click
    const handleFileClick = (node: FileNode) => {
        setSelectedNode(node.id);
        if (onFileSelect) {
            onFileSelect(node);
        }
    };

    // Handle context menu
    const handleContextMenu = (node: FileNode, event: React.MouseEvent) => {
        setContextMenu({
            node,
            anchorEl: event.currentTarget as HTMLElement
        });
    };

    // Handle context menu actions
    const handleContextAction = (action: string, node: FileNode) => {
        console.log(`Action: ${action} on node:`, node);
        // Implement actions here (rename, delete, copy, etc.)
        switch (action) {
            case 'newFile':
                // Add new file logic
                break;
            case 'newFolder':
                // Add new folder logic
                break;
            case 'rename':
                // Rename logic
                break;
            case 'delete':
                // Delete logic
                break;
            default:
                break;
        }
    };

    // Filter files based on search
    const filterFileTree = (nodes: FileNode[], searchTerm: string): FileNode[] => {
        if (!searchTerm) return nodes;

        return nodes.reduce((filtered: FileNode[], node) => {
            const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase());
            const filteredChildren = node.children ? filterFileTree(node.children, searchTerm) : [];

            if (matchesSearch || filteredChildren.length > 0) {
                filtered.push({
                    ...node,
                    children: filteredChildren
                });
            }

            return filtered;
        }, []);
    };

    const filteredTree = filterFileTree(fileTree, searchTerm);

    return (
        <Drawer
            anchor="left"
            open={isOpen}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width,
                    bgcolor: 'background.paper',
                    borderRight: 1,
                    borderColor: 'divider'
                }
            }}
        >
            {/* Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.default'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderOpenIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        File Explorer
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Search */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {/* Action buttons */}
            <Box sx={{
                display: 'flex',
                gap: 0.5,
                p: 1,
                borderBottom: 1,
                borderColor: 'divider'
            }}>
                <Button
                    size="small"
                    startIcon={<NoteAddIcon fontSize="small" />}
                    variant="outlined"
                    sx={{ flex: 1, fontSize: '0.75rem' }}
                >
                    File
                </Button>
                <Button
                    size="small"
                    startIcon={<CreateFolderIcon fontSize="small" />}
                    variant="outlined"
                    sx={{ flex: 1, fontSize: '0.75rem' }}
                >
                    Folder
                </Button>
            </Box>

            {/* File Tree */}
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <List dense>
                    {filteredTree.map(node => (
                        <FileTreeNode
                            key={node.id}
                            node={node}
                            onToggle={handleToggle}
                            onFileClick={handleFileClick}
                            onContextMenu={handleContextMenu}
                            expandedNodes={expandedNodes}
                            selectedNode={selectedNode}
                        />
                    ))}
                </List>
            </Box>

            {/* Context Menu */}
            <FileContextMenu
                node={contextMenu?.node || null}
                anchorEl={contextMenu?.anchorEl || null}
                onClose={() => setContextMenu(null)}
                onAction={handleContextAction}
            />
        </Drawer>
    );
};

export default FileTree; 