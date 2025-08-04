import { apiClient } from './apiClient';
import { 
    Project, 
    ProjectWithExperiments, 
    CreateProjectData, 
    UpdateProjectData,
    PaginatedResponse 
} from '../../types/project.types';

export const projectsApi = {
    getAll: (params?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }) => apiClient.get<PaginatedResponse<Project>>('/projects', params),

    getById: (id: string) => 
        apiClient.get<ProjectWithExperiments>(`/projects/${id}`),

    create: (data: CreateProjectData) => 
        apiClient.post<Project>('/projects', data),

    update: (id: string, data: UpdateProjectData) => 
        apiClient.put<Project>(`/projects/${id}`, data),

    delete: (id: string) => 
        apiClient.delete(`/projects/${id}`),

    getStats: () => 
        apiClient.get<{
            total: number;
            byStatus: Record<string, number>;
            recent: Project[];
        }>('/projects/stats'),

    // Experiment methods
    createExperiment: (projectId: string, data: any) =>
        apiClient.post(`/projects/${projectId}/experiments`, data),

    updateExperiment: (projectId: string, experimentId: string, data: any) =>
        apiClient.put(`/projects/${projectId}/experiments/${experimentId}`, data),

    deleteExperiment: (projectId: string, experimentId: string) =>
        apiClient.delete(`/projects/${projectId}/experiments/${experimentId}`),
}; 