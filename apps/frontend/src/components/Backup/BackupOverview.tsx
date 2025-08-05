import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  LinearProgress,
  Grid
} from '@mui/material';
import {
  Backup as BackupIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  RestoreFromTrash as RestoreIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  CloudDownload as CloudDownloadIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useBackup } from '../../hooks/useBackup';

const BackupOverview: React.FC = () => {
  const {
    snapshots,
    lastBackupDate,
    isBackupDue,
    isCreatingBackup,
    createBackup,
    downloadBackup,
    deleteBackup,
    restoreFromBackup,
    getBackupStats,
    getEntityCounts,
    formatBackupSize,
    formatTimeSinceLastBackup,
    getBackupStatusColor,
    getBackupStatusText
  } = useBackup();

  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const stats = getBackupStats();
  const entityCounts = getEntityCounts();

  const handleCreateBackup = async () => {
    try {
      const snapshot = await createBackup();
      if (snapshot) {
        setMessage({ type: 'success', text: 'Backup created successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to create backup. Please try again.' });
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
      setMessage({ type: 'error', text: 'Failed to create backup. Please try again.' });
    }
  };

  const handleDownloadBackup = async (backupId: string) => {
    try {
      const blob = await downloadBackup(backupId);
      if (blob) {
        const snapshot = snapshots.find(s => s.id === backupId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = snapshot?.filename || `backup_${backupId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: 'Backup downloaded successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to download backup.' });
      }
    } catch (error) {
      console.error('Failed to download backup:', error);
      setMessage({ type: 'error', text: 'Failed to download backup.' });
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      try {
        const success = await deleteBackup(backupId);
        if (success) {
          setMessage({ type: 'success', text: 'Backup deleted successfully!' });
        } else {
          setMessage({ type: 'error', text: 'Failed to delete backup.' });
        }
      } catch (error) {
        console.error('Failed to delete backup:', error);
        setMessage({ type: 'error', text: 'Failed to delete backup.' });
      }
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    setSelectedBackupId(backupId);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedBackupId) return;

    try {
      const success = await restoreFromBackup(selectedBackupId);
      if (success) {
        setMessage({ type: 'success', text: 'Backup restored successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to restore backup.' });
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
      setMessage({ type: 'error', text: 'Failed to restore backup.' });
    } finally {
      setRestoreDialogOpen(false);
      setSelectedBackupId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <SuccessIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      default:
        return <InfoIcon color="action" />;
    }
  };

  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BackupIcon />
              <Typography variant="h6">Backup Overview</Typography>
            </Box>
          }
        />
        <CardContent>
          <Alert severity="info">
            No backups have been created yet. Create your first backup to get started.
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              startIcon={<BackupIcon />}
            >
              {isCreatingBackup ? 'Creating Backup...' : 'Create First Backup'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BackupIcon />
              <Typography variant="h6">Backup Overview</Typography>
            </Box>
          }
          subheader={`${stats.totalBackups} total backups • ${stats.successRate.toFixed(1)}% success rate`}
        />
        <CardContent>
          {message && (
            <Alert 
              severity={message.type} 
              sx={{ mb: 2 }}
              onClose={() => setMessage(null)}
            >
              {message.text}
            </Alert>
          )}

          {isBackupDue && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Backup is due! Last backup: {formatTimeSinceLastBackup()}
            </Alert>
          )}

          {isCreatingBackup && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Creating backup...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="h4" color="primary">
                  {stats.totalBackups}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Backups
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="h4" color="success.main">
                  {stats.completedBackups}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Successful
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="h4" color="error.main">
                  {stats.failedBackups}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Failed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="h4" color="info.main">
                  {formatBackupSize(stats.totalSize)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Size
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {entityCounts && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Latest Backup Contents
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={`${entityCounts.notes} Notes`} size="small" />
                <Chip label={`${entityCounts.projects} Projects`} size="small" />
                <Chip label={`${entityCounts.tasks} Tasks`} size="small" />
                <Chip label={`${entityCounts.databaseEntries} Database Entries`} size="small" />
                <Chip label={`${entityCounts.literatureNotes} Literature Notes`} size="small" />
                <Chip label={`${entityCounts.protocols} Protocols`} size="small" />
                <Chip label={`${entityCounts.recipes} Recipes`} size="small" />
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              startIcon={<BackupIcon />}
            >
              {isCreatingBackup ? 'Creating Backup...' : 'Create Backup Now'}
            </Button>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Backup History
          </Typography>
          
          <List sx={{ p: 0 }}>
            {snapshots.map((snapshot, index) => (
              <React.Fragment key={snapshot.id}>
                <ListItem>
                  <ListItemIcon>
                    {getStatusIcon(snapshot.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {snapshot.filename}
                        </Typography>
                        <Chip
                          label={getBackupStatusText(snapshot.status)}
                          size="small"
                          color={getBackupStatusColor(snapshot.status) as any}
                          variant="outlined"
                        />
                        {snapshot.metadata.compressionRatio && (
                          <Chip
                            label={`${snapshot.metadata.compressionRatio.toFixed(1)}x compressed`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {snapshot.timestamp.toLocaleString()} • {formatBackupSize(snapshot.size)}
                        </Typography>
                        {snapshot.error && (
                          <Typography variant="caption" color="error" display="block">
                            Error: {snapshot.error}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Download backup">
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadBackup(snapshot.id)}
                          disabled={snapshot.status !== 'completed'}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {snapshot.status === 'completed' && (
                        <Tooltip title="Restore from backup">
                          <IconButton
                            size="small"
                            onClick={() => handleRestoreBackup(snapshot.id)}
                          >
                            <RestoreIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Delete backup">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteBackup(snapshot.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < snapshots.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle>Restore from Backup</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore from this backup? This will replace all current data with the backup data.
            <strong>This action cannot be undone.</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmRestore} color="primary" variant="contained">
            Restore
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BackupOverview; 