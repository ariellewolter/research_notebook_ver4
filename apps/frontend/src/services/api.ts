// Re-export all API modules from the new modular structure
export * from './api/index';

// Legacy default export for backward compatibility
import api from './api/apiClient';
export default api; 