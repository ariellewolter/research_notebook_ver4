# Developer Quick Reference

A quick reference guide for working with the refactored codebase.

## 🚀 Quick Start

### Importing APIs
```typescript
// Import specific APIs
import { notesApi, projectsApi, pdfsApi } from '../services/api';

// Import from specific modules
import { notesApi } from '../services/api/notesApi';
import { projectsApi } from '../services/api/projectsApi';
```

### Using Project Components
```typescript
// Main Projects page
import Projects from '../pages/Projects';

// Individual components
import { ProjectForm, ProjectCard, ProjectFilters } from '../components/Projects';

// Custom hooks
import { useProjectOperations, useProjectLinking } from '../hooks';
```

### Using Export Components
```typescript
// Main export dialog
import { AdvancedCitationExport } from '../components/Export';

// Individual export components
import { CitationExport, TimelineExport } from '../components/Export';
```

## 📁 File Structure

```
src/
├── components/
│   ├── Projects/           # Project management
│   │   ├── index.ts
│   │   ├── ProjectForm.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ExperimentForm.tsx
│   │   └── ProjectFilters.tsx
│   ├── Export/             # Export functionality
│   │   ├── index.ts
│   │   ├── AdvancedCitationExport.tsx
│   │   ├── CitationExport.tsx
│   │   └── TimelineExport.tsx
│   └── ...
├── services/
│   └── api/               # Modular API services
│       ├── index.ts
│       ├── apiClient.ts
│       ├── notesApi.ts
│       ├── projectsApi.ts
│       ├── pdfsApi.ts
│       └── ...
├── hooks/
│   ├── index.ts
│   ├── useProjectOperations.ts
│   └── useProjectLinking.ts
├── utils/
│   ├── citationFormatter.ts
│   └── exportFormatters.ts
├── constants/
│   └── citationStyles.ts
├── types/
│   └── project.ts
└── pages/
    └── Projects.tsx
```

## 🔧 Common Patterns

### Custom Hook Pattern
```typescript
// hooks/useProjectOperations.ts
export const useProjectOperations = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const response = await projectsApi.getAll();
            setProjects(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        projects,
        loading,
        error,
        loadProjects
    };
};
```

### Component Pattern
```typescript
// components/ProjectCard.tsx
interface ProjectCardProps {
    project: Project;
    onEdit: (project: Project) => void;
    onDelete: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
    project,
    onEdit,
    onDelete
}) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6">{project.name}</Typography>
                <Typography variant="body2">{project.description}</Typography>
                <Button onClick={() => onEdit(project)}>Edit</Button>
                <Button onClick={() => onDelete(project.id)}>Delete</Button>
            </CardContent>
        </Card>
    );
};
```

### API Module Pattern
```typescript
// services/api/notesApi.ts
import api from './apiClient';

export const notesApi = {
    getAll: (params?: any) => api.get('/notes', { params }),
    getById: (id: string) => api.get(`/notes/${id}`),
    create: (data: any) => api.post('/notes', data),
    update: (id: string, data: any) => api.put(`/notes/${id}`, data),
    delete: (id: string) => api.delete(`/notes/${id}`),
};
```

## 🎯 Common Use Cases

### Creating a New Project
```typescript
const { createProject, loading } = useProjectOperations();

const handleCreateProject = async (projectData: any) => {
    try {
        await createProject(projectData);
        // Handle success
    } catch (error) {
        // Handle error
    }
};
```

### Linking Entities
```typescript
const { handleLinkNote, handleUnlinkNote } = useProjectLinking(projectId);

const linkNote = async (noteId: string) => {
    await handleLinkNote(noteId);
};
```

### Exporting Citations
```typescript
import { formatCitation } from '../utils/citationFormatter';

const citation = formatCitation(literatureNote, 'apa');
```

### Exporting Timeline
```typescript
import { generateTimelineData } from '../utils/exportFormatters';

const timeline = generateTimelineData(projects, experiments, protocols);
```

## 🔍 Debugging

### API Debugging
```typescript
// Check API responses
const response = await notesApi.getAll();
console.log('API Response:', response.data);

// Check for errors
try {
    await notesApi.create(data);
} catch (error) {
    console.error('API Error:', error.response?.data);
}
```

### Component Debugging
```typescript
// Add console logs to track state changes
useEffect(() => {
    console.log('Projects updated:', projects);
}, [projects]);

// Check prop values
console.log('Project props:', { project, onEdit, onDelete });
```

## 🧪 Testing

### Testing Components
```typescript
import { render, screen } from '@testing-library/react';
import ProjectCard from '../components/Projects/ProjectCard';

test('renders project name', () => {
    const project = { id: '1', name: 'Test Project' };
    render(<ProjectCard project={project} onEdit={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
});
```

### Testing Hooks
```typescript
import { renderHook } from '@testing-library/react-hooks';
import { useProjectOperations } from '../hooks/useProjectOperations';

test('loads projects', async () => {
    const { result } = renderHook(() => useProjectOperations());
    await result.current.loadProjects();
    expect(result.current.projects).toHaveLength(1);
});
```

### Testing Utilities
```typescript
import { formatCitation } from '../utils/citationFormatter';

test('formats APA citation correctly', () => {
    const note = { title: 'Test Paper', authors: 'John Doe', year: '2023' };
    const citation = formatCitation(note, 'apa');
    expect(citation).toContain('Doe, J. (2023)');
});
```

## 📚 Key Files

### Main Components
- `src/pages/Projects.tsx` - Main projects page
- `src/components/Projects/ProjectForm.tsx` - Project form
- `src/components/Export/AdvancedCitationExport.tsx` - Export dialog

### Custom Hooks
- `src/hooks/useProjectOperations.ts` - Project CRUD operations
- `src/hooks/useProjectLinking.ts` - Entity linking logic

### Utilities
- `src/utils/citationFormatter.ts` - Citation formatting
- `src/utils/exportFormatters.ts` - Export format generation

### API Services
- `src/services/api/apiClient.ts` - Base API client
- `src/services/api/projectsApi.ts` - Projects API
- `src/services/api/notesApi.ts` - Notes API

## 🚨 Common Issues

### Import Errors
```typescript
// ❌ Wrong
import { notesApi } from '../services/api.ts';

// ✅ Correct
import { notesApi } from '../services/api';
```

### Type Errors
```typescript
// ❌ Missing type
const project = { name: 'Test' };

// ✅ With type
const project: Project = { id: '1', name: 'Test', status: 'active' };
```

### Hook Dependencies
```typescript
// ❌ Missing dependency
useEffect(() => {
    loadProjects();
}, []); // Missing loadProjects dependency

// ✅ Correct
useEffect(() => {
    loadProjects();
}, [loadProjects]);
```

## 🔄 Migration Notes

### Old vs New Imports
```typescript
// Old (still works)
import { notesApi, projectsApi } from '../services/api';

// New (recommended)
import { notesApi } from '../services/api/notesApi';
import { projectsApi } from '../services/api/projectsApi';
```

### Component Usage
```typescript
// Old monolithic component
<Projects />

// New modular components
<ProjectForm />
<ProjectCard />
<ProjectFilters />
```

## 📖 Additional Resources

- [Refactoring Guide](./REFACTORING_GUIDE.md) - Detailed refactoring documentation
- [API Services README](./src/services/api/README.md) - API services documentation
- [Projects Components README](./src/components/Projects/README.md) - Projects module documentation
- [Export Components README](./src/components/Export/README.md) - Export functionality documentation 