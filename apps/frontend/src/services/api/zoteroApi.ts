import { apiClient } from './apiClient';

export const zoteroApi = {
    sync: () => apiClient.post('/zotero/sync'),
    getItems: (params?: any) => apiClient.get('/zotero/items', params),
    getItem: (id: string) => apiClient.get(`/zotero/items/${id}`),
    createNote: (itemId: string, data: any) => apiClient.post(`/zotero/items/${itemId}/notes`, data),
    getCollections: () => apiClient.get('/zotero/collections'),
}; 