import { useState, useEffect, useCallback } from 'react';
import { projectsApi } from '../../services/api';
import { Project, ProjectWithExperiments, CreateProjectData, UpdateProjectData } from '../../types/project.types';

interface UseProjectsOptions {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    autoFetch?: boolean;
}

interface UseProjectsReturn {
    projects: Project[];
    project: ProjectWithExperiments | null;
    loading: boolean;
    error: string | null;
    total: number;
    pagination: {
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    stats: {
        total: number;
        byStatus: Record<string, number>;
        recent: Project[];
    } | null;
    fetchProjects: (options?: UseProjectsOptions) => Promise<void>;
    fetchProject: (id: string) => Promise<void>;
    createProject: (data: CreateProjectData) => Promise<Project>;
    updateProject: (id: string, data: UpdateProjectData) => Promise<Project>;
    deleteProject: (id: string) => Promise<void>;
    fetchStats: () => Promise<void>;
    clearError: () => void;
}

export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
    const [projects, setProjects] = useState<Project[]>([]);
    const [project, setProject] = useState<ProjectWithExperiments | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
    });
    const [stats, setStats] = useState<{
        total: number;
        byStatus: Record<string, number>;
        recent: Project[];
    } | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const fetchProjects = useCallback(async (fetchOptions?: UseProjectsOptions) => {
        try {
            setLoading(true);
            setError(null);
            
            const params = { ...options, ...fetchOptions };
            const response = await projectsApi.getAll(params);
            
            if (response.data) {
                setProjects(response.data.projects || response.data.data || []);
                setTotal(response.data.total);
                setPagination(response.data.pagination);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    }, [options]);

    const fetchProject = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await projectsApi.getById(id);
            setProject(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch project');
        } finally {
            setLoading(false);
        }
    }, []);

    const createProject = useCallback(async (data: CreateProjectData): Promise<Project> => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await projectsApi.create(data);
            const newProject = response.data;
            
            // Add to projects list
            setProjects(prev => [newProject, ...prev]);
            
            return newProject;
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to create project';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateProject = useCallback(async (id: string, data: UpdateProjectData): Promise<Project> => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await projectsApi.update(id, data);
            const updatedProject = response.data;
            
            // Update in projects list
            setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
            
            // Update single project if it's the current one
            if (project?.id === id) {
                setProject(prev => prev ? { ...prev, ...updatedProject } : null);
            }
            
            return updatedProject;
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to update project';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [project]);

    const deleteProject = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            
            await projectsApi.delete(id);
            
            // Remove from projects list
            setProjects(prev => prev.filter(p => p.id !== id));
            
            // Clear single project if it's the current one
            if (project?.id === id) {
                setProject(null);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to delete project');
        } finally {
            setLoading(false);
        }
    }, [project]);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await projectsApi.getStats();
            setStats(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch stats');
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-fetch on mount if enabled
    useEffect(() => {
        if (options.autoFetch !== false) {
            fetchProjects();
        }
    }, [fetchProjects, options.autoFetch]);

    return {
        projects,
        project,
        loading,
        error,
        total,
        pagination,
        stats,
        fetchProjects,
        fetchProject,
        createProject,
        updateProject,
        deleteProject,
        fetchStats,
        clearError,
    };
} 