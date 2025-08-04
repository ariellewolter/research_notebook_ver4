import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Chip,
    LinearProgress,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Grid,
    Card,
    CardContent,
    Tooltip,
    Snackbar,
    CircularProgress,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Close as CloseIcon,
    PictureAsPdf as PdfIcon,
    TableChart as CsvIcon,
    Description as TextIcon,
    Image as ImageIcon,
    VideoFile as VideoIcon,
    AudioFile as AudioIcon,
    Archive as ArchiveIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    Delete as DeleteIcon,
    PlayArrow as ImportIcon,
    Stop as StopIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    Note as NoteIcon,
    Folder as ProjectIcon,
    Science as ProtocolIcon,
    Storage as DatabaseIcon,
    CheckBox as TaskIcon,
    Restaurant as RecipeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useEnhancedCommandPaletteContext } from './CommandPalette/EnhancedCommandPaletteProvider';
import { notificationService } from '../services/notificationService';

interface FileImportInfo {
    id: string;
    file: File;
    type: 'pdf' | 'csv' | 'excel' | 'json' | 'image' | 'video' | 'audio' | 'archive' | 'text' | 'unknown';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    error?: string;
    warning?: string;
    importTarget?: 'notes' | 'projects' | 'protocols' | 'database' | 'tasks' | 'recipes' | 'pdfs';
    metadata?: {
        size: string;
        lastModified: Date;
        preview?: string;
        rowCount?: number;
        columns?: string[];
    };
}

interface ImportConfiguration {
    targetEntity: 'notes' | 'projects' | 'protocols' | 'database' | 'tasks' | 'recipes' | 'pdfs';
    autoProcess: boolean;
    createNew: boolean;
    mergeExisting: boolean;
    validationRules: {
        requiredFields: string[];
        uniqueFields: string[];
        formatRules: Record<string, string>;
    };
}

const GlobalDragDropOverlay: React.FC = () => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [files, setFiles] = useState<FileImportInfo[]>([]);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [importConfig, setImportConfig] = useState<ImportConfiguration>({
        targetEntity: 'notes',
        autoProcess: true,
        createNew: true,
        mergeExisting: false,
        validationRules: {
            requiredFields: [],
            uniqueFields: [],
            formatRules: {}
        }
    });
    const [processing, setProcessing] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'warning' | 'info';
    }>({ open: false, message: '', severity: 'info' });

    const navigate = useNavigate();
    const { addRecentItem } = useEnhancedCommandPaletteContext();
    const overlayRef = useRef<HTMLDivElement>(null);

    // File type detection
    const getFileType = (file: File): FileImportInfo['type'] => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        const mimeType = file.type;

        if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf';
        if (mimeType === 'text/csv' || extension === 'csv') return 'csv';
        if (mimeType.includes('spreadsheet') || extension === 'xlsx' || extension === 'xls') return 'excel';
        if (mimeType === 'application/json' || extension === 'json') return 'json';
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return 'archive';
        if (mimeType.startsWith('text/') || extension === 'txt' || extension === 'md') return 'text';
        
        return 'unknown';
    };

    // Get file icon based on type
    const getFileIcon = (type: FileImportInfo['type']) => {
        switch (type) {
            case 'pdf': return <PdfIcon />;
            case 'csv': return <CsvIcon />;
            case 'excel': return <CsvIcon />;
            case 'json': return <TextIcon />;
            case 'image': return <ImageIcon />;
            case 'video': return <VideoIcon />;
            case 'audio': return <AudioIcon />;
            case 'archive': return <ArchiveIcon />;
            case 'text': return <TextIcon />;
            default: return <TextIcon />;
        }
    };

    // Get import target based on file type
    const getImportTarget = (type: FileImportInfo['type']): FileImportInfo['importTarget'] => {
        switch (type) {
            case 'pdf': return 'pdfs';
            case 'csv': return 'database';
            case 'excel': return 'database';
            case 'json': return 'database';
            case 'image': return 'notes';
            case 'video': return 'notes';
            case 'audio': return 'notes';
            case 'archive': return 'projects';
            case 'text': return 'notes';
            default: return 'notes';
        }
    };

    // Get entity icon
    const getEntityIcon = (entity: string) => {
        switch (entity) {
            case 'notes': return <NoteIcon />;
            case 'projects': return <ProjectIcon />;
            case 'protocols': return <ProtocolIcon />;
            case 'database': return <DatabaseIcon />;
            case 'tasks': return <TaskIcon />;
            case 'recipes': return <RecipeIcon />;
            case 'pdfs': return <PdfIcon />;
            default: return <NoteIcon />;
        }
    };

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Parse file metadata
    const parseFileMetadata = async (file: File, type: FileImportInfo['type']): Promise<FileImportInfo['metadata']> => {
        const metadata: FileImportInfo['metadata'] = {
            size: formatFileSize(file.size),
            lastModified: new Date(file.lastModified)
        };

        if (type === 'csv' || type === 'excel') {
            try {
                const text = await file.text();
                const lines = text.split('\n');
                const headers = lines[0]?.split(',').map(h => h.trim()) || [];
                metadata.rowCount = lines.length - 1;
                metadata.columns = headers;
                metadata.preview = lines.slice(0, 5).join('\n');
            } catch (error) {
                console.warn('Failed to parse CSV metadata:', error);
            }
        } else if (type === 'json') {
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                if (Array.isArray(data)) {
                    metadata.rowCount = data.length;
                    metadata.columns = Object.keys(data[0] || {});
                }
                metadata.preview = text.substring(0, 500) + (text.length > 500 ? '...' : '');
            } catch (error) {
                console.warn('Failed to parse JSON metadata:', error);
            }
        } else if (type === 'text') {
            try {
                const text = await file.text();
                metadata.preview = text.substring(0, 500) + (text.length > 500 ? '...' : '');
            } catch (error) {
                console.warn('Failed to parse text metadata:', error);
            }
        }

        return metadata;
    };

    // Handle drag events
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only hide if leaving the overlay completely
        if (overlayRef.current && !overlayRef.current.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length === 0) return;

        const fileInfos: FileImportInfo[] = await Promise.all(
            droppedFiles.map(async (file) => {
                const type = getFileType(file);
                const importTarget = getImportTarget(type);
                const metadata = await parseFileMetadata(file, type);

                return {
                    id: `${Date.now()}-${Math.random()}`,
                    file,
                    type,
                    status: 'pending',
                    progress: 0,
                    importTarget,
                    metadata
                };
            })
        );

        setFiles(prev => [...prev, ...fileInfos]);
        setShowImportDialog(true);
    }, []);

    // Process file import
    const processFileImport = async (file: File) => {
        const startTime = Date.now();
        
        try {
            // Log import start
            notificationService.logFileImport(
                'pending',
                1,
                [file.name],
                [getFileType(file.name)],
                undefined,
                undefined
            );

            // Simulate import processing
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

            const duration = Date.now() - startTime;

            // Log import success
            notificationService.logFileImport(
                'success',
                1,
                [file.name],
                [getFileType(file.name)],
                undefined,
                duration
            );

            // Add to recent items in command palette
            addRecentItem({
                id: `import_${Date.now()}`,
                title: `Imported: ${file.name}`,
                type: 'import',
                description: `Successfully imported ${file.name}`,
                action: () => {
                    // Navigate to appropriate page based on file type
                    const fileType = getFileType(file.name);
                    switch (fileType) {
                        case 'pdf':
                            navigate('/pdfs');
                            break;
                        case 'csv':
                        case 'json':
                        case 'xlsx':
                            navigate('/database');
                            break;
                        default:
                            navigate('/dashboard');
                    }
                }
            });

            setSnackbar({
                open: true,
                message: `Successfully imported ${file.name}`,
                severity: 'success'
            });

        } catch (error) {
            const duration = Date.now() - startTime;
            
            // Log import error
            notificationService.logFileImport(
                'error',
                1,
                [file.name],
                [getFileType(file.name)],
                error instanceof Error ? error.message : 'Import failed',
                duration
            );

            setSnackbar({
                open: true,
                message: `Failed to import ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: 'error'
            });
        }
    };

    // Handle import all
    const handleImportAll = async () => {
        const pendingFiles = files.filter(f => f.status === 'pending');
        for (const fileInfo of pendingFiles) {
            await processFileImport(fileInfo.file);
        }
    };

    // Handle import single file
    const handleImportFile = async (fileInfo: FileImportInfo) => {
        await processFileImport(fileInfo.file);
    };

    // Handle remove file
    const handleRemoveFile = (fileId: string) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    // Handle clear all
    const handleClearAll = () => {
        setFiles([]);
        setShowImportDialog(false);
    };

    // Handle navigate to target
    const handleNavigateToTarget = (importTarget: string) => {
        let route = '/notes';
        switch (importTarget) {
            case 'projects': route = '/projects'; break;
            case 'protocols': route = '/protocols'; break;
            case 'database': route = '/database'; break;
            case 'tasks': route = '/tasks'; break;
            case 'recipes': route = '/recipes'; break;
            case 'pdfs': route = '/pdfs'; break;
        }
        navigate(route);
        setShowImportDialog(false);
    };

    // Global drag event listeners
    useEffect(() => {
        const handleGlobalDragOver = (e: DragEvent) => {
            e.preventDefault();
        };

        const handleGlobalDrop = (e: DragEvent) => {
            e.preventDefault();
        };

        document.addEventListener('dragover', handleGlobalDragOver);
        document.addEventListener('drop', handleGlobalDrop);

        return () => {
            document.removeEventListener('dragover', handleGlobalDragOver);
            document.removeEventListener('drop', handleGlobalDrop);
        };
    }, []);

    return (
        <>
            {/* Global Drag Overlay */}
            {isDragOver && (
                <Box
                    ref={overlayRef}
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <Paper
                        sx={{
                            p: 4,
                            textAlign: 'center',
                            maxWidth: 400,
                            backgroundColor: 'background.paper',
                            borderRadius: 3,
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        }}
                    >
                        <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h4" gutterBottom>
                            Drop Files Here
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Drop your files to import them into Research Notebook
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                            Supported: PDF, CSV, Excel, JSON, Images, Videos, Audio, Archives, Text files
                        </Typography>
                    </Paper>
                </Box>
            )}

            {/* Import Dialog */}
            <Dialog
                open={showImportDialog}
                onClose={() => setShowImportDialog(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        maxHeight: '80vh'
                    }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6">
                            Import Files ({files.length})
                        </Typography>
                        <IconButton onClick={() => setShowImportDialog(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent>
                    <Grid container spacing={2}>
                        {/* File List */}
                        <Grid item xs={12}>
                            <List>
                                {files.map((fileInfo, index) => (
                                    <React.Fragment key={fileInfo.id}>
                                        <ListItem>
                                            <ListItemIcon>
                                                {getFileIcon(fileInfo.type)}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={fileInfo.file.name}
                                                secondary={
                                                    <Box>
                                                        <Typography variant="caption" display="block">
                                                            {fileInfo.metadata?.size} • {fileInfo.metadata?.lastModified.toLocaleDateString()}
                                                        </Typography>
                                                        <Typography variant="caption" display="block">
                                                            Type: {fileInfo.type.toUpperCase()} → {fileInfo.importTarget}
                                                        </Typography>
                                                        {fileInfo.metadata?.rowCount && (
                                                            <Typography variant="caption" display="block">
                                                                {fileInfo.metadata.rowCount} rows, {fileInfo.metadata.columns?.length} columns
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {fileInfo.status === 'pending' && (
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<ImportIcon />}
                                                            onClick={() => handleImportFile(fileInfo)}
                                                            disabled={processing}
                                                        >
                                                            Import
                                                        </Button>
                                                    )}
                                                    {fileInfo.status === 'processing' && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <CircularProgress size={20} />
                                                            <Typography variant="caption">
                                                                {fileInfo.progress}%
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {fileInfo.status === 'completed' && (
                                                        <Chip
                                                            icon={<SuccessIcon />}
                                                            label="Imported"
                                                            color="success"
                                                            size="small"
                                                        />
                                                    )}
                                                    {fileInfo.status === 'failed' && (
                                                        <Chip
                                                            icon={<ErrorIcon />}
                                                            label="Failed"
                                                            color="error"
                                                            size="small"
                                                        />
                                                    )}
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRemoveFile(fileInfo.id)}
                                                        disabled={fileInfo.status === 'processing'}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        {fileInfo.status === 'processing' && (
                                            <Box sx={{ px: 2, pb: 1 }}>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={fileInfo.progress} 
                                                    sx={{ height: 4, borderRadius: 2 }}
                                                />
                                            </Box>
                                        )}
                                        {fileInfo.error && (
                                            <Box sx={{ px: 2, pb: 1 }}>
                                                <Alert severity="error" sx={{ py: 0 }}>
                                                    {fileInfo.error}
                                                </Alert>
                                            </Box>
                                        )}
                                        {index < files.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        </Grid>

                        {/* Import Configuration */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Import Configuration
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Auto-process files based on type
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2">
                                                PDFs → PDFs, CSVs → Database, etc.
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClearAll} disabled={processing}>
                        Clear All
                    </Button>
                    <Button 
                        onClick={handleImportAll} 
                        variant="contained"
                        disabled={processing || files.filter(f => f.status === 'pending').length === 0}
                        startIcon={processing ? <CircularProgress size={16} /> : <ImportIcon />}
                    >
                        Import All ({files.filter(f => f.status === 'pending').length})
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
                <Alert 
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default GlobalDragDropOverlay; 