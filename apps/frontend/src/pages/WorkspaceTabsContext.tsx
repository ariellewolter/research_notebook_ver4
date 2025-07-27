import React, { createContext, useContext, useState, useEffect } from 'react';

// Enhanced TabData for all entity types
export interface TabData {
    key: string; // unique key, e.g. `${type}:${id}`
    label: string;
    type: string; // 'note', 'project', 'experiment', etc.
    id: string; // entity id
    data?: any; // optional extra data for the tab
    component: React.ComponentType<any>;
}

// Each tab group (pane) has its own openTabs and activeTab
export interface TabGroup {
    openTabs: TabData[];
    activeTab: string | null;
}

interface WorkspaceTabsContextType {
    tabGroups: TabGroup[];
    setTabGroups: React.Dispatch<React.SetStateAction<TabGroup[]>>;
    openTab: (tab: TabData, groupIdx?: number) => void;
    closeTab: (tabKey: string, groupIdx?: number) => void;
    moveTabToGroup: (tab: TabData, fromIdx: number, toIdx: number) => void;
    addTabGroup: () => void;
    removeTabGroup: (groupIdx: number) => void;
}

const WorkspaceTabsContext = createContext<WorkspaceTabsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'workspaceTabGroups';

export const WorkspaceTabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Load from localStorage or default to one group
    const [tabGroups, setTabGroups] = useState<TabGroup[]>(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return [{ openTabs: [], activeTab: null }];
            }
        }
        return [{ openTabs: [], activeTab: null }];
    });

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tabGroups));
    }, [tabGroups]);

    // Open a tab in a group (default group 0)
    const openTab = (tab: TabData, groupIdx = 0) => {
        setTabGroups((prev) => {
            const groups = [...prev];
            const group = groups[groupIdx] || { openTabs: [], activeTab: null };
            if (!group.openTabs.find((t) => t.key === tab.key)) {
                group.openTabs = [...group.openTabs, tab];
            }
            group.activeTab = tab.key;
            groups[groupIdx] = group;
            return groups;
        });
    };

    // Close a tab in a group
    const closeTab = (tabKey: string, groupIdx = 0) => {
        setTabGroups((prev) => {
            const groups = [...prev];
            const group = groups[groupIdx];
            if (!group) return prev;
            const idx = group.openTabs.findIndex(t => t.key === tabKey);
            if (idx === -1) return prev;
            group.openTabs = group.openTabs.filter(t => t.key !== tabKey);
            if (group.activeTab === tabKey) {
                group.activeTab = group.openTabs.length > 0 ? group.openTabs[group.openTabs.length - 1].key : null;
            }
            groups[groupIdx] = group;
            return groups;
        });
    };

    // Move a tab from one group to another
    const moveTabToGroup = (tab: TabData, fromIdx: number, toIdx: number) => {
        setTabGroups((prev) => {
            const groups = [...prev];
            // Remove from old group
            groups[fromIdx].openTabs = groups[fromIdx].openTabs.filter(t => t.key !== tab.key);
            // Add to new group
            if (!groups[toIdx].openTabs.find(t => t.key === tab.key)) {
                groups[toIdx].openTabs = [...groups[toIdx].openTabs, tab];
                groups[toIdx].activeTab = tab.key;
            }
            // Fix activeTab in fromIdx if needed
            if (groups[fromIdx].activeTab === tab.key) {
                groups[fromIdx].activeTab = groups[fromIdx].openTabs.length > 0 ? groups[fromIdx].openTabs[groups[fromIdx].openTabs.length - 1].key : null;
            }
            return groups;
        });
    };

    // Add a new tab group (split view)
    const addTabGroup = () => {
        setTabGroups((prev) => [...prev, { openTabs: [], activeTab: null }]);
    };

    // Remove a tab group
    const removeTabGroup = (groupIdx: number) => {
        setTabGroups((prev) => prev.filter((_, idx) => idx !== groupIdx));
    };

    return (
        <WorkspaceTabsContext.Provider value={{ tabGroups, setTabGroups, openTab, closeTab, moveTabToGroup, addTabGroup, removeTabGroup }}>
            {children}
        </WorkspaceTabsContext.Provider>
    );
};

export const useWorkspaceTabs = () => {
    const ctx = useContext(WorkspaceTabsContext);
    if (!ctx) throw new Error('useWorkspaceTabs must be used within a WorkspaceTabsProvider');
    return ctx;
}; 