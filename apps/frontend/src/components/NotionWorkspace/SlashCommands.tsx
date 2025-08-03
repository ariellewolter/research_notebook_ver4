import React, { useState, useEffect, useRef } from 'react';
import {
    MenuItem,
    ListItemIcon,
    ListItemText,
    Box,
    Typography,
    Divider,
    Paper
} from '@mui/material';
import {
    TextFields as TypeIcon,
    Title as TitleIcon,
    FormatListBulleted as ListIcon,
    CheckBox as CheckBoxIcon,
    TableChart as TableIcon,
    FormatQuote as QuoteIcon,
    Code as CodeIcon,
    MoreHoriz as MoreHorizIcon,
    ViewColumn as ColumnsIcon,
    Image as ImageIcon,
    Functions as MathIcon,
    HorizontalRule as HorizontalIcon,
    Science as ScienceIcon,
    Assignment as AssignmentIcon,
    Book as BookIcon,
    Description as DescriptionIcon,
    Folder as FolderIcon,
    Article as ArticleIcon,
    Task as TaskIcon,
    Link as LinkIcon,
    LocalHospital as ChemicalIcon,
    Biotech as GeneIcon,
    Inventory as EquipmentIcon
} from '@mui/icons-material';

export interface SlashCommand {
    command: string;
    label: string;
    icon: React.ReactNode;
    type: 'text' | 'heading' | 'note' | 'project' | 'protocol' | 'database' | 'pdf' | 'page' | 'experiment' | 'recipe' | 'literature' | 'task' | 'columns' | 'list' | 'code' | 'quote' | 'divider' | 'image' | 'table' | 'math' | 'horizontal' | 'link';
    category?: 'content' | 'linking';
    description?: string;
    keywords?: string[];
}

export const slashCommands: SlashCommand[] = [
    // Content blocks
    { command: '/text', label: 'Text', icon: <TypeIcon />, type: 'text', category: 'content', keywords: ['paragraph', 'body', 'normal'] },
    { command: '/heading', label: 'Heading', icon: <TitleIcon />, type: 'heading', category: 'content', keywords: ['title', 'header', 'h1', 'h2', 'h3'] },
    { command: '/list', label: 'Bullet list', icon: <ListIcon />, type: 'list', category: 'content', keywords: ['bullet', 'unordered', 'ul'] },
    { command: '/todo', label: 'Todo', icon: <CheckBoxIcon />, type: 'task', category: 'content', keywords: ['checkbox', 'task', 'todo', 'check'] },
    { command: '/table', label: 'Table', icon: <TableIcon />, type: 'table', category: 'content', keywords: ['grid', 'spreadsheet', 'data'] },
    { command: '/quote', label: 'Quote', icon: <QuoteIcon />, type: 'quote', category: 'content', keywords: ['blockquote', 'citation', 'reference'] },
    { command: '/code', label: 'Code', icon: <CodeIcon />, type: 'code', category: 'content', keywords: ['programming', 'syntax', 'script'] },
    { command: '/divider', label: 'Divider', icon: <MoreHorizIcon />, type: 'divider', category: 'content', keywords: ['separator', 'line', 'break'] },
    { command: '/columns', label: 'Columns', icon: <ColumnsIcon />, type: 'columns', category: 'content', keywords: ['layout', 'side', 'split'] },
    { command: '/image', label: 'Image', icon: <ImageIcon />, type: 'image', category: 'content', keywords: ['picture', 'photo', 'media', 'upload'] },
    { command: '/math', label: 'Math', icon: <MathIcon />, type: 'math', category: 'content', keywords: ['equation', 'formula', 'latex', 'mathematics'] },
    { command: '/horizontal', label: 'Horizontal line', icon: <HorizontalIcon />, type: 'horizontal', category: 'content', keywords: ['hr', 'line', 'separator'] },

    // Linking commands
    { command: '/experiment', label: 'Link to Experiment', icon: <ScienceIcon />, type: 'link', category: 'linking', description: 'Link to an existing experiment', keywords: ['lab', 'research', 'test', 'trial'] },
    { command: '/project', label: 'Link to Project', icon: <FolderIcon />, type: 'link', category: 'linking', description: 'Link to an existing project', keywords: ['folder', 'work', 'assignment'] },
    { command: '/protocol', label: 'Link to Protocol', icon: <AssignmentIcon />, type: 'link', category: 'linking', description: 'Link to an existing protocol', keywords: ['procedure', 'method', 'steps'] },
    { command: '/recipe', label: 'Link to Recipe', icon: <BookIcon />, type: 'link', category: 'linking', description: 'Link to an existing recipe', keywords: ['cooking', 'formula', 'method'] },
    { command: '/literature', label: 'Link to Literature', icon: <ArticleIcon />, type: 'link', category: 'linking', description: 'Link to literature notes', keywords: ['paper', 'article', 'reference', 'citation'] },
    { command: '/task', label: 'Link to Task', icon: <TaskIcon />, type: 'link', category: 'linking', description: 'Link to an existing task', keywords: ['todo', 'assignment', 'work'] },
    { command: '/pdf', label: 'Link to PDF', icon: <DescriptionIcon />, type: 'link', category: 'linking', description: 'Link to a PDF document', keywords: ['document', 'file', 'paper'] },
    { command: '/database', label: 'Link to Database', icon: <TableIcon />, type: 'link', category: 'linking', description: 'Link to database entries', keywords: ['data', 'entry', 'record'] },

    // Database-specific commands
    { command: '/chemical', label: 'Link to Chemical', icon: <ChemicalIcon />, type: 'link', category: 'linking', description: 'Link to a chemical compound', keywords: ['compound', 'molecule', 'chemistry'] },
    { command: '/gene', label: 'Link to Gene', icon: <GeneIcon />, type: 'link', category: 'linking', description: 'Link to a gene or genetic element', keywords: ['dna', 'genetic', 'biology'] },
    { command: '/equipment', label: 'Link to Equipment', icon: <EquipmentIcon />, type: 'link', category: 'linking', description: 'Link to laboratory equipment', keywords: ['tool', 'instrument', 'device'] },
];

interface SlashCommandMenuProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    onCommandSelect: (command: string) => void;
    searchQuery?: string;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
    anchorEl,
    open,
    onClose,
    onCommandSelect,
    searchQuery = ''
}) => {
    const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>(slashCommands);
    const menuRef = useRef<HTMLDivElement>(null);

    // Filter commands based on search query from the text block
    useEffect(() => {
        if (!searchQuery) {
            setFilteredCommands(slashCommands);
            return;
        }

        const query = searchQuery.toLowerCase().replace('/', '');
        const filtered = slashCommands.filter(cmd => {
            const commandMatch = cmd.command.toLowerCase().includes(query);
            const labelMatch = cmd.label.toLowerCase().includes(query);
            const descriptionMatch = cmd.description?.toLowerCase().includes(query) || false;
            const keywordMatch = cmd.keywords?.some(keyword => keyword.toLowerCase().includes(query)) || false;

            return commandMatch || labelMatch || descriptionMatch || keywordMatch;
        });

        setFilteredCommands(filtered);
    }, [searchQuery]);

    // Position the menu relative to the anchor element
    useEffect(() => {
        if (open && anchorEl && menuRef.current) {
            const rect = anchorEl.getBoundingClientRect();
            const menu = menuRef.current;
            menu.style.position = 'fixed';
            menu.style.top = `${rect.bottom + 5}px`;
            menu.style.left = `${rect.left}px`;
            menu.style.zIndex = '9999';
        }
    }, [open, anchorEl, searchQuery]);

    const contentCommands = filteredCommands.filter(cmd => cmd.category === 'content');
    const linkingCommands = filteredCommands.filter(cmd => cmd.category === 'linking');

    const handleCommandSelect = (command: string) => {
        onCommandSelect(command);
        onClose();
    };

    if (!open) return null;

    return (
        <Paper
            ref={menuRef}
            elevation={8}
            sx={{
                maxHeight: 400,
                width: 320,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 1
            }}
        >
            {/* Results */}
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {filteredCommands.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No commands found for "{searchQuery}"
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* Content Blocks Section */}
                        {contentCommands.length > 0 && (
                            <>
                                <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                                        Content Blocks
                                    </Typography>
                                </Box>
                                {contentCommands.map((cmd) => (
                                    <MenuItem
                                        key={cmd.command}
                                        onClick={() => handleCommandSelect(cmd.command)}
                                        sx={{ py: 1.5, px: 2 }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            {cmd.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={cmd.label}
                                            secondary={cmd.command}
                                            primaryTypographyProps={{ fontSize: '14px', fontWeight: 500 }}
                                            secondaryTypographyProps={{ fontSize: '12px' }}
                                        />
                                    </MenuItem>
                                ))}
                            </>
                        )}

                        {/* Linking Section */}
                        {linkingCommands.length > 0 && (
                            <>
                                {contentCommands.length > 0 && <Divider />}
                                <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                                        Link to...
                                    </Typography>
                                </Box>
                                {linkingCommands.map((cmd) => (
                                    <MenuItem
                                        key={cmd.command}
                                        onClick={() => handleCommandSelect(cmd.command)}
                                        sx={{ py: 1.5, px: 2 }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>
                                            {cmd.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={cmd.label}
                                            secondary={cmd.description}
                                            primaryTypographyProps={{ fontSize: '14px', fontWeight: 500 }}
                                            secondaryTypographyProps={{ fontSize: '12px' }}
                                        />
                                    </MenuItem>
                                ))}
                            </>
                        )}
                    </>
                )}
            </Box>
        </Paper>
    );
};

export default SlashCommandMenu; 