import api from './apiClient';

export const recipesApi = {
    getAll: (params?: { page?: number; limit?: number; category?: string; type?: string; search?: string }) =>
        api.get('/recipes', { params }),
    getById: (id: string) => api.get(`/recipes/${id}`),
    create: (data: any) => api.post('/recipes', data),
    update: (id: string, data: any) => api.put(`/recipes/${id}`, data),
    delete: (id: string) => api.delete(`/recipes/${id}`),
    getCategories: () => api.get('/recipes/categories/list'),
    getTypes: () => api.get('/recipes/types/list'),
    getStats: () => api.get('/recipes/stats/overview'),
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