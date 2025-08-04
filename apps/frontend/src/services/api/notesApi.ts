import api from './apiClient';

export const notesApi = {
    getAll: (params?: { type?: string; experimentId?: string; page?: number; limit?: number }) =>
        api.get('/notes', { params }),
    getById: (id: string) => api.get(`/notes/${id}`),
    create: (data: { title: string; content: string; type: string; date?: string; experimentId?: string }) =>
        api.post('/notes', data),
    update: (id: string, data: { title?: string; content?: string; date?: string; experimentId?: string }) =>
        api.put(`/notes/${id}`, data),
    delete: (id: string) => api.delete(`/notes/${id}`),
}; 