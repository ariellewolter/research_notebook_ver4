import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    Stack,
} from '@mui/material';
import {
    Add as AddIcon,
    CloudUpload as ImportIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import ColorLegend from '../components/Legend/ColorLegend';
import ImportExportDialog from '../components/ImportExportDialog';
import ExportModal from '../components/ExportModal';
import { exportService, ExportOptions } from '../services/exportService';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { projectsApi } from '../services/api';
import { ZoteroItem } from '../types/zotero';

// Import refactored components
import ProjectForm from '../components/Projects/ProjectForm';
import ExperimentForm from '../components/Projects/ExperimentForm';
import ProjectCard from '../components/Projects/ProjectCard';
import ProjectFilters from '../components/Projects/ProjectFilters';

// Import custom hooks
import { useProjectOperations } from '../hooks/useProjectOperations';
import { Project, Experiment } from '../types/project';

const Projects: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    console.log('Projects component rendered, location:', location.pathname);

    // Use custom hook for project operations
    const {
        projects,
        filteredProjects,
        loading,
        error,
        saving,
        statusTab,
        snackbar,
        setStatusTab,
        loadProjects,
        createProject,
        updateProject,
        deleteProject,
        createExperiment,
        updateExperiment,
        deleteExperiment,
        closeSnackbar,
    } = useProjectOperations();

    // Local state for dialogs
    const [openProjectDialog, setOpenProjectDialog] = useState(false);
    const [openExperimentDialog, setOpenExperimentDialog] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editingExperiment, setEditingExperiment] = useState<Experiment | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    // Import/Export state
    const [openImportDialog, setOpenImportDialog] = useState(false);
    const [openExportModal, setOpenExportModal] = useState(false);
    const [selectedImportItems, setSelectedImportItems] = useState<ZoteroItem[]>([]);

    // Auto-open new project dialog when on /projects/new route
    useEffect(() => {
        if (location.pathname === '/projects/new') {
            console.log('Auto-opening new project dialog for path:', location.pathname);
            handleOpenProjectDialog();
        }
    }, [location.pathname]);

    const handleOpenProjectDialog = async (project?: Project) => {
        const today = new Date().toISOString();
        if (project) {
            try {
                await projectsApi.update(project.id, { lastActivity: today });
                await loadProjects();
            } catch (err) { }
            setEditingProject({ ...project, lastActivity: today });
        } else {
            setEditingProject(null);
        }
        setOpenProjectDialog(true);
        console.log('Project dialog opened, editingProject:', editingProject);
    };

    const handleCloseProjectDialog = () => {
        console.log('Closing project dialog');
        setOpenProjectDialog(false);
        setEditingProject(null);
        // If we're on the /projects/new route, navigate back to /projects
        if (location.pathname === '/projects/new') {
            navigate('/projects');
        }
    };

    const handleSaveProject = async (projectData: any) => {
        if (editingProject) {
            await updateProject(editingProject.id, projectData);
        } else {
            await createProject(projectData);
        }
        handleCloseProjectDialog();
    };

    const handleOpenExperimentDialog = (projectId: string, experiment?: Experiment) => {
        setSelectedProjectId(projectId);
        if (experiment) {
            setEditingExperiment(experiment);
        } else {
            setEditingExperiment(null);
        }
        setOpenExperimentDialog(true);
    };

    const handleCloseExperimentDialog = () => {
        setOpenExperimentDialog(false);
        setEditingExperiment(null);
        setSelectedProjectId(null);
    };

    const handleSaveExperiment = async (experimentData: any) => {
        if (!selectedProjectId) {
            throw new Error('No project selected');
        }

        if (editingExperiment) {
            await updateExperiment(editingExperiment.id, experimentData);
        } else {
            await createExperiment(selectedProjectId, experimentData);
        }
        handleCloseExperimentDialog();
    };

    const handleImport = async (rows: any[]) => {
        for (const row of rows) {
            await projectsApi.create(row);
        }
        await loadProjects();
        // Use the snackbar from the hook
        // Note: This would need to be handled differently in a real implementation
    };

    const handleExport = (format: 'csv' | 'json' | 'xlsx') => {
        const data = projects.map(project => ({
            name: project.name,
            description: project.description,
            status: project.status,
            startDate: project.startDate,
            lastActivity: project.lastActivity,
            createdAt: project.createdAt
        }));

        if (format === 'csv') {
            const csv = Papa.unparse(data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, `projects_export_${new Date().toISOString().split('T')[0]}.csv`);
        } else if (format === 'json') {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
            saveAs(blob, `projects_export_${new Date().toISOString().split('T')[0]}.json`);
        } else if (format === 'xlsx') {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `projects_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        }
    };

    const handleExportWithModal = async (format: string, options: string[], filename?: string) => {
        try {
            // Prepare export data
            const exportData = {
                projects: projects,
                experiments: projects.flatMap(project => project.experiments || [])
            };

            // Prepare export options
            const exportOptions: ExportOptions = {
                includeMetadata: options.includes('includeMetadata'),
                includeRelationships: options.includes('includeRelationships'),
                includeNotes: options.includes('includeNotes'),
                includeFiles: options.includes('includeFiles')
            };

            // Perform export
            await exportService.exportData(format, exportData, exportOptions, filename || 'projects_export');
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    console.log('Projects component rendering, loading:', loading, 'projects count:', projects.length);

    // Simple fallback to ensure component always renders
    if (!loading && projects.length === 0 && location.pathname === '/projects/new') {
        console.log('Rendering new project view');
        return (
            <Box sx={{ p: 3, minHeight: '100vh' }}>
                <Typography variant="h4" sx={{ mb: 2 }}>Create New Project</Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                    Loading project creation form...
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenProjectDialog()}
                >
                    Open Project Dialog
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, minHeight: '100vh' }}>
            <ColorLegend types={['project', 'experiment']} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Projects</Typography>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<ImportIcon />}
                        onClick={() => setOpenImportDialog(true)}
                    >
                        Import
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => setOpenExportModal(true)}
                    >
                        Export
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenProjectDialog()}
                    >
                        New Project
                    </Button>
                </Stack>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {projects.length === 0 && !loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No projects yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create your first project to get started
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenProjectDialog()}
                        sx={{ mt: 2 }}
                    >
                        Create First Project
                    </Button>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    <ProjectFilters
                        statusTab={statusTab}
                        onStatusChange={setStatusTab}
                    />
                    {filteredProjects.map((project) => (
                        <Grid item xs={12} key={project.id}>
                            <ProjectCard
                                project={project}
                                onEdit={handleOpenProjectDialog}
                                onDelete={deleteProject}
                                onAddExperiment={handleOpenExperimentDialog}
                                onEditExperiment={handleOpenExperimentDialog}
                                onDeleteExperiment={deleteExperiment}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Project Form Dialog */}
            <ProjectForm
                open={openProjectDialog}
                onClose={handleCloseProjectDialog}
                project={editingProject}
                onSave={handleSaveProject}
                saving={saving}
            />

            {/* Experiment Form Dialog */}
            <ExperimentForm
                open={openExperimentDialog}
                onClose={handleCloseExperimentDialog}
                experiment={editingExperiment}
                projectId={selectedProjectId || ''}
                onSave={handleSaveExperiment}
                saving={saving}
            />

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={closeSnackbar}
            >
                <Alert
                    onClose={closeSnackbar}
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Import/Export Dialog */}
            <ImportExportDialog
                open={openImportDialog}
                onClose={() => setOpenImportDialog(false)}
                entityType="projects"
                fields={[
                    { key: 'name', label: 'Name' },
                    { key: 'description', label: 'Description' },
                    { key: 'status', label: 'Status' },
                    { key: 'startDate', label: 'Start Date' }
                ]}
                onImport={handleImport}
                onExport={handleExport}
                data={projects}
            />

            {/* Export Modal */}
            <ExportModal
                open={openExportModal}
                onClose={() => setOpenExportModal(false)}
                title="Projects"
                data={{
                    projects: projects,
                    experiments: projects.flatMap(project => project.experiments || [])
                }}
                onExport={handleExportWithModal}
            />
        </Box>
    );
};

export default Projects; 