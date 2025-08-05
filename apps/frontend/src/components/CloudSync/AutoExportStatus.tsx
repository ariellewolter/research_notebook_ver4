import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Button,
  Tooltip,
  LinearProgress,
  Badge,
} from '@mui/material';
import {
  FileDownload as ExportIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  CloudUpload as CloudUploadIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Description as CsvIcon,
  Code as JsonIcon,
} from '@mui/icons-material';
import { useAutoExportContext } from './AutoExportProvider';
import { ExportFormat } from '../../hooks/useAutoExport';

interface AutoExportStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

export const AutoExportStatus: React.FC<AutoExportStatusProps> = ({ 
  showDetails = true, 
  compact = false 
}) => {
  const {
    status,
    exportResults,
    error,
    setEnabled,
    clearResults,
    getRecentResults,
    getFailedExports,
  } = useAutoExportContext();

  const [expanded, setExpanded] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const recentResults = getRecentResults(5);
  const failedExports = getFailedExports();

  const getStatusColor = () => {
    if (error) return 'error';
    if (status.isExporting) return 'warning';
    if (status.failedExports > 0) return 'warning';
    if (status.lastExportTime) return 'success';
    return 'default';
  };

  const getStatusText = () => {
    if (status.isExporting) return 'Exporting...';
    if (error) return 'Error';
    if (status.failedExports > 0) return `${status.failedExports} failed`;
    if (status.lastExportTime) return 'Last export: ' + new Date(status.lastExportTime).toLocaleTimeString();
    return 'No recent exports';
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':
        return <PdfIcon />;
      case 'excel':
        return <ExcelIcon />;
      case 'csv':
        return <CsvIcon />;
      case 'json':
        return <JsonIcon />;
      default:
        return <ExportIcon />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title={getStatusText()}>
          <Badge 
            badgeContent={status.pendingExports} 
            color="primary"
            invisible={status.pendingExports === 0}
          >
            <CloudUploadIcon 
              color={getStatusColor() as any}
              sx={{ fontSize: 20 }}
            />
          </Badge>
        </Tooltip>
        <FormControlLabel
          control={
            <Switch
              checked={status.isEnabled}
              onChange={(e) => setEnabled(e.target.checked)}
              size="small"
            />
          }
          label="Auto-export"
          sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
        />
      </Box>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUploadIcon color={getStatusColor() as any} />
            <Typography variant="h6">Auto-Export Status</Typography>
            {status.pendingExports > 0 && (
              <Chip 
                label={`${status.pendingExports} pending`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={status.isEnabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
              }
              label="Enabled"
            />
            <IconButton
              onClick={() => setExpanded(!expanded)}
              size="small"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {status.isExporting && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Processing export queue...
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Chip
            icon={<ScheduleIcon />}
            label={getStatusText()}
            color={getStatusColor() as any}
            variant="outlined"
          />
          {status.lastExportTime && (
            <Chip
              icon={<StorageIcon />}
              label={`${recentResults.length} recent`}
              variant="outlined"
              onClick={() => setShowResults(!showResults)}
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Export Statistics
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip label={`${recentResults.length} total`} size="small" />
              <Chip 
                label={`${failedExports.length} failed`} 
                size="small" 
                color={failedExports.length > 0 ? 'error' : 'default'}
              />
              <Chip 
                label={`${status.pendingExports} pending`} 
                size="small" 
                color="primary"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => setShowResults(!showResults)}
                variant="outlined"
              >
                {showResults ? 'Hide' : 'Show'} Recent Results
              </Button>
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearResults}
                variant="outlined"
                color="secondary"
              >
                Clear Results
              </Button>
            </Box>

            <Collapse in={showResults}>
              {recentResults.length > 0 ? (
                <List dense>
                  {recentResults.map((result, index) => (
                    <React.Fragment key={`${result.projectId}-${result.format}-${result.timestamp}`}>
                      <ListItem>
                        <ListItemIcon>
                          {result.success ? (
                            <SuccessIcon color="success" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getFormatIcon(result.format)}
                              <span>{result.projectName}</span>
                              <span>•</span>
                              <span>{result.format.toUpperCase()}</span>
                              {result.cloudPath && (
                                <Chip 
                                  label="Cloud" 
                                  size="small" 
                                  variant="outlined"
                                  icon={<CloudUploadIcon />}
                                />
                              )}
                              {result.retryCount > 0 && (
                                <Chip 
                                  label={`Retry ${result.retryCount}`} 
                                  size="small" 
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                {result.filename} • {formatTimestamp(result.timestamp)}
                              </Typography>
                              {result.error && (
                                <Typography variant="body2" color="error">
                                  {result.error}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentResults.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                  No recent export results
                </Typography>
              )}
            </Collapse>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}; 