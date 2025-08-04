import { apiClient } from './apiClient';

export const pdfsApi = {
    getAll: (params?: any) => apiClient.get('/pdfs', params),
    getById: (id: string) => apiClient.get(`/pdfs/${id}`),
    upload: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post('/pdfs/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    delete: (id: string) => apiClient.delete(`/pdfs/${id}`),
}; 