import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import NotionPage from './NotionPage';
import { NotionPage as NotionPageType } from './types';
import { useParams } from 'react-router-dom';

// This component integrates with your tab system
const NotionWorkspaceTab: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [page, setPage] = useState<NotionPageType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load page data - replace with your actual API call
        const loadPage = async () => {
            try {
                // Mock data - replace with real API call
                const mockPage: NotionPageType = {
                    id: id || 'new',
                    title: 'Research Document',
                    icon: '🧪',
                    blocks: [
                        {
                            id: '1',
                            type: 'heading',
                            content: { text: 'Research Protocol Analysis', level: 1 },
                            metadata: { createdAt: new Date(), updatedAt: new Date() }
                        },
                        {
                            id: '2',
                            type: 'text',
                            content: { text: 'This document combines multiple research elements...' },
                            metadata: { createdAt: new Date(), updatedAt: new Date() }
                        }
                    ],
                    metadata: {
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        path: `/workspace/${id}`,
                    }
                };

                setPage(mockPage);
            } catch (error) {
                console.error('Failed to load page:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPage();
    }, [id]);

    const handleUpdatePage = (updatedPage: NotionPageType) => {
        setPage(updatedPage);
        // Here you would save to your backend
        // savePageToBackend(updatedPage);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!page) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    Page not found
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', overflow: 'auto' }}>
            <NotionPage
                page={page}
                onUpdatePage={handleUpdatePage}
            />
        </Box>
    );
};

export default NotionWorkspaceTab; 