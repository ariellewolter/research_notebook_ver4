import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    FormControlLabel,
    RadioGroup,
    Radio,
    Typography,
    Box,
    Chip,
    Alert,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    TextField,
    Select,
    MenuItem,
    InputLabel,
} from '@mui/material';
import {
    FileDownload as DownloadIcon,
    Description as CsvIcon,
    Code as JsonIcon,
    TableChart as ExcelIcon,
    PictureAsPdf as PdfIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { notificationService } from '../services/notificationService';

export interface ExportFormat {
    value: string;
    label: string;
    icon: React.ReactNode;
    description: string;
    extensions: string[];
}

export interface ExportOption {
    key: string;
    label: string;
    description?: string;
    default: boolean;
}

export interface ExportData {
    projects?: any[];
    experiments?: any[];
    protocols?: any[];
    notes?: any[];
    databaseEntries?: any[];
    tasks?: any[];
    pdfs?: any[];
}

interface ExportModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    data: ExportData;
    availableFormats?: ExportFormat[];
    availableOptions?: ExportOption[];
    onExport: (format: string, options: string[], filename?: string) => Promise<void>;
}

const defaultFormats: ExportFormat[] = [
    {
        value: 'csv',
        label: 'CSV',
        icon: <CsvIcon />,
        description: 'Comma-separated values file, compatible with Excel and other spreadsheet applications',
        extensions: ['.csv']
    },
    {
        value: 'json',
        label: 'JSON',
        icon: <JsonIcon />,
        description: 'JavaScript Object Notation, structured data format for APIs and data exchange',
        extensions: ['.json']
    },
    {
        value: 'xlsx',
        label: 'Excel',
        icon: <ExcelIcon />,
        description: 'Microsoft Excel format with multiple sheets and formatting support',
        extensions: ['.xlsx']
    },
    {
        value: 'pdf',
        label: 'PDF',
        icon: <PdfIcon />,
        description: 'Portable Document Format with formatted layout and styling',
        extensions: ['.pdf']
    }
];

const defaultOptions: ExportOption[] = [
    {
        key: 'includeMetadata',
        label: 'Include Metadata',
        description: 'Export creation dates, modification dates, and other metadata',
        default: true
    },
    {
        key: 'includeRelationships',
        label: 'Include Relationships',
        description: 'Export links between entities (projects, experiments, etc.)',
        default: true
    },
    {
        key: 'includeNotes',
        label: 'Include Notes',
        description: 'Export associated notes and comments',
        default: true
    },
    {
        key: 'includeFiles',
        label: 'Include File References',
        description: 'Export file paths and references to PDFs and other files',
        default: false
    }
];

const ExportModal: React.FC<ExportModalProps> = ({
    open,
    onClose,
    title,
    data,
    availableFormats = defaultFormats,
    availableOptions = defaultOptions,
    onExport
}) => {
    const [selectedFormat, setSelectedFormat] = useState(availableFormats[0]?.value || 'csv');
    const [selectedOptions, setSelectedOptions] = useState<string[]>(
        availableOptions.filter(opt => opt.default).map(opt => opt.key)
    );
    const [customFilename, setCustomFilename] = useState('');
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generate default filename based on data and format
    const generateDefaultFilename = () => {
        const timestamp = new Date().toISOString().split('T')[0];
        const format = availableFormats.find(f => f.value === selectedFormat);
        const extension = format?.extensions[0] || '.csv';
        
        if (data.projects && data.projects.length > 0) {
            return `projects_export_${timestamp}${extension}`;
        } else if (data.experiments && data.experiments.length > 0) {
            return `experiments_export_${timestamp}${extension}`;
        } else {
            return `export_${timestamp}${extension}`;
        }
    };

    const handleOptionChange = (optionKey: string, checked: boolean) => {
        setSelectedOptions(prev => 
            checked 
                ? [...prev, optionKey]
                : prev.filter(key => key !== optionKey)
        );
    };

    const handleExport = async () => {
        const startTime = Date.now();
        
        try {
            setExporting(true);
            setError(null);
            
            const filename = customFilename || generateDefaultFilename();
            
            // Log export start
            const eventId = notificationService.logFileExport(
                'pending',
                selectedFormat,
                getDataSummary(),
                getTotalItemCount(),
                selectedOptions,
                undefined,
                undefined
            );
            
            await onExport(selectedFormat, selectedOptions, filename);
            
            const duration = Date.now() - startTime;
            
            // Log export success
            notificationService.logFileExport(
                'success',
                selectedFormat,
                getDataSummary(),
                getTotalItemCount(),
                selectedOptions,
                undefined,
                duration
            );
            
            onClose();
        } catch (err) {
            const duration = Date.now() - startTime;
            
            // Log export error
            notificationService.logFileExport(
                'error',
                selectedFormat,
                getDataSummary(),
                getTotalItemCount(),
                selectedOptions,
                err instanceof Error ? err.message : 'Export failed',
                duration
            );
            
            setError(err instanceof Error ? err.message : 'Export failed');
        } finally {
            setExporting(false);
        }
    };

    const getTotalItemCount = () => {
        let count = 0;
        if (data.projects) count += data.projects.length;
        if (data.experiments) count += data.experiments.length;
        if (data.protocols) count += data.protocols.length;
        if (data.notes) count += data.notes.length;
        if (data.databaseEntries) count += data.databaseEntries.length;
        if (data.tasks) count += data.tasks.length;
        if (data.pdfs) count += data.pdfs.length;
        return count;
    };

    const getDataSummary = () => {
        const summary = [];
        if (data.projects && data.projects.length > 0) {
            summary.push(`${data.projects.length} project${data.projects.length !== 1 ? 's' : ''}`);
        }
        if (data.experiments && data.experiments.length > 0) {
            summary.push(`${data.experiments.length} experiment${data.experiments.length !== 1 ? 's' : ''}`);
        }
        if (data.protocols && data.protocols.length > 0) {
            summary.push(`${data.protocols.length} protocol${data.protocols.length !== 1 ? 's' : ''}`);
        }
        if (data.notes && data.notes.length > 0) {
            summary.push(`${data.notes.length} note${data.notes.length !== 1 ? 's' : ''}`);
        }
        if (data.databaseEntries && data.databaseEntries.length > 0) {
            summary.push(`${data.databaseEntries.length} database entr${data.databaseEntries.length !== 1 ? 'ies' : 'y'}`);
        }
        if (data.tasks && data.tasks.length > 0) {
            summary.push(`${data.tasks.length} task${data.tasks.length !== 1 ? 's' : ''}`);
        }
        if (data.pdfs && data.pdfs.length > 0) {
            summary.push(`${data.pdfs.length} PDF${data.pdfs.length !== 1 ? 's' : ''}`);
        }
        return summary.join(', ');
    };

    const selectedFormatInfo = availableFormats.find(f => f.value === selectedFormat);

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: { minHeight: '60vh' }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DownloadIcon />
                Export {title}
            </DialogTitle>
            
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Data Summary */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Data to Export
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {getDataSummary()}
                    </Typography>
                </Box>

                {/* Format Selection */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Export Format
                    </Typography>
                    <FormControl component="fieldset" fullWidth>
                        <RadioGroup
                            value={selectedFormat}
                            onChange={(e) => setSelectedFormat(e.target.value)}
                        >
                            {availableFormats.map((format) => (
                                <Box
                                    key={format.value}
                                    sx={{
                                        border: '1px solid',
                                        borderColor: selectedFormat === format.value ? 'primary.main' : 'divider',
                                        borderRadius: 1,
                                        p: 2,
                                        mb: 1,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'action.hover'
                                        }
                                    }}
                                    onClick={() => setSelectedFormat(format.value)}
                                >
                                    <FormControlLabel
                                        value={format.value}
                                        control={<Radio />}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {format.icon}
                                                <Typography variant="subtitle2">
                                                    {format.label}
                                                </Typography>
                                            </Box>
                                        }
                                        sx={{ width: '100%', m: 0 }}
                                    />
                                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                                        {format.description}
                                    </Typography>
                                    <Box sx={{ ml: 4, mt: 1 }}>
                                        {format.extensions.map((ext) => (
                                            <Chip
                                                key={ext}
                                                label={ext}
                                                size="small"
                                                variant="outlined"
                                                sx={{ mr: 1 }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            ))}
                        </RadioGroup>
                    </FormControl>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Export Options */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Export Options
                    </Typography>
                    <List dense>
                        {availableOptions.map((option) => (
                            <ListItem key={option.key} sx={{ px: 0 }}>
                                <ListItemIcon>
                                    <Checkbox
                                        checked={selectedOptions.includes(option.key)}
                                        onChange={(e) => handleOptionChange(option.key, e.target.checked)}
                                    />
                                </ListItemIcon>
                                <ListItemText
                                    primary={option.label}
                                    secondary={option.description}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Filename */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Filename (Optional)
                    </Typography>
                    <TextField
                        fullWidth
                        value={customFilename}
                        onChange={(e) => setCustomFilename(e.target.value)}
                        placeholder={generateDefaultFilename()}
                        helperText="Leave empty to use default filename"
                        size="small"
                    />
                </Box>

                {/* Format-specific Information */}
                {selectedFormatInfo && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            <strong>{selectedFormatInfo.label} Export:</strong> {selectedFormatInfo.description}
                        </Typography>
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} disabled={exporting}>
                    Cancel
                </Button>
                <Button
                    onClick={handleExport}
                    variant="contained"
                    startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
                    disabled={exporting}
                >
                    {exporting ? 'Exporting...' : 'Export'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ExportModal; 