import api from './apiClient';

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