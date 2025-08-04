import api from './apiClient';

export const outlookCalendarApi = {
    getEvents: (params?: { startDate?: string; endDate?: string; calendarId?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.startDate) searchParams.append('startDate', params.startDate);
        if (params?.endDate) searchParams.append('endDate', params.endDate);
        if (params?.calendarId) searchParams.append('calendarId', params.calendarId);
        return api.get(`/calendar/outlook/events?${searchParams.toString()}`);
    },
    createEvent: (data: any) => api.post('/calendar/outlook/events', data),
    updateEvent: (eventId: string, data: any) => api.put(`/calendar/outlook/events/${eventId}`, data),
    deleteEvent: (eventId: string) => api.delete(`/calendar/outlook/events/${eventId}`),
    getCalendars: () => api.get('/calendar/outlook/calendars'),
    syncEvents: () => api.post('/calendar/outlook/sync'),
    getCredentials: () => api.get('/calendar/outlook/credentials'),
    saveCredentials: (data: any) => api.post('/calendar/outlook/credentials', data)
}; 