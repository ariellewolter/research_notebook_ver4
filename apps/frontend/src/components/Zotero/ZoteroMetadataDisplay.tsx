import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, 
    Box, Typography, Card, CardContent, Chip, Grid, 
    List, ListItem, ListItemText, ListItemIcon, Divider,
    IconButton, Tooltip, Link, Alert
} from '@mui/material';
import {
    Info as InfoIcon, Person as PersonIcon, 
    Book as BookIcon, Link as LinkIcon,
    CalendarToday as CalendarIcon, Tag as TagIcon,
    Description as DescriptionIcon, Language as LanguageIcon,
    School as SchoolIcon, Business as BusinessIcon
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
        publisher?: string;
        place?: string;
        ISBN?: string;
        ISSN?: string;
        language?: string;
        rights?: string;
        series?: string;
        seriesNumber?: string;
        edition?: string;
        numPages?: string;
        itemType?: string;
    };
    meta?: {
        numChildren?: number;
        creatorSummary?: string;
        parsedDate?: string;
    };
    links?: {
        alternate?: {
            href?: string;
            type?: string;
        };
    };
}

interface ZoteroMetadataDisplayProps {
    open: boolean;
    onClose: () => void;
    zoteroKey?: string;
    item?: ZoteroItem;
}

const ZoteroMetadataDisplay: React.FC<ZoteroMetadataDisplayProps> = ({
    open, onClose, zoteroKey, item
}) => {
    const [metadata, setMetadata] = useState<ZoteroItem | null>(item || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && zoteroKey && !item) {
            fetchMetadata();
        } else if (open && item) {
            setMetadata(item);
        }
    }, [open, zoteroKey, item]);

    const fetchMetadata = async () => {
        if (!zoteroKey) return;

        setLoading(true);
        setError(null);

        try {
            const response = await zoteroApi.getItem(zoteroKey);
            setMetadata(response.data);
        } catch (err) {
            setError('Failed to fetch metadata from Zotero. Please check your configuration.');
        } finally {
            setLoading(false);
        }
    };

    const formatAuthors = (creators?: Array<{ firstName: string; lastName: string; creatorType: string }>) => {
        if (!creators || creators.length === 0) return 'Unknown Author';
        
        const authors = creators
            .filter(creator => creator.creatorType === 'author')
            .map(creator => `${creator.firstName} ${creator.lastName}`);
        
        const editors = creators
            .filter(creator => creator.creatorType === 'editor')
            .map(creator => `${creator.firstName} ${creator.lastName}`);
        
        let result = '';
        if (authors.length > 0) {
            result += authors.join(', ');
        }
        if (editors.length > 0) {
            if (result) result += '; ';
            result += `Eds: ${editors.join(', ')}`;
        }
        
        return result;
    };

    const formatDate = (date?: string) => {
        if (!date) return 'Unknown Date';
        try {
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                return 'Invalid Date';
            }
            return parsedDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Invalid Date';
        }
    };

    const getItemTypeIcon = (itemType?: string) => {
        switch (itemType) {
            case 'journalArticle': return <DescriptionIcon />;
            case 'book': return <BookIcon />;
            case 'bookSection': return <BookIcon />;
            case 'conferencePaper': return <SchoolIcon />;
            case 'thesis': return <SchoolIcon />;
            case 'report': return <BusinessIcon />;
            default: return <DescriptionIcon />;
        }
    };

    const getItemTypeLabel = (itemType?: string) => {
        switch (itemType) {
            case 'journalArticle': return 'Journal Article';
            case 'book': return 'Book';
            case 'bookSection': return 'Book Chapter';
            case 'conferencePaper': return 'Conference Paper';
            case 'thesis': return 'Thesis';
            case 'report': return 'Report';
            default: return itemType || 'Unknown Type';
        }
    };

    if (!metadata && !loading) {
        return null;
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon />
                    Publication Metadata
                </Box>
            </DialogTitle>
            <DialogContent>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <Typography>Loading metadata...</Typography>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {metadata && (
                    <Box>
                        {/* Title and Type */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                    {getItemTypeIcon(metadata.data.itemType)}
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" gutterBottom>
                                            {metadata.data.title || 'Untitled'}
                                        </Typography>
                                        <Chip 
                                            label={getItemTypeLabel(metadata.data.itemType)} 
                                            size="small" 
                                            color="primary" 
                                            variant="outlined"
                                        />
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        <Grid container spacing={3}>
                            {/* Authors */}
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <PersonIcon color="primary" />
                                            <Typography variant="h6">Authors</Typography>
                                        </Box>
                                        <Typography variant="body1">
                                            {formatAuthors(metadata.data.creators)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Publication Details */}
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <BookIcon color="primary" />
                                            <Typography variant="h6">Publication</Typography>
                                        </Box>
                                        {metadata.data.publicationTitle && (
                                            <Typography variant="body1" gutterBottom>
                                                <strong>Journal:</strong> {metadata.data.publicationTitle}
                                            </Typography>
                                        )}
                                        {metadata.data.publisher && (
                                            <Typography variant="body1" gutterBottom>
                                                <strong>Publisher:</strong> {metadata.data.publisher}
                                            </Typography>
                                        )}
                                        {metadata.data.place && (
                                            <Typography variant="body1" gutterBottom>
                                                <strong>Place:</strong> {metadata.data.place}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Publication Info */}
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <CalendarIcon color="primary" />
                                            <Typography variant="h6">Publication Info</Typography>
                                        </Box>
                                        <Grid container spacing={1}>
                                            {metadata.data.date && (
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">
                                                        <strong>Date:</strong> {formatDate(metadata.data.date)}
                                                    </Typography>
                                                </Grid>
                                            )}
                                            {metadata.data.volume && (
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">
                                                        <strong>Volume:</strong> {metadata.data.volume}
                                                    </Typography>
                                                </Grid>
                                            )}
                                            {metadata.data.issue && (
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">
                                                        <strong>Issue:</strong> {metadata.data.issue}
                                                    </Typography>
                                                </Grid>
                                            )}
                                            {metadata.data.pages && (
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">
                                                        <strong>Pages:</strong> {metadata.data.pages}
                                                    </Typography>
                                                </Grid>
                                            )}
                                            {metadata.data.numPages && (
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">
                                                        <strong>Total Pages:</strong> {metadata.data.numPages}
                                                    </Typography>
                                                </Grid>
                                            )}
                                            {metadata.data.edition && (
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">
                                                        <strong>Edition:</strong> {metadata.data.edition}
                                                    </Typography>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Identifiers */}
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <LinkIcon color="primary" />
                                            <Typography variant="h6">Identifiers</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {metadata.data.DOI && (
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">DOI:</Typography>
                                                    <Link 
                                                        href={`https://doi.org/${metadata.data.DOI}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                    >
                                                        {metadata.data.DOI}
                                                    </Link>
                                                </Box>
                                            )}
                                            {metadata.data.ISBN && (
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">ISBN:</Typography>
                                                    <Typography variant="body2">{metadata.data.ISBN}</Typography>
                                                </Box>
                                            )}
                                            {metadata.data.ISSN && (
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">ISSN:</Typography>
                                                    <Typography variant="body2">{metadata.data.ISSN}</Typography>
                                                </Box>
                                            )}
                                            {metadata.data.url && (
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">URL:</Typography>
                                                    <Link 
                                                        href={metadata.data.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                    >
                                                        {metadata.data.url}
                                                    </Link>
                                                </Box>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Abstract */}
                            {metadata.data.abstractNote && (
                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                <DescriptionIcon color="primary" />
                                                <Typography variant="h6">Abstract</Typography>
                                            </Box>
                                            <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                                                {metadata.data.abstractNote}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}

                            {/* Tags */}
                            {metadata.data.tags && metadata.data.tags.length > 0 && (
                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                <TagIcon color="primary" />
                                                <Typography variant="h6">Tags</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                {metadata.data.tags.map((tag, index) => (
                                                    <Chip 
                                                        key={index} 
                                                        label={tag.tag} 
                                                        size="small" 
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}

                            {/* Additional Info */}
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>Additional Information</Typography>
                                        <Grid container spacing={2}>
                                            {metadata.data.language && (
                                                <Grid item xs={6} md={3}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <LanguageIcon fontSize="small" />
                                                        <Typography variant="body2">
                                                            <strong>Language:</strong> {metadata.data.language}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            )}
                                            {metadata.data.rights && (
                                                <Grid item xs={6} md={3}>
                                                    <Typography variant="body2">
                                                        <strong>Rights:</strong> {metadata.data.rights}
                                                    </Typography>
                                                </Grid>
                                            )}
                                            {metadata.data.series && (
                                                <Grid item xs={6} md={3}>
                                                    <Typography variant="body2">
                                                        <strong>Series:</strong> {metadata.data.series}
                                                        {metadata.data.seriesNumber && ` (${metadata.data.seriesNumber})`}
                                                    </Typography>
                                                </Grid>
                                            )}
                                            {metadata.meta?.numChildren && (
                                                <Grid item xs={6} md={3}>
                                                    <Typography variant="body2">
                                                        <strong>Attachments:</strong> {metadata.meta.numChildren}
                                                    </Typography>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ZoteroMetadataDisplay; 