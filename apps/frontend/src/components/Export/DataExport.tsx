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
    Tab
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
    Bookmark as LiteratureIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

interface ExportEntity {
    key: string;
    label: string;
    icon: React.ReactNode;
    apiEndpoint: string;
    fields: { key: string; label: string; type: 'string' | 'date' | 'number' | 'boolean' }[];
}

interface ExportConfig {
    entities: string[];
    format: 'csv' | 'json' | 'xlsx';
    includeHeaders: boolean;
    dateFormat: string;
    filename: string;
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
            { key: 'steps', label: 'Steps', type: 'string' },
            { key: 'duration', label: 'Duration', type: 'string' },
            { key: 'createdAt', label: 'Created At', type: 'date' }
        ]
    },
    {
        key: 'recipes',
        label: 'Recipes',
        icon: <RecipeIcon />,
        apiEndpoint: '/api/recipes',
        fields: [
            { key: 'id', label: 'ID', type: 'string' },
            { key: 'name', label: 'Name', type: 'string' },
            { key: 'description', label: 'Description', type: 'string' },
            { key: 'ingredients', label: 'Ingredients', type: 'string' },
            { key: 'instructions', label: 'Instructions', type: 'string' },
            { key: 'isPublic', label: 'Public', type: 'boolean' },
            { key: 'createdAt', label: 'Created At', type: 'date' }
        ]
    },
    {
        key: 'database',
        label: 'Database',
        icon: <DatabaseIcon />,
        apiEndpoint: '/api/database',
        fields: [
            { key: 'id', label: 'ID', type: 'string' },
            { key: 'name', label: 'Name', type: 'string' },
            { key: 'type', label: 'Type', type: 'string' },
            { key: 'description', label: 'Description', type: 'string' },
            { key: 'properties', label: 'Properties', type: 'string' },
            { key: 'createdAt', label: 'Created At', type: 'date' }
        ]
    },
    {
        key: 'pdfs',
        label: 'PDFs',
        icon: <PdfIcon />,
        apiEndpoint: '/api/pdfs',
        fields: [
            { key: 'id', label: 'ID', type: 'string' },
            { key: 'title', label: 'Title', type: 'string' },
            { key: 'filePath', label: 'File Path', type: 'string' },
            { key: 'uploadedAt', label: 'Uploaded At', type: 'date' }
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
            { key: 'type', label: 'Type', type: 'string' },
            { key: 'status', label: 'Status', type: 'string' },
            { key: 'dueDate', label: 'Due Date', type: 'date' },
            { key: 'createdAt', label: 'Created At', type: 'date' }
        ]
    },
    {
        key: 'literature',
        label: 'Literature Notes',
        icon: <LiteratureIcon />,
        apiEndpoint: '/api/literature-notes',
        fields: [
            { key: 'id', label: 'ID', type: 'string' },
            { key: 'title', label: 'Title', type: 'string' },
            { key: 'authors', label: 'Authors', type: 'string' },
            { key: 'year', label: 'Year', type: 'string' },
            { key: 'journal', label: 'Journal', type: 'string' },
            { key: 'doi', label: 'DOI', type: 'string' },
            { key: 'abstract', label: 'Abstract', type: 'string' },
            { key: 'tags', label: 'Tags', type: 'string' },
            { key: 'createdAt', label: 'Created At', type: 'date' }
        ]
    }
];

interface DataExportProps {
    open: boolean;
    onClose: () => void;
}

const DataExport: React.FC<DataExportProps> = ({ open, onClose }) => {
    const [config, setConfig] = useState<ExportConfig>({
        entities: [],
        format: 'csv',
        includeHeaders: true,
        dateFormat: 'YYYY-MM-DD',
        filename: 'research-notebook-export'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);

    const handleEntityToggle = (entityKey: string) => {
        setConfig(prev => ({
            ...prev,
            entities: prev.entities.includes(entityKey)
                ? prev.entities.filter(e => e !== entityKey)
                : [...prev.entities, entityKey]
        }));
    };

    const handleSelectAll = () => {
        setConfig(prev => ({
            ...prev,
            entities: exportEntities.map(e => e.key)
        }));
    };

    const handleSelectNone = () => {
        setConfig(prev => ({
            ...prev,
            entities: []
        }));
    };

    const formatValue = (value: any, type: string): string => {
        if (value === null || value === undefined) return '';
        
        switch (type) {
            case 'date':
                return value ? new Date(value).toISOString().split('T')[0] : '';
            case 'boolean':
                return value ? 'Yes' : 'No';
            default:
                return String(value);
        }
    };

    const fetchEntityData = async (entity: ExportEntity): Promise<any[]> => {
        try {
            const response = await fetch(entity.apiEndpoint);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${entity.label}`);
            }
            const data = await response.json();
            return Array.isArray(data) ? data : data.items || data.notes || [];
        } catch (err) {
            console.warn(`Failed to fetch ${entity.label}:`, err);
            return [];
        }
    };

    const exportData = async () => {
        if (config.entities.length === 0) {
            setError('Please select at least one entity to export');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const selectedEntities = exportEntities.filter(e => config.entities.includes(e.key));
            const allData: { [key: string]: any[] } = {};

            // Fetch data for all selected entities
            for (const entity of selectedEntities) {
                allData[entity.key] = await fetchEntityData(entity);
            }

            // Prepare export data
            const exportData: { [key: string]: any[] } = {};
            
            for (const entity of selectedEntities) {
                const entityData = allData[entity.key];
                exportData[entity.label] = entityData.map(item => {
                    const row: any = {};
                    entity.fields.forEach(field => {
                        row[field.label] = formatValue(item[field.key], field.type);
                    });
                    return row;
                });
            }

            // Generate file based on format
            let blob: Blob;
            let filename: string;

            switch (config.format) {
                case 'json':
                    const jsonData = JSON.stringify(exportData, null, 2);
                    blob = new Blob([jsonData], { type: 'application/json' });
                    filename = `${config.filename}.json`;
                    break;

                case 'csv':
                    const csvData = Object.entries(exportData).map(([entityName, data]) => {
                        if (data.length === 0) return '';
                        
                        const headers = Object.keys(data[0]);
                        const csv = [
                            `# ${entityName}`,
                            headers.join(','),
                            ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
                        ].join('\n');
                        return csv;
                    }).join('\n\n');
                    
                    blob = new Blob([csvData], { type: 'text/csv' });
                    filename = `${config.filename}.csv`;
                    break;

                case 'xlsx':
                    const workbook = XLSX.utils.book_new();
                    
                    Object.entries(exportData).forEach(([entityName, data]) => {
                        if (data.length > 0) {
                            const worksheet = XLSX.utils.json_to_sheet(data);
                            XLSX.utils.book_append_sheet(workbook, worksheet, entityName);
                        }
                    });
                    
                    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                    blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
                    filename = `${config.filename}.xlsx`;
                    break;

                default:
                    throw new Error('Unsupported format');
            }

            saveAs(blob, filename);
            setSuccess(`Successfully exported ${config.entities.length} entities to ${filename}`);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Export failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileDownloadIcon />
                    Export Data
                </Box>
            </DialogTitle>
            <DialogContent>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                    <Tab label="Entities" />
                    <Tab label="Format" />
                </Tabs>

                {activeTab === 0 && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Select Entities to Export</Typography>
                            <Box>
                                <Button size="small" onClick={handleSelectAll} sx={{ mr: 1 }}>
                                    Select All
                                </Button>
                                <Button size="small" onClick={handleSelectNone}>
                                    Select None
                                </Button>
                            </Box>
                        </Box>

                        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {exportEntities.map((entity) => (
                                <ListItem key={entity.key} dense>
                                    <Checkbox
                                        checked={config.entities.includes(entity.key)}
                                        onChange={() => handleEntityToggle(entity.key)}
                                    />
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        {entity.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={entity.label}
                                        secondary={`${entity.fields.length} fields`}
                                    />
                                </ListItem>
                            ))}
                        </List>

                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Selected: {config.entities.length} entities
                            </Typography>
                        </Box>
                    </Box>
                )}

                {activeTab === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Export Format</Typography>
                        
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Format</InputLabel>
                            <Select
                                value={config.format}
                                onChange={(e) => setConfig(prev => ({ ...prev, format: e.target.value as any }))}
                                label="Format"
                            >
                                <MenuItem value="csv">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TableIcon /> CSV
                                    </Box>
                                </MenuItem>
                                <MenuItem value="json">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CodeIcon /> JSON
                                    </Box>
                                </MenuItem>
                                <MenuItem value="xlsx">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DescriptionIcon /> Excel
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Filename"
                            value={config.filename}
                            onChange={(e) => setConfig(prev => ({ ...prev, filename: e.target.value }))}
                            sx={{ mb: 2 }}
                            helperText="File will be saved as: filename.format"
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={config.includeHeaders}
                                    onChange={(e) => setConfig(prev => ({ ...prev, includeHeaders: e.target.checked }))}
                                />
                            }
                            label="Include headers"
                        />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mt: 2 }}>
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
                    startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
                    disabled={loading || config.entities.length === 0}
                >
                    {loading ? 'Exporting...' : 'Export Data'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DataExport; 