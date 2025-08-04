import api from './apiClient';

export const protocolsApi = {
    getAll: (params?: { category?: string; page?: number; limit?: number }) =>
        api.get('/protocols', { params }),
    getByCategory: (category: string, params?: { page?: number; limit?: number }) =>
        api.get(`/protocols/category/${category}`, { params }),
    getById: (id: string) => api.get(`/protocols/${id}`),
    create: (data: any) => api.post('/protocols', data),
    update: (id: string, data: any) => api.put(`/protocols/${id}`, data),
    delete: (id: string) => api.delete(`/protocols/${id}`),
    search: (query: string, params?: { category?: string }) =>
        api.get(`/protocols/search/${query}`, { params }),
    getStats: () => api.get('/protocols/stats/overview'),
    createExecution: (protocolId: string, data: any) => api.post(`/protocols/${protocolId}/executions`, data),
    updateExecution: (protocolId: string, executionId: string, data: any) => 
        api.put(`/protocols/${protocolId}/executions/${executionId}`, data),
    deleteExecution: (protocolId: string, executionId: string) =>
        api.delete(`/protocols/${protocolId}/executions/${executionId}`),
}; 