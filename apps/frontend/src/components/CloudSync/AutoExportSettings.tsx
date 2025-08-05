import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Grid,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormGroup,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Description as CsvIcon,
  Code as JsonIcon,
} from '@mui/icons-material';
import { useAutoExportContext } from './AutoExportProvider';
import { ExportFormat } from '../../hooks/useAutoExport';

export const AutoExportSettings: React.FC = () => {
  const { config, setEnabled } = useAutoExportContext();
  const [localConfig, setLocalConfig] = useState(config);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleConfigChange = (key: string, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleFormatToggle = (format: ExportFormat) => {
    const newFormats = localConfig.formats.includes(format)
      ? localConfig.formats.filter(f => f !== format)
      : [...localConfig.formats, format];
    
    handleConfigChange('formats', newFormats);
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
        return <CloudUploadIcon />;
    }
  };

  const formatLabels = {
    pdf: 'PDF Document',
    excel: 'Excel Spreadsheet',
    csv: 'CSV Data',
    json: 'JSON Data'
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon />
            <Typography variant="h6">Auto-Export Settings</Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ExpandMoreIcon />}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </Box>

        <Collapse in={isExpanded}>
          <Box sx={{ mt: 2 }}>
            {/* Basic Settings */}
            <Typography variant="subtitle1" gutterBottom>
              Basic Configuration
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={localConfig.enabled}
                  onChange={(e) => {
                    setEnabled(e.target.checked);
                    handleConfigChange('enabled', e.target.checked);
                  }}
                />
              }
              label="Enable Auto-Export"
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cloud Path"
                  value={localConfig.cloudPath}
                  onChange={(e) => handleConfigChange('cloudPath', e.target.value)}
                  helperText="Path in cloud storage for exports"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Cloud Service</InputLabel>
                  <Select
                    value={localConfig.cloudService}
                    onChange={(e) => handleConfigChange('cloudService', e.target.value)}
                    label="Cloud Service"
                  >
                    <MenuItem value="dropbox">Dropbox</MenuItem>
                    <MenuItem value="google">Google Drive</MenuItem>
                    <MenuItem value="onedrive">OneDrive</MenuItem>
                    <MenuItem value="apple">iCloud</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Export Formats */}
            <Typography variant="subtitle1" gutterBottom>
              Export Formats
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Select which formats to export when a project is completed:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {(['pdf', 'excel', 'csv', 'json'] as ExportFormat[]).map((format) => (
                  <Chip
                    key={format}
                    icon={getFormatIcon(format)}
                    label={formatLabels[format]}
                    onClick={() => handleFormatToggle(format)}
                    color={localConfig.formats.includes(format) ? 'primary' : 'default'}
                    variant={localConfig.formats.includes(format) ? 'filled' : 'outlined'}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Export Options */}
            <Typography variant="subtitle1" gutterBottom>
              Export Options
            </Typography>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localConfig.includeMetadata}
                    onChange={(e) => handleConfigChange('includeMetadata', e.target.checked)}
                  />
                }
                label="Include Metadata (IDs, timestamps, etc.)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localConfig.includeRelationships}
                    onChange={(e) => handleConfigChange('includeRelationships', e.target.checked)}
                  />
                }
                label="Include Relationships (links between entities)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localConfig.includeNotes}
                    onChange={(e) => handleConfigChange('includeNotes', e.target.checked)}
                  />
                }
                label="Include Notes (experiment notes, observations)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localConfig.includeFileReferences}
                    onChange={(e) => handleConfigChange('includeFileReferences', e.target.checked)}
                  />
                }
                label="Include File References (PDFs, attachments)"
              />
            </FormGroup>

            <Divider sx={{ my: 2 }} />

            {/* Cloud Sync Settings */}
            <Typography variant="subtitle1" gutterBottom>
              Cloud Sync Settings
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={localConfig.cloudSyncEnabled}
                  onChange={(e) => handleConfigChange('cloudSyncEnabled', e.target.checked)}
                />
              }
              label="Upload exports to cloud storage"
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Filename Template"
                  value={localConfig.filenameTemplate}
                  onChange={(e) => handleConfigChange('filenameTemplate', e.target.value)}
                  helperText="Use {projectName}, {date}, {format}, {projectId} as placeholders"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Retry Attempts"
                  type="number"
                  value={localConfig.retryAttempts}
                  onChange={(e) => handleConfigChange('retryAttempts', parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 10 }}
                  helperText="Number of retry attempts for failed exports"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Advanced Settings */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Advanced Settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Retry Delay (ms)"
                      type="number"
                      value={localConfig.retryDelay}
                      onChange={(e) => handleConfigChange('retryDelay', parseInt(e.target.value))}
                      inputProps={{ min: 1000, max: 30000 }}
                      helperText="Delay between retry attempts"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => {
                  // Here you would save the configuration
                  console.log('Saving auto-export configuration:', localConfig);
                }}
              >
                Save Configuration
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => setLocalConfig(config)}
              >
                Reset to Defaults
              </Button>
            </Box>

            {/* Configuration Preview */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Current Configuration:</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                • Formats: {localConfig.formats.join(', ')}
              </Typography>
              <Typography variant="body2">
                • Cloud Service: {localConfig.cloudService}
              </Typography>
              <Typography variant="body2">
                • Cloud Path: {localConfig.cloudPath}
              </Typography>
              <Typography variant="body2">
                • Filename Template: {localConfig.filenameTemplate}
              </Typography>
            </Alert>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}; 