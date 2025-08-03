# TypeScript Interfaces Documentation

## Overview

This document describes the TypeScript interfaces and type safety improvements implemented in the Research Notebook application. These interfaces provide comprehensive type safety for all API entities and improve code maintainability.

## File Structure

```
apps/frontend/src/types/
├── api.ts                    # Main API type definitions
└── index.ts                  # Re-export all types

apps/frontend/src/services/
└── api.ts                    # Updated API service with proper typing
```

## Core API Interfaces

### Base Response Types

```typescript
interface ApiResponse<T = any> {
    data: T;
    message?: string;
    status?: string;
}
```

### Project Management

```typescript
interface Project {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'completed' | 'on_hold' | 'cancelled';
    startDate?: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
}

interface ProjectParams {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

interface ProjectCreateData {
    name: string;
    description?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}

interface ProjectUpdateData {
    name?: string;
    description?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}
```

### Experiment Management

```typescript
interface Experiment {
    id: string;
    name: string;
    description?: string;
    projectId: string;
    protocolIds?: string[];
    recipeIds?: string[];
    noteIds?: string[];
    pdfIds?: string[];
    literatureNoteIds?: string[];
    createdAt: string;
    updatedAt: string;
}

interface ExperimentCreateData {
    name: string;
    description?: string;
    protocolIds?: string[];
    recipeIds?: string[];
    noteIds?: string[];
    pdfIds?: string[];
    literatureNoteIds?: string[];
}

interface ExperimentUpdateData {
    name?: string;
    description?: string;
    protocolIds?: string[];
    noteIds?: string[];
    literatureNoteIds?: string[];
}
```

### Task Management

```typescript
interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
    deadline?: string;
    isRecurring: boolean;
    recurringPattern?: string;
    tags?: string;
    projectId?: string | null;
    experimentId?: string | null;
    protocolId?: string | null;
    noteId?: string | null;
    createdAt: string;
    updatedAt: string;
}

interface TaskCreateData {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    deadline?: string;
    isRecurring?: boolean;
    recurringPattern?: string;
    tags?: string;
    projectId?: string;
    experimentId?: string;
    protocolId?: string;
    noteId?: string;
}

interface TaskUpdateData {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    deadline?: string;
    isRecurring?: boolean;
    recurringPattern?: string;
    tags?: string;
    projectId?: string;
    experimentId?: string;
    protocolId?: string;
    noteId?: string;
}
```

### Database Entities

```typescript
interface DatabaseEntry {
    id: string;
    type: string;
    name: string;
    description?: string;
    properties?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

interface DatabaseEntryCreateData {
    type: string;
    name: string;
    description?: string;
    properties?: string;
    metadata?: Record<string, any>;
}

interface DatabaseEntryUpdateData {
    name?: string;
    description?: string;
    properties?: string;
    metadata?: Record<string, any>;
}
```

### Literature Notes

```typescript
interface LiteratureNote {
    id: string;
    title: string;
    authors: string;
    year: string;
    journal: string;
    doi: string;
    abstract: string;
    tags: string;
    citation: string;
    synonyms: string;
    userNote: string;
    createdAt: string;
    updatedAt: string;
}

interface LiteratureNoteCreateData {
    title: string;
    authors: string;
    year: string;
    journal: string;
    doi: string;
    abstract: string;
    tags: string;
    citation: string;
    synonyms: string;
    userNote: string;
}

interface LiteratureNoteUpdateData {
    title?: string;
    authors?: string;
    year?: string;
    journal?: string;
    doi?: string;
    abstract?: string;
    tags?: string;
    citation?: string;
    synonyms?: string;
    userNote?: string;
}
```

### Protocols and Recipes

```typescript
interface Protocol {
    id: string;
    name: string;
    description?: string;
    steps: string;
    category?: string;
    tags?: string;
    createdAt: string;
    updatedAt: string;
}

interface Recipe {
    id: string;
    name: string;
    description?: string;
    ingredients: string;
    instructions: string;
    category?: string;
    tags?: string;
    createdAt: string;
    updatedAt: string;
}
```

### PDF Management

```typescript
interface PDF {
    id: string;
    title: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    createdAt: string;
    updatedAt: string;
}

interface Highlight {
    id: string;
    pdfId: string;
    page: number;
    text: string;
    coords?: string;
    createdAt: string;
    updatedAt: string;
}
```

## Common API Parameters

### Pagination and Filtering

```typescript
interface PaginationParams {
    page?: number;
    limit?: number;
}

interface FilterParams {
    type?: string;
    status?: string;
    priority?: string;
    category?: string;
    tags?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
}

interface SortParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

interface ApiParams extends PaginationParams, FilterParams, SortParams {
    [key: string]: any;
}
```

## Usage Examples

### API Service Usage

```typescript
import { projectsApi, Project, ProjectCreateData } from '../services/api';

// Creating a new project
const newProject: ProjectCreateData = {
    name: "My Research Project",
    description: "A comprehensive study",
    status: "active"
};

const project = await projectsApi.create(newProject);

// Fetching projects with filters
const projects = await projectsApi.getAll({
    status: "active",
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc"
});
```

### Type-Safe API Responses

```typescript
// Before (with 'any' types)
const response: any = await api.get('/projects');
const projects = response.data; // No type safety

// After (with proper typing)
const response = await projectsApi.getAll();
const projects: Project[] = response.data; // Full type safety
```

## Benefits

### 1. **Type Safety**
- Compile-time error detection
- IntelliSense support in IDEs
- Reduced runtime errors

### 2. **Code Maintainability**
- Clear contract definitions
- Easier refactoring
- Better documentation

### 3. **Developer Experience**
- Auto-completion
- Type checking
- Better debugging

### 4. **API Consistency**
- Standardized response formats
- Consistent parameter structures
- Predictable data shapes

## Migration Guide

### From 'any' Types

1. **Replace generic types:**
   ```typescript
   // Before
   function getProjects(params?: any): Promise<any> {
   
   // After
   function getProjects(params?: ProjectParams): Promise<Project[]> {
   ```

2. **Update API calls:**
   ```typescript
   // Before
   const projects = await api.get('/projects');
   
   // After
   const projects = await projectsApi.getAll();
   ```

3. **Add proper error handling:**
   ```typescript
   try {
       const projects = await projectsApi.getAll();
       // TypeScript knows projects is Project[]
   } catch (error) {
       // Handle errors appropriately
   }
   ```

## Best Practices

1. **Always use typed interfaces** instead of 'any'
2. **Extend base interfaces** for specific use cases
3. **Use union types** for status and priority fields
4. **Include optional fields** with proper defaults
5. **Document complex types** with JSDoc comments
6. **Use strict TypeScript configuration** for maximum safety

## Future Enhancements

- [ ] Add validation schemas (Zod integration)
- [ ] Implement runtime type checking
- [ ] Add generic response wrappers
- [ ] Create type-safe query builders
- [ ] Add API versioning support 