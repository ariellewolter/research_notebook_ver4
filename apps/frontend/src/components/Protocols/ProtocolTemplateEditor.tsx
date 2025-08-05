import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextareaAutosize,
  Divider,
  Alert,
  Tooltip,
  Fab,
  Drawer,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Image as ImageIcon,
  Brush as SketchIcon,
  Code as VariableIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Upload as UploadIcon,
  CameraAlt as CameraIcon,
  Description as TextIcon,
  Timer as TimerIcon,
  Science as ReagentIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';

interface ProtocolStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: 'text' | 'image' | 'sketch' | 'variable' | 'timer' | 'reagent';
  content: any;
  duration?: number; // in minutes
  reagents?: string[];
  variables?: ProtocolVariable[];
  imageUrl?: string;
  sketchData?: any;
}

interface ProtocolVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'date';
  defaultValue?: any;
  options?: string[]; // for select type
  required: boolean;
  description: string;
}

interface ProtocolTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedDuration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: ProtocolStep[];
  variables: ProtocolVariable[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const ProtocolTemplateEditor: React.FC = () => {
  const [template, setTemplate] = useState<ProtocolTemplate>({
    id: '',
    name: '',
    description: '',
    category: '',
    estimatedDuration: 0,
    difficulty: 'beginner',
    steps: [],
    variables: [],
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [activeTab, setActiveTab] = useState(0);
  const [selectedStep, setSelectedStep] = useState<ProtocolStep | null>(null);
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [variableDialogOpen, setVariableDialogOpen] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<ProtocolVariable | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateStepId = () => `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addStep = () => {
    const newStep: ProtocolStep = {
      id: generateStepId(),
      order: template.steps.length + 1,
      title: '',
      description: '',
      type: 'text',
      content: '',
    };
    setSelectedStep(newStep);
    setStepDialogOpen(true);
  };

  const editStep = (step: ProtocolStep) => {
    setSelectedStep(step);
    setStepDialogOpen(true);
  };

  const deleteStep = (stepId: string) => {
    const updatedSteps = template.steps
      .filter(step => step.id !== stepId)
      .map((step, index) => ({ ...step, order: index + 1 }));
    
    setTemplate(prev => ({
      ...prev,
      steps: updatedSteps,
    }));
  };

  const saveStep = () => {
    if (!selectedStep) return;

    const updatedSteps = selectedStep.id 
      ? template.steps.map(step => step.id === selectedStep.id ? selectedStep : step)
      : [...template.steps, { ...selectedStep, order: template.steps.length + 1 }];

    setTemplate(prev => ({
      ...prev,
      steps: updatedSteps,
    }));

    setStepDialogOpen(false);
    setSelectedStep(null);
  };

  const addVariable = () => {
    const newVariable: ProtocolVariable = {
      id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      type: 'text',
      required: false,
      description: '',
    };
    setSelectedVariable(newVariable);
    setVariableDialogOpen(true);
  };

  const editVariable = (variable: ProtocolVariable) => {
    setSelectedVariable(variable);
    setVariableDialogOpen(true);
  };

  const deleteVariable = (variableId: string) => {
    setTemplate(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v.id !== variableId),
    }));
  };

  const saveVariable = () => {
    if (!selectedVariable) return;

    const updatedVariables = selectedVariable.id
      ? template.variables.map(v => v.id === selectedVariable.id ? selectedVariable : v)
      : [...template.variables, selectedVariable];

    setTemplate(prev => ({
      ...prev,
      variables: updatedVariables,
    }));

    setVariableDialogOpen(false);
    setSelectedVariable(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedStep) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedStep(prev => prev ? {
          ...prev,
          imageUrl: e.target?.result as string,
        } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSketchSave = () => {
    if (canvasRef.current && selectedStep) {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL('image/png');
      setSelectedStep(prev => prev ? {
        ...prev,
        sketchData: imageData,
      } : null);
    }
  };

  const saveTemplate = async () => {
    setSaving(true);
    try {
      // Validate template
      if (!template.name.trim()) {
        throw new Error('Template name is required');
      }
      if (template.steps.length === 0) {
        throw new Error('At least one step is required');
      }

      // Save template logic here
      console.log('Saving template:', template);
      
      setMessage({ type: 'success', text: 'Template saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <TextIcon />;
      case 'image':
        return <ImageIcon />;
      case 'sketch':
        return <SketchIcon />;
      case 'variable':
        return <VariableIcon />;
      case 'timer':
        return <TimerIcon />;
      case 'reagent':
        return <ReagentIcon />;
      default:
        return <TextIcon />;
    }
  };

  const getStepTypeColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'primary';
      case 'image':
        return 'secondary';
      case 'sketch':
        return 'warning';
      case 'variable':
        return 'info';
      case 'timer':
        return 'success';
      case 'reagent':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Protocol Template Editor</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveTemplate}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </Box>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Panel - Template Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Template Information
              </Typography>
              
              <TextField
                fullWidth
                label="Template Name"
                value={template.name}
                onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={template.description}
                onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={template.category}
                  onChange={(e) => setTemplate(prev => ({ ...prev, category: e.target.value }))}
                  label="Category"
                >
                  <MenuItem value="molecular-biology">Molecular Biology</MenuItem>
                  <MenuItem value="cell-culture">Cell Culture</MenuItem>
                  <MenuItem value="biochemistry">Biochemistry</MenuItem>
                  <MenuItem value="microscopy">Microscopy</MenuItem>
                  <MenuItem value="analytical">Analytical</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                type="number"
                label="Estimated Duration (minutes)"
                value={template.estimatedDuration}
                onChange={(e) => setTemplate(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={template.difficulty}
                  onChange={(e) => setTemplate(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  label="Difficulty"
                >
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Tags (comma-separated)"
                value={template.tags.join(', ')}
                onChange={(e) => setTemplate(prev => ({ 
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                }))}
                placeholder="e.g., PCR, DNA extraction, gel electrophoresis"
              />
            </CardContent>
          </Card>

          {/* Variables Section */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Variables</Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addVariable}
                >
                  Add Variable
                </Button>
              </Box>
              
              <List dense>
                {template.variables.map((variable) => (
                  <ListItem key={variable.id}>
                    <ListItemText
                      primary={variable.name}
                      secondary={`${variable.type} - ${variable.required ? 'Required' : 'Optional'}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small" onClick={() => editVariable(variable)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => deleteVariable(variable.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Steps */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Protocol Steps</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={addStep}
                >
                  Add Step
                </Button>
              </Box>
              
              <List>
                {template.steps.map((step, index) => (
                  <ListItem key={step.id} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
                    <DragIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            icon={getStepIcon(step.type)}
                            label={step.type}
                            color={getStepTypeColor(step.type) as any}
                            size="small"
                          />
                          <Typography variant="subtitle1">
                            {step.title || `Step ${step.order}`}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {step.description || 'No description'}
                          </Typography>
                          {step.duration && (
                            <Chip
                              icon={<TimerIcon />}
                              label={`${step.duration} min`}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => editStep(step)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => deleteStep(step.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              
              {template.steps.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <Typography variant="body1">No steps added yet</Typography>
                  <Typography variant="body2">Click "Add Step" to create your first protocol step</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Step Dialog */}
      <Dialog open={stepDialogOpen} onClose={() => setStepDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedStep?.id ? 'Edit Step' : 'Add Step'}
        </DialogTitle>
        <DialogContent>
          {selectedStep && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Step Title"
                    value={selectedStep.title}
                    onChange={(e) => setSelectedStep(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={selectedStep.description}
                    onChange={(e) => setSelectedStep(prev => prev ? { ...prev, description: e.target.value } : null)}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Step Type</InputLabel>
                    <Select
                      value={selectedStep.type}
                      onChange={(e) => setSelectedStep(prev => prev ? { ...prev, type: e.target.value as any } : null)}
                      label="Step Type"
                    >
                      <MenuItem value="text">Text</MenuItem>
                      <MenuItem value="image">Image</MenuItem>
                      <MenuItem value="sketch">Sketch</MenuItem>
                      <MenuItem value="variable">Variable</MenuItem>
                      <MenuItem value="timer">Timer</MenuItem>
                      <MenuItem value="reagent">Reagent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Duration (minutes)"
                    value={selectedStep.duration || ''}
                    onChange={(e) => setSelectedStep(prev => prev ? { ...prev, duration: parseInt(e.target.value) || undefined } : null)}
                  />
                </Grid>
                
                {/* Content based on step type */}
                {selectedStep.type === 'text' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Content"
                      value={selectedStep.content || ''}
                      onChange={(e) => setSelectedStep(prev => prev ? { ...prev, content: e.target.value } : null)}
                    />
                  </Grid>
                )}
                
                {selectedStep.type === 'image' && (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      {selectedStep.imageUrl ? (
                        <img src={selectedStep.imageUrl} alt="Step" style={{ maxWidth: '100%', maxHeight: 300 }} />
                      ) : (
                        <Box sx={{ border: '2px dashed #ccc', p: 3, borderRadius: 1 }}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                          />
                          <Button
                            variant="outlined"
                            startIcon={<UploadIcon />}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Upload Image
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                )}
                
                {selectedStep.type === 'sketch' && (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={300}
                        style={{ border: '1px solid #ccc', cursor: 'crosshair' }}
                      />
                      <Box sx={{ mt: 1 }}>
                        <Button onClick={handleSketchSave}>Save Sketch</Button>
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                {selectedStep.type === 'reagent' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Reagent Information"
                      value={selectedStep.content || ''}
                      onChange={(e) => setSelectedStep(prev => prev ? { ...prev, content: e.target.value } : null)}
                      placeholder="Enter reagent details, concentrations, volumes, etc."
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStepDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveStep} variant="contained">Save Step</Button>
        </DialogActions>
      </Dialog>

      {/* Variable Dialog */}
      <Dialog open={variableDialogOpen} onClose={() => setVariableDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedVariable?.id ? 'Edit Variable' : 'Add Variable'}
        </DialogTitle>
        <DialogContent>
          {selectedVariable && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Variable Name"
                value={selectedVariable.name}
                onChange={(e) => setSelectedVariable(prev => prev ? { ...prev, name: e.target.value } : null)}
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={selectedVariable.type}
                  onChange={(e) => setSelectedVariable(prev => prev ? { ...prev, type: e.target.value as any } : null)}
                  label="Type"
                >
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="select">Select</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Description"
                value={selectedVariable.description}
                onChange={(e) => setSelectedVariable(prev => prev ? { ...prev, description: e.target.value } : null)}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Default Value"
                value={selectedVariable.defaultValue || ''}
                onChange={(e) => setSelectedVariable(prev => prev ? { ...prev, defaultValue: e.target.value } : null)}
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVariableDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveVariable} variant="contained">Save Variable</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 