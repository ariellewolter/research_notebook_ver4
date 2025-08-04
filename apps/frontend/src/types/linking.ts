// Types for the reusable LinkingComponent

export type EntityType = 
  | 'note' 
  | 'project' 
  | 'protocol' 
  | 'recipe' 
  | 'pdf' 
  | 'databaseEntry' 
  | 'experiment' 
  | 'task' 
  | 'table' 
  | 'literatureNote';

export interface BaseEntity {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Link {
  id: string;
  sourceType: EntityType;
  sourceId: string;
  targetType: EntityType;
  targetId: string;
  createdAt: string;
  // Include the actual entity data for convenience
  [key: string]: any;
}

export interface LinkingConfig<T extends BaseEntity> {
  entityType: EntityType;
  displayName: string;
  displayField: keyof T;
  descriptionField?: keyof T;
  apiModule: {
    getAll: () => Promise<{ data: T[] }>;
    create: (data: Partial<T>) => Promise<{ data: T }>;
  };
  createFormFields?: {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    required?: boolean;
    options?: { value: string; label: string }[];
  }[];
  defaultCreateData?: Partial<T>;
}

export interface LinkingState<T extends BaseEntity> {
  linked: T[];
  all: T[];
  loading: boolean;
  creating: boolean;
  error: string | null;
}

export interface LinkingActions<T extends BaseEntity> {
  link: (entityId: string) => Promise<void>;
  unlink: (entityId: string) => Promise<void>;
  create: (data: Partial<T>) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface LinkingComponentProps<T extends BaseEntity> {
  sourceType: EntityType;
  sourceId: string;
  config: LinkingConfig<T>;
  title?: string;
  showCreateButton?: boolean;
  showSearch?: boolean;
  maxHeight?: string;
  className?: string;
  onLinkChange?: (linked: T[]) => void;
  renderEntity?: (entity: T, isLinked: boolean) => React.ReactNode;
  renderCreateForm?: (onSubmit: (data: Partial<T>) => void, onCancel: () => void) => React.ReactNode;
}

// Predefined configurations for common entity types
export const ENTITY_CONFIGS: Record<EntityType, LinkingConfig<any>> = {
  note: {
    entityType: 'note',
    displayName: 'Note',
    displayField: 'title',
    descriptionField: 'content',
    apiModule: {
      getAll: () => import('../services/api').then(m => m.notesApi.getAll()),
      create: (data) => import('../services/api').then(m => m.notesApi.create(data))
    },
    createFormFields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'content', label: 'Content', type: 'textarea' }
    ],
    defaultCreateData: { type: 'general' }
  },
  project: {
    entityType: 'project',
    displayName: 'Project',
    displayField: 'name',
    descriptionField: 'description',
    apiModule: {
      getAll: () => import('../services/api').then(m => m.projectsApi.getAll()),
      create: (data) => import('../services/api').then(m => m.projectsApi.create(data))
    },
    createFormFields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { 
        name: 'status', 
        label: 'Status', 
        type: 'select', 
        options: [
          { value: 'active', label: 'Active' },
          { value: 'archived', label: 'Archived' },
          { value: 'future', label: 'Future' }
        ]
      }
    ],
    defaultCreateData: { status: 'active' }
  },
  protocol: {
    entityType: 'protocol',
    displayName: 'Protocol',
    displayField: 'name',
    descriptionField: 'description',
    apiModule: {
      getAll: () => import('../services/api').then(m => m.protocolsApi.getAll()),
      create: (data) => import('../services/api').then(m => m.protocolsApi.create(data))
    },
    createFormFields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'category', label: 'Category', type: 'text' }
    ]
  },
  recipe: {
    entityType: 'recipe',
    displayName: 'Recipe',
    displayField: 'name',
    descriptionField: 'description',
    apiModule: {
      getAll: () => import('../services/api').then(m => m.recipesApi.getAll()),
      create: (data) => import('../services/api').then(m => m.recipesApi.create(data))
    },
    createFormFields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'category', label: 'Category', type: 'text' }
    ]
  },
  pdf: {
    entityType: 'pdf',
    displayName: 'PDF',
    displayField: 'title',
    descriptionField: 'filename',
    apiModule: {
      getAll: () => import('../services/api').then(m => m.pdfsApi.getAll()),
      create: (data) => import('../services/api').then(m => m.pdfsApi.create(data))
    },
    createFormFields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'filename', label: 'Filename', type: 'text' }
    ]
  },
  databaseEntry: {
    entityType: 'databaseEntry',
    displayName: 'Database Entry',
    displayField: 'name',
    descriptionField: 'description',
    apiModule: {
      getAll: () => import('../services/api').then(m => m.databaseApi.getAll()),
      create: (data) => import('../services/api').then(m => m.databaseApi.create(data))
    },
    createFormFields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'category', label: 'Category', type: 'text' }
    ]
  },
  experiment: {
    entityType: 'experiment',
    displayName: 'Experiment',
    displayField: 'name',
    descriptionField: 'description',
    apiModule: {
      getAll: () => import('../services/api').then(m => m.projectsApi.getAllExperiments()),
      create: (data) => import('../services/api').then(m => m.projectsApi.createExperiment(data))
    },
    createFormFields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' }
    ]
  },
  task: {
    entityType: 'task',
    displayName: 'Task',
    displayField: 'name',
    descriptionField: 'description',
    apiModule: {
      getAll: () => import('../services/api').then(m => m.tasksApi.getAll()),
      create: (data) => import('../services/api').then(m => m.tasksApi.create(data))
    },
    createFormFields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { 
        name: 'priority', 
        label: 'Priority', 
        type: 'select', 
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'critical', label: 'Critical' }
        ]
      }
    ],
    defaultCreateData: { priority: 'medium', status: 'todo' }
  },
  table: {
    entityType: 'table',
    displayName: 'Table',
    displayField: 'name',
    descriptionField: 'description',
    apiModule: {
      getAll: () => import('../services/api').then(m => m.tablesApi.getAll()),
      create: (data) => import('../services/api').then(m => m.tablesApi.create(data))
    },
    createFormFields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' }
    ]
  },
  literatureNote: {
    entityType: 'literatureNote',
    displayName: 'Literature Note',
    displayField: 'title',
    descriptionField: 'authors',
    apiModule: {
      getAll: () => import('../services/api').then(m => m.literatureNotesApi.getAll()),
      create: (data) => import('../services/api').then(m => m.literatureNotesApi.create(data))
    },
    createFormFields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'authors', label: 'Authors', type: 'text' },
      { name: 'year', label: 'Year', type: 'text' }
    ]
  }
}; 