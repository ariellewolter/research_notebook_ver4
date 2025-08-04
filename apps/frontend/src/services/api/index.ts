// Base API client
export { default as api } from './apiClient';

// Core API modules
export { notesApi } from './notesApi';
export { projectsApi } from './projectsApi';
export { pdfsApi } from './pdfsApi';
export { databaseApi } from './databaseApi';
export { linksApi } from './linksApi';
export { tablesApi } from './tablesApi';
export { protocolsApi } from './protocolsApi';
export { zoteroApi } from './zoteroApi';
export { recipesApi } from './recipesApi';
export { literatureNotesApi } from './literatureNotesApi';
export { tasksApi } from './tasksApi';
export { taskTemplatesApi } from './taskTemplatesApi';
export { taskDependenciesApi } from './taskDependenciesApi';
export { searchApi } from './searchApi';
export { notificationsApi } from './notificationsApi';

// Calendar APIs
export { googleCalendarApi, outlookCalendarApi, appleCalendarApi } from './calendarApi';

// Advanced APIs
export { experimentalVariablesApi } from './experimentalVariablesApi';
export { advancedReportingApi } from './advancedReportingApi';

// Legacy function for backward compatibility
export const getNotes = async () => {
    const { notesApi } = await import('./notesApi');
    const response = await notesApi.getAll();
    return response.data;
}; 