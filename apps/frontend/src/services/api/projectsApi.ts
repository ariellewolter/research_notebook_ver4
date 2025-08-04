import api from './apiClient';
import { Project, ProjectParams, ProjectCreateData, ProjectUpdateData, Experiment, ExperimentCreateData, ExperimentUpdateData, SearchParams } from '../../types/api';

export const projectsApi = {
    getAll: (params?: ProjectParams) => api.get<Project[]>('/projects', { params }),
    getById: (id: string) => api.get<Project>(`/projects/${id}`),
    create: (data: ProjectCreateData) => api.post<Project>('/projects', data),
    update: (id: string, data: ProjectUpdateData) => api.put<Project>(`/projects/${id}`, data),
    delete: (id: string) => api.delete(`/projects/${id}`),
    getExperiments: (projectId: string) => api.get<Experiment[]>(`/projects/${projectId}/experiments`),
    getAllExperiments: () => api.get<Experiment[]>('/projects/experiments/all'),
    createExperiment: (projectId: string, data: ExperimentCreateData) =>
        api.post<Experiment>(`/projects/${projectId}/experiments`, data),
    updateExperiment: (id: string, data: ExperimentUpdateData) =>
        api.put<Experiment>(`/projects/experiments/${id}`, data),
    deleteExperiment: (id: string) => api.delete(`/projects/experiments/${id}`),
    getExperimentExecutions: (experimentId: string) => api.get(`/projects/experiments/${experimentId}/executions`),
    getStats: () => api.get('/projects/stats'),
    search: (query: string, params?: SearchParams) => api.get<Project[]>(`/projects/search/${query}`, { params }),
}; 