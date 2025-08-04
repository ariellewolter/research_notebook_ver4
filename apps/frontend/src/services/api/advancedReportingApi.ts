import api from './apiClient';

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