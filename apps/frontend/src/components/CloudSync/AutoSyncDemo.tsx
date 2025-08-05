import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Divider,
} from '@mui/material';
import {
  CloudSync as CloudSyncIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNotesWithAutoSync } from '../../hooks/api/useNotesWithAutoSync';
import { useProjectsWithAutoSync } from '../../hooks/api/useProjectsWithAutoSync';
import { useTasksWithAutoSync } from '../../hooks/useTasksWithAutoSync';
import { useAutoSyncContext } from './AutoSyncProvider';
import { AutoSyncStatus } from './AutoSyncStatus';

export const AutoSyncDemo: React.FC = () => {
  const { createNote, updateNote } = useNotesWithAutoSync();
  const { createProject, updateProject } = useProjectsWithAutoSync();
  const { createTask, updateTask } = useTasksWithAutoSync();
  const { triggerManualSync } = useAutoSyncContext();

  const [noteData, setNoteData] = useState({
    title: '',
    content: '',
    cloudSynced: false,
    cloudService: 'dropbox',
    cloudPath: '/research-notes'
  });

  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    cloudSynced: false,
    cloudService: 'dropbox',
    cloudPath: '/research-projects'
  });

  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    cloudSynced: false,
    cloudService: 'dropbox',
    cloudPath: '/research-tasks'
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveNote = async () => {
    try {
      const savedNote = await createNote(noteData);
      setMessage({ type: 'success', text: 'Note saved successfully!' });
      setNoteData({ ...noteData, title: '', content: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save note' });
    }
  };

  const handleSaveProject = async () => {
    try {
      const savedProject = await createProject(projectData);
      setMessage({ type: 'success', text: 'Project saved successfully!' });
      setProjectData({ ...projectData, name: '', description: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save project' });
    }
  };

  const handleSaveTask = async () => {
    try {
      const savedTask = await createTask(taskData);
      setMessage({ type: 'success', text: 'Task saved successfully!' });
      setTaskData({ ...taskData, title: '', description: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save task' });
    }
  };

  const handleManualSync = async (entityType: 'note' | 'project' | 'task', entity: any) => {
    try {
      await triggerManualSync(entityType, entity.id, entity);
      setMessage({ type: 'success', text: 'Manual sync triggered!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Manual sync failed' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Auto-Sync Demo
      </Typography>
      
      <Typography variant="body1" paragraph>
        This demo shows how the auto-sync functionality works. Create entities with cloud sync enabled
        and watch them automatically sync to your cloud storage.
      </Typography>

      {/* Auto-sync status */}
      <AutoSyncStatus />

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Note Creation */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Create Note
              </Typography>
              
              <TextField
                fullWidth
                label="Title"
                value={noteData.title}
                onChange={(e) => setNoteData({ ...noteData, title: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Content"
                value={noteData.content}
                onChange={(e) => setNoteData({ ...noteData, content: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={noteData.cloudSynced}
                    onChange={(e) => setNoteData({ ...noteData, cloudSynced: e.target.checked })}
                  />
                }
                label="Enable Cloud Sync"
                sx={{ mb: 2 }}
              />
              
              {noteData.cloudSynced && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Cloud Service</InputLabel>
                  <Select
                    value={noteData.cloudService}
                    onChange={(e) => setNoteData({ ...noteData, cloudService: e.target.value })}
                    label="Cloud Service"
                  >
                    <MenuItem value="dropbox">Dropbox</MenuItem>
                    <MenuItem value="google">Google Drive</MenuItem>
                    <MenuItem value="onedrive">OneDrive</MenuItem>
                    <MenuItem value="apple">iCloud</MenuItem>
                  </Select>
                </FormControl>
              )}
              
              <Button
                fullWidth
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveNote}
                disabled={!noteData.title || !noteData.content}
              >
                Save Note
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Project Creation */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Create Project
              </Typography>
              
              <TextField
                fullWidth
                label="Name"
                value={projectData.name}
                onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={projectData.description}
                onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={projectData.cloudSynced}
                    onChange={(e) => setProjectData({ ...projectData, cloudSynced: e.target.checked })}
                  />
                }
                label="Enable Cloud Sync"
                sx={{ mb: 2 }}
              />
              
              {projectData.cloudSynced && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Cloud Service</InputLabel>
                  <Select
                    value={projectData.cloudService}
                    onChange={(e) => setProjectData({ ...projectData, cloudService: e.target.value })}
                    label="Cloud Service"
                  >
                    <MenuItem value="dropbox">Dropbox</MenuItem>
                    <MenuItem value="google">Google Drive</MenuItem>
                    <MenuItem value="onedrive">OneDrive</MenuItem>
                    <MenuItem value="apple">iCloud</MenuItem>
                  </Select>
                </FormControl>
              )}
              
              <Button
                fullWidth
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveProject}
                disabled={!projectData.name}
              >
                Save Project
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Task Creation */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Create Task
              </Typography>
              
              <TextField
                fullWidth
                label="Title"
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={taskData.cloudSynced}
                    onChange={(e) => setTaskData({ ...taskData, cloudSynced: e.target.checked })}
                  />
                }
                label="Enable Cloud Sync"
                sx={{ mb: 2 }}
              />
              
              {taskData.cloudSynced && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Cloud Service</InputLabel>
                  <Select
                    value={taskData.cloudService}
                    onChange={(e) => setTaskData({ ...taskData, cloudService: e.target.value })}
                    label="Cloud Service"
                  >
                    <MenuItem value="dropbox">Dropbox</MenuItem>
                    <MenuItem value="google">Google Drive</MenuItem>
                    <MenuItem value="onedrive">OneDrive</MenuItem>
                    <MenuItem value="apple">iCloud</MenuItem>
                  </Select>
                </FormControl>
              )}
              
              <Button
                fullWidth
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveTask}
                disabled={!taskData.title}
              >
                Save Task
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Manual Sync Demo */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Manual Sync Demo
          </Typography>
          
          <Typography variant="body2" paragraph>
            You can also trigger manual sync for existing entities. This is useful for testing
            or when you want to force a sync operation.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<CloudSyncIcon />}
              onClick={() => handleManualSync('note', { id: 'demo-note', title: 'Demo Note' })}
            >
              Sync Demo Note
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<CloudSyncIcon />}
              onClick={() => handleManualSync('project', { id: 'demo-project', name: 'Demo Project' })}
            >
              Sync Demo Project
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<CloudSyncIcon />}
              onClick={() => handleManualSync('task', { id: 'demo-task', title: 'Demo Task' })}
            >
              Sync Demo Task
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}; 