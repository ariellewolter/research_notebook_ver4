import React, { useState } from 'react';
import { 
    Box, 
    Tabs, 
    Tab, 
    Typography, 
    IconButton, 
    Toolbar, 
    Button, 
    TextField,
    Divider,
    Paper
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    ViewColumn as SplitViewIcon,
    Close as CloseIcon,
    MoreVert as MoreIcon
} from '@mui/icons-material';
import { useWorkspaceTabs, TabData } from './WorkspaceTabsContext';

// Single tab group component
const TabGroup: React.FC<{
    groupIdx: number;
    openTabs: TabData[];
    activeTab: string | null;
    onTabChange: (tabKey: string) => void;
    onTabClose: (tabKey: string) => void;
    onCloseGroup: () => void;
}> = ({ groupIdx, openTabs, activeTab, onTabChange, onTabClose, onCloseGroup }) => {
    const renderTabContent = (tabKey: string | null) => {
        const tab = openTabs.find(t => t.key === tabKey);
        if (!tab) return null;
        const TabComponent = tab.component;
        return <TabComponent />;
    };

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            border: '1px solid #ddd',
            borderRadius: 1
        }}>
            {/* Tab bar */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                borderBottom: 1, 
                borderColor: 'divider',
                bgcolor: 'background.paper'
            }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => onTabChange(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ flexGrow: 1 }}
                >
                    {openTabs.map((tab) => (
                        <Tab
                            key={tab.key}
                            value={tab.key}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {tab.label}
                                    <IconButton
                                        size="small"
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            onTabClose(tab.key); 
                                        }}
                                        sx={{ ml: 1, p: 0.5 }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            }
                            sx={{ minWidth: 120 }}
                        />
                    ))}
                </Tabs>
                {groupIdx > 0 && (
                    <IconButton onClick={onCloseGroup} size="small">
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>
            
            {/* Tab content */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {renderTabContent(activeTab)}
            </Box>
        </Box>
    );
};

const Workspace: React.FC = () => {
    const { tabGroups, setTabGroups, closeTab, addTabGroup, removeTabGroup } = useWorkspaceTabs();
    const [searchTerm, setSearchTerm] = useState('');

    const handleTabChange = (groupIdx: number, tabKey: string) => {
        setTabGroups(prev => {
            const groups = [...prev];
            groups[groupIdx].activeTab = tabKey;
            return groups;
        });
    };

    const handleTabClose = (groupIdx: number, tabKey: string) => {
        closeTab(tabKey, groupIdx);
    };

    const handleCloseGroup = (groupIdx: number) => {
        removeTabGroup(groupIdx);
    };

    const handleSplitView = () => {
        addTabGroup();
    };

    const handleNewNote = () => {
        // TODO: Implement new note creation
        // Create new note functionality
    };

    return (
        <Box sx={{ 
            flexGrow: 1, 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100vh' 
        }}>
            {/* Toolbar */}
            <Toolbar sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                bgcolor: 'background.paper',
                gap: 1
            }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleNewNote}
                    size="small"
                >
                    New Note
                </Button>
                
                <Divider orientation="vertical" flexItem />
                
                <TextField
                    size="small"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    sx={{ minWidth: 200 }}
                />
                
                <Divider orientation="vertical" flexItem />
                
                <Button
                    variant="outlined"
                    startIcon={<SplitViewIcon />}
                    onClick={handleSplitView}
                    size="small"
                >
                    Split View
                </Button>
                
                <Box sx={{ flexGrow: 1 }} />
                
                <IconButton size="small">
                    <MoreIcon />
                </IconButton>
            </Toolbar>

            {/* Split view content */}
            <Box sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                gap: 1, 
                p: 1,
                overflow: 'hidden'
            }}>
                {tabGroups.length === 0 ? (
                    <Box sx={{ 
                        flexGrow: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%' 
                    }}>
                        <Typography variant="h5" color="text.secondary">
                            Welcome! Select a section from the sidebar to get started.
                        </Typography>
                    </Box>
                ) : (
                    tabGroups.map((group, groupIdx) => (
                        <Box 
                            key={groupIdx} 
                            sx={{ 
                                flexGrow: 1,
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <TabGroup
                                groupIdx={groupIdx}
                                openTabs={group.openTabs}
                                activeTab={group.activeTab}
                                onTabChange={(tabKey) => handleTabChange(groupIdx, tabKey)}
                                onTabClose={(tabKey) => handleTabClose(groupIdx, tabKey)}
                                onCloseGroup={() => handleCloseGroup(groupIdx)}
                            />
                        </Box>
                    ))
                )}
            </Box>
        </Box>
    );
};

export default Workspace; 