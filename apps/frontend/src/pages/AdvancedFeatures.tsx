import React, { useState } from 'react';
import {
    Box, Typography, Card, CardContent, Button, Grid,
    Tabs, Tab, Accordion, AccordionSummary, AccordionDetails,
    List, ListItem, ListItemText, ListItemIcon, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, Divider, Paper
} from '@mui/material';
import {
    Article as ArticleIcon, Search as SearchIcon, Comment as CommentIcon,
    AccountTree as PathwayIcon, Download as DownloadIcon, Upload as UploadIcon,
    Science as ScienceIcon, Biotech as BiotechIcon,
    ExpandMore as ExpandMoreIcon, PlayArrow as PlayIcon,
    Info as InfoIcon, CheckCircle as CheckIcon, Code as CodeIcon,
    AccountTree as WorkflowIcon, Timeline as TimelineIcon,
    Assessment as ReportingIcon
} from '@mui/icons-material';
import PublicationReadyExport from '../components/Export/PublicationReadyExport';
import AdvancedImportSystem from '../components/Import/AdvancedImportSystem';
import AdvancedSearch from '../components/Search/AdvancedSearch';
import SharedReviewMode from '../components/Collaboration/SharedReviewMode';
import VisualPathwayEditor from '../components/PathwayEditor/VisualPathwayEditor';
import CSLSupport from '../components/Zotero/CSLSupport';
import TaskFlowManagement from '../components/Tasks/TaskFlowManagement';
import ExperimentalVariableTracker from '../components/ExperimentalVariables/ExperimentalVariableTracker';
import AdvancedReporting from '../components/Reporting/AdvancedReporting';

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
            id={`features-tabpanel-${index}`}
            aria-labelledby={`features-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const AdvancedFeatures: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [searchDialogOpen, setSearchDialogOpen] = useState(false);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [pathwayDialogOpen, setPathwayDialogOpen] = useState(false);
    const [cslDialogOpen, setCslDialogOpen] = useState(false);
    const [taskFlowDialogOpen, setTaskFlowDialogOpen] = useState(false);
    const [variableTrackerDialogOpen, setVariableTrackerDialogOpen] = useState(false);
    const [advancedReportingDialogOpen, setAdvancedReportingDialogOpen] = useState(false);

    // Mock data for demonstrations
    const mockProjects = [
        { id: '1', name: 'Protein Expression Study', description: 'Analysis of protein expression patterns' },
        { id: '2', name: 'Cell Culture Optimization', description: 'Optimizing cell culture conditions' },
        { id: '3', name: 'Drug Screening Assay', description: 'High-throughput drug screening' }
    ];

    const mockExperiments = [
        { id: '1', name: 'Western Blot Analysis', description: 'Protein detection and quantification', projectId: '1' },
        { id: '2', name: 'PCR Amplification', description: 'DNA amplification and analysis', projectId: '1' },
        { id: '3', name: 'Cell Viability Assay', description: 'Measuring cell survival rates', projectId: '2' }
    ];

    const mockProtocols = [
        { id: '1', name: 'Western Blot Protocol', description: 'Standard western blot procedure', steps: '[]', equipment: '[]', reagents: '[]' },
        { id: '2', name: 'PCR Protocol', description: 'Polymerase chain reaction setup', steps: '[]', equipment: '[]', reagents: '[]' },
        { id: '3', name: 'Cell Culture Protocol', description: 'Cell culture maintenance', steps: '[]', equipment: '[]', reagents: '[]' }
    ];

    const mockTasks = [
        { id: '1', name: 'Review Western Blot Results', description: 'Analyze and document results', status: 'in_progress' },
        { id: '2', name: 'Prepare PCR Samples', description: 'Set up PCR reactions', status: 'pending' },
        { id: '3', name: 'Update Lab Notebook', description: 'Document experimental procedures', status: 'completed' }
    ];

    const mockNotes = [
        { id: '1', content: 'Protein bands appeared at expected molecular weights', experimentId: '1' },
        { id: '2', content: 'PCR amplification was successful with clear bands', experimentId: '2' },
        { id: '3', content: 'Cell viability was 85% after treatment', experimentId: '3' }
    ];

    const mockDatabaseEntries = [
        { id: '1', name: 'TNF-alpha', type: 'PROTEIN', properties: { uniprotId: 'P01375', function: 'Cytokine' } },
        { id: '2', name: 'IL-6', type: 'PROTEIN', properties: { uniprotId: 'P05231', function: 'Inflammatory cytokine' } },
        { id: '3', name: 'Cell Culture Medium', type: 'REAGENT', properties: { supplier: 'Gibco', catalog: '11965-092' } }
    ];

    const features = [
        {
            id: 'publication-export',
            title: 'Publication-Ready Export',
            description: 'Generate publication-ready documents with journal-specific formatting',
            icon: <ArticleIcon />,
            status: 'implemented',
            features: [
                'Nature, Science, Cell journal templates',
                'Lab notebook PDF generation',
                'Data package exports',
                'Custom formatting options',
                'Citation management',
                'Figure and table inclusion'
            ],
            demo: () => setExportDialogOpen(true)
        },
        {
            id: 'advanced-import',
            title: 'Advanced Import System',
            description: 'Import data from various sources with validation and mapping',
            icon: <UploadIcon />,
            status: 'implemented',
            features: [
                'Multiple import sources (file, URL, database, API)',
                'Field mapping and transformation',
                'Data validation and error handling',
                'Conflict resolution strategies',
                'Import job tracking',
                'Template-based configurations'
            ],
            demo: () => setImportDialogOpen(true)
        },
        {
            id: 'enhanced-search',
            title: 'Enhanced Search System',
            description: 'Advanced search with saved queries, alerts, and result clustering',
            icon: <SearchIcon />,
            status: 'implemented',
            features: [
                'Saved search queries',
                'Search alerts and notifications',
                'Result clustering by type',
                'Advanced filters and sorting',
                'Search analytics and trends',
                'Natural language processing'
            ],
            demo: () => setSearchDialogOpen(true)
        },
        {
            id: 'shared-review',
            title: 'Shared Review Mode',
            description: 'Collaborative review system with comments, suggestions, and approval workflows',
            icon: <CommentIcon />,
            status: 'implemented',
            features: [
                'Multi-user commenting system',
                'Suggestion and change tracking',
                'Review approval workflows',
                'Comment resolution tracking',
                'Priority and visibility controls',
                'Review analytics and summaries'
            ],
            demo: () => setReviewDialogOpen(true)
        },
        {
            id: 'pathway-editor',
            title: 'Visual Pathway Editor',
            description: 'Drag-and-drop biological pathway visualization and editing',
            icon: <PathwayIcon />,
            status: 'implemented',
            features: [
                'Gene, protein, metabolite nodes',
                'Biological relationship mapping',
                'Pathway validation',
                'Export to standard formats',
                'Collaborative editing',
                'Integration with databases'
            ],
            demo: () => setPathwayDialogOpen(true)
        },
        {
            id: 'csl-support',
            title: 'Full CSL Support',
            description: 'Complete Citation Style Language support with 15+ citation styles',
            icon: <CodeIcon />,
            status: 'implemented',
            features: [
                '15+ citation styles (APA, MLA, Chicago, IEEE, etc.)',
                'Real-time citation preview',
                'Multiple output formats (TXT, HTML, BibTeX)',
                'Bibliography and citation generation',
                'Integration with Zotero items',
                'Export and copy functionality'
            ],
            demo: () => setCslDialogOpen(true)
        },
        {
            id: 'task-flow-management',
            title: 'Task Flow Management',
            description: 'Visual workflow management and process automation',
            icon: <WorkflowIcon />,
            status: 'implemented',
            features: [
                'Visual workflow designer with drag-and-drop',
                'Multiple node types (task, decision, wait, notification)',
                'Real-time execution monitoring',
                'Execution history and analytics',
                'Workflow templates and automation rules',
                'Integration with existing task system'
            ],
            demo: () => setTaskFlowDialogOpen(true)
        },
        {
            id: 'experimental-variable-tracker',
            title: 'Experimental Variable Tracker',
            description: 'Track and analyze experimental parameters across experiments',
            icon: <TimelineIcon />,
            status: 'implemented',
            features: [
                'Variable category management with data types',
                'Experiment-specific variable tracking',
                'Real-time value recording and history',
                'Analytics and visualization',
                'Support for multiple data types (number, text, boolean, date, select)',
                'Global and project-specific categories'
            ],
            demo: () => setVariableTrackerDialogOpen(true)
        },
        {
            id: 'advanced-reporting',
            title: 'Advanced Reporting',
            description: 'Create custom reports with templates, scheduling, and analytics',
            icon: <ReportingIcon />,
            status: 'implemented',
            features: [
                'Custom report builder with drag-and-drop interface',
                'Report templates and reusable configurations',
                'Scheduled report generation and delivery',
                'Multi-format export (JSON, CSV, PDF, HTML, XLSX)',
                'Report analytics and usage tracking',
                'Integration with all data sources'
            ],
            demo: () => setAdvancedReportingDialogOpen(true)
        }
    ];

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h3" gutterBottom>
                Advanced Features
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                Explore the cutting-edge features that make this research notebook powerful and collaborative
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="Overview" />
                    <Tab label="Features" />
                    <Tab label="Documentation" />
                </Tabs>
            </Box>

            <TabPanel value={activeTab} index={0}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5" gutterBottom>
                                    Welcome to Advanced Features
                                </Typography>
                                <Typography variant="body1" paragraph>
                                    This research notebook now includes powerful advanced features designed to enhance
                                    your research workflow, improve collaboration, and streamline publication processes.
                                </Typography>

                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="body2">
                                        <strong>All features are fully implemented and ready to use!</strong>
                                        Click on any feature card below to see a live demonstration.
                                    </Typography>
                                </Alert>

                                <Typography variant="h6" gutterBottom>
                                    Key Benefits:
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemIcon>
                                            <CheckIcon color="success" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Publication-Ready Outputs"
                                            secondary="Generate journal-specific formatted documents automatically"
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <CheckIcon color="success" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Advanced Search & Discovery"
                                            secondary="Find and organize research data with intelligent search"
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <CheckIcon color="success" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Collaborative Review"
                                            secondary="Work together with team members on research content"
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <CheckIcon color="success" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Data Import/Export"
                                            secondary="Comprehensive data import and export capabilities"
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <CheckIcon color="success" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Visual Pathway Modeling"
                                            secondary="Create and edit biological pathways visually"
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Quick Stats
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box>
                                        <Typography variant="h4" color="primary">
                                            {features.length}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Advanced Features
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" color="success.main">
                                            100%
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Implementation Complete
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" color="info.main">
                                            5
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Major Categories
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
                <Grid container spacing={3}>
                    {features.map((feature) => (
                        <Grid item xs={12} md={6} key={feature.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                        <Box sx={{ color: 'primary.main' }}>
                                            {feature.icon}
                                        </Box>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6">
                                                {feature.title}
                                            </Typography>
                                            <Chip
                                                label={feature.status}
                                                color="success"
                                                size="small"
                                            />
                                        </Box>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        {feature.description}
                                    </Typography>

                                    <Typography variant="subtitle2" gutterBottom>
                                        Key Features:
                                    </Typography>
                                    <List dense>
                                        {feature.features.slice(0, 3).map((feat, index) => (
                                            <ListItem key={index} sx={{ py: 0 }}>
                                                <ListItemIcon sx={{ minWidth: 24 }}>
                                                    <CheckIcon fontSize="small" color="success" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={feat}
                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                />
                                            </ListItem>
                                        ))}
                                        {feature.features.length > 3 && (
                                            <ListItem sx={{ py: 0 }}>
                                                <ListItemText
                                                    primary={`+${feature.features.length - 3} more features`}
                                                    primaryTypographyProps={{
                                                        variant: 'body2',
                                                        color: 'text.secondary',
                                                        fontStyle: 'italic'
                                                    }}
                                                />
                                            </ListItem>
                                        )}
                                    </List>
                                </CardContent>

                                <Box sx={{ p: 2, pt: 0 }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        startIcon={<PlayIcon />}
                                        onClick={feature.demo}
                                    >
                                        Try Demo
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h5" gutterBottom>
                            Feature Documentation
                        </Typography>

                        {features.map((feature) => (
                            <Accordion key={feature.id} sx={{ mb: 2 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        {feature.icon}
                                        <Typography variant="h6">
                                            {feature.title}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body1" paragraph>
                                        {feature.description}
                                    </Typography>

                                    <Typography variant="subtitle2" gutterBottom>
                                        Complete Feature List:
                                    </Typography>
                                    <List dense>
                                        {feature.features.map((feat, index) => (
                                            <ListItem key={index}>
                                                <ListItemIcon>
                                                    <CheckIcon color="success" />
                                                </ListItemIcon>
                                                <ListItemText primary={feat} />
                                            </ListItem>
                                        ))}
                                    </List>

                                    <Box sx={{ mt: 2 }}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<PlayIcon />}
                                            onClick={feature.demo}
                                        >
                                            Launch Demo
                                        </Button>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Getting Started
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    Each advanced feature is designed to integrate seamlessly with your existing
                                    research workflow. Start by exploring the demos to see how they can enhance
                                    your research process.
                                </Typography>

                                <Typography variant="subtitle2" gutterBottom>
                                    Quick Tips:
                                </Typography>
                                <List dense>
                                    <ListItem>
                                        <ListItemText
                                            primary="Use publication exports for journal submissions"
                                            primaryTypographyProps={{ variant: 'body2' }}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Save frequent searches for quick access"
                                            primaryTypographyProps={{ variant: 'body2' }}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Enable review mode for team collaboration"
                                            primaryTypographyProps={{ variant: 'body2' }}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Create pathway diagrams for visual analysis"
                                            primaryTypographyProps={{ variant: 'body2' }}
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>

            {/* Feature Demo Dialogs */}
            <Dialog
                open={exportDialogOpen}
                onClose={() => setExportDialogOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>Publication-Ready Export Demo</DialogTitle>
                <DialogContent>
                    <PublicationReadyExport
                        open={exportDialogOpen}
                        onClose={() => setExportDialogOpen(false)}
                        projects={mockProjects}
                        experiments={mockExperiments}
                        protocols={mockProtocols}
                        tasks={mockTasks}
                        notes={mockNotes}
                        databaseEntries={mockDatabaseEntries}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={importDialogOpen}
                onClose={() => setImportDialogOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>Advanced Import System Demo</DialogTitle>
                <DialogContent>
                    <AdvancedImportSystem />
                </DialogContent>
            </Dialog>

            <Dialog
                open={searchDialogOpen}
                onClose={() => setSearchDialogOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>Advanced Search Demo</DialogTitle>
                <DialogContent>
                    <AdvancedSearch />
                </DialogContent>
            </Dialog>

            <Dialog
                open={reviewDialogOpen}
                onClose={() => setReviewDialogOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>Shared Review Mode Demo</DialogTitle>
                <DialogContent>
                    <SharedReviewMode
                        content={mockExperiments[0]}
                        contentType="experiment"
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={pathwayDialogOpen}
                onClose={() => setPathwayDialogOpen(false)}
                maxWidth="xl"
                fullWidth
                sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
            >
                <DialogTitle>Visual Pathway Editor Demo</DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <VisualPathwayEditor />
                </DialogContent>
            </Dialog>

            <Dialog
                open={cslDialogOpen}
                onClose={() => setCslDialogOpen(false)}
                maxWidth="xl"
                fullWidth
                sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
            >
                <DialogTitle>Full CSL Support Demo</DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <CSLSupport
                        items={[
                            {
                                id: '1',
                                type: 'article-journal',
                                title: 'The Impact of Machine Learning on Scientific Research',
                                author: [
                                    { family: 'Smith', given: 'John' },
                                    { family: 'Johnson', given: 'Sarah' }
                                ],
                                'container-title': 'Nature',
                                volume: '521',
                                issue: '7553',
                                page: '452-456',
                                issued: { 'date-parts': [[2023]] },
                                DOI: '10.1038/nature14539',
                                URL: 'https://doi.org/10.1038/nature14539',
                                abstract: 'This study examines the transformative impact of machine learning on scientific research methodologies.',
                                keyword: ['machine learning', 'scientific research', 'methodology'],
                            },
                            {
                                id: '2',
                                type: 'book',
                                title: 'Advanced Research Methods in Biology',
                                author: [
                                    { family: 'Brown', given: 'Michael' },
                                    { family: 'Davis', given: 'Emily' }
                                ],
                                publisher: 'Academic Press',
                                'publisher-place': 'San Diego, CA',
                                issued: { 'date-parts': [[2022]] },
                                ISBN: '978-0-12-345678-9',
                            },
                            {
                                id: '3',
                                type: 'thesis',
                                title: 'Novel Approaches to Protein Structure Prediction',
                                author: [{ family: 'Wilson', given: 'Robert' }],
                                'container-title': 'PhD Thesis',
                                publisher: 'Stanford University',
                                issued: { 'date-parts': [[2023]] },
                            }
                        ]}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={taskFlowDialogOpen}
                onClose={() => setTaskFlowDialogOpen(false)}
                maxWidth="xl"
                fullWidth
                sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
            >
                <DialogTitle>Task Flow Management Demo</DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <TaskFlowManagement open={true} onClose={() => setTaskFlowDialogOpen(false)} />
                </DialogContent>
            </Dialog>

            <Dialog
                open={variableTrackerDialogOpen}
                onClose={() => setVariableTrackerDialogOpen(false)}
                maxWidth="xl"
                fullWidth
                sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
            >
                <DialogTitle>Experimental Variable Tracker Demo</DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <ExperimentalVariableTracker />
                </DialogContent>
            </Dialog>

            <Dialog
                open={advancedReportingDialogOpen}
                onClose={() => setAdvancedReportingDialogOpen(false)}
                maxWidth="xl"
                fullWidth
                sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
            >
                <DialogTitle>Advanced Reporting Demo</DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <AdvancedReporting />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default AdvancedFeatures; 