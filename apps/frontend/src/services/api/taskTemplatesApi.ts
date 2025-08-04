import api from './apiClient';

export const taskTemplatesApi = {
    getAll: () => api.get('/task-templates'),
    getById: (id: string) => api.get(`/task-templates/${id}`),
    create: (data: any) => api.post('/task-templates', data),
    update: (id: string, data: any) => api.put(`/task-templates/${id}`, data),
    delete: (id: string) => api.delete(`/task-templates/${id}`),
    getStats: () => api.get('/task-templates/stats/analytics'),
    createTaskFromTemplate: (templateId: string, data: {
        projectId: string;
        experimentId?: string;
        protocolId?: string;
        noteId?: string;
        deadline?: string;
        customTitle?: string;
        variables?: Record<string, string>;
    }) => api.post(`/task-templates/${templateId}/create-task`, data),
}; 