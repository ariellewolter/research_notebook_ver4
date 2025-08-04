import api from './apiClient';

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
}; 