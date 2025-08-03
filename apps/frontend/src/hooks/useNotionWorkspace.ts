import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceTabs } from '../pages/WorkspaceTabsContext';
import { NotionPage } from '../components/NotionWorkspace/types';
import { Description as WorkspaceIcon } from '@mui/icons-material';

export const useNotionWorkspace = () => {
    const navigate = useNavigate();
    const { openTab } = useWorkspaceTabs();
    const [recentWorkspaces, setRecentWorkspaces] = useState<NotionPage[]>([]);

    const createNewWorkspace = useCallback((title: string = 'Untitled') => {
        const workspaceId = `workspace-${Date.now()}`;
        const newWorkspace: NotionPage = {
            id: workspaceId,
            title,
            icon: '📄',
            blocks: [
                {
                    id: 'initial-block',
                    type: 'heading',
                    content: { text: title, level: 1 },
                    metadata: { createdAt: new Date(), updatedAt: new Date() }
                }
            ],
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                path: `/workspace/${workspaceId}`,
            }
        };

        // Open in new tab
        openTab({
            key: `workspace-${workspaceId}`,
            title: title,
            path: `/workspace/${workspaceId}`,
            icon: React.createElement(WorkspaceIcon),
            isDirty: true,
        });

        // Navigate to the workspace
        navigate(`/workspace/${workspaceId}`);

        // Add to recent workspaces
        setRecentWorkspaces(prev => [newWorkspace, ...prev.slice(0, 4)]);

        return newWorkspace;
    }, [navigate, openTab]);

    const openExistingWorkspace = useCallback((workspace: NotionPage) => {
        openTab({
            key: `workspace-${workspace.id}`,
            title: workspace.title,
            path: workspace.metadata.path,
            icon: React.createElement(WorkspaceIcon),
        });

        navigate(workspace.metadata.path);

        // Move to top of recent list
        setRecentWorkspaces(prev => [
            workspace,
            ...prev.filter(w => w.id !== workspace.id).slice(0, 4)
        ]);
    }, [navigate, openTab]);

    const createMixedWorkspace = useCallback((title: string, initialBlocks?: any[]) => {
        const workspaceId = `mixed-workspace-${Date.now()}`;
        const defaultBlocks = initialBlocks || [
            {
                id: 'heading-1',
                type: 'heading',
                content: { text: title, level: 1 },
                metadata: { createdAt: new Date(), updatedAt: new Date() }
            },
            {
                id: 'text-1',
                type: 'text',
                content: { text: 'This workspace combines multiple research elements...' },
                metadata: { createdAt: new Date(), updatedAt: new Date() }
            },
            {
                id: 'protocol-1',
                type: 'protocol',
                content: { title: 'Protocol Name', steps: '', materials: [] },
                metadata: { createdAt: new Date(), updatedAt: new Date() }
            },
            {
                id: 'note-1',
                type: 'note',
                content: { title: 'Research Note', text: '', tags: [] },
                metadata: { createdAt: new Date(), updatedAt: new Date() }
            }
        ];

        const newWorkspace: NotionPage = {
            id: workspaceId,
            title,
            icon: '🔬',
            blocks: defaultBlocks,
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                path: `/workspace/${workspaceId}`,
            }
        };

        openTab({
            key: `workspace-${workspaceId}`,
            title: title,
            path: `/workspace/${workspaceId}`,
            icon: React.createElement(WorkspaceIcon),
            isDirty: true,
        });

        navigate(`/workspace/${workspaceId}`);
        setRecentWorkspaces(prev => [newWorkspace, ...prev.slice(0, 4)]);

        return newWorkspace;
    }, [navigate, openTab]);

    return {
        createNewWorkspace,
        openExistingWorkspace,
        createMixedWorkspace,
        recentWorkspaces,
    };
}; 