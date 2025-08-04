# Developer Guide

Comprehensive guide for developers working on the Research Notebook v4 application.

## 🚨 Critical Bug Fixes & Best Practices

### Recent Performance Improvements (January 2025)

Our recent critical bug fixes have established new best practices for the codebase:

#### Memory Management
```typescript
// ✅ GOOD: Proper cleanup with AbortController
const abortControllerRef = useRef<AbortController | null>(null);

useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    fetchData({ signal: controller.signal });
    
    return () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };
}, [fetchData]);

// ❌ BAD: No cleanup, potential memory leaks
useEffect(() => {
    fetchData();
}, []);
```

#### API Error Handling
```typescript
// ✅ GOOD: Comprehensive error handling with retry
try {
    const response = await api.get('/endpoint', { signal: controller.signal });
    setData(response.data);
    setError(null);
} catch (error: any) {
    if (error.name === 'AbortError') return;
    console.error('API Error:', error);
    setError('User-friendly error message');
}

// ❌ BAD: Basic error handling
try {
    const response = await api.get('/endpoint');
    setData(response.data);
} catch (error) {
    console.error(error);
}
```

#### Component Optimization
```typescript
// ✅ GOOD: Memoized functions with useCallback
const fetchData = useCallback(async () => {
    // Implementation
}, [dependencies]);

// ✅ GOOD: Memoized values with useMemo
const expensiveValue = useMemo(() => {
    return computeExpensiveValue(data);
}, [data]);

// ❌ BAD: Functions recreated on every render
const fetchData = async () => {
    // Implementation
};
```

## 🏗️ Architecture Overview

### Frontend Architecture
```
apps/frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page-level components
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React contexts
│   ├── services/           # API and external services
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── styles/             # Global styles
```

### Backend Architecture
```
apps/backend/
├── src/
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   ├── middleware/         # Express middleware
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript types
├── prisma/                 # Database schema and migrations
└── tests/                  # Backend tests
```

## 🎯 Development Best Practices

### 1. Component Design

#### Functional Components with Hooks
```typescript
// ✅ GOOD: Functional component with proper typing
interface ComponentProps {
    title: string;
    onAction: (id: string) => void;
}

const MyComponent: React.FC<ComponentProps> = ({ title, onAction }) => {
    const [state, setState] = useState<string>('');
    
    const handleClick = useCallback(() => {
        onAction('some-id');
    }, [onAction]);
    
    return (
        <div>
            <h1>{title}</h1>
            <button onClick={handleClick}>Action</button>
        </div>
    );
};
```

#### Custom Hooks for Business Logic
```typescript
// ✅ GOOD: Extract business logic into custom hooks
export const useDataManagement = () => {
    const [data, setData] = useState<Data[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/data');
            setData(response.data);
            setError(null);
        } catch (error: any) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, []);
    
    return { data, loading, error, fetchData };
};
```

### 2. State Management

#### Local State with useState
```typescript
// ✅ GOOD: Proper state initialization
const [items, setItems] = useState<Item[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

// ✅ GOOD: State updates with proper typing
const addItem = useCallback((item: Item) => {
    setItems(prev => [...prev, item]);
}, []);
```

#### Context for Global State
```typescript
// ✅ GOOD: Context with proper typing and error handling
interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
```

### 3. API Integration

#### Axios Configuration
```typescript
// ✅ GOOD: Centralized API configuration
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for authentication
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Handle authentication errors
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
```

#### API Service Functions
```typescript
// ✅ GOOD: Typed API functions with error handling
export const dataApi = {
    getAll: async (params?: ApiParams): Promise<ApiResponse<Data[]>> => {
        const response = await api.get('/data', { params });
        return response.data;
    },
    
    create: async (data: CreateDataRequest): Promise<ApiResponse<Data>> => {
        const response = await api.post('/data', data);
        return response.data;
    },
    
    update: async (id: string, data: UpdateDataRequest): Promise<ApiResponse<Data>> => {
        const response = await api.put(`/data/${id}`, data);
        return response.data;
    },
    
    delete: async (id: string): Promise<void> => {
        await api.delete(`/data/${id}`);
    },
};
```

### 4. Error Handling

#### Component Error Boundaries
```typescript
// ✅ GOOD: Error boundary for component error handling
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }
    
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }
    
    render() {
        if (this.state.hasError) {
            return <ErrorFallback error={this.state.error} />;
        }
        
        return this.props.children;
    }
}
```

#### Form Validation
```typescript
// ✅ GOOD: Comprehensive form validation
const validateForm = (data: FormData): ValidationResult => {
    const errors: string[] = [];
    
    if (!data.name?.trim()) {
        errors.push('Name is required');
    }
    
    if (data.email && !isValidEmail(data.email)) {
        errors.push('Invalid email format');
    }
    
    if (data.age && (data.age < 0 || data.age > 120)) {
        errors.push('Age must be between 0 and 120');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};
```

### 5. Performance Optimization

#### Memoization
```typescript
// ✅ GOOD: Memoize expensive calculations
const expensiveValue = useMemo(() => {
    return computeExpensiveValue(data, filters);
}, [data, filters]);

// ✅ GOOD: Memoize callback functions
const handleAction = useCallback((id: string) => {
    performAction(id);
}, [performAction]);

// ✅ GOOD: Memoize components
const ExpensiveComponent = React.memo<ComponentProps>(({ data, onAction }) => {
    return <div>{/* Component content */}</div>;
});
```

#### Lazy Loading
```typescript
// ✅ GOOD: Lazy load components
const LazyComponent = React.lazy(() => import('./LazyComponent'));

const App = () => (
    <Suspense fallback={<LoadingSpinner />}>
        <LazyComponent />
    </Suspense>
);
```

## 🧪 Testing Guidelines

### Unit Testing
```typescript
// ✅ GOOD: Comprehensive unit tests
describe('useDataManagement', () => {
    it('should fetch data successfully', async () => {
        const mockData = [{ id: '1', name: 'Test' }];
        jest.spyOn(api, 'get').mockResolvedValue({ data: mockData });
        
        const { result } = renderHook(() => useDataManagement());
        
        await act(async () => {
            await result.current.fetchData();
        });
        
        expect(result.current.data).toEqual(mockData);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
    });
    
    it('should handle errors gracefully', async () => {
        jest.spyOn(api, 'get').mockRejectedValue(new Error('API Error'));
        
        const { result } = renderHook(() => useDataManagement());
        
        await act(async () => {
            await result.current.fetchData();
        });
        
        expect(result.current.error).toBe('Failed to fetch data');
        expect(result.current.loading).toBe(false);
    });
});
```

### Integration Testing
```typescript
// ✅ GOOD: Integration tests for API endpoints
describe('Data API', () => {
    it('should create and retrieve data', async () => {
        const testData = { name: 'Test Item', description: 'Test Description' };
        
        // Create data
        const createResponse = await request(app)
            .post('/api/data')
            .send(testData)
            .expect(201);
        
        const createdId = createResponse.body.data.id;
        
        // Retrieve data
        const getResponse = await request(app)
            .get(`/api/data/${createdId}`)
            .expect(200);
        
        expect(getResponse.body.data.name).toBe(testData.name);
    });
});
```

## 🔧 Development Workflow

### 1. Code Review Checklist
- [ ] **Memory Management**: Proper cleanup in useEffect hooks
- [ ] **Error Handling**: Comprehensive error handling and user feedback
- [ ] **Performance**: Memoization where appropriate
- [ ] **Type Safety**: Proper TypeScript usage
- [ ] **Testing**: Adequate test coverage
- [ ] **Documentation**: Updated documentation

### 2. Performance Checklist
- [ ] **Component Optimization**: Memoized expensive operations
- [ ] **API Optimization**: Request cancellation and retry logic
- [ ] **Memory Usage**: No memory leaks detected
- [ ] **Bundle Size**: Reasonable bundle size
- [ ] **Loading States**: Proper loading indicators

### 3. Security Checklist
- [ ] **Input Validation**: All inputs properly validated
- [ ] **Authentication**: Proper token handling
- [ ] **Authorization**: Role-based access control
- [ ] **Data Sanitization**: XSS prevention
- [ ] **Error Messages**: No sensitive information in errors

## 📊 Performance Monitoring

### Key Metrics
- **Component Render Time**: < 16ms for smooth 60fps
- **Memory Usage**: < 100MB for typical usage
- **API Response Time**: < 2 seconds for most requests
- **Bundle Size**: < 2MB for initial load

### Monitoring Tools
- **React DevTools**: Component profiling
- **Chrome DevTools**: Memory and performance analysis
- **Lighthouse**: Performance audits
- **Custom Metrics**: Application-specific monitoring

## 🚀 Deployment Guidelines

### Environment Configuration
```bash
# Production environment variables
NODE_ENV=production
REACT_APP_API_URL=https://api.example.com
REACT_APP_ENVIRONMENT=production
```

### Build Process
```bash
# Build all applications
pnpm build

# Build desktop app
cd electron && pnpm build

# Run tests before deployment
pnpm test:all
```

### Deployment Checklist
- [ ] **Environment Variables**: All required variables set
- [ ] **Database Migrations**: Applied to production
- [ ] **SSL Certificate**: Valid and configured
- [ ] **Backup Strategy**: Database backups configured
- [ ] **Monitoring**: Performance monitoring enabled
- [ ] **Error Tracking**: Error reporting configured

## 📚 Additional Resources

### Documentation
- **[Critical Bug Fixes Summary](guides/CRITICAL_BUG_FIXES_SUMMARY.md)**
- **[Implementation Guides](implementation/README.md)**
- **[TypeScript Interfaces](TYPESCRIPT_INTERFACES.md)**

### External Resources
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Material-UI Documentation](https://mui.com/)
- [Electron Documentation](https://www.electronjs.org/docs)

---

**Last Updated:** January 27, 2025  
**Version:** 4.0.0  
**Status:** ✅ Updated with Critical Improvements 