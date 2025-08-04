import api from './apiClient';

export const googleCalendarApi = {
    getEvents: (params?: { startDate?: string; endDate?: string; calendarId?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.startDate) searchParams.append('startDate', params.startDate);
        if (params?.endDate) searchParams.append('endDate', params.endDate);
        if (params?.calendarId) searchParams.append('calendarId', params.calendarId);
        return api.get(`/calendar/google/events?${searchParams.toString()}`);
    },
    createEvent: (data: any) => api.post('/calendar/google/events', data),
    updateEvent: (eventId: string, data: any) => api.put(`/calendar/google/events/${eventId}`, data),
    deleteEvent: (eventId: string) => api.delete(`/calendar/google/events/${eventId}`),
    getCalendars: () => api.get('/calendar/google/calendars'),
    syncEvents: () => api.post('/calendar/google/sync'),
    getCredentials: () => api.get('/calendar/google/credentials'),
    saveCredentials: (data: any) => api.post('/calendar/google/credentials', data)
}; 