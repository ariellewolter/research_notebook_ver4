import { apiClient } from './apiClient';

export const databaseApi = {
    getAll: (params?: any) => apiClient.get('/database', params),
    getById: (id: string) => apiClient.get(`/database/${id}`),
    create: (data: any) => apiClient.post('/database', data),
    update: (id: string, data: any) => apiClient.put(`/database/${id}`, data),
    delete: (id: string) => apiClient.delete(`/database/${id}`),
    search: (query: string) => apiClient.get(`/database/search/${query}`),
}; 