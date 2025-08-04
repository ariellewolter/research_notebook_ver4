# Research Notebook Frontend

A modern React-based frontend for a comprehensive research notebook application, featuring project management, citation handling, and data export capabilities.

## 🏗️ Architecture Overview

This application follows a modular, component-based architecture with clear separation of concerns:

### Core Structure
```
src/
├── components/           # Reusable UI components
│   ├── Projects/        # Project management components
│   ├── Export/          # Export functionality components
│   └── ...              # Other component categories
├── services/            # API and service layer
│   └── api/            # Modular API services
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── constants/          # Application constants
├── types/              # TypeScript type definitions
└── pages/              # Page-level components
```

## 🚀 Key Features

### Project Management
- **Project Creation & Editing**: Full CRUD operations for research projects
- **Experiment Tracking**: Manage experiments within projects
- **Status Management**: Track project status (Active, Archived, Future)
- **Entity Linking**: Connect projects to notes, protocols, recipes, and PDFs

### Citation Management
- **Multiple Citation Styles**: Support for APA, MLA, Chicago, IEEE, and more
- **Export Formats**: TXT, RTF, HTML, DOCX, and BibTeX export
- **Literature Notes**: Comprehensive literature note management
- **Zotero Integration**: Sync with Zotero reference manager

### Data Export
- **Research Timeline**: Export project timelines in CSV, JSON, and Excel formats
- **Advanced Export**: Customizable export options with metadata
- **Batch Operations**: Export multiple items simultaneously

### Task Management
- **Task Creation**: Create and manage research tasks
- **Time Tracking**: Track time spent on tasks
- **Dependencies**: Manage task dependencies and workflows
- **Templates**: Use task templates for common workflows

## 🛠️ Technology Stack

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Material-UI (MUI)** - Component library for consistent UI
- **Axios** - HTTP client for API communication
- **React Router** - Client-side routing
- **File System API** - Native file system integration

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## 🏛️ Code Architecture

### Modular API Services

The application uses a modular API architecture with 20+ focused API modules:

```typescript
// Import specific APIs
import { notesApi, projectsApi, pdfsApi } from '../services/api';

// Import all APIs
import * as api from '../services/api';
```

**API Modules:**
- `notesApi` - Notes CRUD operations
- `projectsApi` - Projects and experiments management
- `pdfsApi` - PDF upload and management
- `databaseApi` - Database entries
- `linksApi` - Entity linking
- `tablesApi` - Data tables
- `protocolsApi` - Protocols and executions
- `zoteroApi` - Zotero integration
- `tasksApi` - Task management
- And more...

### Component Architecture

Components are organized by feature with clear separation of concerns:

#### Projects Module
```typescript
// Main Projects page
import Projects from '../pages/Projects';

// Individual components
import { ProjectForm, ProjectCard, ProjectFilters } from '../components/Projects';

// Custom hooks
import { useProjectOperations, useProjectLinking } from '../hooks';
```

#### Export Module
```typescript
// Main export dialog
import { AdvancedCitationExport } from '../components/Export';

// Individual export components
import { CitationExport, TimelineExport } from '../components/Export';
```

### Custom Hooks

Reusable logic is extracted into custom hooks:

```typescript
// Project operations hook
const {
  projects,
  loading,
  error,
  createProject,
  updateProject,
  deleteProject
} = useProjectOperations();

// Project linking hook
const {
  linkedNotes,
  handleLinkNote,
  handleUnlinkNote
} = useProjectLinking(projectId);
```

## 🔧 Development Guidelines

### Component Structure

1. **Single Responsibility**: Each component has one clear purpose
2. **Props Interface**: Well-defined prop types for all components
3. **Error Handling**: Consistent error handling patterns
4. **Loading States**: Proper loading state management

### Code Organization

1. **Barrel Exports**: Use index files for clean imports
2. **Consistent Naming**: Follow consistent naming conventions
3. **Documentation**: Comprehensive README files for each module
4. **Type Safety**: Strong typing for all functions and components

### Best Practices

1. **Custom Hooks**: Extract reusable logic into custom hooks
2. **Utility Functions**: Keep business logic separate from UI logic
3. **Error Boundaries**: Implement proper error handling
4. **Performance**: Use React.memo and useMemo when appropriate

## 📚 Documentation

- **[Refactoring Guide](./REFACTORING_GUIDE.md)** - Comprehensive guide to the refactored architecture
- **[API Services](./src/services/api/README.md)** - API services documentation
- **[Projects Components](./src/components/Projects/README.md)** - Projects module documentation
- **[Export Components](./src/components/Export/README.md)** - Export functionality documentation

## 🧪 Testing

### Unit Testing
- **Component Testing**: Test individual components in isolation
- **Hook Testing**: Test custom hooks with proper mocking
- **Utility Testing**: Test utility functions with various inputs

### Integration Testing
- **API Integration**: Test API modules with mock responses
- **Component Integration**: Test component interactions
- **User Flows**: Test complete user workflows

## 🚀 Performance

### Code Splitting
- **Lazy Loading**: Components can be lazy-loaded as needed
- **Tree Shaking**: Better tree-shaking with modular imports
- **Bundle Size**: Reduced bundle size through better organization

### State Management
- **Local State**: Use local state when possible
- **Shared State**: Use custom hooks for shared state
- **Optimization**: Avoid unnecessary re-renders

## 🔄 Migration

The codebase maintains backward compatibility while providing new modular imports:

```typescript
// Old imports still work
import { notesApi, projectsApi } from '../services/api';
import Projects from '../pages/Projects';
import AdvancedCitationExport from '../components/Export/AdvancedCitationExport';

// New modular imports available
import { notesApi } from '../services/api/notesApi';
import { ProjectForm, ProjectCard } from '../components/Projects';
import { CitationExport, TimelineExport } from '../components/Export';
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow coding standards**: Use TypeScript, follow component patterns
4. **Add tests**: Ensure new features are properly tested
5. **Update documentation**: Keep documentation up to date
6. **Submit a pull request**

### Development Workflow

1. **Code Review**: All changes require code review
2. **Testing**: Ensure all tests pass
3. **Documentation**: Update relevant documentation
4. **Type Safety**: Maintain TypeScript strict mode compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [documentation](./REFACTORING_GUIDE.md)
- Review existing issues
- Create a new issue with detailed information

## 🗺️ Roadmap

### Planned Features
- [ ] Storybook integration for component documentation
- [ ] Performance monitoring tools
- [ ] Expanded test coverage
- [ ] TypeScript strict mode enforcement
- [ ] Global error boundaries
- [ ] Advanced search functionality
- [ ] Real-time collaboration features

### Technical Improvements
- [ ] Service worker for offline support
- [ ] Progressive Web App (PWA) features
- [ ] Advanced caching strategies
- [ ] Performance optimization
- [ ] Accessibility improvements 