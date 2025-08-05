import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import {
  TouchApp as TouchIcon,
  TextFields as TextIcon,
  Tablet as TabletIcon,
  Phone as PhoneIcon,
  Computer as ComputerIcon
} from '@mui/icons-material';
import HandwritingCanvas from '../components/HandwritingCanvas';

const HandwritingDemo: React.FC = () => {
  const [recognizedText, setRecognizedText] = useState('');
  const [demoText, setDemoText] = useState('');

  const handleTextChange = (text: string) => {
    setRecognizedText(text);
  };

  const handleDemoTextChange = (text: string) => {
    setDemoText(text);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TouchIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Handwriting to Text Demo
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Experience handwriting recognition on your iPad, tablet, or touch device. 
          Write with your finger or stylus and convert it to text instantly.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Main Demo Section */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Try Handwriting Recognition
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Use your finger or stylus to write on the canvas below. Click "Convert to Text" to see the recognition in action.
            </Typography>
            
            <HandwritingCanvas
              value={recognizedText}
              onChange={handleTextChange}
              placeholder="Write something here with your finger or stylus..."
              rows={8}
            />

            {recognizedText && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Recognized Text:
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', border: 1, borderColor: 'grey.200' }}>
                  <Typography variant="body1">
                    {recognizedText}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Features and Instructions */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Device Support */}
            <Card>
              <CardHeader
                title="Device Support"
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TabletIcon color="primary" />
                    <Typography variant="body2">iPad & Tablets</Typography>
                    <Chip label="Best" size="small" color="success" />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon color="primary" />
                    <Typography variant="body2">Touch Phones</Typography>
                    <Chip label="Good" size="small" color="warning" />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ComputerIcon color="primary" />
                    <Typography variant="body2">Desktop (Mouse)</Typography>
                    <Chip label="Basic" size="small" color="default" />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Browser Support */}
            <Card>
              <CardHeader
                title="Browser Support"
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip label="Chrome" color="success" size="small" />
                  <Chip label="Edge" color="success" size="small" />
                  <Chip label="Safari" color="warning" size="small" />
                  <Chip label="Firefox" color="error" size="small" />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Handwriting recognition requires browser support for the Web Handwriting API.
                </Typography>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader
                title="Features"
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">• Touch & Stylus Support</Typography>
                  <Typography variant="body2">• Pressure Sensitivity</Typography>
                  <Typography variant="body2">• Undo/Redo Actions</Typography>
                  <Typography variant="body2">• Multiple Recognition Results</Typography>
                  <Typography variant="body2">• Text Mode Toggle</Typography>
                  <Typography variant="body2">• Real-time Drawing</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader
                title="Writing Tips"
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">• Write clearly and connected</Typography>
                  <Typography variant="body2">• Use consistent letter sizes</Typography>
                  <Typography variant="body2">• Leave space between words</Typography>
                  <Typography variant="body2">• Avoid overlapping strokes</Typography>
                  <Typography variant="body2">• Use a stylus for better accuracy</Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Additional Demo */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Multi-line Text Demo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Try writing multiple lines of text. The component supports multi-line input and editing.
          </Typography>
          
          <HandwritingCanvas
            value={demoText}
            onChange={handleDemoTextChange}
            placeholder="Write multiple lines of text here..."
            rows={6}
          />

          {demoText && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Multi-line Result:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50', border: 1, borderColor: 'grey.200' }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {demoText}
                </Typography>
              </Paper>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Technical Information */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Technical Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                APIs Used
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">• Web Handwriting API</Typography>
                <Typography variant="body2">• Canvas 2D Context</Typography>
                <Typography variant="body2">• Touch Events</Typography>
                <Typography variant="body2">• Pointer Events</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Browser Compatibility
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">• Chrome 89+ (Desktop)</Typography>
                <Typography variant="body2">• Chrome 89+ (Android)</Typography>
                <Typography variant="body2">• Edge 89+</Typography>
                <Typography variant="body2">• Safari 14+ (Limited)</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default HandwritingDemo; 