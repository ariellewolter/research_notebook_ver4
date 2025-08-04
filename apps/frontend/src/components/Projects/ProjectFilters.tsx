import React from 'react';
import { Box, Button } from '@mui/material';
import { ProjectStatus } from '../../types/project';

const PROJECT_STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
    { value: 'future', label: 'Future' },
];

interface ProjectFiltersProps {
    statusTab: ProjectStatus;
    onStatusChange: (status: ProjectStatus) => void;
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({
    statusTab,
    onStatusChange,
}) => {
    return (
        <Box sx={{ mb: 2 }}>
            {PROJECT_STATUS_OPTIONS.map(opt => (
                <Button
                    key={opt.value}
                    variant={statusTab === opt.value ? 'contained' : 'outlined'}
                    onClick={() => onStatusChange(opt.value as ProjectStatus)}
                    sx={{ mr: 1 }}
                >
                    {opt.label}
                </Button>
            ))}
        </Box>
    );
};

export default ProjectFilters; 