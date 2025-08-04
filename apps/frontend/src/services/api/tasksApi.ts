import api from './apiClient';

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