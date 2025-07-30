import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  AccountTree as WorkflowIcon,
  Timeline as CriticalPathIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { taskDependenciesApi } from '../../services/api';

interface TaskDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  dependencyType: 'blocks' | 'requires' | 'suggests' | 'relates';
  fromTask: {
    id: string;
    title: string;
    status: string;
    priority: string;
  };
  toTask: {
    id: string;
    title: string;
    status: string;
    priority: string;
  };
  createdAt: string;
}

interface TaskWorkflow {
  id: string;
  name: string;
  description?: string;
  type: 'sequential' | 'parallel' | 'conditional' | 'mixed';
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    workflowOrder: number;
    priority: string;
    deadline?: string;
    dependencies: Array<{
      fromTask: {
        id: string;
        title: string;
        status: string;
      };
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface TaskDependenciesProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  allTasks: Task[];
}

const dependencyTypeColors = {
  blocks: '#f44336',
  requires: '#ff9800',
  suggests: '#2196f3',
  relates: '#4caf50'
};

const dependencyTypeLabels = {
  blocks: 'Blocks',
  requires: 'Requires',
  suggests: 'Suggests',
  relates: 'Relates'
};

export default function TaskDependencies({
  open,
  onClose,
  taskId,
  taskTitle,
  allTasks
}: TaskDependenciesProps) {
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [workflows, setWorkflows] = useState<TaskWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [newDependency, setNewDependency] = useState({
    fromTaskId: '',
    toTaskId: '',
    dependencyType: 'blocks' as const
  });
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    type: 'sequential' as const,
    taskIds: [] as string[]
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadDependencies();
      loadWorkflows();
    }
  }, [open, taskId]);

  const loadDependencies = async () => {
    try {
      setLoading(true);
      const response = await taskDependenciesApi.getByTask(taskId);
      setDependencies(response.data.data || []);
    } catch (error) {
      console.error('Error loading dependencies:', error);
      setError('Failed to load dependencies');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      const response = await taskDependenciesApi.getWorkflows();
      setWorkflows(response.data.data || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  };

  const handleCreateDependency = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await taskDependenciesApi.create({
        fromTaskId: newDependency.fromTaskId,
        toTaskId: newDependency.toTaskId,
        dependencyType: newDependency.dependencyType
      });

      setSuccess('Dependency created successfully');
      setNewDependency({
        fromTaskId: '',
        toTaskId: '',
        dependencyType: 'blocks'
      });
      loadDependencies();
    } catch (error: any) {
      console.error('Error creating dependency:', error);
      setError(error.response?.data?.error || 'Failed to create dependency');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDependency = async (dependencyId: string) => {
    try {
      await taskDependenciesApi.delete(dependencyId);
      setSuccess('Dependency deleted successfully');
      loadDependencies();
    } catch (error) {
      console.error('Error deleting dependency:', error);
      setError('Failed to delete dependency');
    }
  };

  const handleCreateWorkflow = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await taskDependenciesApi.createWorkflow({
        name: newWorkflow.name,
        description: newWorkflow.description,
        type: newWorkflow.type,
        taskIds: newWorkflow.taskIds
      });

      setSuccess('Workflow created successfully');
      setNewWorkflow({
        name: '',
        description: '',
        type: 'sequential',
        taskIds: []
      });
      loadWorkflows();
    } catch (error: any) {
      console.error('Error creating workflow:', error);
      setError(error.response?.data?.error || 'Failed to create workflow');
    } finally {
      setLoading(false);
    }
  };

  const getDependencyTypeColor = (type: string) => {
    return dependencyTypeColors[type as keyof typeof dependencyTypeColors] || '#666';
  };

  const getDependencyTypeLabel = (type: string) => {
    return dependencyTypeLabels[type as keyof typeof dependencyTypeLabels] || type;
  };

  const incomingDependencies = dependencies.filter(dep => dep.toTaskId === taskId);
  const outgoingDependencies = dependencies.filter(dep => dep.fromTaskId === taskId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Task Dependencies & Workflows
        <Typography variant="subtitle2" color="textSecondary">
          {taskTitle}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Button
            variant={selectedTab === 0 ? 'contained' : 'text'}
            onClick={() => setSelectedTab(0)}
            sx={{ mr: 1 }}
          >
            Dependencies
          </Button>
          <Button
            variant={selectedTab === 1 ? 'contained' : 'text'}
            onClick={() => setSelectedTab(1)}
            sx={{ mr: 1 }}
          >
            Workflows
          </Button>
        </Box>

        {selectedTab === 0 && (
          <Box>
            {/* Incoming Dependencies */}
            <Typography variant="h6" gutterBottom>
              Incoming Dependencies ({incomingDependencies.length})
            </Typography>
            <List>
              {incomingDependencies.map((dependency) => (
                <ListItem key={dependency.id} divider>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1">
                          {dependency.fromTask.title}
                        </Typography>
                        <Chip
                          label={getDependencyTypeLabel(dependency.dependencyType)}
                          size="small"
                          sx={{
                            backgroundColor: getDependencyTypeColor(dependency.dependencyType),
                            color: 'white'
                          }}
                        />
                      </Box>
                    }
                    secondary={`Status: ${dependency.fromTask.status} | Priority: ${dependency.fromTask.priority}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteDependency(dependency.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {incomingDependencies.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No incoming dependencies"
                    secondary="This task doesn't depend on any other tasks"
                  />
                </ListItem>
              )}
            </List>

            <Divider sx={{ my: 2 }} />

            {/* Outgoing Dependencies */}
            <Typography variant="h6" gutterBottom>
              Outgoing Dependencies ({outgoingDependencies.length})
            </Typography>
            <List>
              {outgoingDependencies.map((dependency) => (
                <ListItem key={dependency.id} divider>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1">
                          {dependency.toTask.title}
                        </Typography>
                        <Chip
                          label={getDependencyTypeLabel(dependency.dependencyType)}
                          size="small"
                          sx={{
                            backgroundColor: getDependencyTypeColor(dependency.dependencyType),
                            color: 'white'
                          }}
                        />
                      </Box>
                    }
                    secondary={`Status: ${dependency.toTask.status} | Priority: ${dependency.toTask.priority}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteDependency(dependency.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {outgoingDependencies.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No outgoing dependencies"
                    secondary="No tasks depend on this task"
                  />
                </ListItem>
              )}
            </List>

            <Divider sx={{ my: 2 }} />

            {/* Add New Dependency */}
            <Typography variant="h6" gutterBottom>
              Add New Dependency
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={allTasks.filter(task => task.id !== taskId)}
                  getOptionLabel={(option) => option.title}
                  value={allTasks.find(task => task.id === newDependency.fromTaskId) || null}
                  onChange={(_, value) => setNewDependency({
                    ...newDependency,
                    fromTaskId: value?.id || ''
                  })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="From Task"
                      fullWidth
                      size="small"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={allTasks.filter(task => task.id !== taskId)}
                  getOptionLabel={(option) => option.title}
                  value={allTasks.find(task => task.id === newDependency.toTaskId) || null}
                  onChange={(_, value) => setNewDependency({
                    ...newDependency,
                    toTaskId: value?.id || ''
                  })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="To Task"
                      fullWidth
                      size="small"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={newDependency.dependencyType}
                    onChange={(e) => setNewDependency({
                      ...newDependency,
                      dependencyType: e.target.value as any
                    })}
                    label="Type"
                  >
                    <MenuItem value="blocks">Blocks</MenuItem>
                    <MenuItem value="requires">Requires</MenuItem>
                    <MenuItem value="suggests">Suggests</MenuItem>
                    <MenuItem value="relates">Relates</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateDependency}
                disabled={!newDependency.fromTaskId || !newDependency.toTaskId || loading}
              >
                Add Dependency
              </Button>
            </Box>
          </Box>
        )}

        {selectedTab === 1 && (
          <Box>
            {/* Existing Workflows */}
            <Typography variant="h6" gutterBottom>
              Existing Workflows ({workflows.length})
            </Typography>
            <Grid container spacing={2}>
              {workflows.map((workflow) => (
                <Grid item xs={12} sm={6} key={workflow.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{workflow.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {workflow.description}
                      </Typography>
                      <Chip
                        label={workflow.type}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {workflow.tasks.length} tasks
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Create New Workflow */}
            <Typography variant="h6" gutterBottom>
              Create New Workflow
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Workflow Name"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({
                    ...newWorkflow,
                    name: e.target.value
                  })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={newWorkflow.type}
                    onChange={(e) => setNewWorkflow({
                      ...newWorkflow,
                      type: e.target.value as any
                    })}
                    label="Type"
                  >
                    <MenuItem value="sequential">Sequential</MenuItem>
                    <MenuItem value="parallel">Parallel</MenuItem>
                    <MenuItem value="conditional">Conditional</MenuItem>
                    <MenuItem value="mixed">Mixed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({
                    ...newWorkflow,
                    description: e.target.value
                  })}
                  multiline
                  rows={2}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={allTasks}
                  getOptionLabel={(option) => option.title}
                  value={allTasks.filter(task => newWorkflow.taskIds.includes(task.id))}
                  onChange={(_, value) => setNewWorkflow({
                    ...newWorkflow,
                    taskIds: value.map(task => task.id)
                  })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Tasks"
                      fullWidth
                      size="small"
                    />
                  )}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<WorkflowIcon />}
                onClick={handleCreateWorkflow}
                disabled={!newWorkflow.name || newWorkflow.taskIds.length === 0 || loading}
              >
                Create Workflow
              </Button>
            </Box>
          </Box>
        )}

        {loading && (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
} 