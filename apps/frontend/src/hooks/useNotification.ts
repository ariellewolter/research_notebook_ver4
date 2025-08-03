import { useCallback, useState } from 'react';
import { showNotification, showNotificationAdvanced } from '@/utils/fileSystemAPI';

/**
 * Notification options interface
 */
export interface NotificationOptions {
    /** Whether the notification should be silent */
    silent?: boolean;
    /** Icon URL for the notification */
    icon?: string;
    /** Badge text for the notification */
    badge?: string;
    /** Tag to group notifications */
    tag?: string;
    /** Whether the notification requires user interaction */
    requireInteraction?: boolean;
    /** Actions for the notification */
    actions?: Array<{
        type: 'button';
        text: string;
    }>;
    /** Urgency level of the notification */
    urgency?: 'low' | 'normal' | 'high';
    /** Callback when notification is clicked */
    onClick?: () => void;
    /** Callback when notification is closed */
    onClose?: () => void;
}

/**
 * Notification result interface
 */
export interface NotificationResult {
    /** Whether the notification was shown successfully */
    success: boolean;
    /** Notification ID (if available) */
    id?: string;
    /** Error message (if any) */
    error?: string;
}

/**
 * Custom hook for handling notifications
 * Provides easy-to-use notification functionality with Electron IPC integration
 * and browser fallbacks
 */
export function useNotification() {
    /**
     * Show a simple notification
     * @param title - Notification title
     * @param body - Notification body text
     * @returns Promise<boolean> - Whether the notification was shown successfully
     */
    const notify = useCallback(async (title: string, body: string): Promise<boolean> => {
        try {
            return await showNotification(title, body);
        } catch (error) {
            console.error('Error showing notification:', error);
            return false;
        }
    }, []);

    /**
     * Show an advanced notification with options
     * @param title - Notification title
     * @param body - Notification body text
     * @param options - Advanced notification options
     * @returns Promise<NotificationResult> - Detailed notification result
     */
    const notifyAdvanced = useCallback(async (
        title: string,
        body: string,
        options: NotificationOptions = {}
    ): Promise<NotificationResult> => {
        try {
            return await showNotificationAdvanced(title, body, options);
        } catch (error) {
            console.error('Error showing advanced notification:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }, []);

    /**
     * Show a success notification
     * @param title - Notification title
     * @param body - Notification body text
     * @param options - Additional options
     * @returns Promise<NotificationResult> - Notification result
     */
    const notifySuccess = useCallback(async (
        title: string,
        body: string,
        options: NotificationOptions = {}
    ): Promise<NotificationResult> => {
        return await notifyAdvanced(title, body, {
            icon: options.icon || '/icons/success.png',
            tag: 'success',
            urgency: 'normal',
            ...options
        });
    }, [notifyAdvanced]);

    /**
     * Show an error notification
     * @param title - Notification title
     * @param body - Notification body text
     * @param options - Additional options
     * @returns Promise<NotificationResult> - Notification result
     */
    const notifyError = useCallback(async (
        title: string,
        body: string,
        options: NotificationOptions = {}
    ): Promise<NotificationResult> => {
        return await notifyAdvanced(title, body, {
            icon: options.icon || '/icons/error.png',
            tag: 'error',
            urgency: 'high',
            requireInteraction: true,
            ...options
        });
    }, [notifyAdvanced]);

    /**
     * Show a warning notification
     * @param title - Notification title
     * @param body - Notification body text
     * @param options - Additional options
     * @returns Promise<NotificationResult> - Notification result
     */
    const notifyWarning = useCallback(async (
        title: string,
        body: string,
        options: NotificationOptions = {}
    ): Promise<NotificationResult> => {
        return await notifyAdvanced(title, body, {
            icon: options.icon || '/icons/warning.png',
            tag: 'warning',
            urgency: 'normal',
            ...options
        });
    }, [notifyAdvanced]);

    /**
     * Show an info notification
     * @param title - Notification title
     * @param body - Notification body text
     * @param options - Additional options
     * @returns Promise<NotificationResult> - Notification result
     */
    const notifyInfo = useCallback(async (
        title: string,
        body: string,
        options: NotificationOptions = {}
    ): Promise<NotificationResult> => {
        return await notifyAdvanced(title, body, {
            icon: options.icon || '/icons/info.png',
            tag: 'info',
            urgency: 'low',
            ...options
        });
    }, [notifyAdvanced]);

    /**
     * Show a notification with actions
     * @param title - Notification title
     * @param body - Notification body text
     * @param actions - Array of action buttons
     * @param options - Additional options
     * @returns Promise<NotificationResult> - Notification result
     */
    const notifyWithActions = useCallback(async (
        title: string,
        body: string,
        actions: Array<{ text: string; onClick: () => void }>,
        options: NotificationOptions = {}
    ): Promise<NotificationResult> => {
        const notificationActions = actions.map(action => ({
            type: 'button' as const,
            text: action.text
        }));

        return await notifyAdvanced(title, body, {
            requireInteraction: true,
            actions: notificationActions,
            ...options
        });
    }, [notifyAdvanced]);

    /**
     * Show a persistent notification that requires user interaction
     * @param title - Notification title
     * @param body - Notification body text
     * @param options - Additional options
     * @returns Promise<NotificationResult> - Notification result
     */
    const notifyPersistent = useCallback(async (
        title: string,
        body: string,
        options: NotificationOptions = {}
    ): Promise<NotificationResult> => {
        return await notifyAdvanced(title, body, {
            requireInteraction: true,
            urgency: 'high',
            ...options
        });
    }, [notifyAdvanced]);

    /**
     * Show a silent notification (no sound)
     * @param title - Notification title
     * @param body - Notification body text
     * @param options - Additional options
     * @returns Promise<NotificationResult> - Notification result
     */
    const notifySilent = useCallback(async (
        title: string,
        body: string,
        options: NotificationOptions = {}
    ): Promise<NotificationResult> => {
        return await notifyAdvanced(title, body, {
            silent: true,
            ...options
        });
    }, [notifyAdvanced]);

    return {
        // Basic notification
        notify,

        // Advanced notification
        notifyAdvanced,

        // Predefined notification types
        notifySuccess,
        notifyError,
        notifyWarning,
        notifyInfo,

        // Specialized notifications
        notifyWithActions,
        notifyPersistent,
        notifySilent
    };
}

/**
 * Hook for managing notification permissions
 */
export function useNotificationPermissions() {
    /**
     * Request notification permission
     * @returns Promise<boolean> - Whether permission was granted
     */
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }, []);

    /**
     * Check if notifications are supported
     * @returns boolean - Whether notifications are supported
     */
    const isSupported = useCallback((): boolean => {
        return 'Notification' in window;
    }, []);

    /**
     * Get current notification permission status
     * @returns string - Permission status ('granted', 'denied', 'default')
     */
    const getPermissionStatus = useCallback((): string => {
        if ('Notification' in window) {
            return Notification.permission;
        }
        return 'denied';
    }, []);

    return {
        requestPermission,
        isSupported,
        getPermissionStatus
    };
}

/**
 * Hook for managing notification state
 */
export function useNotificationState() {
    const [notifications, setNotifications] = useState<Array<{
        id: string;
        title: string;
        body: string;
        timestamp: Date;
        type: 'success' | 'error' | 'warning' | 'info';
    }>>([]);

    /**
     * Add a notification to the state
     */
    const addNotification = useCallback((notification: {
        title: string;
        body: string;
        type: 'success' | 'error' | 'warning' | 'info';
    }) => {
        const newNotification = {
            id: Date.now().toString(),
            ...notification,
            timestamp: new Date()
        };
        setNotifications(prev => [...prev, newNotification]);
    }, []);

    /**
     * Remove a notification from the state
     */
    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    /**
     * Clear all notifications
     */
    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    return {
        notifications,
        addNotification,
        removeNotification,
        clearNotifications
    };
}

export default useNotification; 