import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  DragIndicator as DragIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

interface DashboardSettingsProps {
  open: boolean;
  onClose: () => void;
  settings: {
    theme: 'light' | 'dark' | 'auto';
    refreshInterval: number;
    autoRefresh: boolean;
    viewMode: 'grid' | 'list' | 'compact';
    accessibility: {
      highContrast: boolean;
      largeText: boolean;
      reducedMotion: boolean;
    };
  };
  onSettingsChange: (settings: any) => void;
}

const DashboardSettings: React.FC<DashboardSettingsProps> = ({
  open,
  onClose,
  settings,
  onSettingsChange,
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...localSettings };
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      if (parent === 'accessibility') {
        newSettings.accessibility = { ...newSettings.accessibility, [child]: value };
      }
    } else {
      if (key === 'theme') newSettings.theme = value;
      if (key === 'refreshInterval') newSettings.refreshInterval = value;
      if (key === 'autoRefresh') newSettings.autoRefresh = value;
      if (key === 'viewMode') newSettings.viewMode = value;
    }
    setLocalSettings(newSettings);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SettingsIcon />
          Dashboard Settings
        </Box>
      </DialogTitle>
      <DialogContent>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <PaletteIcon />
              <Typography variant="h6">Display Settings</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={localSettings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                    label="Theme"
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="auto">Auto</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>View Mode</InputLabel>
                  <Select
                    value={localSettings.viewMode}
                    onChange={(e) => handleSettingChange('viewMode', e.target.value)}
                    label="View Mode"
                  >
                    <MenuItem value="grid">Grid</MenuItem>
                    <MenuItem value="list">List</MenuItem>
                    <MenuItem value="compact">Compact</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <RefreshIcon />
              <Typography variant="h6">Auto-Refresh Settings</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.autoRefresh}
                      onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                    />
                  }
                  label="Auto-refresh enabled"
                />
              </Grid>
              <Grid item xs={6}>
                                  <TextField
                    type="number"
                    label="Refresh Interval (seconds)"
                    value={Math.floor(localSettings.refreshInterval / 1000)}
                    onChange={(e) =>
                      handleSettingChange('refreshInterval', parseInt(e.target.value) * 1000)
                    }
                    disabled={!localSettings.autoRefresh}
                    fullWidth
                  />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Refresh Interval
                </Typography>
                <Slider
                  value={Math.floor(localSettings.refreshInterval / 1000)}
                  onChange={(_, value) => handleSettingChange('refreshInterval', value * 1000)}
                  min={5}
                  max={300}
                  step={5}
                  marks={[
                    { value: 5, label: '5s' },
                    { value: 60, label: '1m' },
                    { value: 300, label: '5m' },
                  ]}
                  disabled={!localSettings.autoRefresh}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <VisibilityIcon />
              <Typography variant="h6">Accessibility</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.accessibility.highContrast}
                      onChange={(e) =>
                        handleSettingChange('accessibility.highContrast', e.target.checked)
                      }
                    />
                  }
                  label="High Contrast"
                />
              </Grid>
              <Grid item xs={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.accessibility.largeText}
                      onChange={(e) =>
                        handleSettingChange('accessibility.largeText', e.target.checked)
                      }
                    />
                  }
                  label="Large Text"
                />
              </Grid>
              <Grid item xs={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.accessibility.reducedMotion}
                      onChange={(e) =>
                        handleSettingChange('accessibility.reducedMotion', e.target.checked)
                      }
                    />
                  }
                  label="Reduced Motion"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <DragIcon />
              <Typography variant="h6">Widget Management</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Manage your dashboard widgets
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Overview Metrics"
                  secondary="Key performance indicators"
                />
                <ListItemSecondaryAction>
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Task Trends"
                  secondary="Task completion trends over time"
                />
                <ListItemSecondaryAction>
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Recent Activity"
                  secondary="Latest updates and changes"
                />
                <ListItemSecondaryAction>
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DashboardSettings; 