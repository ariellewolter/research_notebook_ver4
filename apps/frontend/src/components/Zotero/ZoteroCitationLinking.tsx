import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, 
    Box, Typography, List, ListItem, ListItemText, ListItemIcon,
    Chip, Alert, CircularProgress, TextField, FormControl,
    InputLabel, Select, MenuItem, Card, CardContent, Divider
} from '@mui/material';
import {
    Link as LinkIcon, Search as SearchIcon, 
    CheckCircle as CheckIcon, Error as ErrorIcon,
    Description as DocumentIcon, Book as BookIcon
} from '@mui/icons-material';
import { zoteroApi } from '../../services/api';

interface ZoteroItem {
    key: string;
    data: {
        title: string;
        creators?: Array<{ firstName: string; lastName: string; creatorType: string }>;
        date?: string;
        publicationTitle?: string;
        volume?: string;
        issue?: string;
        pages?: string;
        DOI?: string;
        url?: string;
        abstractNote?: string;
        tags?: Array<{ tag: string }>;
    };
    meta?: {
        numChildren?: number;
    };
}

interface CitationLink {
    id: string;
    sourceId: string;
    sourceType: 'note' | 'experiment' | 'protocol' | 'project';
    targetZoteroKey: string;
    targetTitle: string;
    citationText: string;
    createdAt: string;
}

interface ZoteroCitationLinkingProps {
    open: boolean;
    onClose: () => void;
    sourceId: string;
    sourceType: 'note' | 'experiment' | 'protocol' | 'project';
    sourceContent: string;
    onLinkCreated: (link: CitationLink) => void;
}

const ZoteroCitationLinking: React.FC<ZoteroCitationLinkingProps> = ({
    open, onClose, sourceId, sourceType, sourceContent, onLinkCreated
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ZoteroItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<ZoteroItem[]>([]);
    const [existingLinks, setExistingLinks] = useState<CitationLink[]>([]);
    const [searchType, setSearchType] = useState<'title' | 'author' | 'doi' | 'tag'>('title');

    useEffect(() => {
        if (open) {
            // Extract potential citations from content
            extractCitationsFromContent();
            // Load existing links
            loadExistingLinks();
        }
    }, [open, sourceContent]);

    const extractCitationsFromContent = () => {
        // Simple citation extraction patterns
        const patterns = [
            /\(([A-Z][a-z]+ et al\.?, \d{4})\)/g, // (Author et al., 2024)
            /\(([A-Z][a-z]+ and [A-Z][a-z]+, \d{4})\)/g, // (Author and Author, 2024)
            /\(([A-Z][a-z]+, \d{4})\)/g, // (Author, 2024)
            /([A-Z][a-z]+ et al\.?, \d{4})/g, // Author et al., 2024
            /([A-Z][a-z]+ and [A-Z][a-z]+, \d{4})/g, // Author and Author, 2024
            /([A-Z][a-z]+, \d{4})/g, // Author, 2024
        ];

        const citations: string[] = [];
        patterns.forEach(pattern => {
            const matches = sourceContent.match(pattern);
            if (matches) {
                citations.push(...matches);
            }
        });

        // Remove duplicates and set as initial search queries
        const uniqueCitations = [...new Set(citations)];
        if (uniqueCitations.length > 0) {
            setSearchQuery(uniqueCitations[0]);
            handleSearch(uniqueCitations[0]);
        }
    };

    const loadExistingLinks = async () => {
        try {
            // This would be a backend call to get existing links
            // For now, we'll use a placeholder
            setExistingLinks([]);
        } catch (err) {
            console.error('Failed to load existing links:', err);
        }
    };

    const handleSearch = async (query?: string) => {
        const searchTerm = query || searchQuery;
        if (!searchTerm.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await zoteroApi.search(searchTerm, { limit: 20 });
            setSearchResults(response.data || []);
        } catch (err) {
            setError('Failed to search Zotero library. Please check your configuration.');
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleItemToggle = (item: ZoteroItem) => {
        setSelectedItems(prev => {
            const exists = prev.find(i => i.key === item.key);
            if (exists) {
                return prev.filter(i => i.key !== item.key);
            } else {
                return [...prev, item];
            }
        });
    };

    const createCitationLinks = async () => {
        if (selectedItems.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            const links: CitationLink[] = [];
            
            for (const item of selectedItems) {
                const link: CitationLink = {
                    id: `${sourceId}-${item.key}`,
                    sourceId,
                    sourceType,
                    targetZoteroKey: item.key,
                    targetTitle: item.data.title || 'Untitled',
                    citationText: formatCitation(item),
                    createdAt: new Date().toISOString()
                };
                
                links.push(link);
                onLinkCreated(link);
            }

            setExistingLinks(prev => [...prev, ...links]);
            setSelectedItems([]);
            setSearchResults([]);
        } catch (err) {
            setError('Failed to create citation links.');
        } finally {
            setLoading(false);
        }
    };

    const formatCitation = (item: ZoteroItem): string => {
        const authors = item.data.creators?.filter(c => c.creatorType === 'author')
            .map(c => `${c.firstName} ${c.lastName}`).join(', ') || 'Unknown Author';
        const year = item.data.date ? new Date(item.data.date).getFullYear() : '';
        const title = item.data.title || 'Untitled';
        const journal = item.data.publicationTitle || '';
        
        return `${authors} (${year}). ${title}. ${journal}`;
    };

    const formatAuthors = (creators?: Array<{ firstName: string; lastName: string; creatorType: string }>) => {
        if (!creators || creators.length === 0) return 'Unknown Author';
        return creators
            .filter(creator => creator.creatorType === 'author')
            .map(creator => `${creator.firstName} ${creator.lastName}`)
            .join(', ');
    };

    const getSourceTypeIcon = () => {
        switch (sourceType) {
            case 'note': return <DocumentIcon />;
            case 'experiment': return <BookIcon />;
            case 'protocol': return <BookIcon />;
            case 'project': return <BookIcon />;
            default: return <DocumentIcon />;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinkIcon />
                    Citation Linking
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Link citations in your content to Zotero references for automatic backlinks and metadata.
                </Typography>

                {/* Source Information */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {getSourceTypeIcon()}
                            <Typography variant="subtitle1" fontWeight="bold">
                                {sourceType.charAt(0).toUpperCase() + sourceType.slice(1)} Content
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {sourceContent.length > 200 
                                ? `${sourceContent.substring(0, 200)}...`
                                : sourceContent
                            }
                        </Typography>
                    </CardContent>
                </Card>

                {/* Search Section */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Search Zotero Library</Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <FormControl sx={{ minWidth: 120 }}>
                            <InputLabel>Search Type</InputLabel>
                            <Select
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value as any)}
                                label="Search Type"
                            >
                                <MenuItem value="title">Title</MenuItem>
                                <MenuItem value="author">Author</MenuItem>
                                <MenuItem value="doi">DOI</MenuItem>
                                <MenuItem value="tag">Tag</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <TextField
                            fullWidth
                            label="Search Query"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        
                        <Button
                            variant="contained"
                            onClick={() => handleSearch()}
                            disabled={loading || !searchQuery.trim()}
                            startIcon={<SearchIcon />}
                        >
                            Search
                        </Button>
                    </Box>

                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Search Results ({searchResults.length})
                            </Typography>
                            <List sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                                {searchResults.map((item) => {
                                    const isSelected = selectedItems.find(i => i.key === item.key);
                                    return (
                                        <ListItem 
                                            key={item.key} 
                                            dense
                                            button
                                            onClick={() => handleItemToggle(item)}
                                            selected={!!isSelected}
                                        >
                                            <ListItemIcon>
                                                {isSelected ? <CheckIcon color="success" /> : <DocumentIcon />}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.data.title || 'Untitled'}
                                                secondary={
                                                    <Box>
                                                        <Typography variant="body2">
                                                            {formatAuthors(item.data.creators)}
                                                            {item.data.date && ` (${new Date(item.data.date).getFullYear()})`}
                                                        </Typography>
                                                        {item.data.publicationTitle && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {item.data.publicationTitle}
                                                            </Typography>
                                                        )}
                                                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                                            {item.data.DOI && (
                                                                <Chip 
                                                                    label={`DOI: ${item.data.DOI}`} 
                                                                    size="small" 
                                                                    color="primary" 
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                            {item.data.date && (
                                                                <Chip 
                                                                    label={new Date(item.data.date).getFullYear()} 
                                                                    size="small" 
                                                                    color="info" 
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </Box>
                    )}
                </Box>

                {/* Selected Items */}
                {selectedItems.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Selected for Linking ({selectedItems.length})
                        </Typography>
                        <List dense>
                            {selectedItems.map((item) => (
                                <ListItem key={item.key}>
                                    <ListItemIcon>
                                        <CheckIcon color="success" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.data.title || 'Untitled'}
                                        secondary={formatCitation(item)}
                                    />
                                </ListItem>
                            ))}
                        </List>
                        <Button
                            variant="contained"
                            onClick={createCitationLinks}
                            disabled={loading}
                            startIcon={<LinkIcon />}
                            sx={{ mt: 1 }}
                        >
                            Create Citation Links
                        </Button>
                    </Box>
                )}

                {/* Existing Links */}
                {existingLinks.length > 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Existing Citation Links ({existingLinks.length})
                        </Typography>
                        <List dense>
                            {existingLinks.map((link) => (
                                <ListItem key={link.id}>
                                    <ListItemIcon>
                                        <LinkIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={link.targetTitle}
                                        secondary={link.citationText}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}

                {/* Instructions */}
                <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        <strong>How citation linking works:</strong>
                    </Typography>
                    <Typography variant="body2" component="div">
                        1. Search for references in your Zotero library
                    </Typography>
                    <Typography variant="body2" component="div">
                        2. Select the items you want to link to your content
                    </Typography>
                    <Typography variant="body2" component="div">
                        3. Create citation links for automatic backlinks and metadata
                    </Typography>
                    <Typography variant="body2" component="div">
                        4. Linked citations will appear in your content with clickable references
                    </Typography>
                </Alert>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ZoteroCitationLinking; 