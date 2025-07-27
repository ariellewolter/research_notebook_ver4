import React from 'react';
import { TabData } from '../pages/WorkspaceTabsContext';
import { 
    NoteTab, 
    ProjectTab, 
    ProtocolTab, 
    DatabaseEntryTab 
} from '../pages/WorkspaceTabWrappers';

// Helper function to create a note tab
export const createNoteTab = (noteId: string, title: string): TabData => ({
    key: `note:${noteId}`,
    label: title,
    type: 'note',
    id: noteId,
    component: () => React.createElement(NoteTab, { noteId })
});

// Helper function to create a project tab
export const createProjectTab = (projectId: string, name: string): TabData => ({
    key: `project:${projectId}`,
    label: name,
    type: 'project',
    id: projectId,
    component: () => React.createElement(ProjectTab, { projectId })
});

// Helper function to create a protocol tab
export const createProtocolTab = (protocolId: string, name: string): TabData => ({
    key: `protocol:${protocolId}`,
    label: name,
    type: 'protocol',
    id: protocolId,
    component: () => React.createElement(ProtocolTab, { protocolId })
});

// Helper function to create a database entry tab
export const createDatabaseEntryTab = (entryId: string, name: string): TabData => ({
    key: `database:${entryId}`,
    label: name,
    type: 'database',
    id: entryId,
    component: () => React.createElement(DatabaseEntryTab, { entryId })
});

// Generic function to create a tab for any entity type
export const createEntityTab = (
    entityType: string, 
    entityId: string, 
    title: string, 
    component: React.ComponentType<any>
): TabData => ({
    key: `${entityType}:${entityId}`,
    label: title,
    type: entityType,
    id: entityId,
    component
});

// Utility to check if a tab is already open
export const isTabOpen = (tabs: TabData[], entityType: string, entityId: string): boolean => {
    return tabs.some(tab => tab.key === `${entityType}:${entityId}`);
};

// Utility to find an existing tab
export const findExistingTab = (tabs: TabData[], entityType: string, entityId: string): TabData | undefined => {
    return tabs.find(tab => tab.key === `${entityType}:${entityId}`);
}; 