import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getNotes } from '../services/api';
import { colorPalettes, NOTE_TYPE_TO_PALETTE_ROLE } from '../services/colorPalettes';
import { useThemePalette } from '../services/ThemePaletteContext';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { projectsApi } from '../services/api';

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

const Calendar: React.FC = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [palette, setPalette] = useState<string>(getInitialPalette());
    const [typeColorMap, setTypeColorMap] = useState<Record<string, string>>({});
    const { palette: themePalette } = useThemePalette();
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [protocols, setProtocols] = useState<any[]>([]);
    const [experiments, setExperiments] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [newEvent, setNewEvent] = useState({
        title: '',
        date: '',
        type: 'daily',
        projectId: '',
        protocolId: '',
        experimentId: '',
        noteId: '',
    });

    const handleOpenAddDialog = () => setAddDialogOpen(true);
    const handleCloseAddDialog = () => setAddDialogOpen(false);
    const handleNewEventChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
    };
    const handleAddEvent = () => {
        setEvents([
            ...events,
            {
                id: `new-${Date.now()}`,
                title: newEvent.title,
                start: newEvent.date,
                allDay: true,
                backgroundColor: typeColorMap[newEvent.type] || themePalette.background,
                borderColor: typeColorMap[newEvent.type] || themePalette.background,
            },
        ]);
        setAddDialogOpen(false);
        setNewEvent({ title: '', date: '', type: 'daily', projectId: '', protocolId: '', experimentId: '', noteId: '' });
    };

    useEffect(() => {
        // Fetch notes and map to FullCalendar events
        getNotes()
            .then((data) => {
                if (data && data.notes) {
                    const types = getUniqueTypes(data.notes);
                    // Map each type to a palette role color
                    const map: Record<string, string> = {};
                    types.forEach((type) => {
                        const role = NOTE_TYPE_TO_PALETTE_ROLE[type] || 'background';
                        map[type] = themePalette[role];
                    });
                    setTypeColorMap(map);
                    setEvents(
                        data.notes.map((note: any) => ({
                            id: note.id,
                            title: note.title || note.content || 'Note',
                            start: note.date,
                            allDay: true,
                            backgroundColor: map[note.type || 'daily'],
                            borderColor: map[note.type || 'daily'],
                        }))
                    );
                }
            })
            .catch((err) => {
                // Optionally handle error
            });
    }, [palette]);

    useEffect(() => {
        if (addDialogOpen) {
            projectsApi.getAll().then(res => setProjects(res.data.projects || res.data || []));
            // For protocols and experiments, you may need to adjust the API call as per your backend
            // Here, we assume you have similar API methods
            // Replace with actual API calls if different
            fetch('/api/protocols').then(r => r.json()).then(data => setProtocols(data.protocols || data || []));
            fetch('/api/experiments').then(r => r.json()).then(data => setExperiments(data.experiments || data || []));
            getNotes().then(data => setNotes(data.notes || []));
        }
    }, [addDialogOpen]);

    const handlePaletteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPalette(e.target.value);
        localStorage.setItem('calendarPalette', e.target.value);
    };

    return (
        <div style={{ width: '100%', height: '100%', minHeight: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <label htmlFor="palette-select" style={{ marginRight: 8 }}>Color Palette:</label>
                    <select id="palette-select" value={palette} onChange={handlePaletteChange}>
                        {getPaletteNames().map(name => (
                            <option key={name} value={name}>{name.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())}</option>
                        ))}
                    </select>
                </div>
                <IconButton color="primary" onClick={handleOpenAddDialog} aria-label="Add Event">
                    <AddIcon />
                </IconButton>
            </div>
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={events}
                height="auto"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth',
                }}
            />
            <Dialog open={addDialogOpen} onClose={handleCloseAddDialog}>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Title"
                        name="title"
                        value={newEvent.title}
                        onChange={handleNewEventChange}
                        fullWidth
                    />
                    <TextField
                        margin="dense"
                        label="Date"
                        name="date"
                        type="date"
                        value={newEvent.date}
                        onChange={handleNewEventChange}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        margin="dense"
                        label="Type"
                        name="type"
                        select
                        value={newEvent.type}
                        onChange={handleNewEventChange}
                        fullWidth
                    >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="experiment">Experiment</MenuItem>
                        <MenuItem value="literature">Literature</MenuItem>
                    </TextField>
                    <TextField
                        margin="dense"
                        label="Project"
                        name="projectId"
                        select
                        value={newEvent.projectId}
                        onChange={handleNewEventChange}
                        fullWidth
                    >
                        <MenuItem value="">None</MenuItem>
                        {projects.map((project: any) => (
                            <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        margin="dense"
                        label="Protocol"
                        name="protocolId"
                        select
                        value={newEvent.protocolId}
                        onChange={handleNewEventChange}
                        fullWidth
                    >
                        <MenuItem value="">None</MenuItem>
                        {protocols.map((protocol: any) => (
                            <MenuItem key={protocol.id} value={protocol.id}>{protocol.name}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        margin="dense"
                        label="Experiment"
                        name="experimentId"
                        select
                        value={newEvent.experimentId}
                        onChange={handleNewEventChange}
                        fullWidth
                    >
                        <MenuItem value="">None</MenuItem>
                        {experiments.map((experiment: any) => (
                            <MenuItem key={experiment.id} value={experiment.id}>{experiment.name}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        margin="dense"
                        label="Note"
                        name="noteId"
                        select
                        value={newEvent.noteId}
                        onChange={handleNewEventChange}
                        fullWidth
                    >
                        <MenuItem value="">None</MenuItem>
                        {notes.map((note: any) => (
                            <MenuItem key={note.id} value={note.id}>{note.title}</MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAddDialog}>Cancel</Button>
                    <Button onClick={handleAddEvent} variant="contained" color="primary" disabled={!newEvent.title || !newEvent.date}>Add</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Calendar; 