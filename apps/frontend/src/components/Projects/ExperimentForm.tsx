import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    CircularProgress,
} from '@mui/material';
import { Experiment } from '../../types/project';

interface ExperimentFormProps {
    open: boolean;
    onClose: () => void;
    experiment?: Experiment | null;
    projectId: string;
    onSave: (experimentData: any) => Promise<void>;
    saving: boolean;
}

const ExperimentForm: React.FC<ExperimentFormProps> = ({
    open,
    onClose,
    experiment,
    projectId,
    onSave,
    saving
}) => {
    const [experimentFormData, setExperimentFormData] = useState({
        name: '',
        description: '',
    });

    useEffect(() => {
        if (experiment) {
            setExperimentFormData({
                name: experiment.name,
                description: experiment.description || '',
            });
        } else {
            setExperimentFormData({
                name: '',
                description: '',
            });
        }
    }, [experiment]);

    const handleSave = async () => {
        if (!experimentFormData.name.trim()) {
            throw new Error('Please enter an experiment name');
        }

        await onSave(experimentFormData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {experiment ? 'Edit Experiment' : 'Create New Experiment'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 1 }}>
                    <TextField
                        fullWidth
                        label="Experiment Name"
                        value={experimentFormData.name}
                        onChange={(e) => setExperimentFormData({ ...experimentFormData, name: e.target.value })}
                        sx={{ mb: 2 }}
                        disabled={saving}
                    />

                    <TextField
                        fullWidth
                        label="Description"
                        multiline
                        rows={3}
                        value={experimentFormData.description}
                        onChange={(e) => setExperimentFormData({ ...experimentFormData, description: e.target.value })}
                        disabled={saving}
                    />
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
                    {saving ? 'Saving...' : (experiment ? 'Update' : 'Create')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ExperimentForm; 