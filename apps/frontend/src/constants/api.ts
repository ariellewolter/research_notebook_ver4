export const API_ENDPOINTS = {
    // Auth
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        PROFILE: '/auth/profile',
    },
    
    // Projects
    PROJECTS: {
        BASE: '/projects',
        STATS: '/projects/stats',
        EXPERIMENTS: (projectId: string) => `/projects/${projectId}/experiments`,
    },
    
    // Notes
    NOTES: {
        BASE: '/notes',
        STATS: '/notes/stats',
        SEARCH: (query: string) => `/notes/search/${query}`,
        BY_DATE: (date: string) => `/notes/date/${date}`,
    },
    
    // Links
    LINKS: {
        BASE: '/links',
        BACKLINKS: (entityType: string, entityId: string) => `/links/backlinks/${entityType}/${entityId}`,
        OUTGOING: (entityType: string, entityId: string) => `/links/outgoing/${entityType}/${entityId}`,
        GRAPH: '/links/graph',
        SEARCH: (query: string) => `/links/search/${query}`,
    },
    
    // Database
    DATABASE: {
        BASE: '/database',
        SEARCH: (query: string) => `/database/search/${query}`,
    },
    
    // Tasks
    TASKS: {
        BASE: '/tasks',
        DEPENDENCIES: (id: string) => `/tasks/${id}/dependencies`,
    },
    
    // Zotero
    ZOTERO: {
        SYNC: '/zotero/sync',
        ITEMS: '/zotero/items',
        COLLECTIONS: '/zotero/collections',
    },
    
    // Recipes
    RECIPES: {
        BASE: '/recipes',
        EXECUTE: (id: string) => `/recipes/${id}/execute`,
    },
    
    // PDFs
    PDFS: {
        BASE: '/pdfs',
        UPLOAD: '/pdfs/upload',
    },
} as const;

export const API_CONFIG = {
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
} as const;

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
} as const; 