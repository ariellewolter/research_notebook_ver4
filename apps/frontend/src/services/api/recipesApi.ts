import { apiClient } from './apiClient';

export const recipesApi = {
    getAll: (params?: any) => apiClient.get('/recipes', params),
    getById: (id: string) => apiClient.get(`/recipes/${id}`),
    create: (data: any) => apiClient.post('/recipes', data),
    update: (id: string, data: any) => apiClient.put(`/recipes/${id}`, data),
    delete: (id: string) => apiClient.delete(`/recipes/${id}`),
    execute: (id: string, data: any) => apiClient.post(`/recipes/${id}/execute`, data),
}; 