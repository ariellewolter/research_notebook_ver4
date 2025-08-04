import api from './apiClient';
import { PDF, PDFCreateData, Highlight, HighlightCreateData } from '../../types/api';

export const pdfsApi = {
    getAll: (params?: { page?: number; limit?: number }) =>
        api.get('/pdfs', { params }),
    getById: (id: string) => api.get(`/pdfs/${id}`),
    upload: (file: File, title: string) => {
        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('title', title);
        return api.post('/pdfs', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    create: (data: { title: string }) => api.post('/pdfs', data),
    delete: (id: string) => api.delete(`/pdfs/${id}`),
    getFile: (id: string) => api.get(`/pdfs/${id}/file`),
    getHighlights: (pdfId: string) => api.get(`/pdfs/${pdfId}/highlights`),
    createHighlight: (pdfId: string, data: { page: number; text: string; coords?: string }) =>
        api.post(`/pdfs/${pdfId}/highlights`, data),
    updateHighlight: (id: string, data: { text?: string; coords?: string }) =>
        api.put(`/pdfs/highlights/${id}`, data),
    deleteHighlight: (id: string) => api.delete(`/pdfs/highlights/${id}`),
}; 