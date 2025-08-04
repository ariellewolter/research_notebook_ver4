import api from './apiClient';

export const zoteroApi = {
    configure: (data: { apiKey: string; userId: string; groupId?: string }) =>
        api.post('/zotero/config', data),
    getItems: (params?: { limit?: number; offset?: number; collection?: string }) =>
        api.get('/zotero/items', { params }),
    getItem: (key: string) => api.get(`/zotero/items/${key}`),
    sync: () => api.post('/zotero/sync'),
    getSyncStatus: () => api.get('/zotero/sync/status'),
    configureBackgroundSync: (data: { enabled: boolean; intervalMinutes: number }) =>
        api.post('/zotero/sync/background', data),
    getBackgroundSyncStatus: () => api.get('/zotero/sync/background/status'),
    importItem: (key: string) => api.post(`/zotero/import-item/${key}`),
    import: (file: File, data: { zoteroKey: string; title: string; authors?: string[]; abstract?: string; publicationYear?: number; journal?: string; doi?: string; url?: string; tags?: string[] }) => {
        const formData = new FormData();
        formData.append('pdf', file);
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                if (Array.isArray(value)) {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, value.toString());
                }
            }
        });
        return api.post('/zotero/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    search: (query: string, params?: { limit?: number }) =>
        api.get(`/zotero/search/${query}`, { params }),
    getCollections: () => api.get('/zotero/collections'),
    getCollectionItems: (key: string, params?: { limit?: number; offset?: number }) =>
        api.get(`/zotero/collections/${key}/items`, { params }),
    syncHighlights: (pdfId: string, data: { zoteroKey: string }) =>
        api.post(`/zotero/sync-highlights/${pdfId}`, data),
}; 