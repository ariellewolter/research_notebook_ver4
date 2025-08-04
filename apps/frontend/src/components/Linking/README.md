# Linking Components

A comprehensive, reusable linking system that allows any entity type to be linked to any other entity type using TypeScript generics.

## 🎯 Overview

The Linking system provides:

- **Generic LinkingComponent** - Works with any entity type using TypeScript generics
- **Custom useLinking Hook** - Manages linking state and operations
- **Predefined Configurations** - Ready-to-use configs for common entity types
- **Convenience Components** - Type-specific components for quick implementation
- **Flexible Rendering** - Customizable entity and form rendering

## 🏗️ Architecture

```
src/components/Linking/
├── index.ts                    # Barrel exports
├── README.md                   # This documentation
└── LinkingComponent.tsx        # Main generic component

src/hooks/
└── useLinking.ts              # Generic linking hook

src/types/
└── linking.ts                 # TypeScript types and configurations
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { ProtocolLinkingComponent } from '../components/Linking';

// Link protocols to a project
<ProtocolLinkingComponent
  sourceType="project"
  sourceId="project-123"
  title="Project Protocols"
/>
```

### Advanced Usage

```typescript
import { LinkingComponent, ENTITY_CONFIGS } from '../components/Linking';

// Custom configuration
<LinkingComponent
  sourceType="experiment"
  sourceId="exp-456"
  config={ENTITY_CONFIGS.recipe}
  title="Experiment Recipes"
  showCreateButton={true}
  showSearch={true}
  maxHeight="300px"
  onLinkChange={(linkedRecipes) => console.log('Linked recipes:', linkedRecipes)}
/>
```

## 📋 API Reference

### LinkingComponent Props

```typescript
interface LinkingComponentProps<T extends BaseEntity> {
  sourceType: EntityType;           // Type of the source entity
  sourceId: string;                 // ID of the source entity
  config: LinkingConfig<T>;         // Configuration for the target entity type
  title?: string;                   // Custom title for the component
  showCreateButton?: boolean;       // Show create button (default: true)
  showSearch?: boolean;             // Show search field (default: true)
  maxHeight?: string;               // Max height for lists (default: '400px')
  className?: string;               // CSS class name
  onLinkChange?: (linked: T[]) => void; // Callback when links change
  renderEntity?: (entity: T, isLinked: boolean) => React.ReactNode; // Custom entity renderer
  renderCreateForm?: (onSubmit: (data: Partial<T>) => void, onCancel: () => void) => React.ReactNode; // Custom form renderer
}
```

### useLinking Hook

```typescript
const {
  linked,      // Currently linked entities
  all,         // All available entities
  loading,     // Loading state
  creating,    // Creating state
  error,       // Error message
  link,        // Link an entity
  unlink,      // Unlink an entity
  create,      // Create and link an entity
  refresh      // Refresh data
} = useLinking(sourceType, sourceId, config);
```

## 🎨 Convenience Components

### Pre-built Components

```typescript
// For common entity types
<NoteLinkingComponent sourceType="project" sourceId="123" />
<ProjectLinkingComponent sourceType="note" sourceId="456" />
<ProtocolLinkingComponent sourceType="experiment" sourceId="789" />
<RecipeLinkingComponent sourceType="protocol" sourceId="abc" />
<PDFLinkingComponent sourceType="project" sourceId="def" />
<DatabaseEntryLinkingComponent sourceType="note" sourceId="ghi" />
<TaskLinkingComponent sourceType="project" sourceId="jkl" />
```

### Custom Entity Types

```typescript
// Define custom configuration
const customConfig: LinkingConfig<CustomEntity> = {
  entityType: 'custom',
  displayName: 'Custom Item',
  displayField: 'name',
  descriptionField: 'description',
  apiModule: {
    getAll: () => customApi.getAll(),
    create: (data) => customApi.create(data)
  },
  createFormFields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' }
  ]
};

// Use with generic component
<LinkingComponent
  sourceType="project"
  sourceId="123"
  config={customConfig}
/>
```

## 🎯 Use Cases

### 1. Project Management

```typescript
// Link protocols, recipes, and PDFs to a project
<Box>
  <ProtocolLinkingComponent
    sourceType="project"
    sourceId={projectId}
    title="Project Protocols"
  />
  <RecipeLinkingComponent
    sourceType="project"
    sourceId={projectId}
    title="Project Recipes"
  />
  <PDFLinkingComponent
    sourceType="project"
    sourceId={projectId}
    title="Project Documents"
  />
</Box>
```

### 2. Experiment Setup

```typescript
// Link protocols and recipes to an experiment
<Box>
  <ProtocolLinkingComponent
    sourceType="experiment"
    sourceId={experimentId}
    title="Experiment Protocols"
  />
  <RecipeLinkingComponent
    sourceType="experiment"
    sourceId={experimentId}
    title="Experiment Recipes"
  />
</Box>
```

### 3. Note Organization

```typescript
// Link projects and tasks to a note
<Box>
  <ProjectLinkingComponent
    sourceType="note"
    sourceId={noteId}
    title="Related Projects"
  />
  <TaskLinkingComponent
    sourceType="note"
    sourceId={noteId}
    title="Related Tasks"
  />
</Box>
```

## 🎨 Customization

### Custom Entity Rendering

```typescript
<ProtocolLinkingComponent
  sourceType="project"
  sourceId={projectId}
  renderEntity={(protocol, isLinked) => (
    <ListItem>
      <ListItemText
        primary={protocol.name}
        secondary={`${protocol.category} • ${protocol.steps?.length || 0} steps`}
      />
      <Chip 
        label={protocol.category} 
        size="small" 
        color="primary" 
      />
      <IconButton onClick={() => isLinked ? unlink(protocol.id) : link(protocol.id)}>
        {isLinked ? <UnlinkIcon /> : <LinkIcon />}
      </IconButton>
    </ListItem>
  )}
/>
```

### Custom Create Form

```typescript
<RecipeLinkingComponent
  sourceType="protocol"
  sourceId={protocolId}
  renderCreateForm={(onSubmit, onCancel) => (
    <Box>
      <TextField
        fullWidth
        label="Recipe Name"
        margin="normal"
        required
      />
      <TextField
        fullWidth
        label="Category"
        margin="normal"
        select
      >
        <MenuItem value="media">Media</MenuItem>
        <MenuItem value="buffer">Buffer</MenuItem>
        <MenuItem value="solution">Solution</MenuItem>
      </TextField>
      <Button onClick={() => onSubmit({ name: 'New Recipe', category: 'media' })}>
        Create
      </Button>
    </Box>
  )}
/>
```

## 🔧 Configuration

### Entity Configuration

```typescript
interface LinkingConfig<T extends BaseEntity> {
  entityType: EntityType;                    // Entity type identifier
  displayName: string;                       // Human-readable name
  displayField: keyof T;                     // Field to display as primary text
  descriptionField?: keyof T;                // Field to display as secondary text
  apiModule: {                               // API methods
    getAll: () => Promise<{ data: T[] }>;
    create: (data: Partial<T>) => Promise<{ data: T }>;
  };
  createFormFields?: FormField[];            // Form fields for creation
  defaultCreateData?: Partial<T>;            // Default values for new entities
}
```

### Form Field Configuration

```typescript
interface FormField {
  name: string;                              // Field name
  label: string;                             // Display label
  type: 'text' | 'textarea' | 'select';      // Input type
  required?: boolean;                        // Required field
  options?: { value: string; label: string }[]; // Options for select fields
}
```

## 🧪 Testing

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ProtocolLinkingComponent } from '../components/Linking';

test('renders protocol linking component', () => {
  render(
    <ProtocolLinkingComponent
      sourceType="project"
      sourceId="test-project"
    />
  );
  
  expect(screen.getByText('Protocols')).toBeInTheDocument();
});
```

### Hook Testing

```typescript
import { renderHook } from '@testing-library/react-hooks';
import { useLinking } from '../hooks/useLinking';

test('loads linking data', async () => {
  const { result } = renderHook(() => 
    useLinking('project', 'test-id', ENTITY_CONFIGS.protocol)
  );
  
  expect(result.current.loading).toBe(true);
  // Test loading states and data
});
```

## 🚨 Error Handling

The component handles various error scenarios:

- **API Errors**: Displays error messages for failed API calls
- **Network Issues**: Shows appropriate error states
- **Validation Errors**: Form validation with user feedback
- **Permission Errors**: Handles unauthorized access gracefully

## 🔄 Migration from useProjectLinking

### Before (Old Pattern)

```typescript
const {
  linkedProtocols,
  allProtocols,
  handleLinkProtocol,
  handleUnlinkProtocol,
  handleCreateProtocol
} = useProjectLinking(projectId);

// Manual rendering
{linkedProtocols.map(protocol => (
  <ListItem key={protocol.id}>
    <ListItemText primary={protocol.name} />
    <IconButton onClick={() => handleUnlinkProtocol(protocol.id)}>
      <UnlinkIcon />
    </IconButton>
  </ListItem>
))}
```

### After (New Pattern)

```typescript
<ProtocolLinkingComponent
  sourceType="project"
  sourceId={projectId}
  title="Project Protocols"
  onLinkChange={(linked) => console.log('Protocols updated:', linked)}
/>
```

## 📈 Performance Considerations

- **Lazy Loading**: Entities are loaded only when needed
- **Debounced Search**: Search input is debounced to prevent excessive API calls
- **Optimistic Updates**: UI updates immediately for better UX
- **Error Recovery**: Automatic retry on network failures
- **Memory Management**: Proper cleanup of event listeners and subscriptions

## 🔮 Future Enhancements

- **Bulk Operations**: Link/unlink multiple entities at once
- **Advanced Filtering**: Filter by categories, tags, or custom criteria
- **Drag & Drop**: Visual linking with drag and drop interface
- **Link Types**: Different types of relationships between entities
- **Link Visualization**: Graph view of entity relationships
- **Import/Export**: Bulk import/export of entity links

## 📚 Related Documentation

- [API Services](../services/api/README.md) - API modules used by linking components
- [Project Components](../Projects/README.md) - Project management components
- [TypeScript Types](../../types/) - Type definitions and interfaces 