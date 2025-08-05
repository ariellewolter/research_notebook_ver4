import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Chip,
  Alert,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  TouchApp as TouchAppIcon,
  Smartphone as SmartphoneIcon,
  Computer as ComputerIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTouchMode } from '../../contexts/TouchModeContext';

export const TouchModeSettings: React.FC = () => {
  const {
    isTouchMode,
    isAutoDetected,
    enableTouchMode,
    disableTouchMode,
    touchHitboxSize,
    touchPadding,
    swipeThreshold,
    longPressDelay,
  } = useTouchMode();

  const handleTouchModeToggle = (enabled: boolean) => {
    if (enabled) {
      enableTouchMode();
    } else {
      disableTouchMode();
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <TouchAppIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Touch-Optimized UI Mode
        </Typography>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isTouchMode}
                onChange={(e) => handleTouchModeToggle(e.target.checked)}
                color="primary"
              />
            }
            label="Enable Touch Mode"
          />
          
          {isAutoDetected && (
            <Chip
              icon={<CheckCircleIcon />}
              label="Auto-detected touch device"
              color="success"
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </Box>

        {isTouchMode && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Touch mode is active. UI elements have been optimized for touch interactions with larger hitboxes and enhanced gestures.
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Current Touch Settings
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SmartphoneIcon sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2">
                Minimum Touch Target: {touchHitboxSize}px
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TouchAppIcon sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2">
                Touch Padding: {touchPadding}px
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              Swipe Threshold: {swipeThreshold}px
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              Long Press Delay: {longPressDelay}ms
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Touch Mode Features
        </Typography>

        <List dense>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Enhanced Hitboxes"
              secondary="All interactive elements have larger touch targets for easier interaction"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Swipe Gestures"
              secondary="Swipe to open/close sidebar and panels, navigate between sections"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Touch-Optimized Drag & Drop"
              secondary="Blocks and elements can be dragged and dropped seamlessly via touch"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Long Press Actions"
              secondary="Long press for context menus and additional options"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Auto-Detection"
              secondary="Automatically detects touch devices and enables touch mode"
            />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Tip:</strong> Touch mode can be manually enabled or disabled regardless of device type. 
            Auto-detection only applies when no manual override has been set.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
}; 