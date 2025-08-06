import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Download as DownloadIcon,
  Brush as DrawingIcon,
  PictureAsPdf as PdfIcon,
  Code as HtmlIcon,
  TableChart as ExcelIcon,
  FileDownload as CsvIcon,
  Code as JsonIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import EnhancedDataExport from '../components/Export/EnhancedDataExport';

const EnhancedExportDemo: React.FC = () => {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const features = [
    {
      title: 'Universal Drawing Integration',
      description: 'Automatically detects and embeds FreeformDrawingBlock content in all export formats',
      icon: <DrawingIcon />,
      details: [
        'Extracts drawing blocks from entity content',
        'Fetches actual drawing data from backend',
        'Embeds SVG and/or PNG versions',
        'Maintains proper positioning and sizing'
      ]
    },
    {
      title: 'Multi-Format Support',
      description: 'Export drawings in PDF, HTML, Excel, JSON, and CSV formats',
      icon: <DownloadIcon />,
      details: [
        'PDF: Vector and raster drawing support',
        'HTML: Responsive web page with embedded drawings',
        'Excel: Drawing references in spreadsheet cells',
        'JSON: Complete drawing data structure',
        'CSV: Drawing metadata and references'
      ]
    },
    {
      title: 'Flexible Drawing Options',
      description: 'Choose between SVG, PNG, or both formats with customizable dimensions',
      icon: <CheckIcon />,
      details: [
        'SVG: Vector graphics for scalability',
        'PNG: Raster images for compatibility',
        'Both: Include both formats for maximum flexibility',
        'Configurable max width and height',
        'Automatic scaling and positioning'
      ]
    },
    {
      title: 'Entity-Aware Processing',
      description: 'Intelligently processes drawings based on entity type and context',
      icon: <InfoIcon />,
      details: [
        'Notes: Embed drawings in note content',
        'Projects: Include drawings in project descriptions',
        'Protocols: Embed drawings in protocol steps',
        'Tasks: Include drawings in task descriptions',
        'Database: Embed drawings in entry descriptions'
      ]
    }
  ];

  const exportFormats = [
    {
      name: 'PDF Document',
      icon: <PdfIcon />,
      description: 'Professional document format with embedded drawings',
      features: ['Vector and raster drawing support', 'Proper page layout', 'Print-ready output']
    },
    {
      name: 'HTML Web Page',
      icon: <HtmlIcon />,
      description: 'Interactive web page with responsive drawings',
      features: ['Responsive design', 'Embedded SVG/PNG', 'Web-compatible output']
    },
    {
      name: 'Excel Spreadsheet',
      icon: <ExcelIcon />,
      description: 'Structured data with drawing references',
      features: ['Multiple worksheets', 'Drawing metadata', 'Data analysis ready']
    },
    {
      name: 'JSON Data',
      icon: <JsonIcon />,
      description: 'Complete data structure with drawing information',
      features: ['Full drawing data', 'API-compatible', 'Programmatic access']
    },
    {
      name: 'CSV Spreadsheet',
      icon: <CsvIcon />,
      description: 'Simple spreadsheet with drawing references',
      features: ['Universal compatibility', 'Drawing metadata', 'Easy import/export']
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        <DownloadIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        Enhanced Export with Drawing Integration
      </Typography>

      <Alert severity="info" sx={{ mb: 4 }}>
        This demo showcases the enhanced export functionality that automatically integrates FreeformDrawingBlock content 
        into all export formats (PDF, HTML, Excel, JSON, CSV) with proper sizing, positioning, and format options.
      </Alert>

      {/* Features Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Key Features
        </Typography>
        
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card>
                <CardHeader
                  avatar={feature.icon}
                  title={feature.title}
                  subheader={feature.description}
                />
                <CardContent>
                  <List dense>
                    {feature.details.map((detail, detailIndex) => (
                      <ListItem key={detailIndex} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <CheckIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={detail} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Export Formats Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Supported Export Formats
        </Typography>
        
        <Grid container spacing={3}>
          {exportFormats.map((format, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card>
                <CardHeader
                  avatar={format.icon}
                  title={format.name}
                  subheader={format.description}
                />
                <CardContent>
                  <List dense>
                    {format.features.map((feature, featureIndex) => (
                      <ListItem key={featureIndex} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <CheckIcon fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Technical Details */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Technical Implementation
        </Typography>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Drawing Processing Pipeline</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              The enhanced export system processes drawings through a sophisticated pipeline:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="1. Content Analysis"
                  secondary="Scans entity content for drawing block references using regex patterns"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="2. Backend Integration"
                  secondary="Fetches actual drawing data from the blocks API using entity ID and type"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="3. Format Conversion"
                  secondary="Converts drawing data to appropriate format (SVG/PNG) based on export options"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="4. Content Embedding"
                  secondary="Embeds processed drawings into the export content with proper positioning"
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Export Options Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Users can configure drawing export behavior through comprehensive options:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Drawing Inclusion</Typography>
                <Chip label="Include/Exclude drawings" color="primary" size="small" sx={{ mr: 1 }} />
                <Chip label="Format selection" color="secondary" size="small" />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Size Control</Typography>
                <Chip label="Max width: 200-1200px" color="info" size="small" sx={{ mr: 1 }} />
                <Chip label="Max height: 150-800px" color="info" size="small" />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Format Options</Typography>
                <Chip label="SVG Vector" color="success" size="small" sx={{ mr: 1 }} />
                <Chip label="PNG Raster" color="warning" size="small" sx={{ mr: 1 }} />
                <Chip label="Both Formats" color="error" size="small" />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Multi-Format Handling</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Each export format handles drawings differently to optimize for the target medium:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="PDF Format"
                  secondary="Embeds SVG as vector graphics and PNG as raster images, maintains proper page flow"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="HTML Format"
                  secondary="Creates responsive web pages with embedded SVG/PNG, includes CSS styling"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Excel Format"
                  secondary="Includes drawing metadata and references in structured spreadsheet format"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="JSON Format"
                  secondary="Complete data structure with full drawing information and metadata"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="CSV Format"
                  secondary="Drawing references and metadata in tabular format for data analysis"
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Demo Actions */}
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Try the Enhanced Export
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Experience the drawing integration firsthand by exporting your research data with embedded drawings
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<DownloadIcon />}
          onClick={() => setExportDialogOpen(true)}
          sx={{ px: 4, py: 1.5 }}
        >
          Open Enhanced Export Dialog
        </Button>
      </Paper>

      {/* Enhanced Export Dialog */}
      <EnhancedDataExport
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      />
    </Container>
  );
};

export default EnhancedExportDemo; 