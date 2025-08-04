import { useState, useEffect, useCallback, useRef } from 'react';
import { tasksApi, taskTemplatesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
    deadline?: string;
    isRecurring: boolean;
    recurringPattern?: string;
    tags?: string;
    projectId?: string | null;
    experimentId?: string | null;
    protocolId?: string | null;
    noteId?: string | null;
    createdAt: string;
    updatedAt: string;
}

export const useTasks = () => {
    const { token } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const loadTasks = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        try {
            const controller = new AbortController();
            abortControllerRef.current = controller;

            const response = await tasksApi.getAll();
            setTasks(response.data.data || response.data || []);
            setError(null);
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('Failed to load tasks:', error);
            setError('Failed to load tasks. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    const createTask = useCallback(async (taskData: Partial<Task>) => {
        if (!token) return;

        try {
            const controller = new AbortController();
            abortControllerRef.current = controller;

            const response = await tasksApi.create(taskData);
            await loadTasks();
            return response.data;
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('Failed to create task:', error);
            throw new Error(error.response?.data?.error || 'Failed to create task');
        }
    }, [token, loadTasks]);

    const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
        if (!token) return;

        try {
            const controller = new AbortController();
            abortControllerRef.current = controller;

            const response = await tasksApi.update(taskId, updates);
            await loadTasks();
            return response.data;
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('Failed to update task:', error);
            throw new Error(error.response?.data?.error || 'Failed to update task');
        }
    }, [token, loadTasks]);

    const deleteTask = useCallback(async (taskId: string) => {
        if (!token) return;

        try {
            const controller = new AbortController();
            abortControllerRef.current = controller;

            await tasksApi.delete(taskId);
            await loadTasks();
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('Failed to delete task:', error);
            throw new Error(error.response?.data?.error || 'Failed to delete task');
        }
    }, [token, loadTasks]);

    useEffect(() => {
        loadTasks();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [loadTasks]);

    return {
        tasks,
        loading,
        error,
        createTask,
        updateTask,
        deleteTask,
        loadTasks,
        clearError: () => setError(null),
    };
}; 