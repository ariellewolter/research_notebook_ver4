import api from './apiClient';

export interface SyncNotification {
  id: string;
  service: string;
  type: 'warning' | 'critical' | 'error';
  message: string;
  scheduledFor: string;
  sentAt?: string;
  isRead: boolean;
  deliveryMethod: 'in_app' | 'email' | 'push' | 'sms';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncNotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

export const syncNotificationsApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    unreadOnly?: boolean; 
    service?: string;
    type?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.unreadOnly) searchParams.append('unreadOnly', params.unreadOnly.toString());
    if (params?.service) searchParams.append('service', params.service);
    if (params?.type) searchParams.append('type', params.type);
    return api.get(`/sync-notifications?${searchParams.toString()}`);
  },

  getByService: (service: string, limit?: number) => {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.append('limit', limit.toString());
    return api.get(`/sync-notifications/service/${service}?${searchParams.toString()}`);
  },

  create: (data: {
    service: string;
    type: 'warning' | 'critical' | 'error';
    message: string;
    scheduledFor: string;
    deliveryMethod?: 'in_app' | 'email' | 'push' | 'sms';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    metadata?: string;
  }) => api.post('/sync-notifications', data),

  update: (id: string, data: {
    isRead?: boolean;
    sentAt?: string;
    message?: string;
    scheduledFor?: string;
  }) => api.put(`/sync-notifications/${id}`, data),

  markAsRead: (id: string) => api.put(`/sync-notifications/${id}/read`),

  markAllAsRead: (service?: string) => {
    const searchParams = new URLSearchParams();
    if (service) searchParams.append('service', service);
    return api.put(`/sync-notifications/read-all?${searchParams.toString()}`);
  },

  delete: (id: string) => api.delete(`/sync-notifications/${id}`),

  getStats: (service?: string) => {
    const searchParams = new URLSearchParams();
    if (service) searchParams.append('service', service);
    return api.get(`/sync-notifications/stats?${searchParams.toString()}`);
  },

  createReminder: (data: {
    service: string;
    type: 'warning' | 'critical' | 'error';
    message: string;
    hoursSinceLastSync?: number;
    errorCount?: number;
  }) => api.post('/sync-notifications/create-reminders', data)
}; 