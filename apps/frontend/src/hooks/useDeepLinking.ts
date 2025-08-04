import { useCallback } from 'react';

// Type definitions
interface DeepLinkParams {
    [key: string]: any;
}

interface DeepLinkResult {
    success: boolean;
    deepLink?: string;
    error?: string;
}

// Deep link hook
export const useDeepLinking = () => {
    // Check if we're in Electron environment
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

    // Create a deep link
    const createDeepLink = useCallback(async (
        entityType: string, 
        entityId?: string, 
        params: DeepLinkParams = {}
    ): Promise<DeepLinkResult> => {
        if (!isElectron) {
            return {
                success: false,
                error: 'Not in Electron environment'
            };
        }

        try {
            const result = await (window as any).electronAPI.createDeepLink(entityType, entityId, params);
            return result;
        } catch (error) {
            console.error('Error creating deep link:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }, [isElectron]);

    // Open a deep link
    const openDeepLink = useCallback(async (url: string): Promise<DeepLinkResult> => {
        if (!isElectron) {
            return {
                success: false,
                error: 'Not in Electron environment'
            };
        }

        try {
            const result = await (window as any).electronAPI.openDeepLink(url);
            return result;
        } catch (error) {
            console.error('Error opening deep link:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }, [isElectron]);

    // Get current window context
    const getDeepLinkContext = useCallback(async () => {
        if (!isElectron) {
            return {
                success: false,
                error: 'Not in Electron environment'
            };
        }

        try {
            const result = await (window as any).electronAPI.getDeepLinkContext();
            return result;
        } catch (error) {
            console.error('Error getting deep link context:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }, [isElectron]);

    // Convenience methods for common deep links
    const createNoteLink = useCallback((noteId: string, params: DeepLinkParams = {}) => {
        return createDeepLink('note', noteId, params);
    }, [createDeepLink]);

    const createProjectLink = useCallback((projectId: string, params: DeepLinkParams = {}) => {
        return createDeepLink('project', projectId, params);
    }, [createDeepLink]);

    const createPDFLink = useCallback((pdfId: string, params: DeepLinkParams = {}) => {
        return createDeepLink('pdf', pdfId, params);
    }, [createDeepLink]);

    const createProtocolLink = useCallback((protocolId: string, params: DeepLinkParams = {}) => {
        return createDeepLink('protocol', protocolId, params);
    }, [createDeepLink]);

    const createRecipeLink = useCallback((recipeId: string, params: DeepLinkParams = {}) => {
        return createDeepLink('recipe', recipeId, params);
    }, [createDeepLink]);

    const createTaskLink = useCallback((taskId: string, params: DeepLinkParams = {}) => {
        return createDeepLink('task', taskId, params);
    }, [createDeepLink]);

    const createSearchLink = useCallback((params: DeepLinkParams = {}) => {
        return createDeepLink('search', undefined, params);
    }, [createDeepLink]);

    const createDashboardLink = useCallback((params: DeepLinkParams = {}) => {
        return createDeepLink('dashboard', undefined, params);
    }, [createDeepLink]);

    // Copy deep link to clipboard
    const copyDeepLinkToClipboard = useCallback(async (
        entityType: string, 
        entityId?: string, 
        params: DeepLinkParams = {}
    ): Promise<DeepLinkResult> => {
        const result = await createDeepLink(entityType, entityId, params);
        
        if (result.success && result.deepLink) {
            try {
                await navigator.clipboard.writeText(result.deepLink);
                return {
                    success: true,
                    deepLink: result.deepLink
                };
            } catch (error) {
                console.error('Error copying to clipboard:', error);
                return {
                    success: false,
                    error: 'Failed to copy to clipboard'
                };
            }
        }
        
        return result;
    }, [createDeepLink]);

    // Share deep link (opens system share dialog if available)
    const shareDeepLink = useCallback(async (
        entityType: string, 
        entityId?: string, 
        params: DeepLinkParams = {}
    ): Promise<DeepLinkResult> => {
        const result = await createDeepLink(entityType, entityId, params);
        
        if (result.success && result.deepLink && navigator.share) {
            try {
                await navigator.share({
                    title: 'Research Notebook',
                    text: `Open in Research Notebook: ${entityType}${entityId ? ` ${entityId}` : ''}`,
                    url: result.deepLink
                });
                return {
                    success: true,
                    deepLink: result.deepLink
                };
            } catch (error) {
                console.error('Error sharing:', error);
                return {
                    success: false,
                    error: 'Failed to share'
                };
            }
        }
        
        return result;
    }, [createDeepLink]);

    return {
        // Core functionality
        createDeepLink,
        openDeepLink,
        getDeepLinkContext,
        
        // Convenience methods
        createNoteLink,
        createProjectLink,
        createPDFLink,
        createProtocolLink,
        createRecipeLink,
        createTaskLink,
        createSearchLink,
        createDashboardLink,
        
        // Utility methods
        copyDeepLinkToClipboard,
        shareDeepLink,
        
        // Environment check
        isElectron
    };
};

export default useDeepLinking; 