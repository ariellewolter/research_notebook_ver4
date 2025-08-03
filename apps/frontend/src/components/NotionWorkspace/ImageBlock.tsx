import React, { useState, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Alert
} from '@mui/material';
import {
    Image as ImageIcon,
    Upload as UploadIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Fullscreen as FullscreenIcon,
    Download as DownloadIcon,
    Link as LinkIcon,
    Science as ScienceIcon
} from '@mui/icons-material';

export interface ImageData {
    id: string;
    url: string;
    alt: string;
    caption?: string;
    width?: number;
    height?: number;
    type?: 'upload' | 'url' | 'scientific';
    metadata?: {
        source?: string;
        date?: string;
        experiment?: string;
        magnification?: string;
        scale?: string;
        technique?: string;
        notes?: string;
    };
}

interface ImageBlockProps {
    data: ImageData;
    onUpdate: (data: ImageData) => void;
    onDelete: () => void;
    isEditing?: boolean;
    onEditToggle?: () => void;
}

const ImageBlock: React.FC<ImageBlockProps> = ({
    data,
    onUpdate,
    onDelete,
    isEditing = false,
    onEditToggle
}) => {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [fullscreenOpen, setFullscreenOpen] = useState(false);
    const [uploadError, setUploadError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setUploadError('Please select a valid image file');
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('File size must be less than 10MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            onUpdate({
                ...data,
                url: result,
                type: 'upload',
                metadata: {
                    ...data.metadata,
                    source: file.name,
                    date: new Date().toISOString()
                }
            });
            setUploadError('');
        };
        reader.readAsDataURL(file);
    };

    const handleUrlChange = (url: string) => {
        onUpdate({
            ...data,
            url,
            type: 'url'
        });
    };

    const handleMetadataUpdate = (metadata: any) => {
        onUpdate({
            ...data,
            metadata: { ...data.metadata, ...metadata }
        });
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = data.url;
        link.download = data.alt || 'image';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderImage = () => (
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <img
                src={data.url}
                alt={data.alt}
                style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    cursor: 'pointer'
                }}
                onClick={() => setEditDialogOpen(true)}
            />

            {/* Image overlay controls */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    gap: 1,
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    '&:hover': { opacity: 1 }
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <Tooltip title="Fullscreen">
                    <IconButton
                        size="small"
                        onClick={() => setFullscreenOpen(true)}
                        sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                    >
                        <FullscreenIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Scientific metadata overlay */}
            {data.metadata?.technique && (
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        display: 'flex',
                        gap: 1,
                        flexWrap: 'wrap'
                    }}
                >
                    {data.metadata.technique && (
                        <Chip
                            label={data.metadata.technique}
                            size="small"
                            icon={<ScienceIcon />}
                            sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white' }}
                        />
                    )}
                    {data.metadata.magnification && (
                        <Chip
                            label={`${data.metadata.magnification}x`}
                            size="small"
                            sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white' }}
                        />
                    )}
                </Box>
            )}
        </Box>
    );

    const renderEditDialog = () => (
        <Dialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ImageIcon />
                    Edit Image
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Image Source
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<UploadIcon />}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Upload Image
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<LinkIcon />}
                            onClick={() => {
                                const url = prompt('Enter image URL:');
                                if (url) handleUrlChange(url);
                            }}
                        >
                            From URL
                        </Button>
                    </Box>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                    {uploadError && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                            {uploadError}
                        </Alert>
                    )}
                </Box>

                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        label="Alt Text"
                        value={data.alt}
                        onChange={(e) => onUpdate({ ...data, alt: e.target.value })}
                        helperText="Description for accessibility"
                    />
                </Box>

                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        label="Caption"
                        value={data.caption || ''}
                        onChange={(e) => onUpdate({ ...data, caption: e.target.value })}
                        multiline
                        rows={2}
                    />
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                    Scientific Metadata
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                    <TextField
                        label="Technique"
                        value={data.metadata?.technique || ''}
                        onChange={(e) => handleMetadataUpdate({ technique: e.target.value })}
                        placeholder="e.g., SEM, TEM, Confocal"
                    />
                    <TextField
                        label="Magnification"
                        value={data.metadata?.magnification || ''}
                        onChange={(e) => handleMetadataUpdate({ magnification: e.target.value })}
                        placeholder="e.g., 1000x"
                    />
                    <TextField
                        label="Scale"
                        value={data.metadata?.scale || ''}
                        onChange={(e) => handleMetadataUpdate({ scale: e.target.value })}
                        placeholder="e.g., 1μm"
                    />
                    <TextField
                        label="Experiment"
                        value={data.metadata?.experiment || ''}
                        onChange={(e) => handleMetadataUpdate({ experiment: e.target.value })}
                    />
                    <TextField
                        label="Source"
                        value={data.metadata?.source || ''}
                        onChange={(e) => handleMetadataUpdate({ source: e.target.value })}
                    />
                    <TextField
                        label="Date"
                        type="date"
                        value={data.metadata?.date?.split('T')[0] || ''}
                        onChange={(e) => handleMetadataUpdate({ date: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>

                <Box sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        label="Notes"
                        value={data.metadata?.notes || ''}
                        onChange={(e) => handleMetadataUpdate({ notes: e.target.value })}
                        multiline
                        rows={3}
                        placeholder="Additional scientific notes..."
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => setEditDialogOpen(false)} variant="contained">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );

    const renderFullscreenDialog = () => (
        <Dialog
            open={fullscreenOpen}
            onClose={() => setFullscreenOpen(false)}
            maxWidth="lg"
            fullWidth
        >
            <DialogContent sx={{ p: 0, textAlign: 'center' }}>
                <img
                    src={data.url}
                    alt={data.alt}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '80vh',
                        objectFit: 'contain'
                    }}
                />
                {data.caption && (
                    <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body2" color="text.secondary">
                            {data.caption}
                        </Typography>
                    </Box>
                )}
                {data.metadata && (
                    <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                            {data.metadata.technique && (
                                <Chip label={data.metadata.technique} size="small" />
                            )}
                            {data.metadata.magnification && (
                                <Chip label={`${data.metadata.magnification}x`} size="small" />
                            )}
                            {data.metadata.scale && (
                                <Chip label={data.metadata.scale} size="small" />
                            )}
                        </Box>
                        {data.metadata.notes && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {data.metadata.notes}
                            </Typography>
                        )}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );

    return (
        <Box sx={{ my: 2 }}>
            {renderImage()}

            {/* Caption */}
            {data.caption && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                    {data.caption}
                </Typography>
            )}

            {/* Metadata display */}
            {data.metadata && Object.keys(data.metadata).length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {data.metadata.source && (
                        <Chip label={`Source: ${data.metadata.source}`} size="small" variant="outlined" />
                    )}
                    {data.metadata.experiment && (
                        <Chip label={`Exp: ${data.metadata.experiment}`} size="small" variant="outlined" />
                    )}
                </Box>
            )}

            {/* Action buttons */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Tooltip title="Download">
                    <IconButton size="small" onClick={handleDownload}>
                        <DownloadIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                    <IconButton size="small" onClick={onDelete} color="error">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {renderEditDialog()}
            {renderFullscreenDialog()}
        </Box>
    );
};

export default ImageBlock; 