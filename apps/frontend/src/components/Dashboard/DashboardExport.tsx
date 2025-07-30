import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Box,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface DashboardExportProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: string, options: any) => Promise<void>;
}

const DashboardExport: React.FC<DashboardExportProps> = ({
  open,
  onClose,
  onExport,
}) => {
  const [format, setFormat] = useState('pdf');
  const [options, setOptions] = useState({
    includeCharts: true,
    includeTables: true,
    includeMetrics: true,
    pageSize: 'A4',
    orientation: 'portrait',
    quality: 'high',
    filename: 'dashboard-export',
  });
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  const handleExport = async () => {
    try {
      setExporting(true);
      setExportStatus({});
      await onExport(format, options);
      setExportStatus({ success: true, message: 'Export completed successfully!' });
      setTimeout(() => {
        onClose();
        setExportStatus({});
      }, 2000);
    } catch (error) {
      setExportStatus({ success: false, message: 'Export failed. Please try again.' });
    } finally {
      setExporting(false);
    }
  };

  const formatOptions = [
    {
      value: 'pdf',
      label: 'PDF Document',
      icon: <PdfIcon fontSize="large" color="error" />,
      description: 'High-quality PDF with charts and tables',
    },
    {
      value: 'csv',
      label: 'CSV Data',
      icon: <CsvIcon fontSize="large" color="primary" />,
      description: 'Raw data in CSV format for analysis',
    },
    {
      value: 'image',
      label: 'Image (PNG)',
      icon: <ImageIcon fontSize="large" color="success" />,
      description: 'Screenshot of dashboard as image',
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <DownloadIcon />
          Export Dashboard
        </Box>
      </DialogTitle>
      <DialogContent>
        {exportStatus.message && (
          <Alert
            severity={exportStatus.success ? 'success' : 'error'}
            sx={{ mb: 2 }}
            icon={exportStatus.success ? <CheckIcon /> : <ErrorIcon />}
          >
            <AlertTitle>{exportStatus.success ? 'Success' : 'Error'}</AlertTitle>
            {exportStatus.message}
          </Alert>
        )}

        <Typography variant="body2" color="textSecondary" gutterBottom>
          Choose export format and customize options
        </Typography>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Format Selection */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Export Format
            </Typography>
            <Grid container spacing={2}>
              {formatOptions.map((option) => (
                <Grid item xs={4} key={option.value}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: format === option.value ? 2 : 1,
                      borderColor: format === option.value ? 'primary.main' : 'divider',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => setFormat(option.value)}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      {option.icon}
                      <Typography variant="body2" fontWeight="medium" mt={1}>
                        {option.label}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {option.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Export Options */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Export Options
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Filename"
                  value={options.filename}
                  onChange={(e) => setOptions({ ...options, filename: e.target.value })}
                  helperText="Name for the exported file"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Quality</InputLabel>
                  <Select
                    value={options.quality}
                    onChange={(e) => setOptions({ ...options, quality: e.target.value })}
                    label="Quality"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {format === 'pdf' && (
                <>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Page Size</InputLabel>
                      <Select
                        value={options.pageSize}
                        onChange={(e) => setOptions({ ...options, pageSize: e.target.value })}
                        label="Page Size"
                      >
                        <MenuItem value="A4">A4</MenuItem>
                        <MenuItem value="A3">A3</MenuItem>
                        <MenuItem value="Letter">Letter</MenuItem>
                        <MenuItem value="Legal">Legal</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Orientation</InputLabel>
                      <Select
                        value={options.orientation}
                        onChange={(e) => setOptions({ ...options, orientation: e.target.value })}
                        label="Orientation"
                      >
                        <MenuItem value="portrait">Portrait</MenuItem>
                        <MenuItem value="landscape">Landscape</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Include in Export
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={options.includeMetrics}
                        onChange={(e) =>
                          setOptions({ ...options, includeMetrics: e.target.checked })
                        }
                      />
                    }
                    label="Metrics"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={options.includeCharts}
                        onChange={(e) =>
                          setOptions({ ...options, includeCharts: e.target.checked })
                        }
                      />
                    }
                    label="Charts"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={options.includeTables}
                        onChange={(e) =>
                          setOptions({ ...options, includeTables: e.target.checked })
                        }
                      />
                    }
                    label="Tables"
                  />
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Export Progress */}
          {exporting && (
            <Grid item xs={12}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Exporting dashboard...
                </Typography>
                <LinearProgress />
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={exporting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={exporting}
          startIcon={exporting ? undefined : <DownloadIcon />}
        >
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DashboardExport; 