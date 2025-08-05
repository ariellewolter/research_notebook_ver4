import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Grid
} from '@mui/material';
import {
  Backup as BackupIcon,
  Settings as SettingsIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import BackupSettings from '../components/Backup/BackupSettings';
import BackupOverview from '../components/Backup/BackupOverview';

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
      id={`backup-tabpanel-${index}`}
      aria-labelledby={`backup-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `backup-tab-${index}`,
    'aria-controls': `backup-tabpanel-${index}`,
  };
}

const Backup: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <BackupIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Automated Backup System
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Automatically create and manage backup snapshots of your research data. 
          Backups are stored securely in your cloud storage and can be restored at any time.
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="backup tabs"
            sx={{ px: 2 }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon />
                  Overview
                </Box>
              }
              {...a11yProps(0)} 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon />
                  Settings
                </Box>
              }
              {...a11yProps(1)} 
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <BackupOverview />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <BackupSettings />
        </TabPanel>
      </Paper>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          How It Works
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                1. Automatic Snapshots
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The system automatically creates full JSON exports of your Notes, Projects, Tasks, 
                and Database entries at configurable intervals.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                2. Cloud Storage
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Backups are automatically uploaded to your designated cloud sync folder, 
                ensuring your data is safely stored off-site.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                3. Easy Restoration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Restore your data from any backup snapshot with a single click. 
                The system maintains version history and prevents data loss.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Features
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                • Configurable backup intervals (1-90 days)
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                • Automatic cleanup of old backups
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                • Data compression to save space
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                • One-click restore functionality
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Backup; 