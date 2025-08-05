import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { AutoSyncProvider } from './AutoSyncProvider';
import { AutoSyncStatus } from './AutoSyncStatus';

interface AutoSyncIntegrationProps {
  children: React.ReactNode;
}

export const AutoSyncIntegration: React.FC<AutoSyncIntegrationProps> = ({ children }) => {
  return (
    <AutoSyncProvider
      config={{
        enabled: true,
        throttleDelay: 2000, // 2 seconds
        maxRetries: 3,
        retryDelay: 5000, // 5 seconds
        services: ['dropbox', 'google', 'onedrive', 'apple']
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Auto-sync status bar */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 1, 
            borderBottom: 1, 
            borderColor: 'divider',
            backgroundColor: 'background.paper'
          }}
        >
          <AutoSyncStatus compact />
        </Paper>
        
        {/* Main application content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
    </AutoSyncProvider>
  );
};

// Example usage component
export const AutoSyncExample: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Auto-Sync Integration Example
      </Typography>
      
      <Typography variant="body1" paragraph>
        This component demonstrates how to integrate auto-sync functionality into your application.
        The auto-sync system will automatically detect when notes, projects, or tasks are saved
        and trigger cloud synchronization for entities marked as cloud-synced.
      </Typography>

      <AutoSyncStatus showDetails />
      
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Features:
      </Typography>
      <ul>
        <li>Automatic detection of save events for notes, projects, and tasks</li>
        <li>Throttled sync to avoid redundant triggers</li>
        <li>Support for Dropbox, Google Drive, OneDrive, and iCloud</li>
        <li>Retry mechanism with exponential backoff</li>
        <li>Real-time sync status and progress tracking</li>
        <li>Error handling and recovery</li>
      </ul>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Usage:
      </Typography>
      <Typography variant="body2" component="pre" sx={{ 
        backgroundColor: 'grey.100', 
        p: 2, 
        borderRadius: 1,
        overflow: 'auto'
      }}>
{`// Wrap your app with AutoSyncIntegration
<AutoSyncIntegration>
  <YourApp />
</AutoSyncIntegration>

// Use enhanced hooks for auto-sync
import { useNotesWithAutoSync } from './hooks/api/useNotesWithAutoSync';
import { useProjectsWithAutoSync } from './hooks/api/useProjectsWithAutoSync';
import { useTasksWithAutoSync } from './hooks/useTasksWithAutoSync';

// The enhanced hooks will automatically emit save events
const { createNote, updateNote } = useNotesWithAutoSync();
const { createProject, updateProject } = useProjectsWithAutoSync();
const { createTask, updateTask } = useTasksWithAutoSync();`}
      </Typography>
    </Box>
  );
}; 