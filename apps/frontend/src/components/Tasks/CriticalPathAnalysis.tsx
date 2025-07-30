import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { taskDependenciesApi } from '../../services/api';

interface CriticalPathData {
  criticalPath: string[];
  duration: number;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    dependencies: string[];
  }>;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface CriticalPathAnalysisProps {
  open: boolean;
  onClose: () => void;
  selectedTasks: Task[];
}

const statusColors = {
  pending: '#ff9800',
  in_progress: '#2196f3',
  completed: '#4caf50',
  cancelled: '#f44336'
};

const priorityColors = {
  high: '#f44336',
  medium: '#ff9800',
  low: '#4caf50'
};

export default function CriticalPathAnalysis({
  open,
  onClose,
  selectedTasks
}: CriticalPathAnalysisProps) {
  const [criticalPathData, setCriticalPathData] = useState<CriticalPathData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && selectedTasks.length > 0) {
      calculateCriticalPath();
    }
  }, [open, selectedTasks]);

  const calculateCriticalPath = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const taskIds = selectedTasks.map(task => task.id);
      const response = await taskDependenciesApi.getCriticalPath(taskIds);
      setCriticalPathData(response.data.data);
    } catch (error: any) {
      console.error('Error calculating critical path:', error);
      setError(error.response?.data?.error || 'Failed to calculate critical path');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || '#666';
  };

  const getPriorityColor = (priority: string) => {
    return priorityColors[priority as keyof typeof priorityColors] || '#666';
  };

  const isInCriticalPath = (taskId: string) => {
    return criticalPathData?.criticalPath.includes(taskId) || false;
  };

  const getTaskById = (taskId: string) => {
    return selectedTasks.find(task => task.id === taskId);
  };

  const getDependencyCount = (taskId: string) => {
    const task = criticalPathData?.tasks.find(t => t.id === taskId);
    return task?.dependencies.length || 0;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <TimelineIcon />
          Critical Path Analysis
        </Box>
        <Typography variant="subtitle2" color="textSecondary">
          {selectedTasks.length} tasks selected
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        )}

        {criticalPathData && !loading && (
          <Box>
            {/* Summary */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Critical Path Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {criticalPathData.duration}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Duration (steps)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="secondary">
                      {criticalPathData.criticalPath.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Critical Path Tasks
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main">
                      {selectedTasks.length - criticalPathData.criticalPath.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Non-Critical Tasks
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Critical Path Visualization */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Critical Path
              </Typography>
              <Box sx={{ position: 'relative', mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={(criticalPathData.criticalPath.length / selectedTasks.length) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                  {criticalPathData.criticalPath.length} of {selectedTasks.length} tasks are on the critical path
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {criticalPathData.criticalPath.map((taskId, index) => {
                  const task = getTaskById(taskId);
                  if (!task) return null;
                  
                  return (
                    <Card
                      key={taskId}
                      sx={{
                        minWidth: 200,
                        border: '2px solid #f44336',
                        backgroundColor: '#fff3e0'
                      }}
                    >
                      <CardContent sx={{ p: 1.5 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Typography variant="body2" fontWeight="bold">
                            {index + 1}.
                          </Typography>
                          <Typography variant="body2" noWrap>
                            {task.title}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={0.5}>
                          <Chip
                            label={task.status}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(task.status),
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                          <Chip
                            label={task.priority}
                            size="small"
                            sx={{
                              backgroundColor: getPriorityColor(task.priority),
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                          <Chip
                            label={`${getDependencyCount(taskId)} deps`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Paper>

            {/* All Tasks Analysis */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                All Tasks Analysis
              </Typography>
              <List>
                {selectedTasks.map((task, index) => {
                  const isCritical = isInCriticalPath(task.id);
                  const dependencyCount = getDependencyCount(task.id);
                  
                  return (
                    <ListItem
                      key={task.id}
                      divider
                      sx={{
                        backgroundColor: isCritical ? '#fff3e0' : 'transparent',
                        borderLeft: isCritical ? '4px solid #f44336' : 'none'
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1">
                              {task.title}
                            </Typography>
                            {isCritical && (
                              <Chip
                                label="Critical"
                                size="small"
                                color="error"
                                icon={<WarningIcon />}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box display="flex" gap={1} mt={0.5}>
                            <Chip
                              label={task.status}
                              size="small"
                              sx={{
                                backgroundColor: getStatusColor(task.status),
                                color: 'white'
                              }}
                            />
                            <Chip
                              label={task.priority}
                              size="small"
                              sx={{
                                backgroundColor: getPriorityColor(task.priority),
                                color: 'white'
                              }}
                            />
                            <Chip
                              label={`${dependencyCount} dependencies`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Paper>

            {/* Recommendations */}
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recommendations
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Focus on Critical Path Tasks"
                    secondary="Tasks on the critical path directly impact the overall project timeline. Prioritize completing these tasks first."
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Monitor Dependencies"
                    secondary="Tasks with many dependencies are more likely to cause delays. Keep a close eye on their progress."
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Consider Parallel Execution"
                    secondary="Non-critical tasks can often be executed in parallel to optimize resource utilization."
                  />
                </ListItem>
              </List>
            </Paper>
          </Box>
        )}

        {!criticalPathData && !loading && (
          <Box textAlign="center" py={4}>
            <TimelineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              Select tasks to analyze critical path
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {selectedTasks.length > 0 && (
          <Button
            variant="contained"
            onClick={calculateCriticalPath}
            disabled={loading}
            startIcon={<TimelineIcon />}
          >
            Recalculate
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
} 