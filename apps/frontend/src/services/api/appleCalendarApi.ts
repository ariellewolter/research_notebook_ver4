import api from './apiClient';

export const appleCalendarApi = {
    getEvents: (params?: { startDate?: string; endDate?: string; calendarId?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.startDate) searchParams.append('startDate', params.startDate);
        if (params?.endDate) searchParams.append('endDate', params.endDate);
        if (params?.calendarId) searchParams.append('calendarId', params.calendarId);
        return api.get(`/calendar/apple/events?${searchParams.toString()}`);
    },
    createEvent: (data: any) => api.post('/calendar/apple/events', data),
    updateEvent: (eventId: string, data: any) => api.put(`/calendar/apple/events/${eventId}`, data),
    deleteEvent: (eventId: string) => api.delete(`/calendar/apple/events/${eventId}`),
    getCalendars: () => api.get('/calendar/apple/calendars'),
    syncEvents: () => api.post('/calendar/apple/sync'),
    getCredentials: () => api.get('/calendar/apple/credentials'),
    saveCredentials: (data: any) => api.post('/calendar/apple/credentials', data)
}; 