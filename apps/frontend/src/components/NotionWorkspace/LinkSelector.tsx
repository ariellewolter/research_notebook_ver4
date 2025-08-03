import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Typography,
    Box,
    Chip,
    IconButton,
    InputAdornment
} from '@mui/material';
import {
    Search as SearchIcon,
    Close as CloseIcon,
    Science as ScienceIcon,
    Assignment as AssignmentIcon,
    Book as BookIcon,
    Description as DescriptionIcon,
    Folder as FolderIcon,
    Article as ArticleIcon,
    Task as TaskIcon,
    TableChart as TableIcon,
    Link as LinkIcon,
    OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

export interface LinkableItem {
    id: string;
    title: string;
    type: 'experiment' | 'project' | 'protocol' | 'recipe' | 'literature' | 'task' | 'pdf' | 'database';
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    tags?: string[];
}

interface LinkSelectorProps {
    open: boolean;
    onClose: () => void;
    linkType: string;
    onItemSelect: (item: LinkableItem, displayMode: 'link' | 'embed') => void;
}

// Mock data for demonstration
const mockData: Record<string, LinkableItem[]> = {
    experiment: [
        { id: '1', title: 'PCR Optimization', type: 'experiment', description: 'Optimizing PCR conditions for gene amplification', createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-20'), tags: ['PCR', 'Molecular Biology'] },
        { id: '2', title: 'Protein Expression', type: 'experiment', description: 'E. coli protein expression and purification', createdAt: new Date('2024-01-10'), updatedAt: new Date('2024-01-18'), tags: ['Protein', 'Expression'] },
        { id: '3', title: 'Cell Culture Setup', type: 'experiment', description: 'Setting up mammalian cell culture conditions', createdAt: new Date('2024-01-05'), updatedAt: new Date('2024-01-12'), tags: ['Cell Culture', 'Mammalian'] },
    ],
    project: [
        { id: '1', title: 'Drug Discovery Pipeline', type: 'project', description: 'High-throughput screening for novel therapeutics', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-25'), tags: ['Drug Discovery', 'HTS'] },
        { id: '2', title: 'CRISPR Gene Editing', type: 'project', description: 'CRISPR-Cas9 gene editing in human cells', createdAt: new Date('2023-12-15'), updatedAt: new Date('2024-01-22'), tags: ['CRISPR', 'Gene Editing'] },
    ],
    protocol: [
        { id: '1', title: 'Western Blot Protocol', type: 'protocol', description: 'Standard western blotting procedure', createdAt: new Date('2024-01-08'), updatedAt: new Date('2024-01-15'), tags: ['Western Blot', 'Protein'] },
        { id: '2', title: 'RNA Extraction', type: 'protocol', description: 'Total RNA extraction from tissue samples', createdAt: new Date('2024-01-03'), updatedAt: new Date('2024-01-10'), tags: ['RNA', 'Extraction'] },
    ],
    recipe: [
        { id: '1', title: 'LB Media Preparation', type: 'recipe', description: 'Luria-Bertani medium for bacterial culture', createdAt: new Date('2024-01-12'), updatedAt: new Date('2024-01-12'), tags: ['Media', 'Bacterial'] },
        { id: '2', title: 'Agarose Gel', type: 'recipe', description: '1% agarose gel for DNA electrophoresis', createdAt: new Date('2024-01-10'), updatedAt: new Date('2024-01-10'), tags: ['Agarose', 'Electrophoresis'] },
    ],
    literature: [
        { id: '1', title: 'CRISPR Review Paper', type: 'literature', description: 'Recent advances in CRISPR technology', createdAt: new Date('2024-01-20'), updatedAt: new Date('2024-01-20'), tags: ['CRISPR', 'Review'] },
        { id: '2', title: 'Protein Expression Methods', type: 'literature', description: 'Methods for recombinant protein expression', createdAt: new Date('2024-01-18'), updatedAt: new Date('2024-01-18'), tags: ['Protein', 'Expression'] },
    ],
    task: [
        { id: '1', title: 'Order Reagents', type: 'task', description: 'Order PCR primers and enzymes', createdAt: new Date('2024-01-25'), updatedAt: new Date('2024-01-25'), tags: ['Order', 'Reagents'] },
        { id: '2', title: 'Prepare Presentation', type: 'task', description: 'Prepare lab meeting presentation', createdAt: new Date('2024-01-24'), updatedAt: new Date('2024-01-24'), tags: ['Presentation', 'Meeting'] },
    ],
    pdf: [
        { id: '1', title: 'Lab Safety Manual', type: 'pdf', description: 'Laboratory safety procedures and guidelines', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01'), tags: ['Safety', 'Manual'] },
        { id: '2', title: 'Equipment Manual', type: 'pdf', description: 'Centrifuge operation manual', createdAt: new Date('2024-01-05'), updatedAt: new Date('2024-01-05'), tags: ['Equipment', 'Manual'] },
    ],
    database: [
        { id: '1', title: 'Sample Database', type: 'database', description: 'Database of all collected samples', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-25'), tags: ['Samples', 'Database'] },
        { id: '2', title: 'Results Database', type: 'database', description: 'Experimental results and data', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-25'), tags: ['Results', 'Data'] },
    ],
};

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
        default: return <LinkIcon />;
    }
};

const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
};

export const LinkSelector: React.FC<LinkSelectorProps> = ({
    open,
    onClose,
    linkType,
    onItemSelect
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<LinkableItem[]>([]);

    useEffect(() => {
        if (open && linkType) {
            const typeKey = linkType.replace('/', '') as keyof typeof mockData;
            setItems(mockData[typeKey] || []);
        }
    }, [open, linkType]);

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleItemSelect = (item: LinkableItem, displayMode: 'link' | 'embed') => {
        onItemSelect(item, displayMode);
        onClose();
        setSearchTerm('');
    };

    const typeLabel = getTypeLabel(linkType.replace('/', ''));

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                style: {
                    maxHeight: '80vh',
                },
            }}
        >
            <DialogTitle className="flex items-center justify-between">
                <Box className="flex items-center gap-2">
                    {getIconForType(linkType.replace('/', ''))}
                    <Typography variant="h6">
                        Link to {typeLabel}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <TextField
                    fullWidth
                    placeholder={`Search ${typeLabel.toLowerCase()}s...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined"
                    size="small"
                    className="mb-4"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />

                <List>
                    {filteredItems.map((item) => (
                        <ListItem key={item.id} disablePadding className="mb-2">
                            <Box className="w-full border border-gray-200 rounded-lg">
                                <ListItemButton
                                    onClick={() => handleItemSelect(item, 'link')}
                                    className="flex items-start p-3"
                                >
                                    <ListItemIcon className="mt-1">
                                        {getIconForType(item.type)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box className="flex items-center gap-2">
                                                <Typography variant="subtitle1" className="font-medium">
                                                    {item.title}
                                                </Typography>
                                                <Chip
                                                    label={getTypeLabel(item.type)}
                                                    size="small"
                                                    variant="outlined"
                                                    className="text-xs"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box className="mt-1">
                                                <Typography variant="body2" color="text.secondary" className="mb-1">
                                                    {item.description}
                                                </Typography>
                                                <Box className="flex items-center gap-2">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Updated: {item.updatedAt.toLocaleDateString()}
                                                    </Typography>
                                                    {item.tags && item.tags.length > 0 && (
                                                        <Box className="flex gap-1">
                                                            {item.tags.slice(0, 2).map((tag, index) => (
                                                                <Chip
                                                                    key={index}
                                                                    label={tag}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    className="text-xs"
                                                                />
                                                            ))}
                                                            {item.tags.length > 2 && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    +{item.tags.length - 2} more
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        }
                                    />
                                </ListItemButton>

                                <Box className="flex border-t border-gray-100">
                                    <ListItemButton
                                        onClick={() => handleItemSelect(item, 'link')}
                                        className="flex-1 text-center py-2"
                                    >
                                        <LinkIcon className="mr-1" fontSize="small" />
                                        <Typography variant="caption">Link</Typography>
                                    </ListItemButton>
                                    <ListItemButton
                                        onClick={() => handleItemSelect(item, 'embed')}
                                        className="flex-1 text-center py-2"
                                    >
                                        <OpenInNewIcon className="mr-1" fontSize="small" />
                                        <Typography variant="caption">Embed</Typography>
                                    </ListItemButton>
                                </Box>
                            </Box>
                        </ListItem>
                    ))}
                </List>

                {filteredItems.length === 0 && (
                    <Box className="text-center py-8">
                        <Typography variant="body2" color="text.secondary">
                            No {typeLabel.toLowerCase()}s found matching "{searchTerm}"
                        </Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default LinkSelector; 