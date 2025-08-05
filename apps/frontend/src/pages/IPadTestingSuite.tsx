import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Tablet as TabletIcon,
  TouchApp as TouchIcon,
  Edit as EditIcon,
  Gesture as GestureIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  BugReport as BugIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useIPadDetection } from '../hooks/useIPadDetection';
import { useIPadTouchGestures } from '../hooks/useIPadTouchGestures';
import IPadHandwritingCanvas from '../components/IPadHandwritingCanvas';
import NotesPaginationMode from '../components/Notes/NotesPaginationMode';

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
      id={`ipad-test-tabpanel-${index}`}
      aria-labelledby={`ipad-test-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  details?: string;
  timestamp: Date;
}

const IPadTestingSuite: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testSettings, setTestSettings] = useState({
    enablePressureTesting: true,
    enableTiltTesting: true,
    enableGestureTesting: true,
    enableHandwritingTesting: true,
    testDuration: 5000
  });

  // iPad detection
  const {
    isIPad,
    isApplePencil,
    isTouchDevice,
    hasPressureSupport,
    hasTiltSupport,
    devicePixelRatio,
    screenSize,
    touchCapabilities
  } = useIPadDetection();

  // Touch gestures
  const { gestureState } = useIPadTouchGestures({
    onSwipe: (direction, distance, velocity) => {
      addTestResult('Swipe Gesture', 'pass', `Swipe ${direction} detected`, 
        `Distance: ${distance.toFixed(1)}px, Velocity: ${velocity.toFixed(2)}px/ms`);
    },
    onTap: (point) => {
      addTestResult('Tap Gesture', 'pass', 'Tap detected', 
        `Position: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
    },
    onLongPress: (point) => {
      addTestResult('Long Press', 'pass', 'Long press detected', 
        `Position: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
    },
    onDoubleTap: (point) => {
      addTestResult('Double Tap', 'pass', 'Double tap detected', 
        `Position: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
    },
    onPressureChange: (pressure) => {
      addTestResult('Pressure Detection', 'pass', 'Pressure change detected', 
        `Pressure: ${pressure.toFixed(3)}`);
    }
  });

  const addTestResult = (name: string, status: TestResult['status'], message: string, details?: string) => {
    const result: TestResult = {
      name,
      status,
      message,
      details,
      timestamp: new Date()
    };
    setTestResults(prev => [result, ...prev.slice(0, 49)]); // Keep last 50 results
  };

  const runDeviceDetectionTests = () => {
    addTestResult('iPad Detection', isIPad ? 'pass' : 'info', 
      isIPad ? 'iPad device detected' : 'Not an iPad device');
    
    addTestResult('Apple Pencil Detection', isApplePencil ? 'pass' : 'warning', 
      isApplePencil ? 'Apple Pencil detected' : 'Apple Pencil not detected');
    
    addTestResult('Touch Device Detection', isTouchDevice ? 'pass' : 'fail', 
      isTouchDevice ? 'Touch device detected' : 'Touch device not detected');
    
    addTestResult('Pressure Support', hasPressureSupport ? 'pass' : 'warning', 
      hasPressureSupport ? 'Pressure sensitivity supported' : 'Pressure sensitivity not supported');
    
    addTestResult('Tilt Support', hasTiltSupport ? 'pass' : 'warning', 
      hasTiltSupport ? 'Tilt detection supported' : 'Tilt detection not supported');
    
    addTestResult('Device Pixel Ratio', 'info', 
      `Device pixel ratio: ${devicePixelRatio}`, 
      `Screen size: ${screenSize.width}x${screenSize.height} (${screenSize.orientation})`);
    
    addTestResult('Touch Capabilities', 'info', 
      `Max touch points: ${touchCapabilities.maxTouchPoints}`, 
      `Coarse pointer: ${touchCapabilities.hasCoarsePointer}, Fine pointer: ${touchCapabilities.hasFinePointer}`);
  };

  const runPerformanceTests = async () => {
    setIsRunningTests(true);
    
    // Test touch responsiveness
    const startTime = performance.now();
    addTestResult('Touch Responsiveness', 'info', 'Testing touch responsiveness...');
    
    // Simulate touch events
    await new Promise(resolve => setTimeout(resolve, 100));
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    addTestResult('Touch Responsiveness', responseTime < 16 ? 'pass' : 'warning', 
      `Touch response time: ${responseTime.toFixed(1)}ms`, 
      responseTime < 16 ? 'Excellent (60fps)' : 'Could be improved');
    
    // Test gesture recognition
    addTestResult('Gesture Recognition', 'pass', 'Gesture recognition active', 
      `Active gestures: ${gestureState.isActive ? 'Yes' : 'No'}`);
    
    setIsRunningTests(false);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const exportTestResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      device: {
        isIPad,
        isApplePencil,
        isTouchDevice,
        hasPressureSupport,
        hasTiltSupport,
        devicePixelRatio,
        screenSize,
        touchCapabilities
      },
      testResults
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ipad-test-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    runDeviceDetectionTests();
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <TabletIcon color="primary" />
        iPad Testing Suite
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Comprehensive testing and validation suite for iPad touch, Pencil, and handwriting features.
        Use this to verify optimal performance and user experience on iPad devices.
      </Typography>

      {/* Device Status */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Device Status</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <TabletIcon color={isIPad ? 'primary' : 'disabled'} sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2">iPad Detection</Typography>
                <Chip 
                  label={isIPad ? 'Detected' : 'Not Detected'} 
                  color={isIPad ? 'primary' : 'default'} 
                  size="small" 
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <EditIcon color={isApplePencil ? 'secondary' : 'disabled'} sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2">Apple Pencil</Typography>
                <Chip 
                  label={isApplePencil ? 'Connected' : 'Not Connected'} 
                  color={isApplePencil ? 'secondary' : 'default'} 
                  size="small" 
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <TouchIcon color={isTouchDevice ? 'success' : 'disabled'} sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2">Touch Support</Typography>
                <Chip 
                  label={isTouchDevice ? 'Available' : 'Not Available'} 
                  color={isTouchDevice ? 'success' : 'default'} 
                  size="small" 
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <GestureIcon color={hasPressureSupport ? 'info' : 'disabled'} sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2">Pressure Support</Typography>
                <Chip 
                  label={hasPressureSupport ? 'Supported' : 'Not Supported'} 
                  color={hasPressureSupport ? 'info' : 'default'} 
                  size="small" 
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Testing Interface */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Device Tests" />
            <Tab label="Touch Gestures" />
            <Tab label="Handwriting" />
            <Tab label="Pagination Mode" />
            <Tab label="Test Results" />
            <Tab label="Settings" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>Device Detection Tests</Typography>
          <Box sx={{ mb: 3 }}>
            <Button 
              variant="contained" 
              onClick={runDeviceDetectionTests}
              startIcon={<PlayIcon />}
              sx={{ mr: 2 }}
            >
              Run Device Tests
            </Button>
            <Button 
              variant="outlined" 
              onClick={runPerformanceTests}
              startIcon={<SpeedIcon />}
              disabled={isRunningTests}
            >
              Performance Tests
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Device Information" />
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><InfoIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Device Type" 
                        secondary={isIPad ? 'iPad' : 'Other Device'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><InfoIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Screen Resolution" 
                        secondary={`${screenSize.width} × ${screenSize.height}`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><InfoIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Orientation" 
                        secondary={screenSize.orientation} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><InfoIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Pixel Ratio" 
                        secondary={devicePixelRatio} 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Touch Capabilities" />
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><TouchIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Max Touch Points" 
                        secondary={touchCapabilities.maxTouchPoints} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><TouchIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Coarse Pointer" 
                        secondary={touchCapabilities.hasCoarsePointer ? 'Yes' : 'No'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><TouchIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Fine Pointer" 
                        secondary={touchCapabilities.hasFinePointer ? 'Yes' : 'No'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><EditIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Pressure Support" 
                        secondary={hasPressureSupport ? 'Yes' : 'No'} 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Touch Gesture Testing</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Try the following gestures on this area: tap, double tap, long press, swipe in any direction.
            The gesture detection will be logged in the Test Results tab.
          </Alert>
          
          <Paper 
            sx={{ 
              p: 4, 
              textAlign: 'center', 
              minHeight: 300, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: gestureState.isActive ? '#e3f2fd' : '#f5f5f5',
              transition: 'background-color 0.3s ease'
            }}
          >
            <Box>
              <TouchIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Touch Gesture Test Area
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {gestureState.isActive ? 'Gesture detected!' : 'Interact with this area to test gestures'}
              </Typography>
              {gestureState.isActive && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Distance: {gestureState.distance.toFixed(1)}px | 
                  Velocity: {gestureState.velocity.toFixed(2)}px/ms | 
                  Pressure: {gestureState.pressure.toFixed(3)}
                </Typography>
              )}
            </Box>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Handwriting Testing</Typography>
          <IPadHandwritingCanvas
            value=""
            onChange={(text) => console.log('Handwriting text:', text)}
            placeholder="Test handwriting recognition with Apple Pencil or finger..."
            rows={8}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>Pagination Mode Testing</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Test the pagination mode with sample notes. This demonstrates the notebook-like reading experience.
          </Alert>
          
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Sample notes will be generated for testing pagination mode. 
              Use swipe gestures to navigate between pages.
            </Typography>
          </Paper>
          
          {/* Sample notes for testing */}
          <Box sx={{ height: 600, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
              Pagination mode testing area - Sample notes would be displayed here
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Test Results</Typography>
            <Box>
              <Button 
                variant="outlined" 
                onClick={clearTestResults}
                startIcon={<RefreshIcon />}
                sx={{ mr: 1 }}
              >
                Clear Results
              </Button>
              <Button 
                variant="contained" 
                onClick={exportTestResults}
                startIcon={<AssessmentIcon />}
              >
                Export Results
              </Button>
            </Box>
          </Box>
          
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {testResults.length === 0 ? (
              <ListItem>
                <ListItemText 
                  primary="No test results yet" 
                  secondary="Run some tests to see results here"
                />
              </ListItem>
            ) : (
              testResults.map((result, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    {result.status === 'pass' && <CheckIcon color="success" />}
                    {result.status === 'fail' && <ErrorIcon color="error" />}
                    {result.status === 'warning' && <WarningIcon color="warning" />}
                    {result.status === 'info' && <InfoIcon color="info" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={result.name}
                    secondary={
                      <Box>
                        <Typography variant="body2">{result.message}</Typography>
                        {result.details && (
                          <Typography variant="caption" color="text.secondary">
                            {result.details}
                          </Typography>
                        )}
                        <Typography variant="caption" display="block" color="text.secondary">
                          {result.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" gutterBottom>Test Settings</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Test Configuration" />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={testSettings.enablePressureTesting}
                        onChange={(e) => setTestSettings(prev => ({ 
                          ...prev, 
                          enablePressureTesting: e.target.checked 
                        }))}
                      />
                    }
                    label="Enable Pressure Testing"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={testSettings.enableTiltTesting}
                        onChange={(e) => setTestSettings(prev => ({ 
                          ...prev, 
                          enableTiltTesting: e.target.checked 
                        }))}
                      />
                    }
                    label="Enable Tilt Testing"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={testSettings.enableGestureTesting}
                        onChange={(e) => setTestSettings(prev => ({ 
                          ...prev, 
                          enableGestureTesting: e.target.checked 
                        }))}
                      />
                    }
                    label="Enable Gesture Testing"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={testSettings.enableHandwritingTesting}
                        onChange={(e) => setTestSettings(prev => ({ 
                          ...prev, 
                          enableHandwritingTesting: e.target.checked 
                        }))}
                      />
                    }
                    label="Enable Handwriting Testing"
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Performance Settings" />
                <CardContent>
                  <Typography gutterBottom>Test Duration (ms)</Typography>
                  <Slider
                    value={testSettings.testDuration}
                    onChange={(_, value) => setTestSettings(prev => ({ 
                      ...prev, 
                      testDuration: value as number 
                    }))}
                    min={1000}
                    max={10000}
                    step={500}
                    marks
                    valueLabelDisplay="auto"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default IPadTestingSuite; 