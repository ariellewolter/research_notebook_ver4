# Refactoring Implementation Guide

## Overview

This document provides a comprehensive guide to the refactoring implementation for the Electronic Lab Notebook application. The refactoring follows clean architecture principles and implements a modern, type-safe, and maintainable codebase.

## Architecture Overview

### Backend Architecture

The backend follows a **Clean Architecture** pattern with clear separation of concerns:

```
Controllers → Services → Repositories → Database
```

#### Layers:

1. **Controllers** - Handle HTTP requests and responses
2. **Services** - Contain business logic
3. **Repositories** - Handle data access
4. **Middleware** - Cross-cutting concerns (auth, validation, error handling)
5. **Types** - TypeScript interfaces and types
6. **Validation** - Zod schemas for input validation

### Frontend Architecture

The frontend follows a **Component-Based Architecture** with:

```
Components → Hooks → Services → API
```

#### Layers:

1. **Components** - React components for UI
2. **Hooks** - Custom React hooks for state management
3. **Services** - API client services
4. **Types** - TypeScript interfaces
5. **Utils** - Utility functions
6. **Constants** - Application constants

## Implementation Details

### Backend Implementation

#### 1. Configuration

**Environment Configuration** (`config/environment.ts`):
```typescript
import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('4000'),
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string().optional(),
});

export const config = {
    environment: env.NODE_ENV,
    port: env.PORT,
    database: { url: env.DATABASE_URL },
    jwt: { secret: env.JWT_SECRET || 'default-secret-key' },
} as const;
```

**CORS Configuration** (`config/cors.ts`):
```typescript
import cors from 'cors';

export const corsConfig = cors({
    origin: [/^http:\/\/localhost:\d+$/],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});
```

#### 2. Middleware

**Error Handler** (`middleware/errorHandler.ts`):
```typescript
export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
    console.error('Error:', error);

    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: 'Validation error',
            details: error.errors,
            statusCode: 400,
        });
        return;
    }

    // Handle other error types...
}
```

**Async Handler** (`middleware/asyncHandler.ts`):
```typescript
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
```

#### 3. Repository Pattern

**Base Repository Structure**:
```typescript
export class BaseRepository<T> {
    async findMany(filters: any): Promise<T[]> { /* implementation */ }
    async findById(id: string): Promise<T | null> { /* implementation */ }
    async create(data: any): Promise<T> { /* implementation */ }
    async update(id: string, data: any): Promise<T> { /* implementation */ }
    async delete(id: string): Promise<void> { /* implementation */ }
    async count(filters: any): Promise<number> { /* implementation */ }
}
```

#### 4. Service Layer

**Service Structure**:
```typescript
export class EntityService {
    constructor(private repository: EntityRepository) {}

    async getAllEntities(filters?: any): Promise<PaginatedResponse<T>> {
        // Business logic implementation
    }

    async getEntityById(id: string): Promise<T | null> {
        // Business logic implementation
    }

    async createEntity(data: CreateEntityData): Promise<T> {
        // Validation and business logic
    }

    async updateEntity(id: string, data: UpdateEntityData): Promise<T> {
        // Validation and business logic
    }

    async deleteEntity(id: string): Promise<void> {
        // Business logic implementation
    }
}
```

#### 5. Controller Layer

**Controller Structure**:
```typescript
export const entityController = {
    getAllEntities: asyncHandler(async (req: any, res: Response) => {
        const result = await entityService.getAllEntities(req.query);
        res.json(result);
    }),

    getEntityById: asyncHandler(async (req: any, res: Response) => {
        const entity = await entityService.getEntityById(req.params.id);
        if (!entity) {
            return res.status(404).json({ error: 'Entity not found' });
        }
        res.json(entity);
    }),

    createEntity: asyncHandler(async (req: any, res: Response) => {
        const validatedData = createEntitySchema.parse(req.body);
        const entity = await entityService.createEntity(validatedData);
        res.status(201).json(entity);
    }),
};
```

#### 6. Validation

**Zod Schemas**:
```typescript
export const createEntitySchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().optional(),
    status: z.enum(['active', 'inactive']).default('active'),
});

export const updateEntitySchema = createEntitySchema.partial();
```

### Frontend Implementation

#### 1. API Client

**Base API Client** (`services/api/apiClient.ts`):
```typescript
class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' },
        });
        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        // Request interceptor for auth
        this.client.interceptors.request.use((config) => {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('authToken');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }
}
```

#### 2. API Services

**Entity API Service**:
```typescript
export const entityApi = {
    getAll: (params?: any) => apiClient.get<PaginatedResponse<Entity>>('/entities', params),
    getById: (id: string) => apiClient.get<Entity>(`/entities/${id}`),
    create: (data: CreateEntityData) => apiClient.post<Entity>('/entities', data),
    update: (id: string, data: UpdateEntityData) => apiClient.put<Entity>(`/entities/${id}`, data),
    delete: (id: string) => apiClient.delete(`/entities/${id}`),
    search: (query: string) => apiClient.get<Entity[]>(`/entities/search/${query}`),
};
```

#### 3. React Hooks

**Custom API Hook**:
```typescript
export function useEntity(options: UseEntityOptions = {}): UseEntityReturn {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEntities = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await entityApi.getAll(options);
            setEntities(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    }, [options]);

    const createEntity = useCallback(async (data: CreateEntityData) => {
        try {
            setLoading(true);
            const response = await entityApi.create(data);
            setEntities(prev => [response.data, ...prev]);
            return response.data;
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        entities,
        loading,
        error,
        fetchEntities,
        createEntity,
        clearError: () => setError(null),
    };
}
```

#### 4. UI Hooks

**Modal Hook**:
```typescript
export function useModal(initialState: boolean = false): UseModalReturn {
    const [isOpen, setIsOpen] = useState(initialState);

    return {
        isOpen,
        open: useCallback(() => setIsOpen(true), []),
        close: useCallback(() => setIsOpen(false), []),
        toggle: useCallback(() => setIsOpen(prev => !prev), []),
    };
}
```

**Form Hook**:
```typescript
export function useForm<T extends Record<string, any>>({
    initialValues,
    onSubmit,
    validate,
}: UseFormOptions<T>): UseFormReturn<T> {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (validate) {
            const validationErrors = validate(values);
            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                return;
            }
        }

        try {
            setLoading(true);
            setErrors({});
            await onSubmit(values);
        } catch (error: any) {
            setErrors({ submit: error.message } as any);
        } finally {
            setLoading(false);
        }
    }, [values, validate, onSubmit]);

    return {
        values,
        errors,
        loading,
        handleChange: useCallback((field: keyof T) => (e: ChangeEvent<HTMLInputElement>) => {
            setValues(prev => ({ ...prev, [field]: e.target.value }));
        }, []),
        handleSubmit,
        setValue: useCallback((field: keyof T, value: any) => {
            setValues(prev => ({ ...prev, [field]: value }));
        }, []),
        reset: useCallback(() => {
            setValues(initialValues);
            setErrors({});
        }, [initialValues]),
    };
}
```

#### 5. Components

**Entity List Component**:
```typescript
export function EntityList({ onEntitySelect }: EntityListProps) {
    const [filters, setFilters] = useState({ search: '', status: '' });
    const { entities, loading, error, fetchEntities, deleteEntity } = useEntity({
        autoFetch: true,
        ...filters,
    });

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure?')) {
            await deleteEntity(id);
        }
    };

    if (error) {
        return <ErrorDisplay error={error} onDismiss={() => setError(null)} />;
    }

    return (
        <div className="space-y-4">
            <FilterBar filters={filters} onFilterChange={setFilters} />
            
            {loading && <LoadingSpinner />}
            
            {!loading && entities.length === 0 && (
                <EmptyState message="No entities found" />
            )}
            
            {!loading && entities.length > 0 && (
                <div className="grid gap-4">
                    {entities.map(entity => (
                        <EntityCard
                            key={entity.id}
                            entity={entity}
                            onSelect={onEntitySelect}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
```

## Best Practices

### 1. Error Handling

- **Backend**: Centralized error handling with proper HTTP status codes
- **Frontend**: User-friendly error messages with retry mechanisms
- **Validation**: Client and server-side validation with detailed error messages

### 2. Type Safety

- **TypeScript**: Full type coverage for all interfaces and functions
- **Zod**: Runtime validation with type inference
- **API Types**: Shared types between frontend and backend

### 3. Performance

- **Pagination**: Implemented for all list endpoints
- **Caching**: Strategic caching for frequently accessed data
- **Optimistic Updates**: Immediate UI updates with rollback on error

### 4. Security

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive validation of all inputs
- **CORS**: Proper CORS configuration

### 5. Testing

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and service interactions
- **E2E Tests**: Test complete user workflows

## Migration Strategy

### Phase 1: Foundation
- [x] Set up clean architecture structure
- [x] Implement base API client
- [x] Create core types and validation schemas
- [x] Set up error handling middleware

### Phase 2: Core Services
- [x] Implement Projects service
- [x] Implement Notes service
- [x] Implement Links service
- [x] Create React hooks for state management

### Phase 3: Advanced Features
- [ ] Implement Database service
- [ ] Implement Tasks service
- [ ] Implement Notifications service
- [ ] Add authentication and authorization

### Phase 4: Polish
- [ ] Add comprehensive testing
- [ ] Optimize performance
- [ ] Add monitoring and logging
- [ ] Complete documentation

## Getting Started

1. **Install Dependencies**:
   ```bash
   cd apps/backend && pnpm install
   cd apps/frontend && pnpm install
   ```

2. **Set up Environment**:
   ```bash
   # Backend
   cp apps/backend/.env.example apps/backend/.env
   # Edit .env with your configuration
   ```

3. **Run Development Servers**:
   ```bash
   # Backend
   cd apps/backend && pnpm dev
   
   # Frontend
   cd apps/frontend && pnpm dev
   ```

4. **Start Using the New Architecture**:
   - Use the new hooks in your components
   - Follow the established patterns for new features
   - Refer to the type definitions for API contracts

## Conclusion

This refactoring provides a solid foundation for building a scalable, maintainable, and type-safe application. The clean architecture ensures separation of concerns, while the comprehensive type system catches errors early in development. The modular design makes it easy to add new features and maintain existing code.

For questions or issues, refer to the API documentation or create an issue in the project repository. 