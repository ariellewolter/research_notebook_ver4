import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Box,
    Alert,
    CircularProgress,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Divider
} from '@mui/material';
import {
    OpenInNew as OpenInNewIcon,
    PictureAsPdf as PdfIcon,
    Edit as EditIcon,
    Settings as SettingsIcon,
    Close as CloseIcon,
    Visibility as VisibilityIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { useWindowManager, usePopoutWindows, usePDFWindows } from '../hooks/useWindowManager';

export default function WindowManagerDemo() {
    const {
        isElectron,
        currentWindowContext,
        openWindows,
        isLoading,
        error,
        openPopout,
        openPDF,
        openEditor,
        openSettings,
        closeWindow,
        focusWindow,
        getCurrentWindowContext,
        refreshWindows,
        canManageWindows,
        windowCount
    } = useWindowManager();

    const { openNotesPopout, openCalendarPopout, openResearchPopout, openTasksPopout } = usePopoutWindows();
    const { openPDFViewer } = usePDFWindows();

    const [lastAction, setLastAction] = useState<string>('');

    const handleAction = async (action: () => Promise<any>, actionName: string) => {
        setLastAction(`Executing: ${actionName}...`);
        try {
            const result = await action();
            if (result.success) {
                setLastAction(`✅ ${actionName} completed successfully`);
            } else {
                setLastAction(`❌ ${actionName} failed: ${result.error}`);
            }
        } catch (err) {
            setLastAction(`❌ ${actionName} error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleOpenPopout = (route: string, params: Record<string, any> = {}) => {
        handleAction(() => openPopout(route, params), `Open ${route} popout`);
    };

    const handleOpenPDF = (filePath: string, params: Record<string, any> = {}) => {
        handleAction(() => openPDF(filePath, params), `Open PDF: ${filePath}`);
    };

    const handleOpenEditor = (documentId?: string, mode: string = 'edit') => {
        handleAction(() => openEditor(documentId, mode), `Open editor (${mode})`);
    };

    const handleOpenSettings = (tab: string = 'general') => {
        handleAction(() => openSettings(tab), `Open settings (${tab})`);
    };

    const handleCloseWindow = (windowId: string) => {
        handleAction(() => closeWindow(windowId), `Close window: ${windowId}`);
    };

    const handleFocusWindow = (windowId: string) => {
        handleAction(() => focusWindow(windowId), `Focus window: ${windowId}`);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Window Manager Demo
            </Typography>

            {/* Environment Status */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Environment Status
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Chip
                                label={isElectron ? 'Electron' : 'Web Browser'}
                                color={isElectron ? 'primary' : 'secondary'}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Chip
                                label={`${windowCount} windows open`}
                                color="info"
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Chip
                                label={canManageWindows ? 'Window management available' : 'Window management not available'}
                                color={canManageWindows ? 'success' : 'warning'}
                                variant="outlined"
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Current Window Context */}
            {currentWindowContext && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Current Window Context
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>ID:</strong> {currentWindowContext.id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Route:</strong> {currentWindowContext.route}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Params:</strong> {JSON.stringify(currentWindowContext.params)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Dev Mode:</strong> {currentWindowContext.isDev ? 'Yes' : 'No'}
                        </Typography>
                    </CardContent>
                </Card>
            )}

            {/* Error Display */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Loading Indicator */}
            {isLoading && (
                <Box display="flex" alignItems="center" gap={2} sx={{ mb: 3 }}>
                    <CircularProgress size={20} />
                    <Typography>Loading...</Typography>
                </Box>
            )}

            {/* Last Action Status */}
            {lastAction && (
                <Alert severity={lastAction.includes('✅') ? 'success' : lastAction.includes('❌') ? 'error' : 'info'} sx={{ mb: 3 }}>
                    {lastAction}
                </Alert>
            )}

            {/* Popout Window Actions */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Popout Windows
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                variant="outlined"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => handleOpenPopout('/notes', { filter: 'recent' })}
                                fullWidth
                            >
                                Notes Popout
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                variant="outlined"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => handleOpenPopout('/calendar', { view: 'month' })}
                                fullWidth
                            >
                                Calendar Popout
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                variant="outlined"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => handleOpenPopout('/research', { projectId: 'proj_123' })}
                                fullWidth
                            >
                                Research Popout
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                variant="outlined"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => handleOpenPopout('/tasks', { status: 'pending' })}
                                fullWidth
                            >
                                Tasks Popout
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* PDF Window Actions */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        PDF Windows
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <Button
                                variant="outlined"
                                startIcon={<PdfIcon />}
                                onClick={() => handleOpenPDF('/path/to/document.pdf', { page: 1 })}
                                fullWidth
                            >
                                Open PDF Document
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Button
                                variant="outlined"
                                startIcon={<PdfIcon />}
                                onClick={() => handleOpenPDF('/uploads/research-paper.pdf', { page: 5, zoom: 1.5 })}
                                fullWidth
                            >
                                Open Research Paper
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Button
                                variant="outlined"
                                startIcon={<PdfIcon />}
                                onClick={() => handleOpenPDF('/documents/manual.pdf', { showToolbar: true })}
                                fullWidth
                            >
                                Open Manual
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Editor Window Actions */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Editor Windows
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => handleOpenEditor()}
                                fullWidth
                            >
                                New Document
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => handleOpenEditor('doc_123', 'edit')}
                                fullWidth
                            >
                                Edit Document
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => handleOpenEditor('doc_456', 'view')}
                                fullWidth
                            >
                                View Document
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Settings Window Actions */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Settings Windows
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                variant="outlined"
                                startIcon={<SettingsIcon />}
                                onClick={() => handleOpenSettings('general')}
                                fullWidth
                            >
                                General Settings
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                variant="outlined"
                                startIcon={<SettingsIcon />}
                                onClick={() => handleOpenSettings('editor')}
                                fullWidth
                            >
                                Editor Settings
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                variant="outlined"
                                startIcon={<SettingsIcon />}
                                onClick={() => handleOpenSettings('notifications')}
                                fullWidth
                            >
                                Notification Settings
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                variant="outlined"
                                startIcon={<SettingsIcon />}
                                onClick={() => handleOpenSettings('advanced')}
                                fullWidth
                            >
                                Advanced Settings
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Open Windows List */}
            {openWindows.length > 0 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">
                                Open Windows ({openWindows.length})
                            </Typography>
                            <Button
                                startIcon={<RefreshIcon />}
                                onClick={refreshWindows}
                                size="small"
                            >
                                Refresh
                            </Button>
                        </Box>
                        <List>
                            {openWindows.map((window, index) => (
                                <React.Fragment key={window.id}>
                                    <ListItem>
                                        <ListItemText
                                            primary={window.title}
                                            secondary={`ID: ${window.id} | ${window.isVisible ? 'Visible' : 'Hidden'} | ${window.isMinimized ? 'Minimized' : 'Normal'}`}
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleFocusWindow(window.id)}
                                                disabled={!window.isVisible}
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleCloseWindow(window.id)}
                                            >
                                                <CloseIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    {index < openWindows.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            )}

            {/* Utility Actions */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Utility Actions
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Button
                                variant="contained"
                                onClick={() => handleAction(getCurrentWindowContext, 'Get Current Window Context')}
                                fullWidth
                            >
                                Get Window Context
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Button
                                variant="contained"
                                onClick={refreshWindows}
                                fullWidth
                            >
                                Refresh Windows List
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
} 