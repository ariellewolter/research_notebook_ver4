import { apiClient } from './apiClient';

export const zoteroApi = {
    sync: () => apiClient.post('/zotero/sync'),
    getItems: (params?: any) => apiClient.get('/zotero/items', params),
    getItem: (id: string) => apiClient.get(`/zotero/items/${id}`),
    createNote: (itemId: string, data: any) => apiClient.post(`/zotero/items/${itemId}/notes`, data),
    getCollections: () => apiClient.get('/zotero/collections'),
    getSyncStatus: () => apiClient.get('/zotero/sync/status'),
    getBackgroundSyncStatus: () => apiClient.get('/zotero/sync/background/status'),
    configureBackgroundSync: (data: { enabled: boolean; intervalMinutes: number }) =>
        apiClient.post('/zotero/sync/background', data),
}; 