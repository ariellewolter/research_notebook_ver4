import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Biotech as ExperimentIcon,
} from '@mui/icons-material';
import LinkRenderer from '../UniversalLinking/LinkRenderer';
import { Project, Experiment } from '../../types/project';
import { useThemePalette } from '../../services/ThemePaletteContext';
import { NOTE_TYPE_TO_PALETTE_ROLE } from '../../services/colorPalettes';

interface ProjectCardProps {
    project: Project;
    onEdit: (project: Project) => void;
    onDelete: (projectId: string) => void;
    onAddExperiment: (projectId: string) => void;
    onEditExperiment: (projectId: string, experiment: Experiment) => void;
    onDeleteExperiment: (experimentId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
    project,
    onEdit,
    onDelete,
    onAddExperiment,
    onEditExperiment,
    onDeleteExperiment,
}) => {
    const { palette } = useThemePalette();

    return (
        <Card sx={{ borderLeft: `8px solid ${palette[NOTE_TYPE_TO_PALETTE_ROLE['project']]}` }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div">
                            {project.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            <LinkRenderer content={project.description || 'No description'} />
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Start: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}<br />
                            Last Activity: {project.lastActivity ? new Date(project.lastActivity).toLocaleDateString() : 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Created: {new Date(project.createdAt).toLocaleDateString()}
                        </Typography>
                    </Box>
                    <Box>
                        <IconButton
                            size="small"
                            onClick={() => onAddExperiment(project.id)}
                            sx={{ mr: 1 }}
                        >
                            <AddIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => onEdit(project)}>
                            <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => onDelete(project.id)}>
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                    Experiments ({project.experiments?.length || 0})
                </Typography>

                {project.experiments && project.experiments.length > 0 ? (
                    <List dense>
                        {project.experiments.map((experiment) => (
                            <ListItem key={experiment.id} sx={{ pl: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <Box sx={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        background: palette[NOTE_TYPE_TO_PALETTE_ROLE['experiment']],
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontWeight: 700,
                                        fontSize: 14,
                                    }}>
                                        <ExperimentIcon fontSize="small" />
                                    </Box>
                                </ListItemIcon>
                                <ListItemText
                                    primary={experiment.name}
                                    secondary={experiment.description || 'No description'}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        size="small"
                                        onClick={() => onEditExperiment(project.id, experiment)}
                                        sx={{ mr: 1 }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => onDeleteExperiment(experiment.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No experiments yet. Click the + button to add one.
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default ProjectCard; 