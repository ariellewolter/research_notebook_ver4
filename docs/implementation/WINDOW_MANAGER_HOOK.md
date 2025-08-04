# 🪟 Frontend Window Manager Hook

## ✅ **COMPLETED: Frontend Hook for Multi-Window Actions**

The `/apps/frontend/src/hooks/useWindowManager.ts` hook has been created to provide convenient methods for opening popout windows and PDF viewers with proper Electron/web fallback handling.

---

## 🚀 **Core Hook: useWindowManager**

### **Main Hook Interface:**
```typescript
export function useWindowManager() {
    // State
    const [isElectron, setIsElectron] = useState(false);
    const [currentWindowContext, setCurrentWindowContext] = useState<WindowContext | null>(null);
    const [openWindows, setOpenWindows] = useState<WindowInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Actions
    const openPopout = useCallback(async (route: string, params: Record<string, any> = {}): Promise<WindowResult> => { /* ... */ });
    const openPDF = useCallback(async (filePath: string, params: Record<string, any> = {}): Promise<WindowResult> => { /* ... */ });
    const openEditor = useCallback(async (documentId?: string, mode: string = 'edit', params: Record<string, any> = {}): Promise<WindowResult> => { /* ... */ });
    const openSettings = useCallback(async (tab: string = 'general', params: Record<string, any> = {}): Promise<WindowResult> => { /* ... */ });
    const closeWindow = useCallback(async (windowId: string): Promise<WindowResult> => { /* ... */ });
    const focusWindow = useCallback(async (windowId: string): Promise<WindowResult> => { /* ... */ });
    const getCurrentWindowContext = useCallback(async (): Promise<WindowContext | null> => { /* ... */ });
    const refreshWindows = useCallback(async () => { /* ... */ });

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
```

---

## 🎯 **Primary Methods**

### **1. openPopout(route: string, params?: object)**
```typescript
const openPopout = useCallback(async (route: string, params: Record<string, any> = {}): Promise<WindowResult> => {
    // Electron: Use window.electronAPI.openPopoutWindow
    // Web Fallback: Navigate in current window with query parameters
});
```

**Features:**
- ✅ **Electron Support:** Uses `window.electronAPI.openPopoutWindow`
- ✅ **Web Fallback:** Navigates in current window with query parameters
- ✅ **Parameter Passing:** Full parameter support
- ✅ **Error Handling:** Comprehensive error handling
- ✅ **Loading States:** Loading indicator during operations

**Example Usage:**
```typescript
const { openPopout } = useWindowManager();

// Open notes popout
const result = await openPopout('/notes', { filter: 'recent', userId: 123 });

// Open calendar popout
const result = await openPopout('/calendar', { view: 'month', date: '2024-01-15' });

// Open research popout
const result = await openPopout('/research', { projectId: 'proj_456' });
```

---

### **2. openPDF(filePath: string, params?: object)**
```typescript
const openPDF = useCallback(async (filePath: string, params: Record<string, any> = {}): Promise<WindowResult> => {
    // Electron: Use window.electronAPI.openPDFWindow
    // Web Fallback: Open PDF in new tab
});
```

**Features:**
- ✅ **Electron Support:** Uses `window.electronAPI.openPDFWindow`
- ✅ **Web Fallback:** Opens PDF in new browser tab
- ✅ **File Path Handling:** Supports both local and remote paths
- ✅ **PDF Parameters:** Page, zoom, toolbar options
- ✅ **Error Handling:** Graceful fallback for unsupported operations

**Example Usage:**
```typescript
const { openPDF } = useWindowManager();

// Open PDF with page and zoom
const result = await openPDF('/path/to/document.pdf', { 
    page: 1, 
    zoom: 1.5,
    showToolbar: true 
});

// Open research paper
const result = await openPDF('/uploads/research-paper.pdf', { 
    page: 5,
    showAnnotations: true 
});
```

---

## 🎨 **Convenience Hooks**

### **usePopoutWindows Hook:**
```typescript
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
```

**Usage:**
```typescript
const { openNotesPopout, openCalendarPopout } = usePopoutWindows();

// Open notes popout
await openNotesPopout({ filter: 'recent' });

// Open calendar popout
await openCalendarPopout({ view: 'month' });
```

---

### **usePDFWindows Hook:**
```typescript
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
```

**Usage:**
```typescript
const { openPDFViewer } = usePDFWindows();

// Open PDF with specific page and zoom
await openPDFViewer('/path/to/document.pdf', 1, 1.5);

// Open PDF with default settings
await openPDFViewer('/uploads/manual.pdf');
```

---

## 🔄 **Environment Detection & Fallbacks**

### **Electron Detection:**
```typescript
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
```

### **Web Fallback Strategies:**

#### **Popout Windows:**
```typescript
// Web fallback: navigate in current window
const searchParams = new URLSearchParams();
Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
});

const url = `${route}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
window.location.href = url;

return { success: true, windowId: 'current' };
```

#### **PDF Windows:**
```typescript
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
```

---

## 📊 **State Management**

### **Window Context:**
```typescript
export interface WindowContext {
    id: string;
    route: string;
    params: Record<string, any>;
    isDev: boolean;
}
```

### **Window Information:**
```typescript
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
```

### **Operation Results:**
```typescript
export interface WindowResult {
    success: boolean;
    windowId?: string;
    error?: string;
}
```

---

## 🚀 **Usage Examples**

### **Basic Usage:**
```typescript
import { useWindowManager } from '../hooks/useWindowManager';

function MyComponent() {
    const { openPopout, openPDF, isLoading, error } = useWindowManager();

    const handleOpenNotes = async () => {
        const result = await openPopout('/notes', { filter: 'recent' });
        if (result.success) {
            console.log('Notes popout opened:', result.windowId);
        } else {
            console.error('Failed to open notes:', result.error);
        }
    };

    const handleOpenPDF = async () => {
        const result = await openPDF('/path/to/document.pdf', { page: 1 });
        if (result.success) {
            console.log('PDF opened:', result.windowId);
        } else {
            console.error('Failed to open PDF:', result.error);
        }
    };

    return (
        <div>
            <button onClick={handleOpenNotes} disabled={isLoading}>
                Open Notes Popout
            </button>
            <button onClick={handleOpenPDF} disabled={isLoading}>
                Open PDF
            </button>
            {error && <div className="error">{error}</div>}
        </div>
    );
}
```

### **Advanced Usage with Convenience Hooks:**
```typescript
import { usePopoutWindows, usePDFWindows } from '../hooks/useWindowManager';

function AdvancedComponent() {
    const { openNotesPopout, openCalendarPopout, isLoading: popoutLoading } = usePopoutWindows();
    const { openPDFViewer, isLoading: pdfLoading } = usePDFWindows();

    const handleOpenNotes = () => openNotesPopout({ filter: 'recent' });
    const handleOpenCalendar = () => openCalendarPopout({ view: 'month' });
    const handleOpenPDF = () => openPDFViewer('/document.pdf', 1, 1.5);

    return (
        <div>
            <button onClick={handleOpenNotes} disabled={popoutLoading}>
                Notes Popout
            </button>
            <button onClick={handleOpenCalendar} disabled={popoutLoading}>
                Calendar Popout
            </button>
            <button onClick={handleOpenPDF} disabled={pdfLoading}>
                Open PDF
            </button>
        </div>
    );
}
```

### **Window Management:**
```typescript
function WindowManagerComponent() {
    const {
        openWindows,
        closeWindow,
        focusWindow,
        refreshWindows,
        windowCount
    } = useWindowManager();

    const handleCloseWindow = async (windowId: string) => {
        const result = await closeWindow(windowId);
        if (result.success) {
            console.log('Window closed successfully');
        }
    };

    const handleFocusWindow = async (windowId: string) => {
        const result = await focusWindow(windowId);
        if (result.success) {
            console.log('Window focused successfully');
        }
    };

    return (
        <div>
            <h3>Open Windows ({windowCount})</h3>
            <button onClick={refreshWindows}>Refresh</button>
            
            {openWindows.map(window => (
                <div key={window.id}>
                    <span>{window.title}</span>
                    <button onClick={() => handleFocusWindow(window.id)}>
                        Focus
                    </button>
                    <button onClick={() => handleCloseWindow(window.id)}>
                        Close
                    </button>
                </div>
            ))}
        </div>
    );
}
```

---

## 🎨 **Demo Component**

### **WindowManagerDemo Component:**
A comprehensive demo component has been created to showcase all window manager functionality:

- **Environment Status:** Shows Electron vs Web detection
- **Current Window Context:** Displays current window information
- **Popout Windows:** Buttons for different popout types
- **PDF Windows:** PDF viewer examples
- **Editor Windows:** Document editing examples
- **Settings Windows:** Settings dialog examples
- **Open Windows List:** Manage all open windows
- **Utility Actions:** Get context, refresh windows

**Features:**
- ✅ **Interactive Demo:** All functionality demonstrated
- ✅ **Real-time Status:** Loading states and error handling
- ✅ **Window Management:** Close, focus, refresh operations
- ✅ **Visual Feedback:** Success/error messages
- ✅ **Material-UI:** Professional UI components

---

## ✅ **Verification Checklist**

### **Core Functionality:**
- [x] `openPopout(route, params)` implemented with fallback
- [x] `openPDF(filePath, params)` implemented with fallback
- [x] `openEditor(documentId, mode, params)` implemented
- [x] `openSettings(tab, params)` implemented
- [x] Window management operations (close, focus, refresh)
- [x] Environment detection (Electron vs Web)

### **Fallback Handling:**
- [x] Electron API detection
- [x] Web fallback for popout windows (navigation)
- [x] Web fallback for PDF windows (new tab)
- [x] Error handling for unsupported operations
- [x] Graceful degradation

### **State Management:**
- [x] Loading states for all operations
- [x] Error state management
- [x] Window context tracking
- [x] Open windows list management
- [x] Real-time updates

### **Convenience Hooks:**
- [x] `usePopoutWindows` hook
- [x] `usePDFWindows` hook
- [x] Specialized methods for common operations
- [x] Proper dependency management

---

## 🔄 **Advanced Features**

### **Future Enhancements:**
```typescript
// Window positioning
const openPopoutAtPosition = (route: string, params: object, position: { x: number, y: number }) => {
    // Add positioning logic
};

// Window sizing
const openPDFWithSize = (filePath: string, params: object, size: { width: number, height: number }) => {
    // Add custom sizing logic
};

// Window persistence
const openEditorWithPersistence = (documentId: string, mode: string, persist: boolean) => {
    // Add persistence logic
};
```

### **Integration with Other Features:**
```typescript
// Auto-start with specific windows
const restoreLastSession = () => {
    // Restore windows that were open when app was closed
};

// Window-specific settings
const saveWindowPreferences = (windowId: string, preferences: object) => {
    // Save window-specific preferences
};
```

---

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **Window Not Opening:**
   - Check if Electron API is available
   - Verify route exists in frontend
   - Check for errors in console
   - Ensure fallback behavior works

2. **Parameters Not Passing:**
   - Verify parameter structure
   - Check window context listener
   - Ensure frontend handles parameters
   - Test web fallback behavior

3. **State Management Issues:**
   - Check loading states
   - Verify error handling
   - Ensure real-time updates
   - Test window list management

### **Debug Commands:**
```typescript
// Check environment
console.log('Is Electron:', isElectron);
console.log('Can manage windows:', canManageWindows);

// Test window operations
const result = await openPopout('/test', { debug: true });
console.log('Popout result:', result);

// Check window context
const context = await getCurrentWindowContext();
console.log('Current context:', context);

// List open windows
console.log('Open windows:', openWindows);
```

---

## 🎉 **Summary**

The window manager hook provides:

- ✅ **Convenient Methods:** Easy-to-use API for window operations
- ✅ **Environment Detection:** Automatic Electron vs Web detection
- ✅ **Graceful Fallbacks:** Web fallback for all operations
- ✅ **State Management:** Loading states, error handling, real-time updates
- ✅ **Type Safety:** Full TypeScript support with proper interfaces
- ✅ **Convenience Hooks:** Specialized hooks for common use cases

**Frontend window manager hook is now fully implemented with comprehensive fallback handling!** 🪟

Users can:
- **Open Popout Windows:** Any route in separate window or navigate in web
- **Open PDF Windows:** PDF files in dedicated viewer or new tab
- **Open Editor Windows:** Document editing in separate window
- **Open Settings Windows:** Settings in modal dialog
- **Manage Windows:** Close, focus, refresh operations
- **Handle Context:** Get current window context and parameters
- **Enjoy Fallbacks:** Seamless experience in both Electron and web

The implementation ensures a robust, user-friendly window management system that works consistently across all environments while providing proper error handling and state management. 