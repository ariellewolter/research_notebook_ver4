// API Response Types
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    status?: string;
}

// Project Types
export interface Project {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'completed' | 'on_hold' | 'cancelled';
    startDate?: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectParams {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ProjectCreateData {
    name: string;
    description?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}

export interface ProjectUpdateData {
    name?: string;
    description?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}

// Experiment Types
export interface Experiment {
    id: string;
    name: string;
    description?: string;
    projectId: string;
    protocolIds?: string[];
    recipeIds?: string[];
    noteIds?: string[];
    pdfIds?: string[];
    literatureNoteIds?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface ExperimentCreateData {
    name: string;
    description?: string;
    protocolIds?: string[];
    recipeIds?: string[];
    noteIds?: string[];
    pdfIds?: string[];
    literatureNoteIds?: string[];
}

export interface ExperimentUpdateData {
    name?: string;
    description?: string;
    protocolIds?: string[];
    noteIds?: string[];
    literatureNoteIds?: string[];
}

// Search Types
export interface SearchParams {
    query?: string;
    type?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
}

// Database Entry Types
export interface DatabaseEntry {
    id: string;
    type: string;
    name: string;
    description?: string;
    properties?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface DatabaseEntryCreateData {
    type: string;
    name: string;
    description?: string;
    properties?: string;
    metadata?: Record<string, any>;
}

export interface DatabaseEntryUpdateData {
    name?: string;
    description?: string;
    properties?: string;
    metadata?: Record<string, any>;
}

// Task Types
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
    deadline?: string;
    isRecurring: boolean;
    recurringPattern?: string;
    tags?: string;
    projectId?: string | null;
    experimentId?: string | null;
    protocolId?: string | null;
    noteId?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TaskCreateData {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    deadline?: string;
    isRecurring?: boolean;
    recurringPattern?: string;
    tags?: string;
    projectId?: string;
    experimentId?: string;
    protocolId?: string;
    noteId?: string;
}

export interface TaskUpdateData {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    deadline?: string;
    isRecurring?: boolean;
    recurringPattern?: string;
    tags?: string;
    projectId?: string;
    experimentId?: string;
    protocolId?: string;
    noteId?: string;
}

// Protocol Types
export interface Protocol {
    id: string;
    name: string;
    description?: string;
    steps: string;
    category?: string;
    tags?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProtocolCreateData {
    name: string;
    description?: string;
    steps: string;
    category?: string;
    tags?: string;
}

export interface ProtocolUpdateData {
    name?: string;
    description?: string;
    steps?: string;
    category?: string;
    tags?: string;
}

// Recipe Types
export interface Recipe {
    id: string;
    name: string;
    description?: string;
    ingredients: string;
    instructions: string;
    category?: string;
    tags?: string;
    createdAt: string;
    updatedAt: string;
}

export interface RecipeCreateData {
    name: string;
    description?: string;
    ingredients: string;
    instructions: string;
    category?: string;
    tags?: string;
}

export interface RecipeUpdateData {
    name?: string;
    description?: string;
    ingredients?: string;
    instructions?: string;
    category?: string;
    tags?: string;
}

// Literature Note Types
export interface LiteratureNote {
    id: string;
    title: string;
    authors: string;
    year: string;
    journal: string;
    doi: string;
    abstract: string;
    tags: string;
    citation: string;
    synonyms: string;
    userNote: string;
    createdAt: string;
    updatedAt: string;
}

export interface LiteratureNoteCreateData {
    title: string;
    authors: string;
    year: string;
    journal: string;
    doi: string;
    abstract: string;
    tags: string;
    citation: string;
    synonyms: string;
    userNote: string;
}

export interface LiteratureNoteUpdateData {
    title?: string;
    authors?: string;
    year?: string;
    journal?: string;
    doi?: string;
    abstract?: string;
    tags?: string;
    citation?: string;
    synonyms?: string;
    userNote?: string;
}

// Table Types
export interface Table {
    id: string;
    name: string;
    description?: string;
    columns: string;
    data: string;
    category?: string;
    tags?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TableCreateData {
    name: string;
    description?: string;
    columns: string;
    data: string;
    category?: string;
    tags?: string;
}

export interface TableUpdateData {
    name?: string;
    description?: string;
    columns?: string;
    data?: string;
    category?: string;
    tags?: string;
}

// PDF Types
export interface PDF {
    id: string;
    title: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface PDFCreateData {
    title: string;
}

export interface PDFUpdateData {
    title?: string;
}

// Highlight Types
export interface Highlight {
    id: string;
    pdfId: string;
    page: number;
    text: string;
    coords?: string;
    createdAt: string;
    updatedAt: string;
}

export interface HighlightCreateData {
    page: number;
    text: string;
    coords?: string;
}

export interface HighlightUpdateData {
    text?: string;
    coords?: string;
}

// Common API Parameters
export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface FilterParams {
    type?: string;
    status?: string;
    priority?: string;
    category?: string;
    tags?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface SortParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ApiParams extends PaginationParams, FilterParams, SortParams {
    [key: string]: any;
} 