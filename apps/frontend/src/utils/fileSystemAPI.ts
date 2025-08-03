// File System API - Swappable implementation for Electron and browser environments

export interface FileSystemAPI {
    openFileDialog(options?: OpenFileOptions): Promise<string[]>;
    saveFileDialog(defaultNameOrContent?: string, defaultFileName?: string): Promise<string | null | { success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
    selectDirectory(): Promise<string[]>;
    showNotification(title: string, body: string): Promise<boolean>;
    showNotificationAdvanced(title: string, body: string, options?: any): Promise<{ success: boolean; id?: string; error?: string }>;
    saveFileWithDialog(defaultFileName: string, content: string): Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
    saveFileDialogAdvanced(options?: any): Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
    loadLocalSettings(): Promise<object>;
    saveLocalSettings(settings: object): Promise<{ success: boolean; error?: string }>;
    loadSettings(): Promise<{ success: boolean; settings: object; error?: string }>;
    saveSettings(settings: object): Promise<{ success: boolean; error?: string }>;
    getAutoStartStatus(): Promise<{ success: boolean; openAtLogin: boolean; openAsHidden: boolean; path?: string; error?: string }>;
    setAutoStart(enabled: boolean): Promise<{ success: boolean; enabled: boolean; error?: string }>;
    openFileFromPath(filePath: string): Promise<{ success: boolean; windowId?: string; error?: string }>;
    registerFileAssociations(): Promise<{ success: boolean; error?: string }>;
    isElectron(): boolean;
    getAppInfo(): AppInfo;
}

export interface OpenFileOptions {
    filters?: FileFilter[];
    multiple?: boolean;
    title?: string;
}

export interface FileFilter {
    name: string;
    extensions: string[];
}

export interface AppInfo {
    name: string;
    version: string;
    platform: string;
    isElectron: boolean;
}

// Electron implementation
class ElectronFileSystemAPI implements FileSystemAPI {
    async openFileDialog(options: OpenFileOptions = {}): Promise<string[]> {
        if (window.electronAPI?.openFileDialog) {
            return await window.electronAPI.openFileDialog();
        }
        throw new Error('Electron API not available');
    }

    async saveFileDialog(defaultName?: string): Promise<string | null>;
    async saveFileDialog(content: string, defaultFileName: string): Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
    async saveFileDialog(defaultNameOrContent?: string, defaultFileName?: string): Promise<string | null | { success: boolean; filePath?: string; error?: string; canceled?: boolean }> {
        // Check if this is the content + filename version
        if (defaultFileName && typeof defaultNameOrContent === 'string') {
            // This is the content + filename version
            if (window.electronAPI?.saveFileWithDialog) {
                return await window.electronAPI.saveFileWithDialog(defaultFileName, defaultNameOrContent);
            }
            return { success: false, error: 'Electron API not available' };
        } else {
            // This is the original version (just defaultName)
            if (window.electronAPI?.saveFileDialog) {
                const result = await window.electronAPI.saveFileDialog(defaultNameOrContent);
                return result;
            }
            throw new Error('Electron API not available');
        }
    }

    async selectDirectory(): Promise<string[]> {
        if (window.electronAPI?.selectDirectory) {
            return await window.electronAPI.selectDirectory();
        }
        throw new Error('Electron API not available');
    }

    async showNotification(title: string, body: string): Promise<boolean> {
        if (window.electronAPI?.showNotification) {
            return await window.electronAPI.showNotification(title, body);
        }
        return false;
    }

    async showNotificationAdvanced(title: string, body: string, options?: any): Promise<{ success: boolean; id?: string; error?: string }> {
        if (window.electronAPI?.showNotificationAdvanced) {
            return await window.electronAPI.showNotificationAdvanced(title, body, options);
        }
        return { success: false, error: 'Electron API not available' };
    }

    async saveFileWithDialog(defaultFileName: string, content: string): Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }> {
        if (window.electronAPI?.saveFileWithDialog) {
            return await window.electronAPI.saveFileWithDialog(defaultFileName, content);
        }
        return { success: false, error: 'Electron API not available' };
    }

    async saveFileDialogAdvanced(options?: any): Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }> {
        if (window.electronAPI?.saveFileDialog) {
            return await window.electronAPI.saveFileDialog(options);
        }
        return { success: false, error: 'Electron API not available' };
    }

    async loadLocalSettings(): Promise<object> {
        if (window.electronAPI?.loadLocalSettings) {
            return await window.electronAPI.loadLocalSettings();
        }
        return {};
    }

    async saveLocalSettings(settings: object): Promise<{ success: boolean; error?: string }> {
        if (window.electronAPI?.saveLocalSettings) {
            return await window.electronAPI.saveLocalSettings(settings);
        }
        return { success: false, error: 'Electron API not available' };
    }

    async loadSettings(): Promise<{ success: boolean; settings: object; error?: string }> {
        if (window.electronAPI?.loadSettings) {
            return await window.electronAPI.loadSettings();
        }
        return { success: false, settings: {}, error: 'Electron API not available' };
    }

    async saveSettings(settings: object): Promise<{ success: boolean; error?: string }> {
        if (window.electronAPI?.saveSettings) {
            return await window.electronAPI.saveSettings(settings);
        }
        return { success: false, error: 'Electron API not available' };
    }

    async getAutoStartStatus(): Promise<{ success: boolean; openAtLogin: boolean; openAsHidden: boolean; path?: string; error?: string }> {
        if (window.electronAPI?.getAutoStartStatus) {
            return await window.electronAPI.getAutoStartStatus();
        }
        return { success: false, openAtLogin: false, openAsHidden: false, error: 'Electron API not available' };
    }

    async setAutoStart(enabled: boolean): Promise<{ success: boolean; enabled: boolean; error?: string }> {
        if (window.electronAPI?.setAutoStart) {
            return await window.electronAPI.setAutoStart(enabled);
        }
        return { success: false, enabled: false, error: 'Electron API not available' };
    }

    async openFileFromPath(filePath: string): Promise<{ success: boolean; windowId?: string; error?: string }> {
        if (window.electronAPI?.openFileFromPath) {
            return await window.electronAPI.openFileFromPath(filePath);
        }
        return { success: false, error: 'Electron API not available' };
    }

    async registerFileAssociations(): Promise<{ success: boolean; error?: string }> {
        if (window.electronAPI?.registerFileAssociations) {
            return await window.electronAPI.registerFileAssociations();
        }
        return { success: false, error: 'Electron API not available' };
    }

    isElectron(): boolean {
        return true;
    }

    getAppInfo(): AppInfo {
        return {
            name: window.electronAPI?.getAppName() || 'Research Notebook',
            version: window.electronAPI?.getVersion() || 'unknown',
            platform: window.electronAPI?.getPlatform() || 'unknown',
            isElectron: true
        };
    }
}

// Browser implementation
class BrowserFileSystemAPI implements FileSystemAPI {
    async openFileDialog(options: OpenFileOptions = {}): Promise<string[]> {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = options.multiple || false;

            if (options.filters) {
                const accept = options.filters
                    .map(filter => filter.extensions.map(ext => `.${ext}`).join(','))
                    .join(',');
                input.accept = accept;
            }

            input.onchange = (event) => {
                const target = event.target as HTMLInputElement;
                const files = Array.from(target.files || []);
                const paths = files.map(file => file.name); // Browser only provides file names
                resolve(paths);
            };

            input.click();
        });
    }

    async saveFileDialog(defaultName?: string): Promise<string | null>;
    async saveFileDialog(content: string, defaultFileName: string): Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
    async saveFileDialog(defaultNameOrContent?: string, defaultFileName?: string): Promise<string | null | { success: boolean; filePath?: string; error?: string; canceled?: boolean }> {
        // Check if this is the content + filename version
        if (defaultFileName && typeof defaultNameOrContent === 'string') {
            // This is the content + filename version
            try {
                const blob = new Blob([defaultNameOrContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = defaultFileName;
                a.click();
                URL.revokeObjectURL(url);
                return { success: true };
            } catch (error) {
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        } else {
            // This is the original version (just defaultName)
            // Browser doesn't support save file dialog directly
            // This is a fallback that just returns the default name
            return defaultNameOrContent || null;
        }
    }

    async selectDirectory(): Promise<string[]> {
        // Browser doesn't support directory selection directly
        // This is a fallback that opens a file dialog
        return this.openFileDialog({ multiple: true });
    }

    async showNotification(title: string, body: string): Promise<boolean> {
        // Browser fallback using Web Notifications API
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body });
            return true;
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification(title, { body });
                return true;
            }
        }
        return false;
    }

    async showNotificationAdvanced(title: string, body: string, options?: any): Promise<{ success: boolean; id?: string; error?: string }> {
        // Browser fallback using Web Notifications API with limited options
        try {
            if ('Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(title, {
                    body,
                    icon: options?.icon,
                    tag: options?.tag,
                    requireInteraction: options?.requireInteraction,
                    silent: options?.silent
                });
                return { success: true, id: notification.tag || 'browser-notification' };
            } else if ('Notification' in window && Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const notification = new Notification(title, {
                        body,
                        icon: options?.icon,
                        tag: options?.tag,
                        requireInteraction: options?.requireInteraction,
                        silent: options?.silent
                    });
                    return { success: true, id: notification.tag || 'browser-notification' };
                }
            }
            return { success: false, error: 'Notification permission denied' };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    async saveFileWithDialog(defaultFileName: string, content: string): Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }> {
        // Browser fallback using download API
        try {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = defaultFileName;
            a.click();
            URL.revokeObjectURL(url);
            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    async saveFileDialogAdvanced(options?: any): Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }> {
        // Browser fallback using download API with options
        try {
            const content = options?.content || '';
            const defaultFileName = options?.defaultPath || 'untitled.txt';
            const mimeType = this.getMimeType(defaultFileName);

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = defaultFileName;
            a.click();
            URL.revokeObjectURL(url);
            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    private getMimeType(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'json': return 'application/json';
            case 'csv': return 'text/csv';
            case 'txt': return 'text/plain';
            case 'html': return 'text/html';
            case 'xml': return 'application/xml';
            default: return 'text/plain';
        }
    }

    async loadLocalSettings(): Promise<object> {
        // Browser fallback using localStorage
        try {
            const settings = localStorage.getItem('app-settings');
            return settings ? JSON.parse(settings) : {};
        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
        }
    }

    async saveLocalSettings(settings: object): Promise<{ success: boolean; error?: string }> {
        // Browser fallback using localStorage
        try {
            localStorage.setItem('app-settings', JSON.stringify(settings));
            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    async loadSettings(): Promise<{ success: boolean; settings: object; error?: string }> {
        // Browser fallback using localStorage
        try {
            const settings = localStorage.getItem('app-settings');
            return { success: true, settings: settings ? JSON.parse(settings) : {} };
        } catch (error) {
            return { success: false, settings: {}, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    async saveSettings(settings: object): Promise<{ success: boolean; error?: string }> {
        // Browser fallback using localStorage
        try {
            localStorage.setItem('app-settings', JSON.stringify(settings));
            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    async getAutoStartStatus(): Promise<{ success: boolean; openAtLogin: boolean; openAsHidden: boolean; path?: string; error?: string }> {
        // Browser fallback - auto-start not supported
        return { success: false, openAtLogin: false, openAsHidden: false, error: 'Auto-start not supported in browser' };
    }

    async setAutoStart(enabled: boolean): Promise<{ success: boolean; enabled: boolean; error?: string }> {
        // Browser fallback - auto-start not supported
        return { success: false, enabled: false, error: 'Auto-start not supported in browser' };
    }

    async openFileFromPath(filePath: string): Promise<{ success: boolean; windowId?: string; error?: string }> {
        // Browser fallback - file opening not directly supported
        return { success: false, error: 'File opening not supported in browser' };
    }

    async registerFileAssociations(): Promise<{ success: boolean; error?: string }> {
        // Browser fallback - file associations not supported
        return { success: false, error: 'File associations not supported in browser' };
    }

    isElectron(): boolean {
        return false;
    }

    getAppInfo(): AppInfo {
        return {
            name: 'Research Notebook (Browser)',
            version: '1.0.0',
            platform: navigator.platform,
            isElectron: false
        };
    }
}

// Factory function to create the appropriate API
export function createFileSystemAPI(): FileSystemAPI {
    // Check if we're running in Electron
    if (typeof window !== 'undefined' && window.electronAPI) {
        return new ElectronFileSystemAPI();
    }

    return new BrowserFileSystemAPI();
}

// Global instance
export const fileSystemAPI = createFileSystemAPI();

// Utility functions for common operations
export async function openPDFFile(): Promise<string[]> {
    return fileSystemAPI.openFileDialog({
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        multiple: false
    });
}

export async function openMultipleFiles(): Promise<string[]> {
    return fileSystemAPI.openFileDialog({
        multiple: true
    });
}

export async function saveFile(content: string, defaultName: string): Promise<boolean> {
    try {
        const filePath = await fileSystemAPI.saveFileDialog(defaultName);
        if (filePath) {
            // In Electron, we would use fs.writeFile here
            // For browser, we'll use the download API
            if (!fileSystemAPI.isElectron()) {
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = defaultName;
                a.click();
                URL.revokeObjectURL(url);
                return true;
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error saving file:', error);
        return false;
    }
}

// Utility functions for new APIs
export async function showNotification(title: string, body: string): Promise<boolean> {
    return fileSystemAPI.showNotification(title, body);
}

export async function showNotificationAdvanced(title: string, body: string, options?: any): Promise<{ success: boolean; id?: string; error?: string }> {
    return fileSystemAPI.showNotificationAdvanced(title, body, options);
}

export async function saveFileWithDialog(defaultFileName: string, content: string): Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }> {
    return fileSystemAPI.saveFileWithDialog(defaultFileName, content);
}

export async function saveFileDialog(content: string, defaultFileName: string): Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }> {
    return fileSystemAPI.saveFileDialog(content, defaultFileName);
}

export async function saveFileDialogAdvanced(options?: any): Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }> {
    return fileSystemAPI.saveFileDialogAdvanced(options);
}

export async function loadLocalSettings(): Promise<object> {
    return fileSystemAPI.loadLocalSettings();
}

export async function saveLocalSettings(settings: object): Promise<{ success: boolean; error?: string }> {
    return fileSystemAPI.saveLocalSettings(settings);
}

export async function loadSettings(): Promise<{ success: boolean; settings: object; error?: string }> {
    return fileSystemAPI.loadSettings();
}

export async function saveSettings(settings: object): Promise<{ success: boolean; error?: string }> {
    return fileSystemAPI.saveSettings(settings);
}

export async function getAutoStartStatus(): Promise<{ success: boolean; openAtLogin: boolean; openAsHidden: boolean; path?: string; error?: string }> {
    return fileSystemAPI.getAutoStartStatus();
}

export async function setAutoStart(enabled: boolean): Promise<{ success: boolean; enabled: boolean; error?: string }> {
    return fileSystemAPI.setAutoStart(enabled);
}

// Standalone isElectron function
export function isElectron(): boolean {
    return fileSystemAPI.isElectron();
}

// Standalone file handling functions
export async function openFileFromPath(filePath: string): Promise<{ success: boolean; windowId?: string; error?: string }> {
    return fileSystemAPI.openFileFromPath(filePath);
}

export async function registerFileAssociations(): Promise<{ success: boolean; error?: string }> {
    return fileSystemAPI.registerFileAssociations();
}

// Type declarations for Electron API
declare global {
    interface Window {
        electronAPI?: {
            openFileDialog: () => Promise<string[]>;
            saveFileDialog: (defaultName?: string) => Promise<string | null>;
            selectDirectory: () => Promise<string[]>;
            showNotification: (title: string, body: string) => Promise<boolean>;
            showNotificationAdvanced: (title: string, body: string, options?: any) => Promise<{ success: boolean; id?: string; error?: string }>;
            saveFileWithDialog: (defaultFileName: string, content: string) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
            saveFileDialogAdvanced: (options?: any) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
            loadLocalSettings: () => Promise<object>;
            saveLocalSettings: (settings: object) => Promise<{ success: boolean; error?: string }>;
            loadSettings: () => Promise<{ success: boolean; settings: object; error?: string }>;
            saveSettings: (settings: object) => Promise<{ success: boolean; error?: string }>;
            getAutoStartStatus: () => Promise<{ success: boolean; openAtLogin: boolean; openAsHidden: boolean; path?: string; error?: string }>;
            setAutoStart: (enabled: boolean) => Promise<{ success: boolean; enabled: boolean; error?: string }>;
            getAppName: () => string;
            getVersion: () => string;
            getPlatform: () => string;
            isElectron: boolean;
            openFileFromPath: (filePath: string) => Promise<{ success: boolean; windowId?: string; error?: string }>;
            registerFileAssociations: () => Promise<{ success: boolean; error?: string }>;
        };
    }
} 