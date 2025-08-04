import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { projectsApi } from '../services/api';
import { Project, ProjectStatus } from '../types/project';

export const useProjectOperations = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [statusTab, setStatusTab] = useState<ProjectStatus>('active');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Load projects on component mount
    useEffect(() => {
        loadProjects();
    }, []);

    // Filter projects by status
    useEffect(() => {
        setFilteredProjects(projects.filter(p => p.status === statusTab));
    }, [projects, statusTab]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const response = await projectsApi.getAll();
            setProjects(response.data || []);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load projects');
            console.error('Error loading projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const createProject = async (projectData: any) => {
        try {
            setSaving(true);
            await projectsApi.create(projectData);
            setSnackbar({
                open: true,
                message: 'Project created successfully',
                severity: 'success',
            });
            await loadProjects();
            // Navigate back to projects list after successful creation
            navigate('/projects');
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to save project',
                severity: 'error',
            });
            throw err;
        } finally {
            setSaving(false);
        }
    };

    const updateProject = async (projectId: string, projectData: any) => {
        try {
            setSaving(true);
            await projectsApi.update(projectId, projectData);
            setSnackbar({
                open: true,
                message: 'Project updated successfully',
                severity: 'success',
            });
            await loadProjects();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to save project',
                severity: 'error',
            });
            throw err;
        } finally {
            setSaving(false);
        }
    };

    const deleteProject = async (projectId: string) => {
        if (!window.confirm('Are you sure you want to delete this project? This will also delete all associated experiments.')) {
            return;
        }

        try {
            await projectsApi.delete(projectId);
            setSnackbar({
                open: true,
                message: 'Project deleted successfully',
                severity: 'success',
            });
            await loadProjects();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to delete project',
                severity: 'error',
            });
            console.error('Error deleting project:', err);
        }
    };

    const createExperiment = async (projectId: string, experimentData: any) => {
        try {
            setSaving(true);
            await projectsApi.createExperiment(projectId, experimentData);
            setSnackbar({
                open: true,
                message: 'Experiment created successfully',
                severity: 'success',
            });
            await loadProjects();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to save experiment',
                severity: 'error',
            });
            throw err;
        } finally {
            setSaving(false);
        }
    };

    const updateExperiment = async (experimentId: string, experimentData: any) => {
        try {
            setSaving(true);
            await projectsApi.updateExperiment(experimentId, experimentData);
            setSnackbar({
                open: true,
                message: 'Experiment updated successfully',
                severity: 'success',
            });
            await loadProjects();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to save experiment',
                severity: 'error',
            });
            throw err;
        } finally {
            setSaving(false);
        }
    };

    const deleteExperiment = async (experimentId: string) => {
        if (!window.confirm('Are you sure you want to delete this experiment?')) {
            return;
        }

        try {
            await projectsApi.deleteExperiment(experimentId);
            setSnackbar({
                open: true,
                message: 'Experiment deleted successfully',
                severity: 'success',
            });
            await loadProjects();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to delete experiment',
                severity: 'error',
            });
            console.error('Error deleting experiment:', err);
        }
    };

    const closeSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return {
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
    };
}; 