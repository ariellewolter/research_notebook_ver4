import React from 'react';
import { Box, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { notesApi, projectsApi, protocolsApi, recipesApi, databaseApi } from '../services/api';

// Note Tab Component
export const NoteTab: React.FC<{ noteId: string }> = ({ noteId }) => {
    const [note, setNote] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNote();
    }, [noteId]);

    const loadNote = async () => {
        try {
            setLoading(true);
            const response = await notesApi.getById(noteId);
            setNote(response.data);
            setEditData(response.data);
        } catch (error) {
            console.error('Error loading note:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await notesApi.update(noteId, editData);
            setEditMode(false);
            await loadNote();
        } catch (error) {
            console.error('Error saving note:', error);
        }
    };

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    if (!note) {
        return <Typography>Note not found</Typography>;
    }

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">{note.title}</Typography>
                {!editMode ? (
                    <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditMode(true)}>
                        Edit
                    </Button>
                ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
                            Save
                        </Button>
                        <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => setEditMode(false)}>
                            Cancel
                        </Button>
                    </Box>
                )}
            </Box>

            {editMode ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        fullWidth
                        label="Title"
                        value={editData.title || ''}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select
                            value={editData.type || 'daily'}
                            onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                        >
                            <MenuItem value="daily">Daily</MenuItem>
                            <MenuItem value="experiment">Experiment</MenuItem>
                            <MenuItem value="literature">Literature</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        multiline
                        rows={20}
                        label="Content"
                        value={editData.content || ''}
                        onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                    />
                </Box>
            ) : (
                <Box>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                        {note.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Type: {note.type} | Created: {new Date(note.createdAt).toLocaleDateString()}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

// Project Tab Component
export const ProjectTab: React.FC<{ projectId: string }> = ({ projectId }) => {
    const [project, setProject] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProject();
    }, [projectId]);

    const loadProject = async () => {
        try {
            setLoading(true);
            const response = await projectsApi.getById(projectId);
            setProject(response.data);
            setEditData(response.data);
        } catch (error) {
            console.error('Error loading project:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await projectsApi.update(projectId, editData);
            setEditMode(false);
            await loadProject();
        } catch (error) {
            console.error('Error saving project:', error);
        }
    };

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    if (!project) {
        return <Typography>Project not found</Typography>;
    }

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">{project.name}</Typography>
                {!editMode ? (
                    <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditMode(true)}>
                        Edit
                    </Button>
                ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
                            Save
                        </Button>
                        <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => setEditMode(false)}>
                            Cancel
                        </Button>
                    </Box>
                )}
            </Box>

            {editMode ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        fullWidth
                        label="Name"
                        value={editData.name || ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Description"
                        value={editData.description || ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={editData.status || 'active'}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        >
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="archived">Archived</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            ) : (
                <Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        {project.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Status: {project.status} | Created: {new Date(project.createdAt).toLocaleDateString()}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

// Protocol Tab Component
export const ProtocolTab: React.FC<{ protocolId: string }> = ({ protocolId }) => {
    const [protocol, setProtocol] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProtocol();
    }, [protocolId]);

    const loadProtocol = async () => {
        try {
            setLoading(true);
            const response = await protocolsApi.getById(protocolId);
            setProtocol(response.data);
            setEditData(response.data);
        } catch (error) {
            console.error('Error loading protocol:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await protocolsApi.update(protocolId, editData);
            setEditMode(false);
            await loadProtocol();
        } catch (error) {
            console.error('Error saving protocol:', error);
        }
    };

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    if (!protocol) {
        return <Typography>Protocol not found</Typography>;
    }

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">{protocol.name}</Typography>
                {!editMode ? (
                    <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditMode(true)}>
                        Edit
                    </Button>
                ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
                            Save
                        </Button>
                        <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => setEditMode(false)}>
                            Cancel
                        </Button>
                    </Box>
                )}
            </Box>

            {editMode ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        fullWidth
                        label="Name"
                        value={editData.name || ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Description"
                        value={editData.description || ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={editData.category || ''}
                            onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                        >
                            <MenuItem value="molecular">Molecular</MenuItem>
                            <MenuItem value="cellular">Cellular</MenuItem>
                            <MenuItem value="biochemical">Biochemical</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            ) : (
                <Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        {protocol.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Category: {protocol.category} | Version: {protocol.version} | Created: {new Date(protocol.createdAt).toLocaleDateString()}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

// Database Entry Tab Component
export const DatabaseEntryTab: React.FC<{ entryId: string }> = ({ entryId }) => {
    const [entry, setEntry] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEntry();
    }, [entryId]);

    const loadEntry = async () => {
        try {
            setLoading(true);
            const response = await databaseApi.getById(entryId);
            setEntry(response.data);
            setEditData(response.data);
        } catch (error) {
            console.error('Error loading database entry:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await databaseApi.update(entryId, editData);
            setEditMode(false);
            await loadEntry();
        } catch (error) {
            console.error('Error saving database entry:', error);
        }
    };

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    if (!entry) {
        return <Typography>Database entry not found</Typography>;
    }

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">{entry.name}</Typography>
                {!editMode ? (
                    <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditMode(true)}>
                        Edit
                    </Button>
                ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
                            Save
                        </Button>
                        <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => setEditMode(false)}>
                            Cancel
                        </Button>
                    </Box>
                )}
            </Box>

            {editMode ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        fullWidth
                        label="Name"
                        value={editData.name || ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Description"
                        value={editData.description || ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select
                            value={editData.type || ''}
                            onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                        >
                            <MenuItem value="CHEMICAL">Chemical</MenuItem>
                            <MenuItem value="GENE">Gene</MenuItem>
                            <MenuItem value="PROTOCOL">Protocol</MenuItem>
                            <MenuItem value="ORGANISM">Organism</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            ) : (
                <Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        {entry.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Type: {entry.type} | Created: {new Date(entry.createdAt).toLocaleDateString()}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

// Legacy wrappers for backward compatibility
export const ProtocolsTabWrapper: React.FC = () => <div>Protocols List</div>;
export const RecipesTabWrapper: React.FC = () => <div>Recipes List</div>;
export const PDFsTabWrapper: React.FC = () => <div>PDFs List</div>;
export const ProjectsTabWrapper: React.FC = () => <div>Projects List</div>;
export const TablesTabWrapper: React.FC = () => <div>Tables List</div>;
export const DatabaseTabWrapper: React.FC = () => <div>Database List</div>;
export const LiteratureNotesTabWrapper: React.FC = () => <div>Literature Notes List</div>; 