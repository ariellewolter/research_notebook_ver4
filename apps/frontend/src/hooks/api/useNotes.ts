import { useState, useEffect, useCallback } from 'react';
import { notesApi } from '../../services/api';
import { Note, CreateNoteData, UpdateNoteData } from '../../types/note.types';

interface UseNotesOptions {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    autoFetch?: boolean;
}

interface UseNotesReturn {
    notes: Note[];
    note: Note | null;
    loading: boolean;
    error: string | null;
    stats: {
        total: number;
        byType: Record<string, number>;
        recent: Note[];
    } | null;
    fetchNotes: (options?: UseNotesOptions) => Promise<void>;
    fetchNote: (id: string) => Promise<void>;
    createNote: (data: CreateNoteData) => Promise<Note>;
    updateNote: (id: string, data: UpdateNoteData) => Promise<Note>;
    deleteNote: (id: string) => Promise<void>;
    searchNotes: (query: string, limit?: number) => Promise<Note[]>;
    getNotesByDate: (date: string) => Promise<Note[]>;
    fetchStats: () => Promise<void>;
    clearError: () => void;
}

export function useNotes(options: UseNotesOptions = {}): UseNotesReturn {
    const [notes, setNotes] = useState<Note[]>([]);
    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<{
        total: number;
        byType: Record<string, number>;
        recent: Note[];
    } | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const fetchNotes = useCallback(async (fetchOptions?: UseNotesOptions) => {
        try {
            setLoading(true);
            setError(null);
            
            const params = { ...options, ...fetchOptions };
            const response = await notesApi.getAll(params);
            
            if (response.data) {
                setNotes(response.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch notes');
        } finally {
            setLoading(false);
        }
    }, [options]);

    const fetchNote = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await notesApi.getById(id);
            setNote(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch note');
        } finally {
            setLoading(false);
        }
    }, []);

    const createNote = useCallback(async (data: CreateNoteData): Promise<Note> => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await notesApi.create(data);
            const newNote = response.data;
            
            // Add to notes list
            setNotes(prev => [newNote, ...prev]);
            
            return newNote;
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to create note';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateNote = useCallback(async (id: string, data: UpdateNoteData): Promise<Note> => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await notesApi.update(id, data);
            const updatedNote = response.data;
            
            // Update in notes list
            setNotes(prev => prev.map(n => n.id === id ? updatedNote : n));
            
            // Update single note if it's the current one
            if (note?.id === id) {
                setNote(updatedNote);
            }
            
            return updatedNote;
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to update note';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [note]);

    const deleteNote = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            
            await notesApi.delete(id);
            
            // Remove from notes list
            setNotes(prev => prev.filter(n => n.id !== id));
            
            // Clear single note if it's the current one
            if (note?.id === id) {
                setNote(null);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to delete note');
        } finally {
            setLoading(false);
        }
    }, [note]);

    const searchNotes = useCallback(async (query: string, limit: number = 10): Promise<Note[]> => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await notesApi.search(query, { limit });
            return response.data;
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to search notes');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getNotesByDate = useCallback(async (date: string): Promise<Note[]> => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await notesApi.getByDate(date);
            return response.data;
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch notes by date');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await notesApi.getStats();
            setStats(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch stats');
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-fetch on mount if enabled
    useEffect(() => {
        if (options.autoFetch !== false) {
            fetchNotes();
        }
    }, [fetchNotes, options.autoFetch]);

    return {
        notes,
        note,
        loading,
        error,
        stats,
        fetchNotes,
        fetchNote,
        createNote,
        updateNote,
        deleteNote,
        searchNotes,
        getNotesByDate,
        fetchStats,
        clearError,
    };
} 