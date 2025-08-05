import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Divider,
  Tabs,
  Tab,
  Paper,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  TextField
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Computer as LocalIcon,
  Merge as MergeIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { notificationService } from '../../services/notificationService';

interface SyncConflict {
  id: string;
  entityType: 'note' | 'project' | 'pdf';
  entityId: string;
  entityTitle: string;
  cloudService: string;
  localVersion: {
    content: string;
    lastModified: string;
    size?: number;
  };
  cloudVersion: {
    content: string;
    lastModified: string;
    size?: number;
  };
  conflictType: 'content' | 'metadata' | 'deletion';
  detectedAt: string;
}

interface SyncConflictResolverProps {
  open: boolean;
  onClose: () => void;
  conflict: SyncConflict;
  onResolve: (resolution: ConflictResolution) => void;
}

export interface ConflictResolution {
  action: 'keep-local' | 'keep-cloud' | 'merge' | 'skip';
  mergedContent?: string;
  note?: string;
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
      id={`conflict-tabpanel-${index}`}
      aria-labelledby={`conflict-tab-${index}`}
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

export const SyncConflictResolver: React.FC<SyncConflictResolverProps> = ({
  open,
  onClose,
  conflict,
  onResolve
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [resolution, setResolution] = useState<ConflictResolution | null>(null);
  const [mergedContent, setMergedContent] = useState<string>('');
  const [resolutionNote, setResolutionNote] = useState<string>('');

  useEffect(() => {
    if (open && conflict) {
      // Initialize merged content with local version
      setMergedContent(conflict.localVersion.content);
      
      // Log conflict to notifications
      notificationService.logSyncConflict(
        conflict.entityType,
        conflict.entityTitle,
        conflict.cloudService,
        conflict.conflictType,
        {
          entityId: conflict.entityId,
          detectedAt: conflict.detectedAt
        }
      );
    }
  }, [open, conflict]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleResolution = (action: ConflictResolution['action']) => {
    const newResolution: ConflictResolution = {
      action,
      note: resolutionNote
    };

    if (action === 'merge' && conflict.entityType === 'note') {
      newResolution.mergedContent = mergedContent;
    }

    setResolution(newResolution);
  };

  const handleConfirm = () => {
    if (resolution) {
      onResolve(resolution);
      
      // Log resolution to notifications
      const actionLabels = {
        'keep-local': 'Kept Local Version',
        'keep-cloud': 'Used Cloud Version',
        'merge': 'Merged Versions',
        'skip': 'Skipped Conflict'
      };

      notificationService.logSyncConflictResolved(
        conflict.entityType,
        conflict.entityTitle,
        conflict.cloudService,
        actionLabels[resolution.action],
        {
          entityId: conflict.entityId,
          resolution: resolution.action,
          note: resolution.note
        }
      );
    }
  };

  const getConflictTypeLabel = (type: string) => {
    switch (type) {
      case 'content': return 'Content Conflict';
      case 'metadata': return 'Metadata Conflict';
      case 'deletion': return 'Deletion Conflict';
      default: return 'Unknown Conflict';
    }
  };

  const getConflictTypeColor = (type: string) => {
    switch (type) {
      case 'content': return 'error';
      case 'metadata': return 'warning';
      case 'deletion': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const canMerge = conflict.entityType === 'note' && conflict.conflictType === 'content';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            <Typography variant="h6">Sync Conflict Resolution</Typography>
          </Box>
          <Chip
            label={getConflictTypeLabel(conflict.conflictType)}
            color={getConflictTypeColor(conflict.conflictType) as any}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Conflict Overview */}
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Conflict detected for:</strong> {conflict.entityTitle}
            <br />
            <strong>Service:</strong> {conflict.cloudService}
            <br />
            <strong>Type:</strong> {conflict.entityType}
            <br />
            <strong>Detected:</strong> {formatDate(conflict.detectedAt)}
          </Typography>
        </Alert>

        {/* Version Comparison Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="conflict comparison tabs">
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <LocalIcon fontSize="small" />
                  <span>Local Version</span>
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <CloudIcon fontSize="small" />
                  <span>Cloud Version</span>
                </Box>
              } 
            />
            {canMerge && (
              <Tab 
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <MergeIcon fontSize="small" />
                    <span>Merged Version</span>
                  </Box>
                } 
              />
            )}
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Paper sx={{ p: 2, height: '400px', overflow: 'auto' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Local Version</Typography>
              <Typography variant="caption" color="textSecondary">
                Modified: {formatDate(conflict.localVersion.lastModified)}
                {conflict.localVersion.size && ` • Size: ${formatSize(conflict.localVersion.size)}`}
              </Typography>
            </Box>
            <Typography variant="body2" component="pre" sx={{ 
              whiteSpace: 'pre-wrap', 
              fontFamily: 'inherit',
              backgroundColor: 'grey.50',
              p: 2,
              borderRadius: 1
            }}>
              {conflict.localVersion.content}
            </Typography>
          </Paper>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Paper sx={{ p: 2, height: '400px', overflow: 'auto' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Cloud Version</Typography>
              <Typography variant="caption" color="textSecondary">
                Modified: {formatDate(conflict.cloudVersion.lastModified)}
                {conflict.cloudVersion.size && ` • Size: ${formatSize(conflict.cloudVersion.size)}`}
              </Typography>
            </Box>
            <Typography variant="body2" component="pre" sx={{ 
              whiteSpace: 'pre-wrap', 
              fontFamily: 'inherit',
              backgroundColor: 'blue.50',
              p: 2,
              borderRadius: 1
            }}>
              {conflict.cloudVersion.content}
            </Typography>
          </Paper>
        </TabPanel>

        {canMerge && (
          <TabPanel value={activeTab} index={2}>
            <Paper sx={{ p: 2, height: '400px', overflow: 'auto' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Merged Version</Typography>
                <Tooltip title="Edit merged content">
                  <IconButton size="small">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <textarea
                value={mergedContent}
                onChange={(e) => setMergedContent(e.target.value)}
                style={{
                  width: '100%',
                  height: '300px',
                  padding: '16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                placeholder="Edit the merged content here..."
              />
            </Paper>
          </TabPanel>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Resolution Options */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Resolution Options
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  border: resolution?.action === 'keep-local' ? 2 : 1,
                  borderColor: resolution?.action === 'keep-local' ? 'primary.main' : 'divider',
                  backgroundColor: resolution?.action === 'keep-local' ? 'primary.50' : 'background.paper'
                }}
                onClick={() => handleResolution('keep-local')}
              >
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <LocalIcon color="primary" />
                  <Typography variant="subtitle2">Keep Local</Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  Use your local version and overwrite the cloud version
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  border: resolution?.action === 'keep-cloud' ? 2 : 1,
                  borderColor: resolution?.action === 'keep-cloud' ? 'primary.main' : 'divider',
                  backgroundColor: resolution?.action === 'keep-cloud' ? 'primary.50' : 'background.paper'
                }}
                onClick={() => handleResolution('keep-cloud')}
              >
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CloudIcon color="primary" />
                  <Typography variant="subtitle2">Use Cloud</Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  Download the cloud version and overwrite your local version
                </Typography>
              </Paper>
            </Grid>

            {canMerge && (
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    border: resolution?.action === 'merge' ? 2 : 1,
                    borderColor: resolution?.action === 'merge' ? 'primary.main' : 'divider',
                    backgroundColor: resolution?.action === 'merge' ? 'primary.50' : 'background.paper'
                  }}
                  onClick={() => handleResolution('merge')}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <MergeIcon color="primary" />
                    <Typography variant="subtitle2">Merge</Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    Combine both versions (available for text-based content)
                  </Typography>
                </Paper>
              </Grid>
            )}

            <Grid item xs={12} sm={6} md={canMerge ? 3 : 6}>
              <Paper 
                sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  border: resolution?.action === 'skip' ? 2 : 1,
                  borderColor: resolution?.action === 'skip' ? 'primary.main' : 'divider',
                  backgroundColor: resolution?.action === 'skip' ? 'primary.50' : 'background.paper'
                }}
                onClick={() => handleResolution('skip')}
              >
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <InfoIcon color="primary" />
                  <Typography variant="subtitle2">Skip</Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  Skip this conflict for now and resolve later
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Resolution Note */}
        <TextField
          fullWidth
          label="Resolution Note (Optional)"
          value={resolutionNote}
          onChange={(e) => setResolutionNote(e.target.value)}
          placeholder="Add a note about why you chose this resolution..."
          multiline
          rows={2}
          sx={{ mb: 2 }}
        />

        {/* Resolution Summary */}
        {resolution && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Selected Resolution:</strong> {resolution.action}
              {resolution.note && (
                <>
                  <br />
                  <strong>Note:</strong> {resolution.note}
                </>
              )}
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!resolution}
          startIcon={<CheckCircleIcon />}
        >
          Resolve Conflict
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SyncConflictResolver; 