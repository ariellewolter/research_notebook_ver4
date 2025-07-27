import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, List, ListItem, ListItemText, IconButton, Checkbox, MenuItem, Grid, Tabs, Tab } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { projectsApi, tasksApi } from '../services/api';
import { getNotes } from '../services/api';
import { format, isToday, parseISO, addDays, addWeeks, addMonths, addYears } from 'date-fns';

// Natural language parsing for task creation
const parseNaturalLanguage = (text: string) => {
  const result = {
    title: text,
    date: '',
    time: '',
    recurring: undefined as any,
    priority: 'medium' as 'low' | 'medium' | 'high',
    type: 'general'
  };

  // Parse date patterns
  const today = new Date();
  
  // "tomorrow", "next week", "next month", etc.
  if (text.toLowerCase().includes('tomorrow')) {
    result.date = format(addDays(today, 1), 'yyyy-MM-dd');
    result.title = result.title.replace(/tomorrow/gi, '').trim();
  } else if (text.toLowerCase().includes('next week')) {
    result.date = format(addWeeks(today, 1), 'yyyy-MM-dd');
    result.title = result.title.replace(/next week/gi, '').trim();
  } else if (text.toLowerCase().includes('next month')) {
    result.date = format(addMonths(today, 1), 'yyyy-MM-dd');
    result.title = result.title.replace(/next month/gi, '').trim();
  } else if (text.toLowerCase().includes('next year')) {
    result.date = format(addYears(today, 1), 'yyyy-MM-dd');
    result.title = result.title.replace(/next year/gi, '').trim();
  }

  // Parse time patterns
  const timeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3]?.toLowerCase();
    
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    result.time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    result.title = result.title.replace(timeMatch[0], '').trim();
  }

  // Parse recurring patterns
  if (text.toLowerCase().includes('daily') || text.toLowerCase().includes('every day')) {
    result.recurring = { type: 'daily', interval: 1 };
    result.title = result.title.replace(/(daily|every day)/gi, '').trim();
  } else if (text.toLowerCase().includes('weekly') || text.toLowerCase().includes('every week')) {
    result.recurring = { type: 'weekly', interval: 1 };
    result.title = result.title.replace(/(weekly|every week)/gi, '').trim();
  } else if (text.toLowerCase().includes('monthly') || text.toLowerCase().includes('every month')) {
    result.recurring = { type: 'monthly', interval: 1 };
    result.title = result.title.replace(/(monthly|every month)/gi, '').trim();
  }

  // Parse priority
  if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('asap')) {
    result.priority = 'high';
    result.title = result.title.replace(/(urgent|asap)/gi, '').trim();
  } else if (text.toLowerCase().includes('low priority')) {
    result.priority = 'low';
    result.title = result.title.replace(/low priority/gi, '').trim();
  }

  // Parse task types
  if (text.toLowerCase().includes('meeting')) {
    result.type = 'meeting';
  } else if (text.toLowerCase().includes('order') || text.toLowerCase().includes('purchase')) {
    result.type = 'order';
  } else if (text.toLowerCase().includes('experiment') || text.toLowerCase().includes('lab')) {
    result.type = 'experiment';
  }

  return result;
};

interface Task {
  id: string;
  type: string;
  title: string;
  date: string;
  time: string;
  projectId: string;
  protocolId: string;
  experimentId: string;
  noteId: string;
  completed: boolean;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  priority: 'low' | 'medium' | 'high';
  description?: string;
  tags?: string[];
}

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    type: '',
    title: '',
    date: '',
    time: '',
    projectId: '',
    protocolId: '',
    experimentId: '',
    noteId: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    description: '',
    tags: [] as string[],
    recurring: undefined as any,
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editTaskData, setEditTaskData] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const naturalLanguageInputRef = useRef<HTMLInputElement>(null);

  // Agenda view state
  const [agendaView, setAgendaView] = useState<'today' | 'tomorrow' | 'week'>('today');
  const handleAgendaChange = (_: any, newValue: 'today' | 'tomorrow' | 'week') => setAgendaView(newValue);

  const today = new Date();

  useEffect(() => {
    projectsApi.getAll().then(res => setProjects(res.data.projects || res.data || []));
    fetch('/api/protocols').then(r => r.json()).then(data => setProtocols(data.protocols || data || []));
    fetch('/api/experiments').then(r => r.json()).then(data => setExperiments(data.experiments || data || []));
    getNotes().then(data => setNotes(data.notes || []));
    // Fetch tasks from backend
    tasksApi.getAll().then(res => setTasks(res.data || []));
  }, []);

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      const res = await tasksApi.create({
        title: newTask.title,
        type: newTask.type,
        date: newTask.date,
        time: newTask.time,
        projectId: newTask.projectId || undefined,
        protocolId: newTask.protocolId || undefined,
        experimentId: newTask.experimentId || undefined,
        noteId: newTask.noteId || undefined,
        completed: false,
      });
      setTasks([res.data, ...tasks]);
      setNewTask({ 
        type: '', 
        title: '', 
        date: '', 
        time: '', 
        projectId: '', 
        protocolId: '', 
        experimentId: '', 
        noteId: '',
        priority: 'medium',
        description: '',
        tags: [],
        recurring: undefined,
      });
    } catch (err) {
      // Optionally show error
    }
  };

  const handleToggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      const res = await tasksApi.update(id, { completed: !task.completed });
      setTasks(tasks.map(t => t.id === id ? res.data : t));
    } catch (err) {
      // Optionally show error
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await tasksApi.delete(id);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      // Optionally show error
    }
  };

  const handleNewTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  const handleOpenEditDialog = (task: Task) => {
    setEditTask(task);
    setEditTaskData({ ...task });
    setEditDialogOpen(true);
  };
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditTask(null);
    setEditTaskData(null);
  };
  const handleEditTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditTaskData({ ...editTaskData, [e.target.name]: e.target.value });
  };
  const handleSaveEditTask = async () => {
    if (!editTask || !editTaskData.title.trim()) return;
    try {
      const res = await tasksApi.update(editTask.id, {
        ...editTaskData,
      });
      setTasks(tasks.map(t => t.id === editTask.id ? res.data : t));
      handleCloseEditDialog();
    } catch (err) {
      // Optionally show error
    }
  };

  // Helper to get tasks for a given date
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.date) return false;
      const taskDate = task.date.length > 10 ? parseISO(task.date) : new Date(task.date);
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      );
    });
  };

  // Helper to get dates for agenda view
  const getAgendaDates = () => {
    if (agendaView === 'today') return [today];
    if (agendaView === 'tomorrow') return [new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)];
    // week: today + next 6 days
    return Array.from({ length: 7 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + i));
  };

  const agendaDates = getAgendaDates();

  return (
    <Box sx={{ maxWidth: { xs: '100%', sm: 700 }, mx: 'auto', mt: { xs: 2, sm: 4 } }}>
      <Typography variant="h4" gutterBottom>General Tasks</Typography>
      {/* Agenda view toggle */}
      <Tabs value={agendaView} onChange={handleAgendaChange} sx={{ mb: 2 }}>
        <Tab value="today" label="Today" />
        <Tab value="tomorrow" label="Tomorrow" />
        <Tab value="week" label="Next 7 Days" />
      </Tabs>
      {/* Agenda schedule view */}
      <Box sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 2, background: '#f5f7fa' }}>
        {agendaDates.map(date => {
          const dayTasks = getTasksForDate(date);
          const allDayTasks = dayTasks.filter(task => !task.time);
          const timedTasks = dayTasks.filter(task => task.time).sort((a, b) => a.time.localeCompare(b.time));
          return (
            <Box key={date.toISOString()} sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>{format(date, 'EEEE, MMMM d')}</Typography>
              {dayTasks.length === 0 && <Typography color="text.secondary">No tasks scheduled.</Typography>}
              {allDayTasks.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">All Day</Typography>
                  {allDayTasks.map(task => (
                    <Box key={task.id} sx={{ pl: 2, py: 0.5, display: 'flex', alignItems: 'center' }}>
                      <Checkbox checked={task.completed} onChange={() => handleToggleComplete(task.id)} />
                      <Typography sx={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
              {timedTasks.length > 0 && (
                <Box>
                  {timedTasks.map(task => (
                    <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', pl: 2, py: 0.5 }}>
                      <Typography sx={{ minWidth: 60, color: 'text.secondary', fontWeight: 500 }}>{task.time}</Typography>
                      <Checkbox checked={task.completed} onChange={() => handleToggleComplete(task.id)} />
                      <Typography sx={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
      
      {/* Natural Language Input */}
      <Box sx={{ mb: 3, p: 2, border: '1px solid #1976d2', borderRadius: 2, background: '#f3f8ff' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
          Quick Add Task (Natural Language)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Try: "Meeting with team tomorrow at 2pm", "Order lab supplies next week", "Daily check equipment"
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              placeholder="Enter task in natural language..."
              variant="outlined"
              inputRef={naturalLanguageInputRef}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  const parsed = parseNaturalLanguage(target.value);
                  setNewTask(prev => ({ ...prev, ...parsed }));
                  target.value = '';
                }
              }}
              sx={{ 
                '& .MuiInputBase-root': {
                  fontSize: { xs: '14px', sm: '16px' }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => {
                if (naturalLanguageInputRef.current?.value) {
                  const parsed = parseNaturalLanguage(naturalLanguageInputRef.current.value);
                  setNewTask(prev => ({ ...prev, ...parsed }));
                  naturalLanguageInputRef.current.value = '';
                }
              }}
              fullWidth
            >
              Parse & Fill
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 2, background: '#fafbfc' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Type (optional)"
              name="type"
              select
              value={newTask.type}
              onChange={handleNewTaskChange}
              fullWidth
              sx={{ 
                '& .MuiInputBase-root': {
                  fontSize: { xs: '14px', sm: '16px' }
                }
              }}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="meeting">Meeting</MenuItem>
              <MenuItem value="order">Order</MenuItem>
              <MenuItem value="reminder">Reminder</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={8}>
            <TextField
              label="Title"
              name="title"
              value={newTask.title}
              onChange={handleNewTaskChange}
              fullWidth
              required
              sx={{ 
                '& .MuiInputBase-root': {
                  fontSize: { xs: '14px', sm: '16px' }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Date (optional)"
              name="date"
              type="date"
              value={newTask.date}
              onChange={handleNewTaskChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ 
                '& .MuiInputBase-root': {
                  fontSize: { xs: '14px', sm: '16px' }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Time (optional)"
              name="time"
              type="time"
              value={newTask.time}
              onChange={handleNewTaskChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ 
                '& .MuiInputBase-root': {
                  fontSize: { xs: '14px', sm: '16px' }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Project (optional)"
              name="projectId"
              select
              value={newTask.projectId}
              onChange={handleNewTaskChange}
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {projects.map((project: any) => (
                <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Protocol (optional)"
              name="protocolId"
              select
              value={newTask.protocolId}
              onChange={handleNewTaskChange}
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {protocols.map((protocol: any) => (
                <MenuItem key={protocol.id} value={protocol.id}>{protocol.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Experiment (optional)"
              name="experimentId"
              select
              value={newTask.experimentId}
              onChange={handleNewTaskChange}
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {experiments.map((experiment: any) => (
                <MenuItem key={experiment.id} value={experiment.id}>{experiment.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Note (optional)"
              name="noteId"
              select
              value={newTask.noteId}
              onChange={handleNewTaskChange}
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {notes.map((note: any) => (
                <MenuItem key={note.id} value={note.id}>{note.title}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button variant="contained" color="primary" onClick={handleAddTask} sx={{ height: '100%', width: '100%' }} disabled={!newTask.title}>
              Add Task
            </Button>
          </Grid>
        </Grid>
      </Box>
      <List>
        {tasks.map(task => (
          <ListItem
            key={task.id}
            secondaryAction={
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditDialog(task)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteTask(task.id)}>
                  <DeleteIcon />
                </IconButton>
              </>
            }
            disablePadding
          >
            <Checkbox
              checked={task.completed}
              onChange={() => handleToggleComplete(task.id)}
            />
            <ListItemText
              primary={task.title}
              secondary={
                [
                  task.type && `Type: ${task.type}`,
                  task.date && `Date: ${task.date}`,
                  task.time && `Time: ${task.time}`,
                  task.projectId && `Project: ${projects.find(p => p.id === task.projectId)?.name}`,
                  task.protocolId && `Protocol: ${protocols.find(p => p.id === task.protocolId)?.name}`,
                  task.experimentId && `Experiment: ${experiments.find(e => e.id === task.experimentId)?.name}`,
                  task.noteId && `Note: ${notes.find(n => n.id === task.noteId)?.title}`,
                ].filter(Boolean).join(' | ')
              }
              sx={{ textDecoration: task.completed ? 'line-through' : 'none' }}
            />
          </ListItem>
        ))}
      </List>
      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          {editTaskData && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Type (optional)"
                  name="type"
                  select
                  value={editTaskData.type}
                  onChange={handleEditTaskChange}
                  fullWidth
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="meeting">Meeting</MenuItem>
                  <MenuItem value="order">Order</MenuItem>
                  <MenuItem value="reminder">Reminder</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Title"
                  name="title"
                  value={editTaskData.title}
                  onChange={handleEditTaskChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Date (optional)"
                  name="date"
                  type="date"
                  value={editTaskData.date}
                  onChange={handleEditTaskChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Time (optional)"
                  name="time"
                  type="time"
                  value={editTaskData.time}
                  onChange={handleEditTaskChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Project (optional)"
                  name="projectId"
                  select
                  value={editTaskData.projectId}
                  onChange={handleEditTaskChange}
                  fullWidth
                >
                  <MenuItem value="">None</MenuItem>
                  {projects.map((project: any) => (
                    <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Protocol (optional)"
                  name="protocolId"
                  select
                  value={editTaskData.protocolId}
                  onChange={handleEditTaskChange}
                  fullWidth
                >
                  <MenuItem value="">None</MenuItem>
                  {protocols.map((protocol: any) => (
                    <MenuItem key={protocol.id} value={protocol.id}>{protocol.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Experiment (optional)"
                  name="experimentId"
                  select
                  value={editTaskData.experimentId}
                  onChange={handleEditTaskChange}
                  fullWidth
                >
                  <MenuItem value="">None</MenuItem>
                  {experiments.map((experiment: any) => (
                    <MenuItem key={experiment.id} value={experiment.id}>{experiment.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Note (optional)"
                  name="noteId"
                  select
                  value={editTaskData.noteId}
                  onChange={handleEditTaskChange}
                  fullWidth
                >
                  <MenuItem value="">None</MenuItem>
                  {notes.map((note: any) => (
                    <MenuItem key={note.id} value={note.id}>{note.title}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleSaveEditTask} variant="contained" disabled={!editTaskData || !editTaskData.title}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks; 