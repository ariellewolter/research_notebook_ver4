import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    TextField,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Paper,
    CircularProgress,
    Alert,
    Snackbar,
    Chip,
    Avatar,
    Stack,
    Tooltip,
    Tabs,
    Tab,
    Badge,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    InputAdornment,
    Fade,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Menu,
    MenuItem as MenuItemComponent,
    ListItemButton,
    ListItemAvatar
} from '@mui/material';
import {
    Upload as UploadIcon,
    Download as DownloadIcon,
    Delete as DeleteIcon,
    PictureAsPdf as PdfIcon,
    Search as SearchIcon,
    Highlight as HighlightIcon,
    Note as NoteIcon,
    Link as LinkIcon,
    Fullscreen as FullscreenIcon,
    LibraryBooks as ZoteroIcon,
    CloudDownload as ImportIcon,
    Settings as SettingsIcon,
    FilterList as FilterIcon,
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
    Sort as SortIcon,
    Refresh as RefreshIcon,
    Add as AddIcon,
    Folder as FolderIcon,
    Collections as CollectionsIcon,
    Tag as TagIcon,
    CalendarToday as CalendarIcon,
    Person as PersonIcon,
    ExpandMore as ExpandMoreIcon,
    Sync as SyncIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Warning as WarningIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon,
    Bookmark as BookmarkIcon,
    BookmarkBorder as BookmarkBorderIcon,
    Share as ShareIcon,
    ContentCopy as CopyIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Archive as ArchiveIcon,
    Unarchive as UnarchiveIcon,
    Label as LabelIcon,
    Category as CategoryIcon,
    Storage as StorageIcon,
    Cloud as CloudIcon,
    LocalOffer as LocalOfferIcon
} from '@mui/icons-material';

// Import existing services
import { pdfsApi, notesApi, databaseApi, zoteroApi } from '../services/api';
import ZoteroConfig from '../components/Zotero/ZoteroConfig';
import ZoteroDragDrop from '../components/Zotero/ZoteroDragDrop';

interface PDF {
    id: string;
    title: string;
    filename: string;
    fileSize: number;
    uploadedAt: string;
    highlightsCount?: number;
    source?: 'local' | 'zotero' | 'imported';
    zoteroKey?: string;
    authors?: string[];
    year?: number;
    journal?: string;
    doi?: string;
    tags?: string[];
    collections?: string[];
    isFavorite?: boolean;
    isArchived?: boolean;
    notes?: string;
}

interface ZoteroItem {
    id: string;
    key: string;
    title: string;
    type: string;
    authors?: string[];
    year?: number;
    url?: string;
    pdfUrl?: string;
    collections?: string[];
    tags?: string[];
    data?: {
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
        itemType?: string;
    };
}

interface Highlight {
    id: string;
    text: string;
    page: number;
    note?: string;
    createdAt: string;
    links?: Array<{ id: string; title: string }>;
}

interface PDFFilters {
    source: string[];
    collections: string[];
    tags: string[];
    authors: string[];
    yearRange: { start: number | null; end: number | null };
    hasHighlights: boolean | null;
    isFavorite: boolean | null;
    isArchived: boolean | null;
    sortBy: 'title' | 'date' | 'size' | 'authors' | 'year';
    sortOrder: 'asc' | 'desc';
}

const PDFManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [pdfs, setPdfs] = useState<PDF[]>([]);
    const [zoteroItems, setZoteroItems] = useState<ZoteroItem[]>([]);
    const [selectedPdf, setSelectedPdf] = useState<PDF | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [showZoteroConfig, setShowZoteroConfig] = useState(false);
    const [showZoteroImport, setShowZoteroImport] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [filters, setFilters] = useState<PDFFilters>({
        source: [],
        collections: [],
        tags: [],
        authors: [],
        yearRange: { start: null, end: null },
        hasHighlights: null,
        isFavorite: null,
        isArchived: null,
        sortBy: 'date',
        sortOrder: 'desc'
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        itemId: string | null;
    } | null>(null);

    useEffect(() => {
        loadAllPDFs();
    }, []);

    useEffect(() => {
        if (selectedPdf) {
            loadHighlights(selectedPdf.id);
        }
    }, [selectedPdf]);

    const loadAllPDFs = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadLocalPDFs(),
                loadZoteroPDFs()
            ]);
        } catch (error) {
            console.error('Error loading PDFs:', error);
            setError('Failed to load PDFs');
        } finally {
            setLoading(false);
        }
    };

    const loadLocalPDFs = async () => {
        try {
            const response = await pdfsApi.getAll();
            const localPdfs = Array.isArray(response.data) ? response.data :
                Array.isArray(response.data.pdfs) ? response.data.pdfs :
                    Array.isArray(response.data.items) ? response.data.items : [];

            const localPdfsWithSource = localPdfs.map((pdf: any) => ({
                ...pdf,
                source: 'local' as const
            }));

            setPdfs(prev => {
                const zoteroPdfs = prev.filter(pdf => pdf.source === 'zotero');
                return [...localPdfsWithSource, ...zoteroPdfs];
            });
        } catch (error) {
            console.error('Error loading local PDFs:', error);
        }
    };

    const loadZoteroPDFs = async () => {
        try {
            const response = await zoteroApi.getItems();
            const zoteroPdfs = response.data
                .filter((item: ZoteroItem) => item.type === 'journalArticle' || item.type === 'book')
                .map((item: ZoteroItem) => ({
                    id: item.key,
                    title: item.data?.title || item.title,
                    filename: `${item.data?.title || item.title}.pdf`,
                    fileSize: 0, // Zotero doesn't provide file size
                    uploadedAt: item.data?.date || new Date().toISOString(),
                    source: 'zotero' as const,
                    zoteroKey: item.key,
                    authors: item.data?.creators?.map(creator => `${creator.firstName} ${creator.lastName}`) || item.authors,
                    year: item.data?.date ? new Date(item.data.date).getFullYear() : item.year,
                    journal: item.data?.publicationTitle,
                    doi: item.data?.DOI,
                    tags: item.data?.tags?.map(tag => tag.tag) || item.tags,
                    collections: item.collections,
                    highlightsCount: 0
                }));

            setPdfs(prev => {
                const localPdfs = prev.filter(pdf => pdf.source === 'local');
                return [...localPdfs, ...zoteroPdfs];
            });
        } catch (error) {
            console.error('Error loading Zotero PDFs:', error);
        }
    };

    const loadHighlights = async (pdfId: string) => {
        try {
            const response = await pdfsApi.getHighlights(pdfId);
            setHighlights(response.data || []);
        } catch (error) {
            console.error('Error loading highlights:', error);
        }
    };

    const handleFileUpload = async (file: File) => {
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await pdfsApi.upload(formData);
            setSuccess('PDF uploaded successfully');
            loadAllPDFs();
            setShowUploadDialog(false);
        } catch (error) {
            console.error('Error uploading PDF:', error);
            setError('Failed to upload PDF');
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePdf = async (pdfId: string) => {
        try {
            await pdfsApi.delete(pdfId);
            setSuccess('PDF deleted successfully');
            loadAllPDFs();
        } catch (error) {
            console.error('Error deleting PDF:', error);
            setError('Failed to delete PDF');
        }
    };

    const handleToggleFavorite = async (pdfId: string) => {
        try {
            const pdf = pdfs.find(p => p.id === pdfId);
            if (pdf) {
                const updatedPdf = { ...pdf, isFavorite: !pdf.isFavorite };
                await pdfsApi.update(pdfId, updatedPdf);
                setPdfs(prev => prev.map(p => p.id === pdfId ? updatedPdf : p));
                setSuccess(`PDF ${updatedPdf.isFavorite ? 'added to' : 'removed from'} favorites`);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            setError('Failed to update favorite status');
        }
    };

    const handleToggleArchive = async (pdfId: string) => {
        try {
            const pdf = pdfs.find(p => p.id === pdfId);
            if (pdf) {
                const updatedPdf = { ...pdf, isArchived: !pdf.isArchived };
                await pdfsApi.update(pdfId, updatedPdf);
                setPdfs(prev => prev.map(p => p.id === pdfId ? updatedPdf : p));
                setSuccess(`PDF ${updatedPdf.isArchived ? 'archived' : 'unarchived'}`);
            }
        } catch (error) {
            console.error('Error toggling archive:', error);
            setError('Failed to update archive status');
        }
    };

    const handleZoteroImport = async (items: ZoteroItem[]) => {
        try {
            setSuccess(`Successfully imported ${items.length} PDF(s) from Zotero`);
            loadAllPDFs();
            setShowZoteroImport(false);
        } catch (error) {
            console.error('Error importing from Zotero:', error);
            setError('Failed to import from Zotero');
        }
    };

    const handleExportPDFs = () => {
        const exportData = {
            pdfs: sortedPdfs,
            highlights: selectedPdf ? highlights : [],
            exportDate: new Date().toISOString(),
            totalPDFs: sortedPdfs.length,
            totalHighlights: highlights.length,
            searchTerm,
            filters
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pdfs-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setSuccess('PDFs exported successfully');
    };

    const filteredPdfs = pdfs.filter(pdf => {
        const matchesSearch = pdf.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pdf.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pdf.authors?.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesSource = filters.source.length === 0 || filters.source.includes(pdf.source || 'local');
        const matchesCollections = filters.collections.length === 0 ||
            pdf.collections?.some(col => filters.collections.includes(col));
        const matchesTags = filters.tags.length === 0 ||
            pdf.tags?.some(tag => filters.tags.includes(tag));
        const matchesAuthors = filters.authors.length === 0 ||
            pdf.authors?.some(author => filters.authors.includes(author));
        const matchesYear = !filters.yearRange.start && !filters.yearRange.end ||
            (pdf.year && pdf.year >= (filters.yearRange.start || 0) &&
                pdf.year <= (filters.yearRange.end || 9999));
        const matchesHighlights = filters.hasHighlights === null ||
            (filters.hasHighlights ? (pdf.highlightsCount || 0) > 0 : (pdf.highlightsCount || 0) === 0);
        const matchesFavorite = filters.isFavorite === null || pdf.isFavorite === filters.isFavorite;
        const matchesArchived = filters.isArchived === null || pdf.isArchived === filters.isArchived;

        return matchesSearch && matchesSource && matchesCollections && matchesTags &&
            matchesAuthors && matchesYear && matchesHighlights && matchesFavorite && matchesArchived;
    });

    const sortedPdfs = [...filteredPdfs].sort((a, b) => {
        let aValue: any, bValue: any;

        switch (filters.sortBy) {
            case 'title':
                aValue = a.title.toLowerCase();
                bValue = b.title.toLowerCase();
                break;
            case 'date':
                aValue = new Date(a.uploadedAt);
                bValue = new Date(b.uploadedAt);
                break;
            case 'size':
                aValue = a.fileSize;
                bValue = b.fileSize;
                break;
            case 'authors':
                aValue = a.authors?.join(', ') || '';
                bValue = b.authors?.join(', ') || '';
                break;
            case 'year':
                aValue = a.year || 0;
                bValue = b.year || 0;
                break;
            default:
                aValue = a.title.toLowerCase();
                bValue = b.title.toLowerCase();
        }

        if (filters.sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
    });

    const handleContextMenu = (event: React.MouseEvent, itemId: string) => {
        event.preventDefault();
        setContextMenu({
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            itemId
        });
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const renderPDFList = () => (
        <Box>
            {viewMode === 'list' ? (
                <List>
                    {sortedPdfs.map((pdf, index) => (
                        <React.Fragment key={pdf.id}>
                            <ListItem
                                button
                                onContextMenu={(e) => handleContextMenu(e, pdf.id)}
                                onClick={() => setSelectedPdf(pdf)}
                                selected={selectedPdf?.id === pdf.id}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'action.hover'
                                    }
                                }}
                            >
                                <ListItemIcon>
                                    <Avatar sx={{ bgcolor: pdf.source === 'zotero' ? 'primary.main' : 'secondary.main' }}>
                                        {pdf.source === 'zotero' ? <ZoteroIcon /> : <PdfIcon />}
                                    </Avatar>
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="body1" fontWeight={pdf.isFavorite ? 'bold' : 'normal'}>
                                                {pdf.title}
                                            </Typography>
                                            {pdf.isFavorite && <StarIcon sx={{ color: 'warning.main', fontSize: 16 }} />}
                                            {pdf.isArchived && <ArchiveIcon sx={{ color: 'text.secondary', fontSize: 16 }} />}
                                            {pdf.source === 'zotero' && <ZoteroIcon sx={{ color: 'primary.main', fontSize: 16 }} />}
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {pdf.authors?.join(', ')} {pdf.year && `(${pdf.year})`}
                                            </Typography>
                                            <Typography variant="caption" display="block">
                                                {pdf.filename} • {pdf.fileSize > 0 ? `${(pdf.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Zotero'} • {new Date(pdf.uploadedAt).toLocaleDateString()}
                                            </Typography>
                                            {pdf.highlightsCount && pdf.highlightsCount > 0 && (
                                                <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                                    <HighlightIcon sx={{ fontSize: 12, color: 'warning.main' }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {pdf.highlightsCount} highlights
                                                    </Typography>
                                                </Box>
                                            )}
                                            {pdf.tags && pdf.tags.length > 0 && (
                                                <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                                                    {pdf.tags.slice(0, 3).map((tag, idx) => (
                                                        <Chip key={idx} label={tag} size="small" variant="outlined" />
                                                    ))}
                                                    {pdf.tags.length > 3 && (
                                                        <Chip label={`+${pdf.tags.length - 3}`} size="small" variant="outlined" />
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    }
                                />
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <Tooltip title={pdf.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleFavorite(pdf.id);
                                            }}
                                        >
                                            {pdf.isFavorite ? <StarIcon color="warning" /> : <StarBorderIcon />}
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={pdf.isArchived ? 'Unarchive' : 'Archive'}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleArchive(pdf.id);
                                            }}
                                        >
                                            {pdf.isArchived ? <UnarchiveIcon /> : <ArchiveIcon />}
                                        </IconButton>
                                    </Tooltip>
                                    {pdf.source === 'local' && (
                                        <>
                                            <Tooltip title="Download">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(`/api/pdfs/${pdf.id}/file`, '_blank');
                                                    }}
                                                >
                                                    <DownloadIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeletePdf(pdf.id);
                                                    }}
                                                    sx={{ color: 'error.main' }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )}
                                </Box>
                            </ListItem>
                            {index < sortedPdfs.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
            ) : (
                <Grid container spacing={2}>
                    {sortedPdfs.map((pdf) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={pdf.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        boxShadow: 4
                                    }
                                }}
                                onClick={() => setSelectedPdf(pdf)}
                            >
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                        <Avatar sx={{ bgcolor: pdf.source === 'zotero' ? 'primary.main' : 'secondary.main' }}>
                                            {pdf.source === 'zotero' ? <ZoteroIcon /> : <PdfIcon />}
                                        </Avatar>
                                        <Box flex={1}>
                                            <Typography variant="h6" noWrap>
                                                {pdf.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {pdf.authors?.join(', ')} {pdf.year && `(${pdf.year})`}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" mb={1}>
                                        {pdf.filename}
                                    </Typography>

                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption" color="text.secondary">
                                            {pdf.fileSize > 0 ? `${(pdf.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Zotero'}
                                        </Typography>
                                        <Box display="flex" gap={0.5}>
                                            {pdf.isFavorite && <StarIcon sx={{ color: 'warning.main', fontSize: 16 }} />}
                                            {pdf.isArchived && <ArchiveIcon sx={{ color: 'text.secondary', fontSize: 16 }} />}
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );

    const renderFilters = () => (
        <Accordion expanded={showFilters} onChange={() => setShowFilters(!showFilters)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                    <FilterIcon />
                    <Typography>Filters & Sort</Typography>
                    {Object.values(filters).some(value =>
                        Array.isArray(value) ? value.length > 0 : value !== null && value !== 'date' && value !== 'desc'
                    ) && (
                            <Badge badgeContent="!" color="primary" />
                        )}
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Source</InputLabel>
                            <Select
                                multiple
                                value={filters.source}
                                onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value as string[] }))}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip key={value} label={value} size="small" />
                                        ))}
                                    </Box>
                                )}
                            >
                                <MenuItem value="local">Local PDFs</MenuItem>
                                <MenuItem value="zotero">Zotero PDFs</MenuItem>
                                <MenuItem value="imported">Imported PDFs</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={filters.sortBy}
                                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                            >
                                <MenuItem value="title">Title</MenuItem>
                                <MenuItem value="date">Date</MenuItem>
                                <MenuItem value="size">File Size</MenuItem>
                                <MenuItem value="authors">Authors</MenuItem>
                                <MenuItem value="year">Year</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={filters.isFavorite === true}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        isFavorite: e.target.checked ? true : null
                                    }))}
                                />
                            }
                            label="Favorites Only"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={filters.isArchived === true}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        isArchived: e.target.checked ? true : null
                                    }))}
                                />
                            }
                            label="Archived Only"
                        />
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    );

    const renderHighlights = () => (
        <Box>
            <Typography variant="h6" gutterBottom>
                Highlights & Notes
            </Typography>
            {highlights.length > 0 ? (
                <List>
                    {highlights.map((highlight) => (
                        <ListItem key={highlight.id}>
                            <ListItemIcon>
                                <HighlightIcon color="warning" />
                            </ListItemIcon>
                            <ListItemText
                                primary={highlight.text}
                                secondary={
                                    <Box>
                                        <Typography variant="caption" display="block">
                                            Page {highlight.page} • {new Date(highlight.createdAt).toLocaleDateString()}
                                        </Typography>
                                        {highlight.note && (
                                            <Typography variant="body2" color="text.secondary" mt={1}>
                                                Note: {highlight.note}
                                            </Typography>
                                        )}
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Alert severity="info">No highlights found for this PDF.</Alert>
            )}
        </Box>
    );

    if (loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    PDF Management
                </Typography>
                <Box display="flex" gap={1}>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportPDFs}
                    >
                        Export
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<ZoteroIcon />}
                        onClick={() => setShowZoteroConfig(true)}
                    >
                        Zotero Config
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<ImportIcon />}
                        onClick={() => setShowZoteroImport(true)}
                    >
                        Import from Zotero
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<UploadIcon />}
                        onClick={() => setShowUploadDialog(true)}
                    >
                        Upload PDF
                    </Button>
                </Box>
            </Box>

            {/* Search and Controls */}
            <Box sx={{ mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="Search PDFs by title, filename, or authors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box display="flex" gap={1} justifyContent="flex-end">
                            <Tooltip title="List View">
                                <IconButton
                                    onClick={() => setViewMode('list')}
                                    color={viewMode === 'list' ? 'primary' : 'default'}
                                >
                                    <ViewListIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Grid View">
                                <IconButton
                                    onClick={() => setViewMode('grid')}
                                    color={viewMode === 'grid' ? 'primary' : 'default'}
                                >
                                    <ViewModuleIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Refresh">
                                <IconButton onClick={loadAllPDFs}>
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* Filters */}
            {renderFilters()}

            {/* Main Content */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">
                                    All PDFs ({sortedPdfs.length})
                                </Typography>
                                <Box display="flex" gap={1}>
                                    <Chip
                                        label={`${pdfs.filter(p => p.source === 'local').length} Local`}
                                        color="secondary"
                                        size="small"
                                    />
                                    <Chip
                                        label={`${pdfs.filter(p => p.source === 'zotero').length} Zotero`}
                                        color="primary"
                                        size="small"
                                    />
                                </Box>
                            </Box>
                            {renderPDFList()}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    {selectedPdf ? (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    PDF Details
                                </Typography>
                                <Box mb={2}>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Title:</strong> {selectedPdf.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Authors:</strong> {selectedPdf.authors?.join(', ') || 'Unknown'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Year:</strong> {selectedPdf.year || 'Unknown'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Journal:</strong> {selectedPdf.journal || 'Unknown'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Source:</strong> {selectedPdf.source}
                                    </Typography>
                                    {selectedPdf.doi && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>DOI:</strong> {selectedPdf.doi}
                                        </Typography>
                                    )}
                                </Box>
                                {renderHighlights()}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    PDF Details
                                </Typography>
                                <Alert severity="info">
                                    Select a PDF to view details and highlights.
                                </Alert>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>

            {/* Dialogs */}
            <Dialog open={showUploadDialog} onClose={() => setShowUploadDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Upload PDF</DialogTitle>
                <DialogContent>
                    <Box sx={{ p: 2, border: '2px dashed', borderColor: 'grey.300', borderRadius: 1, textAlign: 'center' }}>
                        <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Drop PDF files here
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            or click to select files
                        </Typography>
                        <input
                            type="file"
                            accept=".pdf"
                            multiple
                            onChange={(e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) {
                                    handleFileUpload(files[0]);
                                }
                            }}
                            style={{ display: 'none' }}
                            id="pdf-upload"
                        />
                        <label htmlFor="pdf-upload">
                            <Button variant="contained" component="span">
                                Select PDF
                            </Button>
                        </label>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowUploadDialog(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>

            <ZoteroConfig
                open={showZoteroConfig}
                onClose={() => setShowZoteroConfig(false)}
                onConfigSuccess={() => {
                    setSuccess('Zotero configured successfully!');
                    setShowZoteroConfig(false);
                }}
            />

            <ZoteroDragDrop
                open={showZoteroImport}
                onClose={() => setShowZoteroImport(false)}
                onImportSuccess={handleZoteroImport}
            />

            {/* Context Menu */}
            <Menu
                open={contextMenu !== null}
                onClose={handleCloseContextMenu}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                <MenuItemComponent onClick={handleCloseContextMenu}>
                    <ListItemIcon>
                        <ViewIcon fontSize="small" />
                    </ListItemIcon>
                    View Details
                </MenuItemComponent>
                <MenuItemComponent onClick={handleCloseContextMenu}>
                    <ListItemIcon>
                        <DownloadIcon fontSize="small" />
                    </ListItemIcon>
                    Download
                </MenuItemComponent>
                <MenuItemComponent onClick={handleCloseContextMenu}>
                    <ListItemIcon>
                        <ShareIcon fontSize="small" />
                    </ListItemIcon>
                    Share
                </MenuItemComponent>
                <Divider />
                <MenuItemComponent onClick={handleCloseContextMenu}>
                    <ListItemIcon>
                        <StarIcon fontSize="small" />
                    </ListItemIcon>
                    Toggle Favorite
                </MenuItemComponent>
                <MenuItemComponent onClick={handleCloseContextMenu}>
                    <ListItemIcon>
                        <ArchiveIcon fontSize="small" />
                    </ListItemIcon>
                    Toggle Archive
                </MenuItemComponent>
            </Menu>

            {/* Notifications */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
            >
                <Alert onClose={() => setError(null)} severity="error">
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess(null)}
            >
                <Alert onClose={() => setSuccess(null)} severity="success">
                    {success}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default PDFManagement; 