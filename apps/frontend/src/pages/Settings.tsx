import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Snackbar,
    Alert,
    CircularProgress,
    Switch,
    FormControlLabel,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Settings as SettingsIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { colorPalettes, Palette, PaletteRole } from '../services/colorPalettes';
import { useThemePalette } from '../services/ThemePaletteContext';
import { zoteroApi, googleCalendarApi, outlookCalendarApi, appleCalendarApi } from '../services/api';

const CUSTOM_PALETTE_KEY = 'Custom';
const PALETTE_ROLES: PaletteRole[] = [
    'primary',
    'secondary',
    'background',
    'paper',
    'text',
    'error',
    'success',
    'warning',
    'info',
    'divider',
];

const defaultCustom: Palette = {
    primary: '#1976d2',
    secondary: '#dc004e',
    background: '#fafafa',
    paper: '#ffffff',
    text: '#22223B',
    error: '#FF6F61',
    success: '#06D6A0',
    warning: '#FFD166',
    info: '#118AB2',
    divider: '#E0E0E0',
};

const NOTE_OPEN_BEHAVIOR_KEY = 'noteOpenBehavior';
const NOTE_OPEN_BEHAVIOR_OPTIONS = [
    { value: 'modal', label: 'Modal (popup)' },
    { value: 'page', label: 'New Page' },
];

const ZOTERO_API_KEY = 'zoteroApiKey';
const ZOTERO_USER_ID = 'zoteroUserId';

const BIBLIO_STYLE_KEY = 'biblioStyle';
const BIBLIO_STYLES = [
    { value: 'apa', label: 'APA' },
    { value: 'mla', label: 'MLA' },
    { value: 'chicago', label: 'Chicago' },
    { value: 'vancouver', label: 'Vancouver' },
    { value: 'harvard', label: 'Harvard' },
    { value: 'nature', label: 'Nature' },
    { value: 'ieee', label: 'IEEE' },
];

const Settings: React.FC = () => {
    const { paletteName, setPaletteName, setCustomPalette, palette } = useThemePalette();
    const [custom, setCustom] = useState<Palette>(() => {
        const saved = localStorage.getItem('customPalette');
        return saved ? JSON.parse(saved) : defaultCustom;
    });
    const [noteOpenBehavior, setNoteOpenBehavior] = useState<string>(() => {
        return localStorage.getItem(NOTE_OPEN_BEHAVIOR_KEY) || 'modal';
    });
    const [biblioStyle, setBiblioStyle] = useState<string>(() => {
        return localStorage.getItem(BIBLIO_STYLE_KEY) || 'apa';
    });

    // Zotero state
    const [zoteroApiKey, setZoteroApiKey] = useState(() => localStorage.getItem(ZOTERO_API_KEY) || '');
    const [zoteroUserId, setZoteroUserId] = useState(() => localStorage.getItem(ZOTERO_USER_ID) || '');
    const [zoteroStatus, setZoteroStatus] = useState<'connected' | 'disconnected'>(
        () => (localStorage.getItem(ZOTERO_API_KEY) && localStorage.getItem(ZOTERO_USER_ID)) ? 'connected' : 'disconnected'
    );
    const [zoteroSaved, setZoteroSaved] = useState(false);
    const [zoteroTestStatus, setZoteroTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [zoteroTestMessage, setZoteroTestMessage] = useState('');

    // Google Calendar state
    const [googleClientId, setGoogleClientId] = useState('');
    const [googleClientSecret, setGoogleClientSecret] = useState('');
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [googleCalendars, setGoogleCalendars] = useState<any[]>([]);
    const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
    const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

    // Outlook Calendar state
    const [outlookClientId, setOutlookClientId] = useState('');
    const [outlookClientSecret, setOutlookClientSecret] = useState('');
    const [isOutlookConnected, setIsOutlookConnected] = useState(false);
    const [outlookCalendars, setOutlookCalendars] = useState<any[]>([]);
    const [isLoadingOutlook, setIsLoadingOutlook] = useState(false);
    const [isConnectingOutlook, setIsConnectingOutlook] = useState(false);

    // Apple Calendar state
    const [appleStartDate, setAppleStartDate] = useState('');
    const [appleEndDate, setAppleEndDate] = useState('');
    const [isExportingApple, setIsExportingApple] = useState(false);

    // Notification settings state
    const [notificationSettings, setNotificationSettings] = useState({
        enableNotifications: true,
        enableEmailNotifications: false,
        enablePushNotifications: false,
        enableSMSNotifications: false,
        emailAddress: '',
        phoneNumber: '',
        defaultDeliveryMethod: 'in_app' as 'in_app' | 'email' | 'push' | 'sms',
        enableTaskReminders: true,
        enableOverdueAlerts: true,
        enableCompletionNotifications: true,
        enableAssignmentNotifications: true,
        enableCommentNotifications: true,
        reminderTime: '09:00',
        overdueAlertTime: '18:00',
        priorityFilter: 'all' as 'all' | 'high' | 'normal' | 'low',
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
        }
    });

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        if (paletteName === CUSTOM_PALETTE_KEY && setCustomPalette) {
            setCustomPalette(custom);
        }
    }, [custom, paletteName, setCustomPalette]);

    useEffect(() => {
        localStorage.setItem(NOTE_OPEN_BEHAVIOR_KEY, noteOpenBehavior);
    }, [noteOpenBehavior]);

    useEffect(() => {
        localStorage.setItem(BIBLIO_STYLE_KEY, biblioStyle);
    }, [biblioStyle]);

    useEffect(() => {
        loadGoogleCredentials();
        loadOutlookCredentials();
        loadZoteroConfig();
        loadNotificationSettings();
    }, []);

    const loadZoteroConfig = () => {
        const savedApiKey = localStorage.getItem(ZOTERO_API_KEY);
        const savedUserId = localStorage.getItem(ZOTERO_USER_ID);
        if (savedApiKey) setZoteroApiKey(savedApiKey);
        if (savedUserId) setZoteroUserId(savedUserId);
    };

    const handleColorChange = (role: PaletteRole, value: string) => {
        setCustom((prev) => ({ ...prev, [role]: value }));
    };

    const handlePaletteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const name = e.target.value;
        setPaletteName(name);
        if (name === CUSTOM_PALETTE_KEY && setCustomPalette) {
            setCustomPalette(custom);
        }
    };

    const handleSaveZotero = () => {
        localStorage.setItem(ZOTERO_API_KEY, zoteroApiKey);
        localStorage.setItem(ZOTERO_USER_ID, zoteroUserId);
        setZoteroStatus(zoteroApiKey && zoteroUserId ? 'connected' : 'disconnected');
        setZoteroSaved(true);
        setTimeout(() => setZoteroSaved(false), 2000);
    };

    const handleTestZotero = async () => {
        setZoteroTestStatus('loading');
        setZoteroTestMessage('');
        try {
            await zoteroApi.config({ apiKey: zoteroApiKey, userId: zoteroUserId });
            setZoteroTestStatus('success');
            setZoteroTestMessage('Zotero connection successful!');
        } catch (err: any) {
            setZoteroTestStatus('error');
            setZoteroTestMessage(err?.response?.data?.error || 'Failed to connect to Zotero.');
        }
    };

    // Google Calendar functions
    const loadGoogleCredentials = async () => {
        try {
            const response = await googleCalendarApi.getCredentials();
            if (response.data.googleClientId) {
                setGoogleClientId(response.data.googleClientId);
                setGoogleClientSecret(response.data.googleClientSecret || '');
                setIsGoogleConnected(!!response.data.googleTokens);
            }
        } catch (error) {
            console.error('Failed to load Google credentials:', error);
        }
    };

    const saveGoogleCredentials = async () => {
        setIsLoadingGoogle(true);
        try {
            await googleCalendarApi.saveCredentials({
                googleClientId,
                googleClientSecret
            });
            setSnackbar({
                open: true,
                message: 'Google credentials saved successfully!',
                severity: 'success'
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Failed to save Google credentials',
                severity: 'error'
            });
        } finally {
            setIsLoadingGoogle(false);
        }
    };

    const connectGoogleCalendar = async () => {
        setIsConnectingGoogle(true);
        try {
            const response = await googleCalendarApi.startAuth();
            // Open Google OAuth in a new window
            window.open(response.data.authUrl, '_blank', 'width=500,height=600');

            // Poll for completion (in a real app, you'd use a proper callback)
            const checkConnection = setInterval(async () => {
                try {
                    const calendarsResponse = await googleCalendarApi.getCalendars();
                    if (calendarsResponse.data.calendars) {
                        setGoogleCalendars(calendarsResponse.data.calendars);
                        setIsGoogleConnected(true);
                        clearInterval(checkConnection);
                        setSnackbar({
                            open: true,
                            message: 'Google Calendar connected successfully!',
                            severity: 'success'
                        });
                    }
                } catch (error) {
                    // Not connected yet, continue polling
                }
            }, 2000);

            // Stop polling after 5 minutes
            setTimeout(() => {
                clearInterval(checkConnection);
                setIsConnectingGoogle(false);
            }, 300000);
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Failed to start Google authentication',
                severity: 'error'
            });
            setIsConnectingGoogle(false);
        }
    };

    const disconnectGoogleCalendar = async () => {
        try {
            // Clear tokens from database
            await googleCalendarApi.saveCredentials({
                googleClientId,
                googleClientSecret: ''
            });
            setIsGoogleConnected(false);
            setGoogleCalendars([]);
            setSnackbar({
                open: true,
                message: 'Google Calendar disconnected',
                severity: 'success'
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Failed to disconnect Google Calendar',
                severity: 'error'
            });
        }
    };

    // Outlook Calendar functions
    const loadOutlookCredentials = async () => {
        try {
            const response = await outlookCalendarApi.getCredentials();
            if (response.data.outlookClientId) {
                setOutlookClientId(response.data.outlookClientId);
                setOutlookClientSecret(response.data.outlookClientSecret || '');
                setIsOutlookConnected(!!response.data.outlookTokens);
            }
        } catch (error) {
            console.error('Failed to load Outlook credentials:', error);
        }
    };

    const saveOutlookCredentials = async () => {
        setIsLoadingOutlook(true);
        try {
            await outlookCalendarApi.saveCredentials({
                outlookClientId,
                outlookClientSecret
            });
            setSnackbar({
                open: true,
                message: 'Outlook credentials saved successfully!',
                severity: 'success'
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Failed to save Outlook credentials',
                severity: 'error'
            });
        } finally {
            setIsLoadingOutlook(false);
        }
    };

    const connectOutlookCalendar = async () => {
        setIsConnectingOutlook(true);
        try {
            const response = await outlookCalendarApi.startAuth();
            // Open Outlook OAuth in a new window
            window.open(response.data.authUrl, '_blank', 'width=500,height=600');

            // Poll for completion (in a real app, you'd use a proper callback)
            const checkConnection = setInterval(async () => {
                try {
                    const calendarsResponse = await outlookCalendarApi.getCalendars();
                    if (calendarsResponse.data.calendars) {
                        setOutlookCalendars(calendarsResponse.data.calendars);
                        setIsOutlookConnected(true);
                        clearInterval(checkConnection);
                        setSnackbar({
                            open: true,
                            message: 'Outlook Calendar connected successfully!',
                            severity: 'success'
                        });
                    }
                } catch (error) {
                    // Not connected yet, continue polling
                }
            }, 2000);

            // Stop polling after 5 minutes
            setTimeout(() => {
                clearInterval(checkConnection);
                setIsConnectingOutlook(false);
            }, 300000);
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Failed to start Outlook authentication',
                severity: 'error'
            });
            setIsConnectingOutlook(false);
        }
    };

    const disconnectOutlookCalendar = async () => {
        try {
            // Clear tokens from database
            await outlookCalendarApi.saveCredentials({
                outlookClientId,
                outlookClientSecret: ''
            });
            setIsOutlookConnected(false);
            setOutlookCalendars([]);
            setSnackbar({
                open: true,
                message: 'Outlook Calendar disconnected',
                severity: 'success'
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Failed to disconnect Outlook Calendar',
                severity: 'error'
            });
        }
    };

    // Apple Calendar functions
    const exportAppleCalendar = async () => {
        setIsExportingApple(true);
        try {
            const response = await appleCalendarApi.exportICS(appleStartDate, appleEndDate);

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'research-notebook-calendar.ics');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setSnackbar({
                open: true,
                message: 'Apple Calendar ICS file exported successfully!',
                severity: 'success'
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Failed to export Apple Calendar ICS file',
                severity: 'error'
            });
        } finally {
            setIsExportingApple(false);
        }
    };

    // Notification settings functions
    const loadNotificationSettings = () => {
        const saved = localStorage.getItem('notificationSettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setNotificationSettings(prev => ({ ...prev, ...parsed }));
            } catch (error) {
                console.error('Failed to parse notification settings:', error);
            }
        }
    };

    const saveNotificationSettings = () => {
        localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
        setSnackbar({
            open: true,
            message: 'Notification settings saved successfully!',
            severity: 'success'
        });
    };

    const handleNotificationSettingChange = (key: string, value: any) => {
        setNotificationSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleQuietHoursChange = (key: string, value: any) => {
        setNotificationSettings(prev => ({
            ...prev,
            quietHours: { ...prev.quietHours, [key]: value }
        }));
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                Settings
            </Typography>

            {/* Theme & Color Palette */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Theme & Color Palette
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item>
                            <Typography variant="body2">Color Palette:</Typography>
                        </Grid>
                        <Grid item>
                            <select
                                value={paletteName}
                                onChange={handlePaletteChange}
                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            >
                                {Object.keys(colorPalettes).map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                                <option value={CUSTOM_PALETTE_KEY}>Custom Palette</option>
                            </select>
                        </Grid>
                    </Grid>

                    {paletteName === CUSTOM_PALETTE_KEY && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Custom Palette Editor
                            </Typography>
                            <Grid container spacing={2}>
                                {PALETTE_ROLES.map((role) => (
                                    <Grid item key={role}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <Typography variant="body2" gutterBottom>
                                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                            </Typography>
                                            <input
                                                type="color"
                                                value={custom[role]}
                                                onChange={(e) => handleColorChange(role, e.target.value)}
                                                style={{ width: 48, height: 32, border: 'none', background: 'none' }}
                                            />
                                            <Typography variant="caption">{custom[role]}</Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Note Open Behavior */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Note Open Behavior
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item>
                            <Typography variant="body2">Open notes in:</Typography>
                        </Grid>
                        <Grid item>
                            <select
                                value={noteOpenBehavior}
                                onChange={e => setNoteOpenBehavior(e.target.value)}
                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            >
                                {NOTE_OPEN_BEHAVIOR_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Bibliography Style */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Bibliography Style
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item>
                            <Typography variant="body2">Citation/Bibliography Style:</Typography>
                        </Grid>
                        <Grid item>
                            <select
                                value={biblioStyle}
                                onChange={e => setBiblioStyle(e.target.value)}
                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            >
                                {BIBLIO_STYLES.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </Grid>
                    </Grid>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This style will be used for all Zotero citations and bibliographies in your notes and protocols.
                    </Typography>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Notification Settings
                    </Typography>

                    <Grid container spacing={3}>
                        {/* General Notification Settings */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                General Settings
                            </Typography>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={notificationSettings.enableNotifications}
                                        onChange={(e) => handleNotificationSettingChange('enableNotifications', e.target.checked)}
                                    />
                                }
                                label="Enable Notifications"
                            />
                        </Grid>

                        {/* Delivery Methods */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                Delivery Methods
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={notificationSettings.enableEmailNotifications}
                                                onChange={(e) => handleNotificationSettingChange('enableEmailNotifications', e.target.checked)}
                                                disabled={!notificationSettings.enableNotifications}
                                            />
                                        }
                                        label="Email Notifications"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={notificationSettings.enablePushNotifications}
                                                onChange={(e) => handleNotificationSettingChange('enablePushNotifications', e.target.checked)}
                                                disabled={!notificationSettings.enableNotifications}
                                            />
                                        }
                                        label="Push Notifications"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={notificationSettings.enableSMSNotifications}
                                                onChange={(e) => handleNotificationSettingChange('enableSMSNotifications', e.target.checked)}
                                                disabled={!notificationSettings.enableNotifications}
                                            />
                                        }
                                        label="SMS Notifications"
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Contact Information */}
                        {(notificationSettings.enableEmailNotifications || notificationSettings.enableSMSNotifications) && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Contact Information
                                </Typography>
                                <Grid container spacing={2}>
                                    {notificationSettings.enableEmailNotifications && (
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Email Address"
                                                value={notificationSettings.emailAddress}
                                                onChange={(e) => handleNotificationSettingChange('emailAddress', e.target.value)}
                                                placeholder="your.email@example.com"
                                                InputProps={{
                                                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                                                }}
                                            />
                                        </Grid>
                                    )}
                                    {notificationSettings.enableSMSNotifications && (
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Phone Number"
                                                value={notificationSettings.phoneNumber}
                                                onChange={(e) => handleNotificationSettingChange('phoneNumber', e.target.value)}
                                                placeholder="+1 (555) 123-4567"
                                                InputProps={{
                                                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
                                                }}
                                            />
                                        </Grid>
                                    )}
                                </Grid>
                            </Grid>
                        )}

                        {/* Default Delivery Method */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Default Delivery Method</InputLabel>
                                <Select
                                    value={notificationSettings.defaultDeliveryMethod}
                                    onChange={(e) => handleNotificationSettingChange('defaultDeliveryMethod', e.target.value)}
                                    label="Default Delivery Method"
                                >
                                    <MenuItem value="in_app">In App</MenuItem>
                                    <MenuItem value="email">Email</MenuItem>
                                    <MenuItem value="push">Push Notification</MenuItem>
                                    <MenuItem value="sms">SMS</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Notification Types */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                Notification Types
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={notificationSettings.enableTaskReminders}
                                                onChange={(e) => handleNotificationSettingChange('enableTaskReminders', e.target.checked)}
                                                disabled={!notificationSettings.enableNotifications}
                                            />
                                        }
                                        label="Task Reminders"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={notificationSettings.enableOverdueAlerts}
                                                onChange={(e) => handleNotificationSettingChange('enableOverdueAlerts', e.target.checked)}
                                                disabled={!notificationSettings.enableNotifications}
                                            />
                                        }
                                        label="Overdue Alerts"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={notificationSettings.enableCompletionNotifications}
                                                onChange={(e) => handleNotificationSettingChange('enableCompletionNotifications', e.target.checked)}
                                                disabled={!notificationSettings.enableNotifications}
                                            />
                                        }
                                        label="Completion Notifications"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={notificationSettings.enableAssignmentNotifications}
                                                onChange={(e) => handleNotificationSettingChange('enableAssignmentNotifications', e.target.checked)}
                                                disabled={!notificationSettings.enableNotifications}
                                            />
                                        }
                                        label="Assignment Notifications"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={notificationSettings.enableCommentNotifications}
                                                onChange={(e) => handleNotificationSettingChange('enableCommentNotifications', e.target.checked)}
                                                disabled={!notificationSettings.enableNotifications}
                                            />
                                        }
                                        label="Comment Notifications"
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Timing Settings */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                Timing Settings
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Reminder Time"
                                        type="time"
                                        value={notificationSettings.reminderTime}
                                        onChange={(e) => handleNotificationSettingChange('reminderTime', e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Overdue Alert Time"
                                        type="time"
                                        value={notificationSettings.overdueAlertTime}
                                        onChange={(e) => handleNotificationSettingChange('overdueAlertTime', e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Quiet Hours */}
                        <Grid item xs={12}>
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="subtitle1">
                                        <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Quiet Hours
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={notificationSettings.quietHours.enabled}
                                                        onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
                                                    />
                                                }
                                                label="Enable Quiet Hours"
                                            />
                                        </Grid>
                                        {notificationSettings.quietHours.enabled && (
                                            <>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="Start Time"
                                                        type="time"
                                                        value={notificationSettings.quietHours.start}
                                                        onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="End Time"
                                                        type="time"
                                                        value={notificationSettings.quietHours.end}
                                                        onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </Grid>
                                            </>
                                        )}
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        </Grid>

                        {/* Priority Filter */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Priority Filter</InputLabel>
                                <Select
                                    value={notificationSettings.priorityFilter}
                                    onChange={(e) => handleNotificationSettingChange('priorityFilter', e.target.value)}
                                    label="Priority Filter"
                                >
                                    <MenuItem value="all">All Priorities</MenuItem>
                                    <MenuItem value="high">High Priority Only</MenuItem>
                                    <MenuItem value="normal">Normal & High Priority</MenuItem>
                                    <MenuItem value="low">All Priorities</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3 }}>
                        <Button
                            variant="contained"
                            onClick={saveNotificationSettings}
                            sx={{ mr: 2 }}
                        >
                            Save Notification Settings
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Zotero Integration */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Zotero Integration
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="API Key"
                                value={zoteroApiKey}
                                onChange={e => setZoteroApiKey(e.target.value)}
                                margin="normal"
                                placeholder="Paste your Zotero API key"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="User/Library ID"
                                value={zoteroUserId}
                                onChange={e => setZoteroUserId(e.target.value)}
                                margin="normal"
                                placeholder="Your Zotero user or group ID"
                            />
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleSaveZotero}
                            sx={{ mr: 2 }}
                        >
                            Save
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleTestZotero}
                            disabled={zoteroTestStatus === 'loading'}
                        >
                            {zoteroTestStatus === 'loading' ? <CircularProgress size={20} /> : 'Test Connection'}
                        </Button>
                    </Box>
                    {zoteroTestStatus === 'success' && (
                        <Typography variant="body2" color="success.main">
                            {zoteroTestMessage}
                        </Typography>
                    )}
                    {zoteroTestStatus === 'error' && (
                        <Typography variant="body2" color="error.main">
                            {zoteroTestMessage}
                        </Typography>
                    )}
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Status: <strong style={{ color: zoteroStatus === 'connected' ? 'green' : 'red' }}>
                            {zoteroStatus === 'connected' ? 'Connected' : 'Disconnected'}
                        </strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Find your API key and user ID at{' '}
                        <a href="https://www.zotero.org/settings/keys" target="_blank" rel="noopener noreferrer">
                            zotero.org/settings/keys
                        </a>.
                    </Typography>
                </CardContent>
            </Card>

            {/* Google Calendar Integration */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Google Calendar Integration
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Connect your Google Calendar to sync events and experiments.
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Google Client ID"
                                value={googleClientId}
                                onChange={(e) => setGoogleClientId(e.target.value)}
                                margin="normal"
                                placeholder="Enter your Google API Client ID"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Google Client Secret"
                                type="password"
                                value={googleClientSecret}
                                onChange={(e) => setGoogleClientSecret(e.target.value)}
                                margin="normal"
                                placeholder="Enter your Google API Client Secret"
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Button
                            variant="contained"
                            onClick={saveGoogleCredentials}
                            disabled={isLoadingGoogle || !googleClientId || !googleClientSecret}
                            sx={{ mr: 2 }}
                        >
                            {isLoadingGoogle ? <CircularProgress size={20} /> : 'Save Credentials'}
                        </Button>

                        {isGoogleConnected ? (
                            <>
                                <Button
                                    variant="outlined"
                                    onClick={connectGoogleCalendar}
                                    disabled={isConnectingGoogle}
                                    sx={{ mr: 2 }}
                                >
                                    {isConnectingGoogle ? <CircularProgress size={20} /> : 'Reconnect'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={disconnectGoogleCalendar}
                                >
                                    Disconnect
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={connectGoogleCalendar}
                                disabled={isConnectingGoogle || !googleClientId || !googleClientSecret}
                            >
                                {isConnectingGoogle ? <CircularProgress size={20} /> : 'Connect Google Calendar'}
                            </Button>
                        )}
                    </Box>

                    {isGoogleConnected && googleCalendars.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Connected Calendars:
                            </Typography>
                            <List dense>
                                {googleCalendars.map((calendar) => (
                                    <ListItem key={calendar.id}>
                                        <ListItemIcon>
                                            <Box
                                                sx={{
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: '50%',
                                                    backgroundColor: calendar.backgroundColor || '#4285f4'
                                                }}
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={calendar.name}
                                            secondary={calendar.primary ? 'Primary Calendar' : calendar.accessRole}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            <strong>How to get Google API credentials:</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" component="div">
                            <ol>
                                <li>Go to <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
                                <li>Create a new project or select an existing one</li>
                                <li>Enable the Google Calendar API</li>
                                <li>Go to "Credentials" and create an OAuth 2.0 Client ID</li>
                                <li>Add "http://localhost:5173/calendar/callback" to authorized redirect URIs</li>
                                <li>Copy the Client ID and Client Secret to the fields above</li>
                            </ol>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {/* Outlook Calendar Integration */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Outlook Calendar Integration
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Connect your Outlook Calendar to sync events and experiments.
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Outlook Client ID"
                                value={outlookClientId}
                                onChange={(e) => setOutlookClientId(e.target.value)}
                                margin="normal"
                                placeholder="Enter your Microsoft API Client ID"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Outlook Client Secret"
                                type="password"
                                value={outlookClientSecret}
                                onChange={(e) => setOutlookClientSecret(e.target.value)}
                                margin="normal"
                                placeholder="Enter your Microsoft API Client Secret"
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Button
                            variant="contained"
                            onClick={saveOutlookCredentials}
                            disabled={isLoadingOutlook || !outlookClientId || !outlookClientSecret}
                            sx={{ mr: 2 }}
                        >
                            {isLoadingOutlook ? <CircularProgress size={20} /> : 'Save Credentials'}
                        </Button>

                        {isOutlookConnected ? (
                            <>
                                <Button
                                    variant="outlined"
                                    onClick={connectOutlookCalendar}
                                    disabled={isConnectingOutlook}
                                    sx={{ mr: 2 }}
                                >
                                    {isConnectingOutlook ? <CircularProgress size={20} /> : 'Reconnect'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={disconnectOutlookCalendar}
                                >
                                    Disconnect
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={connectOutlookCalendar}
                                disabled={isConnectingOutlook || !outlookClientId || !outlookClientSecret}
                            >
                                {isConnectingOutlook ? <CircularProgress size={20} /> : 'Connect Outlook Calendar'}
                            </Button>
                        )}
                    </Box>

                    {isOutlookConnected && outlookCalendars.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Connected Calendars:
                            </Typography>
                            <List dense>
                                {outlookCalendars.map((calendar) => (
                                    <ListItem key={calendar.id}>
                                        <ListItemIcon>
                                            <Box
                                                sx={{
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: '50%',
                                                    backgroundColor: calendar.backgroundColor || '#0078d4'
                                                }}
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={calendar.name}
                                            secondary={calendar.primary ? 'Primary Calendar' : calendar.accessRole}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            <strong>How to get Microsoft API credentials:</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" component="div">
                            <ol>
                                <li>Go to <a href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer">Azure Portal</a></li>
                                <li>Click "New registration" to create a new app</li>
                                <li>Set the redirect URI to "http://localhost:5173/calendar/callback"</li>
                                <li>Go to "Certificates & secrets" and create a new client secret</li>
                                <li>Go to "API permissions" and add "Calendars.ReadWrite" and "User.Read"</li>
                                <li>Copy the Application (client) ID and Client Secret to the fields above</li>
                            </ol>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {/* Apple Calendar ICS Export */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Apple Calendar Export
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Export your research events as an ICS file for Apple Calendar import.
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Start Date"
                                type="date"
                                value={appleStartDate}
                                onChange={(e) => setAppleStartDate(e.target.value)}
                                margin="normal"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="End Date"
                                type="date"
                                value={appleEndDate}
                                onChange={(e) => setAppleEndDate(e.target.value)}
                                margin="normal"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Button
                            variant="contained"
                            onClick={exportAppleCalendar}
                            disabled={isExportingApple}
                            sx={{ mr: 2 }}
                        >
                            {isExportingApple ? <CircularProgress size={20} /> : 'Export ICS File'}
                        </Button>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            <strong>How to import to Apple Calendar:</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" component="div">
                            <ol>
                                <li>Click "Export ICS File" to download the calendar file</li>
                                <li>Open Apple Calendar on your Mac or iOS device</li>
                                <li>Go to File → Import → Import Calendar</li>
                                <li>Select the downloaded .ics file</li>
                                <li>Choose which calendar to import to</li>
                                <li>Your research events will now appear in Apple Calendar</li>
                            </ol>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Settings; 