import api from './apiClient';
import { Table, TableCreateData, TableUpdateData } from '../../types/api';

export const tablesApi = {
    getAll: (params?: { experimentId?: string; page?: number; limit?: number }) =>
        api.get('/tables', { params }),
    getById: (id: string) => api.get(`/tables/${id}`),
    create: (data: {
        name: string;
        description?: string;
        experimentId?: string;
        columns: Array<{
            id: string;
            name: string;
            type: 'text' | 'number' | 'date' | 'boolean' | 'select';
            required?: boolean;
            options?: string[];
            defaultValue?: any;
        }>;
    }) => api.post('/tables', data),
    update: (id: string, data: {
        name?: string;
        description?: string;
        columns?: Array<{
            id: string;
            name: string;
            type: 'text' | 'number' | 'date' | 'boolean' | 'select';
            required?: boolean;
            options?: string[];
            defaultValue?: any;
        }>;
    }) => api.put(`/tables/${id}`, data),
    delete: (id: string) => api.delete(`/tables/${id}`),
    search: (query: string, params?: { experimentId?: string }) =>
        api.get(`/tables/search/${query}`, { params }),
    getStats: () => api.get('/tables/stats/overview'),
    addRow: (tableId: string, data: { data: Record<string, any> }) =>
        api.post(`/tables/${tableId}/rows`, data),
    updateRow: (tableId: string, rowId: string, data: { data: Record<string, any> }) =>
        api.put(`/tables/${tableId}/rows/${rowId}`, data),
    deleteRow: (tableId: string, rowId: string) =>
        api.delete(`/tables/${tableId}/rows/${rowId}`),
    addBulkRows: (tableId: string, data: { rows: Record<string, any>[] }) =>
        api.post(`/tables/${tableId}/rows/bulk`, data),
}; 