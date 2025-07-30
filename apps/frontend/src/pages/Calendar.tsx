import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getNotes } from '../services/api';
import { colorPalettes, NOTE_TYPE_TO_PALETTE_ROLE } from '../services/colorPalettes';
import { useThemePalette } from '../services/ThemePaletteContext';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, 
    IconButton, Box, Typography, FormControl, InputLabel, Select, Chip, Grid,
    Card, CardContent, CardActions, Divider, Alert, Snackbar, SelectChangeEvent
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Event as EventIcon,
    Science as ScienceIcon,
    Assignment as AssignmentIcon,
    Note as NoteIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import { projectsApi, protocolsApi, tasksApi, notesApi } from '../services/api';

const getUniqueTypes = (notes: any[]) => {
    const types = notes.map(n => n.type || 'default');
    return Array.from(new Set(types));
};

const getPaletteNames = () => Object.keys(colorPalettes);

const getInitialPalette = (): string => {
    const saved = localStorage.getItem('calendarPalette');
    const names = getPaletteNames();
    return (saved && names.includes(saved)) ? saved : names[0];
};

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end?: string;
    allDay: boolean;
    backgroundColor: string;
    borderColor: string;
    type: string;
    entityId?: string;
    entityType?: string;
    description?: string;
    projectId?: string;
    protocolId?: string;
    experimentId?: string;
    taskId?: string;
    noteId?: string;
}

const Calendar: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [palette, setPalette] = useState<string>(getInitialPalette());
    const [typeColorMap, setTypeColorMap] = useState<Record<string, string>>({});
    const { palette: themePalette } = useThemePalette();
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [protocols, setProtocols] = useState<any[]>([]);
    const [experiments, setExperiments] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });
    
    const [newEvent, setNewEvent] = useState({
        title: '',
        start: '',
        end: '',
        type: 'event',
        description: '',
        projectId: '',
        protocolId: '',
        experimentId: '',
        taskId: '',
        noteId: '',
    });

    const handleOpenAddDialog = () => {
        setNewEvent({
            title: '',
            start: '',
            end: '',
            type: 'event',
            description: '',
            projectId: '',
            protocolId: '',
            experimentId: '',
            taskId: '',
            noteId: '',
        });
        setAddDialogOpen(true);
    };

    const handleCloseAddDialog = () => setAddDialogOpen(false);
    const handleCloseEditDialog = () => setEditDialogOpen(false);

    const handleNewEventChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
    };

    const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleAddEvent = async () => {
        try {
            const eventData = {
                id: `new-${Date.now()}`,
                title: newEvent.title,
                start: newEvent.start,
                end: newEvent.end || newEvent.start,
                allDay: true,
                backgroundColor: typeColorMap[newEvent.type] || themePalette.background,
                borderColor: typeColorMap[newEvent.type] || themePalette.background,
                type: newEvent.type,
                description: newEvent.description,
                projectId: newEvent.projectId || undefined,
                protocolId: newEvent.protocolId || undefined,
                experimentId: newEvent.experimentId || undefined,
                taskId: newEvent.taskId || undefined,
                noteId: newEvent.noteId || undefined,
            };

            setEvents([...events, eventData]);
            setAddDialogOpen(false);
            showNotification('Event added successfully');
        } catch (error) {
            console.error('Error adding event:', error);
            showNotification('Failed to add event', 'error');
        }
    };

    const handleEditEvent = async () => {
        if (!selectedEvent) return;
        
        try {
            const updatedEvent = {
                ...selectedEvent,
                title: newEvent.title,
                start: newEvent.start,
                end: newEvent.end || newEvent.start,
                description: newEvent.description,
                projectId: newEvent.projectId || undefined,
                protocolId: newEvent.protocolId || undefined,
                experimentId: newEvent.experimentId || undefined,
                taskId: newEvent.taskId || undefined,
                noteId: newEvent.noteId || undefined,
            };

            setEvents(events.map(e => e.id === selectedEvent.id ? updatedEvent : e));
            setEditDialogOpen(false);
            setSelectedEvent(null);
            showNotification('Event updated successfully');
        } catch (error) {
            console.error('Error updating event:', error);
            showNotification('Failed to update event', 'error');
        }
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;
        
        try {
            setEvents(events.filter(e => e.id !== selectedEvent.id));
            setEditDialogOpen(false);
            setSelectedEvent(null);
            showNotification('Event deleted successfully');
        } catch (error) {
            console.error('Error deleting event:', error);
            showNotification('Failed to delete event', 'error');
        }
    };

    const handleEventClick = (info: any) => {
        const event = info.event;
        setSelectedEvent({
            id: event.id,
            title: event.title,
            start: event.startStr,
            end: event.endStr,
            allDay: event.allDay,
            backgroundColor: event.backgroundColor,
            borderColor: event.borderColor,
            type: event.extendedProps.type || 'event',
            description: event.extendedProps.description || '',
            projectId: event.extendedProps.projectId || '',
            protocolId: event.extendedProps.protocolId || '',
            experimentId: event.extendedProps.experimentId || '',
            taskId: event.extendedProps.taskId || '',
            noteId: event.extendedProps.noteId || '',
        });
        
        setNewEvent({
            title: event.title,
            start: event.startStr,
            end: event.endStr,
            type: event.extendedProps.type || 'event',
            description: event.extendedProps.description || '',
            projectId: event.extendedProps.projectId || '',
            protocolId: event.extendedProps.protocolId || '',
            experimentId: event.extendedProps.experimentId || '',
            taskId: event.extendedProps.taskId || '',
            noteId: event.extendedProps.noteId || '',
        });
        
        setEditDialogOpen(true);
    };

    const getEntityIcon = (type: string) => {
        switch (type) {
            case 'experiment': return <ScienceIcon />;
            case 'protocol': return <AssignmentIcon />;
            case 'task': return <ScheduleIcon />;
            case 'note': return <NoteIcon />;
            default: return <EventIcon />;
        }
    };

    const getEntityColor = (type: string) => {
        return typeColorMap[type] || themePalette.background;
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                
                // Fetch all entities
                const [notesRes, protocolsRes, tasksRes, projectsRes, experimentsRes] = await Promise.all([
                    notesApi.getAll(),
                    protocolsApi.getAll(),
                    tasksApi.getAll(),
                    projectsApi.getAll(),
                    projectsApi.getAllExperiments()
                ]);

                const notes = notesRes.data.notes || notesRes.data || [];
                const protocols = protocolsRes.data.protocols || protocolsRes.data || [];
                const tasks = tasksRes.data.tasks || tasksRes.data || [];
                const projects = projectsRes.data.projects || projectsRes.data || [];
                const experiments = experimentsRes.data.experiments || experimentsRes.data || [];

                setProtocols(protocols);
                setTasks(tasks);
                setExperiments(experiments);
                setNotes(notes);
                setProjects(projects);

                // Build type-color map
                const types = [
                    ...getUniqueTypes(notes),
                    'protocol',
                    'experiment',
                    'task',
                    'event'
                ];
                
                const map: Record<string, string> = {};
                types.forEach((type) => {
                    const role = NOTE_TYPE_TO_PALETTE_ROLE[type] || 'background';
                    map[type] = themePalette[role];
                });
                setTypeColorMap(map);

                // Map all entities to events
                const allEvents: CalendarEvent[] = [
                    ...notes.map((note: any) => ({
                        id: `note-${note.id}`,
                        title: note.title || note.content || 'Note',
                        start: note.date || note.createdAt,
                        allDay: true,
                        backgroundColor: map[note.type || 'daily'],
                        borderColor: map[note.type || 'daily'],
                        type: note.type || 'daily',
                        entityId: note.id,
                        entityType: 'note',
                        description: note.content,
                        noteId: note.id,
                    })),
                    ...protocols.map((protocol: any) => ({
                        id: `protocol-${protocol.id}`,
                        title: protocol.name,
                        start: protocol.createdAt,
                        allDay: true,
                        backgroundColor: map['protocol'],
                        borderColor: map['protocol'],
                        type: 'protocol',
                        entityId: protocol.id,
                        entityType: 'protocol',
                        description: protocol.description,
                        protocolId: protocol.id,
                    })),
                    ...experiments.map((exp: any) => ({
                        id: `experiment-${exp.id}`,
                        title: exp.name,
                        start: exp.createdAt,
                        allDay: true,
                        backgroundColor: map['experiment'],
                        borderColor: map['experiment'],
                        type: 'experiment',
                        entityId: exp.id,
                        entityType: 'experiment',
                        description: exp.description,
                        experimentId: exp.id,
                        projectId: exp.projectId,
                    })),
                    ...tasks.map((task: any) => ({
                        id: `task-${task.id}`,
                        title: task.title,
                        start: task.deadline || task.createdAt,
                        allDay: true,
                        backgroundColor: map['task'],
                        borderColor: map['task'],
                        type: 'task',
                        entityId: task.id,
                        entityType: 'task',
                        description: task.description,
                        taskId: task.id,
                        projectId: task.projectId,
                    })),
                ];
                
                setEvents(allEvents);
            } catch (error) {
                console.error('Error loading calendar data:', error);
                showNotification('Failed to load calendar data', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [palette, themePalette]);

    const handlePaletteChange = (e: SelectChangeEvent<string>) => {
        setPalette(e.target.value);
        localStorage.setItem('calendarPalette', e.target.value);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Typography>Loading calendar...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', height: '100%', minHeight: 600 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">Calendar</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl size="small">
                        <InputLabel>Color Palette</InputLabel>
                        <Select
                            value={palette}
                            onChange={handlePaletteChange}
                            label="Color Palette"
                        >
                            {getPaletteNames().map(name => (
                                <MenuItem key={name} value={name}>
                                    {name.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAddDialog}
                    >
                        Add Event
                    </Button>
                </Box>
            </Box>

            {/* Color Legend */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                {Object.entries(typeColorMap).map(([type, color]) => (
                    <Chip
                        key={type}
                        icon={getEntityIcon(type)}
                        label={type.charAt(0).toUpperCase() + type.slice(1)}
                        sx={{
                            backgroundColor: color,
                            color: 'white',
                            '& .MuiChip-icon': { color: 'white' }
                        }}
                    />
                ))}
            </Box>

            {/* Calendar */}
            <Box sx={{ height: 'calc(100vh - 200px)' }}>
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={events}
                    height="100%"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek',
                    }}
                    eventClick={handleEventClick}
                    eventDisplay="block"
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        meridiem: 'short'
                    }}
                />
            </Box>

            {/* Add Event Dialog */}
            <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Title"
                                name="title"
                                value={newEvent.title}
                                onChange={handleNewEventChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Start Date"
                                name="start"
                                type="date"
                                value={newEvent.start}
                                onChange={handleNewEventChange}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="End Date"
                                name="end"
                                type="date"
                                value={newEvent.end}
                                onChange={handleNewEventChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Description"
                                name="description"
                                value={newEvent.description}
                                onChange={handleNewEventChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    name="type"
                                    value={newEvent.type}
                                    onChange={handleSelectChange}
                                    label="Type"
                                >
                                    <MenuItem value="event">Event</MenuItem>
                                    <MenuItem value="experiment">Experiment</MenuItem>
                                    <MenuItem value="protocol">Protocol</MenuItem>
                                    <MenuItem value="task">Task</MenuItem>
                                    <MenuItem value="daily">Daily Note</MenuItem>
                                    <MenuItem value="literature">Literature Note</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Project</InputLabel>
                                <Select
                                    name="projectId"
                                    value={newEvent.projectId}
                                    onChange={handleSelectChange}
                                    label="Project"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {projects.map((project: any) => (
                                        <MenuItem key={project.id} value={project.id}>
                                            {project.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Protocol</InputLabel>
                                <Select
                                    name="protocolId"
                                    value={newEvent.protocolId}
                                    onChange={handleSelectChange}
                                    label="Protocol"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {protocols.map((protocol: any) => (
                                        <MenuItem key={protocol.id} value={protocol.id}>
                                            {protocol.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Experiment</InputLabel>
                                <Select
                                    name="experimentId"
                                    value={newEvent.experimentId}
                                    onChange={handleSelectChange}
                                    label="Experiment"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {experiments.map((experiment: any) => (
                                        <MenuItem key={experiment.id} value={experiment.id}>
                                            {experiment.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Task</InputLabel>
                                <Select
                                    name="taskId"
                                    value={newEvent.taskId}
                                    onChange={handleSelectChange}
                                    label="Task"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {tasks.map((task: any) => (
                                        <MenuItem key={task.id} value={task.id}>
                                            {task.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Note</InputLabel>
                                <Select
                                    name="noteId"
                                    value={newEvent.noteId}
                                    onChange={handleSelectChange}
                                    label="Note"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {notes.map((note: any) => (
                                        <MenuItem key={note.id} value={note.id}>
                                            {note.title || note.content?.substring(0, 50)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAddDialog}>Cancel</Button>
                    <Button 
                        onClick={handleAddEvent} 
                        variant="contained" 
                        disabled={!newEvent.title || !newEvent.start}
                    >
                        Add Event
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Event Dialog */}
            <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {selectedEvent && getEntityIcon(selectedEvent.type)}
                        Edit Event
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Title"
                                name="title"
                                value={newEvent.title}
                                onChange={handleNewEventChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Start Date"
                                name="start"
                                type="date"
                                value={newEvent.start}
                                onChange={handleNewEventChange}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="End Date"
                                name="end"
                                type="date"
                                value={newEvent.end}
                                onChange={handleNewEventChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Description"
                                name="description"
                                value={newEvent.description}
                                onChange={handleNewEventChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    name="type"
                                    value={newEvent.type}
                                    onChange={handleSelectChange}
                                    label="Type"
                                >
                                    <MenuItem value="event">Event</MenuItem>
                                    <MenuItem value="experiment">Experiment</MenuItem>
                                    <MenuItem value="protocol">Protocol</MenuItem>
                                    <MenuItem value="task">Task</MenuItem>
                                    <MenuItem value="daily">Daily Note</MenuItem>
                                    <MenuItem value="literature">Literature Note</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Project</InputLabel>
                                <Select
                                    name="projectId"
                                    value={newEvent.projectId}
                                    onChange={handleSelectChange}
                                    label="Project"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {projects.map((project: any) => (
                                        <MenuItem key={project.id} value={project.id}>
                                            {project.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Protocol</InputLabel>
                                <Select
                                    name="protocolId"
                                    value={newEvent.protocolId}
                                    onChange={handleSelectChange}
                                    label="Protocol"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {protocols.map((protocol: any) => (
                                        <MenuItem key={protocol.id} value={protocol.id}>
                                            {protocol.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Experiment</InputLabel>
                                <Select
                                    name="experimentId"
                                    value={newEvent.experimentId}
                                    onChange={handleSelectChange}
                                    label="Experiment"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {experiments.map((experiment: any) => (
                                        <MenuItem key={experiment.id} value={experiment.id}>
                                            {experiment.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Task</InputLabel>
                                <Select
                                    name="taskId"
                                    value={newEvent.taskId}
                                    onChange={handleSelectChange}
                                    label="Task"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {tasks.map((task: any) => (
                                        <MenuItem key={task.id} value={task.id}>
                                            {task.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Note</InputLabel>
                                <Select
                                    name="noteId"
                                    value={newEvent.noteId}
                                    onChange={handleSelectChange}
                                    label="Note"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {notes.map((note: any) => (
                                        <MenuItem key={note.id} value={note.id}>
                                            {note.title || note.content?.substring(0, 50)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleDeleteEvent} 
                        color="error" 
                        startIcon={<DeleteIcon />}
                    >
                        Delete
                    </Button>
                    <Button onClick={handleCloseEditDialog}>Cancel</Button>
                    <Button 
                        onClick={handleEditEvent} 
                        variant="contained"
                        disabled={!newEvent.title || !newEvent.start}
                    >
                        Update
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Calendar; 