# Frontend Deep Linking Implementation

## Overview

This document describes the frontend implementation of deep linking for the Research Notebook application. The system provides seamless integration between Electron deep link events and React Router navigation, allowing users to navigate directly to specific entities and views within the application.

## Architecture

### Components

1. **DeepLinkRouter** - Main router component that listens for deep link events
2. **useDeepLinking** - Custom hook for deep linking functionality
3. **DeepLinkDemo** - Demo component showcasing deep linking features

### Integration Points

- **Electron IPC** - Communication between main process and renderer
- **React Router** - Navigation handling
- **React Hooks** - State management and side effects

## Core Components

### 1. DeepLinkRouter Component

The `DeepLinkRouter` component is the main orchestrator that:
- Listens for deep link events from the Electron main process
- Parses deep link entities and parameters
- Maps entities to React Router routes
- Handles navigation with proper query parameters

#### Key Features

```typescript
interface DeepLinkEntity {
    entityType: string;
    entityId?: string;
    params: Record<string, any>;
}
```

#### Route Mapping

```typescript
const DEEP_LINK_ROUTES: Record<string, (entityId?: string, params?: Record<string, any>) => string> = {
    note: (entityId, params) => {
        if (!entityId) return '/notes';
        const queryParams = new URLSearchParams();
        if (params?.mode) queryParams.set('mode', params.mode);
        if (params?.section) queryParams.set('section', params.section);
        const queryString = queryParams.toString();
        return `/notes/${entityId}${queryString ? `?${queryString}` : ''}`;
    },
    // ... other entity types
};
```

#### Event Handling

```typescript
// Listen for deep link entity events from main process
const handleDeepLinkEntity = (event: any, entity: DeepLinkEntity) => {
    if (!isInitialized.current) {
        pendingDeepLinks.current.push(entity);
        return;
    }
    handleDeepLinkNavigation(entity);
};

// Set up the listener
electronAPI.onDeepLinkEntity(handleDeepLinkEntity);
```

### 2. useDeepLinking Hook

The `useDeepLinking` hook provides a clean API for deep linking functionality:

#### Core Methods

```typescript
const {
    createDeepLink,
    openDeepLink,
    getDeepLinkContext,
    createNoteLink,
    createProjectLink,
    createPDFLink,
    createProtocolLink,
    createRecipeLink,
    createTaskLink,
    createSearchLink,
    createDashboardLink,
    copyDeepLinkToClipboard,
    shareDeepLink,
    isElectron
} = useDeepLinking();
```

#### Usage Examples

```typescript
// Create a deep link
const result = await createDeepLink('note', '123', { mode: 'edit' });

// Open a deep link
const result = await openDeepLink('researchnotebook://note/123?mode=edit');

// Create a note link
const result = await createNoteLink('123', { mode: 'edit', section: 'content' });

// Copy to clipboard
const result = await copyDeepLinkToClipboard('project', '456', { view: 'overview' });

// Share deep link
const result = await shareDeepLink('search', undefined, { q: 'research' });
```

### 3. DeepLinkDemo Component

The `DeepLinkDemo` component provides a comprehensive testing interface for deep linking functionality:

#### Features

- **Quick Actions** - Pre-configured deep link examples
- **Custom Generator** - Create custom deep links with parameters
- **Link Display** - Show generated links with copy/share options
- **Example Links** - Reference examples for all entity types

## Route Mapping

### Supported Entity Types

| Entity Type | Route Pattern | Example |
|-------------|---------------|---------|
| note | `/notes/{id}?{params}` | `/notes/123?mode=edit&section=content` |
| project | `/projects/{id}?{params}` | `/projects/456?view=overview&tab=details` |
| pdf | `/pdfs/{id}?{params}` | `/pdfs/document.pdf?page=10&zoom=1.2` |
| protocol | `/protocols/{id}?{params}` | `/protocols/789?step=3&mode=edit` |
| recipe | `/recipes/{id}?{params}` | `/recipes/101?step=1&mode=view` |
| task | `/tasks/{id}?{params}` | `/tasks/202?mode=edit&show=details` |
| search | `/search?{params}` | `/search?q=research&type=all` |
| dashboard | `/dashboard?{params}` | `/dashboard?view=projects&filter_active=true` |

### Parameter Mapping

#### Notes
- `mode` - edit, view
- `section` - content, metadata, attachments
- `highlight` - true, false

#### Projects
- `view` - overview, tasks, timeline, resources
- `tab` - details, settings, members
- `filter` - active, completed, archived

#### PDFs
- `page` - page number
- `zoom` - zoom level
- `highlight` - highlight text

#### Protocols
- `step` - step number
- `mode` - view, edit, execute

#### Recipes
- `step` - step number
- `mode` - view, edit, execute

#### Tasks
- `mode` - edit, view
- `show` - details, comments, attachments

#### Search
- `q` or `query` - search query
- `type` - all, notes, projects, pdfs, etc.
- `filters` - JSON object of filters

#### Dashboard
- `view` - overview, recent, projects, etc.
- `tab` - tab name
- `filters` - JSON object of filters

## Integration with React Router

### App Integration

```typescript
// In App.tsx
const ThemedApp: React.FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <DeepLinkRouter>
                    <CommandPaletteProvider>
                        <ProtectedRoutes />
                    </CommandPaletteProvider>
                </DeepLinkRouter>
            </Router>
        </ThemeProvider>
    );
};
```

### Route Configuration

```typescript
// In App.tsx - ProtectedRoutes
<Routes>
    <Route path="/" element={<ObsidianLayout />}>
        <Route path="notes/:id" element={<Notes />} />
        <Route path="projects/:id" element={<Projects />} />
        <Route path="pdfs/:id" element={<PDFManagement />} />
        <Route path="protocols/:id" element={<Protocols />} />
        <Route path="recipes/:id" element={<Recipes />} />
        <Route path="tasks/:id" element={<Tasks />} />
        <Route path="search" element={<Search />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="deep-link-demo" element={<DeepLinkDemo />} />
    </Route>
</Routes>
```

## Event Flow

### 1. Deep Link Received

```
External App/URL → Electron Main Process → IPC Event → Renderer Process → DeepLinkRouter
```

### 2. Navigation Processing

```
DeepLinkRouter → Parse Entity → Map to Route → React Router Navigation → Component Render
```

### 3. Component Integration

```
Component → useDeepLinking Hook → Electron API → Main Process → Deep Link Creation
```

## Error Handling

### Validation

```typescript
// Validate entity type
const routeHandler = DEEP_LINK_ROUTES[entityType.toLowerCase()];
if (!routeHandler) {
    console.warn(`No route handler found for entity type: ${entityType}`);
    navigate('/dashboard'); // Fallback
    return;
}
```

### Error Recovery

```typescript
try {
    const route = routeHandler(entityId, params);
    navigate(route, { replace: true });
} catch (error) {
    console.error('Error handling deep link navigation:', error);
    navigate('/dashboard'); // Fallback
}
```

### Pending Deep Links

```typescript
// Store deep links that arrive before app is ready
if (!isInitialized.current) {
    pendingDeepLinks.current.push(entity);
    return;
}

// Process pending deep links after initialization
useEffect(() => {
    if (!isInitialized.current) {
        isInitialized.current = true;
        setTimeout(() => {
            processPendingDeepLinks();
        }, 100);
    }
}, [location.pathname]);
```

## Testing

### Test Script

Run the test script to verify functionality:
```bash
node test-frontend-deep-linking.js
```

### Manual Testing

1. **Start Development Server**
   ```bash
   pnpm dev
   ```

2. **Navigate to Demo**
   ```
   http://localhost:5173/deep-link-demo
   ```

3. **Test Deep Links**
   - Generate custom deep links
   - Test quick actions
   - Copy and share links
   - Open links from external sources

### Example Test Cases

```typescript
// Test route mapping
const testCases = [
    {
        entityType: 'note',
        entityId: '123',
        params: { mode: 'edit', section: 'content' },
        expectedRoute: '/notes/123?mode=edit&section=content'
    },
    {
        entityType: 'project',
        entityId: '456',
        params: { view: 'overview', tab: 'details' },
        expectedRoute: '/projects/456?view=overview&tab=details'
    }
];
```

## Security Considerations

### Input Validation

```typescript
// Validate entity type
if (!DEEP_LINK_ROUTES[entityType.toLowerCase()]) {
    throw new Error(`Invalid entity type: ${entityType}`);
}

// Validate entity ID
if (entityId && typeof entityId !== 'string') {
    throw new Error('Entity ID must be a string');
}

// Sanitize parameters
const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        acc[key] = value;
    }
    return acc;
}, {});
```

### URL Sanitization

```typescript
// Use URLSearchParams for safe query string construction
const queryParams = new URLSearchParams();
Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
        queryParams.set(key, String(value));
    }
});
```

## Performance Considerations

### Lazy Loading

```typescript
// Lazy load components to improve initial load time
const DeepLinkDemo = React.lazy(() => import('./components/DeepLinkDemo'));
```

### Event Cleanup

```typescript
// Clean up event listeners on unmount
useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    electronAPI.onDeepLinkEntity(handleDeepLinkEntity);
    
    return () => {
        electronAPI.removeDeepLinkEntityListener();
    };
}, []);
```

### Debounced Navigation

```typescript
// Debounce navigation to prevent rapid route changes
const debouncedNavigate = useCallback(
    debounce((route: string) => {
        navigate(route, { replace: true });
    }, 100),
    [navigate]
);
```

## Future Enhancements

### 1. Universal Links
- Support for HTTPS deep links
- Fallback to web version
- App store redirects

### 2. Deep Link Analytics
- Track deep link usage
- Monitor conversion rates
- User behavior analysis

### 3. Advanced Routing
- Dynamic route generation
- Nested deep links
- Route aliases

### 4. Deep Link Templates
- Predefined deep link patterns
- Template variables
- Dynamic parameter injection

### 5. Deep Link Validation
- Schema validation for parameters
- Type checking for entity IDs
- Route existence validation

### 6. Deep Link Caching
- Cache frequently used deep links
- Offline deep link support
- Background link processing

## Troubleshooting

### Common Issues

1. **Deep links not working**
   - Check if Electron API is available
   - Verify event listener setup
   - Check console for errors

2. **Navigation not working**
   - Verify React Router setup
   - Check route configuration
   - Validate entity type mapping

3. **Parameters not passed correctly**
   - Check parameter parsing
   - Verify query string construction
   - Validate parameter types

### Debug Commands

```typescript
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
    console.log('DeepLinkRouter: Current location:', location.pathname + location.search);
}

// Check Electron API availability
console.log('Electron API available:', !!(window as any).electronAPI);

// Log deep link events
console.log('Received deep link entity event:', entity);
```

### Testing Checklist

- [ ] Deep link generation works
- [ ] Deep link opening works
- [ ] Navigation to correct routes
- [ ] Query parameters are preserved
- [ ] Error handling works
- [ ] Fallback navigation works
- [ ] Pending deep links are processed
- [ ] Event cleanup works
- [ ] Security validation works
- [ ] Performance is acceptable 