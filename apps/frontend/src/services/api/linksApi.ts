import api from './apiClient';

export const linksApi = {
    getAll: (params?: { sourceType?: string; sourceId?: string; targetType?: string; targetId?: string }) =>
        api.get('/links', { params }),
    getBacklinks: (type: string, id: string) => api.get(`/links/backlinks/${type}/${id}`),
    getOutgoing: (type: string, id: string) => api.get(`/links/outgoing/${type}/${id}`),
    create: (data: { sourceType: string; sourceId: string; targetType: string; targetId: string }) =>
        api.post('/links', data),
    delete: (id: string) => api.delete(`/links/${id}`),
    getGraph: (params?: { limit?: number }) => api.get('/links/graph', { params }),
    search: (query: string, params?: { type?: string; limit?: number }) =>
        api.get(`/links/search/${query}`, { params }),
}; 