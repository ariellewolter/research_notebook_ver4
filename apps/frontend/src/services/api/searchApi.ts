import api from './apiClient';

export const searchApi = {
    advanced: (params: {
        query?: string;
        types?: string[];
        dateRange?: {
            startDate?: Date | null;
            endDate?: Date | null;
        };
        status?: string[];
        priority?: string[];
        tags?: string[];
        categories?: string[];
        authors?: string[];
        projects?: string[];
        sortBy?: 'relevance' | 'date' | 'name' | 'type' | 'priority' | 'status';
        sortOrder?: 'asc' | 'desc';
        limit?: number;
        includeArchived?: boolean;
        exactMatch?: boolean;
        caseSensitive?: boolean;
    }) => api.post('/search/advanced', params),
    save: (data: { name: string; description?: string; searchQuery: any }) =>
        api.post('/search/save', data),
    getSaved: () => api.get('/search/saved'),
    deleteSaved: (id: string) => api.delete(`/search/saved/${id}`),
    getHistory: (limit?: number) => api.get('/search/history', { params: { limit } }),
    clearHistory: () => api.delete('/search/history'),
    getSuggestions: (query: string) => api.get('/search/suggestions', { params: { q: query } }),
    getSearchAnalytics: (period?: string) => api.get('/search/analytics', { params: { period } }),
    saveSearchHistory: (data: { query: string; filters: any; timestamp: string }) =>
        api.post('/search/history', data),
}; 