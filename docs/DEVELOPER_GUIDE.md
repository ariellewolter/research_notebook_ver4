# Developer Guide

## Recent Bug Fixes and Improvements

This guide covers the recent bug fixes and improvements made to the Research Notebook application, providing developers with context and best practices for working with the improved codebase.

## 🔧 Bug Fixes Overview

### 1. PDF Download Feature

**Problem:** The PDF download functionality in the Zotero integration was marked as TODO and showed a placeholder message.

**Solution:** Implemented a complete PDF download feature with proper error handling.

**Files Modified:**
- `apps/frontend/src/pages/Zotero.tsx`

**Key Changes:**
```typescript
// Added handleDownloadPDF function
const handleDownloadPDF = async (item: ZoteroItem) => {
    try {
        const pdfUrl = item.pdfUrl || item.data?.url;
        if (!pdfUrl) {
            setError('No PDF URL available for this item');
            return;
        }

        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        link.target = '_blank';
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setSuccess('PDF download started');
    } catch (err) {
        setError('Failed to download PDF');
        console.error('Error downloading PDF:', err);
    }
};
```

**Best Practices:**
- Always validate URLs before attempting downloads
- Use proper error handling with try-catch blocks
- Provide clear user feedback for success and error states
- Clean up DOM elements after use

### 2. Debug Logging Cleanup

**Problem:** Excessive debug logging was left in production code, impacting performance and potentially exposing sensitive information.

**Solution:** Wrapped debug logging in development environment checks.

**Files Modified:**
- `apps/frontend/src/contexts/AuthContext.tsx`

**Key Changes:**
```typescript
// Before
console.log('AuthContext state:', {
    user,
    token: token ? 'present' : 'null',
    isAuthenticated: !!token && !!user,
    hasUser: !!user,
    hasToken: !!token
});

// After
if (process.env.NODE_ENV === 'development') {
    console.log('AuthContext state:', {
        user,
        token: token ? 'present' : 'null',
        isAuthenticated: !!token && !!user,
        hasUser: !!user,
        hasToken: !!token
    });
}
```

**Best Practices:**
- Always check environment before logging debug information
- Use environment variables for feature flags
- Consider using a logging library for production applications
- Remove or comment out debug logs before production deployment

### 3. API Response Handling

**Problem:** Inconsistent API response structures were causing runtime errors and complex helper functions.

**Solution:** Simplified helper functions and made response handling more robust.

**Files Modified:**
- `apps/frontend/src/pages/ResearchDashboard.tsx`

**Key Changes:**
```typescript
// Before - Complex helper with multiple paths
const getCount = (response: any, possiblePaths: string[]): number => {
    if (response.status !== 'fulfilled') return 0;
    const data = response.value.data;
    for (const path of possiblePaths) {
        const value = path.split('.').reduce((obj, key) => obj?.[key], data);
        if (Array.isArray(value)) return value.length;
    }
    return 0;
};

// After - Simplified helper
const getCount = (response: any): number => {
    if (response.status !== 'fulfilled') return 0;
    const data = response.value.data;
    // Handle different response structures consistently
    if (Array.isArray(data)) return data.length;
    if (data && typeof data === 'object') {
        // Check for common array properties
        const possibleArrays = ['notes', 'pdfs', 'entries', 'tables', 'protocols', 'recipes', 'data'];
        for (const key of possibleArrays) {
            if (Array.isArray(data[key])) return data[key].length;
        }
    }
    return 0;
};
```

**Best Practices:**
- Standardize API response structures across endpoints
- Use consistent helper functions for data extraction
- Handle edge cases gracefully
- Document expected response formats

### 4. Navigation Error Handling

**Problem:** Entity navigation lacked proper error handling and route validation.

**Solution:** Added route validation and improved error handling.

**Files Modified:**
- `apps/frontend/src/pages/LiteratureNotes.tsx`

**Key Changes:**
```typescript
// Before
if (route) {
    try {
        navigate(route);
    } catch (error) {
        console.error('Navigation error:', error);
        setSnackbar({
            open: true,
            message: `Failed to navigate to ${entry.type}. Please try again.`,
            severity: 'error'
        });
    }
}

// After
if (route) {
    try {
        // Validate that the route is safe before navigation
        if (typeof route === 'string' && route.startsWith('/')) {
            navigate(route);
        } else {
            throw new Error('Invalid route format');
        }
    } catch (error) {
        console.error('Navigation error:', error);
        setSnackbar({
            open: true,
            message: `Failed to navigate to ${entry.type}. Please try again.`,
            severity: 'error'
        });
    }
}
```

**Best Practices:**
- Always validate routes before navigation
- Use proper error boundaries for navigation failures
- Provide clear error messages to users
- Log navigation errors for debugging

### 5. Type Safety Improvements

**Problem:** Extensive use of 'any' types reduced type safety and code maintainability.

**Solution:** Created comprehensive TypeScript interfaces for all API entities.

**Files Created/Modified:**
- `apps/frontend/src/types/api.ts` (new)
- `apps/frontend/src/services/api.ts`

**Key Changes:**
```typescript
// Before
export const projectsApi = {
    getAll: (params?: any) => api.get('/projects', { params }),
    create: (data: any) => api.post('/projects', data),
    update: (id: string, data: any) => api.put(`/projects/${id}`, data),
};

// After
export const projectsApi = {
    getAll: (params?: ProjectParams) => api.get<Project[]>('/projects', { params }),
    create: (data: ProjectCreateData) => api.post<Project>('/projects', data),
    update: (id: string, data: ProjectUpdateData) => api.put<Project>(`/projects/${id}`, data),
};
```

**Best Practices:**
- Always define interfaces for API entities
- Use generic types for API responses
- Separate create/update data interfaces from entity interfaces
- Use union types for status and priority fields

## Development Workflow

### Setting Up the Development Environment

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Set Up Database:**
   ```bash
   cd apps/backend
   pnpm exec prisma migrate dev --name init
   ```

3. **Start Development Servers:**
   ```bash
   # Backend
   cd apps/backend
   pnpm dev
   
   # Frontend (in new terminal)
   cd apps/frontend
   pnpm dev
   ```

### Code Quality Standards

1. **TypeScript:**
   - Use strict TypeScript configuration
   - Avoid 'any' types
   - Define interfaces for all data structures
   - Use proper error handling

2. **Error Handling:**
   - Always use try-catch blocks for async operations
   - Provide meaningful error messages
   - Log errors for debugging
   - Handle edge cases gracefully

3. **Performance:**
   - Avoid excessive logging in production
   - Use environment checks for debug code
   - Optimize API calls and data processing
   - Implement proper loading states

4. **User Experience:**
   - Provide clear feedback for all user actions
   - Handle loading and error states
   - Validate user input
   - Use consistent UI patterns

### Testing Guidelines

1. **Unit Tests:**
   - Test helper functions thoroughly
   - Mock API calls for testing
   - Test error handling scenarios
   - Use TypeScript for test files

2. **Integration Tests:**
   - Test API endpoints
   - Test user workflows
   - Test error scenarios
   - Test data validation

3. **Manual Testing:**
   - Test all user interactions
   - Test error scenarios
   - Test performance with large datasets
   - Test cross-browser compatibility

### Debugging Tips

1. **Console Logging:**
   ```typescript
   // Use environment checks
   if (process.env.NODE_ENV === 'development') {
       console.log('Debug info:', data);
   }
   ```

2. **Error Boundaries:**
   ```typescript
   // Implement error boundaries for React components
   class ErrorBoundary extends React.Component {
       // Error boundary implementation
   }
   ```

3. **Type Checking:**
   ```typescript
   // Use TypeScript for compile-time error detection
   const project: Project = await projectsApi.getById(id);
   ```

## Common Patterns

### API Response Handling

```typescript
const handleApiCall = async () => {
    try {
        setLoading(true);
        const data = await apiCall();
        setData(data);
        setError(null);
    } catch (err) {
        console.error('API call failed:', err);
        setError('Failed to load data. Please try again.');
    } finally {
        setLoading(false);
    }
};
```

### Form Validation

```typescript
const validateForm = (data: FormData): ValidationResult => {
    const errors: string[] = [];
    
    if (!data.title?.trim()) {
        errors.push('Title is required');
    }
    
    if (data.email && !isValidEmail(data.email)) {
        errors.push('Invalid email format');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};
```

### Navigation with Error Handling

```typescript
const navigateSafely = (route: string) => {
    try {
        if (typeof route === 'string' && route.startsWith('/')) {
            navigate(route);
        } else {
            throw new Error('Invalid route format');
        }
    } catch (error) {
        console.error('Navigation failed:', error);
        // Handle navigation error
    }
};
```

## Future Improvements

1. **Add Validation Libraries:**
   - Integrate Zod for runtime validation
   - Add form validation libraries
   - Implement API response validation

2. **Enhanced Error Handling:**
   - Implement global error boundaries
   - Add error reporting services
   - Create error recovery mechanisms

3. **Performance Optimizations:**
   - Implement code splitting
   - Add caching strategies
   - Optimize bundle sizes

4. **Testing Improvements:**
   - Add comprehensive test coverage
   - Implement E2E testing
   - Add performance testing

## Contributing

When contributing to the project:

1. **Follow the established patterns** for error handling and type safety
2. **Add proper TypeScript interfaces** for new features
3. **Include error handling** for all user interactions
4. **Test thoroughly** before submitting changes
5. **Update documentation** for new features
6. **Follow the code style** established in the project

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
- [Material-UI Documentation](https://mui.com/)
- [Prisma Documentation](https://www.prisma.io/docs/) 