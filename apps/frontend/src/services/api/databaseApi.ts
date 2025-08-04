import api from './apiClient';
import { DatabaseEntry, DatabaseEntryCreateData, DatabaseEntryUpdateData } from '../../types/api';

export const databaseApi = {
    getAll: (params?: { type?: string; page?: number; limit?: number }) =>
        api.get('/database', { params }),
    getByType: (type: string, params?: { page?: number; limit?: number }) =>
        api.get(`/database/type/${type}`, { params }),
    getById: (id: string) => api.get(`/database/${id}`),
    create: (data: {
        type: string;
        name: string;
        description?: string;
        properties?: string;
        metadata?: {
            molecularWeight?: string;
            concentration?: string;
            storage?: string;
            supplier?: string;
            catalogNumber?: string;
            purity?: string;
            sequence?: string;
            organism?: string;
            function?: string;
            protocol?: string;
            equipment?: string;
            duration?: string;
            temperature?: string;
            pH?: string;
        };
    }) => api.post('/database', data),
    update: (id: string, data: {
        name?: string;
        description?: string;
        properties?: string;
        metadata?: {
            molecularWeight?: string;
            concentration?: string;
            storage?: string;
            supplier?: string;
            catalogNumber?: string;
            purity?: string;
            sequence?: string;
            organism?: string;
            function?: string;
            protocol?: string;
            equipment?: string;
            duration?: string;
            temperature?: string;
            pH?: string;
        };
    }) => api.put(`/database/${id}`, data),
    delete: (id: string) => api.delete(`/database/${id}`),
    search: (query: string, params?: { type?: string; page?: number; limit?: number }) =>
        api.get(`/database/search/${query}`, { params }),
    getStats: () => api.get('/database/stats/overview'),
    createLink: (id: string, data: { targetType: string; targetId: string }) =>
        api.post(`/database/${id}/links`, data),
}; 