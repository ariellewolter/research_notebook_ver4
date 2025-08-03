import { useState, useEffect, useCallback } from 'react';
import { getAutoStartStatus, setAutoStart } from '../utils/fileSystemAPI';

export interface AutoStartStatus {
    success: boolean;
    openAtLogin: boolean;
    openAsHidden: boolean;
    path?: string;
    error?: string;
}

export function useAutoStart() {
    const [status, setStatus] = useState<AutoStartStatus>({
        success: false,
        openAtLogin: false,
        openAsHidden: false
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadStatus = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await getAutoStartStatus();
            setStatus(result);
            if (!result.success && result.error) {
                setError(result.error);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load auto-start status';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const toggleAutoStart = useCallback(async (enabled: boolean) => {
        try {
            setIsUpdating(true);
            setError(null);
            const result = await setAutoStart(enabled);
            if (result.success) {
                setStatus(prev => ({
                    ...prev,
                    openAtLogin: result.enabled,
                    success: true
                }));
            } else {
                setError(result.error || 'Failed to update auto-start setting');
            }
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update auto-start setting';
            setError(errorMessage);
            return { success: false, enabled: false, error: errorMessage };
        } finally {
            setIsUpdating(false);
        }
    }, []);

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    return {
        status,
        isLoading,
        isUpdating,
        error,
        isEnabled: status.openAtLogin,
        toggleAutoStart,
        enableAutoStart: () => toggleAutoStart(true),
        disableAutoStart: () => toggleAutoStart(false),
        refreshStatus: loadStatus,
        isSupported: status.success || !error,
        canToggle: !isLoading && !isUpdating && (status.success || !error)
    };
} 