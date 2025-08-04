// Common interfaces to replace 'any' types across the application

export interface BaseEntity {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Project extends BaseEntity {
    status: 'active' | 'completed' | 'on_hold' | 'cancelled';
    startDate?: string;
    endDate?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    experiments?: Experiment[];
}

export interface Experiment extends BaseEntity {
    projectId: string;
    status: 'planning' | 'active' | 'completed' | 'failed';
    startDate?: string;
    endDate?: string;
    project: {
        id: string;
        name: string;
    };
}

export interface Note extends BaseEntity {
    content: string;
    type: 'general' | 'research' | 'protocol' | 'observation';
    tags?: string[];
    linkedEntities?: LinkedEntity[];
}

export interface DatabaseEntry extends BaseEntity {
    category: string;
    data: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export interface Task extends BaseEntity {
    status: 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    deadline?: string;
    assignee?: string;
    projectId?: string;
    dependencies?: string[];
}

export interface Protocol extends BaseEntity {
    steps: ProtocolStep[];
    estimatedDuration?: number;
    category: string;
    version: string;
}

export interface ProtocolStep {
    id: string;
    order: number;
    title: string;
    description: string;
    duration?: number;
    completed: boolean;
}

export interface Recipe extends BaseEntity {
    ingredients: RecipeIngredient[];
    instructions: string[];
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime?: number;
}

export interface RecipeIngredient {
    name: string;
    amount: string;
    unit: string;
}

export interface PDF extends BaseEntity {
    filename: string;
    filepath: string;
    size: number;
    pages: number;
    highlights?: Highlight[];
}

export interface Highlight {
    id: string;
    text: string;
    page: number;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    notes?: string;
}

export interface Link {
    id: string;
    sourceId: string;
    sourceType: 'note' | 'project' | 'protocol' | 'database' | 'pdf';
    targetId: string;
    targetType: 'note' | 'project' | 'protocol' | 'database' | 'pdf';
    relationship: string;
    createdAt: string;
}

export interface LinkedEntity {
    id: string;
    type: 'note' | 'project' | 'protocol' | 'database' | 'pdf';
    name: string;
    relationship: string;
}

export interface SearchResult {
    id: string;
    type: 'note' | 'project' | 'protocol' | 'database' | 'pdf' | 'task';
    title: string;
    description?: string;
    score: number;
    highlights?: string[];
}

export interface AnalyticsData {
    projectDistribution: Array<{
        name: string;
        value: number;
    }>;
    recentActivity: {
        experiments: Experiment[];
        tasks: Task[];
    };
    statusDistribution: Array<{
        name: string;
        value: number;
    }>;
}

export interface FormData {
    [key: string]: string | number | boolean | string[] | undefined;
}

export interface ApiError {
    message: string;
    status: number;
    details?: unknown;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

export interface FilterOptions {
    search?: string;
    status?: string;
    category?: string;
    dateRange?: {
        start: string;
        end: string;
    };
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
} 