import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Chip,
    CircularProgress,
    Alert,
    FormControlLabel,
    Divider,
    Tabs,
    Tab,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Slider,
    Switch
} from '@mui/material';
import {
    Download as DownloadIcon,
    FileDownload as FileDownloadIcon,
    TableChart as TableIcon,
    Code as CodeIcon,
    Description as DescriptionIcon,
    Note as NoteIcon,
    Folder as ProjectIcon,
    Science as ProtocolIcon,
    Restaurant as RecipeIcon,
    Storage as DatabaseIcon,
    PictureAsPdf as PdfIcon,
    CheckBox as TaskIcon,
    Bookmark as LiteratureIcon,
    Brush as DrawingIcon,
    ExpandMore as ExpandMoreIcon,
    Image as ImageIcon,
    Code as SvgIcon
} from '@mui/icons-material';
import { enhancedExportService, ExportData, ExportOptions } from '../../services/enhancedExportService';
import { projectsApi, notesApi, protocolsApi, tasksApi, databaseApi } from '../../services/api';

interface ExportEntity {
    key: string;
    label: string;
    icon: React.ReactNode;
    apiEndpoint: string;
    fields: { key: string; label: string; type: 'string' | 'date' | 'number' | 'boolean' }[];
}

interface EnhancedDataExportProps {
    open: boolean;
    onClose: () => void;
}

const exportEntities: ExportEntity[] = [
    {
        key: 'notes',
        label: 'Notes',
        icon: <NoteIcon />,
        apiEndpoint: '/api/notes',
        fields: [
            { key: 'id', label: 'ID', type: 'string' },
            { key: 'title', label: 'Title', type: 'string' },
            { key: 'content', label: 'Content', type: 'string' },
            { key: 'type', label: 'Type', type: 'string' },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'createdAt', label: 'Created At', type: 'date' },
            { key: 'updatedAt', label: 'Updated At', type: 'date' }
        ]
    },
    {
        key: 'projects',
        label: 'Projects',
        icon: <ProjectIcon />,
        apiEndpoint: '/api/projects',
        fields: [
            { key: 'id', label: 'ID', type: 'string' },
            { key: 'name', label: 'Name', type: 'string' },
            { key: 'description', label: 'Description', type: 'string' },
            { key: 'status', label: 'Status', type: 'string' },
            { key: 'startDate', label: 'Start Date', type: 'date' },
            { key: 'lastActivity', label: 'Last Activity', type: 'date' },
            { key: 'createdAt', label: 'Created At', type: 'date' }
        ]
    },
    {
        key: 'protocols',
        label: 'Protocols',
        icon: <ProtocolIcon />,
        apiEndpoint: '/api/protocols',
        fields: [
            { key: 'id', label: 'ID', type: 'string' },
            { key: 'name', label: 'Name', type: 'string' },
            { key: 'description', label: 'Description', type: 'string' },
            { key: 'category', label: 'Category', type: 'string' },
            { key: 'difficulty', label: 'Difficulty', type: 'string' },
            { key: 'estimatedTime', label: 'Estimated Time', type: 'string' },
            { key: 'createdAt', label: 'Created At', type: 'date' }
        ]
    },
    {
        key: 'tasks',
        label: 'Tasks',
        icon: <TaskIcon />,
        apiEndpoint: '/api/tasks',
        fields: [
            { key: 'id', label: 'ID', type: 'string' },
            { key: 'title', label: 'Title', type: 'string' },
            { key: 'description', label: 'Description', type: 'string' },
            { key: 'status', label: 'Status', type: 'string' },
            { key: 'priority', label: 'Priority', type: 'string' },
            { key: 'dueDate', label: 'Due Date', type: 'date' },
            { key: 'createdAt', label: 'Created At', type: 'date' }
        ]
    },
    {
        key: 'databaseEntries',
        label: 'Database Entries',
        icon: <DatabaseIcon />,
        apiEndpoint: '/api/database',
        fields: [
            { key: 'id', label: 'ID', type: 'string' },
            { key: 'name', label: 'Name', type: 'string' },
            { key: 'description', label: 'Description', type: 'string' },
            { key: 'type', label: 'Type', type: 'string' },
            { key: 'properties', label: 'Properties', type: 'string' },
            { key: 'createdAt', label: 'Created At', type: 'date' }
        ]
    }
];

const EnhancedDataExport: React.FC<EnhancedDataExportProps> = ({ open, onClose }) => {
    const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
    const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx' | 'pdf' | 'html'>('pdf');
    const [filename, setFilename] = useState('research-notebook-export');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);

    // Enhanced export options
    const [exportOptions, setExportOptions] = useState<ExportOptions>({
        includeMetadata: true,
        includeRelationships: true,
        includeNotes: true,
        includeFiles: false,
        includeDrawings: true,
        drawingFormat: 'both',
        drawingMaxWidth: 600,
        drawingMaxHeight: 400
    });

    const handleEntityToggle = (entityKey: string) => {
        setSelectedEntities(prev => 
            prev.includes(entityKey) 
                ? prev.filter(key => key !== entityKey)
                : [...prev, entityKey]
        );
    };

    const handleSelectAll = () => {
        setSelectedEntities(exportEntities.map(entity => entity.key));
    };

    const handleSelectNone = () => {
        setSelectedEntities([]);
    };

    const handleExportOptionsChange = (key: keyof ExportOptions, value: any) => {
        setExportOptions(prev => ({ ...prev, [key]: value }));
    };

    const fetchEntityData = async (entity: ExportEntity): Promise<any[]> => {
        try {
            let response;
            switch (entity.key) {
                case 'notes':
                    response = await notesApi.getAll();
                    return response.data || [];
                case 'projects':
                    response = await projectsApi.getAll();
                    return response.data || [];
                case 'protocols':
                    response = await protocolsApi.getAll();
                    return response.data.protocols || [];
                case 'tasks':
                    response = await tasksApi.getAll();
                    return response.data || [];
                case 'databaseEntries':
                    response = await databaseApi.getAll();
                    return response.data.entries || [];
                default:
                    return [];
            }
        } catch (error) {
            console.error(`Error fetching ${entity.key}:`, error);
            return [];
        }
    };

    const exportData = async () => {
        if (selectedEntities.length === 0) {
            setError('Please select at least one entity to export');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const exportData: ExportData = {};

            // Fetch data for selected entities
            for (const entityKey of selectedEntities) {
                const entity = exportEntities.find(e => e.key === entityKey);
                if (entity) {
                    const data = await fetchEntityData(entity);
                    (exportData as any)[entityKey] = data;
                }
            }

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const finalFilename = `${filename}-${timestamp}.${exportFormat}`;

            // Export using enhanced service
            await enhancedExportService.exportData(exportFormat, exportData, exportOptions, finalFilename);

            setSuccess(`Export completed successfully! File: ${finalFilename}`);
        } catch (error) {
            console.error('Export error:', error);
            setError(error instanceof Error ? error.message : 'Export failed');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DownloadIcon />
                    Enhanced Data Export
                </Box>
            </DialogTitle>
            
            <DialogContent>
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                    <Tab label="Entities" />
                    <Tab label="Format & Options" />
                    <Tab label="Drawing Settings" />
                </Tabs>

                {/* Entities Tab */}
                <TabPanel value={activeTab} index={0}>
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Button size="small" onClick={handleSelectAll}>
                                Select All
                            </Button>
                            <Button size="small" onClick={handleSelectNone}>
                                Select None
                            </Button>
                        </Box>
                        
                        <List>
                            {exportEntities.map((entity) => (
                                <ListItem key={entity.key} dense>
                                    <ListItemIcon>
                                        <Checkbox
                                            edge="start"
                                            checked={selectedEntities.includes(entity.key)}
                                            onChange={() => handleEntityToggle(entity.key)}
                                        />
                                    </ListItemIcon>
                                    <ListItemIcon>
                                        {entity.icon}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={entity.label}
                                        secondary={`${entity.fields.length} fields available`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </TabPanel>

                {/* Format & Options Tab */}
                <TabPanel value={activeTab} index={1}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Export Format
                        </Typography>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Format</InputLabel>
                            <Select
                                value={exportFormat}
                                label="Format"
                                onChange={(e) => setExportFormat(e.target.value as any)}
                            >
                                <MenuItem value="pdf">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PdfIcon />
                                        PDF Document
                                    </Box>
                                </MenuItem>
                                <MenuItem value="html">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DescriptionIcon />
                                        HTML Web Page
                                    </Box>
                                </MenuItem>
                                <MenuItem value="xlsx">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TableIcon />
                                        Excel Spreadsheet
                                    </Box>
                                </MenuItem>
                                <MenuItem value="json">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CodeIcon />
                                        JSON Data
                                    </Box>
                                </MenuItem>
                                <MenuItem value="csv">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <FileDownloadIcon />
                                        CSV Spreadsheet
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Filename"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            sx={{ mb: 2 }}
                            helperText="Timestamp will be automatically added"
                        />

                        <Typography variant="h6" gutterBottom>
                            Export Options
                        </Typography>
                        
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={exportOptions.includeMetadata}
                                    onChange={(e) => handleExportOptionsChange('includeMetadata', e.target.checked)}
                                />
                            }
                            label="Include Metadata (IDs, timestamps)"
                        />
                        
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={exportOptions.includeRelationships}
                                    onChange={(e) => handleExportOptionsChange('includeRelationships', e.target.checked)}
                                />
                            }
                            label="Include Relationships"
                        />
                        
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={exportOptions.includeNotes}
                                    onChange={(e) => handleExportOptionsChange('includeNotes', e.target.checked)}
                                />
                            }
                            label="Include Notes"
                        />
                        
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={exportOptions.includeFiles}
                                    onChange={(e) => handleExportOptionsChange('includeFiles', e.target.checked)}
                                />
                            }
                            label="Include File References"
                        />
                    </Box>
                </TabPanel>

                {/* Drawing Settings Tab */}
                <TabPanel value={activeTab} index={2}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DrawingIcon />
                                Drawing Export Settings
                            </Box>
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={exportOptions.includeDrawings}
                                    onChange={(e) => handleExportOptionsChange('includeDrawings', e.target.checked)}
                                />
                            }
                            label="Include Freeform Drawings"
                        />

                        {exportOptions.includeDrawings && (
                            <>
                                <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
                                    <InputLabel>Drawing Format</InputLabel>
                                    <Select
                                        value={exportOptions.drawingFormat}
                                        label="Drawing Format"
                                        onChange={(e) => handleExportOptionsChange('drawingFormat', e.target.value)}
                                    >
                                        <MenuItem value="svg">
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <SvgIcon />
                                                SVG Vector Graphics
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="png">
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <ImageIcon />
                                                PNG Raster Images
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="both">
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <DrawingIcon />
                                                Both SVG and PNG
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                </FormControl>

                                <Typography variant="subtitle2" gutterBottom>
                                    Maximum Drawing Dimensions
                                </Typography>
                                
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" gutterBottom>
                                        Max Width: {exportOptions.drawingMaxWidth}px
                                    </Typography>
                                    <Slider
                                        value={exportOptions.drawingMaxWidth}
                                        onChange={(_, value) => handleExportOptionsChange('drawingMaxWidth', value)}
                                        min={200}
                                        max={1200}
                                        step={50}
                                        marks
                                        valueLabelDisplay="auto"
                                    />
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" gutterBottom>
                                        Max Height: {exportOptions.drawingMaxHeight}px
                                    </Typography>
                                    <Slider
                                        value={exportOptions.drawingMaxHeight}
                                        onChange={(_, value) => handleExportOptionsChange('drawingMaxHeight', value)}
                                        min={150}
                                        max={800}
                                        step={50}
                                        marks
                                        valueLabelDisplay="auto"
                                    />
                                </Box>

                                <Alert severity="info" sx={{ mt: 2 }}>
                                    <Typography variant="body2">
                                        <strong>SVG Format:</strong> Vector graphics, scalable, smaller file size<br/>
                                        <strong>PNG Format:</strong> Raster images, better compatibility, larger file size<br/>
                                        <strong>Both Formats:</strong> Includes both SVG and PNG versions
                                    </Typography>
                                </Alert>
                            </>
                        )}
                    </Box>
                </TabPanel>

                {/* Error/Success Messages */}
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
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={exportData}
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
                    disabled={loading || selectedEntities.length === 0}
                >
                    {loading ? 'Exporting...' : 'Export Data'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// TabPanel component
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`export-tabpanel-${index}`}
            aria-labelledby={`export-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 1 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default EnhancedDataExport; 