import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Badge,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  SkipNext as NextIcon,
  SkipPrevious as PrevIcon,
  CheckCircle as CompleteIcon,
  Timer as TimerIcon,
  Notes as NotesIcon,
  CameraAlt as CameraIcon,
  Brush as SketchIcon,
  Science as ReagentIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  PhotoCamera as PhotoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';

interface ProtocolExecution {
  id: string;
  templateId: string;
  templateName: string;
  status: 'not-started' | 'in-progress' | 'paused' | 'completed' | 'abandoned';
  currentStep: number;
  startTime: Date | null;
  endTime: Date | null;
  variables: Record<string, any>;
  stepNotes: Record<string, string>;
  stepImages: Record<string, string>;
  stepSketches: Record<string, any>;
  stepTimers: Record<string, { startTime: number; duration: number; remaining: number }>;
}

interface ExecutionStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: 'text' | 'image' | 'sketch' | 'variable' | 'timer' | 'reagent';
  content: any;
  duration?: number;
  completed: boolean;
  notes: string;
  images: string[];
  sketches: any[];
  startTime?: Date;
  endTime?: Date;
}

export const ProtocolExecutor: React.FC = () => {
  const [execution, setExecution] = useState<ProtocolExecution | null>(null);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [timerDialogOpen, setTimerDialogOpen] = useState(false);
  const [currentTimer, setCurrentTimer] = useState<{ stepId: string; duration: number } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock protocol template for demonstration
  const mockTemplate = {
    id: 'template_1',
    name: 'PCR Amplification Protocol',
    steps: [
      {
        id: 'step_1',
        order: 1,
        title: 'Prepare Master Mix',
        description: 'Mix all reagents for PCR reaction',
        type: 'reagent' as const,
        content: 'Add 10μL 10x buffer, 2μL dNTPs, 1μL primer mix, 0.5μL Taq polymerase',
        duration: 5,
      },
      {
        id: 'step_2',
        order: 2,
        title: 'Add Template DNA',
        description: 'Add your DNA template to the reaction',
        type: 'text' as const,
        content: 'Add 1μL of your DNA template to the master mix. Mix gently by pipetting up and down.',
        duration: 2,
      },
      {
        id: 'step_3',
        order: 3,
        title: 'PCR Cycling',
        description: 'Run PCR cycles according to program',
        type: 'timer' as const,
        content: 'Initial denaturation: 95°C for 5 minutes\nDenaturation: 95°C for 30 seconds\nAnnealing: 55°C for 30 seconds\nExtension: 72°C for 1 minute\nRepeat 30 cycles\nFinal extension: 72°C for 5 minutes',
        duration: 120,
      },
      {
        id: 'step_4',
        order: 4,
        title: 'Gel Electrophoresis',
        description: 'Run PCR products on agarose gel',
        type: 'text' as const,
        content: 'Load 5μL of PCR product with loading dye on 1% agarose gel. Run at 100V for 30 minutes.',
        duration: 35,
      },
    ],
    variables: [
      { id: 'var_1', name: 'Template Concentration', type: 'number', required: true },
      { id: 'var_2', name: 'Annealing Temperature', type: 'number', required: false, defaultValue: 55 },
      { id: 'var_3', name: 'Number of Cycles', type: 'number', required: false, defaultValue: 30 },
    ],
  };

  useEffect(() => {
    // Initialize execution
    const newExecution: ProtocolExecution = {
      id: `exec_${Date.now()}`,
      templateId: mockTemplate.id,
      templateName: mockTemplate.name,
      status: 'not-started',
      currentStep: 0,
      startTime: null,
      endTime: null,
      variables: {},
      stepNotes: {},
      stepImages: {},
      stepSketches: {},
      stepTimers: {},
    };

    const executionSteps: ExecutionStep[] = mockTemplate.steps.map(step => ({
      ...step,
      completed: false,
      notes: '',
      images: [],
      sketches: [],
    }));

    setExecution(newExecution);
    setSteps(executionSteps);
  }, []);

  useEffect(() => {
    // Timer management
    if (currentTimer && timerRef.current) {
      timerRef.current = setInterval(() => {
        setExecution(prev => {
          if (!prev) return prev;
          
          const timer = prev.stepTimers[currentTimer.stepId];
          if (timer && timer.remaining > 0) {
            return {
              ...prev,
              stepTimers: {
                ...prev.stepTimers,
                [currentTimer.stepId]: {
                  ...timer,
                  remaining: timer.remaining - 1,
                },
              },
            };
          } else {
            // Timer completed
            setCurrentTimer(null);
            setTimerDialogOpen(false);
            return prev;
          }
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentTimer]);

  const startExecution = () => {
    setExecution(prev => prev ? {
      ...prev,
      status: 'in-progress',
      startTime: new Date(),
      currentStep: 0,
    } : null);
    
    setSteps(prev => prev.map((step, index) => 
      index === 0 ? { ...step, startTime: new Date() } : step
    ));
  };

  const pauseExecution = () => {
    setExecution(prev => prev ? { ...prev, status: 'paused' } : null);
  };

  const resumeExecution = () => {
    setExecution(prev => prev ? { ...prev, status: 'in-progress' } : null);
  };

  const completeStep = (stepIndex: number) => {
    const updatedSteps = steps.map((step, index) => {
      if (index === stepIndex) {
        return { ...step, completed: true, endTime: new Date() };
      }
      return step;
    });

    setSteps(updatedSteps);

    if (stepIndex < steps.length - 1) {
      // Move to next step
      const nextStepIndex = stepIndex + 1;
      setActiveStep(nextStepIndex);
      setExecution(prev => prev ? { ...prev, currentStep: nextStepIndex } : null);
      
      const nextStep = updatedSteps[nextStepIndex];
      if (nextStep) {
        setSteps(prev => prev.map((step, index) => 
          index === nextStepIndex ? { ...step, startTime: new Date() } : step
        ));
      }
    } else {
      // Protocol completed
      setExecution(prev => prev ? {
        ...prev,
        status: 'completed',
        endTime: new Date(),
      } : null);
    }
  };

  const addStepNote = (stepId: string, note: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, notes: note } : step
    ));
  };

  const addStepImage = (stepId: string, imageData: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, images: [...step.images, imageData] } : step
    ));
  };

  const startTimer = (stepId: string, duration: number) => {
    setCurrentTimer({ stepId, duration });
    setTimerDialogOpen(true);
    
    setExecution(prev => prev ? {
      ...prev,
      stepTimers: {
        ...prev.stepTimers,
        [stepId]: {
          startTime: Date.now(),
          duration,
          remaining: duration,
        },
      },
    } : null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <InfoIcon />;
      case 'image':
        return <CameraIcon />;
      case 'sketch':
        return <SketchIcon />;
      case 'timer':
        return <TimerIcon />;
      case 'reagent':
        return <ReagentIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getStepStatusColor = (step: ExecutionStep, index: number) => {
    if (step.completed) return 'success';
    if (index === activeStep && execution?.status === 'in-progress') return 'primary';
    return 'default';
  };

  const handleImageCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && steps[activeStep]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        addStepImage(steps[activeStep].id, e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateLabNotes = () => {
    const notes = {
      protocolName: execution?.templateName,
      startTime: execution?.startTime,
      endTime: execution?.endTime,
      duration: execution?.startTime && execution?.endTime 
        ? Math.round((execution.endTime.getTime() - execution.startTime.getTime()) / 1000 / 60)
        : null,
      steps: steps.map(step => ({
        title: step.title,
        description: step.description,
        notes: step.notes,
        images: step.images,
        startTime: step.startTime,
        endTime: step.endTime,
        duration: step.startTime && step.endTime
          ? Math.round((step.endTime.getTime() - step.startTime.getTime()) / 1000 / 60)
          : null,
      })),
      variables: execution?.variables,
    };

    // Auto-generate note content
    const noteContent = `
# Lab Session: ${execution?.templateName}

**Date:** ${execution?.startTime?.toLocaleDateString()}
**Duration:** ${notes.duration} minutes
**Status:** ${execution?.status}

## Protocol Variables
${Object.entries(execution?.variables || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

## Steps Completed

${steps.map((step, index) => `
### ${index + 1}. ${step.title}
**Duration:** ${step.duration} minutes
**Notes:** ${step.notes || 'No notes'}
**Images:** ${step.images.length} captured
**Status:** ${step.completed ? 'Completed' : 'Not completed'}
`).join('\n')}

## Summary
Protocol execution ${execution?.status === 'completed' ? 'completed successfully' : 'was interrupted'}.
    `.trim();

    return noteContent;
  };

  const saveLabNotes = async () => {
    setLoading(true);
    try {
      const noteContent = generateLabNotes();
      
      // Save to notes system
      console.log('Saving lab notes:', noteContent);
      
      setMessage({ type: 'success', text: 'Lab notes saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save lab notes' });
    } finally {
      setLoading(false);
    }
  };

  if (!execution) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5">Loading protocol...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* App Bar */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {execution.templateName}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Lab Notes">
              <IconButton color="inherit" onClick={() => setNotesDrawerOpen(true)}>
                <Badge badgeContent={steps.filter(s => s.notes || s.images.length > 0).length} color="secondary">
                  <NotesIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Settings">
              <IconButton color="inherit" onClick={() => setSettingsDrawerOpen(true)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
              <IconButton color="inherit" onClick={() => setFullscreen(!fullscreen)}>
                {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Progress Bar */}
      <LinearProgress 
        variant="determinate" 
        value={(activeStep / steps.length) * 100}
        sx={{ height: 4 }}
      />

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Grid container spacing={2}>
          {/* Left Panel - Steps */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Protocol Steps
                </Typography>
                
                <Stepper orientation="vertical" activeStep={activeStep}>
                  {steps.map((step, index) => (
                    <Step key={step.id} completed={step.completed}>
                      <StepLabel
                        icon={getStepIcon(step.type)}
                        color={getStepStatusColor(step, index)}
                      >
                        <Typography variant="subtitle2">
                          {step.title}
                        </Typography>
                        {step.duration && (
                          <Chip
                            icon={<TimerIcon />}
                            label={`${step.duration} min`}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Panel - Current Step */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                {steps[activeStep] && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h5">
                        Step {activeStep + 1}: {steps[activeStep].title}
                      </Typography>
                      <Chip
                        icon={getStepIcon(steps[activeStep].type)}
                        label={steps[activeStep].type}
                        color="primary"
                      />
                    </Box>

                    <Typography variant="body1" sx={{ mb: 3 }}>
                      {steps[activeStep].description}
                    </Typography>

                    {/* Step Content */}
                    {steps[activeStep].type === 'text' && (
                      <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                        <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                          {steps[activeStep].content}
                        </Typography>
                      </Paper>
                    )}

                    {steps[activeStep].type === 'reagent' && (
                      <Paper sx={{ p: 2, mb: 2, backgroundColor: '#fff3e0' }}>
                        <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                          {steps[activeStep].content}
                        </Typography>
                      </Paper>
                    )}

                    {steps[activeStep].type === 'timer' && (
                      <Paper sx={{ p: 2, mb: 2, backgroundColor: '#e8f5e8' }}>
                        <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                          {steps[activeStep].content}
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<TimerIcon />}
                          onClick={() => startTimer(steps[activeStep].id, steps[activeStep].duration || 0)}
                          sx={{ mt: 2 }}
                        >
                          Start Timer ({steps[activeStep].duration} min)
                        </Button>
                      </Paper>
                    )}

                    {/* Step Notes */}
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Step Notes"
                      value={steps[activeStep].notes}
                      onChange={(e) => addStepNote(steps[activeStep].id, e.target.value)}
                      sx={{ mb: 2 }}
                      placeholder="Add notes about this step..."
                    />

                    {/* Step Images */}
                    {steps[activeStep].images.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Images ({steps[activeStep].images.length})
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, overflow: 'auto' }}>
                          {steps[activeStep].images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Step ${activeStep + 1} image ${index + 1}`}
                              style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        startIcon={<CameraIcon />}
                        onClick={handleImageCapture}
                      >
                        Add Photo
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<SketchIcon />}
                      >
                        Add Sketch
                      </Button>

                      {!steps[activeStep].completed && (
                        <Button
                          variant="contained"
                          startIcon={<CompleteIcon />}
                          onClick={() => completeStep(activeStep)}
                          sx={{ ml: 'auto' }}
                        >
                          Complete Step
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {execution.status === 'not-started' && (
          <Fab color="primary" onClick={startExecution}>
            <StartIcon />
          </Fab>
        )}
        
        {execution.status === 'in-progress' && (
          <>
            <Fab color="secondary" onClick={pauseExecution}>
              <PauseIcon />
            </Fab>
            <Fab color="error" onClick={() => setExecution(prev => prev ? { ...prev, status: 'abandoned' } : null)}>
              <StopIcon />
            </Fab>
          </>
        )}
        
        {execution.status === 'paused' && (
          <Fab color="primary" onClick={resumeExecution}>
            <StartIcon />
          </Fab>
        )}
        
        {execution.status === 'completed' && (
          <Fab color="success" onClick={saveLabNotes}>
            <SaveIcon />
          </Fab>
        )}
      </Box>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
        ref={fileInputRef}
      />

      {/* Timer Dialog */}
      <Dialog open={timerDialogOpen} onClose={() => setTimerDialogOpen(false)}>
        <DialogTitle>Timer</DialogTitle>
        <DialogContent>
          {currentTimer && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h3">
                {formatTime(execution.stepTimers[currentTimer.stepId]?.remaining || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Remaining
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimerDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Notes Drawer */}
      <Drawer
        anchor="right"
        open={notesDrawerOpen}
        onClose={() => setNotesDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Lab Notes
          </Typography>
          
          <List>
            {steps.map((step, index) => (
              <ListItem key={step.id}>
                <ListItemIcon>
                  {getStepIcon(step.type)}
                </ListItemIcon>
                <ListItemText
                  primary={`Step ${index + 1}: ${step.title}`}
                  secondary={
                    <Box>
                      {step.notes && <Typography variant="body2">{step.notes}</Typography>}
                      {step.images.length > 0 && (
                        <Chip label={`${step.images.length} images`} size="small" />
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Settings Drawer */}
      <Drawer
        anchor="right"
        open={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 300 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Settings
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText
                primary="Auto-save notes"
                secondary="Automatically save notes every 5 minutes"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Sound notifications"
                secondary="Play sound when timer completes"
              />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Snackbar for messages */}
      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage(null)}
      >
        <Alert severity={message?.type} onClose={() => setMessage(null)}>
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}; 