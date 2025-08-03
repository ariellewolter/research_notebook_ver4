import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Chip, LinearProgress, List, ListItem, ListItemText, Divider, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, FormControlLabel, Checkbox } from '@mui/material';
import { projectsApi, protocolsApi, notesApi, literatureNotesApi, linksApi, recipesApi, pdfsApi } from '../services/api';
import Autocomplete from '@mui/material/Autocomplete';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';

const statusOptions = [
    { value: 'planned', label: 'Planned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
];

interface ExecutionStepCompletionViewProps {
    execution: any;
    steps: any[];
    protocolId: string;
    onExecutionUpdated: () => void;
}

function ExecutionStepCompletionView({ execution, steps, protocolId, onExecutionUpdated }: ExecutionStepCompletionViewProps) {
    const [editing, setEditing] = React.useState(false);
    const [completedSteps, setCompletedSteps] = React.useState(execution.completedSteps || []);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        setCompletedSteps(execution.completedSteps || []);
    }, [execution.completedSteps]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await protocolsApi.updateExecution(protocolId, execution.id, { completedSteps });
            setEditing(false);
            onExecutionUpdated();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
                Execution: {execution.status} • {execution.startDate ? new Date(execution.startDate).toLocaleString() : 'No start date'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                {steps.map((step) => (
                    <FormControlLabel
                        key={step.id}
                        control={
                            <Checkbox
                                checked={completedSteps.includes(step.id)}
                                disabled={!editing}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setCompletedSteps(prev => {
                                        if (checked) return [...prev, step.id];
                                        return prev.filter(id => id !== step.id);
                                    });
                                }}
                            />
                        }
                        label={`Step ${step.stepNumber}: ${step.title}`}
                    />
                ))}
            </Box>
            {editing ? (
                <Box sx={{ mt: 1 }}>
                    <Button onClick={handleSave} variant="contained" size="small" disabled={saving} sx={{ mr: 1 }}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button onClick={() => setEditing(false)} size="small" disabled={saving}>Cancel</Button>
                </Box>
            ) : (
                <Button onClick={() => setEditing(true)} size="small" sx={{ mt: 1 }}>Edit</Button>
            )}
        </Box>
    );
}

const ExperimentsDashboard: React.FC = () => {
    const [experiments, setExperiments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newExperiment, setNewExperiment] = useState({
        name: '',
        hypothesis: '',
        status: 'planned',
        progress: 0,
        tags: '',
        protocolIds: [] as string[],
        noteIds: [] as string[],
        literatureNoteIds: [] as string[],
        recipeIds: [] as string[],
        pdfIds: [] as string[],
    });
    const [submitting, setSubmitting] = useState(false);
    const [selectedExperiment, setSelectedExperiment] = useState<any | null>(null);
    const [editExperiment, setEditExperiment] = useState<any | null>(null);
    const [protocols, setProtocols] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [literatureNotes, setLiteratureNotes] = useState<any[]>([]);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    // Add state for loading/creating new entities
    const [creatingProtocol, setCreatingProtocol] = useState(false);
    const [creatingNote, setCreatingNote] = useState(false);
    const [creatingLiterature, setCreatingLiterature] = useState(false);
    const [editLinkedEntity, setEditLinkedEntity] = useState<{ type: 'protocol' | 'note' | 'literature'; entity: any } | null>(null);
    const [linkedProtocols, setLinkedProtocols] = useState<any[]>([]);
    const [linkedRecipes, setLinkedRecipes] = useState<any[]>([]);
    const [linkedPDFs, setLinkedPDFs] = useState<any[]>([]);
    const [allProtocols, setAllProtocols] = useState<any[]>([]);
    const [allRecipes, setAllRecipes] = useState<any[]>([]);
    const [allPDFs, setAllPDFs] = useState<any[]>([]);
    const [creatingRecipe, setCreatingRecipe] = useState(false);
    const [creatingPDF, setCreatingPDF] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(null);
        // Fetch all projects, then all experiments for each project
        projectsApi.getAll()
            .then(async res => {
                const projects = res.data || [];
                let allExperiments: any[] = [];
                for (const project of projects) {
                    const expRes = await projectsApi.getExperiments(project.id);
                    allExperiments = allExperiments.concat(expRes.data || []);
                }
                setExperiments(allExperiments);
            })
            .catch(err => setError('Failed to load experiments'))
            .finally(() => setLoading(false));
        // Fetch all protocols, notes, literature notes (placeholder APIs)
        fetch('/api/protocols').then(r => r.json()).then(d => setProtocols(d.protocols || d)).catch(() => { });
        fetch('/api/notes').then(r => r.json()).then(d => setNotes(d.notes || d)).catch(() => { });
        fetch('/api/literatureNotes').then(r => r.json()).then(d => setLiteratureNotes(d.literatureNotes || d)).catch(() => { });
    }, []);

    // Fetch all protocols, recipes, and PDFs for linking
    useEffect(() => {
        if ((dialogOpen || selectedExperiment) && editExperiment) {
            protocolsApi.getAll().then(res => setAllProtocols(res.data || []));
            recipesApi.getAll().then(res => setAllRecipes(res.data || []));
            pdfsApi.getAll().then(res => setAllPDFs(res.data || []));
            // Fetch existing links for this experiment
            linksApi.getOutgoing('experiment', editExperiment.id).then(res => {
                setLinkedProtocols((res.data || []).filter((l: any) => l.targetType === 'protocol').map((l: any) => l.protocol));
                setLinkedRecipes((res.data || []).filter((l: any) => l.targetType === 'recipe').map((l: any) => l.recipe));
                setLinkedPDFs((res.data || []).filter((l: any) => l.targetType === 'pdf').map((l: any) => l.pdf));
            });
        }
    }, [dialogOpen, selectedExperiment, editExperiment]);

    const handleDialogOpen = () => setDialogOpen(true);
    const handleDialogClose = () => {
        setDialogOpen(false);
        setNewExperiment({ name: '', hypothesis: '', status: 'planned', progress: 0, tags: '', protocolIds: [], noteIds: [], literatureNoteIds: [], recipeIds: [], pdfIds: [] });
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewExperiment({ ...newExperiment, [e.target.name]: e.target.value });
    };

    const handleCreateExperiment = async () => {
        setSubmitting(true);
        try {
            // Find a projectId to use (e.g., from a selected project or the first project)
            const projects = await projectsApi.getAll();
            const projectId = projects.data[0]?.id;
            if (!projectId) throw new Error('No project found');
            await projectsApi.createExperiment(projectId, {
                name: newExperiment.name,
                description: newExperiment.hypothesis,
                protocolIds: newExperiment.protocolIds,
                recipeIds: newExperiment.recipeIds,
                noteIds: newExperiment.noteIds,
                pdfIds: newExperiment.pdfIds,
            });
            // Refresh experiments list
            projectsApi.getAll()
                .then(async res => {
                    const projects = res.data || [];
                    let allExperiments: any[] = [];
                    for (const project of projects) {
                        const expRes = await projectsApi.getExperiments(project.id);
                        allExperiments = allExperiments.concat(expRes.data || []);
                    }
                    setExperiments(allExperiments);
                });
            setSnackbar({ open: true, message: 'Experiment created!', severity: 'success' });
            handleDialogClose();
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to create experiment', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCardClick = (exp: any) => {
        setSelectedExperiment(exp);
        setEditExperiment({ ...exp });
    };
    const handleDetailClose = () => {
        setSelectedExperiment(null);
        setEditExperiment(null);
    };
    const handleEditFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditExperiment({ ...editExperiment, [e.target.name]: e.target.value });
    };
    const handleSaveEdit = async () => {
        if (!editExperiment) return;
        try {
            await projectsApi.updateExperiment(editExperiment.id, {
                name: editExperiment.name,
                description: editExperiment.description,
                protocolIds: editExperiment.protocolIds,
                noteIds: editExperiment.noteIds,
                literatureNoteIds: editExperiment.literatureNoteIds,
            });
            // Refresh experiments list
            projectsApi.getAll()
                .then(async res => {
                    const projects = res.data || [];
                    let allExperiments: any[] = [];
                    for (const project of projects) {
                        const expRes = await projectsApi.getExperiments(project.id);
                        allExperiments = allExperiments.concat(expRes.data || []);
                    }
                    setExperiments(allExperiments);
                });
            setSnackbar({ open: true, message: 'Experiment saved!', severity: 'success' });
            handleDetailClose();
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to save experiment', severity: 'error' });
        }
    };

    // Add inline creation logic for protocols
    const handleCreateProtocol = async (name: string) => {
        setCreatingProtocol(true);
        try {
            // Placeholder: replace with real API call
            const newProtocol = { id: Date.now().toString(), name };
            setProtocols(prev => [...prev, newProtocol]);
            setEditExperiment((prev: any) => ({ ...prev, protocolIds: [...(prev.protocolIds || []), newProtocol.id] }));
        } finally {
            setCreatingProtocol(false);
        }
    };
    // Add inline creation logic for notes
    const handleCreateNote = async (title: string) => {
        setCreatingNote(true);
        try {
            // Placeholder: replace with real API call
            const newNote = { id: Date.now().toString(), title };
            setNotes(prev => [...prev, newNote]);
            setEditExperiment((prev: any) => ({ ...prev, noteIds: [...(prev.noteIds || []), newNote.id] }));
        } finally {
            setCreatingNote(false);
        }
    };
    // Add inline creation logic for literature notes
    const handleCreateLiterature = async (title: string) => {
        setCreatingLiterature(true);
        try {
            // Placeholder: replace with real API call
            const newLit = { id: Date.now().toString(), title };
            setLiteratureNotes(prev => [...prev, newLit]);
            setEditExperiment((prev: any) => ({ ...prev, literatureNoteIds: [...(prev.literatureNoteIds || []), newLit.id] }));
        } finally {
            setCreatingLiterature(false);
        }
    };

    // Handler to open edit dialog for a linked entity
    const handleEditLinkedEntity = (type: 'protocol' | 'note' | 'literature', entity: any) => {
        setEditLinkedEntity({ type, entity });
    };
    // Handler to save edits to a linked entity
    const handleSaveLinkedEntity = async () => {
        if (!editLinkedEntity) return;
        const { type, entity } = editLinkedEntity;
        try {
            if (type === 'protocol') {
                await protocolsApi.update(entity.id, { name: entity.name });
                setProtocols(prev => prev.map(p => p.id === entity.id ? { ...p, name: entity.name } : p));
            } else if (type === 'note') {
                await notesApi.update(entity.id, { title: entity.title });
                setNotes(prev => prev.map(n => n.id === entity.id ? { ...n, title: entity.title } : n));
            } else if (type === 'literature') {
                await literatureNotesApi.update(entity.id, { title: entity.title });
                setLiteratureNotes(prev => prev.map(l => l.id === entity.id ? { ...l, title: entity.title } : l));
            }
            setSnackbar({ open: true, message: 'Entity updated!', severity: 'success' });
            setEditLinkedEntity(null);
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to update entity', severity: 'error' });
        }
    };

    const handleLinkProtocol = async (protocolId: string) => {
        if (!editExperiment) return;
        await linksApi.create({ sourceType: 'experiment', sourceId: editExperiment.id, targetType: 'protocol', targetId: protocolId });
        const protocol = allProtocols.find((p: any) => p.id === protocolId);
        setLinkedProtocols(prev => [...prev, protocol]);
    };
    const handleUnlinkProtocol = async (protocolId: string) => {
        if (!editExperiment) return;
        const links = await linksApi.getOutgoing('experiment', editExperiment.id);
        const link = (links.data || []).find((l: any) => l.targetType === 'protocol' && l.targetId === protocolId);
        if (link) {
            await linksApi.delete(link.id);
            setLinkedProtocols(prev => prev.filter((p: any) => p.id !== protocolId));
        }
    };
    const handleLinkRecipe = async (recipeId: string) => {
        if (!editExperiment) return;
        await linksApi.create({ sourceType: 'experiment', sourceId: editExperiment.id, targetType: 'recipe', targetId: recipeId });
        const recipe = allRecipes.find((r: any) => r.id === recipeId);
        setLinkedRecipes(prev => [...prev, recipe]);
    };
    const handleUnlinkRecipe = async (recipeId: string) => {
        if (!editExperiment) return;
        const links = await linksApi.getOutgoing('experiment', editExperiment.id);
        const link = (links.data || []).find((l: any) => l.targetType === 'recipe' && l.targetId === recipeId);
        if (link) {
            await linksApi.delete(link.id);
            setLinkedRecipes(prev => prev.filter((r: any) => r.id !== recipeId));
        }
    };
    const handleCreateRecipe = async (name: string) => {
        setCreatingRecipe(true);
        try {
            const res = await recipesApi.create({ name });
            setAllRecipes(prev => [...prev, res.data]);
            if (editExperiment) await handleLinkRecipe(res.data.id);
        } finally {
            setCreatingRecipe(false);
        }
    };
    const handleLinkPDF = async (pdfId: string) => {
        if (!editExperiment) return;
        await linksApi.create({ sourceType: 'experiment', sourceId: editExperiment.id, targetType: 'pdf', targetId: pdfId });
        const pdf = allPDFs.find((p: any) => p.id === pdfId);
        setLinkedPDFs(prev => [...prev, pdf]);
    };
    const handleUnlinkPDF = async (pdfId: string) => {
        if (!editExperiment) return;
        const links = await linksApi.getOutgoing('experiment', editExperiment.id);
        const link = (links.data || []).find((l: any) => l.targetType === 'pdf' && l.targetId === pdfId);
        if (link) {
            await linksApi.delete(link.id);
            setLinkedPDFs(prev => prev.filter((p: any) => p.id !== pdfId));
        }
    };
    const handleCreatePDF = async (title: string) => {
        setCreatingPDF(true);
        try {
            const res = await pdfsApi.create({ title });
            setAllPDFs(prev => [...prev, res.data]);
            if (editExperiment) await handleLinkPDF(res.data.id);
        } finally {
            setCreatingPDF(false);
        }
    };

    if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    if (error) return <Box sx={{ p: 4 }}><Typography color="error">{error}</Typography></Box>;

    // Overview metrics
    const totalExperiments = experiments.length;
    const completed = experiments.filter(e => e.status === 'completed' || e.progress === 100).length;
    const inProgress = experiments.filter(e => e.status === 'in_progress' || (e.progress > 0 && e.progress < 100)).length;
    const successRate = totalExperiments > 0 ? Math.round((completed / totalExperiments) * 100) : 0;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h4">Experiments Dashboard</Typography>
                <Button variant="contained" color="primary" onClick={handleDialogOpen}>New Experiment</Button>
            </Box>
            <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>New Experiment</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Name"
                        name="name"
                        fullWidth
                        value={newExperiment.name}
                        onChange={handleFieldChange}
                    />
                    <TextField
                        margin="dense"
                        label="Hypothesis"
                        name="hypothesis"
                        fullWidth
                        value={newExperiment.hypothesis}
                        onChange={handleFieldChange}
                    />
                    <TextField
                        margin="dense"
                        label="Status"
                        name="status"
                        select
                        fullWidth
                        value={newExperiment.status}
                        onChange={handleFieldChange}
                    >
                        {statusOptions.map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        margin="dense"
                        label="Progress (%)"
                        name="progress"
                        type="number"
                        fullWidth
                        value={newExperiment.progress}
                        onChange={handleFieldChange}
                        inputProps={{ min: 0, max: 100 }}
                    />
                    <TextField
                        margin="dense"
                        label="Tags (comma separated)"
                        name="tags"
                        fullWidth
                        value={newExperiment.tags}
                        onChange={handleFieldChange}
                    />
                    <Autocomplete
                        multiple
                        options={allProtocols}
                        getOptionLabel={option => option.name}
                        value={allProtocols.filter(p => newExperiment.protocolIds?.includes(p.id))}
                        onChange={(event, value) => setNewExperiment({ ...newExperiment, protocolIds: value.map(v => v.id) })}
                        renderInput={params => <TextField {...params} label="Linked Protocols" margin="dense" fullWidth />}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip label={option.name} {...getTagProps({ index })} key={option.id} />
                            ))
                        }
                        loading={false}
                        filterOptions={(options, state) => {
                            const filtered = options.filter(opt => opt.name.toLowerCase().includes(state.inputValue.toLowerCase()));
                            return filtered;
                        }}
                        sx={{ my: 1 }}
                    />
                    <Autocomplete
                        multiple
                        options={allRecipes}
                        getOptionLabel={option => option.name}
                        value={allRecipes.filter(r => newExperiment.recipeIds?.includes(r.id))}
                        onChange={(event, value, reason, details) => {
                            if (details && details.option && details.option.id === '__new__') {
                                handleCreateRecipe(details.option.name.replace(/^Add \"|\" as new Recipe$/g, ''));
                            } else {
                                setNewExperiment({ ...newExperiment, recipeIds: value.map(v => v.id) });
                            }
                        }}
                        renderInput={params => <TextField {...params} label="Linked Recipes" margin="dense" fullWidth />}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip label={option.name} {...getTagProps({ index })} key={option.id} />
                            ))
                        }
                        loading={creatingRecipe}
                        filterOptions={(options, state) => {
                            const filtered = options.filter(opt => opt.name.toLowerCase().includes(state.inputValue.toLowerCase()));
                            if (state.inputValue && !options.some(opt => opt.name.toLowerCase() === state.inputValue.toLowerCase())) {
                                filtered.push({ id: '__new__', name: `Add "${state.inputValue}" as new Recipe` });
                            }
                            return filtered;
                        }}
                        sx={{ my: 1 }}
                    />
                    <Autocomplete
                        multiple
                        options={notes}
                        getOptionLabel={option => option.title}
                        value={notes.filter(n => newExperiment.noteIds?.includes(n.id))}
                        onChange={(event, value, reason, details) => {
                            if (details && details.option && details.option.id === '__new__') {
                                handleCreateNote(details.option.title.replace(/^Add \"|\" as new Note$/g, ''));
                            } else {
                                setNewExperiment({ ...newExperiment, noteIds: value.map(v => v.id) });
                            }
                        }}
                        renderInput={params => <TextField {...params} label="Linked Notes" margin="dense" fullWidth />}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip label={option.title} {...getTagProps({ index })} key={option.id} />
                            ))
                        }
                        loading={creatingNote}
                        filterOptions={(options, state) => {
                            const filtered = options.filter(opt => opt.title.toLowerCase().includes(state.inputValue.toLowerCase()));
                            if (state.inputValue && !options.some(opt => opt.title.toLowerCase() === state.inputValue.toLowerCase())) {
                                filtered.push({ id: '__new__', title: `Add "${state.inputValue}" as new Note` });
                            }
                            return filtered;
                        }}
                        sx={{ my: 1 }}
                    />
                    <Autocomplete
                        multiple
                        options={allPDFs}
                        getOptionLabel={option => option.title}
                        value={allPDFs.filter(p => newExperiment.pdfIds?.includes(p.id))}
                        onChange={(event, value, reason, details) => {
                            if (details && details.option && details.option.id === '__new__') {
                                handleCreatePDF(details.option.title.replace(/^Add \"|\" as new PDF$/g, ''));
                            } else {
                                setNewExperiment({ ...newExperiment, pdfIds: value.map(v => v.id) });
                            }
                        }}
                        renderInput={params => <TextField {...params} label="Linked PDFs" margin="dense" fullWidth />}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip label={option.title} {...getTagProps({ index })} key={option.id} />
                            ))
                        }
                        loading={creatingPDF}
                        filterOptions={(options, state) => {
                            const filtered = options.filter(opt => opt.title.toLowerCase().includes(state.inputValue.toLowerCase()));
                            if (state.inputValue && !options.some(opt => opt.title.toLowerCase() === state.inputValue.toLowerCase())) {
                                filtered.push({ id: '__new__', title: `Add "${state.inputValue}" as new PDF` });
                            }
                            return filtered;
                        }}
                        sx={{ my: 1 }}
                    />
                    <Autocomplete
                        multiple
                        options={literatureNotes}
                        getOptionLabel={option => option.title}
                        value={literatureNotes.filter(l => newExperiment.literatureNoteIds?.includes(l.id))}
                        onChange={(event, value, reason, details) => {
                            if (details && details.option && details.option.id === '__new__') {
                                handleCreateLiterature(details.option.title.replace(/^Add \"|\" as new Literature Note$/g, ''));
                            } else {
                                setNewExperiment({ ...newExperiment, literatureNoteIds: value.map(v => v.id) });
                            }
                        }}
                        renderInput={params => <TextField {...params} label="Linked Literature Notes" margin="dense" fullWidth />}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip label={option.title} {...getTagProps({ index })} key={option.id} />
                            ))
                        }
                        loading={creatingLiterature}
                        filterOptions={(options, state) => {
                            const filtered = options.filter(opt => opt.title.toLowerCase().includes(state.inputValue.toLowerCase()));
                            if (state.inputValue && !options.some(opt => opt.title.toLowerCase() === state.inputValue.toLowerCase())) {
                                filtered.push({ id: '__new__', title: `Add "${state.inputValue}" as new Literature Note` });
                            }
                            return filtered;
                        }}
                        sx={{ my: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleCreateExperiment} variant="contained" color="primary" disabled={submitting || !newExperiment.name}>Create</Button>
                </DialogActions>
            </Dialog>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Total Experiments</Typography>
                            <Typography variant="h4">{totalExperiments}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Completed</Typography>
                            <Typography variant="h4">{completed}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">In Progress</Typography>
                            <Typography variant="h4">{inProgress}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Experiments</Typography>
                <Grid container spacing={2}>
                    {experiments.map((exp, i) => (
                        <Grid item xs={12} md={6} key={exp.id || i}>
                            <Card sx={{ mb: 2, cursor: 'pointer' }} onClick={() => handleCardClick(exp)}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="h6">{exp.name}</Typography>
                                        <Chip label={exp.status || (exp.progress === 100 ? 'completed' : exp.progress > 0 ? 'in_progress' : 'planned')} color={exp.progress === 100 ? 'success' : exp.progress > 0 ? 'primary' : 'info'} size="small" />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{exp.project?.name || ''}</Typography>
                                    <LinearProgress variant="determinate" value={exp.progress || (exp.status === 'completed' ? 100 : exp.status === 'in_progress' ? 50 : 0)} sx={{ height: 8, borderRadius: 2, my: 1 }} color={exp.progress === 100 ? 'success' : exp.progress > 0 ? 'primary' : 'info'} />
                                    <Typography variant="caption">Progress: {exp.progress || (exp.status === 'completed' ? 100 : exp.status === 'in_progress' ? 50 : 0)}%</Typography>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Hypothesis: {exp.hypothesis || 'No hypothesis provided.'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                        {/* Placeholder tags */}
                                        {(Array.isArray(exp.tags) ? exp.tags : (exp.tags || '').split(',')).map((tag: string, idx: number) => (
                                            <Chip key={idx} label={tag} size="small" />
                                        ))}
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                        {protocols.filter(p => exp.protocolIds?.includes(p.id)).map(p => (
                                            <Chip key={p.id} label={p.name} color="secondary" size="small" />
                                        ))}
                                        {notes.filter(n => exp.noteIds?.includes(n.id)).map(n => (
                                            <Chip key={n.id} label={n.title} color="info" size="small" />
                                        ))}
                                        {literatureNotes.filter(l => exp.literatureNoteIds?.includes(l.id)).map(l => (
                                            <Chip key={l.id} label={l.title} color="success" size="small" />
                                        ))}
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="caption" color="text.secondary">Entities</Typography>
                                            <Typography variant="h6">3</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="caption" color="text.secondary">Files</Typography>
                                            <Typography variant="h6">2</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="caption" color="text.secondary">Protocols</Typography>
                                            <Typography variant="h6">1</Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    {experiments.length === 0 && <Typography>No experiments found.</Typography>}
                </Grid>
            </Box>
            <Dialog open={!!selectedExperiment} onClose={handleDetailClose} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Experiment</DialogTitle>
                <DialogContent>
                    {editExperiment && (
                        <Box>
                            <TextField
                                margin="dense"
                                label="Name"
                                name="name"
                                fullWidth
                                value={editExperiment.name}
                                onChange={handleEditFieldChange}
                            />
                            <TextField
                                margin="dense"
                                label="Hypothesis"
                                name="hypothesis"
                                fullWidth
                                value={editExperiment.hypothesis}
                                onChange={handleEditFieldChange}
                            />
                            <TextField
                                margin="dense"
                                label="Status"
                                name="status"
                                select
                                fullWidth
                                value={editExperiment.status}
                                onChange={handleEditFieldChange}
                            >
                                {statusOptions.map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                margin="dense"
                                label="Progress (%)"
                                name="progress"
                                type="number"
                                fullWidth
                                value={editExperiment.progress}
                                onChange={handleEditFieldChange}
                                inputProps={{ min: 0, max: 100 }}
                            />
                            <TextField
                                margin="dense"
                                label="Tags (comma separated)"
                                name="tags"
                                fullWidth
                                value={Array.isArray(editExperiment.tags) ? editExperiment.tags.join(', ') : editExperiment.tags}
                                onChange={handleEditFieldChange}
                            />
                            <Autocomplete
                                multiple
                                options={protocols}
                                getOptionLabel={option => option.name}
                                value={protocols.filter(p => editExperiment?.protocolIds?.includes(p.id))}
                                onChange={(event, value, reason, details) => {
                                    if (details && details.option && details.option.id === '__new__') {
                                        handleCreateProtocol(details.option.name.replace(/^Add \"|\" as new Protocol$/g, ''));
                                    } else {
                                        setEditExperiment({ ...editExperiment, protocolIds: value.map(v => v.id) });
                                    }
                                }}
                                renderInput={params => <TextField {...params} label="Linked Protocols" margin="dense" fullWidth />}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <span key={option.id} style={{ display: 'flex', alignItems: 'center', marginRight: 4 }}>
                                            <Chip label={option.name} {...getTagProps({ index })} />
                                            <IconButton size="small" onClick={e => { e.stopPropagation(); handleEditLinkedEntity('protocol', option); }}><EditIcon fontSize="small" /></IconButton>
                                        </span>
                                    ))
                                }
                                loading={creatingProtocol}
                                filterOptions={(options, state) => {
                                    const filtered = options.filter(opt => opt.name.toLowerCase().includes(state.inputValue.toLowerCase()));
                                    if (state.inputValue && !options.some(opt => opt.name.toLowerCase() === state.inputValue.toLowerCase())) {
                                        filtered.push({ id: '__new__', name: `Add "${state.inputValue}" as new Protocol` });
                                    }
                                    return filtered;
                                }}
                                sx={{ my: 1 }}
                            />
                            <Autocomplete
                                multiple
                                options={notes}
                                getOptionLabel={option => option.title}
                                value={notes.filter(n => editExperiment?.noteIds?.includes(n.id))}
                                onChange={(event, value, reason, details) => {
                                    if (details && details.option && details.option.id === '__new__') {
                                        handleCreateNote(details.option.title.replace(/^Add \"|\" as new Note$/g, ''));
                                    } else {
                                        setEditExperiment({ ...editExperiment, noteIds: value.map(v => v.id) });
                                    }
                                }}
                                renderInput={params => <TextField {...params} label="Linked Notes" margin="dense" fullWidth />}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <span key={option.id} style={{ display: 'flex', alignItems: 'center', marginRight: 4 }}>
                                            <Chip label={option.title} {...getTagProps({ index })} />
                                            <IconButton size="small" onClick={e => { e.stopPropagation(); handleEditLinkedEntity('note', option); }}><EditIcon fontSize="small" /></IconButton>
                                        </span>
                                    ))
                                }
                                loading={creatingNote}
                                filterOptions={(options, state) => {
                                    const filtered = options.filter(opt => opt.title.toLowerCase().includes(state.inputValue.toLowerCase()));
                                    if (state.inputValue && !options.some(opt => opt.title.toLowerCase() === state.inputValue.toLowerCase())) {
                                        filtered.push({ id: '__new__', title: `Add "${state.inputValue}" as new Note` });
                                    }
                                    return filtered;
                                }}
                                sx={{ my: 1 }}
                            />
                            <Autocomplete
                                multiple
                                options={literatureNotes}
                                getOptionLabel={option => option.title}
                                value={literatureNotes.filter(l => editExperiment?.literatureNoteIds?.includes(l.id))}
                                onChange={(event, value, reason, details) => {
                                    if (details && details.option && details.option.id === '__new__') {
                                        handleCreateLiterature(details.option.title.replace(/^Add \"|\" as new Literature Note$/g, ''));
                                    } else {
                                        setEditExperiment({ ...editExperiment, literatureNoteIds: value.map(v => v.id) });
                                    }
                                }}
                                renderInput={params => <TextField {...params} label="Linked Literature Notes" margin="dense" fullWidth />}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <span key={option.id} style={{ display: 'flex', alignItems: 'center', marginRight: 4 }}>
                                            <Chip label={option.title} {...getTagProps({ index })} />
                                            <IconButton size="small" onClick={e => { e.stopPropagation(); handleEditLinkedEntity('literature', option); }}><EditIcon fontSize="small" /></IconButton>
                                        </span>
                                    ))
                                }
                                loading={creatingLiterature}
                                filterOptions={(options, state) => {
                                    const filtered = options.filter(opt => opt.title.toLowerCase().includes(state.inputValue.toLowerCase()));
                                    if (state.inputValue && !options.some(opt => opt.title.toLowerCase() === state.inputValue.toLowerCase())) {
                                        filtered.push({ id: '__new__', title: `Add "${state.inputValue}" as new Literature Note` });
                                    }
                                    return filtered;
                                }}
                                sx={{ my: 1 }}
                            />
                            <Box sx={{ mt: 3, mb: 2 }}>
                                <Typography variant="h6" sx={{ mb: 1 }}>Linked Protocols</Typography>
                                <Autocomplete
                                    multiple
                                    options={allProtocols}
                                    getOptionLabel={option => option.name}
                                    value={linkedProtocols}
                                    onChange={(_, value, reason, details) => {
                                        if (details && details.option && details.option.id === '__new__') {
                                            // Optionally support inline creation for protocols
                                        } else {
                                            value.forEach((p: any) => {
                                                if (!linkedProtocols.some((lp: any) => lp.id === p.id)) handleLinkProtocol(p.id);
                                            });
                                            linkedProtocols.forEach((lp: any) => {
                                                if (!value.some((p: any) => p.id === lp.id)) handleUnlinkProtocol(lp.id);
                                            });
                                        }
                                    }}
                                    renderInput={params => <TextField {...params} label="Linked Protocols" margin="dense" fullWidth />}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip label={option.name} {...getTagProps({ index })} key={option.id} onDelete={() => handleUnlinkProtocol(option.id)} />
                                        ))
                                    }
                                    loading={false}
                                    filterOptions={(options, state) => {
                                        const filtered = options.filter(opt => opt.name.toLowerCase().includes(state.inputValue.toLowerCase()));
                                        return filtered;
                                    }}
                                    sx={{ my: 1 }}
                                />
                                <Typography variant="h6" sx={{ mb: 1 }}>Linked Recipes</Typography>
                                <Autocomplete
                                    multiple
                                    options={allRecipes}
                                    getOptionLabel={option => option.name}
                                    value={linkedRecipes}
                                    onChange={(_, value, reason, details) => {
                                        if (details && details.option && details.option.id === '__new__') {
                                            handleCreateRecipe(details.option.name.replace(/^Add \"|\" as new Recipe$/g, ''));
                                        } else {
                                            value.forEach((r: any) => {
                                                if (!linkedRecipes.some((lr: any) => lr.id === r.id)) handleLinkRecipe(r.id);
                                            });
                                            linkedRecipes.forEach((lr: any) => {
                                                if (!value.some((r: any) => r.id === lr.id)) handleUnlinkRecipe(lr.id);
                                            });
                                        }
                                    }}
                                    renderInput={params => <TextField {...params} label="Linked Recipes" margin="dense" fullWidth />}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip label={option.name} {...getTagProps({ index })} key={option.id} onDelete={() => handleUnlinkRecipe(option.id)} />
                                        ))
                                    }
                                    loading={creatingRecipe}
                                    filterOptions={(options, state) => {
                                        const filtered = options.filter(opt => opt.name.toLowerCase().includes(state.inputValue.toLowerCase()));
                                        if (state.inputValue && !options.some(opt => opt.name.toLowerCase() === state.inputValue.toLowerCase())) {
                                            filtered.push({ id: '__new__', name: `Add "${state.inputValue}" as new Recipe` });
                                        }
                                        return filtered;
                                    }}
                                    sx={{ my: 1 }}
                                />
                                <Typography variant="h6" sx={{ mb: 1 }}>Linked PDFs</Typography>
                                <Autocomplete
                                    multiple
                                    options={allPDFs}
                                    getOptionLabel={option => option.title}
                                    value={linkedPDFs}
                                    onChange={(_, value, reason, details) => {
                                        if (details && details.option && details.option.id === '__new__') {
                                            handleCreatePDF(details.option.title.replace(/^Add \"|\" as new PDF$/g, ''));
                                        } else {
                                            value.forEach((p: any) => {
                                                if (!linkedPDFs.some((lp: any) => lp.id === p.id)) handleLinkPDF(p.id);
                                            });
                                            linkedPDFs.forEach((lp: any) => {
                                                if (!value.some((p: any) => p.id === lp.id)) handleUnlinkPDF(lp.id);
                                            });
                                        }
                                    }}
                                    renderInput={params => <TextField {...params} label="Linked PDFs" margin="dense" fullWidth />}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip label={option.title} {...getTagProps({ index })} key={option.id} onDelete={() => handleUnlinkPDF(option.id)} />
                                        ))
                                    }
                                    loading={creatingPDF}
                                    filterOptions={(options, state) => {
                                        const filtered = options.filter(opt => opt.title.toLowerCase().includes(state.inputValue.toLowerCase()));
                                        if (state.inputValue && !options.some(opt => opt.title.toLowerCase() === state.inputValue.toLowerCase())) {
                                            filtered.push({ id: '__new__', title: `Add "${state.inputValue}" as new PDF` });
                                        }
                                        return filtered;
                                    }}
                                    sx={{ my: 1 }}
                                />
                            </Box>
                            {editExperiment && (
                                <Box sx={{ mt: 3, mb: 2 }}>
                                    <Typography variant="h6" sx={{ mb: 1 }}>Protocol Executions</Typography>
                                    <ExperimentExecutionsView experimentId={editExperiment.id} />
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDetailClose}>Cancel</Button>
                    <Button onClick={handleSaveEdit} variant="contained" color="primary" disabled={!editExperiment?.name}>Save</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={!!editLinkedEntity} onClose={() => setEditLinkedEntity(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Edit {editLinkedEntity?.type === 'protocol' ? 'Protocol' : editLinkedEntity?.type === 'note' ? 'Note' : 'Literature Note'}</DialogTitle>
                <DialogContent>
                    {editLinkedEntity && (
                        <TextField
                            autoFocus
                            margin="dense"
                            label={editLinkedEntity.type === 'protocol' ? 'Name' : 'Title'}
                            fullWidth
                            value={editLinkedEntity.entity.name || editLinkedEntity.entity.title || ''}
                            onChange={e => setEditLinkedEntity({ ...editLinkedEntity, entity: { ...editLinkedEntity.entity, [editLinkedEntity.type === 'protocol' ? 'name' : 'title']: e.target.value } })}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditLinkedEntity(null)}>Cancel</Button>
                    <Button onClick={handleSaveLinkedEntity} variant="contained" color="primary" disabled={!editLinkedEntity?.entity.name && !editLinkedEntity?.entity.title}>Save</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

function ExperimentExecutionsView({ experimentId }) {
    const [executions, setExecutions] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {
        setLoading(true);
        import('../services/api').then(({ projectsApi }) => {
            projectsApi.getExperimentExecutions(experimentId).then(res => {
                setExecutions(res.data.executions || []);
                setLoading(false);
            });
        });
    }, [experimentId]);
    if (loading) return <Typography>Loading executions...</Typography>;
    if (!executions.length) return <Typography>No protocol executions found for this experiment.</Typography>;
    return (
        <Box>
            {executions.map(exec => (
                <ExecutionStepCompletionView
                    key={exec.id}
                    execution={exec}
                    steps={exec.protocol.steps}
                    protocolId={exec.protocolId}
                    onExecutionUpdated={() => {
                        import('../services/api').then(({ projectsApi }) => {
                            projectsApi.getExperimentExecutions(experimentId).then(res => {
                                setExecutions(res.data.executions || []);
                            });
                        });
                    }}
                />
            ))}
        </Box>
    );
}

export default ExperimentsDashboard; 