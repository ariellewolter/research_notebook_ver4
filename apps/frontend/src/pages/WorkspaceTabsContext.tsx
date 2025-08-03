import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Enhanced Tab Interface
export interface TabData {
    key: string;
    title: string;
    path: string;
    icon?: React.ReactNode;
    isDirty?: boolean;
    isPinned?: boolean;
    lastAccessed?: number;
    metadata?: Record<string, any>;
}

// Enhanced Tab Group Interface
export interface TabGroup {
    id: string;
    openTabs: TabData[];
    activeTab: string | null;
    layout: 'vertical' | 'horizontal';
    isMinimized?: boolean;
    position?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    splitRatio?: number; // For split layouts
}

// Workspace Layout Types
export type WorkspaceLayout = 'single' | 'split' | 'grid' | 'custom';

// Context Interface
interface WorkspaceTabsContextType {
    tabGroups: TabGroup[];
    workspaceLayout: WorkspaceLayout;
    setTabGroups: React.Dispatch<React.SetStateAction<TabGroup[]>>;
    setWorkspaceLayout: React.Dispatch<React.SetStateAction<WorkspaceLayout>>;

    // Tab Management
    openTab: (tab: Omit<TabData, 'lastAccessed'>, groupIdx?: number) => void;
    closeTab: (tabKey: string, groupIdx?: number) => void;
    closeAllTabs: (groupIdx?: number) => void;
    closeOtherTabs: (tabKey: string, groupIdx: number) => void;
    duplicateTab: (tabKey: string, groupIdx: number) => void;
    pinTab: (tabKey: string, groupIdx: number) => void;
    unpinTab: (tabKey: string, groupIdx: number) => void;

    // Tab Group Management
    addTabGroup: (layout?: 'vertical' | 'horizontal') => number;
    removeTabGroup: (groupIdx: number) => void;
    moveTabToGroup: (tab: TabData, fromIdx: number, toIdx: number) => void;
    mergeTabGroups: (fromIdx: number, toIdx: number) => void;
    splitTabGroup: (groupIdx: number, tabKey?: string) => void;

    // Layout Management
    setSingleLayout: () => void;
    setSplitLayout: (direction?: 'vertical' | 'horizontal') => void;
    setGridLayout: () => void;
    toggleMinimizeGroup: (groupIdx: number) => void;

    // Utility Functions
    getActiveTab: (groupIdx?: number) => TabData | null;
    getAllTabs: () => TabData[];
    findTabGroup: (tabKey: string) => { group: TabGroup; groupIdx: number } | null;
    getTabHistory: () => TabData[];

    // Persistence
    saveWorkspace: (name: string) => void;
    loadWorkspace: (name: string) => void;
    getWorkspaceList: () => string[];
}

const WorkspaceTabsContext = createContext<WorkspaceTabsContextType | null>(null);

// Local Storage Keys
const WORKSPACE_STORAGE_KEY = 'obsidian-workspace';
const SAVED_WORKSPACES_KEY = 'obsidian-saved-workspaces';

export const WorkspaceTabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
    const [workspaceLayout, setWorkspaceLayout] = useState<WorkspaceLayout>('single');

    // Initialize workspace from localStorage
    useEffect(() => {
        const savedWorkspace = localStorage.getItem(WORKSPACE_STORAGE_KEY);
        if (savedWorkspace) {
            try {
                const parsed = JSON.parse(savedWorkspace);
                setTabGroups(parsed.tabGroups || []);
                setWorkspaceLayout(parsed.layout || 'single');
            } catch (error) {
                console.error('Failed to load workspace from localStorage:', error);
            }
        }
    }, []);

    // Save workspace to localStorage
    useEffect(() => {
        // Filter out React components (icons) before saving to localStorage
        const serializableTabGroups = tabGroups.map(group => ({
            ...group,
            openTabs: group.openTabs.map(tab => ({
                ...tab,
                icon: undefined // Remove React components from serialization
            }))
        }));

        const workspaceData = {
            tabGroups: serializableTabGroups,
            layout: workspaceLayout,
            timestamp: Date.now(),
        };
        localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspaceData));
    }, [tabGroups, workspaceLayout, WORKSPACE_STORAGE_KEY]);

    // Generate unique group ID
    const generateGroupId = () => `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Open a tab
    const openTab = useCallback((tab: Omit<TabData, 'lastAccessed'>, groupIdx?: number) => {
        const fullTab: TabData = {
            ...tab,
            lastAccessed: Date.now(),
        };

        setTabGroups(prev => {
            const groups = [...prev];

            // If no groups exist, create the first one
            if (groups.length === 0) {
                groups.push({
                    id: generateGroupId(),
                    openTabs: [fullTab],
                    activeTab: fullTab.key,
                    layout: 'vertical',
                });
                return groups;
            }

            const targetGroupIdx = groupIdx ?? 0;
            const targetGroup = groups[targetGroupIdx];

            if (!targetGroup) {
                // Create new group if target doesn't exist
                groups.push({
                    id: generateGroupId(),
                    openTabs: [fullTab],
                    activeTab: fullTab.key,
                    layout: 'vertical',
                });
                return groups;
            }

            // Check if tab already exists in this group
            const existingTabIdx = targetGroup.openTabs.findIndex(t => t.key === fullTab.key);
            if (existingTabIdx >= 0) {
                // Update existing tab and make it active
                targetGroup.openTabs[existingTabIdx] = {
                    ...targetGroup.openTabs[existingTabIdx],
                    ...fullTab,
                };
                targetGroup.activeTab = fullTab.key;
            } else {
                // Add new tab
                targetGroup.openTabs.push(fullTab);
                targetGroup.activeTab = fullTab.key;
            }

            return groups;
        });
    }, []);

    // Close a tab
    const closeTab = useCallback((tabKey: string, groupIdx?: number) => {
        setTabGroups(prev => {
            const groups = [...prev];

            if (groupIdx !== undefined) {
                const group = groups[groupIdx];
                if (!group) return groups;

                group.openTabs = group.openTabs.filter(t => t.key !== tabKey);

                // Update active tab if needed
                if (group.activeTab === tabKey) {
                    group.activeTab = group.openTabs.length > 0
                        ? group.openTabs[group.openTabs.length - 1].key
                        : null;
                }
            } else {
                // Find and close tab in any group
                for (const group of groups) {
                    const tabIdx = group.openTabs.findIndex(t => t.key === tabKey);
                    if (tabIdx >= 0) {
                        group.openTabs.splice(tabIdx, 1);
                        if (group.activeTab === tabKey) {
                            group.activeTab = group.openTabs.length > 0
                                ? group.openTabs[group.openTabs.length - 1].key
                                : null;
                        }
                        break;
                    }
                }
            }

            return groups;
        });
    }, []);

    // Close all tabs in a group
    const closeAllTabs = useCallback((groupIdx?: number) => {
        setTabGroups(prev => {
            const groups = [...prev];

            if (groupIdx !== undefined) {
                const group = groups[groupIdx];
                if (group) {
                    group.openTabs = [];
                    group.activeTab = null;
                }
            } else {
                groups.forEach(group => {
                    group.openTabs = [];
                    group.activeTab = null;
                });
            }

            return groups;
        });
    }, []);

    // Close other tabs
    const closeOtherTabs = useCallback((tabKey: string, groupIdx: number) => {
        setTabGroups(prev => {
            const groups = [...prev];
            const group = groups[groupIdx];

            if (group) {
                const keepTab = group.openTabs.find(t => t.key === tabKey);
                if (keepTab) {
                    group.openTabs = [keepTab];
                    group.activeTab = tabKey;
                }
            }

            return groups;
        });
    }, []);

    // Duplicate tab
    const duplicateTab = useCallback((tabKey: string, groupIdx: number) => {
        setTabGroups(prev => {
            const groups = [...prev];
            const group = groups[groupIdx];

            if (group) {
                const tab = group.openTabs.find(t => t.key === tabKey);
                if (tab) {
                    const duplicatedTab: TabData = {
                        ...tab,
                        key: `${tab.key}-copy-${Date.now()}`,
                        title: `${tab.title} (Copy)`,
                        lastAccessed: Date.now(),
                    };
                    group.openTabs.push(duplicatedTab);
                    group.activeTab = duplicatedTab.key;
                }
            }

            return groups;
        });
    }, []);

    // Pin/Unpin tab
    const pinTab = useCallback((tabKey: string, groupIdx: number) => {
        setTabGroups(prev => {
            const groups = [...prev];
            const group = groups[groupIdx];

            if (group) {
                const tab = group.openTabs.find(t => t.key === tabKey);
                if (tab) {
                    tab.isPinned = true;
                }
            }

            return groups;
        });
    }, []);

    const unpinTab = useCallback((tabKey: string, groupIdx: number) => {
        setTabGroups(prev => {
            const groups = [...prev];
            const group = groups[groupIdx];

            if (group) {
                const tab = group.openTabs.find(t => t.key === tabKey);
                if (tab) {
                    tab.isPinned = false;
                }
            }

            return groups;
        });
    }, []);

    // Add tab group
    const addTabGroup = useCallback((layout: 'vertical' | 'horizontal' = 'vertical') => {
        setTabGroups(prev => {
            const newGroup: TabGroup = {
                id: generateGroupId(),
                openTabs: [],
                activeTab: null,
                layout,
            };
            return [...prev, newGroup];
        });
        return tabGroups.length; // Return new group index
    }, [tabGroups.length]);

    // Remove tab group
    const removeTabGroup = useCallback((groupIdx: number) => {
        setTabGroups(prev => prev.filter((_, idx) => idx !== groupIdx));
    }, []);

    // Move tab between groups
    const moveTabToGroup = useCallback((tab: TabData, fromIdx: number, toIdx: number) => {
        setTabGroups(prev => {
            const groups = [...prev];

            // Remove from source group
            if (groups[fromIdx]) {
                groups[fromIdx].openTabs = groups[fromIdx].openTabs.filter(t => t.key !== tab.key);
                if (groups[fromIdx].activeTab === tab.key) {
                    groups[fromIdx].activeTab = groups[fromIdx].openTabs.length > 0
                        ? groups[fromIdx].openTabs[groups[fromIdx].openTabs.length - 1].key
                        : null;
                }
            }

            // Add to target group
            if (groups[toIdx]) {
                groups[toIdx].openTabs.push(tab);
                groups[toIdx].activeTab = tab.key;
            }

            return groups;
        });
    }, []);

    // Layout management functions
    const setSingleLayout = useCallback(() => {
        setWorkspaceLayout('single');
        setTabGroups(prev => {
            if (prev.length <= 1) return prev;

            // Merge all tabs into first group
            const allTabs = prev.flatMap(group => group.openTabs);
            const firstGroup = prev[0];

            return [{
                ...firstGroup,
                openTabs: allTabs,
                activeTab: allTabs.length > 0 ? allTabs[allTabs.length - 1].key : null,
            }];
        });
    }, []);

    const setSplitLayout = useCallback((direction: 'vertical' | 'horizontal' = 'vertical') => {
        setWorkspaceLayout('split');
        setTabGroups(prev => {
            if (prev.length >= 2) return prev;

            const groups = [...prev];
            if (groups.length === 0) {
                // Create two empty groups
                groups.push(
                    {
                        id: generateGroupId(),
                        openTabs: [],
                        activeTab: null,
                        layout: direction,
                    },
                    {
                        id: generateGroupId(),
                        openTabs: [],
                        activeTab: null,
                        layout: direction,
                    }
                );
            } else {
                // Add second group
                groups.push({
                    id: generateGroupId(),
                    openTabs: [],
                    activeTab: null,
                    layout: direction,
                });
            }

            return groups;
        });
    }, []);

    const setGridLayout = useCallback(() => {
        setWorkspaceLayout('grid');
        // Grid layout can support multiple groups
    }, []);

    // Split tab group
    const splitTabGroup = useCallback((groupIdx: number, tabKey?: string) => {
        setTabGroups(prev => {
            const groups = [...prev];
            const sourceGroup = groups[groupIdx];

            if (!sourceGroup) return groups;

            const newGroup: TabGroup = {
                id: generateGroupId(),
                openTabs: [],
                activeTab: null,
                layout: sourceGroup.layout,
            };

            if (tabKey) {
                // Move specific tab to new group
                const tab = sourceGroup.openTabs.find(t => t.key === tabKey);
                if (tab) {
                    sourceGroup.openTabs = sourceGroup.openTabs.filter(t => t.key !== tabKey);
                    newGroup.openTabs = [tab];
                    newGroup.activeTab = tabKey;

                    if (sourceGroup.activeTab === tabKey) {
                        sourceGroup.activeTab = sourceGroup.openTabs.length > 0
                            ? sourceGroup.openTabs[sourceGroup.openTabs.length - 1].key
                            : null;
                    }
                }
            }

            return [...groups, newGroup];
        });
    }, []);

    // Utility functions
    const getActiveTab = useCallback((groupIdx?: number) => {
        if (groupIdx !== undefined) {
            const group = tabGroups[groupIdx];
            if (group && group.activeTab) {
                return group.openTabs.find(t => t.key === group.activeTab) || null;
            }
        } else {
            // Get active tab from first group with active tab
            for (const group of tabGroups) {
                if (group.activeTab) {
                    const tab = group.openTabs.find(t => t.key === group.activeTab);
                    if (tab) return tab;
                }
            }
        }
        return null;
    }, [tabGroups]);

    const getAllTabs = useCallback(() => {
        return tabGroups.flatMap(group => group.openTabs);
    }, [tabGroups]);

    const findTabGroup = useCallback((tabKey: string) => {
        for (let i = 0; i < tabGroups.length; i++) {
            const group = tabGroups[i];
            if (group.openTabs.some(t => t.key === tabKey)) {
                return { group, groupIdx: i };
            }
        }
        return null;
    }, [tabGroups]);

    const getTabHistory = useCallback(() => {
        return getAllTabs()
            .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    }, [getAllTabs]);

    // Workspace persistence
    const saveWorkspace = useCallback((name: string) => {
        const savedWorkspaces = JSON.parse(localStorage.getItem(SAVED_WORKSPACES_KEY) || '{}');
        savedWorkspaces[name] = {
            tabGroups,
            layout: workspaceLayout,
            timestamp: Date.now(),
        };
        localStorage.setItem(SAVED_WORKSPACES_KEY, JSON.stringify(savedWorkspaces));
    }, [tabGroups, workspaceLayout]);

    const loadWorkspace = useCallback((name: string) => {
        const savedWorkspaces = JSON.parse(localStorage.getItem(SAVED_WORKSPACES_KEY) || '{}');
        const workspace = savedWorkspaces[name];
        if (workspace) {
            setTabGroups(workspace.tabGroups || []);
            setWorkspaceLayout(workspace.layout || 'single');
        }
    }, []);

    const getWorkspaceList = useCallback(() => {
        const savedWorkspaces = JSON.parse(localStorage.getItem(SAVED_WORKSPACES_KEY) || '{}');
        return Object.keys(savedWorkspaces);
    }, []);

    const toggleMinimizeGroup = useCallback((groupIdx: number) => {
        setTabGroups(prev => {
            const groups = [...prev];
            const group = groups[groupIdx];
            if (group) {
                group.isMinimized = !group.isMinimized;
            }
            return groups;
        });
    }, []);

    const mergeTabGroups = useCallback((fromIdx: number, toIdx: number) => {
        setTabGroups(prev => {
            const groups = [...prev];
            const fromGroup = groups[fromIdx];
            const toGroup = groups[toIdx];

            if (fromGroup && toGroup) {
                // Move all tabs from source to target
                toGroup.openTabs.push(...fromGroup.openTabs);

                // Update active tab if target group had no active tab
                if (!toGroup.activeTab && fromGroup.activeTab) {
                    toGroup.activeTab = fromGroup.activeTab;
                }

                // Remove source group
                groups.splice(fromIdx, 1);
            }

            return groups;
        });
    }, []);

    const contextValue: WorkspaceTabsContextType = {
        tabGroups,
        workspaceLayout,
        setTabGroups,
        setWorkspaceLayout,
        openTab,
        closeTab,
        closeAllTabs,
        closeOtherTabs,
        duplicateTab,
        pinTab,
        unpinTab,
        addTabGroup,
        removeTabGroup,
        moveTabToGroup,
        mergeTabGroups,
        splitTabGroup,
        setSingleLayout,
        setSplitLayout,
        setGridLayout,
        toggleMinimizeGroup,
        getActiveTab,
        getAllTabs,
        findTabGroup,
        getTabHistory,
        saveWorkspace,
        loadWorkspace,
        getWorkspaceList,
    };

    return (
        <WorkspaceTabsContext.Provider value={contextValue}>
            {children}
        </WorkspaceTabsContext.Provider>
    );
};

export const useWorkspaceTabs = () => {
    const context = useContext(WorkspaceTabsContext);
    if (!context) {
        throw new Error('useWorkspaceTabs must be used within a WorkspaceTabsProvider');
    }
    return context;
}; 