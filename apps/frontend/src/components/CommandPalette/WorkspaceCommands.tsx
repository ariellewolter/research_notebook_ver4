import React from 'react';
import {
    Description as WorkspaceIcon,
    Add as AddIcon,
    Science as LabIcon,
    Note as NoteIcon,
    Assessment as AnalysisIcon,
} from '@mui/icons-material';

// Enhanced command palette commands for workspaces
export const getWorkspaceCommands = (
    createNewWorkspace: (title: string) => void,
    createMixedWorkspace: (title: string) => void,
    recentWorkspaces: any[]
) => {
    const commands = [
        // Workspace Creation Commands
        {
            id: 'create-workspace',
            title: 'Create New Workspace',
            subtitle: 'Notion-style mixed content page',
            icon: <WorkspaceIcon />,
            action: () => createNewWorkspace('New Research Document'),
            category: 'create',
            keywords: ['workspace', 'notion', 'document', 'mixed', 'create'],
            shortcut: 'Ctrl+Shift+N'
        },
        {
            id: 'create-lab-workspace',
            title: 'Create Lab Workspace',
            subtitle: 'Pre-configured with protocol and note blocks',
            icon: <LabIcon />,
            action: () => createMixedWorkspace('Lab Experiment Workspace'),
            category: 'create',
            keywords: ['lab', 'experiment', 'protocol', 'workspace', 'mixed']
        },
        {
            id: 'create-analysis-workspace',
            title: 'Create Analysis Workspace',
            subtitle: 'Pre-configured for data analysis',
            icon: <AnalysisIcon />,
            action: () => createMixedWorkspace('Data Analysis Workspace'),
            category: 'create',
            keywords: ['analysis', 'data', 'workspace', 'charts', 'mixed']
        },
        {
            id: 'create-research-workspace',
            title: 'Create Research Workspace',
            subtitle: 'Literature, notes, and protocols combined',
            icon: <NoteIcon />,
            action: () => createMixedWorkspace('Research Review Workspace'),
            category: 'create',
            keywords: ['research', 'literature', 'review', 'workspace', 'mixed']
        }
    ];

    // Add recent workspaces to commands
    const recentCommands = recentWorkspaces.map((workspace, index) => ({
        id: `recent-workspace-${workspace.id}`,
        title: workspace.title,
        subtitle: 'Recent workspace',
        icon: <WorkspaceIcon />,
        action: () => {
            // This would be handled by the workspace hook
        },
        category: 'recent',
        keywords: [workspace.title.toLowerCase(), 'workspace', 'recent']
    }));

    return [...commands, ...recentCommands];
}; 