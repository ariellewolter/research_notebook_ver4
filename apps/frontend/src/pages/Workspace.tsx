import React from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { useWorkspaceTabs } from './WorkspaceTabsContext';

const Workspace: React.FC = () => {
    const { openTabs, activeTab, setActiveTab } = useWorkspaceTabs();

    // Tabbed workspace content
    const renderTabContent = (tabKey: string | null) => {
        const tab = openTabs.find(t => t.key === tabKey);
        if (!tab) return null;
        const TabComponent = tab.component;
        return <TabComponent />;
    };

    return (
        <Box sx={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {openTabs.length === 0 ? (
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="h5" color="text.secondary">
                        Welcome! Select a section from the sidebar to get started.
                    </Typography>
                </Box>
            ) : (
                <>
                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                        {openTabs.map((tab) => (
                            <Tab
                                key={tab.key}
                                value={tab.key}
                                label={tab.label}
                                onClick={() => setActiveTab(tab.key)}
                                sx={{ minWidth: 120 }}
                            // Add close button in the future
                            />
                        ))}
                    </Tabs>
                    <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                        {renderTabContent(activeTab)}
                    </Box>
                </>
            )}
        </Box>
    );
};

export default Workspace; 