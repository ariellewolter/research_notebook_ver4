# API Services

This directory contains the refactored API services, breaking down the original monolithic `api.ts` file into smaller, focused modules.

## Structure

### Base Client
- **`apiClient.ts`** - Base axios instance with interceptors, retry logic, and error handling

### Core API Modules
- **`notesApi.ts`** - Notes CRUD operations
- **`projectsApi.ts`** - Projects and experiments management
- **`pdfsApi.ts`** - PDF upload, management, and highlights
- **`databaseApi.ts`** - Database entries and metadata
- **`linksApi.ts`** - Entity linking and relationships
- **`tablesApi.ts`** - Data tables and rows management
- **`protocolsApi.ts`** - Protocols and executions
- **`zoteroApi.ts`** - Zotero integration and sync
- **`recipesApi.ts`** - Recipes and recipe executions
- **`literatureNotesApi.ts`** - Literature notes management

### Task Management APIs
- **`tasksApi.ts`** - Task CRUD, time tracking, comments, attachments
- **`taskTemplatesApi.ts`** - Task templates and template-based task creation
- **`taskDependenciesApi.ts`** - Task dependencies and workflow management

### Search & Analytics
- **`searchApi.ts`** - Advanced search, saved searches, analytics
- **`notificationsApi.ts`** - Notification management and reminders

### Calendar Integration
- **`calendarApi.ts`** - Google Calendar, Outlook Calendar, Apple Calendar ICS export

### Advanced Features
- **`experimentalVariablesApi.ts`** - Experimental variables and categories
- **`advancedReportingApi.ts`** - Custom reports, templates, scheduled reports

### Barrel Exports
- **`index.ts`** - Central export file for all API modules

## Usage

### Importing APIs

```typescript
// Import specific API modules
import { notesApi, projectsApi, pdfsApi } from '../services/api';

// Import all APIs
import * as api from '../services/api';

// Import base client
import { api as apiClient } from '../services/api';
```

### Using API Modules

```typescript
// Notes API
const notes = await notesApi.getAll();
const newNote = await notesApi.create({ title: 'Test', content: 'Content', type: 'general' });

// Projects API
const projects = await projectsApi.getAll();
const project = await projectsApi.create({ name: 'New Project', status: 'active' });

// PDFs API
const pdfs = await pdfsApi.getAll();
const uploadedPdf = await pdfsApi.upload(file, 'Document Title');

// Database API
const entries = await databaseApi.getAll();
const newEntry = await databaseApi.create({ type: 'GENERIC', name: 'New Entry' });

// Links API
const links = await linksApi.getAll();
const newLink = await linksApi.create({ 
    sourceType: 'project', 
    sourceId: '123', 
    targetType: 'note', 
    targetId: '456' 
});
```

### Backward Compatibility

The refactored API maintains full backward compatibility:

```typescript
// Old import still works
import { notesApi, projectsApi } from '../services/api';

// Legacy function still available
import { getNotes } from '../services/api';
const notes = await getNotes();
```

## Benefits of Refactoring

### 1. **Separation of Concerns**
- Each API module focuses on a specific domain
- Clear boundaries between different API functionalities
- Easier to understand and maintain

### 2. **Modularity**
- Import only the APIs you need
- Better tree-shaking for smaller bundle sizes
- Easier to test individual API modules

### 3. **Maintainability**
- Smaller files are easier to navigate and modify
- Changes to one API don't affect others
- Better code organization

### 4. **Reusability**
- API modules can be easily reused across components
- Consistent patterns across all API modules
- Shared base client with common functionality

### 5. **Type Safety**
- Better TypeScript support with focused types
- Easier to add type definitions for specific APIs
- Improved IDE autocomplete

## File Structure

```
src/services/api/
├── apiClient.ts              # Base axios client
├── index.ts                  # Barrel exports
├── README.md                 # Documentation
├── notesApi.ts              # Notes API
├── projectsApi.ts           # Projects API
├── pdfsApi.ts               # PDFs API
├── databaseApi.ts           # Database API
├── linksApi.ts              # Links API
├── tablesApi.ts             # Tables API
├── protocolsApi.ts          # Protocols API
├── zoteroApi.ts             # Zotero API
├── recipesApi.ts            # Recipes API
├── literatureNotesApi.ts    # Literature Notes API
├── tasksApi.ts              # Tasks API
├── taskTemplatesApi.ts      # Task Templates API
├── taskDependenciesApi.ts   # Task Dependencies API
├── searchApi.ts             # Search API
├── notificationsApi.ts      # Notifications API
├── calendarApi.ts           # Calendar APIs
├── experimentalVariablesApi.ts # Experimental Variables API
└── advancedReportingApi.ts  # Advanced Reporting API
```

## Migration Guide

### From Monolithic API

**Before:**
```typescript
import { notesApi, projectsApi, pdfsApi } from '../services/api';
```

**After:**
```typescript
// Same import still works!
import { notesApi, projectsApi, pdfsApi } from '../services/api';

// Or import from specific modules
import { notesApi } from '../services/api/notesApi';
import { projectsApi } from '../services/api/projectsApi';
```

### Adding New APIs

1. Create a new file in the `api/` directory (e.g., `newFeatureApi.ts`)
2. Import the base client: `import api from './apiClient';`
3. Export your API object
4. Add the export to `index.ts`

```typescript
// newFeatureApi.ts
import api from './apiClient';

export const newFeatureApi = {
    getAll: () => api.get('/new-feature'),
    create: (data: any) => api.post('/new-feature', data),
    // ... other methods
};

// index.ts
export { newFeatureApi } from './newFeatureApi';
```

## Error Handling

All API modules inherit error handling from the base client:

- **401 Unauthorized**: Automatic redirect to login
- **403 Forbidden**: Access denied error
- **404 Not Found**: Resource not found error
- **5xx Server Errors**: Automatic retry with exponential backoff
- **Network Errors**: Automatic retry with exponential backoff

## Configuration

The base client is configured with:

- **Base URL**: `process.env.REACT_APP_API_URL || 'http://localhost:4000/api'`
- **Timeout**: 30 seconds
- **Retry Attempts**: 3
- **Retry Delay**: 1 second (exponential backoff)
- **Authentication**: Automatic Bearer token injection
- **Logging**: Request/response logging with timing 