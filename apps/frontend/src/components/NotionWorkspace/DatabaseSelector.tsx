import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Box,
    Typography,
    CircularProgress,
    Tabs,
    Tab,
    Divider
} from '@mui/material';
import {
    Science as ScienceIcon,
    LocalHospital as ChemicalIcon,
    Biotech as GeneIcon,
    Build as ProtocolIcon,
    Inventory as EquipmentIcon,
    Search as SearchIcon,
    Link as LinkIcon
} from '@mui/icons-material';

export interface DatabaseEntry {
    id: string;
    type: string;
    name: string;
    description?: string;
    properties?: string;
    molecularWeight?: number;
    concentration?: string;
    storage?: string;
    supplier?: string;
    catalogNumber?: string;
    purity?: string;
    sequence?: string;
    organism?: string;
    function?: string;
    protocol?: string;
    equipment?: string;
    duration?: string;
    temperature?: string;
    pH?: string;
    createdAt: string;
    metadata?: string;
}

interface DatabaseSelectorProps {
    open: boolean;
    onClose: () => void;
    onSelect: (entry: DatabaseEntry) => void;
    title?: string;
}

const DatabaseSelector: React.FC<DatabaseSelectorProps> = ({
    open,
    onClose,
    onSelect,
    title = "Link to Database Entry"
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [entries, setEntries] = useState<DatabaseEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedEntry, setSelectedEntry] = useState<DatabaseEntry | null>(null);

    // Database entry types and their icons
    const entryTypes = [
        { value: 'all', label: 'All', icon: <SearchIcon /> },
        { value: 'chemical', label: 'Chemicals', icon: <ChemicalIcon /> },
        { value: 'gene', label: 'Genes', icon: <GeneIcon /> },
        { value: 'protocol', label: 'Protocols', icon: <ProtocolIcon /> },
        { value: 'equipment', label: 'Equipment', icon: <EquipmentIcon /> },
        { value: 'organism', label: 'Organisms', icon: <ScienceIcon /> }
    ];

    const getIconForType = (type: string) => {
        const typeConfig = entryTypes.find(t => t.value === type);
        return typeConfig?.icon || <ScienceIcon />;
    };

    const getTypeLabel = (type: string) => {
        const typeConfig = entryTypes.find(t => t.value === type);
        return typeConfig?.label || type;
    };

    const fetchEntries = async () => {
        setLoading(true);
        try {
            let url = '/api/database';
            if (selectedType !== 'all') {
                url += `/type/${selectedType}`;
            }
            if (searchQuery) {
                url += `/search/${encodeURIComponent(searchQuery)}`;
            }

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setEntries(data.data || data || []);
            } else {
                console.error('Failed to fetch database entries');
                setEntries([]);
            }
        } catch (error) {
            console.error('Error fetching database entries:', error);
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchEntries();
        }
    }, [open, selectedType, searchQuery]);

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const handleTypeChange = (event: React.SyntheticEvent, newValue: string) => {
        setSelectedType(newValue);
    };

    const handleEntrySelect = (entry: DatabaseEntry) => {
        setSelectedEntry(entry);
    };

    const handleConfirm = () => {
        if (selectedEntry) {
            onSelect(selectedEntry);
            onClose();
            setSelectedEntry(null);
        }
    };

    const handleClose = () => {
        onClose();
        setSelectedEntry(null);
        setSearchQuery('');
        setSelectedType('all');
    };

    const renderEntryDetails = (entry: DatabaseEntry) => {
        const metadata = entry.metadata ? JSON.parse(entry.metadata) : {};
        
        return (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                    {entry.name}
                </Typography>
                {entry.description && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                        {entry.description}
                    </Typography>
                )}
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip 
                        label={getTypeLabel(entry.type)} 
                        size="small" 
                        icon={getIconForType(entry.type)}
                        color="primary"
                        variant="outlined"
                    />
                    {metadata.concentration && (
                        <Chip label={`Conc: ${metadata.concentration}`} size="small" />
                    )}
                    {metadata.storage && (
                        <Chip label={`Storage: ${metadata.storage}`} size="small" />
                    )}
                    {metadata.supplier && (
                        <Chip label={`Supplier: ${metadata.supplier}`} size="small" />
                    )}
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
                    {metadata.molecularWeight && (
                        <Typography variant="body2">
                            <strong>MW:</strong> {metadata.molecularWeight} g/mol
                        </Typography>
                    )}
                    {metadata.sequence && (
                        <Typography variant="body2">
                            <strong>Sequence:</strong> {metadata.sequence.substring(0, 50)}...
                        </Typography>
                    )}
                    {metadata.organism && (
                        <Typography variant="body2">
                            <strong>Organism:</strong> {metadata.organism}
                        </Typography>
                    )}
                    {metadata.function && (
                        <Typography variant="body2">
                            <strong>Function:</strong> {metadata.function}
                        </Typography>
                    )}
                </Box>
            </Box>
        );
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinkIcon />
                    {title}
                </Box>
            </DialogTitle>
            
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Search database entries..."
                        value={searchQuery}
                        onChange={handleSearch}
                        variant="outlined"
                        size="small"
                        sx={{ mb: 2 }}
                    />
                    
                    <Tabs 
                        value={selectedType} 
                        onChange={handleTypeChange}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        {entryTypes.map((type) => (
                            <Tab
                                key={type.value}
                                value={type.value}
                                label={type.label}
                                icon={type.icon}
                                iconPosition="start"
                            />
                        ))}
                    </Tabs>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', gap: 2, height: 400 }}>
                    {/* Left side - Entry list */}
                    <Box sx={{ flex: 1, overflow: 'auto' }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : entries.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 3 }}>
                                No entries found
                            </Typography>
                        ) : (
                            <List>
                                {entries.map((entry) => (
                                    <ListItem
                                        key={entry.id}
                                        button
                                        selected={selectedEntry?.id === entry.id}
                                        onClick={() => handleEntrySelect(entry)}
                                        sx={{ 
                                            border: '1px solid',
                                            borderColor: selectedEntry?.id === entry.id ? 'primary.main' : 'grey.200',
                                            borderRadius: 1,
                                            mb: 1
                                        }}
                                    >
                                        <ListItemIcon>
                                            {getIconForType(entry.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={entry.name}
                                            secondary={
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {getTypeLabel(entry.type)}
                                                    </Typography>
                                                    {entry.description && (
                                                        <Typography variant="body2" color="text.secondary" noWrap>
                                                            {entry.description}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>

                    {/* Right side - Entry details */}
                    {selectedEntry && (
                        <Box sx={{ flex: 1, borderLeft: 1, borderColor: 'grey.200', pl: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Entry Details
                            </Typography>
                            {renderEntryDetails(selectedEntry)}
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button 
                    onClick={handleConfirm}
                    variant="contained"
                    disabled={!selectedEntry}
                    startIcon={<LinkIcon />}
                >
                    Link Entry
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DatabaseSelector; 