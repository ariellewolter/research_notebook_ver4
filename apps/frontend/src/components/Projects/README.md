# Projects Components

This directory contains the refactored components for the Projects page, breaking down the original monolithic `Projects.tsx` file into smaller, more manageable components.

## Components

### ProjectForm
- **Purpose**: Handles project creation and editing forms
- **Features**: 
  - Form validation
  - Universal linking support
  - Entity linking (notes, database entries, protocols, recipes, PDFs)
  - Status management
- **Props**: `open`, `onClose`, `project`, `onSave`, `saving`

### ExperimentForm
- **Purpose**: Handles experiment creation and editing forms
- **Features**:
  - Simple form with name and description
  - Form validation
- **Props**: `open`, `onClose`, `experiment`, `projectId`, `onSave`, `saving`

### ProjectCard
- **Purpose**: Displays individual project information
- **Features**:
  - Project details display
  - Experiment list
  - Action buttons (edit, delete, add experiment)
  - Color-coded borders
- **Props**: `project`, `onEdit`, `onDelete`, `onAddExperiment`, `onEditExperiment`, `onDeleteExperiment`

### ProjectFilters
- **Purpose**: Handles project filtering by status
- **Features**:
  - Status filter buttons (Active, Archived, Future)
- **Props**: `statusTab`, `onStatusChange`

## Custom Hooks

### useProjectOperations
- **Purpose**: Manages all project CRUD operations and state
- **Features**:
  - Project loading, creating, updating, deleting
  - Experiment operations
  - Error handling
  - Loading states
  - Snackbar notifications
  - Status filtering

### useProjectLinking
- **Purpose**: Manages entity linking for projects
- **Features**:
  - Notes linking
  - Database entries linking
  - Protocols linking
  - Recipes linking
  - PDFs linking
  - Create and unlink operations

## Types

### Project
```typescript
interface Project {
    id: string;
    name: string;
    description?: string;
    status: ProjectStatus;
    startDate?: string | null;
    lastActivity?: string | null;
    createdAt: string;
    experiments?: Experiment[];
}
```

### Experiment
```typescript
interface Experiment {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
}
```

### ProjectStatus
```typescript
type ProjectStatus = 'active' | 'archived' | 'future';
```

## Usage

The main `Projects.tsx` page now uses these components and hooks to provide a clean, maintainable structure:

```typescript
import { ProjectForm, ExperimentForm, ProjectCard, ProjectFilters } from '../components/Projects';
import { useProjectOperations } from '../hooks/useProjectOperations';

const Projects: React.FC = () => {
    const {
        projects,
        filteredProjects,
        loading,
        error,
        saving,
        statusTab,
        snackbar,
        setStatusTab,
        loadProjects,
        createProject,
        updateProject,
        deleteProject,
        createExperiment,
        updateExperiment,
        deleteExperiment,
        closeSnackbar,
    } = useProjectOperations();

    // Component logic...
};
```

## Benefits of Refactoring

1. **Separation of Concerns**: Each component has a single responsibility
2. **Reusability**: Components can be reused in other parts of the application
3. **Maintainability**: Easier to debug and modify individual components
4. **Testability**: Smaller components are easier to unit test
5. **Performance**: Better code splitting and potential for optimization
6. **Developer Experience**: Easier to understand and work with smaller files

## File Structure

```
src/
├── components/
│   └── Projects/
│       ├── index.ts
│       ├── ProjectForm.tsx
│       ├── ExperimentForm.tsx
│       ├── ProjectCard.tsx
│       ├── ProjectFilters.tsx
│       └── README.md
├── hooks/
│   ├── index.ts
│   ├── useProjectOperations.ts
│   └── useProjectLinking.ts
├── types/
│   └── project.ts
└── pages/
    └── Projects.tsx (refactored)
``` 