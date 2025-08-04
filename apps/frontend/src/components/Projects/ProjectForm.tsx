import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    CircularProgress,
    Autocomplete,
    Chip,
} from '@mui/material';
import UniversalLinking from '../UniversalLinking/UniversalLinking';
import { useProjectLinking } from '../../hooks/useProjectLinking';
import { Project, ProjectStatus } from '../../types/project';

const PROJECT_STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
    { value: 'future', label: 'Future' },
];

interface ProjectFormProps {
    open: boolean;
    onClose: () => void;
    project?: Project | null;
    onSave: (projectData: any) => Promise<void>;
    saving: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
    open,
    onClose,
    project,
    onSave,
    saving
}) => {
    const [projectForm, setProjectForm] = useState({
        id: '',
        name: '',
        description: '',
        status: 'active' as ProjectStatus,
        startDate: '',
        lastActivity: '',
    });

    const {
        linkedNotes,
        linkedDatabaseEntries,
        linkedProtocols,
        linkedRecipes,
        linkedPDFs,
        allNotes,
        allProtocols,
        allRecipes,
        allPDFs,
        allDatabaseEntries,
        creatingNote,
        creatingDatabaseEntry,
        creatingRecipe,
        creatingPDF,
        handleLinkNote,
        handleUnlinkNote,
        handleCreateNote,
        handleLinkDatabaseEntry,
        handleUnlinkDatabaseEntry,
        handleCreateDatabaseEntry,
        handleLinkProtocol,
        handleUnlinkProtocol,
        handleLinkRecipe,
        handleUnlinkRecipe,
        handleCreateRecipe,
        handleLinkPDF,
        handleUnlinkPDF,
        handleCreatePDF,
    } = useProjectLinking(project?.id);

    useEffect(() => {
        const today = new Date().toISOString();
        if (project) {
            setProjectForm({
                id: project.id,
                name: project.name,
                description: project.description || '',
                status: project.status,
                startDate: project.startDate || '',
                lastActivity: today,
            });
        } else {
            setProjectForm({
                id: '',
                name: '',
                description: '',
                status: 'active' as ProjectStatus,
                startDate: '',
                lastActivity: today,
            });
        }
    }, [project]);

    const handleSave = async () => {
        if (!projectForm.name.trim()) {
            throw new Error('Please enter a project name');
        }

        const projectData = {
            name: projectForm.name,
            description: projectForm.description || undefined,
            status: projectForm.status,
            startDate: projectForm.startDate || null,
            lastActivity: projectForm.lastActivity || null,
        };

        await onSave(projectData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {project ? 'Edit Project' : 'Create New Project'}
            </DialogTitle>
            <DialogContent>
                <Box>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Project Name"
                            value={projectForm.name}
                            onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <UniversalLinking
                                value={projectForm.description || ''}
                                onChange={(value) => setProjectForm({ ...projectForm, description: value })}
                                multiline={true}
                                rows={3}
                                placeholder="Type your project description here. Use [[ to link to other items or / for commands..."
                            />
                        </div>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={projectForm.status}
                                label="Status"
                                onChange={e => setProjectForm({ ...projectForm, status: e.target.value as ProjectStatus })}
                            >
                                {PROJECT_STATUS_OPTIONS.map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Start Date"
                            type="date"
                            value={projectForm.startDate ? projectForm.startDate.slice(0, 10) : ''}
                            onChange={e => setProjectForm({ ...projectForm, startDate: e.target.value })}
                            sx={{ mb: 2 }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            fullWidth
                            label="Last Activity"
                            type="date"
                            value={projectForm.lastActivity ? projectForm.lastActivity.slice(0, 10) : ''}
                            onChange={e => setProjectForm({ ...projectForm, lastActivity: e.target.value })}
                            sx={{ mb: 2 }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                    {project && (
                        <>
                            <Box sx={{ mt: 3, mb: 2 }}>
                                <Autocomplete
                                    multiple
                                    options={Array.isArray(allNotes) ? allNotes : []}
                                    getOptionLabel={option => option.title}
                                    value={Array.isArray(linkedNotes) ? linkedNotes : []}
                                    onChange={(_, value, reason, details) => {
                                        if (details && details.option && details.option.id === '__new__') {
                                            handleCreateNote(details.option.title.replace(/^Add \"|\" as new Note$/g, ''));
                                        } else {
                                            const currentLinkedNotes = Array.isArray(linkedNotes) ? linkedNotes : [];
                                            value.forEach((n: any) => {
                                                if (!currentLinkedNotes.some((ln: any) => ln.id === n.id)) handleLinkNote(n.id);
                                            });
                                            currentLinkedNotes.forEach((ln: any) => {
                                                if (!value.some((n: any) => n.id === ln.id)) handleUnlinkNote(ln.id);
                                            });
                                        }
                                    }}
                                    renderInput={params => <TextField {...params} label="Linked Notes" margin="dense" fullWidth />}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip label={option.title} {...getTagProps({ index })} key={option.id} onDelete={() => handleUnlinkNote(option.id)} />
                                        ))
                                    }
                                    loading={creatingNote}
                                    filterOptions={(options, state) => {
                                        if (!Array.isArray(options)) return [];
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
                                    options={Array.isArray(allDatabaseEntries) ? allDatabaseEntries : []}
                                    getOptionLabel={option => option.name}
                                    value={Array.isArray(linkedDatabaseEntries) ? linkedDatabaseEntries : []}
                                    onChange={(_, value, reason, details) => {
                                        if (details && details.option && details.option.id === '__new__') {
                                            handleCreateDatabaseEntry(details.option.name.replace(/^Add \"|\" as new Entry$/g, ''));
                                        } else {
                                            const currentLinkedEntries = Array.isArray(linkedDatabaseEntries) ? linkedDatabaseEntries : [];
                                            value.forEach((e: any) => {
                                                if (!currentLinkedEntries.some((le: any) => le.id === e.id)) handleLinkDatabaseEntry(e.id);
                                            });
                                            currentLinkedEntries.forEach((le: any) => {
                                                if (!value.some((e: any) => e.id === le.id)) handleUnlinkDatabaseEntry(le.id);
                                            });
                                        }
                                    }}
                                    renderInput={params => <TextField {...params} label="Linked Database Entries" margin="dense" fullWidth />}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip label={option.name} {...getTagProps({ index })} key={option.id} onDelete={() => handleUnlinkDatabaseEntry(option.id)} />
                                        ))
                                    }
                                    loading={creatingDatabaseEntry}
                                    filterOptions={(options, state) => {
                                        if (!Array.isArray(options)) return [];
                                        const filtered = options.filter(opt => opt.name.toLowerCase().includes(state.inputValue.toLowerCase()));
                                        if (state.inputValue && !options.some((opt: any) => opt.name.toLowerCase() === state.inputValue.toLowerCase())) {
                                            filtered.push({ id: '__new__', name: `Add "${state.inputValue}" as new Entry` });
                                        }
                                        return filtered;
                                    }}
                                    sx={{ my: 1 }}
                                />
                            </Box>
                            <Box sx={{ mt: 3, mb: 2 }}>
                                <Autocomplete
                                    multiple
                                    options={Array.isArray(allProtocols) ? allProtocols : []}
                                    getOptionLabel={option => option.name}
                                    value={Array.isArray(linkedProtocols) ? linkedProtocols : []}
                                    onChange={(_, value, reason, details) => {
                                        const currentLinkedProtocols = Array.isArray(linkedProtocols) ? linkedProtocols : [];
                                        value.forEach((p: any) => {
                                            if (!currentLinkedProtocols.some((lp: any) => lp.id === p.id)) handleLinkProtocol(p.id);
                                        });
                                        currentLinkedProtocols.forEach((lp: any) => {
                                            if (!value.some((p: any) => p.id === lp.id)) handleUnlinkProtocol(lp.id);
                                        });
                                    }}
                                    renderInput={params => <TextField {...params} label="Linked Protocols" margin="dense" fullWidth />}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip label={option.name} {...getTagProps({ index })} key={option.id} onDelete={() => handleUnlinkProtocol(option.id)} />
                                        ))
                                    }
                                    loading={false}
                                    filterOptions={(options, state) => {
                                        if (!Array.isArray(options)) return [];
                                        const filtered = options.filter(opt => opt.name.toLowerCase().includes(state.inputValue.toLowerCase()));
                                        return filtered;
                                    }}
                                    sx={{ my: 1 }}
                                />
                                <Autocomplete
                                    multiple
                                    options={Array.isArray(allRecipes) ? allRecipes : []}
                                    getOptionLabel={option => option.name}
                                    value={Array.isArray(linkedRecipes) ? linkedRecipes : []}
                                    onChange={(_, value, reason, details) => {
                                        if (details && details.option && details.option.id === '__new__') {
                                            handleCreateRecipe(details.option.name.replace(/^Add \"|\" as new Recipe$/g, ''));
                                        } else {
                                            const currentLinkedRecipes = Array.isArray(linkedRecipes) ? linkedRecipes : [];
                                            value.forEach((r: any) => {
                                                if (!currentLinkedRecipes.some((lr: any) => lr.id === r.id)) handleLinkRecipe(r.id);
                                            });
                                            currentLinkedRecipes.forEach((lr: any) => {
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
                                        if (!Array.isArray(options)) return [];
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
                                    options={Array.isArray(allPDFs) ? allPDFs : []}
                                    getOptionLabel={option => option.title}
                                    value={Array.isArray(linkedPDFs) ? linkedPDFs : []}
                                    onChange={(_, value, reason, details) => {
                                        if (details && details.option && details.option.id === '__new__') {
                                            handleCreatePDF(details.option.title.replace(/^Add \"|\" as new PDF$/g, ''));
                                        } else {
                                            const currentLinkedPDFs = Array.isArray(linkedPDFs) ? linkedPDFs : [];
                                            value.forEach((p: any) => {
                                                if (!currentLinkedPDFs.some((lp: any) => lp.id === p.id)) handleLinkPDF(p.id);
                                            });
                                            currentLinkedPDFs.forEach((lp: any) => {
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
                                        if (!Array.isArray(options)) return [];
                                        const filtered = options.filter(opt => opt.title.toLowerCase().includes(state.inputValue.toLowerCase()));
                                        if (state.inputValue && !options.some(opt => opt.title.toLowerCase() === state.inputValue.toLowerCase())) {
                                            filtered.push({ id: '__new__', title: `Add "${state.inputValue}" as new PDF` });
                                        }
                                        return filtered;
                                    }}
                                    sx={{ my: 1 }}
                                />
                            </Box>
                        </>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} /> : undefined}
                >
                    {saving ? 'Saving...' : (project ? 'Update' : 'Create')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProjectForm; 