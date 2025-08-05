import React from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { AutoSyncProvider } from './AutoSyncProvider';
import { AutoExportProvider } from './AutoExportProvider';
import { AutoSyncStatus } from './AutoSyncStatus';
import { AutoExportStatus } from './AutoExportStatus';
import { AutoExportSettings } from './AutoExportSettings';
import { CloudSyncManager } from './CloudSyncManager';

interface CloudSyncIntegrationProps {
  children: React.ReactNode;
  autoSyncConfig?: any;
  autoExportConfig?: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cloud-sync-tabpanel-${index}`}
      aria-labelledby={`cloud-sync-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const CloudSyncIntegration: React.FC<CloudSyncIntegrationProps> = ({ 
  children, 
  autoSyncConfig = {},
  autoExportConfig = {}
}) => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <AutoSyncProvider config={autoSyncConfig}>
      <AutoExportProvider config={autoExportConfig}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          {/* Status Bar */}
          <Paper 
            elevation={1} 
            sx={{ 
              p: 1, 
              borderBottom: 1, 
              borderColor: 'divider',
              backgroundColor: 'background.paper'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary">
                Cloud Sync & Export
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <AutoSyncStatus compact />
                <AutoExportStatus compact />
              </Box>
            </Box>
          </Paper>
          
          {/* Main Content */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {children}
          </Box>

          {/* Settings Panel */}
          <Paper 
            elevation={2} 
            sx={{ 
              borderTop: 1, 
              borderColor: 'divider',
              backgroundColor: 'background.paper'
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="cloud sync tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Auto-Sync Status" />
                <Tab label="Auto-Export Status" />
                <Tab label="Auto-Export Settings" />
                <Tab label="Cloud Services" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <AutoSyncStatus showDetails />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <AutoExportStatus showDetails />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <AutoExportSettings />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <CloudSyncManager />
            </TabPanel>
          </Paper>
        </Box>
      </AutoExportProvider>
    </AutoSyncProvider>
  );
};

// Example usage component
export const CloudSyncExample: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Cloud Sync & Auto-Export Integration
      </Typography>
      
      <Typography variant="body1" paragraph>
        This component demonstrates the complete cloud sync and auto-export functionality.
        The system automatically syncs entities when they're saved and exports projects
        when they're completed.
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Features:
      </Typography>
      <ul>
        <li>Automatic sync of notes, projects, and tasks to cloud storage</li>
        <li>Automatic export of completed projects to PDF, Excel, CSV, and JSON</li>
        <li>Configurable export formats and options</li>
        <li>Real-time status monitoring</li>
        <li>Retry mechanism with exponential backoff</li>
        <li>Support for Dropbox, Google Drive, OneDrive, and iCloud</li>
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
{`// Wrap your app with CloudSyncIntegration
<CloudSyncIntegration
  autoSyncConfig={{
    enabled: true,
    throttleDelay: 2000,
    maxRetries: 3
  }}
  autoExportConfig={{
    enabled: true,
    formats: ['pdf', 'excel'],
    cloudSyncEnabled: true,
    cloudService: 'dropbox'
  }}
>
  <YourApp />
</CloudSyncIntegration>

// Use enhanced hooks for automatic functionality
import { useProjectsWithAutoExport } from './hooks/api/useProjectsWithAutoExport';

const { updateProject } = useProjectsWithAutoExport();
// Auto-sync and auto-export will be triggered automatically`}
      </Typography>
    </Box>
  );
}; 