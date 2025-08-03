import React from 'react';
import { useLocation } from 'react-router-dom';
import NotionWorkspaceTab from './NotionWorkspaceTab';

// This component detects if we should render a Notion workspace
export const WorkspaceIntegration: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    
    // Check if current route is a workspace route
    const isWorkspaceRoute = location.pathname.startsWith('/workspace/');
    
    if (isWorkspaceRoute) {
        return <NotionWorkspaceTab />;
    }
    
    return <>{children}</>;
}; 