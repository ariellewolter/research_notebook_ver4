import { useState, useCallback } from 'react';

interface UseApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
    execute: (...args: any[]) => Promise<T>;
    clearError: () => void;
    reset: () => void;
}

export function useApi<T = any>(
    apiFunction: (...args: any[]) => Promise<{ data: T }>,
    options: {
        onSuccess?: (data: T) => void;
        onError?: (error: string) => void;
        initialData?: T;
    } = {}
): UseApiReturn<T> {
    const [state, setState] = useState<UseApiState<T>>({
        data: options.initialData || null,
        loading: false,
        error: null,
    });

    const execute = useCallback(async (...args: any[]): Promise<T> => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            
            const response = await apiFunction(...args);
            const data = response.data;
            
            setState(prev => ({ ...prev, data, loading: false }));
            
            options.onSuccess?.(data);
            return data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'API request failed';
            
            setState(prev => ({ ...prev, error: errorMessage, loading: false }));
            
            options.onError?.(errorMessage);
            throw new Error(errorMessage);
        }
    }, [apiFunction, options.onSuccess, options.onError]);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    const reset = useCallback(() => {
        setState({
            data: options.initialData || null,
            loading: false,
            error: null,
        });
    }, [options.initialData]);

    return {
        ...state,
        execute,
        clearError,
        reset,
    };
}

// Hook for list operations
interface UseApiListState<T> {
    items: T[];
    loading: boolean;
    error: string | null;
    total: number;
    pagination: {
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

interface UseApiListReturn<T> extends UseApiListState<T> {
    fetch: (params?: any) => Promise<void>;
    add: (item: T) => void;
    update: (id: string, updates: Partial<T>) => void;
    remove: (id: string) => void;
    clearError: () => void;
    reset: () => void;
}

export function useApiList<T = any>(
    fetchFunction: (params?: any) => Promise<{ data: { data?: T[]; items?: T[]; total: number; pagination: any } }>,
    options: {
        onSuccess?: (data: T[]) => void;
        onError?: (error: string) => void;
        idField?: keyof T;
    } = {}
): UseApiListReturn<T> {
    const [state, setState] = useState<UseApiListState<T>>({
        items: [],
        loading: false,
        error: null,
        total: 0,
        pagination: {
            page: 1,
            limit: 10,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
        },
    });

    const idField = options.idField || 'id' as keyof T;

    const fetch = useCallback(async (params?: any) => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            
            const response = await fetchFunction(params);
            const responseData = response.data;
            
            const items = responseData.data || responseData.items || [];
            const total = responseData.total || 0;
            const pagination = responseData.pagination || {
                page: 1,
                limit: 10,
                totalPages: Math.ceil(total / 10),
                hasNext: false,
                hasPrev: false,
            };
            
            setState(prev => ({ 
                ...prev, 
                items, 
                total, 
                pagination, 
                loading: false 
            }));
            
            options.onSuccess?.(items);
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch data';
            
            setState(prev => ({ ...prev, error: errorMessage, loading: false }));
            
            options.onError?.(errorMessage);
        }
    }, [fetchFunction, options.onSuccess, options.onError]);

    const add = useCallback((item: T) => {
        setState(prev => ({ 
            ...prev, 
            items: [item, ...prev.items],
            total: prev.total + 1
        }));
    }, []);

    const update = useCallback((id: string, updates: Partial<T>) => {
        setState(prev => ({
            ...prev,
            items: prev.items.map(item => 
                (item as any)[idField] === id ? { ...item, ...updates } : item
            )
        }));
    }, [idField]);

    const remove = useCallback((id: string) => {
        setState(prev => ({
            ...prev,
            items: prev.items.filter(item => (item as any)[idField] !== id),
            total: Math.max(0, prev.total - 1)
        }));
    }, [idField]);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    const reset = useCallback(() => {
        setState({
            items: [],
            loading: false,
            error: null,
            total: 0,
            pagination: {
                page: 1,
                limit: 10,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            },
        });
    }, []);

    return {
        ...state,
        fetch,
        add,
        update,
        remove,
        clearError,
        reset,
    };
} 