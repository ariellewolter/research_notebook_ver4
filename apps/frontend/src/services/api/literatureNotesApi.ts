import api from './apiClient';

export const literatureNotesApi = {
    getAll: () => api.get('/literature-notes'),
    getById: (id: string) => api.get(`/literature-notes/${id}`),
    create: (data: any) => api.post('/literature-notes', data),
    update: (id: string, data: any) => api.put(`/literature-notes/${id}`, data),
    delete: (id: string) => api.delete(`/literature-notes/${id}`),
}; 