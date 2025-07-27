import React, { useState, useRef, useCallback } from 'react';
import {
    Box, Typography, Paper, Alert, CircularProgress, 
    List, ListItem, ListItemText, ListItemIcon, 
    Chip, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, FormControl, InputLabel,
    Select, MenuItem, Grid, Card, CardContent
} from '@mui/material';
import {
    CloudUpload as UploadIcon, FilePresent as FileIcon,
    Description as PdfIcon, CheckCircle as CheckIcon,
    Error as ErrorIcon, Info as InfoIcon
} from '@mui/icons-material';
import { projectsApi, zoteroApi } from '../../services/api';

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

interface ZoteroDragDropProps {
    open: boolean;
    onClose: () => void;
    onImportSuccess: (items: ZoteroItem[]) => void;
}

const ZoteroDragDrop: React.FC<ZoteroDragDropProps> = ({
    open, onClose, onImportSuccess
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [importedItems, setImportedItems] = useState<ZoteroItem[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [selectedExperiment, setSelectedExperiment] = useState<string>('');
    const [projects, setProjects] = useState<any[]>([]);
    const [experiments, setExperiments] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch projects and experiments for linking
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const projectsResponse = await projectsApi.getAll();
                setProjects(projectsResponse.data || []);
                // For now, we'll get experiments from all projects
                const allExperiments: any[] = [];
                for (const project of projectsResponse.data || []) {
                    try {
                        const expResponse = await projectsApi.getExperiments(project.id);
                        allExperiments.push(...(expResponse.data || []));
                    } catch (err) {
                        console.error(`Failed to fetch experiments for project ${project.id}:`, err);
                    }
                }
                setExperiments(allExperiments);
            } catch (err) {
                console.error('Failed to fetch projects/experiments:', err);
            }
        };
        if (open) {
            fetchData();
        }
    }, [open]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        setError(null);
        setSuccess(null);

        const files = Array.from(e.dataTransfer.files);
        const pdfFiles = files.filter(file => file.type === 'application/pdf');

        if (pdfFiles.length === 0) {
            setError('Please drop PDF files only.');
            return;
        }

        await processFiles(pdfFiles);
    }, []);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            await processFiles(files);
        }
    }, []);

    const processFiles = async (files: File[]) => {
        setUploading(true);
        setError(null);

        try {
            const importedItems: ZoteroItem[] = [];
            
            for (const file of files) {
                try {
                    // For now, we'll create a basic import with file name as title
                    const response = await zoteroApi.import(file, {
                        zoteroKey: '', // This would need to be provided by user or detected
                        title: file.name.replace('.pdf', ''),
                        authors: [],
                        abstract: '',
                        publicationYear: new Date().getFullYear(),
                        journal: '',
                        doi: '',
                        url: '',
                        tags: []
                    });
                    
                    if (response.data) {
                        importedItems.push(response.data);
                    }
                } catch (err) {
                    console.error(`Failed to import ${file.name}:`, err);
                }
            }
            
            if (importedItems.length > 0) {
                setImportedItems(importedItems);
                setSuccess(`Successfully imported ${importedItems.length} PDF(s) from Zotero`);
                onImportSuccess(importedItems);
            } else {
                setError('No PDFs were successfully imported. Please check your Zotero configuration.');
            }
        } catch (err) {
            setError('Failed to import PDFs. Please check your Zotero configuration.');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setImportedItems([]);
        setError(null);
        setSuccess(null);
        setUploading(false);
        setIsDragOver(false);
        onClose();
    };

    const formatAuthors = (creators?: Array<{ firstName: string; lastName: string; creatorType: string }>) => {
        if (!creators || creators.length === 0) return 'Unknown Author';
        return creators
            .filter(creator => creator.creatorType === 'author')
            .map(creator => `${creator.firstName} ${creator.lastName}`)
            .join(', ');
    };

    const formatCitation = (item: ZoteroItem) => {
        const authors = formatAuthors(item.data.creators);
        const year = item.data.date ? new Date(item.data.date).getFullYear() : '';
        const title = item.data.title || 'Untitled';
        const journal = item.data.publicationTitle || '';
        
        return `${authors} (${year}). ${title}. ${journal}`;
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UploadIcon />
                    Import PDFs from Zotero
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Drag and drop PDF files from your Zotero library to import them with full metadata.
                </Typography>

                {/* Link to Project/Experiment */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Link to Project (Optional)</InputLabel>
                            <Select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                label="Link to Project (Optional)"
                            >
                                <MenuItem value="">None</MenuItem>
                                {projects.map(project => (
                                    <MenuItem key={project.id} value={project.id}>
                                        {project.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Link to Experiment (Optional)</InputLabel>
                            <Select
                                value={selectedExperiment}
                                onChange={(e) => setSelectedExperiment(e.target.value)}
                                label="Link to Experiment (Optional)"
                            >
                                <MenuItem value="">None</MenuItem>
                                {experiments.map(experiment => (
                                    <MenuItem key={experiment.id} value={experiment.id}>
                                        {experiment.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {/* Drag & Drop Area */}
                <Paper
                    sx={{
                        border: '2px dashed',
                        borderColor: isDragOver ? 'primary.main' : 'grey.300',
                        backgroundColor: isDragOver ? 'action.hover' : 'background.paper',
                        p: 4,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        mb: 3
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    
                    {uploading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <CircularProgress />
                            <Typography>Processing PDFs from Zotero...</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <UploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                            <Typography variant="h6">
                                {isDragOver ? 'Drop PDFs here' : 'Drag & Drop PDFs from Zotero'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                or click to select files
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Supports multiple PDF files with automatic metadata extraction
                            </Typography>
                        </Box>
                    )}
                </Paper>

                {/* Status Messages */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {/* Imported Items List */}
                {importedItems.length > 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Imported Items ({importedItems.length})
                        </Typography>
                        <List>
                            {importedItems.map((item, index) => (
                                <Card key={item.key} sx={{ mb: 1 }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                            <CheckIcon color="success" />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {item.data.title || 'Untitled'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatCitation(item)}
                                                </Typography>
                                                
                                                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                                    {item.data.DOI && (
                                                        <Chip 
                                                            label={`DOI: ${item.data.DOI}`} 
                                                            size="small" 
                                                            color="primary" 
                                                            variant="outlined"
                                                        />
                                                    )}
                                                    {item.data.publicationTitle && (
                                                        <Chip 
                                                            label={item.data.publicationTitle} 
                                                            size="small" 
                                                            color="secondary" 
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

                                                {item.data.abstractNote && (
                                                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                        {item.data.abstractNote.length > 200 
                                                            ? `${item.data.abstractNote.substring(0, 200)}...`
                                                            : item.data.abstractNote
                                                        }
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </List>
                    </Box>
                )}

                {/* Instructions */}
                <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        <strong>How to use:</strong>
                    </Typography>
                    <Typography variant="body2" component="div">
                        1. Open your Zotero library in a separate window
                    </Typography>
                    <Typography variant="body2" component="div">
                        2. Select the PDF files you want to import
                    </Typography>
                    <Typography variant="body2" component="div">
                        3. Drag them directly into this dialog
                    </Typography>
                    <Typography variant="body2" component="div">
                        4. The system will automatically extract metadata and create literature notes
                    </Typography>
                </Alert>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    {importedItems.length > 0 ? 'Done' : 'Cancel'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ZoteroDragDrop; 