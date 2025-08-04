import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { CloudSyncManager } from '../components/CloudSync';

export const CloudSyncPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Cloud Sync
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Connect to your cloud storage services to sync files and data across devices.
          Supported services include Dropbox, Google Drive, iCloud, and OneDrive.
        </Typography>
      </Paper>
      
      <CloudSyncManager />
    </Box>
  );
};

export default CloudSyncPage; 