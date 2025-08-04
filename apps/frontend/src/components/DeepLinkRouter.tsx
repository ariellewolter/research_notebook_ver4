import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Type definitions for deep link entities
interface DeepLinkEntity {
    entityType: string;
    entityId?: string;
    params: Record<string, any>;
}

// Type definitions for window context
interface WindowContext {
    windowId: string;
    route: string;
    params: Record<string, any>;
    isDev: boolean;
}

// Deep link route mapping
const DEEP_LINK_ROUTES: Record<string, (entityId?: string, params?: Record<string, any>) => string> = {
    note: (entityId, params) => {
        if (!entityId) return '/notes';
        const queryParams = new URLSearchParams();
        if (params?.mode) queryParams.set('mode', params.mode);
        if (params?.section) queryParams.set('section', params.section);
        if (params?.highlight) queryParams.set('highlight', params.highlight);
        const queryString = queryParams.toString();
        return `/notes/${entityId}${queryString ? `?${queryString}` : ''}`;
    },
    
    project: (entityId, params) => {
        if (!entityId) return '/projects';
        const queryParams = new URLSearchParams();
        if (params?.view) queryParams.set('view', params.view);
        if (params?.tab) queryParams.set('tab', params.tab);
        if (params?.filter) queryParams.set('filter', params.filter);
        const queryString = queryParams.toString();
        return `/projects/${entityId}${queryString ? `?${queryString}` : ''}`;
    },
    
    pdf: (entityId, params) => {
        if (!entityId) return '/pdfs';
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set('page', params.page);
        if (params?.zoom) queryParams.set('zoom', params.zoom);
        if (params?.highlight) queryParams.set('highlight', params.highlight);
        const queryString = queryParams.toString();
        return `/pdfs/${entityId}${queryString ? `?${queryString}` : ''}`;
    },
    
    protocol: (entityId, params) => {
        if (!entityId) return '/protocols';
        const queryParams = new URLSearchParams();
        if (params?.step) queryParams.set('step', params.step);
        if (params?.mode) queryParams.set('mode', params.mode);
        const queryString = queryParams.toString();
        return `/protocols/${entityId}${queryString ? `?${queryString}` : ''}`;
    },
    
    recipe: (entityId, params) => {
        if (!entityId) return '/recipes';
        const queryParams = new URLSearchParams();
        if (params?.step) queryParams.set('step', params.step);
        if (params?.mode) queryParams.set('mode', params.mode);
        const queryString = queryParams.toString();
        return `/recipes/${entityId}${queryString ? `?${queryString}` : ''}`;
    },
    
    task: (entityId, params) => {
        if (!entityId) return '/tasks';
        const queryParams = new URLSearchParams();
        if (params?.mode) queryParams.set('mode', params.mode);
        if (params?.show) queryParams.set('show', params.show);
        const queryString = queryParams.toString();
        return `/tasks/${entityId}${queryString ? `?${queryString}` : ''}`;
    },
    
    search: (entityId, params) => {
        const queryParams = new URLSearchParams();
        if (params?.q) queryParams.set('q', params.q);
        if (params?.query) queryParams.set('q', params.query);
        if (params?.type) queryParams.set('type', params.type);
        if (params?.filters) {
            try {
                const filters = typeof params.filters === 'string' ? JSON.parse(params.filters) : params.filters;
                Object.entries(filters).forEach(([key, value]) => {
                    queryParams.set(`filter_${key}`, String(value));
                });
            } catch (error) {
                console.warn('Failed to parse filters:', error);
            }
        }
        const queryString = queryParams.toString();
        return `/search${queryString ? `?${queryString}` : ''}`;
    },
    
    dashboard: (entityId, params) => {
        const queryParams = new URLSearchParams();
        if (params?.view) queryParams.set('view', params.view);
        if (params?.tab) queryParams.set('tab', params.tab);
        if (params?.filters) {
            try {
                const filters = typeof params.filters === 'string' ? JSON.parse(params.filters) : params.filters;
                Object.entries(filters).forEach(([key, value]) => {
                    queryParams.set(`filter_${key}`, String(value));
                });
            } catch (error) {
                console.warn('Failed to parse filters:', error);
            }
        }
        const queryString = queryParams.toString();
        return `/dashboard${queryString ? `?${queryString}` : ''}`;
    }
};

interface DeepLinkRouterProps {
    children: React.ReactNode;
}

const DeepLinkRouter: React.FC<DeepLinkRouterProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isInitialized = useRef(false);
    const pendingDeepLinks = useRef<DeepLinkEntity[]>([]);

    // Function to handle deep link navigation
    const handleDeepLinkNavigation = (entity: DeepLinkEntity) => {
        try {
            console.log('Handling deep link navigation:', entity);
            
            const { entityType, entityId, params } = entity;
            
            // Check if we have a route handler for this entity type
            const routeHandler = DEEP_LINK_ROUTES[entityType.toLowerCase()];
            if (!routeHandler) {
                console.warn(`No route handler found for entity type: ${entityType}`);
                // Navigate to dashboard as fallback
                navigate('/dashboard');
                return;
            }
            
            // Generate the route
            const route = routeHandler(entityId, params);
            console.log(`Navigating to route: ${route}`);
            
            // Navigate to the route
            navigate(route, { replace: true });
            
        } catch (error) {
            console.error('Error handling deep link navigation:', error);
            // Navigate to dashboard as fallback
            navigate('/dashboard');
        }
    };

    // Function to process pending deep links
    const processPendingDeepLinks = () => {
        if (pendingDeepLinks.current.length > 0) {
            console.log('Processing pending deep links:', pendingDeepLinks.current);
            pendingDeepLinks.current.forEach(entity => {
                handleDeepLinkNavigation(entity);
            });
            pendingDeepLinks.current = [];
        }
    };

    // Initialize deep link listeners
    useEffect(() => {
        // Check if we're in Electron environment
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            const electronAPI = (window as any).electronAPI;
            
            // Listen for deep link entity events from main process
            const handleDeepLinkEntity = (event: any, entity: DeepLinkEntity) => {
                console.log('Received deep link entity event:', entity);
                
                if (!isInitialized.current) {
                    // Store for later processing
                    pendingDeepLinks.current.push(entity);
                    console.log('App not initialized, storing deep link for later');
                    return;
                }
                
                // Process immediately
                handleDeepLinkNavigation(entity);
            };
            
            // Set up the listener
            electronAPI.onDeepLinkEntity(handleDeepLinkEntity);
            
            // Get window context to check if we're in a specific window
            electronAPI.getDeepLinkContext().then((context: WindowContext) => {
                console.log('Window context:', context);
                
                // If we have specific window parameters, handle them
                if (context.params && Object.keys(context.params).length > 0) {
                    const { windowType, ...params } = context.params;
                    
                    // Handle specific window types
                    if (windowType) {
                        switch (windowType) {
                            case 'note-editor':
                                if (params.noteId) {
                                    handleDeepLinkNavigation({
                                        entityType: 'note',
                                        entityId: params.noteId,
                                        params
                                    });
                                }
                                break;
                            case 'project-dashboard':
                                if (params.projectId) {
                                    handleDeepLinkNavigation({
                                        entityType: 'project',
                                        entityId: params.projectId,
                                        params
                                    });
                                }
                                break;
                            case 'pdf-viewer':
                                if (params.pdfId || params.filePath) {
                                    handleDeepLinkNavigation({
                                        entityType: 'pdf',
                                        entityId: params.pdfId || params.filePath,
                                        params
                                    });
                                }
                                break;
                            case 'protocol-viewer':
                                if (params.protocolId) {
                                    handleDeepLinkNavigation({
                                        entityType: 'protocol',
                                        entityId: params.protocolId,
                                        params
                                    });
                                }
                                break;
                            case 'recipe-viewer':
                                if (params.recipeId) {
                                    handleDeepLinkNavigation({
                                        entityType: 'recipe',
                                        entityId: params.recipeId,
                                        params
                                    });
                                }
                                break;
                            case 'task-editor':
                                if (params.taskId) {
                                    handleDeepLinkNavigation({
                                        entityType: 'task',
                                        entityId: params.taskId,
                                        params
                                    });
                                }
                                break;
                            case 'search':
                                handleDeepLinkNavigation({
                                    entityType: 'search',
                                    params
                                });
                                break;
                            case 'dashboard':
                                handleDeepLinkNavigation({
                                    entityType: 'dashboard',
                                    params
                                });
                                break;
                        }
                    }
                }
            }).catch((error: any) => {
                console.warn('Failed to get window context:', error);
            });
            
            // Cleanup function
            return () => {
                electronAPI.removeDeepLinkEntityListener();
            };
        }
    }, []);

    // Mark as initialized and process pending deep links
    useEffect(() => {
        if (!isInitialized.current) {
            isInitialized.current = true;
            console.log('Deep link router initialized');
            
            // Process any pending deep links
            setTimeout(() => {
                processPendingDeepLinks();
            }, 100);
        }
    }, [location.pathname]);

    // Debug logging for development
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('DeepLinkRouter: Current location:', location.pathname + location.search);
        }
    }, [location]);

    return <>{children}</>;
};

export default DeepLinkRouter; 