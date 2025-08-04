# Refactoring Guide

This document outlines the major refactoring work completed to improve code organization, maintainability, and developer experience.

## Overview

The codebase has undergone significant refactoring to address several key issues:

1. **Monolithic API service file** (1000+ lines) → **20 focused API modules**
2. **Large Projects component** (1400+ lines) → **6 focused components + 2 custom hooks**
3. **Complex Export component** (600+ lines) → **3 focused components + utilities**

## 1. API Services Refactoring

### Before
- Single `api.ts` file with 774 lines
- All API endpoints mixed together
- Difficult to navigate and maintain
- Violated single responsibility principle

### After
- **20 focused API modules** with clear responsibilities
- **1 base client** with shared configuration
- **1 barrel export file** for easy importing
- **Maintained backward compatibility**

### New Structure

```
src/services/api/
├── apiClient.ts              # Base axios client with interceptors
├── index.ts                  # Barrel exports
├── README.md                 # Documentation
├── notesApi.ts              # Notes CRUD operations
├── projectsApi.ts           # Projects and experiments
├── pdfsApi.ts               # PDF upload and management
├── databaseApi.ts           # Database entries
├── linksApi.ts              # Entity linking
├── tablesApi.ts             # Data tables
├── protocolsApi.ts          # Protocols and executions
├── zoteroApi.ts             # Zotero integration
├── recipesApi.ts            # Recipes and executions
├── literatureNotesApi.ts    # Literature notes
├── tasksApi.ts              # Task management
├── taskTemplatesApi.ts      # Task templates
├── taskDependenciesApi.ts   # Task dependencies
├── searchApi.ts             # Advanced search
├── notificationsApi.ts      # Notifications
├── calendarApi.ts           # Calendar integrations
├── experimentalVariablesApi.ts # Experimental variables
└── advancedReportingApi.ts  # Advanced reporting
```

### Benefits
- ✅ **Separation of Concerns** - Each module has a single responsibility
- ✅ **Modularity** - Import only what you need
- ✅ **Maintainability** - Smaller files, easier to navigate
- ✅ **Reusability** - Consistent patterns, shared base client
- ✅ **Type Safety** - Better TypeScript support
- ✅ **Backward Compatibility** - Existing imports continue to work

### Usage

```typescript
// Import specific APIs
import { notesApi, projectsApi, pdfsApi } from '../services/api';

// Import all APIs
import * as api from '../services/api';

// Import base client
import { api as apiClient } from '../services/api';
```

## 2. Projects Component Refactoring

### Before
- Single `Projects.tsx` file with 1,431 lines
- Multiple responsibilities mixed together
- Complex state management
- Duplicate linking logic

### After
- **6 focused components** with clear responsibilities
- **2 custom hooks** for reusable logic
- **1 types file** for better type safety
- **Reduced main file** from 1,431 to ~376 lines

### New Structure

```
src/components/Projects/
├── index.ts                 # Barrel exports
├── README.md                # Documentation
├── ProjectForm.tsx          # Project creation/editing forms
├── ExperimentForm.tsx       # Experiment creation/editing forms
├── ProjectCard.tsx          # Individual project display
└── ProjectFilters.tsx       # Project status filtering

src/hooks/
├── index.ts                 # Barrel exports
├── useProjectOperations.ts  # CRUD operations and state
└── useProjectLinking.ts     # Entity linking logic

src/types/
└── project.ts               # Project-related types
```

### Components

#### ProjectForm
- Handles project creation and editing forms
- Entity linking (notes, database entries, protocols, recipes, PDFs)
- Form validation and status management

#### ExperimentForm
- Handles experiment creation and editing forms
- Simple form with name and description
- Form validation

#### ProjectCard
- Displays individual project information
- Experiment list with actions
- Color-coded borders and action buttons

#### ProjectFilters
- Manages project status filtering
- Status filter buttons (Active, Archived, Future)

### Custom Hooks

#### useProjectOperations
- Manages all project CRUD operations and state
- Project loading, creating, updating, deleting
- Experiment operations
- Error handling and loading states
- Snackbar notifications

#### useProjectLinking
- Manages entity linking for projects
- Notes, database entries, protocols, recipes, PDFs linking
- Create and unlink operations

### Benefits
- ✅ **Separation of Concerns** - Each component has a single responsibility
- ✅ **Reusability** - Components can be used elsewhere
- ✅ **Maintainability** - Much easier to debug and modify
- ✅ **Testability** - Smaller components are easier to unit test
- ✅ **Performance** - Better code splitting potential
- ✅ **Developer Experience** - Cleaner, more readable code

## 3. Export Components Refactoring

### Before
- Single `AdvancedCitationExport.tsx` file with 600 lines
- Mixed concerns (citation formatting, timeline export, UI logic)
- Hard to maintain and test
- Difficult to reuse individual pieces

### After
- **3 focused components** with clear responsibilities
- **2 utility files** for reusable logic
- **1 constants file** for citation styles
- **Reduced main file** from 600 to ~120 lines

### New Structure

```
src/components/Export/
├── index.ts                    # Barrel exports
├── README.md                   # Documentation
├── AdvancedCitationExport.tsx  # Main orchestration component
├── CitationExport.tsx          # Citation export component
└── TimelineExport.tsx          # Timeline export component

src/utils/
├── citationFormatter.ts        # Citation formatting utilities
└── exportFormatters.ts         # Export format generation

src/constants/
└── citationStyles.ts           # Citation style definitions
```

### Components

#### AdvancedCitationExport
- Main dialog component that orchestrates exports
- Tab-based interface for different export types
- Shared state management for loading and error handling

#### CitationExport
- Handles citation export with style selection
- Citation style selection (APA, MLA, Chicago, IEEE, etc.)
- Literature note selection with checkboxes
- Multiple export formats (TXT, RTF, HTML, DOCX, BibTeX)

#### TimelineExport
- Handles research timeline export
- Timeline data generation from projects, experiments, and protocols
- Export format options (CSV, JSON, Excel)

### Utilities

#### citationFormatter.ts
- Citation formatting for different styles
- CSL format conversion
- Author name parsing

#### exportFormatters.ts
- RTF, HTML, DOCX, BibTeX generation
- Timeline data formatting
- Export format utilities

### Benefits
- ✅ **Separation of Concerns** - Each component has a single responsibility
- ✅ **Reusability** - Individual components and utilities can be used elsewhere
- ✅ **Maintainability** - Smaller files, easier to navigate and modify
- ✅ **Testability** - Individual components and utilities are easier to unit test
- ✅ **Type Safety** - Better TypeScript support with focused interfaces

## Migration Guidelines

### API Services

**Before:**
```typescript
import { notesApi, projectsApi } from '../services/api';
```

**After:**
```typescript
// Same import still works!
import { notesApi, projectsApi } from '../services/api';

// Or import from specific modules
import { notesApi } from '../services/api/notesApi';
import { projectsApi } from '../services/api/projectsApi';
```

### Projects Component

**Before:**
```typescript
import Projects from '../pages/Projects';
```

**After:**
```typescript
// Same import still works!
import Projects from '../pages/Projects';

// Or import individual components
import { ProjectForm, ProjectCard } from '../components/Projects';
import { useProjectOperations } from '../hooks/useProjectOperations';
```

### Export Components

**Before:**
```typescript
import AdvancedCitationExport from '../components/Export/AdvancedCitationExport';
```

**After:**
```typescript
// Same import still works!
import AdvancedCitationExport from '../components/Export/AdvancedCitationExport';

// Or import specific components
import { CitationExport, TimelineExport } from '../components/Export';
```

## Best Practices Established

### 1. Component Structure
- **Single Responsibility**: Each component has one clear purpose
- **Props Interface**: Well-defined prop types for all components
- **Error Handling**: Consistent error handling patterns
- **Loading States**: Proper loading state management

### 2. Hook Patterns
- **Custom Hooks**: Extract reusable logic into custom hooks
- **State Management**: Centralized state management for related operations
- **Error Boundaries**: Proper error handling in hooks

### 3. Utility Organization
- **Separation of Concerns**: Business logic separated from UI logic
- **Pure Functions**: Utility functions are pure and testable
- **Type Safety**: Strong typing for all utility functions

### 4. File Organization
- **Barrel Exports**: Use index files for clean imports
- **Consistent Naming**: Follow consistent naming conventions
- **Documentation**: Comprehensive README files for each module

## Testing Strategy

### Unit Testing
- **Component Testing**: Test individual components in isolation
- **Hook Testing**: Test custom hooks with proper mocking
- **Utility Testing**: Test utility functions with various inputs

### Integration Testing
- **API Integration**: Test API modules with mock responses
- **Component Integration**: Test component interactions
- **User Flows**: Test complete user workflows

## Performance Considerations

### Code Splitting
- **Lazy Loading**: Components can be lazy-loaded as needed
- **Tree Shaking**: Better tree-shaking with modular imports
- **Bundle Size**: Reduced bundle size through better organization

### State Management
- **Local State**: Use local state when possible
- **Shared State**: Use custom hooks for shared state
- **Optimization**: Avoid unnecessary re-renders

## Future Improvements

### Planned Enhancements
1. **Storybook Integration**: Add Storybook for component documentation
2. **Performance Monitoring**: Add performance monitoring tools
3. **Automated Testing**: Expand test coverage
4. **TypeScript Strict Mode**: Enable strict TypeScript mode

### Potential Refactoring Candidates
1. **Other Large Components**: Identify and refactor other large components
2. **Shared Utilities**: Extract more shared utilities
3. **State Management**: Consider global state management if needed
4. **Error Handling**: Implement global error boundaries

## Conclusion

The refactoring work has significantly improved the codebase by:

- **Reducing Complexity**: Breaking down large files into manageable pieces
- **Improving Maintainability**: Making code easier to understand and modify
- **Enhancing Reusability**: Creating reusable components and utilities
- **Better Developer Experience**: Cleaner imports and better TypeScript support
- **Maintaining Compatibility**: Ensuring existing code continues to work

These improvements provide a solid foundation for future development and make the codebase more scalable and maintainable. 