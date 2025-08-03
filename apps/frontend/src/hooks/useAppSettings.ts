import { useState, useEffect, useCallback, useRef } from 'react';
import { loadLocalSettings, saveLocalSettings } from '@/utils/fileSystemAPI';

/**
 * Application settings interface
 */
export interface AppSettings {
    // Theme settings
    theme: 'light' | 'dark' | 'system';
    primaryColor: string;
    secondaryColor: string;

    // Editor preferences
    editor: {
        fontSize: number;
        fontFamily: string;
        lineHeight: number;
        tabSize: number;
        wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
        minimap: boolean;
        autoSave: boolean;
        autoSaveInterval: number; // in seconds
    };

    // Notification preferences
    notifications: {
        enabled: boolean;
        sound: boolean;
        desktop: boolean;
        browser: boolean;
        autoHide: boolean;
        autoHideDelay: number; // in milliseconds
        position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    };

    // UI preferences
    ui: {
        sidebarCollapsed: boolean;
        sidebarWidth: number;
        showToolbar: boolean;
        showStatusBar: boolean;
        compactMode: boolean;
        animations: boolean;
        reducedMotion: boolean;
    };

    // Data preferences
    data: {
        autoBackup: boolean;
        backupInterval: number; // in hours
        maxBackups: number;
        exportFormat: 'json' | 'csv' | 'pdf';
        importConfirm: boolean;
    };

    // Privacy settings
    privacy: {
        analytics: boolean;
        crashReports: boolean;
        telemetry: boolean;
        dataCollection: boolean;
    };

    // Advanced settings
    advanced: {
        debugMode: boolean;
        experimentalFeatures: boolean;
        developerMode: boolean;
        logLevel: 'error' | 'warn' | 'info' | 'debug';
    };

    // System settings
    system: {
        autoStartOnLogin: boolean;
        startMinimized: boolean;
        checkForUpdates: boolean;
        updateChannel: 'stable' | 'beta' | 'alpha';
    };
}

/**
 * Default application settings
 */
export const defaultSettings: AppSettings = {
    theme: 'system',
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',

    editor: {
        fontSize: 14,
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        lineHeight: 1.5,
        tabSize: 2,
        wordWrap: 'on',
        minimap: true,
        autoSave: true,
        autoSaveInterval: 30,
    },

    notifications: {
        enabled: true,
        sound: true,
        desktop: true,
        browser: true,
        autoHide: true,
        autoHideDelay: 5000,
        position: 'top-right',
    },

    ui: {
        sidebarCollapsed: false,
        sidebarWidth: 250,
        showToolbar: true,
        showStatusBar: true,
        compactMode: false,
        animations: true,
        reducedMotion: false,
    },

    data: {
        autoBackup: true,
        backupInterval: 24,
        maxBackups: 10,
        exportFormat: 'json',
        importConfirm: true,
    },

    privacy: {
        analytics: false,
        crashReports: true,
        telemetry: false,
        dataCollection: false,
    },

    advanced: {
        debugMode: false,
        experimentalFeatures: false,
        developerMode: false,
        logLevel: 'info',
    },

    system: {
        autoStartOnLogin: false,
        startMinimized: false,
        checkForUpdates: true,
        updateChannel: 'stable',
    },
};

/**
 * Settings update callback type
 */
export type SettingsUpdateCallback = (settings: AppSettings) => void;

/**
 * Custom hook for managing application settings
 * Provides settings state, update methods, and automatic saving
 */
export function useAppSettings() {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Debounce timer for auto-save
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Callbacks for settings changes
    const settingsCallbacks = useRef<Set<SettingsUpdateCallback>>(new Set());

    /**
     * Load settings from storage
     */
    const loadSettings = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const loadedSettings = await loadLocalSettings();

            // Merge loaded settings with defaults
            const mergedSettings = mergeSettings(defaultSettings, loadedSettings);

            setSettings(mergedSettings);
            setLastSaved(new Date());

            console.log('Settings loaded successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
            setError(errorMessage);
            console.error('Error loading settings:', err);

            // Use default settings if loading fails
            setSettings(defaultSettings);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Save settings to storage
     */
    const saveSettings = useCallback(async (newSettings: AppSettings) => {
        try {
            setIsSaving(true);
            setError(null);

            await saveLocalSettings(newSettings);

            setLastSaved(new Date());
            console.log('Settings saved successfully');

            // Notify callbacks
            settingsCallbacks.current.forEach(callback => callback(newSettings));

            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
            setError(errorMessage);
            console.error('Error saving settings:', err);

            return { success: false, error: errorMessage };
        } finally {
            setIsSaving(false);
        }
    }, []);

    /**
     * Update a single setting
     */
    const updateSetting = useCallback(<K extends keyof AppSettings>(
        key: K,
        value: AppSettings[K]
    ) => {
        setSettings(prevSettings => {
            const newSettings = {
                ...prevSettings,
                [key]: value
            };

            // Debounced auto-save
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(() => {
                saveSettings(newSettings);
            }, 1000); // 1 second debounce

            return newSettings;
        });
    }, [saveSettings]);

    /**
     * Update nested setting
     */
    const updateNestedSetting = useCallback(<
        K extends keyof AppSettings,
        N extends keyof AppSettings[K]
    >(
        category: K,
        key: N,
        value: AppSettings[K][N]
    ) => {
        setSettings(prevSettings => {
            const newSettings = {
                ...prevSettings,
                [category]: {
                    ...prevSettings[category],
                    [key]: value
                }
            };

            // Debounced auto-save
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(() => {
                saveSettings(newSettings);
            }, 1000); // 1 second debounce

            return newSettings;
        });
    }, [saveSettings]);

    /**
     * Update multiple settings at once
     */
    const updateMultipleSettings = useCallback((updates: Partial<AppSettings>) => {
        setSettings(prevSettings => {
            const newSettings = {
                ...prevSettings,
                ...updates
            };

            // Debounced auto-save
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(() => {
                saveSettings(newSettings);
            }, 1000); // 1 second debounce

            return newSettings;
        });
    }, [saveSettings]);

    /**
     * Reset settings to defaults
     */
    const resetSettings = useCallback(async () => {
        setSettings(defaultSettings);

        try {
            await saveSettings(defaultSettings);
            console.log('Settings reset to defaults');
        } catch (err) {
            console.error('Error resetting settings:', err);
        }
    }, [saveSettings]);

    /**
     * Export settings
     */
    const exportSettings = useCallback(() => {
        const settingsData = {
            settings,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };

        const blob = new Blob([JSON.stringify(settingsData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `app-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [settings]);

    /**
     * Import settings
     */
    const importSettings = useCallback(async (file: File) => {
        try {
            const text = await file.text();
            const importedData = JSON.parse(text);

            if (importedData.settings) {
                const mergedSettings = mergeSettings(defaultSettings, importedData.settings);
                setSettings(mergedSettings);
                await saveSettings(mergedSettings);
                console.log('Settings imported successfully');
                return { success: true };
            } else {
                throw new Error('Invalid settings file format');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to import settings';
            console.error('Error importing settings:', err);
            return { success: false, error: errorMessage };
        }
    }, [saveSettings]);

    /**
     * Subscribe to settings changes
     */
    const subscribeToSettings = useCallback((callback: SettingsUpdateCallback) => {
        settingsCallbacks.current.add(callback);

        // Return unsubscribe function
        return () => {
            settingsCallbacks.current.delete(callback);
        };
    }, []);

    /**
     * Get a specific setting value
     */
    const getSetting = useCallback(<K extends keyof AppSettings>(key: K): AppSettings[K] => {
        return settings[key];
    }, [settings]);

    /**
     * Get a nested setting value
     */
    const getNestedSetting = useCallback<
        <K extends keyof AppSettings, N extends keyof AppSettings[K]>(
            category: K,
            key: N
        ) => AppSettings[K][N]
    >((category, key) => {
        return settings[category][key];
    }, [settings]);

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return {
        // State
        settings,
        isLoading,
        isSaving,
        error,
        lastSaved,

        // Actions
        updateSetting,
        updateNestedSetting,
        updateMultipleSettings,
        resetSettings,
        exportSettings,
        importSettings,
        subscribeToSettings,

        // Getters
        getSetting,
        getNestedSetting,

        // Utilities
        loadSettings,
        saveSettings,
    };
}

/**
 * Merge settings with defaults, ensuring all properties exist
 */
function mergeSettings(defaults: AppSettings, loaded: any): AppSettings {
    const merged = { ...defaults };

    // Deep merge function
    const deepMerge = (target: any, source: any) => {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                deepMerge(target[key], source[key]);
            } else if (source[key] !== undefined) {
                target[key] = source[key];
            }
        }
    };

    deepMerge(merged, loaded);
    return merged;
}

/**
 * Hook for theme management
 */
export function useTheme() {
    const { getSetting, updateSetting } = useAppSettings();

    const theme = getSetting('theme');
    const primaryColor = getSetting('primaryColor');
    const secondaryColor = getSetting('secondaryColor');

    const setTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
        updateSetting('theme', newTheme);
    }, [updateSetting]);

    const setPrimaryColor = useCallback((color: string) => {
        updateSetting('primaryColor', color);
    }, [updateSetting]);

    const setSecondaryColor = useCallback((color: string) => {
        updateSetting('secondaryColor', color);
    }, [updateSetting]);

    return {
        theme,
        primaryColor,
        secondaryColor,
        setTheme,
        setPrimaryColor,
        setSecondaryColor,
    };
}

/**
 * Hook for editor preferences
 */
export function useEditorPreferences() {
    const { getNestedSetting, updateNestedSetting } = useAppSettings();

    const fontSize = getNestedSetting('editor', 'fontSize');
    const fontFamily = getNestedSetting('editor', 'fontFamily');
    const lineHeight = getNestedSetting('editor', 'lineHeight');
    const tabSize = getNestedSetting('editor', 'tabSize');
    const wordWrap = getNestedSetting('editor', 'wordWrap');
    const minimap = getNestedSetting('editor', 'minimap');
    const autoSave = getNestedSetting('editor', 'autoSave');
    const autoSaveInterval = getNestedSetting('editor', 'autoSaveInterval');

    const updateFontSize = useCallback((size: number) => {
        updateNestedSetting('editor', 'fontSize', size);
    }, [updateNestedSetting]);

    const updateFontFamily = useCallback((family: string) => {
        updateNestedSetting('editor', 'fontFamily', family);
    }, [updateNestedSetting]);

    const updateLineHeight = useCallback((height: number) => {
        updateNestedSetting('editor', 'lineHeight', height);
    }, [updateNestedSetting]);

    const updateTabSize = useCallback((size: number) => {
        updateNestedSetting('editor', 'tabSize', size);
    }, [updateNestedSetting]);

    const updateWordWrap = useCallback((wrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded') => {
        updateNestedSetting('editor', 'wordWrap', wrap);
    }, [updateNestedSetting]);

    const updateMinimap = useCallback((enabled: boolean) => {
        updateNestedSetting('editor', 'minimap', enabled);
    }, [updateNestedSetting]);

    const updateAutoSave = useCallback((enabled: boolean) => {
        updateNestedSetting('editor', 'autoSave', enabled);
    }, [updateNestedSetting]);

    const updateAutoSaveInterval = useCallback((interval: number) => {
        updateNestedSetting('editor', 'autoSaveInterval', interval);
    }, [updateNestedSetting]);

    return {
        fontSize,
        fontFamily,
        lineHeight,
        tabSize,
        wordWrap,
        minimap,
        autoSave,
        autoSaveInterval,
        updateFontSize,
        updateFontFamily,
        updateLineHeight,
        updateTabSize,
        updateWordWrap,
        updateMinimap,
        updateAutoSave,
        updateAutoSaveInterval,
    };
}

/**
 * Hook for notification preferences
 */
export function useNotificationPreferences() {
    const { getNestedSetting, updateNestedSetting } = useAppSettings();

    const enabled = getNestedSetting('notifications', 'enabled');
    const sound = getNestedSetting('notifications', 'sound');
    const desktop = getNestedSetting('notifications', 'desktop');
    const browser = getNestedSetting('notifications', 'browser');
    const autoHide = getNestedSetting('notifications', 'autoHide');
    const autoHideDelay = getNestedSetting('notifications', 'autoHideDelay');
    const position = getNestedSetting('notifications', 'position');

    const updateEnabled = useCallback((enabled: boolean) => {
        updateNestedSetting('notifications', 'enabled', enabled);
    }, [updateNestedSetting]);

    const updateSound = useCallback((sound: boolean) => {
        updateNestedSetting('notifications', 'sound', sound);
    }, [updateNestedSetting]);

    const updateDesktop = useCallback((desktop: boolean) => {
        updateNestedSetting('notifications', 'desktop', desktop);
    }, [updateNestedSetting]);

    const updateBrowser = useCallback((browser: boolean) => {
        updateNestedSetting('notifications', 'browser', browser);
    }, [updateNestedSetting]);

    const updateAutoHide = useCallback((autoHide: boolean) => {
        updateNestedSetting('notifications', 'autoHide', autoHide);
    }, [updateNestedSetting]);

    const updateAutoHideDelay = useCallback((delay: number) => {
        updateNestedSetting('notifications', 'autoHideDelay', delay);
    }, [updateNestedSetting]);

    const updatePosition = useCallback((position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => {
        updateNestedSetting('notifications', 'position', position);
    }, [updateNestedSetting]);

    return {
        enabled,
        sound,
        desktop,
        browser,
        autoHide,
        autoHideDelay,
        position,
        updateEnabled,
        updateSound,
        updateDesktop,
        updateBrowser,
        updateAutoHide,
        updateAutoHideDelay,
        updatePosition,
    };
}

export default useAppSettings; 