import React, { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    TextField, 
    List, 
    ListItem, 
    ListItemText,
    CircularProgress,
    Alert,
    Typography,
    Box
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface ZoteroItem {
    key: string;
    data: {
        title: string;
        creators?: Array<{ firstName?: string; lastName?: string; name?: string }>;
        date?: string;
        publicationTitle?: string;
        DOI?: string;
        abstractNote?: string;
        itemType: string;
    };
}

interface ZoteroCitationModalProps {
    open: boolean;
    onClose: () => void;
    onSelectCitation: (citation: any) => void;
}

const ZoteroCitationModal: React.FC<ZoteroCitationModalProps> = ({ open, onClose, onSelectCitation }) => {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<number | null>(null);
    const [results, setResults] = useState<ZoteroItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Search Zotero when search term changes
    useEffect(() => {
        const searchZotero = async () => {
            if (!search.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/zotero/search/${encodeURIComponent(search.trim())}`);
                if (!response.ok) {
                    throw new Error('Failed to search Zotero');
                }
                const data = await response.json();
                setResults(data.items || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Search failed');
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(searchZotero, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const formatAuthors = (creators?: Array<{ firstName?: string; lastName?: string; name?: string }>) => {
        if (!creators || creators.length === 0) return '';
        return creators.map(creator => 
            creator.name || `${creator.firstName || ''} ${creator.lastName || ''}`.trim()
        ).join(', ');
    };

    const formatCitation = (item: ZoteroItem) => {
        const authors = formatAuthors(item.data.creators);
        const year = item.data.date ? new Date(item.data.date).getFullYear() : '';
        const title = item.data.title || '';
        const journal = item.data.publicationTitle || '';
        
        if (authors && year) {
            return `${authors} (${year}). ${title}. ${journal}`;
        }
        return title;
    };

    const handleSelectCitation = () => {
        if (selected !== null && results[selected]) {
            const item = results[selected];
            const citation = {
                key: item.key,
                title: formatCitation(item),
                authors: formatAuthors(item.data.creators),
                year: item.data.date ? new Date(item.data.date).getFullYear().toString() : '',
                journal: item.data.publicationTitle || '',
                doi: item.data.DOI || '',
                abstract: item.data.abstractNote || '',
                zoteroData: item.data
            };
            onSelectCitation(citation);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Search Zotero Library</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="Search Zotero"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    placeholder="Enter search terms..."
                />
                
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress />
                    </Box>
                )}

                {!loading && results.length === 0 && search.trim() && (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No results found
                    </Typography>
                )}

                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {results.map((item, idx) => (
                        <ListItem
                            key={item.key}
                            button
                            selected={selected === idx}
                            onClick={() => setSelected(idx)}
                            sx={{ 
                                border: '1px solid #eee', 
                                borderRadius: 1, 
                                mb: 1,
                                '&.Mui-selected': {
                                    backgroundColor: 'primary.light',
                                    color: 'primary.contrastText'
                                }
                            }}
                        >
                            <ListItemText 
                                primary={item.data.title}
                                secondary={
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {formatAuthors(item.data.creators)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {item.data.publicationTitle} • {item.data.date ? new Date(item.data.date).getFullYear() : ''}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleSelectCitation}
                    variant="contained"
                    disabled={selected === null}
                >
                    Insert Citation
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ZoteroCitationModal; 