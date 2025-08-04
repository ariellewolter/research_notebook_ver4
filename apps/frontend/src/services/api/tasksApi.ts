import { apiClient } from './apiClient';

export const tasksApi = {
    getAll: (params?: any) => apiClient.get('/tasks', params),
    getById: (id: string) => apiClient.get(`/tasks/${id}`),
    create: (data: any) => apiClient.post('/tasks', data),
    update: (id: string, data: any) => apiClient.put(`/tasks/${id}`, data),
    delete: (id: string) => apiClient.delete(`/tasks/${id}`),
    getDependencies: (id: string) => apiClient.get(`/tasks/${id}/dependencies`),
}; 