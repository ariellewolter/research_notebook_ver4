import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Alert,
  Button,
  TextField
} from '@mui/material';
import {
  Tablet as TabletIcon,
  TouchApp as TouchIcon,
  Edit as EditIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  Highlight as HighlightIcon
} from '@mui/icons-material';
import IPadToolbar from '../components/NotionWorkspace/IPadToolbar';

const IPadToolbarDemo: React.FC = () => {
  const [selectedText, setSelectedText] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState<'top' | 'bottom' | 'floating'>('bottom');
  const [variant, setVariant] = useState<'compact' | 'expanded'>('compact');
  const [showGestures, setShowGestures] = useState(true);
  const [formatActions, setFormatActions] = useState<string[]>([]);
  const [blockActions, setBlockActions] = useState<string[]>([]);
  const [actionActions, setActionActions] = useState<string[]>([]);

  const textFieldRef = useRef<HTMLTextAreaElement>(null);

  // Simulate text selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        setSelectedText(selection.toString());
      } else {
        setSelectedText('');
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const handleFormatAction = (action: string) => {
    setFormatActions(prev => [...prev, action]);
    console.log('Format action:', action);
  };

  const handleBlockAction = (action: string) => {
    setBlockActions(prev => [...prev, action]);
    console.log('Block action:', action);
  };

  const handleActionAction = (action: string) => {
    setActionActions(prev => [...prev, action]);
    console.log('Action action:', action);
  };

  const clearActions = () => {
    setFormatActions([]);
    setBlockActions([]);
    setActionActions([]);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, pb: 20 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TabletIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            iPad-Friendly Toolbar Demo
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Experience the enhanced toolbar designed specifically for iPad and tablet devices. 
          Try the floating radial menus, contextual Pencil-based popups, and touch gestures.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Controls */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Toolbar Controls" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isVisible}
                      onChange={(e) => setIsVisible(e.target.checked)}
                    />
                  }
                  label="Show Toolbar"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={showGestures}
                      onChange={(e) => setShowGestures(e.target.checked)}
                    />
                  }
                  label="Enable Gestures"
                />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Position
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {(['top', 'bottom', 'floating'] as const).map((pos) => (
                      <Button
                        key={pos}
                        variant={position === pos ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setPosition(pos)}
                      >
                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                      </Button>
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Variant
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {(['compact', 'expanded'] as const).map((var_) => (
                      <Button
                        key={var_}
                        variant={variant === var_ ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setVariant(var_)}
                      >
                        {var_.charAt(0).toUpperCase() + var_.slice(1)}
                      </Button>
                    ))}
                  </Box>
                </Box>

                <Button variant="outlined" onClick={clearActions}>
                  Clear Action Log
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Features */}
          <Card sx={{ mt: 2 }}>
            <CardHeader title="Features" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip icon={<TouchIcon />} label="Floating Radial Menus" size="small" />
                <Chip icon={<EditIcon />} label="Pencil Context Popups" size="small" />
                <Chip icon={<TabletIcon />} label="Touch Gestures" size="small" />
                <Chip label="Responsive Layout" size="small" />
                <Chip label="Apple Pencil Detection" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Demo Area */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Interactive Demo" />
            <CardContent>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Instructions:</strong>
                  <br />
                  • Select text to see the toolbar appear
                  <br />
                  • Use swipe gestures: Left=Bold, Right=Italic, Up=Underline, Down=Highlight
                  <br />
                  • Double tap to open radial menu
                  <br />
                  • Long press to open Pencil context menu
                  <br />
                  • Try different positions and variants using the controls
                </Typography>
              </Alert>

              <TextField
                ref={textFieldRef}
                multiline
                rows={8}
                fullWidth
                placeholder="Type or paste some text here to test the iPad-friendly toolbar features. Try selecting text to see the toolbar appear with formatting options."
                variant="outlined"
                sx={{ mb: 2 }}
              />

              {selectedText && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Selected Text:</strong> "{selectedText}"
                  </Typography>
                </Alert>
              )}

              {/* Action Logs */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Format Actions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {formatActions.length > 0 ? (
                      formatActions.map((action, index) => (
                        <Chip
                          key={index}
                          label={action}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No format actions yet
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Block Actions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {blockActions.length > 0 ? (
                      blockActions.map((action, index) => (
                        <Chip
                          key={index}
                          label={action}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No block actions yet
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Action Actions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {actionActions.length > 0 ? (
                      actionActions.map((action, index) => (
                        <Chip
                          key={index}
                          label={action}
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No action actions yet
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Gesture Guide */}
          <Card sx={{ mt: 2 }}>
            <CardHeader title="Gesture Guide" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Swipe Gestures
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BoldIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2">Swipe Left → Bold</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ItalicIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2">Swipe Right → Italic</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <UnderlineIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2">Swipe Up → Underline</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HighlightIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2">Swipe Down → Highlight</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Touch Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">• Double Tap → Radial Menu</Typography>
                    <Typography variant="body2">• Long Press → Pencil Menu</Typography>
                    <Typography variant="body2">• Pinch → Zoom (if enabled)</Typography>
                    <Typography variant="body2">• Apple Pencil → Enhanced precision</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* iPad Toolbar */}
      <IPadToolbar
        onFormatAction={handleFormatAction}
        onBlockAction={handleBlockAction}
        onActionAction={handleActionAction}
        selectedText={selectedText}
        isVisible={isVisible}
        position={position}
        variant={variant}
        showGestures={showGestures}
      />
    </Container>
  );
};

export default IPadToolbarDemo; 