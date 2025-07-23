import React, { createContext, useContext, useState } from 'react';

interface TabData {
    key: string;
    label: string;
    component: React.ComponentType;
}

interface WorkspaceTabsContextType {
    openTabs: TabData[];
    setOpenTabs: React.Dispatch<React.SetStateAction<TabData[]>>;
    activeTab: string | null;
    setActiveTab: React.Dispatch<React.SetStateAction<string | null>>;
    openTab: (tab: TabData) => void;
}

const WorkspaceTabsContext = createContext<WorkspaceTabsContextType | undefined>(undefined);

export const WorkspaceTabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [openTabs, setOpenTabs] = useState<TabData[]>([]);
    const [activeTab, setActiveTab] = useState<string | null>(null);

    const openTab = (tab: TabData) => {
        setOpenTabs((prev) => {
            if (!prev.find((t) => t.key === tab.key)) {
                return [...prev, tab];
            }
            return prev;
        });
        setActiveTab(tab.key);
    };

    return (
        <WorkspaceTabsContext.Provider value={{ openTabs, setOpenTabs, activeTab, setActiveTab, openTab }}>
            {children}
        </WorkspaceTabsContext.Provider>
    );
};

export const useWorkspaceTabs = () => {
    const ctx = useContext(WorkspaceTabsContext);
    if (!ctx) throw new Error('useWorkspaceTabs must be used within a WorkspaceTabsProvider');
    return ctx;
}; 