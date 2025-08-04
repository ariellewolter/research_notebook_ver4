import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import {
  Cloud,
  CloudOff,
  Folder,
  FileUpload,
  FileDownload,
  Delete,
  Refresh,
  CheckCircle,
  Error,
  Warning
} from '@mui/icons-material';
import { useCloudSync, CloudServiceName, CloudFile } from '../../hooks/useCloudSync';

const serviceIcons = {
  dropbox: '☁️',
  google: '🔍',
  apple: '🍎',
  onedrive: '☁️'
};

const serviceColors = {
  dropbox: '#0061FE',
  google: '#4285F4',
  apple: '#000000',
  onedrive: '#0078D4'
};

const serviceNames = {
  dropbox: 'Dropbox',
  google: 'Google Drive',
  apple: 'iCloud',
  onedrive: 'OneDrive'
};

export const CloudSyncManager: React.FC = () => {
  const {
    connectedServices,
    isConnected,
    connectService,
    disconnectService,
    listFiles,
    uploadFile,
    downloadFile,
    getSyncStatus,
    loading,
    error,
    files,
    onServiceConnected,
    onServiceDisconnected,
    onError
  } = useCloudSync();

  const [selectedService, setSelectedService] = useState<CloudServiceName | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [uploadPath, setUploadPath] = useState('');
  const [downloadPath, setDownloadPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<CloudFile | null>(null);

  // Set up event listeners
  useEffect(() => {
    const handleServiceConnected = ({ serviceName }: { serviceName: CloudServiceName }) => {
      console.log(`${serviceName} connected successfully`);
    };

    const handleServiceDisconnected = ({ serviceName }: { serviceName: CloudServiceName }) => {
      console.log(`${serviceName} disconnected`);
      if (selectedService === serviceName) {
        setSelectedService(null);
      }
    };

    const handleError = (error: any) => {
      console.error('Cloud sync error:', error);
    };

    onServiceConnected(handleServiceConnected);
    onServiceDisconnected(handleServiceDisconnected);
    onError(handleError);
  }, [onServiceConnected, onServiceDisconnected, onError, selectedService]);

  const handleConnect = async (serviceName: CloudServiceName) => {
    await connectService(serviceName);
  };

  const handleDisconnect = (serviceName: CloudServiceName) => {
    disconnectService(serviceName);
  };

  const handleListFiles = async (serviceName: CloudServiceName) => {
    await listFiles(serviceName);
  };

  const handleUpload = async () => {
    if (selectedService && uploadPath) {
      await uploadFile(selectedService, uploadPath, uploadPath);
      setUploadDialogOpen(false);
      setUploadPath('');
      // Refresh file list
      await listFiles(selectedService);
    }
  };

  const handleDownload = async () => {
    if (selectedService && selectedFile && downloadPath) {
      await downloadFile(selectedService, selectedFile.path, downloadPath);
      setDownloadDialogOpen(false);
      setDownloadPath('');
      setSelectedFile(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Cloud Sync Manager
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Service Connection Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cloud Services
              </Typography>
              <List>
                {(Object.keys(serviceNames) as CloudServiceName[]).map((serviceName) => {
                  const connected = isConnected(serviceName);
                  const status = getSyncStatus(serviceName);
                  
                  return (
                    <ListItem key={serviceName} divider>
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: serviceColors[serviceName],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '1.2rem'
                          }}
                        >
                          {serviceIcons[serviceName]}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={serviceNames[serviceName]}
                        secondary={
                          connected 
                            ? `Connected • Last sync: ${status.lastSyncTime ? formatDate(status.lastSyncTime) : 'Never'}`
                            : 'Not connected'
                        }
                      />
                      <ListItemSecondaryAction>
                        {connected ? (
                          <IconButton
                            edge="end"
                            onClick={() => handleDisconnect(serviceName)}
                            color="error"
                          >
                            <CloudOff />
                          </IconButton>
                        ) : (
                          <Button
                            variant="contained"
                            onClick={() => handleConnect(serviceName)}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={16} /> : <Cloud />}
                            sx={{ backgroundColor: serviceColors[serviceName] }}
                          >
                            Connect
                          </Button>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* File Management */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {selectedService ? `${serviceNames[selectedService]} Files` : 'Select a service to view files'}
                </Typography>
                {selectedService && (
                  <Box>
                    <Button
                      variant="outlined"
                      onClick={() => handleListFiles(selectedService)}
                      disabled={loading}
                      startIcon={<Refresh />}
                      sx={{ mr: 1 }}
                    >
                      Refresh
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => setUploadDialogOpen(true)}
                      disabled={loading}
                      startIcon={<FileUpload />}
                    >
                      Upload
                    </Button>
                  </Box>
                )}
              </Box>

              {selectedService ? (
                <Box>
                  <List>
                    {files[selectedService].map((file) => (
                      <ListItem key={file.id} divider>
                        <ListItemIcon>
                          {file.isFolder ? <Folder /> : <Cloud />}
                        </ListItemIcon>
                        <ListItemText
                          primary={file.name}
                          secondary={`${formatFileSize(file.size)} • Modified: ${formatDate(file.modifiedTime)}`}
                        />
                        <ListItemSecondaryAction>
                          {!file.isFolder && (
                            <IconButton
                              edge="end"
                              onClick={() => {
                                setSelectedFile(file);
                                setDownloadDialogOpen(true);
                              }}
                              color="primary"
                            >
                              <FileDownload />
                            </IconButton>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                  {files[selectedService].length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="textSecondary">
                        No files found. Click "Refresh" to load files or "Upload" to add files.
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="textSecondary">
                    Connect to a cloud service to view and manage files.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Service Selection */}
      {connectedServices.length > 0 && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {connectedServices.map((serviceName) => (
              <Chip
                key={serviceName}
                label={serviceNames[serviceName]}
                onClick={() => setSelectedService(serviceName)}
                color={selectedService === serviceName ? 'primary' : 'default'}
                icon={<Cloud />}
                sx={{ backgroundColor: selectedService === serviceName ? serviceColors[serviceName] : undefined }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="File Path"
            fullWidth
            variant="outlined"
            value={uploadPath}
            onChange={(e) => setUploadPath(e.target.value)}
            placeholder="/path/to/your/file"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained" disabled={!uploadPath}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Download Dialog */}
      <Dialog open={downloadDialogOpen} onClose={() => setDownloadDialogOpen(false)}>
        <DialogTitle>Download File</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Download Path"
            fullWidth
            variant="outlined"
            value={downloadPath}
            onChange={(e) => setDownloadPath(e.target.value)}
            placeholder="/path/to/save/file"
          />
          {selectedFile && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Downloading: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDownloadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDownload} variant="contained" disabled={!downloadPath}>
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 