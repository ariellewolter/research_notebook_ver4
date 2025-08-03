import { useState, useCallback, useEffect } from 'react';

/**
 * Window context interface
 */
export interface WindowContext {
    id: string;
    route: string;
    params: Record<string, any>;
    isDev: boolean;
}

/**
 * Window information interface
 */
export interface WindowInfo {
    id: string;
    title: string;
    isVisible: boolean;
    isMinimized: boolean;
    isMaximized: boolean;
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

/**
 * Window operation result interface
 */
export interface WindowResult {
    success: boolean;
    windowId?: string;
    error?: string;
}

/**
 * Window manager hook for handling multi-window operations
 */
export function useWindowManager() {
    const [isElectron, setIsElectron] = useState(false);
    const [currentWindowContext, setCurrentWindowContext] = useState<WindowContext | null>(null);
    const [openWindows, setOpenWindows] = useState<WindowInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if running in Electron
    useEffect(() => {
        const checkElectron = () => {
            const electronAvailable = !!(window.electronAPI);
            setIsElectron(electronAvailable);
            
            if (electronAvailable) {
                // Set up window context listener
                window.electronAPI.onWindowContext((event: any, context: WindowContext) => {
                    setCurrentWindowContext(context);
                    console.log('Window context received:', context);
                });

                // Load initial window list
                loadOpenWindows();
            }
        };

        checkElectron();
    }, []);

    /**
     * Load list of open windows
     */
    const loadOpenWindows = useCallback(async () => {
        if (!isElectron) return;

        try {
            const result = await window.electronAPI.getAllWindows();
            if (result.success) {
                setOpenWindows(result.windows);
            } else {
                console.error('Failed to load windows:', result.error);
            }
        } catch (err) {
            console.error('Error loading windows:', err);
        }
    }, [isElectron]);

    /**
     * Open a popout window for any route
     */
    const openPopout = useCallback(async (route: string, params: Record<string, any> = {}): Promise<WindowResult> => {
        setError(null);
        setIsLoading(true);

        try {
            if (isElectron && window.electronAPI?.openPopoutWindow) {
                const result = await window.electronAPI.openPopoutWindow(route, params);
                
                if (result.success) {
                    // Reload window list
                    await loadOpenWindows();
                    return { success: true, windowId: result.windowId };
                } else {
                    const errorMsg = result.error || 'Failed to open popout window';
                    setError(errorMsg);
                    return { success: false, error: errorMsg };
                }
            } else {
                // Web fallback: navigate in current window
                const searchParams = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    searchParams.append(key, String(value));
                });
                
                const url = `${route}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
                window.location.href = url;
                
                return { success: true, windowId: 'current' };
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error opening popout window';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsLoading(false);
        }
    }, [isElectron, loadOpenWindows]);

    /**
     * Open a PDF viewer window
     */
    const openPDF = useCallback(async (filePath: string, params: Record<string, any> = {}): Promise<WindowResult> => {
        setError(null);
        setIsLoading(true);

        try {
            if (isElectron && window.electronAPI?.openPDFWindow) {
                const result = await window.electronAPI.openPDFWindow(filePath, params);
                
                if (result.success) {
                    // Reload window list
                    await loadOpenWindows();
                    return { success: true, windowId: result.windowId };
                } else {
                    const errorMsg = result.error || 'Failed to open PDF window';
                    setError(errorMsg);
                    return { success: false, error: errorMsg };
                }
            } else {
                // Web fallback: try to open PDF in new tab
                try {
                    const url = filePath.startsWith('http') ? filePath : `/api/files/${encodeURIComponent(filePath)}`;
                    window.open(url, '_blank');
                    return { success: true, windowId: 'new-tab' };
                } catch (fallbackErr) {
                    const errorMsg = 'PDF viewing not supported in web mode';
                    setError(errorMsg);
                    return { success: false, error: errorMsg };
                }
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error opening PDF window';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsLoading(false);
        }
    }, [isElectron, loadOpenWindows]);

    /**
     * Open an editor window
     */
    const openEditor = useCallback(async (documentId?: string, mode: string = 'edit', params: Record<string, any> = {}): Promise<WindowResult> => {
        setError(null);
        setIsLoading(true);

        try {
            if (isElectron && window.electronAPI?.openEditorWindow) {
                const result = await window.electronAPI.openEditorWindow(documentId, mode, params);
                
                if (result.success) {
                    await loadOpenWindows();
                    return { success: true, windowId: result.windowId };
                } else {
                    const errorMsg = result.error || 'Failed to open editor window';
                    setError(errorMsg);
                    return { success: false, error: errorMsg };
                }
            } else {
                // Web fallback: navigate to editor route
                const searchParams = new URLSearchParams();
                if (documentId) searchParams.append('documentId', documentId);
                searchParams.append('mode', mode);
                Object.entries(params).forEach(([key, value]) => {
                    searchParams.append(key, String(value));
                });
                
                const url = `/editor${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
                window.location.href = url;
                
                return { success: true, windowId: 'current' };
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error opening editor window';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsLoading(false);
        }
    }, [isElectron, loadOpenWindows]);

    /**
     * Open a settings window
     */
    const openSettings = useCallback(async (tab: string = 'general', params: Record<string, any> = {}): Promise<WindowResult> => {
        setError(null);
        setIsLoading(true);

        try {
            if (isElectron && window.electronAPI?.openSettingsWindow) {
                const result = await window.electronAPI.openSettingsWindow(tab, params);
                
                if (result.success) {
                    await loadOpenWindows();
                    return { success: true, windowId: result.windowId };
                } else {
                    const errorMsg = result.error || 'Failed to open settings window';
                    setError(errorMsg);
                    return { success: false, error: errorMsg };
                }
            } else {
                // Web fallback: navigate to settings route
                const searchParams = new URLSearchParams();
                searchParams.append('tab', tab);
                Object.entries(params).forEach(([key, value]) => {
                    searchParams.append(key, String(value));
                });
                
                const url = `/settings${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
                window.location.href = url;
                
                return { success: true, windowId: 'current' };
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error opening settings window';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsLoading(false);
        }
    }, [isElectron, loadOpenWindows]);

    /**
     * Close a specific window
     */
    const closeWindow = useCallback(async (windowId: string): Promise<WindowResult> => {
        if (!isElectron || !window.electronAPI?.closeWindow) {
            return { success: false, error: 'Window management not available' };
        }

        try {
            const result = await window.electronAPI.closeWindow(windowId);
            if (result.success) {
                await loadOpenWindows();
                return { success: true };
            } else {
                return { success: false, error: result.error || 'Failed to close window' };
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error closing window';
            return { success: false, error: errorMsg };
        }
    }, [isElectron, loadOpenWindows]);

    /**
     * Focus a specific window
     */
    const focusWindow = useCallback(async (windowId: string): Promise<WindowResult> => {
        if (!isElectron || !window.electronAPI?.focusWindow) {
            return { success: false, error: 'Window management not available' };
        }

        try {
            const result = await window.electronAPI.focusWindow(windowId);
            return { success: result.success, error: result.error };
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error focusing window';
            return { success: false, error: errorMsg };
        }
    }, [isElectron]);

    /**
     * Get current window context
     */
    const getCurrentWindowContext = useCallback(async (): Promise<WindowContext | null> => {
        if (!isElectron || !window.electronAPI?.getCurrentWindowContext) {
            return currentWindowContext;
        }

        try {
            const result = await window.electronAPI.getCurrentWindowContext();
            if (result.success) {
                const context: WindowContext = {
                    id: result.windowId,
                    route: result.route,
                    params: result.params,
                    isDev: result.isDev
                };
                setCurrentWindowContext(context);
                return context;
            }
            return null;
        } catch (err) {
            console.error('Error getting window context:', err);
            return null;
        }
    }, [isElectron, currentWindowContext]);

    /**
     * Refresh the list of open windows
     */
    const refreshWindows = useCallback(async () => {
        await loadOpenWindows();
    }, [loadOpenWindows]);

    return {
        // State
        isElectron,
        currentWindowContext,
        openWindows,
        isLoading,
        error,

        // Actions
        openPopout,
        openPDF,
        openEditor,
        openSettings,
        closeWindow,
        focusWindow,
        getCurrentWindowContext,
        refreshWindows,

        // Computed
        canManageWindows: isElectron && !!window.electronAPI,
        windowCount: openWindows.length
    };
}

/**
 * Convenience hook for opening popout windows
 */
export function usePopoutWindows() {
    const { openPopout, isLoading, error } = useWindowManager();

    const openNotesPopout = useCallback((params: Record<string, any> = {}) => {
        return openPopout('/notes', params);
    }, [openPopout]);

    const openCalendarPopout = useCallback((params: Record<string, any> = {}) => {
        return openPopout('/calendar', params);
    }, [openPopout]);

    const openResearchPopout = useCallback((params: Record<string, any> = {}) => {
        return openPopout('/research', params);
    }, [openPopout]);

    const openTasksPopout = useCallback((params: Record<string, any> = {}) => {
        return openPopout('/tasks', params);
    }, [openPopout]);

    return {
        openPopout,
        openNotesPopout,
        openCalendarPopout,
        openResearchPopout,
        openTasksPopout,
        isLoading,
        error
    };
}

/**
 * Convenience hook for PDF operations
 */
export function usePDFWindows() {
    const { openPDF, isLoading, error } = useWindowManager();

    const openPDFViewer = useCallback((filePath: string, page?: number, zoom?: number) => {
        const params: Record<string, any> = {};
        if (page !== undefined) params.page = page;
        if (zoom !== undefined) params.zoom = zoom;
        
        return openPDF(filePath, params);
    }, [openPDF]);

    return {
        openPDF,
        openPDFViewer,
        isLoading,
        error
    };
} 