import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, LinearProgress, List, ListItem, ListItemText, Divider, CircularProgress, Alert } from '@mui/material';
import { projectsApi } from '../services/api';
import { tasksApi } from '../services/api';
import type { Task } from '../../../../packages/shared/types';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

interface ProjectDashboardProps {
    projectId: string;
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projectId }) => {
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [taskForm, setTaskForm] = useState<Partial<Task>>({ title: '', description: '', status: 'todo', priority: 'medium', deadline: '' });
    const [taskSaving, setTaskSaving] = useState(false);

    useEffect(() => {
        const fetchProject = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await projectsApi.getById(projectId);
                setProject(res.data);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to load project');
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [projectId]);

    // Fetch tasks for this project
    useEffect(() => {
        if (!projectId) return;
        tasksApi.getByProject(projectId).then(res => setTasks(res.data));
    }, [projectId]);

    // Compute stats from real data
    const experiments = project?.experiments || [];
    const numExperiments = experiments.length;
    const completedExperiments = experiments.filter((e: any) => e.progress === 100).length;
    const avgProgress = numExperiments > 0 ? Math.round(experiments.reduce((sum: number, e: any) => sum + (e.progress || 0), 0) / numExperiments) : 0;
    // Notes
    const allNotes = experiments.flatMap((e: any) => e.notes || []);
    // Recent activity (experiments and notes, sorted by createdAt)
    const recentActivity = [
        ...experiments.map((e: any) => ({ type: 'experiment', text: `Experiment: ${e.name}`, time: e.createdAt })),
        ...allNotes.map((n: any) => ({ type: 'note', text: `Note: ${n.title}`, time: n.createdAt })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
    // Weekly activity (count per day)
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
    const activityCounts = Array(7).fill(0);
    [...experiments, ...allNotes].forEach((item: any) => {
        const d = new Date(item.createdAt);
        if (d >= weekAgo) {
            const day = d.getDay();
            activityCounts[day === 0 ? 6 : day - 1] += 1; // Mon=0, Sun=6
        }
    });

    // Task summary
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const overdueTasks = tasks.filter(t => t.status === 'overdue' || (t.deadline && t.status !== 'done' && new Date(t.deadline) < new Date())).length;

    // Task actions
    const handleOpenTaskDialog = () => { setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', deadline: '' }); setTaskDialogOpen(true); };
    const handleSaveTask = async () => {
        setTaskSaving(true);
        try {
            await tasksApi.create({ ...taskForm, projectId });
            const res = await tasksApi.getByProject(projectId);
            setTasks(res.data);
            setTaskDialogOpen(false);
        } finally { setTaskSaving(false); }
    };
    const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
        await tasksApi.update(id, updates);
        const res = await tasksApi.getByProject(projectId);
        setTasks(res.data);
    };
    const handleDeleteTask = async (id: string) => {
        await tasksApi.delete(id);
        const res = await tasksApi.getByProject(projectId);
        setTasks(res.data);
    };

    if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    if (error) return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;
    if (!project) return null;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>{project.name} Dashboard</Typography>
            <Grid container spacing={2}>
                {/* Stats Cards */}
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Experiments</Typography>
                            <Typography variant="h4">{numExperiments}</Typography>
                            <Typography variant="caption" color="success.main">{completedExperiments} completed</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Avg Progress</Typography>
                            <Typography variant="h4">{avgProgress}%</Typography>
                            <Typography variant="caption" color="primary.main">{numExperiments > 0 ? `${Math.round((completedExperiments / numExperiments) * 100)}% complete` : 'No data'}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Notes</Typography>
                            <Typography variant="h4">{allNotes.length}</Typography>
                            <Typography variant="caption" color="info.main">Recent: {allNotes[0]?.title || 'N/A'}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 2 }}>
                {/* Recent Experiments */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>Recent Experiments</Typography>
                            {experiments.slice(0, 3).map((exp: any, i: number) => (
                                <Box key={i} sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle1">{exp.name}</Typography>
                                        <Chip label={exp.progress === 100 ? 'completed' : 'active'} color={exp.progress === 100 ? 'success' : 'primary'} size="small" />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">Started {new Date(exp.createdAt).toLocaleDateString()}</Typography>
                                    <LinearProgress variant="determinate" value={exp.progress || 0} sx={{ height: 8, borderRadius: 2, my: 1 }} color={exp.progress === 100 ? 'success' : 'primary'} />
                                    <Typography variant="caption">Progress: {exp.progress || 0}%</Typography>
                                    <Divider sx={{ my: 1 }} />
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
                {/* Quick Actions & Task Summary (placeholder) */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6">Quick Actions</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                <Button variant="contained" color="success" sx={{ mb: 1 }}>Log Experiment</Button>
                                <Button variant="contained" color="primary" sx={{ mb: 1 }}>Add Note</Button>
                                <Button variant="contained" color="warning" sx={{ mb: 1 }}>New Protocol</Button>
                            </Box>
                        </CardContent>
                    </Card>
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6">Task Summary</Typography>
                            <List>
                                <ListItem><ListItemText primary="Completed" /><Chip label={completedTasks} color="success" /></ListItem>
                                <ListItem><ListItemText primary="In Progress" /><Chip label={inProgressTasks} color="warning" /></ListItem>
                                <ListItem><ListItemText primary="Overdue" /><Chip label={overdueTasks} color="error" /></ListItem>
                            </List>
                            <Button variant="contained" color="primary" onClick={handleOpenTaskDialog} sx={{ mt: 2 }}>Add Task</Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Tasks</Typography>
                            <List>
                                {tasks.map(task => (
                                    <ListItem key={task.id} alignItems="flex-start" sx={{ bgcolor: task.status === 'overdue' ? 'error.light' : undefined, mb: 1, borderRadius: 1 }}>
                                        <ListItemText
                                            primary={<span>{task.title} <Chip size="small" label={task.priority} color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'success'} sx={{ ml: 1 }} /></span>}
                                            secondary={<>
                                                {task.description && <span>{task.description}<br /></span>}
                                                <span>Status: <Chip size="small" label={task.status} color={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'primary' : task.status === 'overdue' ? 'error' : 'default'} /></span>
                                                {task.deadline && <span> | Due: {new Date(task.deadline).toLocaleDateString()}</span>}
                                            </>}
                                        />
                                        <Button size="small" color="success" disabled={task.status === 'done'} onClick={() => handleUpdateTask(task.id, { status: 'done', completedAt: new Date().toISOString() })}>Mark Done</Button>
                                        <Button size="small" color="error" onClick={() => handleDeleteTask(task.id)}>Delete</Button>
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                    <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)}>
                        <DialogTitle>Add Task</DialogTitle>
                        <DialogContent>
                            <TextField fullWidth label="Title" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} sx={{ mb: 2 }} />
                            <TextField fullWidth label="Description" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} sx={{ mb: 2 }} multiline rows={2} />
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Status</InputLabel>
                                <Select value={taskForm.status} label="Status" onChange={e => setTaskForm({ ...taskForm, status: e.target.value as Task['status'] })}>
                                    <MenuItem value="todo">To Do</MenuItem>
                                    <MenuItem value="in_progress">In Progress</MenuItem>
                                    <MenuItem value="done">Done</MenuItem>
                                    <MenuItem value="overdue">Overdue</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Priority</InputLabel>
                                <Select value={taskForm.priority} label="Priority" onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as Task['priority'] })}>
                                    <MenuItem value="high">High</MenuItem>
                                    <MenuItem value="medium">Medium</MenuItem>
                                    <MenuItem value="low">Low</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField fullWidth label="Deadline" type="date" value={taskForm.deadline ? taskForm.deadline.slice(0, 10) : ''} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} InputLabelProps={{ shrink: true }} />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveTask} disabled={taskSaving} variant="contained">Save</Button>
                        </DialogActions>
                    </Dialog>
                </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 2 }}>
                {/* Weekly Activity & Current Experiments */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6">Weekly Activity</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mt: 2 }}>
                                {activityCounts.map((val, i) => (
                                    <Box key={i} sx={{ textAlign: 'center' }}>
                                        <Box sx={{ width: 24, height: val * 8, bgcolor: 'primary.main', borderRadius: 1, mb: 0.5 }} />
                                        <Typography variant="caption">{daysOfWeek[i]}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Current Experiments</Typography>
                            {experiments.filter((e: any) => e.progress !== 100).map((exp: any, i: number) => (
                                <Box key={i} sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2">{exp.name}</Typography>
                                    <LinearProgress variant="determinate" value={exp.progress || 0} sx={{ height: 8, borderRadius: 2, my: 1 }} color={exp.progress === 100 ? 'success' : 'primary'} />
                                    <Typography variant="caption">{exp.progress || 0}%</Typography>
                                    <Divider sx={{ my: 1 }} />
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
                {/* Recent Activity */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Recent Activity</Typography>
                            <List>
                                {recentActivity.map((a, i) => (
                                    <ListItem key={i}>
                                        <ListItemText primary={a.text} secondary={new Date(a.time).toLocaleString()} />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProjectDashboard; 