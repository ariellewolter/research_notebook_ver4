import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, 
    Box, Typography, FormControl, InputLabel, Select, MenuItem,
    TextField, Chip, Alert, CircularProgress, Grid, Card, CardContent,
    List, ListItem, ListItemText, ListItemIcon, Divider, Switch,
    FormControlLabel, Accordion, AccordionSummary, AccordionDetails,
    Tabs, Tab, Paper, Checkbox, Radio, RadioGroup
} from '@mui/material';
import {
    Article as ArticleIcon, Download as DownloadIcon,
    PictureAsPdf as PdfIcon, Description as LabNotebookIcon,
    DataObject as DataPackageIcon, Settings as SettingsIcon,
    ExpandMore as ExpandMoreIcon, CheckCircle as CheckIcon,
    Warning as WarningIcon, Info as InfoIcon
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { format } from 'date-fns';

interface PublicationReadyExportProps {
    open: boolean;
    onClose: () => void;
    projects: any[];
    experiments: any[];
    protocols: any[];
    tasks: any[];
    notes: any[];
    databaseEntries: any[];
}

interface ExportTemplate {
    id: string;
    name: string;
    description: string;
    type: 'journal' | 'lab_notebook' | 'data_package' | 'custom';
    format: 'pdf' | 'docx' | 'html' | 'json';
    fields: string[];
    required: string[];
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
            id={`export-tabpanel-${index}`}
            aria-labelledby={`export-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const PublicationReadyExport: React.FC<PublicationReadyExportProps> = ({
    open, onClose, projects, experiments, protocols, tasks, notes, databaseEntries
}) => {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [exportConfig, setExportConfig] = useState({
        includeMetadata: true,
        includeCharts: true,
        includeTables: true,
        includeReferences: true,
        format: 'pdf' as 'pdf' | 'docx' | 'html' | 'json',
        filename: 'publication-export',
        dateRange: {
            start: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
            end: format(new Date(), 'yyyy-MM-dd')
        },
        selectedProjects: [] as string[],
        selectedExperiments: [] as string[],
        includeRawData: false,
        includeAnalysis: true,
        includeProtocols: true,
        includeNotes: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Predefined export templates
    const exportTemplates: ExportTemplate[] = [
        {
            id: 'nature',
            name: 'Nature Journal',
            description: 'Format optimized for Nature journal submissions',
            type: 'journal',
            format: 'pdf',
            fields: ['title', 'abstract', 'methods', 'results', 'discussion', 'references'],
            required: ['title', 'abstract', 'methods', 'results']
        },
        {
            id: 'science',
            name: 'Science Journal',
            description: 'Format optimized for Science journal submissions',
            type: 'journal',
            format: 'pdf',
            fields: ['title', 'abstract', 'introduction', 'materials_methods', 'results', 'discussion'],
            required: ['title', 'abstract', 'materials_methods', 'results']
        },
        {
            id: 'cell',
            name: 'Cell Journal',
            description: 'Format optimized for Cell journal submissions',
            type: 'journal',
            format: 'pdf',
            fields: ['title', 'highlights', 'summary', 'introduction', 'results', 'discussion', 'methods'],
            required: ['title', 'summary', 'results', 'methods']
        },
        {
            id: 'lab_notebook',
            name: 'Lab Notebook',
            description: 'Formatted lab notebook pages with experiments and protocols',
            type: 'lab_notebook',
            format: 'pdf',
            fields: ['experiment_title', 'date', 'protocol', 'materials', 'procedure', 'results', 'notes'],
            required: ['experiment_title', 'date', 'procedure']
        },
        {
            id: 'data_package',
            name: 'Data Package',
            description: 'Complete data package with raw data and analysis',
            type: 'data_package',
            format: 'json',
            fields: ['metadata', 'raw_data', 'processed_data', 'analysis', 'protocols', 'notes'],
            required: ['metadata', 'raw_data']
        },
        {
            id: 'custom',
            name: 'Custom Template',
            description: 'Create your own custom export template',
            type: 'custom',
            format: 'pdf',
            fields: [],
            required: []
        }
    ];

    useEffect(() => {
        if (open && exportTemplates.length > 0) {
            setSelectedTemplate(exportTemplates[0].id);
        }
    }, [open]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleConfigChange = (field: string, value: any) => {
        setExportConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const generatePublicationContent = (template: ExportTemplate) => {
        const content: any = {
            template: template.name,
            exportDate: new Date().toISOString(),
            metadata: {
                totalProjects: projects.length,
                totalExperiments: experiments.length,
                totalProtocols: protocols.length,
                dateRange: exportConfig.dateRange
            }
        };

        // Add content based on template type
        switch (template.type) {
            case 'journal':
                content.sections = {
                    title: 'Research Summary',
                    abstract: generateAbstract(),
                    methods: generateMethods(),
                    results: generateResults(),
                    discussion: generateDiscussion(),
                    references: generateReferences()
                };
                break;
            case 'lab_notebook':
                content.experiments = experiments.map(exp => ({
                    title: exp.name,
                    date: exp.createdAt,
                    protocol: protocols.find(p => p.id === exp.protocolId)?.name || 'N/A',
                    materials: generateMaterials(exp),
                    procedure: generateProcedure(exp),
                    results: generateExperimentResults(exp),
                    notes: notes.filter(n => n.experimentId === exp.id)
                }));
                break;
            case 'data_package':
                content.data = {
                    metadata: generateMetadata(),
                    raw_data: generateRawData(),
                    processed_data: generateProcessedData(),
                    analysis: generateAnalysis(),
                    protocols: protocols,
                    notes: notes
                };
                break;
        }

        return content;
    };

    const generateAbstract = () => {
        const projectNames = projects.map(p => p.name).join(', ');
        const experimentCount = experiments.length;
        return `This study presents findings from ${experimentCount} experiments across ${projects.length} projects: ${projectNames}. The research demonstrates significant progress in experimental methodology and data analysis.`;
    };

    const generateMethods = () => {
        return protocols.map(protocol => ({
            name: protocol.name,
            description: protocol.description,
            steps: JSON.parse(protocol.steps || '[]'),
            equipment: JSON.parse(protocol.equipment || '[]'),
            reagents: JSON.parse(protocol.reagents || '[]')
        }));
    };

    const generateResults = () => {
        return experiments.map(exp => ({
            name: exp.name,
            description: exp.description,
            status: exp.status,
            results: exp.results || 'Results pending'
        }));
    };

    const generateDiscussion = () => {
        return `Analysis of ${experiments.length} experiments reveals consistent patterns in experimental outcomes. Further investigation is recommended to validate these findings.`;
    };

    const generateReferences = () => {
        return databaseEntries
            .filter(entry => entry.type === 'LITERATURE')
            .map(entry => ({
                title: entry.name,
                authors: entry.properties?.authors || 'Unknown',
                journal: entry.properties?.journal || 'Unknown',
                year: entry.properties?.year || 'Unknown',
                doi: entry.properties?.doi || ''
            }));
    };

    const generateMaterials = (experiment: any) => {
        const protocol = protocols.find(p => p.id === experiment.protocolId);
        if (!protocol) return [];
        return JSON.parse(protocol.reagents || '[]');
    };

    const generateProcedure = (experiment: any) => {
        const protocol = protocols.find(p => p.id === experiment.protocolId);
        if (!protocol) return [];
        return JSON.parse(protocol.steps || '[]');
    };

    const generateExperimentResults = (experiment: any) => {
        return experiment.results || 'Results not yet recorded';
    };

    const generateMetadata = () => {
        return {
            exportDate: new Date().toISOString(),
            totalProjects: projects.length,
            totalExperiments: experiments.length,
            totalProtocols: protocols.length,
            totalTasks: tasks.length,
            totalNotes: notes.length,
            totalDatabaseEntries: databaseEntries.length
        };
    };

    const generateRawData = () => {
        return experiments.map(exp => ({
            id: exp.id,
            name: exp.name,
            project: projects.find(p => p.id === exp.projectId)?.name || 'Unknown',
            protocol: protocols.find(p => p.id === exp.protocolId)?.name || 'Unknown',
            data: exp.data || {},
            metadata: {
                createdAt: exp.createdAt,
                updatedAt: exp.updatedAt,
                status: exp.status
            }
        }));
    };

    const generateProcessedData = () => {
        return experiments.map(exp => ({
            id: exp.id,
            name: exp.name,
            processedResults: exp.processedResults || {},
            analysis: exp.analysis || {},
            statistics: exp.statistics || {}
        }));
    };

    const generateAnalysis = () => {
        return {
            summary: `Analysis of ${experiments.length} experiments`,
            keyFindings: experiments.map(exp => exp.name),
            recommendations: 'Continue with current experimental approach',
            nextSteps: 'Validate findings with additional experiments'
        };
    };

    const exportData = async () => {
        if (!selectedTemplate) {
            setError('Please select an export template');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const template = exportTemplates.find(t => t.id === selectedTemplate);
            if (!template) throw new Error('Template not found');

            const content = generatePublicationContent(template);
            let blob: Blob;
            let filename: string;

            switch (exportConfig.format) {
                case 'pdf':
                    // For now, we'll create a JSON file that can be converted to PDF
                    // In a real implementation, you'd use a PDF library like jsPDF or puppeteer
                    const pdfContent = JSON.stringify(content, null, 2);
                    blob = new Blob([pdfContent], { type: 'application/json' });
                    filename = `${exportConfig.filename}.json`;
                    break;

                case 'docx':
                    // Similar approach for DOCX - would use a library like docx
                    const docxContent = JSON.stringify(content, null, 2);
                    blob = new Blob([docxContent], { type: 'application/json' });
                    filename = `${exportConfig.filename}.json`;
                    break;

                case 'html':
                    const htmlContent = generateHTMLContent(content, template);
                    blob = new Blob([htmlContent], { type: 'text/html' });
                    filename = `${exportConfig.filename}.html`;
                    break;

                case 'json':
                    const jsonContent = JSON.stringify(content, null, 2);
                    blob = new Blob([jsonContent], { type: 'application/json' });
                    filename = `${exportConfig.filename}.json`;
                    break;

                default:
                    throw new Error('Unsupported format');
            }

            saveAs(blob, filename);
            setSuccess(`Export completed successfully! File saved as ${filename}`);
        } catch (err: any) {
            setError(err.message || 'Export failed');
        } finally {
            setLoading(false);
        }
    };

    const generateHTMLContent = (content: any, template: ExportTemplate) => {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${template.name} Export</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .section h2 { color: #333; border-bottom: 2px solid #333; }
        .experiment { margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; }
        .metadata { background: #f5f5f5; padding: 10px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${template.name}</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="metadata">
        <h3>Export Metadata</h3>
        <p>Total Projects: ${content.metadata?.totalProjects || 0}</p>
        <p>Total Experiments: ${content.metadata?.totalExperiments || 0}</p>
        <p>Total Protocols: ${content.metadata?.totalProtocols || 0}</p>
    </div>

    ${template.type === 'journal' ? `
        <div class="section">
            <h2>Abstract</h2>
            <p>${content.sections?.abstract || ''}</p>
        </div>
        <div class="section">
            <h2>Methods</h2>
            <p>${JSON.stringify(content.sections?.methods || [], null, 2)}</p>
        </div>
        <div class="section">
            <h2>Results</h2>
            <p>${JSON.stringify(content.sections?.results || [], null, 2)}</p>
        </div>
    ` : ''}

    ${template.type === 'lab_notebook' ? `
        <div class="section">
            <h2>Experiments</h2>
            ${content.experiments?.map((exp: any) => `
                <div class="experiment">
                    <h3>${exp.title}</h3>
                    <p><strong>Date:</strong> ${new Date(exp.date).toLocaleDateString()}</p>
                    <p><strong>Protocol:</strong> ${exp.protocol}</p>
                    <p><strong>Results:</strong> ${exp.results}</p>
                </div>
            `).join('') || ''}
        </div>
    ` : ''}
</body>
</html>
        `;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <ArticleIcon />
                    <Typography variant="h6">Publication-Ready Export</Typography>
                </Box>
            </DialogTitle>
            
            <DialogContent>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={activeTab} onChange={handleTabChange}>
                        <Tab label="Templates" />
                        <Tab label="Configuration" />
                        <Tab label="Preview" />
                    </Tabs>
                </Box>

                <TabPanel value={activeTab} index={0}>
                    <Grid container spacing={2}>
                        {exportTemplates.map((template) => (
                            <Grid item xs={12} md={6} key={template.id}>
                                <Card 
                                    sx={{ 
                                        cursor: 'pointer',
                                        border: selectedTemplate === template.id ? 2 : 1,
                                        borderColor: selectedTemplate === template.id ? 'primary.main' : 'divider'
                                    }}
                                    onClick={() => setSelectedTemplate(template.id)}
                                >
                                    <CardContent>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            {template.type === 'journal' && <ArticleIcon color="primary" />}
                                            {template.type === 'lab_notebook' && <LabNotebookIcon color="primary" />}
                                            {template.type === 'data_package' && <DataPackageIcon color="primary" />}
                                            {template.type === 'custom' && <SettingsIcon color="primary" />}
                                            <Typography variant="h6">{template.name}</Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" mb={2}>
                                            {template.description}
                                        </Typography>
                                        <Box display="flex" gap={1}>
                                            <Chip label={template.format.toUpperCase()} size="small" />
                                            <Chip label={template.type.replace('_', ' ')} size="small" variant="outlined" />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Filename"
                                value={exportConfig.filename}
                                onChange={(e) => handleConfigChange('filename', e.target.value)}
                                margin="normal"
                            />
                            
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Export Format</InputLabel>
                                <Select
                                    value={exportConfig.format}
                                    onChange={(e) => handleConfigChange('format', e.target.value)}
                                >
                                    <MenuItem value="pdf">PDF Document</MenuItem>
                                    <MenuItem value="docx">Word Document</MenuItem>
                                    <MenuItem value="html">HTML Report</MenuItem>
                                    <MenuItem value="json">JSON Data</MenuItem>
                                </Select>
                            </FormControl>

                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="subtitle1">Content Options</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={exportConfig.includeMetadata}
                                                onChange={(e) => handleConfigChange('includeMetadata', e.target.checked)}
                                            />
                                        }
                                        label="Include Metadata"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={exportConfig.includeCharts}
                                                onChange={(e) => handleConfigChange('includeCharts', e.target.checked)}
                                            />
                                        }
                                        label="Include Charts"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={exportConfig.includeTables}
                                                onChange={(e) => handleConfigChange('includeTables', e.target.checked)}
                                            />
                                        }
                                        label="Include Tables"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={exportConfig.includeReferences}
                                                onChange={(e) => handleConfigChange('includeReferences', e.target.checked)}
                                            />
                                        }
                                        label="Include References"
                                    />
                                </AccordionDetails>
                            </Accordion>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Date Range</Typography>
                            <TextField
                                fullWidth
                                label="Start Date"
                                type="date"
                                value={exportConfig.dateRange.start}
                                onChange={(e) => handleConfigChange('dateRange', { ...exportConfig.dateRange, start: e.target.value })}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="End Date"
                                type="date"
                                value={exportConfig.dateRange.end}
                                onChange={(e) => handleConfigChange('dateRange', { ...exportConfig.dateRange, end: e.target.value })}
                                margin="normal"
                            />

                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Content Selection</Typography>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={exportConfig.includeRawData}
                                        onChange={(e) => handleConfigChange('includeRawData', e.target.checked)}
                                    />
                                }
                                label="Include Raw Data"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={exportConfig.includeAnalysis}
                                        onChange={(e) => handleConfigChange('includeAnalysis', e.target.checked)}
                                    />
                                }
                                label="Include Analysis"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={exportConfig.includeProtocols}
                                        onChange={(e) => handleConfigChange('includeProtocols', e.target.checked)}
                                    />
                                }
                                label="Include Protocols"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={exportConfig.includeNotes}
                                        onChange={(e) => handleConfigChange('includeNotes', e.target.checked)}
                                    />
                                }
                                label="Include Notes"
                            />
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                    <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                        <Typography variant="h6" gutterBottom>Export Preview</Typography>
                        {selectedTemplate && (
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    Template: {exportTemplates.find(t => t.id === selectedTemplate)?.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Format: {exportConfig.format.toUpperCase()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Filename: {exportConfig.filename}.{exportConfig.format}
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="body2">
                                    This export will include {experiments.length} experiments, {protocols.length} protocols, 
                                    and {notes.length} notes from {projects.length} projects.
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </TabPanel>

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
                    disabled={loading || !selectedTemplate}
                    startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
                >
                    {loading ? 'Exporting...' : 'Export'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PublicationReadyExport; 