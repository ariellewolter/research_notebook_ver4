import api from './apiClient';

export const experimentalVariablesApi = {
    // Categories
    getCategories: () => api.get('/experimental-variables/categories'),
    createCategory: (data: any) => api.post('/experimental-variables/categories', data),
    updateCategory: (id: string, data: any) => api.put(`/experimental-variables/categories/${id}`, data),
    deleteCategory: (id: string) => api.delete(`/experimental-variables/categories/${id}`),

    // Experiment Variables
    getExperimentVariables: (experimentId: string) => api.get(`/experimental-variables/experiments/${experimentId}/variables`),
    createExperimentVariable: (experimentId: string, data: any) => api.post(`/experimental-variables/experiments/${experimentId}/variables`, data),
    updateExperimentVariable: (id: string, data: any) => api.put(`/experimental-variables/variables/${id}`, data),
    deleteExperimentVariable: (id: string) => api.delete(`/experimental-variables/variables/${id}`),

    // Variable Values
    getVariableValues: (variableId: string, params?: { limit?: number; offset?: number }) =>
        api.get(`/experimental-variables/variables/${variableId}/values`, { params }),
    createVariableValue: (variableId: string, data: any) => api.post(`/experimental-variables/variables/${variableId}/values`, data),

    // Analytics
    getAnalytics: (params?: { experimentId?: string; categoryId?: string; dateRange?: string }) =>
        api.get('/experimental-variables/analytics', { params }),
}; 