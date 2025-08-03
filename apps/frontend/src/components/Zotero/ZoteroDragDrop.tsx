import React, { useState, useRef, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Grid,
    Chip,
    Button,
    CircularProgress,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Avatar,
    Stack,
    Tooltip,
    Fade,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    PictureAsPdf as PdfIcon,
    Article as ArticleIcon,
    Book as BookIcon,
    DragIndicator as DragIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Download as DownloadIcon,
    Link as LinkIcon,
    Tag as TagIcon,
    Person as PersonIcon,
    CalendarToday as DateIcon,
    School as JournalIcon,
    Description as AbstractIcon,
} from '@mui/icons-material';
import { zoteroApi } from '../../services/api';

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

interface DragDropState {
    isDragOver: boolean;
    draggedItems: ZoteroItem[];
    selectedItems: ZoteroItem[];
    importProgress: number;
    importing: boolean;
    error: string | null;
    success: string | null;
}

const ZoteroDragDrop: React.FC = () => {
    const [state, setState] = useState<DragDropState>({
        isDragOver: false,
        draggedItems: [],
        selectedItems: [],
        importProgress: 0,
        importing: false,
        error: null,
        success: null,
    });

    const [showPreviewDialog, setShowPreviewDialog] = useState(false);
    const [previewItem, setPreviewItem] = useState<ZoteroItem | null>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'journalArticle':
                return <ArticleIcon />;
            case 'book':
                return <BookIcon />;
            case 'attachment':
                return <PdfIcon />;
            default:
                return <ArticleIcon />;
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

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setState(prev => ({ ...prev, isDragOver: true }));
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setState(prev => ({ ...prev, isDragOver: false }));
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setState(prev => ({ ...prev, isDragOver: false }));

        try {
            // Parse dropped data
            const droppedData = e.dataTransfer.getData('application/json');
            if (!droppedData) {
                setState(prev => ({ ...prev, error: 'No valid Zotero data found' }));
                return;
            }

            const items: ZoteroItem[] = JSON.parse(droppedData);
            setState(prev => ({
                ...prev,
                draggedItems: items,
                selectedItems: items // Auto-select all dropped items
            }));

            setState(prev => ({ ...prev, success: `Successfully dropped ${items.length} items from Zotero` }));
        } catch (error) {
            console.error('Error parsing dropped data:', error);
            setState(prev => ({ ...prev, error: 'Failed to parse dropped data' }));
        }
    }, []);

    const handleImport = async () => {
        if (state.selectedItems.length === 0) {
            setState(prev => ({ ...prev, error: 'No items selected for import' }));
            return;
        }

        setState(prev => ({ ...prev, importing: true, importProgress: 0 }));

        try {
            for (let i = 0; i < state.selectedItems.length; i++) {
                const item = state.selectedItems[i];

                // Simulate import progress
                setState(prev => ({
                    ...prev,
                    importProgress: ((i + 1) / state.selectedItems.length) * 100
                }));

                try {
                    await zoteroApi.importItem(item.key);
                } catch (error) {
                    console.error('Error importing item:', error);
                }

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            setState(prev => ({
                ...prev,
                success: `Successfully imported ${state.selectedItems.length} items`,
                importing: false,
                selectedItems: [],
                draggedItems: []
            }));
        } catch (error) {
            console.error('Import error:', error);
            setState(prev => ({
                ...prev,
                error: 'Failed to import items',
                importing: false
            }));
        }
    };

    const handleItemToggle = (item: ZoteroItem) => {
        setState(prev => {
            const isSelected = prev.selectedItems.some(selected => selected.key === item.key);
            if (isSelected) {
                return {
                    ...prev,
                    selectedItems: prev.selectedItems.filter(selected => selected.key !== item.key)
                };
            } else {
                return {
                    ...prev,
                    selectedItems: [...prev.selectedItems, item]
                };
            }
        });
    };

    const handlePreviewItem = (item: ZoteroItem) => {
        setPreviewItem(item);
        setShowPreviewDialog(true);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DragIcon />
                Zotero Drag & Drop Import
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Drag items from your Zotero library directly into this area to import them as PDFs and references.
            </Typography>

            {/* Drop Zone */}
            <Paper
                ref={dropZoneRef}
                sx={{
                    border: '2px dashed',
                    borderColor: state.isDragOver ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: state.isDragOver ? 'primary.50' : 'background.paper',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'primary.50',
                    }
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    {state.isDragOver ? 'Drop Zotero items here' : 'Drag Zotero items here'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Select items in Zotero and drag them to this area to import
                </Typography>
            </Paper>

            {/* Import Progress */}
            {state.importing && (
                <Paper sx={{ mt: 3, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <CircularProgress size={24} />
                        <Typography variant="body1">
                            Importing items... {Math.round(state.importProgress)}%
                        </Typography>
                    </Box>
                    <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1 }}>
                        <Box
                            sx={{
                                width: `${state.importProgress}%`,
                                height: 8,
                                bgcolor: 'primary.main',
                                borderRadius: 1,
                                transition: 'width 0.3s ease'
                            }}
                        />
                    </Box>
                </Paper>
            )}

            {/* Dropped Items */}
            {state.draggedItems.length > 0 && (
                <Paper sx={{ mt: 3, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Dropped Items ({state.draggedItems.length})
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setState(prev => ({
                                    ...prev,
                                    selectedItems: prev.draggedItems
                                }))}
                            >
                                Select All
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setState(prev => ({
                                    ...prev,
                                    selectedItems: []
                                }))}
                            >
                                Clear Selection
                            </Button>
                        </Box>
                    </Box>

                    <Grid container spacing={2}>
                        {state.draggedItems.map((item) => (
                            <Grid item xs={12} sm={6} md={4} key={item.key}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        border: state.selectedItems.some(selected => selected.key === item.key)
                                            ? '2px solid'
                                            : '1px solid',
                                        borderColor: state.selectedItems.some(selected => selected.key === item.key)
                                            ? 'primary.main'
                                            : 'grey.300',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: 4
                                        }
                                    }}
                                    onClick={() => handleItemToggle(item)}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>
                                                {getItemIcon(item.type)}
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2" fontWeight="medium">
                                                    {item.title}
                                                </Typography>
                                                <Chip
                                                    label={item.type}
                                                    size="small"
                                                    color={getItemTypeColor(item.type) as any}
                                                />
                                            </Box>
                                            {state.selectedItems.some(selected => selected.key === item.key) && (
                                                <CheckIcon color="primary" />
                                            )}
                                        </Box>

                                        {item.authors && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                {item.authors.slice(0, 2).join(', ')}
                                                {item.authors.length > 2 && ' et al.'}
                                            </Typography>
                                        )}

                                        {item.data?.publicationTitle && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                {item.data.publicationTitle}
                                            </Typography>
                                        )}

                                        {item.year && (
                                            <Typography variant="body2" color="text.secondary">
                                                {item.year}
                                            </Typography>
                                        )}

                                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                            <Tooltip title="Preview Details">
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePreviewItem(item);
                                                    }}
                                                >
                                                    <InfoIcon fontSize="small" />
                                                </Button>
                                            </Tooltip>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Import Actions */}
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<DownloadIcon />}
                            onClick={handleImport}
                            disabled={state.selectedItems.length === 0 || state.importing}
                        >
                            Import {state.selectedItems.length} Selected Items
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Preview Dialog */}
            <Dialog
                open={showPreviewDialog}
                onClose={() => setShowPreviewDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {previewItem && getItemIcon(previewItem.type)}
                        <Typography variant="h6">{previewItem?.title}</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {previewItem && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={8}>
                                <Typography variant="h6" gutterBottom>Details</Typography>

                                {previewItem.data?.creators && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            <PersonIcon sx={{ mr: 1, fontSize: 16 }} />
                                            Authors
                                        </Typography>
                                        <Typography variant="body1">
                                            {previewItem.data.creators.map((creator, index) => (
                                                <span key={index}>
                                                    {creator.firstName} {creator.lastName}
                                                    {index < previewItem.data!.creators!.length - 1 ? ', ' : ''}
                                                </span>
                                            ))}
                                        </Typography>
                                    </Box>
                                )}

                                {previewItem.data?.publicationTitle && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            <JournalIcon sx={{ mr: 1, fontSize: 16 }} />
                                            Journal/Publication
                                        </Typography>
                                        <Typography variant="body1">{previewItem.data.publicationTitle}</Typography>
                                    </Box>
                                )}

                                {previewItem.data?.date && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            <DateIcon sx={{ mr: 1, fontSize: 16 }} />
                                            Date
                                        </Typography>
                                        <Typography variant="body1">{previewItem.data.date}</Typography>
                                    </Box>
                                )}

                                {previewItem.data?.DOI && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            <LinkIcon sx={{ mr: 1, fontSize: 16 }} />
                                            DOI
                                        </Typography>
                                        <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                                            {previewItem.data.DOI}
                                        </Typography>
                                    </Box>
                                )}

                                {previewItem.data?.abstractNote && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            <AbstractIcon sx={{ mr: 1, fontSize: 16 }} />
                                            Abstract
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                                            {previewItem.data.abstractNote}
                                        </Typography>
                                    </Box>
                                )}
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="h6" gutterBottom>Actions</Typography>

                                <Stack spacing={2}>
                                    <Button
                                        variant="contained"
                                        startIcon={<DownloadIcon />}
                                        onClick={() => {
                                            handleItemToggle(previewItem);
                                            setShowPreviewDialog(false);
                                        }}
                                        fullWidth
                                    >
                                        {state.selectedItems.some(selected => selected.key === previewItem.key)
                                            ? 'Remove from Selection'
                                            : 'Add to Selection'
                                        }
                                    </Button>

                                    {previewItem.data?.url && (
                                        <Button
                                            variant="outlined"
                                            startIcon={<LinkIcon />}
                                            href={previewItem.data.url}
                                            target="_blank"
                                            fullWidth
                                        >
                                            Open Source
                                        </Button>
                                    )}

                                    {previewItem.data?.DOI && (
                                        <Button
                                            variant="outlined"
                                            startIcon={<LinkIcon />}
                                            href={`https://doi.org/${previewItem.data.DOI}`}
                                            target="_blank"
                                            fullWidth
                                        >
                                            View DOI
                                        </Button>
                                    )}
                                </Stack>

                                {previewItem.tags && previewItem.tags.length > 0 && (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            <TagIcon sx={{ mr: 1, fontSize: 16 }} />
                                            Tags
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {previewItem.tags.map((tag) => (
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
                    <Button onClick={() => setShowPreviewDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbars */}
            <Snackbar
                open={!!state.error}
                autoHideDuration={6000}
                onClose={() => setState(prev => ({ ...prev, error: null }))}
            >
                <Alert severity="error" onClose={() => setState(prev => ({ ...prev, error: null }))}>
                    {state.error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!state.success}
                autoHideDuration={4000}
                onClose={() => setState(prev => ({ ...prev, success: null }))}
            >
                <Alert severity="success" onClose={() => setState(prev => ({ ...prev, success: null }))}>
                    {state.success}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ZoteroDragDrop; 