import React, { useState, useRef, useCallback } from 'react';
import {
    Box, Typography, Card, CardContent, Button, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Chip, Alert, IconButton, Tooltip, Divider, Paper,
    FormControl, InputLabel, Select, MenuItem, Switch,
    FormControlLabel, Accordion, AccordionSummary, AccordionDetails,
    Grid, List, ListItem, ListItemText, ListItemIcon,
    Tabs, Tab, Stepper, Step, StepLabel, StepContent,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Checkbox, Radio, RadioGroup, LinearProgress, CircularProgress,
    Badge, Snackbar
} from '@mui/material';
import {
    Upload as UploadIcon, FileUpload as FileUploadIcon,
    CloudUpload as CloudUploadIcon, Storage as DatabaseIcon,
    Link as LinkIcon, Settings as SettingsIcon,
    CheckCircle as CheckIcon, Error as ErrorIcon,
    Warning as WarningIcon, Info as InfoIcon,
    ExpandMore as ExpandMoreIcon, PlayArrow as PlayIcon,
    Stop as StopIcon, Refresh as RefreshIcon,
    Download as DownloadIcon, Save as SaveIcon,
    Delete as DeleteIcon, Edit as EditIcon,
    Science as ScienceIcon, Biotech as BiotechIcon,
    LocalHospital as LocalHospitalIcon, WaterDrop as WaterDropIcon
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { format } from 'date-fns';

interface ImportSource {
    id: string;
    name: string;
    type: 'file' | 'url' | 'database' | 'api' | 'zotero' | 'pubmed';
    description: string;
    icon: React.ReactNode;
    supportedFormats: string[];
    configurable: boolean;
}

interface ImportJob {
    id: string;
    name: string;
    source: ImportSource;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    totalRecords: number;
    processedRecords: number;
    errors: ImportError[];
    warnings: ImportWarning[];
    createdAt: string;
    completedAt?: string;
    configuration: ImportConfiguration;
}

interface ImportError {
    id: string;
    type: 'validation' | 'mapping' | 'duplicate' | 'system';
    message: string;
    row?: number;
    column?: string;
    data?: any;
    severity: 'error' | 'warning' | 'info';
}

interface ImportWarning {
    id: string;
    type: 'data_quality' | 'mapping_suggestion' | 'format_warning';
    message: string;
    suggestion?: string;
    data?: any;
}

interface ImportConfiguration {
    targetEntity: 'experiments' | 'protocols' | 'notes' | 'database' | 'projects' | 'tasks';
    mapping: FieldMapping[];
    validation: ValidationRules;
    conflictResolution: ConflictResolution;
    dataTransformation: DataTransformation[];
    batchSize: number;
    skipErrors: boolean;
    createMissing: boolean;
}

interface FieldMapping {
    sourceField: string;
    targetField: string;
    transformation?: string;
    required: boolean;
    defaultValue?: any;
    validation?: string;
}

interface ValidationRules {
    requiredFields: string[];
    uniqueFields: string[];
    formatRules: { [field: string]: string };
    rangeRules: { [field: string]: { min: any; max: any } };
    customRules: { [field: string]: string };
}

interface ConflictResolution {
    strategy: 'skip' | 'overwrite' | 'merge' | 'rename' | 'ask';
    keyFields: string[];
    mergeStrategy: 'prefer_source' | 'prefer_target' | 'combine' | 'custom';
}

interface DataTransformation {
    field: string;
    type: 'format' | 'convert' | 'calculate' | 'extract' | 'combine';
    operation: string;
    parameters: any;
}

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
            id={`import-tabpanel-${index}`}
            aria-labelledby={`import-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const AdvancedImportSystem: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [activeStep, setActiveStep] = useState(0);
    const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
    const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
    const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
    const [validationDialogOpen, setValidationDialogOpen] = useState(false);
    const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
    const [fileInputRef] = useState(useRef<HTMLInputElement>(null));
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
        open: false, message: '', severity: 'success'
    });

    const [importConfig, setImportConfig] = useState<ImportConfiguration>({
        targetEntity: 'experiments',
        mapping: [],
        validation: {
            requiredFields: [],
            uniqueFields: [],
            formatRules: {},
            rangeRules: {},
            customRules: {}
        },
        conflictResolution: {
            strategy: 'ask',
            keyFields: [],
            mergeStrategy: 'prefer_source'
        },
        dataTransformation: [],
        batchSize: 100,
        skipErrors: false,
        createMissing: true
    });

    // Available import sources
    const importSources: ImportSource[] = [
        {
            id: 'file-upload',
            name: 'File Upload',
            type: 'file',
            description: 'Import data from CSV, Excel, JSON, or XML files',
            icon: <FileUploadIcon />,
            supportedFormats: ['csv', 'xlsx', 'xls', 'json', 'xml'],
            configurable: true
        },
        {
            id: 'url-import',
            name: 'URL Import',
            type: 'url',
            description: 'Import data from web URLs or API endpoints',
            icon: <LinkIcon />,
            supportedFormats: ['json', 'xml', 'csv'],
            configurable: true
        },
        {
            id: 'database-import',
            name: 'Database Import',
            type: 'database',
            description: 'Import from external databases (MySQL, PostgreSQL, etc.)',
            icon: <DatabaseIcon />,
            supportedFormats: ['sql', 'json'],
            configurable: true
        },
        {
            id: 'zotero-import',
            name: 'Zotero Integration',
            type: 'zotero',
            description: 'Import references and citations from Zotero',
            icon: <ScienceIcon />,
            supportedFormats: ['json', 'bibtex'],
            configurable: true
        },
        {
            id: 'pubmed-import',
            name: 'PubMed Import',
            type: 'pubmed',
            description: 'Import research papers from PubMed',
            icon: <BiotechIcon />,
            supportedFormats: ['xml', 'json'],
            configurable: true
        },
        {
            id: 'api-import',
            name: 'API Import',
            type: 'api',
            description: 'Import data from REST APIs or GraphQL endpoints',
            icon: <CloudUploadIcon />,
            supportedFormats: ['json', 'xml'],
            configurable: true
        }
    ];

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleSourceSelect = (source: ImportSource) => {
        setSelectedSource(source);
        setActiveStep(1);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const data = await parseFile(file);
            setPreviewData(data.slice(0, 10)); // Show first 10 rows
            setActiveStep(2);
        } catch (error: unknown) {
            setSnackbar({
                open: true,
                message: 'Failed to parse file: ' + (error instanceof Error ? error.message : 'Unknown error'),
                severity: 'error'
            });
        }
    };

    const parseFile = async (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const content = e.target?.result;
                    if (!content) throw new Error('No content read from file');

                    const extension = file.name.split('.').pop()?.toLowerCase();

                    switch (extension) {
                        case 'csv':
                            Papa.parse(content as string, {
                                header: true,
                                complete: (results) => resolve(results.data),
                                error: (error: any) => reject(error)
                            });
                            break;

                        case 'xlsx':
                        case 'xls':
                            const workbook = XLSX.read(content, { type: 'binary' });
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const data = XLSX.utils.sheet_to_json(worksheet);
                            resolve(data);
                            break;

                        case 'json':
                            const jsonData = JSON.parse(content as string);
                            resolve(Array.isArray(jsonData) ? jsonData : [jsonData]);
                            break;

                        default:
                            reject(new Error(`Unsupported file format: ${extension}`));
                    }
                } catch (error: unknown) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));

            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                reader.readAsText(file);
            } else {
                reader.readAsBinaryString(file);
            }
        });
    };

    const validateData = (data: any[]): { errors: ImportError[]; warnings: ImportWarning[] } => {
        const errors: ImportError[] = [];
        const warnings: ImportWarning[] = [];

        data.forEach((row, index) => {
            // Check required fields
            importConfig.validation.requiredFields.forEach(field => {
                if (!row[field] || row[field] === '') {
                    errors.push({
                        id: `req-${index}-${field}`,
                        type: 'validation',
                        message: `Required field '${field}' is missing in row ${index + 1}`,
                        row: index + 1,
                        column: field,
                        data: row,
                        severity: 'error'
                    });
                }
            });

            // Check format rules
            Object.entries(importConfig.validation.formatRules).forEach(([field, format]) => {
                if (row[field]) {
                    const isValid = validateFormat(row[field], format);
                    if (!isValid) {
                        errors.push({
                            id: `format-${index}-${field}`,
                            type: 'validation',
                            message: `Field '${field}' in row ${index + 1} does not match format '${format}'`,
                            row: index + 1,
                            column: field,
                            data: row,
                            severity: 'error'
                        });
                    }
                }
            });

            // Check for potential duplicates
            if (importConfig.validation.uniqueFields.length > 0) {
                const duplicateKey = checkForDuplicates(data, index, importConfig.validation.uniqueFields);
                if (duplicateKey) {
                    warnings.push({
                        id: `duplicate-${index}`,
                        type: 'data_quality',
                        message: `Potential duplicate found in row ${index + 1}`,
                        suggestion: 'Consider merging or removing duplicate entries',
                        data: row
                    });
                }
            }
        });

        return { errors, warnings };
    };

    const validateFormat = (value: any, format: string): boolean => {
        switch (format) {
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            case 'date':
                return !isNaN(Date.parse(value));
            case 'number':
                return !isNaN(Number(value));
            case 'url':
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            default:
                return true;
        }
    };

    const checkForDuplicates = (data: any[], currentIndex: number, uniqueFields: string[]): boolean => {
        const currentRow = data[currentIndex];
        const currentKey = uniqueFields.map(field => currentRow[field]).join('|');

        for (let i = 0; i < currentIndex; i++) {
            const existingRow = data[i];
            const existingKey = uniqueFields.map(field => existingRow[field]).join('|');
            if (currentKey === existingKey) {
                return true;
            }
        }
        return false;
    };

    const startImport = async () => {
        if (!selectedSource || previewData.length === 0) return;

        const job: ImportJob = {
            id: `import-${Date.now()}`,
            name: `Import from ${selectedSource.name}`,
            source: selectedSource,
            status: 'processing',
            progress: 0,
            totalRecords: previewData.length,
            processedRecords: 0,
            errors: [],
            warnings: [],
            createdAt: new Date().toISOString(),
            configuration: importConfig
        };

        setCurrentJob(job);
        setImportJobs(prev => [...prev, job]);

        // Simulate import process
        for (let i = 0; i < previewData.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time

            job.processedRecords = i + 1;
            job.progress = ((i + 1) / previewData.length) * 100;

            // Simulate some errors
            if (i === 2) {
                job.errors.push({
                    id: `error-${i}`,
                    type: 'validation',
                    message: `Validation error in row ${i + 1}`,
                    row: i + 1,
                    severity: 'error'
                });
            }

            setCurrentJob({ ...job });
        }

        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        setCurrentJob(job);
        setImportJobs(prev => prev.map(j => j.id === job.id ? job : j));

        setSnackbar({
            open: true,
            message: `Import completed! Processed ${job.processedRecords} records.`,
            severity: 'success'
        });
    };

    const getEntityIcon = (entity: string) => {
        const icons = {
            experiments: <ScienceIcon />,
            protocols: <BiotechIcon />,
            notes: <InfoIcon />,
            database: <DatabaseIcon />,
            projects: <SettingsIcon />,
            tasks: <CheckIcon />
        };
        return icons[entity as keyof typeof icons] || <InfoIcon />;
    };

    const getStatusColor = (status: string) => {
        const colors = {
            pending: 'default',
            processing: 'primary',
            completed: 'success',
            failed: 'error',
            cancelled: 'warning'
        };
        return colors[status as keyof typeof colors] || 'default';
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Advanced Import System
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                Import data from various sources with validation, mapping, and conflict resolution
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="Import Wizard" />
                    <Tab label="Import Jobs" />
                    <Tab label="Templates" />
                    <Tab label="Settings" />
                </Tabs>
            </Box>

            <TabPanel value={activeTab} index={0}>
                <Stepper activeStep={activeStep} orientation="vertical">
                    <Step>
                        <StepLabel>Select Import Source</StepLabel>
                        <StepContent>
                            <Grid container spacing={2}>
                                {importSources.map((source) => (
                                    <Grid item xs={12} md={6} key={source.id}>
                                        <Card
                                            sx={{
                                                cursor: 'pointer',
                                                border: selectedSource?.id === source.id ? 2 : 1,
                                                borderColor: selectedSource?.id === source.id ? 'primary.main' : 'divider'
                                            }}
                                            onClick={() => handleSourceSelect(source)}
                                        >
                                            <CardContent>
                                                <Box display="flex" alignItems="center" gap={2} mb={2}>
                                                    <Box sx={{ color: 'primary.main' }}>
                                                        {source.icon}
                                                    </Box>
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="h6">{source.name}</Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {source.description}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box display="flex" gap={1} flexWrap="wrap">
                                                    {source.supportedFormats.map(format => (
                                                        <Chip key={format} label={format.toUpperCase()} size="small" />
                                                    ))}
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </StepContent>
                    </Step>

                    <Step>
                        <StepLabel>Configure Import</StepLabel>
                        <StepContent>
                            {selectedSource?.type === 'file' && (
                                <Box>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv,.xlsx,.xls,.json,.xml"
                                        onChange={handleFileUpload}
                                        style={{ display: 'none' }}
                                    />
                                    <Button
                                        variant="contained"
                                        startIcon={<UploadIcon />}
                                        onClick={() => fileInputRef.current?.click()}
                                        sx={{ mb: 2 }}
                                    >
                                        Choose File
                                    </Button>
                                </Box>
                            )}

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Target Entity</InputLabel>
                                <Select
                                    value={importConfig.targetEntity}
                                    onChange={(e) => setImportConfig(prev => ({
                                        ...prev,
                                        targetEntity: e.target.value as any
                                    }))}
                                >
                                    <MenuItem value="experiments">Experiments</MenuItem>
                                    <MenuItem value="protocols">Protocols</MenuItem>
                                    <MenuItem value="notes">Notes</MenuItem>
                                    <MenuItem value="database">Database Entries</MenuItem>
                                    <MenuItem value="projects">Projects</MenuItem>
                                    <MenuItem value="tasks">Tasks</MenuItem>
                                </Select>
                            </FormControl>

                            <Box display="flex" gap={2}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={importConfig.skipErrors}
                                            onChange={(e) => setImportConfig(prev => ({
                                                ...prev,
                                                skipErrors: e.target.checked
                                            }))}
                                        />
                                    }
                                    label="Skip Errors"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={importConfig.createMissing}
                                            onChange={(e) => setImportConfig(prev => ({
                                                ...prev,
                                                createMissing: e.target.checked
                                            }))}
                                        />
                                    }
                                    label="Create Missing References"
                                />
                            </Box>
                        </StepContent>
                    </Step>

                    <Step>
                        <StepLabel>Preview & Validate</StepLabel>
                        <StepContent>
                            {previewData.length > 0 && (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Data Preview ({previewData.length} rows)
                                    </Typography>

                                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    {Object.keys(previewData[0] || {}).map(key => (
                                                        <TableCell key={key}>{key}</TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {previewData.slice(0, 5).map((row, index) => (
                                                    <TableRow key={index}>
                                                        {Object.values(row).map((value, i) => (
                                                            <TableCell key={i}>
                                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    <Box display="flex" gap={2}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => setMappingDialogOpen(true)}
                                        >
                                            Configure Mapping
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() => setValidationDialogOpen(true)}
                                        >
                                            Set Validation Rules
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={startImport}
                                            disabled={!currentJob}
                                        >
                                            Start Import
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </StepContent>
                    </Step>
                </Stepper>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
                <Typography variant="h6" gutterBottom>
                    Import Jobs ({importJobs.length})
                </Typography>

                {importJobs.length === 0 ? (
                    <Alert severity="info">
                        No import jobs found. Start a new import to see jobs here.
                    </Alert>
                ) : (
                    <List>
                        {importJobs.map((job) => (
                            <ListItem key={job.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <Card sx={{ width: '100%', mb: 2 }}>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Box>
                                                <Typography variant="h6">{job.name}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {job.source.name} • {format(new Date(job.createdAt), 'MMM dd, yyyy HH:mm')}
                                                </Typography>
                                            </Box>
                                            <Box display="flex" gap={1}>
                                                <Chip
                                                    label={job.status}
                                                    color={getStatusColor(job.status) as any}
                                                />
                                                {getEntityIcon(job.configuration.targetEntity)}
                                            </Box>
                                        </Box>

                                        {job.status === 'processing' && (
                                            <Box sx={{ mb: 2 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={job.progress}
                                                    sx={{ mb: 1 }}
                                                />
                                                <Typography variant="body2">
                                                    {job.processedRecords} / {job.totalRecords} records processed
                                                </Typography>
                                            </Box>
                                        )}

                                        <Box display="flex" gap={2}>
                                            <Typography variant="body2">
                                                Records: {job.processedRecords}/{job.totalRecords}
                                            </Typography>
                                            {job.errors.length > 0 && (
                                                <Typography variant="body2" color="error">
                                                    Errors: {job.errors.length}
                                                </Typography>
                                            )}
                                            {job.warnings.length > 0 && (
                                                <Typography variant="body2" color="warning.main">
                                                    Warnings: {job.warnings.length}
                                                </Typography>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </ListItem>
                        ))}
                    </List>
                )}
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
                <Typography variant="h6" gutterBottom>
                    Import Templates
                </Typography>
                <Alert severity="info">
                    Import templates feature coming soon. This will allow you to save and reuse import configurations.
                </Alert>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
                <Typography variant="h6" gutterBottom>
                    Import Settings
                </Typography>
                <Alert severity="info">
                    Import settings feature coming soon. This will allow you to configure default import behavior.
                </Alert>
            </TabPanel>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdvancedImportSystem; 