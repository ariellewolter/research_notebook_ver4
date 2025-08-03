import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    TextField,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItem,
    ListItemButton,
    InputAdornment
} from '@mui/material';
import {
    Search as SearchIcon,
    Science as ScienceIcon,
    Assignment as AssignmentIcon,
    Book as BookIcon,
    Description as DescriptionIcon,
    Folder as FolderIcon,
    Article as ArticleIcon,
    Task as TaskIcon,
    TableChart as TableIcon,
    Link as LinkIcon,
    OpenInNew as OpenInNewIcon,
    Close as CloseIcon
} from '@mui/icons-material';

// Import API services
import { notesApi, projectsApi, protocolsApi, recipesApi, tasksApi, pdfsApi, databaseApi } from '../../services/api';

export interface LinkableItem {
    id: string;
    title: string;
    type: 'experiment' | 'project' | 'protocol' | 'recipe' | 'literature' | 'task' | 'pdf' | 'database' | 'note';
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    tags?: string[];
}

interface UniversalLinkingProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
    className?: string;
    onLinkSelect?: (item: LinkableItem) => void;
    onBlur?: () => void;
    onEnter?: () => void;
}

const getIconForType = (type: string) => {
    switch (type) {
        case 'experiment': return <ScienceIcon />;
        case 'project': return <FolderIcon />;
        case 'protocol': return <AssignmentIcon />;
        case 'recipe': return <BookIcon />;
        case 'literature': return <ArticleIcon />;
        case 'task': return <TaskIcon />;
        case 'pdf': return <DescriptionIcon />;
        case 'database': return <TableIcon />;
        case 'note': return <DescriptionIcon />;
        default: return <LinkIcon />;
    }
};

// Slash commands for universal use
const slashCommands = [
    { command: '/experiment', label: 'Link to Experiment', icon: <ScienceIcon />, type: 'experiment' },
    { command: '/project', label: 'Link to Project', icon: <FolderIcon />, type: 'project' },
    { command: '/protocol', label: 'Link to Protocol', icon: <AssignmentIcon />, type: 'protocol' },
    { command: '/recipe', label: 'Link to Recipe', icon: <BookIcon />, type: 'recipe' },
    { command: '/literature', label: 'Link to Literature', icon: <ArticleIcon />, type: 'literature' },
    { command: '/task', label: 'Link to Task', icon: <TaskIcon />, type: 'task' },
    { command: '/pdf', label: 'Link to PDF', icon: <DescriptionIcon />, type: 'pdf' },
    { command: '/database', label: 'Link to Database', icon: <TableIcon />, type: 'database' },
    { command: '/note', label: 'Link to Note', icon: <DescriptionIcon />, type: 'note' },
];

export const UniversalLinking: React.FC<UniversalLinkingProps> = ({
    value,
    onChange,
    placeholder = "Type [[ to link or / for commands...",
    multiline = false,
    rows = 4,
    className = "",
    onLinkSelect,
    onBlur,
    onEnter
}) => {
    const [linkMenuAnchor, setLinkMenuAnchor] = useState<HTMLElement | null>(null);
    const [slashMenuAnchor, setSlashMenuAnchor] = useState<HTMLElement | null>(null);
    const [linkSearchTerm, setLinkSearchTerm] = useState('');
    const [slashSearchTerm, setSlashSearchTerm] = useState('');
    const [linkableItems, setLinkableItems] = useState<LinkableItem[]>([]);
    const [filteredCommands, setFilteredCommands] = useState(slashCommands);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [selectedLinkType, setSelectedLinkType] = useState<string>('');
    const textFieldRef = useRef<HTMLInputElement>(null);

    // Load linkable items from API
    const loadLinkableItems = async () => {
        try {
            const items: LinkableItem[] = [];

            // Load notes
            const notesResponse = await notesApi.getAll();
            const notes = Array.isArray(notesResponse.data) ? notesResponse.data :
                Array.isArray(notesResponse.data.notes) ? notesResponse.data.notes : [];
            notes.forEach((note: any) => {
                items.push({
                    id: note.id,
                    title: note.title,
                    type: 'note',
                    description: note.content?.substring(0, 100),
                    createdAt: new Date(note.createdAt),
                    updatedAt: new Date(note.updatedAt || note.createdAt),
                    tags: [note.type]
                });
            });

            // Load projects
            const projectsResponse = await projectsApi.getAll();
            const projects = Array.isArray(projectsResponse.data) ? projectsResponse.data : [];
            projects.forEach((project: any) => {
                items.push({
                    id: project.id,
                    title: project.name,
                    type: 'project',
                    description: project.description,
                    createdAt: new Date(project.createdAt),
                    updatedAt: new Date(project.updatedAt || project.createdAt),
                    tags: [project.status]
                });
            });

            // Load tasks
            const tasksResponse = await tasksApi.getAll();
            const tasks = Array.isArray(tasksResponse.data) ? tasksResponse.data :
                Array.isArray(tasksResponse.data.tasks) ? tasksResponse.data.tasks : [];
            tasks.forEach((task: any) => {
                items.push({
                    id: task.id,
                    title: task.title,
                    type: 'task',
                    description: task.description,
                    createdAt: new Date(task.createdAt),
                    updatedAt: new Date(task.updatedAt || task.createdAt),
                    tags: [task.status, task.priority]
                });
            });

            setLinkableItems(items);
        } catch (error) {
            console.error('Error loading linkable items:', error);
        }
    };

    useEffect(() => {
        loadLinkableItems();
    }, []);

    // Handle text changes and detect [[ and / commands
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const newCursorPosition = e.target.selectionStart || 0;

        onChange(newValue);
        setCursorPosition(newCursorPosition);

        // Check for [[ linking
        const beforeCursor = newValue.substring(0, newCursorPosition);
        const linkMatch = beforeCursor.match(/\[\[([^\]]*)$/);

        if (linkMatch) {
            setLinkSearchTerm(linkMatch[1]);
            setLinkMenuAnchor(e.target);
        } else {
            setLinkMenuAnchor(null);
        }

        // Check for / commands
        const slashMatch = beforeCursor.match(/\/([^\s]*)$/);

        if (slashMatch) {
            setSlashSearchTerm(slashMatch[1]);
            setSlashMenuAnchor(e.target);

            // Filter commands based on search
            const filtered = slashCommands.filter(cmd =>
                cmd.command.toLowerCase().includes(slashMatch[1].toLowerCase()) ||
                cmd.label.toLowerCase().includes(slashMatch[1].toLowerCase())
            );
            setFilteredCommands(filtered);
        } else {
            setSlashMenuAnchor(null);
        }
    };

    // Handle key events
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && onEnter) {
            e.preventDefault();
            onEnter();
        }
    };

    // Handle link selection
    const handleLinkSelect = (item: LinkableItem) => {
        const beforeCursor = value.substring(0, cursorPosition);
        const afterCursor = value.substring(cursorPosition);

        // Replace [[search with [[item.title]]
        const beforeLink = beforeCursor.replace(/\[\[[^\]]*$/, '');
        const newValue = beforeLink + `[[${item.title}]]` + afterCursor;

        onChange(newValue);
        setLinkMenuAnchor(null);
        setLinkSearchTerm('');

        if (onLinkSelect) {
            onLinkSelect(item);
        }
    };

    // Handle slash command selection
    const handleSlashCommandSelect = (command: any) => {
        const beforeCursor = value.substring(0, cursorPosition);
        const afterCursor = value.substring(cursorPosition);

        // Replace /search with the command
        const beforeSlash = beforeCursor.replace(/\/[^\s]*$/, '');
        const newValue = beforeSlash + command.command + ' ' + afterCursor;

        onChange(newValue);
        setSlashMenuAnchor(null);
        setSlashSearchTerm('');

        // Open link dialog for the selected type
        setSelectedLinkType(command.type);
        setLinkDialogOpen(true);
    };

    // Filter linkable items based on search term
    const filteredItems = linkableItems.filter(item =>
        item.title.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(linkSearchTerm.toLowerCase()))
    );

    return (
        <Box className={className}>
            <TextField
                ref={textFieldRef}
                value={value}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onBlur={onBlur}
                placeholder={placeholder}
                multiline={multiline}
                rows={rows}
                fullWidth
                variant="outlined"
                size="small"
            />

            {/* [[ Link Menu */}
            <Menu
                anchorEl={linkMenuAnchor}
                open={Boolean(linkMenuAnchor)}
                onClose={() => setLinkMenuAnchor(null)}
                PaperProps={{
                    style: {
                        maxHeight: 300,
                        width: 400,
                    },
                }}
            >
                <Box sx={{ p: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Link to:
                    </Typography>
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                            <MenuItem
                                key={item.id}
                                onClick={() => handleLinkSelect(item)}
                                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                            >
                                <ListItemIcon>
                                    {getIconForType(item.type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.title}
                                    secondary={
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.description}
                                            </Typography>
                                            {item.tags && item.tags.length > 0 && (
                                                <Box sx={{ mt: 0.5 }}>
                                                    {item.tags.slice(0, 2).map((tag, index) => (
                                                        <Chip
                                                            key={index}
                                                            label={tag}
                                                            size="small"
                                                            sx={{ mr: 0.5, height: 16 }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    }
                                />
                            </MenuItem>
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                            No items found matching "{linkSearchTerm}"
                        </Typography>
                    )}
                </Box>
            </Menu>

            {/* / Command Menu */}
            <Menu
                anchorEl={slashMenuAnchor}
                open={Boolean(slashMenuAnchor)}
                onClose={() => setSlashMenuAnchor(null)}
                PaperProps={{
                    style: {
                        maxHeight: 300,
                        width: 350,
                    },
                }}
            >
                <Box sx={{ p: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Commands:
                    </Typography>
                    {filteredCommands.map((command) => (
                        <MenuItem
                            key={command.command}
                            onClick={() => handleSlashCommandSelect(command)}
                            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                            <ListItemIcon>
                                {command.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={command.label}
                                secondary={command.command}
                            />
                        </MenuItem>
                    ))}
                </Box>
            </Menu>

            {/* Link Dialog for slash commands */}
            <Dialog
                open={linkDialogOpen}
                onClose={() => setLinkDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Select {selectedLinkType} to link
                    <IconButton
                        onClick={() => setLinkDialogOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        placeholder="Search..."
                        value={linkSearchTerm}
                        onChange={(e) => setLinkSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 2 }}
                    />
                    <List>
                        {filteredItems
                            .filter(item => item.type === selectedLinkType)
                            .map((item) => (
                                <ListItem key={item.id} disablePadding>
                                    <ListItemButton onClick={() => {
                                        handleLinkSelect(item);
                                        setLinkDialogOpen(false);
                                    }}>
                                        <ListItemIcon>
                                            {getIconForType(item.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.title}
                                            secondary={item.description}
                                        />
                                        <IconButton size="small">
                                            <OpenInNewIcon />
                                        </IconButton>
                                    </ListItemButton>
                                </ListItem>
                            ))}
                    </List>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default UniversalLinking; 