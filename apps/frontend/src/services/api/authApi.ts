import { apiClient } from './apiClient';

export const authApi = {
    login: (credentials: { email: string; password: string }) =>
        apiClient.post('/auth/login', credentials),
    
    register: (userData: { email: string; password: string; name: string }) =>
        apiClient.post('/auth/register', userData),
    
    logout: () => apiClient.post('/auth/logout'),
    
    refresh: () => apiClient.post('/auth/refresh'),
    
    getProfile: () => apiClient.get('/auth/profile'),
    
    updateProfile: (data: any) => apiClient.put('/auth/profile', data),
}; 