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
    const [windowContext, setWindowContext] = useRef<WindowContext | null>(null);

    // Consolidated initialization effect to prevent race conditions
    useEffect(() => {
        const initializeDeepLinkRouter = async () => {
            if (isInitialized.current) return;
            
            try {
                console.log('Initializing deep link router...');
                
                // Initialize electron API if available
                if (typeof window !== 'undefined' && (window as any).electronAPI) {
                    const electronAPI = (window as any).electronAPI;
                    
                    // Set up deep link entity listener
                    electronAPI.setDeepLinkEntityListener((entityData: any) => {
                        console.log('Received deep link entity:', entityData);
                        processDeepLinkEntity(entityData);
                    }).catch((error: any) => {
                        console.warn('Failed to set deep link entity listener:', error);
                    });

                    // Get window context for deep linking
                    electronAPI.getWindowContext().then((context: any) => {
                        console.log('Window context:', context);
                        setWindowContext(context);
                    }).catch((error: any) => {
                        console.warn('Failed to get window context:', error);
                    });
                }
                
                // Mark as initialized
                isInitialized.current = true;
                console.log('Deep link router initialized');
                
                // Process any pending deep links after a short delay
                setTimeout(() => {
                    processPendingDeepLinks();
                }, 100);
                
            } catch (error) {
                console.error('Error initializing deep link router:', error);
                // Mark as initialized even on error to prevent infinite retries
                isInitialized.current = true;
            }
        };

        initializeDeepLinkRouter();
        
        // Cleanup function
        return () => {
            if (typeof window !== 'undefined' && (window as any).electronAPI) {
                (window as any).electronAPI.removeDeepLinkEntityListener();
            }
        };
    }, []); // Only run once on mount

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

    // Function to process a single deep link entity
    const processDeepLinkEntity = (entityData: any) => {
        const entity: DeepLinkEntity = {
            entityType: entityData.entityType,
            entityId: entityData.entityId,
            params: entityData.params || {}
        };

        if (!isInitialized.current) {
            // Store for later processing
            pendingDeepLinks.current.push(entity);
            console.log('App not initialized, storing deep link for later');
            return;
        }

        // Process immediately
        handleDeepLinkNavigation(entity);
    };

    // Debug logging for development
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('DeepLinkRouter: Current location:', location.pathname + location.search);
        }
    }, [location]);

    return <>{children}</>;
};

export default DeepLinkRouter; 