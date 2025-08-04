import { apiClient } from './apiClient';
import { Note, CreateNoteData, UpdateNoteData } from '../../types/note.types';

export const notesApi = {
    getAll: (params?: {
        page?: number;
        limit?: number;
        type?: string;
        search?: string;
        dateFrom?: string;
        dateTo?: string;
    }) => apiClient.get<Note[]>('/notes', params),

    getById: (id: string) => 
        apiClient.get<Note>(`/notes/${id}`),

    create: (data: CreateNoteData) => 
        apiClient.post<Note>('/notes', data),

    update: (id: string, data: UpdateNoteData) => 
        apiClient.put<Note>(`/notes/${id}`, data),

    delete: (id: string) => 
        apiClient.delete(`/notes/${id}`),

    search: (query: string, params?: { limit?: number }) =>
        apiClient.get<Note[]>(`/notes/search/${query}`, params),

    getByDate: (date: string) =>
        apiClient.get<Note[]>(`/notes/date/${date}`),

    getStats: () =>
        apiClient.get<{
            total: number;
            byType: Record<string, number>;
            recent: Note[];
        }>('/notes/stats'),
}; 