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
} from '@mui/icons-material';
import { zoteroApi } from '../services/api';

interface ZoteroItem {
    id: string;
    title: string;
    type: string;
    authors?: string[];
    year?: number;
    url?: string;
    pdfUrl?: string;
    collections?: string[];
    tags?: string[];
}

interface ZoteroCollection {
    id: string;
    name: string;
    items?: ZoteroItem[];
}

const Zotero: React.FC = () => {
    const [config, setConfig] = useState({
        apiKey: '',
        userId: '',
        libraryType: 'user',
    });
    const [isConfigured, setIsConfigured] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openConfigDialog, setOpenConfigDialog] = useState(false);
    const [openImportDialog, setOpenImportDialog] = useState(false);
    const [collections, setCollections] = useState<ZoteroCollection[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<string>('');
    const [items, setItems] = useState<ZoteroItem[]>([]);
    const [importing, setImporting] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const dropZoneRef = useRef<HTMLDivElement>(null);

    // Load configuration on component mount
    useEffect(() => {
        loadConfiguration();
    }, []);

    const loadConfiguration = async () => {
        try {
            const response = await zoteroApi.getConfig();
            if (response.data.apiKey && response.data.userId) {
                setConfig(response.data);
                setIsConfigured(true);
                loadCollections();
            }
        } catch (err: any) {
            console.error('Error loading Zotero configuration:', err);
        }
    };

    const loadCollections = async () => {
        if (!isConfigured) return;

        try {
            setLoading(true);
            const response = await zoteroApi.getCollections();
            setCollections(response.data.collections || response.data || []);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load Zotero collections');
            console.error('Error loading collections:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadItems = async (collectionId?: string) => {
        if (!isConfigured) return;

        try {
            setLoading(true);
            const response = await zoteroApi.getItems(collectionId);
            setItems(response.data.items || response.data || []);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load Zotero items');
            console.error('Error loading items:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!config.apiKey.trim() || !config.userId.trim()) {
            setSnackbar({
                open: true,
                message: 'Please fill in all required fields',
                severity: 'error',
            });
            return;
        }

        try {
            setLoading(true);
            await zoteroApi.updateConfig(config);
            setSnackbar({
                open: true,
                message: 'Zotero configuration saved successfully',
                severity: 'success',
            });
            setIsConfigured(true);
            setOpenConfigDialog(false);
            loadCollections();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to save configuration',
                severity: 'error',
            });
            console.error('Error saving configuration:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImportItem = async (item: ZoteroItem) => {
        try {
            setImporting(true);
            await zoteroApi.importItem(item.id);
            setSnackbar({
                open: true,
                message: 'Item imported successfully',
                severity: 'success',
            });
            // Refresh items
            loadItems(selectedCollection);
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to import item',
                severity: 'error',
            });
            console.error('Error importing item:', err);
        } finally {
            setImporting(false);
        }
    };

    const handleDrop = async (event: React.DragEvent) => {
        event.preventDefault();

        const files = Array.from(event.dataTransfer.files);
        const pdfFiles = files.filter(file => file.type === 'application/pdf');

        if (pdfFiles.length === 0) {
            setSnackbar({
                open: true,
                message: 'Please drop PDF files only',
                severity: 'error',
            });
            return;
        }

        try {
            setImporting(true);
            for (const file of pdfFiles) {
                await zoteroApi.uploadPdf(file);
            }
            setSnackbar({
                open: true,
                message: `${pdfFiles.length} PDF(s) uploaded to Zotero successfully`,
                severity: 'success',
            });
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to upload PDFs',
                severity: 'error',
            });
            console.error('Error uploading PDFs:', err);
        } finally {
            setImporting(false);
        }
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'journalArticle':
                return <ArticleIcon />;
            case 'book':
                return <BookIcon />;
            case 'pdf':
                return <PdfIcon />;
            default:
                return <ZoteroIcon />;
        }
    };

    const getItemColor = (type: string) => {
        switch (type) {
            case 'journalArticle':
                return 'primary';
            case 'book':
                return 'secondary';
            case 'pdf':
                return 'error';
            default:
                return 'default';
        }
    };

    if (!isConfigured) {
        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">Zotero Integration</Typography>
                    <Button
                        variant="contained"
                        startIcon={<SettingsIcon />}
                        onClick={() => setOpenConfigDialog(true)}
                    >
                        Configure Zotero
                    </Button>
                </Box>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Connect your Zotero library to import references and PDFs.
                </Typography>

                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <ZoteroIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Zotero Not Configured
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Configure your Zotero API credentials to start importing references and PDFs.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<SettingsIcon />}
                            onClick={() => setOpenConfigDialog(true)}
                        >
                            Configure Zotero
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Zotero Integration</Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                        onClick={() => setOpenConfigDialog(true)}
                        sx={{ mr: 1 }}
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
                </Box>
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Manage your Zotero library integration and import references.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Drag & Drop Zone */}
            <Paper
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    mb: 3,
                    backgroundColor: '#fafafa',
                    '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: '#f5f5f5',
                    },
                }}
            >
                <DragIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    Drop PDFs Here
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Drag and drop PDF files to upload them to your Zotero library
                </Typography>
            </Paper>

            {/* Collections */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Collections
                            </Typography>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <List>
                                    {collections.map((collection) => (
                                        <ListItem
                                            key={collection.id}
                                            button
                                            selected={selectedCollection === collection.id}
                                            onClick={() => {
                                                setSelectedCollection(collection.id);
                                                loadItems(collection.id);
                                            }}
                                        >
                                            <ListItemIcon>
                                                <ZoteroIcon />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={collection.name}
                                                secondary={`${collection.items?.length || 0} items`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Items {selectedCollection && `(${items.length})`}
                            </Typography>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : items.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                                    {selectedCollection ? 'No items in this collection' : 'Select a collection to view items'}
                                </Typography>
                            ) : (
                                <List>
                                    {items.map((item, index) => (
                                        <React.Fragment key={item.id}>
                                            <ListItem>
                                                <ListItemIcon>
                                                    {getItemIcon(item.type)}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={item.title}
                                                    secondary={
                                                        <Box>
                                                            {item.authors && (
                                                                <Typography variant="caption" display="block">
                                                                    {item.authors.join(', ')}
                                                                </Typography>
                                                            )}
                                                            {item.year && (
                                                                <Typography variant="caption" display="block">
                                                                    {item.year}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    }
                                                />
                                                <Box>
                                                    <Chip
                                                        label={item.type}
                                                        size="small"
                                                        color={getItemColor(item.type)}
                                                        sx={{ mr: 1 }}
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleImportItem(item)}
                                                        disabled={importing}
                                                    >
                                                        <ImportIcon />
                                                    </IconButton>
                                                </Box>
                                            </ListItem>
                                            {index < items.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Configuration Dialog */}
            <Dialog open={openConfigDialog} onClose={() => setOpenConfigDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Zotero Configuration</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="API Key"
                            value={config.apiKey}
                            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                            sx={{ mb: 2 }}
                            disabled={loading}
                            helperText="Get your API key from Zotero settings"
                        />

                        <TextField
                            fullWidth
                            label="User ID"
                            value={config.userId}
                            onChange={(e) => setConfig({ ...config, userId: e.target.value })}
                            sx={{ mb: 2 }}
                            disabled={loading}
                            helperText="Your Zotero user ID"
                        />

                        <FormControl fullWidth>
                            <InputLabel>Library Type</InputLabel>
                            <Select
                                value={config.libraryType}
                                label="Library Type"
                                onChange={(e) => setConfig({ ...config, libraryType: e.target.value })}
                                disabled={loading}
                            >
                                <MenuItem value="user">User Library</MenuItem>
                                <MenuItem value="group">Group Library</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfigDialog(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveConfig}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : undefined}
                    >
                        {loading ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Zotero; 