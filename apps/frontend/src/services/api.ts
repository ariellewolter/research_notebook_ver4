import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: 'http://localhost:4000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for authentication and logging
api.interceptors.request.use(
    (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        
        // Add authorization header if token exists
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
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
    getAll: (params?: any) => api.get('/projects', { params }),
    getById: (id: string) => api.get(`/projects/${id}`),
    create: (data: any) => api.post('/projects', data),
    update: (id: string, data: any) => api.put(`/projects/${id}`, data),
    delete: (id: string) => api.delete(`/projects/${id}`),
    getExperiments: (projectId: string) => api.get(`/projects/${projectId}/experiments`),
    getAllExperiments: () => api.get('/projects/experiments/all'),
    createExperiment: (projectId: string, data: { name: string; description?: string; protocolIds?: string[]; recipeIds?: string[]; noteIds?: string[]; pdfIds?: string[]; literatureNoteIds?: string[] }) =>
        api.post(`/projects/${projectId}/experiments`, data),
    updateExperiment: (id: string, data: { name?: string; description?: string; protocolIds?: string[]; noteIds?: string[]; literatureNoteIds?: string[] }) =>
        api.put(`/projects/experiments/${id}`, data),
    deleteExperiment: (id: string) => api.delete(`/projects/experiments/${id}`),
    getExperimentExecutions: (experimentId: string) => api.get(`/projects/experiments/${experimentId}/executions`),
    getStats: () => api.get('/projects/stats'),
    search: (query: string, params?: any) => api.get(`/projects/search/${query}`, { params }),
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
    config: (data: { apiKey: string; userId: string; groupId?: string }) =>
        api.post('/zotero/config', data),
    getItems: (params?: { limit?: number; start?: number; itemType?: string }) =>
        api.get('/zotero/items', { params }),
    getItem: (key: string) => api.get(`/zotero/items/${key}`),
    import: (file: File, data: { zoteroKey: string; title: string; authors?: string[]; abstract?: string; publicationYear?: number; journal?: string; doi?: string; url?: string; tags?: string[] }) => {
        const formData = new FormData();
        formData.append('pdf', file);
        Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            } else if (value !== undefined) {
                formData.append(key, String(value));
            }
        });
        return api.post('/zotero/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    search: (query: string, params?: { limit?: number }) =>
        api.get(`/zotero/search/${query}`, { params }),
    getCollections: () => api.get('/zotero/collections'),
    getCollectionItems: (key: string, params?: { limit?: number; start?: number }) =>
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
    getWorkflows: () => api.get('/task-dependencies/workflows'),
    createWorkflow: (data: { name: string; description?: string; type: 'sequential' | 'parallel' | 'conditional' | 'mixed'; taskIds: string[]; metadata?: string }) =>
        api.post('/task-dependencies/workflows', data),
    getWorkflow: (id: string) => api.get(`/task-dependencies/workflows/${id}`),
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

export default api; 