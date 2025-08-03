import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import EnhancedTimeBlockingView from '../components/TimeBlocking/EnhancedTimeBlockingView';
import { useNavigate } from 'react-router-dom';

const TimeBlocking: React.FC = () => {
    const navigate = useNavigate();

    // Navigation handlers for linking to existing entities
    const handleNavigateToTask = (taskId: string) => {
        navigate(`/tasks?selected=${taskId}`);
    };

    const handleNavigateToNote = (noteId: string) => {
        navigate(`/notes?selected=${noteId}`);
    };

    const handleNavigateToExperiment = (experimentId: string) => {
        navigate(`/experiments?selected=${experimentId}`);
    };

    const handleNavigateToProject = (projectId: string) => {
        navigate(`/projects?selected=${projectId}`);
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Time Blocking
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Schedule your research activities and optimize your productivity with AI-powered suggestions.
                </Typography>
            </Box>

            {/* Main Content */}
            <Box sx={{ flex: 1, position: 'relative' }}>
                <EnhancedTimeBlockingView
                    onNavigateToTask={handleNavigateToTask}
                    onNavigateToNote={handleNavigateToNote}
                    onNavigateToExperiment={handleNavigateToExperiment}
                    onNavigateToProject={handleNavigateToProject}
                />
            </Box>
        </Box>
    );
};

export default TimeBlocking; 