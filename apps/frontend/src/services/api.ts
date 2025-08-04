import axios, { AxiosError, AxiosResponse } from 'axios';
import {
    Project, ProjectParams, ProjectCreateData, ProjectUpdateData,
    Experiment, ExperimentCreateData, ExperimentUpdateData,
    SearchParams, DatabaseEntry, DatabaseEntryCreateData, DatabaseEntryUpdateData,
    Task, TaskCreateData, TaskUpdateData,
    Protocol, ProtocolCreateData, ProtocolUpdateData,
    Recipe, RecipeCreateData, RecipeUpdateData,
    LiteratureNote, LiteratureNoteCreateData, LiteratureNoteUpdateData,
    Table, TableCreateData, TableUpdateData,
    PDF, PDFCreateData, PDFUpdateData,
    Highlight, HighlightCreateData, HighlightUpdateData,
    ApiParams
} from '../types/api';

// Configuration
const API_CONFIG = {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
};

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Retry logic for failed requests
const retryRequest = async (error: AxiosError, retryCount: number = 0): Promise<AxiosResponse> => {
    if (retryCount >= API_CONFIG.retryAttempts) {
        throw error;
    }

    // Only retry on network errors or 5xx server errors
    if (error.response && error.response.status < 500) {
        throw error;
    }

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * (retryCount + 1)));

    // Retry the request
    try {
        const config = error.config;
        if (!config) throw error;
        
        return await api.request(config);
    } catch (retryError) {
        return retryRequest(retryError as AxiosError, retryCount + 1);
    }
};

// Request interceptor for authentication and logging
api.interceptors.request.use(
    (config) => {
        // Add request ID for tracking
        config.metadata = { startTime: new Date() };
        
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);

        // Add authorization header if token exists
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling and retry logic
api.interceptors.response.use(
    (response) => {
        const duration = new Date().getTime() - response.config.metadata?.startTime?.getTime();
        console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
        return response;
    },
    async (error: AxiosError) => {
        const duration = new Date().getTime() - error.config?.metadata?.startTime?.getTime();
        console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status} (${duration}ms)`, {
            error: error.response?.data || error.message,
            status: error.response?.status,
            statusText: error.response?.statusText
        });

        // Handle specific error cases
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            window.location.href = '/login';
            return Promise.reject(new Error('Authentication required. Please log in again.'));
        }

        if (error.response?.status === 403) {
            return Promise.reject(new Error('Access denied. You do not have permission to perform this action.'));
        }

        if (error.response?.status === 404) {
            return Promise.reject(new Error('Resource not found. Please check the URL and try again.'));
        }

        if (error.response?.status >= 500) {
            return Promise.reject(new Error('Server error. Please try again later.'));
        }

        // Attempt retry for network errors or server errors
        if (!error.response || error.response.status >= 500) {
            try {
                return await retryRequest(error);
            } catch (retryError) {
                return Promise.reject(retryError);
            }
        }

        return Promise.reject(error);
    }
);

// Notes API
export const notesApi = {
    getAll: (params?: { type?: string; experimentId?: string; page?: number; limit?: number }) =>
        api.get('/notes', { params }),
    getById: (id: string) => api.get(`/notes/${id}`),
    create: (data: { title: string; content: string; type: string; date?: string; experimentId?: string }) =>
        api.post('/notes', data),
    update: (id: string, data: { title?: string; content?: string; date?: string; experimentId?: string }) =>
        api.put(`/notes/${id}`, data),
    delete: (id: string) => api.delete(`/notes/${id}`),
};

// Projects API
export const projectsApi = {
    getAll: (params?: ProjectParams) => api.get<Project[]>('/projects', { params }),
    getById: (id: string) => api.get<Project>(`/projects/${id}`),
    create: (data: ProjectCreateData) => api.post<Project>('/projects', data),
    update: (id: string, data: ProjectUpdateData) => api.put<Project>(`/projects/${id}`, data),
    delete: (id: string) => api.delete(`/projects/${id}`),
    getExperiments: (projectId: string) => api.get<Experiment[]>(`/projects/${projectId}/experiments`),
    getAllExperiments: () => api.get<Experiment[]>('/projects/experiments/all'),
    createExperiment: (projectId: string, data: ExperimentCreateData) =>
        api.post<Experiment>(`/projects/${projectId}/experiments`, data),
    updateExperiment: (id: string, data: ExperimentUpdateData) =>
        api.put<Experiment>(`/projects/experiments/${id}`, data),
    deleteExperiment: (id: string) => api.delete(`/projects/experiments/${id}`),
    getExperimentExecutions: (experimentId: string) => api.get(`/projects/experiments/${experimentId}/executions`),
    getStats: () => api.get('/projects/stats'),
    search: (query: string, params?: SearchParams) => api.get<Project[]>(`/projects/search/${query}`, { params }),
};

// PDFs API
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
    // pdfsApi.create: Create a new PDF (placeholder, just title for now)
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

// Database API
export const databaseApi = {
    getAll: (params?: { type?: string; page?: number; limit?: number }) =>
        api.get('/database', { params }),
    getByType: (type: string, params?: { page?: number; limit?: number }) =>
        api.get(`/database/type/${type}`, { params }),
    getById: (id: string) => api.get(`/database/${id}`),
    create: (data: {
        type: string;
        name: string;
        description?: string;
        properties?: string;
        metadata?: {
            molecularWeight?: string;
            concentration?: string;
            storage?: string;
            supplier?: string;
            catalogNumber?: string;
            purity?: string;
            sequence?: string;
            organism?: string;
            function?: string;
            protocol?: string;
            equipment?: string;
            duration?: string;
            temperature?: string;
            pH?: string;
        };
    }) => api.post('/database', data),
    update: (id: string, data: {
        name?: string;
        description?: string;
        properties?: string;
        metadata?: {
            molecularWeight?: string;
            concentration?: string;
            storage?: string;
            supplier?: string;
            catalogNumber?: string;
            purity?: string;
            sequence?: string;
            organism?: string;
            function?: string;
            protocol?: string;
            equipment?: string;
            duration?: string;
            temperature?: string;
            pH?: string;
        };
    }) => api.put(`/database/${id}`, data),
    delete: (id: string) => api.delete(`/database/${id}`),
    search: (query: string, params?: { type?: string; page?: number; limit?: number }) =>
        api.get(`/database/search/${query}`, { params }),
    getStats: () => api.get('/database/stats/overview'),
    createLink: (id: string, data: { targetType: string; targetId: string }) =>
        api.post(`/database/${id}/links`, data),
};

// Links API
export const linksApi = {
    getAll: (params?: { sourceType?: string; sourceId?: string; targetType?: string; targetId?: string }) =>
        api.get('/links', { params }),
    getBacklinks: (type: string, id: string) => api.get(`/links/backlinks/${type}/${id}`),
    getOutgoing: (type: string, id: string) => api.get(`/links/outgoing/${type}/${id}`),
    create: (data: { sourceType: string; sourceId: string; targetType: string; targetId: string }) =>
        api.post('/links', data),
    delete: (id: string) => api.delete(`/links/${id}`),
    getGraph: (params?: { limit?: number }) => api.get('/links/graph', { params }),
    search: (query: string, params?: { type?: string; limit?: number }) =>
        api.get(`/links/search/${query}`, { params }),
};

// Tables API
export const tablesApi = {
    getAll: (params?: { experimentId?: string; page?: number; limit?: number }) =>
        api.get('/tables', { params }),
    getById: (id: string) => api.get(`/tables/${id}`),
    create: (data: {
        name: string;
        description?: string;
        experimentId?: string;
        columns: Array<{
            id: string;
            name: string;
            type: 'text' | 'number' | 'date' | 'boolean' | 'select';
            required?: boolean;
            options?: string[];
            defaultValue?: any;
        }>;
    }) => api.post('/tables', data),
    update: (id: string, data: {
        name?: string;
        description?: string;
        columns?: Array<{
            id: string;
            name: string;
            type: 'text' | 'number' | 'date' | 'boolean' | 'select';
            required?: boolean;
            options?: string[];
            defaultValue?: any;
        }>;
    }) => api.put(`/tables/${id}`, data),
    delete: (id: string) => api.delete(`/tables/${id}`),
    search: (query: string, params?: { experimentId?: string }) =>
        api.get(`/tables/search/${query}`, { params }),
    getStats: () => api.get('/tables/stats/overview'),
    addRow: (tableId: string, data: { data: Record<string, any> }) =>
        api.post(`/tables/${tableId}/rows`, data),
    updateRow: (tableId: string, rowId: string, data: { data: Record<string, any> }) =>
        api.put(`/tables/${tableId}/rows/${rowId}`, data),
    deleteRow: (tableId: string, rowId: string) =>
        api.delete(`/tables/${tableId}/rows/${rowId}`),
    addBulkRows: (tableId: string, data: { rows: Record<string, any>[] }) =>
        api.post(`/tables/${tableId}/rows/bulk`, data),
};

// Protocols API
export const protocolsApi = {
    getAll: (params?: { category?: string; page?: number; limit?: number }) =>
        api.get('/protocols', { params }),
    getByCategory: (category: string, params?: { page?: number; limit?: number }) =>
        api.get(`/protocols/category/${category}`, { params }),
    getById: (id: string) => api.get(`/protocols/${id}`),
    create: (data: {
        name: string;
        description?: string;
        category: string;
        version?: string;
        steps: Array<{
            id: string;
            stepNumber: number;
            title: string;
            description: string;
            duration?: string;
            critical?: boolean;
            notes?: string;
        }>;
        equipment?: string[];
        reagents?: Array<{
            name: string;
            concentration?: string;
            supplier?: string;
            catalogNumber?: string;
        }>;
        safetyNotes?: string;
        expectedDuration?: string;
        difficulty?: 'Easy' | 'Medium' | 'Hard';
    }) => api.post('/protocols', data),
    update: (id: string, data: {
        name?: string;
        description?: string;
        category?: string;
        version?: string;
        steps?: Array<{
            id: string;
            stepNumber: number;
            title: string;
            description: string;
            duration?: string;
            critical?: boolean;
            notes?: string;
        }>;
        equipment?: string[];
        reagents?: Array<{
            name: string;
            concentration?: string;
            supplier?: string;
            catalogNumber?: string;
        }>;
        safetyNotes?: string;
        expectedDuration?: string;
        difficulty?: 'Easy' | 'Medium' | 'Hard';
    }) => api.put(`/protocols/${id}`, data),
    delete: (id: string) => api.delete(`/protocols/${id}`),
    search: (query: string, params?: { category?: string }) =>
        api.get(`/protocols/search/${query}`, { params }),
    getStats: () => api.get('/protocols/stats/overview'),
    createExecution: (protocolId: string, data: {
        experimentId?: string;
        status: 'planned' | 'in_progress' | 'completed' | 'failed' | 'abandoned';
        startDate?: string;
        endDate?: string;
        notes?: string;
        modifications?: Array<{
            stepId: string;
            originalValue: string;
            newValue: string;
            reason: string;
        }>;
        results?: Array<{
            parameter: string;
            value: string;
            unit?: string;
            notes?: string;
        }>;
        issues?: Array<{
            stepId?: string;
            description: string;
            severity: 'low' | 'medium' | 'high' | 'critical';
            resolved?: boolean;
            resolution?: string;
        }>;
        nextSteps?: string;
        executedBy?: string;
        completedSteps?: string[];
    }) => api.post(`/protocols/${protocolId}/executions`, data),
    updateExecution: (protocolId: string, executionId: string, data: {
        status?: 'planned' | 'in_progress' | 'completed' | 'failed' | 'abandoned';
        startDate?: string;
        endDate?: string;
        notes?: string;
        modifications?: Array<{
            stepId: string;
            originalValue: string;
            newValue: string;
            reason: string;
        }>;
        results?: Array<{
            parameter: string;
            value: string;
            unit?: string;
            notes?: string;
        }>;
        issues?: Array<{
            stepId?: string;
            description: string;
            severity: 'low' | 'medium' | 'high' | 'critical';
            resolved?: boolean;
            resolution?: string;
        }>;
        nextSteps?: string;
        executedBy?: string;
        completedSteps?: string[];
    }) => api.put(`/protocols/${protocolId}/executions/${executionId}`, data),
    deleteExecution: (protocolId: string, executionId: string) =>
        api.delete(`/protocols/${protocolId}/executions/${executionId}`),
};

// Zotero API
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

// Recipes API
export const recipesApi = {
    getAll: (params?: { page?: number; limit?: number; category?: string; type?: string; search?: string }) =>
        api.get('/recipes', { params }),

    getById: (id: string) =>
        api.get(`/recipes/${id}`),

    create: (data: any) =>
        api.post('/recipes', data),

    update: (id: string, data: any) =>
        api.put(`/recipes/${id}`, data),

    delete: (id: string) =>
        api.delete(`/recipes/${id}`),

    getCategories: () =>
        api.get('/recipes/categories/list'),

    getTypes: () =>
        api.get('/recipes/types/list'),

    getStats: () =>
        api.get('/recipes/stats/overview'),

    getExecutions: (recipeId: string) => api.get(`/recipes/${recipeId}/executions`),
    createExecution: (recipeId: string, data: {
        experimentId?: string;
        status: string;
        startDate?: string;
        endDate?: string;
        notes?: string;
        completedSteps?: string[];
    }) => api.post(`/recipes/${recipeId}/executions`, data),
    updateExecution: (recipeId: string, executionId: string, data: {
        status?: string;
        startDate?: string;
        endDate?: string;
        notes?: string;
        completedSteps?: string[];
    }) => api.put(`/recipes/${recipeId}/executions/${executionId}`, data),
};

export const literatureNotesApi = {
    getAll: () => api.get('/literature-notes'),
    getById: (id: string) => api.get(`/literature-notes/${id}`),
    create: (data: any) => api.post('/literature-notes', data),
    update: (id: string, data: any) => api.put(`/literature-notes/${id}`, data),
    delete: (id: string) => api.delete(`/literature-notes/${id}`),
};

export const tasksApi = {
    getAll: (params?: {
        status?: string;
        priority?: string;
        projectId?: string;
        experimentId?: string;
        protocolId?: string;
        noteId?: string;
        isRecurring?: boolean;
        overdue?: boolean;
        dueSoon?: boolean;
        search?: string;
        tags?: string;
        tagCategories?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: string;
    }) => api.get('/tasks', { params }),
    getByProject: (projectId: string) => api.get(`/tasks/project/${projectId}`),
    getByExperiment: (experimentId: string) => api.get(`/tasks/experiment/${experimentId}`),
    getOverdue: () => api.get('/tasks/overdue'),
    getStats: () => api.get('/tasks/stats'),
    create: (data: any) => api.post('/tasks', data),
    update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
    delete: (id: string) => api.delete(`/tasks/${id}`),
    bulk: (action: 'update' | 'delete' | 'complete', taskIds: string[], data?: any) =>
        api.post('/tasks/bulk', { action, taskIds, data }),

    // Time tracking
    createTimeEntry: (taskId: string, data: { startTime: string; endTime?: string; description?: string }) =>
        api.post(`/tasks/${taskId}/time-entries`, data),
    deleteTimeEntry: (timeEntryId: string) => api.delete(`/tasks/time-entries/${timeEntryId}`),

    // Comments
    getComments: (taskId: string) => api.get(`/tasks/${taskId}/comments`),
    createComment: (taskId: string, data: { content: string; author: string }) =>
        api.post(`/tasks/${taskId}/comments`, data),
    deleteComment: (commentId: string) => api.delete(`/tasks/comments/${commentId}`),

    // Attachments
    getAttachments: (taskId: string) => api.get(`/tasks/${taskId}/attachments`),
    uploadAttachment: (taskId: string, file: File, onProgress?: (progress: number) => void) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/tasks/${taskId}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: onProgress ? (progressEvent) => {
                const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                onProgress(progress);
            } : undefined,
        });
    },
    deleteAttachment: (attachmentId: string) => api.delete(`/tasks/attachments/${attachmentId}`),
    downloadAttachment: (attachmentId: string) => api.get(`/tasks/attachments/${attachmentId}/download`, {
        responseType: 'blob'
    }),

    // Notifications
    createNotification: (taskId: string, data: { type: string; message: string; scheduledFor: string }) =>
        api.post(`/tasks/${taskId}/notifications`, data),
    markNotificationRead: (notificationId: string) =>
        api.put(`/tasks/notifications/${notificationId}/read`),
};

export const taskTemplatesApi = {
    getAll: () => api.get('/task-templates'),
    getById: (id: string) => api.get(`/task-templates/${id}`),
    create: (data: any) => api.post('/task-templates', data),
    update: (id: string, data: any) => api.put(`/task-templates/${id}`, data),
    delete: (id: string) => api.delete(`/task-templates/${id}`),
    getStats: () => api.get('/task-templates/stats/analytics'),
    createTaskFromTemplate: (templateId: string, data: {
        projectId: string;
        experimentId?: string;
        protocolId?: string;
        noteId?: string;
        deadline?: string;
        customTitle?: string;
        variables?: Record<string, string>;
    }) => api.post(`/task-templates/${templateId}/create-task`, data),
};

export const taskDependenciesApi = {
    getByTask: (taskId: string) => api.get(`/task-dependencies/task/${taskId}`),
    create: (data: { fromTaskId: string; toTaskId: string; dependencyType?: 'blocks' | 'requires' | 'suggests' | 'relates' }) =>
        api.post('/task-dependencies', data),
    delete: (id: string) => api.delete(`/task-dependencies/${id}`),
    getCriticalPath: (taskIds: string[]) => api.get('/task-dependencies/critical-path', { params: { taskIds } }),
    getWorkflows: () => api.get('/task-flow-management/workflows'),
    createWorkflow: (data: { name: string; description?: string; type: 'sequential' | 'parallel' | 'conditional' | 'mixed'; taskIds: string[]; metadata?: string }) =>
        api.post('/task-flow-management/workflows', data),
    getWorkflow: (id: string) => api.get(`/task-flow-management/workflows/${id}`),
    updateWorkflow: (id: string, data: any) => api.put(`/task-flow-management/workflows/${id}`, data),
    deleteWorkflow: (id: string) => api.delete(`/task-flow-management/workflows/${id}`),
    executeWorkflow: (id: string) => api.post(`/task-flow-management/workflows/${id}/execute`),
    getExecutionStatus: (executionId: string) => api.get(`/task-flow-management/executions/${executionId}`),
    getExecutionHistory: (workflowId?: string) => api.get('/task-flow-management/executions', { params: { workflowId } }),
    pauseExecution: (executionId: string) => api.post(`/task-flow-management/executions/${executionId}/pause`),
    resumeExecution: (executionId: string) => api.post(`/task-flow-management/executions/${executionId}/resume`),
    cancelExecution: (executionId: string) => api.post(`/task-flow-management/executions/${executionId}/cancel`),
};

// Advanced Search API
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

export const notificationsApi = {
    getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean; type?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.unreadOnly) searchParams.append('unreadOnly', params.unreadOnly.toString());
        if (params?.type) searchParams.append('type', params.type);
        return api.get(`/notifications?${searchParams.toString()}`);
    },
    getByTask: (taskId: string) => api.get(`/notifications/task/${taskId}`),
    create: (data: {
        taskId: string;
        type: 'reminder' | 'overdue' | 'due_soon' | 'completed' | 'assigned' | 'commented' | 'time_logged';
        message: string;
        scheduledFor: string;
        deliveryMethod?: 'in_app' | 'email' | 'push' | 'sms';
        priority?: 'low' | 'normal' | 'high' | 'urgent';
        metadata?: string;
    }) => api.post('/notifications', data),
    update: (id: string, data: {
        isRead?: boolean;
        sentAt?: string;
        message?: string;
        scheduledFor?: string;
    }) => api.put(`/notifications/${id}`, data),
    markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    delete: (id: string) => api.delete(`/notifications/${id}`),
    getStats: () => api.get('/notifications/stats'),
    createReminders: (taskId: string, reminderTimes: string[]) =>
        api.post('/notifications/create-reminders', { taskId, reminderTimes })
}

export const getNotes = async () => {
    const response = await notesApi.getAll();
    return response.data;
};

// Google Calendar API
export const googleCalendarApi = {
    saveCredentials: (data: { googleClientId: string; googleClientSecret: string }) =>
        api.post('/auth/user/google-credentials', data),
    getCredentials: () => api.get('/auth/user/google-credentials'),
    startAuth: () => api.get('/calendar/google/auth'),
    handleCallback: (code: string) => api.get(`/calendar/google/callback?code=${code}`),
    getCalendars: () => api.get('/calendar/google/calendars'),
    syncEvents: (calendarIds: string[]) => api.post('/calendar/google/sync', { calendarIds }),
    createEvent: (calendarId: string, event: any) => api.post('/calendar/google/events', { calendarId, event }),
};

// Outlook Calendar API
export const outlookCalendarApi = {
    saveCredentials: (data: { outlookClientId: string; outlookClientSecret: string }) =>
        api.post('/auth/user/outlook-credentials', data),
    getCredentials: () => api.get('/auth/user/outlook-credentials'),
    startAuth: () => api.get('/calendar/outlook/auth'),
    handleCallback: (code: string) => api.get(`/calendar/outlook/callback?code=${code}`),
    getCalendars: () => api.get('/calendar/outlook/calendars'),
    syncEvents: (calendarIds: string[]) => api.post('/calendar/outlook/sync', { calendarIds }),
    createEvent: (calendarId: string, event: any) => api.post('/calendar/outlook/events', { calendarId, event }),
};

// Apple Calendar ICS Export API
export const appleCalendarApi = {
    exportICS: (startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return api.get(`/calendar/apple/ics?${params.toString()}`, {
            responseType: 'blob'
        });
    },
};

// Experimental Variables API
export const experimentalVariablesApi = {
    // Categories
    getCategories: () => api.get('/experimental-variables/categories'),
    createCategory: (data: any) => api.post('/experimental-variables/categories', data),
    updateCategory: (id: string, data: any) => api.put(`/experimental-variables/categories/${id}`, data),
    deleteCategory: (id: string) => api.delete(`/experimental-variables/categories/${id}`),

    // Experiment Variables
    getExperimentVariables: (experimentId: string) => api.get(`/experimental-variables/experiments/${experimentId}/variables`),
    createExperimentVariable: (experimentId: string, data: any) => api.post(`/experimental-variables/experiments/${experimentId}/variables`, data),
    updateExperimentVariable: (id: string, data: any) => api.put(`/experimental-variables/variables/${id}`, data),
    deleteExperimentVariable: (id: string) => api.delete(`/experimental-variables/variables/${id}`),

    // Variable Values
    getVariableValues: (variableId: string, params?: { limit?: number; offset?: number }) =>
        api.get(`/experimental-variables/variables/${variableId}/values`, { params }),
    createVariableValue: (variableId: string, data: any) => api.post(`/experimental-variables/variables/${variableId}/values`, data),

    // Analytics
    getAnalytics: (params?: { experimentId?: string; categoryId?: string; dateRange?: string }) =>
        api.get('/experimental-variables/analytics', { params }),
};

// Advanced Reporting API
export const advancedReportingApi = {
    // Report Templates
    getTemplates: () => api.get('/advanced-reporting/templates'),
    createTemplate: (data: any) => api.post('/advanced-reporting/templates', data),
    updateTemplate: (id: string, data: any) => api.put(`/advanced-reporting/templates/${id}`, data),
    deleteTemplate: (id: string) => api.delete(`/advanced-reporting/templates/${id}`),

    // Custom Reports
    getReports: () => api.get('/advanced-reporting/reports'),
    createReport: (data: any) => api.post('/advanced-reporting/reports', data),
    updateReport: (id: string, data: any) => api.put(`/advanced-reporting/reports/${id}`, data),
    deleteReport: (id: string) => api.delete(`/advanced-reporting/reports/${id}`),
    generateReport: (id: string, params?: { filters?: any; format?: string }) =>
        api.post(`/advanced-reporting/reports/${id}/generate`, params),

    // Scheduled Reports
    getScheduledReports: () => api.get('/advanced-reporting/scheduled'),
    createScheduledReport: (data: any) => api.post('/advanced-reporting/scheduled', data),
    updateScheduledReport: (id: string, data: any) => api.put(`/advanced-reporting/scheduled/${id}`, data),
    deleteScheduledReport: (id: string) => api.delete(`/advanced-reporting/scheduled/${id}`),

    // Report Analytics
    getAnalytics: (params?: { dateRange?: string }) => api.get('/advanced-reporting/analytics', { params }),
};

export default api; 