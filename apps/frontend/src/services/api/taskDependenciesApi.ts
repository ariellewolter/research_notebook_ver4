import api from './apiClient';

export const taskDependenciesApi = {
    getByTask: (taskId: string) => api.get(`/task-dependencies/task/${taskId}`),
    create: (data: { fromTaskId: string; toTaskId: string; dependencyType?: 'blocks' | 'requires' | 'suggests' | 'relates' }) =>
        api.post('/task-dependencies', data),
    delete: (id: string) => api.delete(`/task-dependencies/${id}`),
    getCriticalPath: (taskIds: string[]) => api.get('/task-dependencies/critical-path', { params: { taskIds } }),
    getWorkflows: () => api.get('/task-flow-management/workflows'),
    createWorkflow: (data: { name: string; description?: string; type: 'sequential' | 'parallel' | 'conditional' | 'mixed'; taskIds: string[]; metadata?: string }) =>
        api.post('/task-flow-management/workflows', data),
    getWorkflow: (id: string) => api.get(`/task-flow-management/workflows/${id}`),
    updateWorkflow: (id: string, data: any) => api.put(`/task-flow-management/workflows/${id}`, data),
    deleteWorkflow: (id: string) => api.delete(`/task-flow-management/workflows/${id}`),
    executeWorkflow: (id: string) => api.post(`/task-flow-management/workflows/${id}/execute`),
    getExecutionStatus: (executionId: string) => api.get(`/task-flow-management/executions/${executionId}`),
    getExecutionHistory: (workflowId?: string) => api.get('/task-flow-management/executions', { params: { workflowId } }),
    pauseExecution: (executionId: string) => api.post(`/task-flow-management/executions/${executionId}/pause`),
    resumeExecution: (executionId: string) => api.post(`/task-flow-management/executions/${executionId}/resume`),
    cancelExecution: (executionId: string) => api.post(`/task-flow-management/executions/${executionId}/cancel`),
}; 