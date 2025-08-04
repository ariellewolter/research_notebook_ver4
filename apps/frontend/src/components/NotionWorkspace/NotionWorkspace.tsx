import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import SlashCommandMenu, { slashCommands } from './SlashCommands';
import LinkSelector, { LinkableItem } from './LinkSelector';
import DatabaseSelector, { DatabaseEntry } from './DatabaseSelector';
import CrossLinks, { CrossLink } from './CrossLinks';
import LinkCreator from './LinkCreator';
import ImageBlock, { ImageData } from './ImageBlock';
import MathBlock, { MathData } from './MathBlock';
import UniversalLinking from '../UniversalLinking/UniversalLinking';
import LinkRenderer from '../UniversalLinking/LinkRenderer';
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
    Functions as MathIcon
} from '@mui/icons-material';

// Use the same Block interface as Block.tsx
interface Block {
    id: string;
    type: 'text' | 'heading' | 'note' | 'project' | 'protocol' | 'database' | 'pdf' | 'page' | 'experiment' | 'recipe' | 'literature' | 'task' | 'columns' | 'list' | 'code' | 'quote' | 'divider' | 'image' | 'table' | 'math' | 'horizontal' | 'link';
    content: string;
    title?: string;
    entityId?: string;
    createdAt: Date;
    updatedAt: Date;
    order: number;
    isEditing?: boolean;
    isFocused?: boolean;
    columns?: Block[][];
    columnCount?: number;
    layout?: 'vertical' | 'horizontal' | 'grid';
    metadata?: {
        level?: number;
        checked?: boolean;
        language?: string;
        url?: string;
        rows?: number;
        cols?: number;
        width?: number;
        height?: number;
        displayMode?: 'link' | 'embed';
        linkType?: string;
        imageData?: ImageData;
        mathData?: MathData;
    };
}

interface Page {
    id: string;
    title: string;
    blocks: Block[];
    createdAt: Date;
}

const NotionWorkspace: React.FC = () => {
    // Simple state for testing
    const [currentPage, setCurrentPage] = useState<Page>({
        id: '1',
        title: 'Welcome to Your Workspace',
        blocks: [
            {
                id: 'b1',
                type: 'heading',
                content: 'Welcome to Your Workspace',
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 0,
                metadata: { level: 1 }
            },
            {
                id: 'b2',
                type: 'text',
                content: 'Welcome to your new workspace! This is a paragraph block.',
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1,
                isEditing: false
            },
            {
                id: 'b3',
                type: 'heading',
                content: 'Getting Started',
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 2,
                metadata: { level: 2 }
            },
            {
                id: 'b4',
                type: 'text',
                content: 'You can add different types of content blocks using the toolbar or by typing "/" for a quick menu.',
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 3,
                isEditing: false
            },
            {
                id: 'b5',
                type: 'table',
                content: JSON.stringify({
                    headers: ['Feature', 'Description'],
                    rows: [
                        ['Rich Text', 'Bold, italic, and other formatting'],
                        ['Tables', 'Organize data in rows and columns'],
                        ['PDF Export', 'Download your pages as PDF']
                    ]
                }),
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 4
            }
        ],
        createdAt: new Date()
    });

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [selectedPage, setSelectedPage] = useState('Welcome to Your Workspace');
    const [filterValue, setFilterValue] = useState('All');

    const [slashCommandOpen, setSlashCommandOpen] = useState(false);
    const [slashCommandAnchor, setSlashCommandAnchor] = useState<null | HTMLElement>(null);
    const [currentSlashBlockId, setCurrentSlashBlockId] = useState<string | null>(null);
    const [linkSelectorOpen, setLinkSelectorOpen] = useState(false);
    const [currentLinkType, setCurrentLinkType] = useState('');
    const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
    const [contextMenuAnchor, setContextMenuAnchor] = useState<null | HTMLElement>(null);
    const [contextMenuBlockId, setContextMenuBlockId] = useState<string | null>(null);
    const [databaseSelectorOpen, setDatabaseSelectorOpen] = useState(false);
    const [currentDatabaseType, setCurrentDatabaseType] = useState('');
    const [crossLinksOpen, setCrossLinksOpen] = useState(false);
    const [linkCreatorOpen, setLinkCreatorOpen] = useState(false);
    const [selectedBlockForLinks, setSelectedBlockForLinks] = useState<Block | null>(null);

    // Add block handler
    const handleAddBlock = useCallback((type: Block['type']) => {
        const newBlock: Block = {
            id: `block-${Date.now()}`,
            type,
            content: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            order: currentPage.blocks.length,
            isEditing: true
        };

        setCurrentPage(prev => ({
            ...prev,
            blocks: [...prev.blocks, newBlock]
        }));
    }, [currentPage.blocks.length]);



    // Handle slash command
    const handleSlashCommand = useCallback((blockId: string, command: string) => {
        const selectedCommand = slashCommands.find(cmd => cmd.command === command);
        if (selectedCommand) {
            if (selectedCommand.type === 'link') {
                // Check if it's a database-specific command
                if (['/chemical', '/gene', '/equipment', '/database'].includes(command)) {
                    setDatabaseSelectorOpen(true);
                    setCurrentDatabaseType(command.substring(1)); // Remove the '/'
                } else {
                    // Handle other linking commands
                    setCurrentLinkType(command);
                    setLinkSelectorOpen(true);
                }
            } else {
                // Update the current block to the new type
                setCurrentPage(prev => ({
                    ...prev,
                    blocks: prev.blocks.map(block => {
                        if (block.id === (currentSlashBlockId || blockId)) {
                            const updatedBlock: Block = {
                                ...block,
                                type: selectedCommand.type,
                                content: '',
                                updatedAt: new Date()
                            };

                            // Set default data for specific block types
                            if (selectedCommand.type === 'image') {
                                updatedBlock.metadata = {
                                    ...updatedBlock.metadata,
                                    imageData: {
                                        id: `image-${Date.now()}`,
                                        url: '',
                                        alt: 'New Image',
                                        type: 'upload'
                                    }
                                };
                            } else if (selectedCommand.type === 'math') {
                                updatedBlock.metadata = {
                                    ...updatedBlock.metadata,
                                    mathData: {
                                        id: `math-${Date.now()}`,
                                        latex: 'E = mc^2',
                                        displayMode: 'block',
                                        category: 'equation'
                                    }
                                };
                            }

                            return updatedBlock;
                        }
                        return block;
                    })
                }));
            }
        }
        setSlashCommandOpen(false);
        setCurrentSlashBlockId(null);
    }, [slashCommands, currentSlashBlockId]);

    // Handle link item selection
    const handleLinkItemSelect = useCallback((item: LinkableItem, displayMode: 'link' | 'embed') => {
        const linkContent = displayMode === 'link'
            ? `[[${item.title}]]`
            : `@${item.title}`;

        // Use the tracked block ID from the slash command
        if (currentSlashBlockId) {
            setCurrentPage(prev => ({
                ...prev,
                blocks: prev.blocks.map(block =>
                    block.id === currentSlashBlockId
                        ? {
                            ...block,
                            type: 'link',
                            content: linkContent,
                            title: item.title,
                            entityId: item.id,
                            metadata: {
                                ...block.metadata,
                                url: `/${item.type}/${item.id}`,
                                linkType: item.type,
                                displayMode
                            },
                            updatedAt: new Date()
                        }
                        : block
                )
            }));
        }
        setCurrentSlashBlockId(null);
    }, [currentSlashBlockId]);

    // Handle database entry selection
    const handleDatabaseEntrySelect = useCallback((entry: DatabaseEntry) => {
        const linkContent = `[[${entry.name}]]`;

        // Use the tracked block ID from the slash command
        if (currentSlashBlockId) {
            setCurrentPage(prev => ({
                ...prev,
                blocks: prev.blocks.map(block =>
                    block.id === currentSlashBlockId
                        ? {
                            ...block,
                            type: 'link',
                            content: linkContent,
                            title: entry.name,
                            entityId: entry.id,
                            metadata: {
                                ...block.metadata,
                                url: `/database/${entry.id}`,
                                linkType: 'database',
                                displayMode: 'link'
                            },
                            updatedAt: new Date()
                        }
                        : block
                )
            }));
        }
        setCurrentSlashBlockId(null);
    }, [currentSlashBlockId]);

    // Handle image block updates
    const handleImageBlockUpdate = useCallback((blockId: string, imageData: ImageData) => {
        setCurrentPage(prev => ({
            ...prev,
            blocks: prev.blocks.map(block =>
                block.id === blockId
                    ? {
                        ...block,
                        metadata: {
                            ...block.metadata,
                            imageData
                        },
                        updatedAt: new Date()
                    }
                    : block
            )
        }));
    }, []);

    // Handle math block updates
    const handleMathBlockUpdate = useCallback((blockId: string, mathData: MathData) => {
        setCurrentPage(prev => ({
            ...prev,
            blocks: prev.blocks.map(block =>
                block.id === blockId
                    ? {
                        ...block,
                        metadata: {
                            ...block.metadata,
                            mathData
                        },
                        updatedAt: new Date()
                    }
                    : block
            )
        }));
    }, []);

    // Handle divider edit
    const handleDividerEdit = useCallback((blockId: string) => {
        // For now, just show a simple alert. In a real implementation, this would open a dialog
        // to change divider style (solid, dashed, dotted, etc.)
        alert('Divider edit dialog would open here to change style');
    }, []);

    // Cross-linking handlers
    const handleLinkCreated = useCallback(() => {
        // Refresh cross-links if they're open
        if (crossLinksOpen && selectedBlockForLinks) {
            // The CrossLinks component will automatically refresh
        }
    }, [crossLinksOpen, selectedBlockForLinks]);

    const handleCrossLinkClick = useCallback((link: CrossLink) => {
        // Navigate to the linked item
        const linkType = link.sourceType || link.targetType;
        const linkId = link.sourceId || link.targetId;
        window.open(`/${linkType}/${linkId}`, '_blank');
    }, []);

    // Drag and drop handlers
    const handleDragStart = useCallback((e: React.DragEvent, blockId: string) => {
        setDraggedBlockId(blockId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', blockId);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetBlockId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');

        if (draggedId && draggedId !== targetBlockId) {
            setCurrentPage(prev => {
                const blocks = [...prev.blocks];
                const draggedIndex = blocks.findIndex(block => block.id === draggedId);
                const targetIndex = blocks.findIndex(block => block.id === targetBlockId);

                if (draggedIndex !== -1 && targetIndex !== -1) {
                    const [draggedBlock] = blocks.splice(draggedIndex, 1);
                    blocks.splice(targetIndex, 0, draggedBlock);

                    // Update order property for all blocks
                    return {
                        ...prev,
                        blocks: blocks.map((block, index) => ({
                            ...block,
                            order: index
                        }))
                    };
                }
                return prev;
            });
        }
        setDraggedBlockId(null);
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggedBlockId(null);
    }, []);

    // Context menu handlers
    const handleContextMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, blockId: string) => {
        event.preventDefault();
        event.stopPropagation();
        setContextMenuAnchor(event.currentTarget);
        setContextMenuBlockId(blockId);
    }, []);

    const handleContextMenuClose = useCallback(() => {
        setContextMenuAnchor(null);
        setContextMenuBlockId(null);
    }, []);

    const handleContextMenuAction = useCallback((action: string) => {
        if (!contextMenuBlockId) return;

        switch (action) {
            case 'delete':
                setCurrentPage(prev => ({
                    ...prev,
                    blocks: prev.blocks.filter(block => block.id !== contextMenuBlockId)
                }));
                break;
            case 'duplicate':
                const blockToDuplicate = currentPage.blocks.find(block => block.id === contextMenuBlockId);
                if (blockToDuplicate) {
                    const newBlock = {
                        ...blockToDuplicate,
                        id: `block-${Date.now()}-${Math.random()}`,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    setCurrentPage(prev => ({
                        ...prev,
                        blocks: [...prev.blocks, newBlock]
                    }));
                }
                break;
            case 'slash-command':
                setSlashCommandOpen(true);
                setSlashCommandAnchor(contextMenuAnchor);
                setCurrentSlashBlockId(contextMenuBlockId);
                break;
            case 'show-links':
                const blockForLinks = currentPage.blocks.find(block => block.id === contextMenuBlockId);
                if (blockForLinks) {
                    setSelectedBlockForLinks(blockForLinks);
                    setCrossLinksOpen(true);
                }
                break;
            case 'create-link':
                const blockForLinkCreation = currentPage.blocks.find(block => block.id === contextMenuBlockId);
                if (blockForLinkCreation) {
                    setSelectedBlockForLinks(blockForLinkCreation);
                    setLinkCreatorOpen(true);
                }
                break;
        }
        handleContextMenuClose();
    }, [contextMenuBlockId, contextMenuAnchor, currentPage.blocks]);

    // Update block content handler
    const handleBlockContentChange = useCallback((blockId: string, content: string) => {
        setCurrentPage(prev => ({
            ...prev,
            blocks: prev.blocks.map(block =>
                block.id === blockId
                    ? { ...block, content, updatedAt: new Date() }
                    : block
            )
        }));
    }, []);

    const handleBlockEdit = useCallback((blockId: string) => {
        setCurrentPage(prev => ({
            ...prev,
            blocks: prev.blocks.map(block =>
                block.id === blockId
                    ? { ...block, isEditing: true }
                    : block
            )
        }));
    }, []);

    const handleBlockSave = useCallback((blockId: string) => {
        setCurrentPage(prev => ({
            ...prev,
            blocks: prev.blocks.map(block =>
                block.id === blockId
                    ? { ...block, isEditing: false }
                    : block
            )
        }));
    }, []);

    const handleBlockEnter = useCallback((blockId: string) => {
        const blockIndex = currentPage.blocks.findIndex(b => b.id === blockId);
        const newBlock: Block = {
            id: `block-${Date.now()}-${Math.random()}`,
            type: 'text',
            content: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            order: currentPage.blocks[blockIndex].order + 1
        };

        setCurrentPage(prev => {
            const updatedBlocks = [...prev.blocks];
            updatedBlocks.splice(blockIndex + 1, 0, newBlock);

            // Update order for blocks after the new block
            for (let i = blockIndex + 2; i < updatedBlocks.length; i++) {
                updatedBlocks[i].order = updatedBlocks[i].order + 1;
            }

            return {
                ...prev,
                blocks: updatedBlocks
            };
        });

        // Set the new block to editing mode
        setTimeout(() => {
            setCurrentPage(prev => ({
                ...prev,
                blocks: prev.blocks.map(block =>
                    block.id === newBlock.id
                        ? { ...block, isEditing: true }
                        : block
                )
            }));
        }, 10);
    }, [currentPage.blocks]);

    // Delete block handler
    const handleDeleteBlock = useCallback((blockId: string) => {
        setCurrentPage(prev => ({
            ...prev,
            blocks: prev.blocks.filter(block => block.id !== blockId)
        }));
    }, []);

    // Merge block with previous block
    const handleMergeBlock = useCallback((blockId: string) => {
        setCurrentPage(prev => {
            const blockIndex = prev.blocks.findIndex(block => block.id === blockId);
            if (blockIndex <= 0) return prev; // Can't merge first block

            const currentBlock = prev.blocks[blockIndex];
            const previousBlock = prev.blocks[blockIndex - 1];

            // Merge content
            const mergedContent = previousBlock.content + currentBlock.content;

            // Update previous block with merged content
            const updatedBlocks = [...prev.blocks];
            updatedBlocks[blockIndex - 1] = {
                ...previousBlock,
                content: mergedContent,
                updatedAt: new Date()
            };

            // Remove current block
            updatedBlocks.splice(blockIndex, 1);

            return {
                ...prev,
                blocks: updatedBlocks
            };
        });
    }, []);

    // Add row to table
    const handleAddTableRow = useCallback((blockId: string) => {
        setCurrentPage(prev => ({
            ...prev,
            blocks: prev.blocks.map(block => {
                if (block.id === blockId && block.type === 'table') {
                    try {
                        const tableData = JSON.parse(block.content);
                        const newRow = new Array(tableData.headers?.length || 0).fill('');
                        const updatedTableData = {
                            ...tableData,
                            rows: [...(tableData.rows || []), newRow]
                        };
                        return {
                            ...block,
                            content: JSON.stringify(updatedTableData),
                            updatedAt: new Date()
                        };
                    } catch (error) {
                        return block;
                    }
                }
                return block;
            })
        }));
    }, []);

    // Add column to table
    const handleAddTableColumn = useCallback((blockId: string) => {
        setCurrentPage(prev => ({
            ...prev,
            blocks: prev.blocks.map(block => {
                if (block.id === blockId && block.type === 'table') {
                    try {
                        const tableData = JSON.parse(block.content);
                        const newHeader = `Column ${(tableData.headers?.length || 0) + 1}`;
                        const updatedHeaders = [...(tableData.headers || []), newHeader];
                        const updatedRows = (tableData.rows || []).map((row: string[]) => [...row, '']);
                        const updatedTableData = {
                            headers: updatedHeaders,
                            rows: updatedRows
                        };
                        return {
                            ...block,
                            content: JSON.stringify(updatedTableData),
                            updatedAt: new Date()
                        };
                    } catch (error) {
                        return block;
                    }
                }
                return block;
            })
        }));
    }, []);

    // Render block content based on type
    const renderBlockContent = (block: Block) => {
        switch (block.type) {
            case 'text': {
                return (
                    <div
                        className={`relative group flex items-start gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, block.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, block.id)}
                        onDragEnd={handleDragEnd}
                    >
                        {/* Drag Handle */}
                        <div
                            className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                            onClick={(e) => handleContextMenuOpen(e, block.id)}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            {block.isEditing ? (
                                <UniversalLinking
                                    value={block.content}
                                    onChange={(value) => handleBlockContentChange(block.id, value)}
                                    onBlur={() => handleBlockSave(block.id)}
                                    onEnter={() => handleBlockEnter(block.id)}
                                    multiline={true}
                                    rows={1}
                                    placeholder="Type your content here. Use [[ to link or / for commands..."
                                    className="mb-6"
                                />
                            ) : (
                                <div
                                    className="outline-none mb-6 min-h-6 text-gray-800 leading-relaxed text-base cursor-pointer"
                                    onClick={() => handleBlockEdit(block.id)}
                                >
                                    <LinkRenderer content={block.content} />
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            case 'heading': {
                const level = block.metadata?.level || 1;
                const headingProps = {
    contentEditable: true,
    suppressContentEditableWarning: true,
    'data-block-id': block.id,
    className: `outline-none mb-6 font-bold text-gray-900 ${level === 1 ? 'text-3xl' :
        level === 2 ? 'text-2xl' :
            level === 3 ? 'text-xl' :
                level === 4 ? 'text-lg' :
                    level === 5 ? 'text-base' : 'text-sm'
        }`,
    onBlur: (e: React.FocusEvent<HTMLElement>) => handleBlockContentChange(block.id, e.currentTarget.textContent || ''),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
        const textContent = e.currentTarget.textContent || '';
        const cursorPosition = window.getSelection()?.anchorOffset || 0;

        if (e.key === 'Backspace') {
            // Handle intuitive delete behavior for headings
            if (cursorPosition === 0 && (textContent === '' || textContent.length === 1)) {
                e.preventDefault();

                // Convert to text block instead of deleting
                setCurrentPage(prev => ({
                    ...prev,
                    blocks: prev.blocks.map(b =>
                        b.id === block.id
                            ? { ...b, type: 'text', content: '', updatedAt: new Date() }
                            : b
                    )
                }));
            }
        } else if (e.key === 'Enter') {
            // Handle Enter to create new block
            if (e.shiftKey) {
                // Shift+Enter creates a line break
                return;
            }

            e.preventDefault();

            // Create new text block after current block
            const blockIndex = currentPage.blocks.findIndex(b => b.id === block.id);
            const newBlock: Block = {
                id: `block-${Date.now()}-${Math.random()}`,
                type: 'text',
                content: '',
                createdAt: new Date(),
                updatedAt: new Date(),
                order: block.order + 1
            };

            setCurrentPage(prev => {
                const updatedBlocks = [...prev.blocks];
                updatedBlocks.splice(blockIndex + 1, 0, newBlock);

                // Update order for blocks after the new block
                for (let i = blockIndex + 2; i < updatedBlocks.length; i++) {
                    updatedBlocks[i].order = updatedBlocks[i].order + 1;
                }

                return {
                    ...prev,
                    blocks: updatedBlocks
                };
            });

            // Focus the new block after a short delay
            setTimeout(() => {
                const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"]`) as HTMLElement;
                if (newBlockElement) {
                    newBlockElement.focus();
                }
            }, 10);
        }
    }
};

const HeadingComponent = level === 1 ? 'h1' : level === 2 ? 'h2' : level === 3 ? 'h3' :
    level === 4 ? 'h4' : level === 5 ? 'h5' : 'h6';

return (
    <div
        className={`group flex items-start gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, block.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, block.id)}
        onDragEnd={handleDragEnd}
    >
        {/* Drag Handle */}
        <div
            className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            onClick={(e) => handleContextMenuOpen(e, block.id)}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
        </div>

        {/* Content */}
        <div className="flex-1">
            {React.createElement(HeadingComponent, headingProps, block.content)}
        </div>
    </div>
);
            }

            case 'table': {
try {
    const tableData = JSON.parse(block.content);
    return (
        <div
            className={`group flex items-start gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, block.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, block.id)}
            onDragEnd={handleDragEnd}
        >
            {/* Drag Handle */}
            <div
                className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                onClick={(e) => handleContextMenuOpen(e, block.id)}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
            </div>

            {/* Content */}
            <div className="flex-1 mb-6">
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                {tableData.headers?.map((header: string, colIndex: number) => (
                                    <th key={colIndex} className="p-3 text-left font-medium text-gray-700 border-b border-gray-200">
                                        <div
                                            contentEditable
                                            suppressContentEditableWarning={true}
                                            className="outline-none"
                                            onBlur={(e: React.FocusEvent<HTMLElement>) => {
                                                const newHeaders = [...tableData.headers];
                                                newHeaders[colIndex] = e.currentTarget.textContent || '';
                                                const updatedTableData = { ...tableData, headers: newHeaders };
                                                handleBlockContentChange(block.id, JSON.stringify(updatedTableData));
                                            }}
                                        >
                                            {header}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.rows?.map((row: string[], rowIndex: number) => (
                                <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                                    {row.map((cell: string, colIndex: number) => (
                                        <td key={colIndex} className="p-3 text-gray-800 border-b border-gray-100">
                                            <div
                                                contentEditable
                                                suppressContentEditableWarning={true}
                                                className="outline-none"
                                                onBlur={(e: React.FocusEvent<HTMLElement>) => {
                                                    const newRows = [...tableData.rows];
                                                    newRows[rowIndex] = [...newRows[rowIndex]];
                                                    newRows[rowIndex][colIndex] = e.currentTarget.textContent || '';
                                                    const updatedTableData = { ...tableData, rows: newRows };
                                                    handleBlockContentChange(block.id, JSON.stringify(updatedTableData));
                                                }}
                                            >
                                                {cell}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex gap-2 mt-2">
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleAddTableRow(block.id)}
                    >
                        Add Row
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleAddTableColumn(block.id)}
                    >
                        Add Column
                    </Button>
                </div>
            </div>
        </div>
    );
} catch (error) {
    return <div className="text-red-500">Invalid table data</div>;
}
            }

            case 'code': {
                return (
    <div
        className={`group flex items-start gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, block.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, block.id)}
        onDragEnd={handleDragEnd}
    >
        {/* Drag Handle */}
        <div
            className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            onClick={(e) => handleContextMenuOpen(e, block.id)}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
        </div>

        {/* Content */}
        <div className="flex-1">
            <pre
                contentEditable
                suppressContentEditableWarning={true}
                className="outline-none mb-6 p-4 bg-gray-100 rounded-lg font-mono text-sm overflow-x-auto border border-gray-200"
                onBlur={(e: React.FocusEvent<HTMLElement>) => handleBlockContentChange(block.id, e.currentTarget.textContent || '')}
            >
                {block.content}
            </pre>
        </div>
    </div>
);
            }

            case 'quote': {
return (
    <div
        className={`group flex items-start gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, block.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, block.id)}
        onDragEnd={handleDragEnd}
    >
        {/* Drag Handle */}
        <div
            className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            onClick={(e) => handleContextMenuOpen(e, block.id)}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
        </div>

        {/* Content */}
        <div className="flex-1">
            <blockquote
                contentEditable
                suppressContentEditableWarning={true}
                className="outline-none mb-6 pl-4 border-l-4 border-gray-300 italic text-gray-700 bg-gray-50 py-2 rounded-r"
                onBlur={(e: React.FocusEvent<HTMLElement>) => handleBlockContentChange(block.id, e.currentTarget.textContent || '')}
            >
                {block.content}
            </blockquote>
        </div>
    </div>
);
            }

            case 'list': {
return (
    <div
        className={`group flex items-start gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, block.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, block.id)}
        onDragEnd={handleDragEnd}
    >
        {/* Drag Handle */}
        <div
            className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            onClick={(e) => handleContextMenuOpen(e, block.id)}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
        </div>

        {/* Content */}
        <div className="flex-1">
            <ul
                contentEditable
                suppressContentEditableWarning={true}
                className="outline-none mb-6 list-disc list-inside text-gray-800"
                onBlur={(e: React.FocusEvent<HTMLElement>) => handleBlockContentChange(block.id, e.currentTarget.textContent || '')}
            >
                <li>{block.content}</li>
            </ul>
        </div>
    </div>
);
            }

            case 'divider': {
                return (
    <div
        className={`group flex items-center gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, block.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, block.id)}
        onDragEnd={handleDragEnd}
    >
        {/* Drag Handle */}
        <div
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            onClick={(e) => handleContextMenuOpen(e, block.id)}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
        </div>

        {/* Content */}
        <div
            className="flex-1 cursor-pointer"
            onClick={() => handleDividerEdit(block.id)}
        >
            <hr className="my-6 border-gray-300 hover:border-gray-400 transition-colors" />
        </div>
    </div>
);
            }

            case 'link': {
                return (
    <div
        className={`group flex items-start gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, block.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, block.id)}
        onDragEnd={handleDragEnd}
    >
        {/* Drag Handle */}
        <div
            className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            onClick={(e) => handleContextMenuOpen(e, block.id)}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
        </div>

        {/* Content */}
        <div className="flex-1">
            <div className={`mb-6 p-3 border rounded-lg ${block.metadata?.linkType === 'database'
                ? 'bg-green-50 border-green-200'
                : 'bg-blue-50 border-blue-200'
                }`}>
                <div className="flex items-center gap-2">
                    {block.metadata?.linkType === 'database' ? (
                        <StorageIcon className="text-green-600" fontSize="small" />
                    ) : (
                        <LinkIcon className="text-blue-600" fontSize="small" />
                    )}
                    <span className={`font-medium ${block.metadata?.linkType === 'database'
                        ? 'text-green-800'
                        : 'text-blue-800'
                        }`}>
                        {block.metadata?.displayMode === 'embed' ? '@' : '[['}
                        {block.title}
                        {block.metadata?.displayMode === 'embed' ? '' : ']]'}
                    </span>
                    <Chip
                        label={block.metadata?.linkType === 'database' ? 'Database' : (block.metadata?.linkType || 'link')}
                        size="small"
                        variant="outlined"
                        className="text-xs"
                        color={block.metadata?.linkType === 'database' ? 'success' : 'primary'}
                    />
                </div>
                {block.metadata?.displayMode === 'embed' && (
                    <div className="mt-2 text-sm text-gray-600">
                        Embedded view of {block.title}
                    </div>
                )}
            </div>
        </div>
    </div>
);
            }

            case 'image': {
                return (
    <div
        className={`group flex items-start gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, block.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, block.id)}
        onDragEnd={handleDragEnd}
    >
        {/* Drag Handle */}
        <div
            className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            onClick={(e) => handleContextMenuOpen(e, block.id)}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
        </div>

        {/* Content */}
        <div className="flex-1">
            {block.metadata?.imageData ? (
                <ImageBlock
                    data={block.metadata.imageData}
                    onUpdate={(imageData) => handleImageBlockUpdate(block.id, imageData)}
                    onDelete={() => {
                        setCurrentPage(prev => ({
                            ...prev,
                            blocks: prev.blocks.filter(b => b.id !== block.id)
                        }));
                    }}
                />
            ) : (
                <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <ImageIcon className="text-gray-400 mx-auto mb-2" />
                    <Typography variant="body2" color="text.secondary">
                        Click to add image
                    </Typography>
                </div>
            )}
        </div>
    </div>
);
            }

            case 'math': {
                return (
    <div
        className={`group flex items-start gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, block.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, block.id)}
        onDragEnd={handleDragEnd}
    >
        {/* Drag Handle */}
        <div
            className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            onClick={(e) => handleContextMenuOpen(e, block.id)}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
        </div>

        {/* Content */}
        <div className="flex-1">
            {block.metadata?.mathData ? (
                <MathBlock
                    data={block.metadata.mathData}
                    onUpdate={(mathData) => handleMathBlockUpdate(block.id, mathData)}
                    onDelete={() => {
                        setCurrentPage(prev => ({
                            ...prev,
                            blocks: prev.blocks.filter(b => b.id !== block.id)
                        }));
                    }}
                />
            ) : (
                <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <MathIcon className="text-gray-400 mx-auto mb-2" />
                    <Typography variant="body2" color="text.secondary">
                        Click to add equation
                    </Typography>
                </div>
            )}
        </div>
    </div>
);

                        default: {
                return (
                    <div
                        className={`group flex items-start gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, block.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, block.id)}
                        onDragEnd={handleDragEnd}
                    >
                        {/* Drag Handle */}
                        <div
                            className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                            onClick={(e) => handleContextMenuOpen(e, block.id)}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <div
                                contentEditable
                                suppressContentEditableWarning={true}
                                className="outline-none mb-6 min-h-6 text-gray-800 leading-relaxed"
                                onBlur={(e: React.FocusEvent<HTMLElement>) => handleBlockContentChange(block.id, e.currentTarget.textContent || '')}
                            >
                                {block.content}
                            </div>
                        </div>
                    </div>
                );
            }
        }
    };

return (
    <>
        <Box className="h-screen flex flex-col bg-white">
            {/* Blue Header Bar */}
            <Box className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                <Box className="flex items-center gap-6">
                    <Typography variant="h6" className="font-semibold">
                        Electronic Lab Notebook
                    </Typography>

                    {/* Central Search Bar */}
                    <Box className="relative flex-1 max-w-2xl">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <TextField
                            type="text"
                            placeholder="Search notes, projects, PDFs, database..."
                            className="w-full"
                            size="small"
                            fullWidth
                            InputProps={{
                                className: "bg-white rounded-lg pl-10",
                                style: { color: '#374151' }
                            }}
                        />
                    </Box>

                    {/* Filter Dropdown */}
                    <FormControl size="small" className="min-w-24">
                        <Select
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            className="bg-white text-gray-700"
                            displayEmpty
                        >
                            <MenuItem value="All">All</MenuItem>
                            <MenuItem value="Notes">Notes</MenuItem>
                            <MenuItem value="Projects">Projects</MenuItem>
                            <MenuItem value="PDFs">PDFs</MenuItem>
                            <MenuItem value="Database">Database</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Header Icons */}
                <Box className="flex items-center gap-2">
                    <IconButton size="small" className="text-white hover:bg-blue-700">
                        <SearchIcon />
                    </IconButton>
                    <IconButton size="small" className="text-white hover:bg-blue-700">
                        <NotificationsIcon />
                    </IconButton>
                    <IconButton size="small" className="text-white hover:bg-blue-700">
                        <PersonIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Main Content Area */}
            <Box className="flex-1 flex">
                {/* Sidebar */}
                <Box
                    className={`${sidebarOpen ? 'w-48' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 flex flex-col bg-gray-50`}
                    style={{
                        minWidth: sidebarOpen ? '192px' : '0px',
                        width: sidebarOpen ? '192px' : '0px',
                        display: sidebarOpen ? 'flex' : 'none'
                    }}
                >
                    <Box className="p-4 border-b border-gray-200">
                        <Box className="flex items-center justify-between mb-4">
                            <Typography variant="h6" className="font-semibold text-gray-900">
                                Workspace
                            </Typography>
                            <IconButton
                                onClick={() => setSidebarOpen(false)}
                                size="small"
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <XIcon />
                            </IconButton>
                        </Box>

                        <Box className="relative mb-4">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <TextField
                                type="text"
                                placeholder="Search pages..."
                                className="w-full"
                                size="small"
                                fullWidth
                                InputProps={{
                                    startAdornment: <SearchIcon className="text-gray-400 mr-2" />,
                                    className: "pl-10 bg-white"
                                }}
                            />
                        </Box>

                        <Button
                            className="w-full mb-2"
                            variant="contained"
                            startIcon={<AddIcon />}
                            fullWidth
                        >
                            + NEW PAGE
                        </Button>

                        <Box className="space-y-1">
                            <Typography variant="caption" className="text-gray-500 font-medium mb-2 block">
                                EXPORT/IMPORT
                            </Typography>
                            <Button
                                className="w-full justify-start"
                                variant="text"
                                size="small"
                                fullWidth
                                startIcon={<DownloadIcon />}
                            >
                                Export PDF
                            </Button>

                            <Button
                                className="w-full justify-start"
                                variant="text"
                                size="small"
                                fullWidth
                                startIcon={<SaveIcon />}
                            >
                                Export JSON
                            </Button>

                            <Button
                                component="label"
                                className="w-full justify-start"
                                variant="text"
                                size="small"
                                fullWidth
                                startIcon={<UploadIcon />}
                            >
                                Import JSON
                                <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                />
                            </Button>
                        </Box>
                    </Box>

                    <Box className="flex-1 overflow-y-auto p-2">
                        <Box
                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${selectedPage === currentPage.title ? 'bg-blue-50 border border-blue-200' : ''
                                }`}
                            onClick={() => setSelectedPage(currentPage.title)}
                        >
                            <ViewListIcon className="text-gray-400 flex-shrink-0" />
                            <Typography className="text-sm truncate text-gray-700">
                                {currentPage.title}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Main Content */}
                <Box className="flex-1 flex flex-col">
                    {/* Content Header */}
                    <Box className="border-b border-gray-200 p-4 flex items-center justify-between bg-white">
                        <Box className="flex items-center gap-4 flex-1 min-w-0">
                            {!sidebarOpen && (
                                <IconButton
                                    onClick={() => setSidebarOpen(true)}
                                    className="text-gray-600 hover:bg-gray-100 flex-shrink-0"
                                    size="large"
                                >
                                    <MenuIcon />
                                </IconButton>
                            )}

                            <TextField
                                type="text"
                                value={currentPage?.title || ''}
                                onChange={(e) => setCurrentPage(prev => ({ ...prev, title: e.target.value }))}
                                className="text-2xl font-bold flex-1 min-w-0"
                                placeholder="Untitled"
                                variant="standard"
                                fullWidth
                                InputProps={{
                                    style: { fontSize: '1.5rem', fontWeight: 'bold' },
                                    className: "text-gray-900"
                                }}
                            />
                        </Box>

                        <Box className="flex items-center gap-2 flex-shrink-0">
                            <IconButton size="small">
                                <CopyIcon />
                            </IconButton>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<PublishIcon />}
                            >
                                Publish
                            </Button>
                            <Typography variant="body2" color="text.secondary" className="ml-4">
                                {new Date().toLocaleDateString()}
                            </Typography>
                            <IconButton
                                onClick={() => setIsFullScreen(!isFullScreen)}
                                className="text-gray-600"
                            >
                                {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                            </IconButton>
                        </Box>
                    </Box>



                    {/* Content Area */}
                    <Box className="flex-1 overflow-y-auto bg-white">
                        <Box className={`mx-auto py-8 px-8 ${isFullScreen ? 'max-w-none' : 'max-w-4xl'}`}>
                            <Paper elevation={0} className="p-8 border border-gray-100">
                                {currentPage?.blocks.map(block => (
                                    <div key={block.id}>
                                        {renderBlockContent(block)}
                                    </div>
                                ))}

                                <Button
                                    className="flex items-center gap-2 text-gray-400 hover:text-gray-600 py-3 mt-4 w-full justify-start border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-lg"
                                    variant="text"
                                    startIcon={<AddIcon />}
                                    onClick={() => handleAddBlock('text')}
                                >
                                    + ADD A BLOCK
                                </Button>
                            </Paper>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>

        {/* Link Selector */}
        <LinkSelector
            open={linkSelectorOpen}
            onClose={() => setLinkSelectorOpen(false)}
            linkType={currentLinkType}
            onItemSelect={handleLinkItemSelect}
        />

        {/* Database Selector */}
        <DatabaseSelector
            open={databaseSelectorOpen}
            onClose={() => setDatabaseSelectorOpen(false)}
            onSelect={handleDatabaseEntrySelect}
            title={`Link to ${currentDatabaseType.charAt(0).toUpperCase() + currentDatabaseType.slice(1)}`}
        />

        {/* Cross Links Panel */}
        <Dialog
            open={crossLinksOpen}
            onClose={() => setCrossLinksOpen(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CrossLinksIcon />
                    Cross Links
                    {selectedBlockForLinks && (
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            - {selectedBlockForLinks.content.substring(0, 50)}...
                        </Typography>
                    )}
                </Box>
            </DialogTitle>
            <DialogContent>
                {selectedBlockForLinks && (
                    <CrossLinks
                        blockId={selectedBlockForLinks.id}
                        blockType="block"
                        onLinkClick={handleCrossLinkClick}
                        onAddLink={() => {
                            setCrossLinksOpen(false);
                            setLinkCreatorOpen(true);
                        }}
                    />
                )}
            </DialogContent>
        </Dialog>

        {/* Link Creator */}
        <LinkCreator
            open={linkCreatorOpen}
            onClose={() => setLinkCreatorOpen(false)}
            sourceType="block"
            sourceId={selectedBlockForLinks?.id || ''}
            sourceTitle={selectedBlockForLinks?.content.substring(0, 50) + '...' || ''}
            onLinkCreated={handleLinkCreated}
        />

        {/* Context Menu */}
        <Menu
            anchorEl={contextMenuAnchor}
            open={Boolean(contextMenuAnchor)}
            onClose={handleContextMenuClose}
            className="block-context-menu"
            PaperProps={{
                style: {
                    minWidth: 200,
                },
            }}
        >
            <MenuItem onClick={() => handleContextMenuAction('slash-command')}>
                <ListItemIcon>
                    <SlashIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Turn into..." />
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleContextMenuAction('show-links')}>
                <ListItemIcon>
                    <CrossLinksIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Show Links" />
            </MenuItem>
            <MenuItem onClick={() => handleContextMenuAction('create-link')}>
                <ListItemIcon>
                    <LinkIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Create Link" />
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleContextMenuAction('duplicate')}>
                <ListItemIcon>
                    <DuplicateIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Duplicate" />
            </MenuItem>
            <MenuItem onClick={() => handleContextMenuAction('delete')}>
                <ListItemIcon>
                    <DeleteIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Delete" />
            </MenuItem>
        </Menu>
    </>
);
};

export default NotionWorkspace; 