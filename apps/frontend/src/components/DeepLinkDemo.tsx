import React, { useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Chip,
    Alert,
    Snackbar
} from '@mui/material';
import useDeepLinking from '../hooks/useDeepLinking';

const DeepLinkDemo: React.FC = () => {
    const {
        createDeepLink,
        openDeepLink,
        createNoteLink,
        createProjectLink,
        createPDFLink,
        createSearchLink,
        copyDeepLinkToClipboard,
        shareDeepLink,
        isElectron
    } = useDeepLinking();

    const [entityType, setEntityType] = useState('note');
    const [entityId, setEntityId] = useState('123');
    const [customParams, setCustomParams] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [notification, setNotification] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info';
    }>({ open: false, message: '', severity: 'info' });

    // Parse custom parameters
    const parseCustomParams = () => {
        if (!customParams.trim()) return {};
        
        try {
            return JSON.parse(customParams);
        } catch (error) {
            console.warn('Invalid JSON in custom params:', error);
            return {};
        }
    };

    // Generate deep link
    const handleGenerateLink = async () => {
        const params = parseCustomParams();
        const result = await createDeepLink(entityType, entityId, params);
        
        if (result.success && result.deepLink) {
            setGeneratedLink(result.deepLink);
            setNotification({
                open: true,
                message: 'Deep link generated successfully!',
                severity: 'success'
            });
        } else {
            setNotification({
                open: true,
                message: `Failed to generate deep link: ${result.error}`,
                severity: 'error'
            });
        }
    };

    // Open deep link
    const handleOpenLink = async () => {
        if (!generatedLink) return;
        
        const result = await openDeepLink(generatedLink);
        
        if (result.success) {
            setNotification({
                open: true,
                message: 'Deep link opened successfully!',
                severity: 'success'
            });
        } else {
            setNotification({
                open: true,
                message: `Failed to open deep link: ${result.error}`,
                severity: 'error'
            });
        }
    };

    // Copy to clipboard
    const handleCopyToClipboard = async () => {
        if (!generatedLink) return;
        
        try {
            await navigator.clipboard.writeText(generatedLink);
            setNotification({
                open: true,
                message: 'Deep link copied to clipboard!',
                severity: 'success'
            });
        } catch (error) {
            setNotification({
                open: true,
                message: 'Failed to copy to clipboard',
                severity: 'error'
            });
        }
    };

    // Share deep link
    const handleShare = async () => {
        const params = parseCustomParams();
        const result = await shareDeepLink(entityType, entityId, params);
        
        if (result.success) {
            setNotification({
                open: true,
                message: 'Deep link shared successfully!',
                severity: 'success'
            });
        } else {
            setNotification({
                open: true,
                message: `Failed to share: ${result.error}`,
                severity: 'error'
            });
        }
    };

    // Quick action buttons
    const quickActions = [
        {
            label: 'Open Note 123',
            action: () => createNoteLink('123', { mode: 'edit' })
        },
        {
            label: 'Open Project 456',
            action: () => createProjectLink('456', { view: 'overview', tab: 'details' })
        },
        {
            label: 'Open PDF Document',
            action: () => createPDFLink('document.pdf', { page: 5, zoom: 1.2 })
        },
        {
            label: 'Search for "research"',
            action: () => createSearchLink({ q: 'research', type: 'all' })
        }
    ];

    if (!isElectron) {
        return (
            <Box p={3}>
                <Alert severity="warning">
                    Deep linking is only available in the Electron application.
                </Alert>
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                Deep Link Demo
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
                Test deep linking functionality by generating and opening custom deep links.
            </Typography>

            {/* Quick Actions */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Quick Actions
                    </Typography>
                    <Grid container spacing={2}>
                        {quickActions.map((action, index) => (
                            <Grid item key={index}>
                                <Button
                                    variant="outlined"
                                    onClick={async () => {
                                        const result = await action.action();
                                        if (result.success && result.deepLink) {
                                            setGeneratedLink(result.deepLink);
                                            setNotification({
                                                open: true,
                                                message: `${action.label} link generated!`,
                                                severity: 'success'
                                            });
                                        }
                                    }}
                                >
                                    {action.label}
                                </Button>
                            </Grid>
                        ))}
                    </Grid>
                </CardContent>
            </Card>

            {/* Custom Deep Link Generator */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Custom Deep Link Generator
                    </Typography>
                    
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>Entity Type</InputLabel>
                                <Select
                                    value={entityType}
                                    label="Entity Type"
                                    onChange={(e) => setEntityType(e.target.value)}
                                >
                                    <MenuItem value="note">Note</MenuItem>
                                    <MenuItem value="project">Project</MenuItem>
                                    <MenuItem value="pdf">PDF</MenuItem>
                                    <MenuItem value="protocol">Protocol</MenuItem>
                                    <MenuItem value="recipe">Recipe</MenuItem>
                                    <MenuItem value="task">Task</MenuItem>
                                    <MenuItem value="search">Search</MenuItem>
                                    <MenuItem value="dashboard">Dashboard</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Entity ID"
                                value={entityId}
                                onChange={(e) => setEntityId(e.target.value)}
                                placeholder="123"
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleGenerateLink}
                                sx={{ height: '56px' }}
                            >
                                Generate Link
                            </Button>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Custom Parameters (JSON)"
                                value={customParams}
                                onChange={(e) => setCustomParams(e.target.value)}
                                placeholder='{"mode": "edit", "section": "content"}'
                                helperText="Enter JSON parameters for the deep link"
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Generated Link Display */}
            {generatedLink && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Generated Deep Link
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                            <Chip
                                label={generatedLink}
                                variant="outlined"
                                sx={{ 
                                    wordBreak: 'break-all',
                                    maxWidth: '100%',
                                    '& .MuiChip-label': {
                                        whiteSpace: 'normal',
                                        textAlign: 'left'
                                    }
                                }}
                            />
                        </Box>
                        
                        <Grid container spacing={2}>
                            <Grid item>
                                <Button
                                    variant="contained"
                                    onClick={handleOpenLink}
                                >
                                    Open Link
                                </Button>
                            </Grid>
                            <Grid item>
                                <Button
                                    variant="outlined"
                                    onClick={handleCopyToClipboard}
                                >
                                    Copy to Clipboard
                                </Button>
                            </Grid>
                            <Grid item>
                                <Button
                                    variant="outlined"
                                    onClick={handleShare}
                                >
                                    Share
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Example Links */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Example Deep Links
                    </Typography>
                    
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                Notes
                            </Typography>
                            <Box sx={{ mb: 1 }}>
                                <Chip
                                    size="small"
                                    label="researchnotebook://note/123"
                                    variant="outlined"
                                    sx={{ mb: 0.5 }}
                                />
                            </Box>
                            <Box sx={{ mb: 1 }}>
                                <Chip
                                    size="small"
                                    label="researchnotebook://note/123?mode=edit&section=content"
                                    variant="outlined"
                                    sx={{ mb: 0.5 }}
                                />
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                Projects
                            </Typography>
                            <Box sx={{ mb: 1 }}>
                                <Chip
                                    size="small"
                                    label="researchnotebook://project/456?view=overview&tab=details"
                                    variant="outlined"
                                    sx={{ mb: 0.5 }}
                                />
                            </Box>
                            <Box sx={{ mb: 1 }}>
                                <Chip
                                    size="small"
                                    label="researchnotebook://project/456?view=tasks&filter=active"
                                    variant="outlined"
                                    sx={{ mb: 0.5 }}
                                />
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                PDFs
                            </Typography>
                            <Box sx={{ mb: 1 }}>
                                <Chip
                                    size="small"
                                    label="researchnotebook://pdf/document.pdf?page=10&zoom=1.2"
                                    variant="outlined"
                                    sx={{ mb: 0.5 }}
                                />
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                Search
                            </Typography>
                            <Box sx={{ mb: 1 }}>
                                <Chip
                                    size="small"
                                    label="researchnotebook://search?q=protocol&type=all"
                                    variant="outlined"
                                    sx={{ mb: 0.5 }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Notification */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification({ ...notification, open: false })}
            >
                <Alert
                    onClose={() => setNotification({ ...notification, open: false })}
                    severity={notification.severity}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default DeepLinkDemo; 