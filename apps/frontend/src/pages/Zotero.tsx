import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Alert,
    Snackbar,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Tabs,
    Tab,
    Badge,
    Avatar,
    Stack,
    Tooltip,
    Fade,
    Skeleton,
    FormControlLabel,
    Checkbox,
    Link,
} from '@mui/material';
import {
    LibraryBooks as ZoteroIcon,
    Settings as SettingsIcon,
    CloudDownload as ImportIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    DragIndicator as DragIcon,
    PictureAsPdf as PdfIcon,
    Article as ArticleIcon,
    Book as BookIcon,
    Search as SearchIcon,
    Sync as SyncIcon,
    Collections as CollectionsIcon,
    InsertDriveFile as FileIcon,
    Link as LinkIcon,
    Tag as TagIcon,
    FilterList as FilterIcon,
    ViewModule as GridIcon,
    ViewList as ListIcon,
    Refresh as RefreshIcon,
    Download as DownloadIcon,
    Preview as PreviewIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { zoteroApi } from '../services/api';
import ZoteroDragDrop from '../components/Zotero/ZoteroDragDrop';
import CSLSupport from '../components/Zotero/CSLSupport';
import ZoteroSyncSettings from '../components/Zotero/ZoteroSyncSettings';

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
    meta?: {
        numChildren?: number;
    };
}

interface ZoteroCollection {
    id: string;
    key: string;
    name: string;
    items?: number;
    parentCollection?: string;
}

interface ZoteroStats {
    totalItems: number;
    recentlyAdded: number;
    collections: number;
    syncedItems: number;
}

const ZoteroPage: React.FC = () => {
    // Core state
    const [isConfigured, setIsConfigured] = useState(false);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<ZoteroItem[]>([]);
    const [collections, setCollections] = useState<ZoteroCollection[]>([]);
    const [stats, setStats] = useState<ZoteroStats>({
        totalItems: 0,
        recentlyAdded: 0,
        collections: 0,
        syncedItems: 0
    });

    // UI state
    const [currentTab, setCurrentTab] = useState(0);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCollection, setSelectedCollection] = useState<string>('all');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [filterType, setFilterType] = useState<string>('all');

    // Dialog states
    const [openConfigDialog, setOpenConfigDialog] = useState(false);
    const [openImportDialog, setOpenImportDialog] = useState(false);
    const [openItemDialog, setOpenItemDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ZoteroItem | null>(null);

    // Form states
    const [config, setConfig] = useState({
        apiKey: '',
        userId: '',
        libraryType: 'user' as 'user' | 'group'
    });

    // Status states
    const [importing, setImporting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Import dialog states
    const [importSearchQuery, setImportSearchQuery] = useState('');
    const [importSelectedCollection, setImportSelectedCollection] = useState<string>('all');
    const [importFilterType, setImportFilterType] = useState<string>('all');
    const [selectedImportItems, setSelectedImportItems] = useState<ZoteroItem[]>([]);
    const [importOptions, setImportOptions] = useState({
        includeMetadata: true,
        createDatabaseEntry: true,
        syncHighlights: false,
        createLinks: true
    });

    // Refs
    const dragOverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        checkConfiguration();
    }, []);

    useEffect(() => {
        if (isConfigured) {
            loadData();
        }
    }, [isConfigured]);

    const checkConfiguration = async () => {
        try {
            // For now, we'll assume not configured and show the setup screen
            // In a real implementation, you'd check if config exists
            setIsConfigured(false);
        } catch (err) {
            console.error('Error checking configuration:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [itemsResponse, collectionsResponse] = await Promise.all([
                zoteroApi.getItems(),
                zoteroApi.getCollections()
            ]);

            setItems(itemsResponse.data);
            setCollections(collectionsResponse.data);

            // Calculate stats
            const recentThreshold = new Date();
            recentThreshold.setDate(recentThreshold.getDate() - 7);

            setStats({
                totalItems: itemsResponse.data.length,
                recentlyAdded: itemsResponse.data.filter((item: ZoteroItem) =>
                    new Date(item.data?.date || 0) > recentThreshold
                ).length,
                collections: collectionsResponse.data.length,
                syncedItems: itemsResponse.data.filter((item: ZoteroItem) => item.pdfUrl).length
            });
        } catch (err) {
            setError('Failed to load Zotero data');
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfigSave = async () => {
        try {
            await zoteroApi.config(config);
            setOpenConfigDialog(false);
            setIsConfigured(true);
            setSuccess('Zotero configuration saved successfully');
            await loadData();
        } catch (err) {
            setError('Failed to save configuration');
            console.error('Error saving config:', err);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await zoteroApi.sync();
            await loadData();
            setSuccess('Library synced successfully');
        } catch (err) {
            setError('Failed to sync library');
            console.error('Error syncing:', err);
        } finally {
            setSyncing(false);
        }
    };

    const handleImportItems = async (selectedItems: ZoteroItem[]) => {
        setImporting(true);
        try {
            for (const item of selectedItems) {
                await zoteroApi.importItem(item.key);
            }
            setSuccess(`Successfully imported ${selectedItems.length} item(s)`);
            setOpenImportDialog(false);
        } catch (err) {
            setError('Failed to import items');
            console.error('Error importing:', err);
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadPDF = async (item: ZoteroItem) => {
        try {
            const pdfUrl = item.pdfUrl || item.data?.url;
            if (!pdfUrl) {
                setError('No PDF URL available for this item');
                return;
            }

            // Create a temporary link element to trigger download
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
            link.target = '_blank';

            // Add to DOM, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setSuccess('PDF download started');
        } catch (err) {
            setError('Failed to download PDF');
            console.error('Error downloading PDF:', err);
        }
    };

    const getFilteredItems = () => {
        let filtered = items;

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.authors?.some(author => author.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Collection filter
        if (selectedCollection !== 'all') {
            filtered = filtered.filter(item =>
                item.collections?.includes(selectedCollection)
            );
        }

        // Type filter
        if (filterType !== 'all') {
            filtered = filtered.filter(item => item.type === filterType);
        }

        // Tag filter
        if (selectedTags.length > 0) {
            filtered = filtered.filter(item =>
                selectedTags.some(tag => item.tags?.includes(tag))
            );
        }

        return filtered;
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'journalArticle':
                return <ArticleIcon />;
            case 'book':
                return <BookIcon />;
            case 'attachment':
                return <PdfIcon />;
            default:
                return <FileIcon />;
        }
    };

    const getItemTypeColor = (type: string) => {
        switch (type) {
            case 'journalArticle':
                return 'primary';
            case 'book':
                return 'secondary';
            case 'attachment':
                return 'error';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <Skeleton variant="rectangular" width="100%" height={200} />
                <Box sx={{ mt: 2 }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} variant="rectangular" height={100} sx={{ mb: 1 }} />
                    ))}
                </Box>
            </Box>
        );
    }

    if (!isConfigured) {
        return (
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ZoteroIcon />
                        Zotero Integration
                    </Typography>
                </Box>

                <Card sx={{
                    textAlign: 'center',
                    py: 6,
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
                }}>
                    <CardContent>
                        <ZoteroIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
                        <Typography variant="h5" gutterBottom>
                            Connect Your Zotero Library
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                            Integrate your Zotero library to import references, sync PDFs, and create automatic citations in your research notes.
                        </Typography>

                        <Stack direction="row" spacing={2} justifyContent="center">
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<SettingsIcon />}
                                onClick={() => setOpenConfigDialog(true)}
                            >
                                Configure Zotero
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<InfoIcon />}
                                href="https://www.zotero.org/support/dev/web_api/v3/start"
                                target="_blank"
                            >
                                Get API Key
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    const filteredItems = getFilteredItems();

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ZoteroIcon />
                    Zotero Library
                </Typography>
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Sync Library">
                        <IconButton onClick={handleSync} disabled={syncing}>
                            {syncing ? <CircularProgress size={24} /> : <SyncIcon />}
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                        onClick={() => setOpenConfigDialog(true)}
                    >
                        Settings
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<ImportIcon />}
                        onClick={() => setOpenImportDialog(true)}
                    >
                        Import Items
                    </Button>
                </Stack>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {stats.totalItems}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Total Items
                                    </Typography>
                                </Box>
                                <ZoteroIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {stats.recentlyAdded}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Recent (7 days)
                                    </Typography>
                                </Box>
                                <AddIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {stats.collections}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Collections
                                    </Typography>
                                </Box>
                                <CollectionsIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        color: 'white'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {stats.syncedItems}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Synced Items
                                    </Typography>
                                </Box>
                                <SyncIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Sync Settings */}
            <Box sx={{ mb: 4 }}>
                <ZoteroSyncSettings />
            </Box>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={currentTab}
                    onChange={(e, newValue) => setCurrentTab(newValue)}
                    variant="fullWidth"
                >
                    <Tab label="Library Items" />
                    <Tab label="Collections" />
                    <Tab label="Recent Activity" />
                    <Tab label="Drag & Drop Import" />
                    <Tab label="CSL Support" />
                </Tabs>
            </Paper>

            {/* Search and Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Collection</InputLabel>
                            <Select
                                value={selectedCollection}
                                onChange={(e) => setSelectedCollection(e.target.value)}
                                label="Collection"
                            >
                                <MenuItem value="all">All Collections</MenuItem>
                                {collections.map((collection) => (
                                    <MenuItem key={collection.key} value={collection.key}>
                                        {collection.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                label="Type"
                            >
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="journalArticle">Articles</MenuItem>
                                <MenuItem value="book">Books</MenuItem>
                                <MenuItem value="attachment">PDFs</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Stack direction="row" spacing={1}>
                            <Tooltip title="Grid View">
                                <IconButton
                                    onClick={() => setViewMode('grid')}
                                    color={viewMode === 'grid' ? 'primary' : 'default'}
                                >
                                    <GridIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="List View">
                                <IconButton
                                    onClick={() => setViewMode('list')}
                                    color={viewMode === 'list' ? 'primary' : 'default'}
                                >
                                    <ListIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Typography variant="body2" color="text.secondary">
                            {filteredItems.length} of {items.length} items
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Tab Content */}
            {currentTab === 0 && (
                <Box>
                    {viewMode === 'grid' ? (
                        <Grid container spacing={3}>
                            {filteredItems.map((item) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={item.key}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: 4
                                            }
                                        }}
                                        onClick={() => {
                                            setSelectedItem(item);
                                            setOpenItemDialog(true);
                                        }}
                                    >
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>
                                                    {getItemIcon(item.type)}
                                                </Avatar>
                                                <Chip
                                                    label={item.type}
                                                    size="small"
                                                    color={getItemTypeColor(item.type) as any}
                                                />
                                            </Box>

                                            <Typography
                                                variant="subtitle1"
                                                fontWeight="bold"
                                                sx={{
                                                    mb: 1,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {item.title}
                                            </Typography>

                                            {item.authors && (
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ mb: 1 }}
                                                >
                                                    {item.authors.slice(0, 2).join(', ')}
                                                    {item.authors.length > 2 && ' et al.'}
                                                </Typography>
                                            )}

                                            {item.year && (
                                                <Typography variant="body2" color="text.secondary">
                                                    {item.year}
                                                </Typography>
                                            )}

                                            {item.tags && item.tags.length > 0 && (
                                                <Box sx={{ mt: 2 }}>
                                                    {item.tags.slice(0, 3).map((tag) => (
                                                        <Chip
                                                            key={tag}
                                                            label={tag}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ mr: 0.5, mb: 0.5 }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Paper>
                            <List>
                                {filteredItems.map((item, index) => (
                                    <React.Fragment key={item.key}>
                                        <ListItem
                                            button
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setOpenItemDialog(true);
                                            }}
                                        >
                                            <ListItemIcon>
                                                {getItemIcon(item.type)}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="subtitle1" fontWeight="medium">
                                                            {item.title}
                                                        </Typography>
                                                        <Chip
                                                            label={item.type}
                                                            size="small"
                                                            color={getItemTypeColor(item.type) as any}
                                                        />
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box>
                                                        {item.authors && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {item.authors.join(', ')}
                                                            </Typography>
                                                        )}
                                                        {item.year && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {item.year}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                        {index < filteredItems.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        </Paper>
                    )}
                </Box>
            )}

            {currentTab === 1 && (
                <Grid container spacing={3}>
                    {collections.map((collection) => (
                        <Grid item xs={12} sm={6} md={4} key={collection.key}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <CollectionsIcon sx={{ mr: 2, color: 'primary.main' }} />
                                            <Typography variant="h6">{collection.name}</Typography>
                                        </Box>
                                        <Badge badgeContent={collection.items || 0} color="primary" />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {currentTab === 2 && (
                <Paper>
                    <List>
                        {items.slice(0, 10).map((item, index) => (
                            <React.Fragment key={item.key}>
                                <ListItem>
                                    <ListItemIcon>
                                        {getItemIcon(item.type)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.title}
                                        secondary={`Added ${item.data?.date || 'Unknown date'}`}
                                    />
                                </ListItem>
                                {index < 9 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}

            {currentTab === 3 && (
                <ZoteroDragDrop />
            )}

            {currentTab === 4 && (
                <CSLSupport
                    items={items.map(item => {
                        // Map Zotero item types to CSL types
                        const mapZoteroTypeToCSL = (zoteroType: string): 'article-journal' | 'article' | 'book' | 'chapter' | 'thesis' | 'report' | 'webpage' | 'dataset' => {
                            switch (zoteroType) {
                                case 'journalArticle': return 'article-journal';
                                case 'book': return 'book';
                                case 'bookSection': return 'chapter';
                                case 'thesis': return 'thesis';
                                case 'report': return 'report';
                                case 'webpage': return 'webpage';
                                case 'dataset': return 'dataset';
                                default: return 'article-journal';
                            }
                        };

                        return {
                            id: item.id,
                            type: mapZoteroTypeToCSL(item.data?.itemType || 'journalArticle'),
                            title: item.title,
                            author: item.data?.creators?.map(creator => ({
                                family: creator.lastName,
                                given: creator.firstName
                            })) || undefined,
                            'container-title': item.data?.publicationTitle,
                            volume: item.data?.volume,
                            issue: item.data?.issue,
                            page: item.data?.pages,
                            issued: item.data?.date ? { 'date-parts': [[parseInt(item.data.date)]] } : undefined,
                            DOI: item.data?.DOI,
                            URL: item.data?.url,
                            abstract: item.data?.abstractNote,
                            keyword: item.data?.tags?.map(tag => tag.tag),
                            'publisher-place': undefined,
                            publisher: undefined,
                            ISBN: undefined,
                            ISSN: undefined,
                        };
                    })}
                />
            )}

            {/* Configuration Dialog */}
            <Dialog open={openConfigDialog} onClose={() => setOpenConfigDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Configure Zotero Integration</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="API Key"
                        value={config.apiKey}
                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                        margin="normal"
                        helperText="Get your API key from https://www.zotero.org/settings/keys"
                    />
                    <TextField
                        fullWidth
                        label="User ID"
                        value={config.userId}
                        onChange={(e) => setConfig({ ...config, userId: e.target.value })}
                        margin="normal"
                        helperText="Your Zotero user ID (numeric)"
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Library Type</InputLabel>
                        <Select
                            value={config.libraryType}
                            onChange={(e) => setConfig({ ...config, libraryType: e.target.value as 'user' | 'group' })}
                        >
                            <MenuItem value="user">Personal Library</MenuItem>
                            <MenuItem value="group">Group Library</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfigDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfigSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="lg" fullWidth>
                <DialogTitle>Import from Zotero</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Select Items to Import</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Choose items from your Zotero library to import as PDFs and references in your research notebook.
                        </Typography>

                        {/* Search and Filter */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    placeholder="Search items to import..."
                                    value={importSearchQuery}
                                    onChange={(e) => setImportSearchQuery(e.target.value)}
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Collection</InputLabel>
                                    <Select
                                        value={importSelectedCollection}
                                        onChange={(e) => setImportSelectedCollection(e.target.value)}
                                        label="Collection"
                                    >
                                        <MenuItem value="all">All Collections</MenuItem>
                                        {collections.map((collection) => (
                                            <MenuItem key={collection.key} value={collection.key}>
                                                {collection.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={importFilterType}
                                        onChange={(e) => setImportFilterType(e.target.value)}
                                        label="Type"
                                    >
                                        <MenuItem value="all">All Types</MenuItem>
                                        <MenuItem value="journalArticle">Articles</MenuItem>
                                        <MenuItem value="book">Books</MenuItem>
                                        <MenuItem value="attachment">PDFs</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        {/* Import Options */}
                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>Import Options</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={importOptions.includeMetadata}
                                                onChange={(e) => setImportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                                            />
                                        }
                                        label="Include full metadata (authors, DOI, abstract)"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={importOptions.createDatabaseEntry}
                                                onChange={(e) => setImportOptions(prev => ({ ...prev, createDatabaseEntry: e.target.checked }))}
                                            />
                                        }
                                        label="Create database entry for reference"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={importOptions.syncHighlights}
                                                onChange={(e) => setImportOptions(prev => ({ ...prev, syncHighlights: e.target.checked }))}
                                            />
                                        }
                                        label="Sync highlights and annotations"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={importOptions.createLinks}
                                                onChange={(e) => setImportOptions(prev => ({ ...prev, createLinks: e.target.checked }))}
                                            />
                                        }
                                        label="Create cross-links to related items"
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Items List */}
                        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                            <List>
                                {filteredItems.map((item) => (
                                    <ListItem
                                        key={item.key}
                                        dense
                                        button
                                        onClick={() => {
                                            const isSelected = selectedImportItems.some(selected => selected.key === item.key);
                                            if (isSelected) {
                                                setSelectedImportItems(prev => prev.filter(selected => selected.key !== item.key));
                                            } else {
                                                setSelectedImportItems(prev => [...prev, item]);
                                            }
                                        }}
                                    >
                                        <ListItemIcon>
                                            <Checkbox
                                                edge="start"
                                                checked={selectedImportItems.some(selected => selected.key === item.key)}
                                                tabIndex={-1}
                                                disableRipple
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="subtitle2" fontWeight="medium">
                                                        {item.title}
                                                    </Typography>
                                                    <Chip
                                                        label={item.type}
                                                        size="small"
                                                        color={getItemTypeColor(item.type) as any}
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    {item.authors && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {item.authors.join(', ')}
                                                        </Typography>
                                                    )}
                                                    {item.data?.publicationTitle && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {item.data.publicationTitle}
                                                        </Typography>
                                                    )}
                                                    {item.data?.DOI && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            DOI: {item.data.DOI}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenImportDialog(false)}>Cancel</Button>
                    <Button
                        onClick={() => handleImportItems(selectedImportItems)}
                        variant="contained"
                        disabled={selectedImportItems.length === 0}
                        startIcon={<ImportIcon />}
                    >
                        Import {selectedImportItems.length} Items
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Item Details Dialog */}
            <Dialog open={openItemDialog} onClose={() => setOpenItemDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {selectedItem && getItemIcon(selectedItem.type)}
                        <Typography variant="h6">{selectedItem?.title}</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedItem && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={8}>
                                <Typography variant="h6" gutterBottom>Details</Typography>

                                {selectedItem.data?.creators && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">Authors</Typography>
                                        <Typography variant="body1">
                                            {selectedItem.data.creators.map((creator, index) => (
                                                <span key={index}>
                                                    {creator.firstName} {creator.lastName}
                                                    {index < selectedItem.data!.creators!.length - 1 ? ', ' : ''}
                                                </span>
                                            ))}
                                        </Typography>
                                    </Box>
                                )}

                                {selectedItem.data?.publicationTitle && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">Journal/Publication</Typography>
                                        <Typography variant="body1">{selectedItem.data.publicationTitle}</Typography>
                                    </Box>
                                )}

                                {selectedItem.data?.date && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                                        <Typography variant="body1">{selectedItem.data.date}</Typography>
                                    </Box>
                                )}

                                {selectedItem.data?.volume && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">Volume/Issue</Typography>
                                        <Typography variant="body1">
                                            Vol. {selectedItem.data.volume}
                                            {selectedItem.data.issue && `, Issue ${selectedItem.data.issue}`}
                                        </Typography>
                                    </Box>
                                )}

                                {selectedItem.data?.pages && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">Pages</Typography>
                                        <Typography variant="body1">{selectedItem.data.pages}</Typography>
                                    </Box>
                                )}

                                {selectedItem.data?.DOI && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">DOI</Typography>
                                        <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                                            {selectedItem.data.DOI}
                                        </Typography>
                                    </Box>
                                )}

                                {selectedItem.data?.url && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">URL</Typography>
                                        <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                                            <Link href={selectedItem.data.url} target="_blank" rel="noopener">
                                                {selectedItem.data.url}
                                            </Link>
                                        </Typography>
                                    </Box>
                                )}

                                {selectedItem.data?.abstractNote && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">Abstract</Typography>
                                        <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                                            {selectedItem.data.abstractNote}
                                        </Typography>
                                    </Box>
                                )}
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="h6" gutterBottom>Actions</Typography>

                                <Stack spacing={2}>
                                    <Button
                                        variant="contained"
                                        startIcon={<ImportIcon />}
                                        onClick={() => {
                                            setOpenItemDialog(false);
                                            setSelectedImportItems([selectedItem]);
                                            setOpenImportDialog(true);
                                        }}
                                        fullWidth
                                    >
                                        Import Item
                                    </Button>

                                    {selectedItem.data?.url && (
                                        <Button
                                            variant="outlined"
                                            startIcon={<LinkIcon />}
                                            href={selectedItem.data.url}
                                            target="_blank"
                                            fullWidth
                                        >
                                            Open Source
                                        </Button>
                                    )}

                                    {selectedItem.data?.DOI && (
                                        <Button
                                            variant="outlined"
                                            startIcon={<LinkIcon />}
                                            href={`https://doi.org/${selectedItem.data.DOI}`}
                                            target="_blank"
                                            fullWidth
                                        >
                                            View DOI
                                        </Button>
                                    )}

                                    <Button
                                        variant="outlined"
                                        startIcon={<DownloadIcon />}
                                        onClick={() => handleDownloadPDF(selectedItem)}
                                        fullWidth
                                        disabled={!selectedItem.data?.url && !selectedItem.pdfUrl}
                                    >
                                        Download PDF
                                    </Button>
                                </Stack>

                                {selectedItem.tags && selectedItem.tags.length > 0 && (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Tags
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selectedItem.tags.map((tag) => (
                                                <Chip
                                                    key={tag}
                                                    label={tag}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenItemDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbars */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
            >
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={4000}
                onClose={() => setSuccess(null)}
            >
                <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ZoteroPage; 