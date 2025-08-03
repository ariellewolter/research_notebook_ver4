import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    Box,
    Divider,
    Switch,
    FormControlLabel,
    Grid,
    Alert,
    IconButton
} from '@mui/material';
import {
    Close as CloseIcon,
    Save as SaveIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Notifications as NotificationsIcon,
    Security as SecurityIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface AccountSettingsProps {
    open: boolean;
    onClose: () => void;
}

interface UserSettings {
    name: string;
    email: string;
    notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
    privacy: {
        profileVisible: boolean;
        activityVisible: boolean;
    };
    preferences: {
        theme: 'light' | 'dark' | 'auto';
        language: string;
        timezone: string;
    };
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ open, onClose }) => {
    const { user, updateUser } = useAuth();
    const [settings, setSettings] = useState<UserSettings>({
        name: user?.name || '',
        email: user?.email || '',
        notifications: {
            email: true,
            push: true,
            sms: false,
        },
        privacy: {
            profileVisible: true,
            activityVisible: false,
        },
        preferences: {
            theme: 'auto',
            language: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setSettings(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
            }));
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Here you would typically call an API to update user settings
            // For now, we'll simulate the update
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (updateUser) {
                updateUser({
                    ...user,
                    name: settings.name,
                    email: settings.email,
                });
            }

            setSuccess('Settings saved successfully');
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setError('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (section: keyof UserSettings, field: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            },
        }));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    maxHeight: '90vh',
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon />
                    <Typography variant="h6">Account Settings</Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Profile Information */}
                    <Grid item xs={12}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <PersonIcon />
                            Profile Information
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    value={settings.name}
                                    onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    value={settings.email}
                                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    {/* Notification Settings */}
                    <Grid item xs={12}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <NotificationsIcon />
                            Notification Settings
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.notifications.email}
                                            onChange={(e) => handleChange('notifications', 'email', e.target.checked)}
                                        />
                                    }
                                    label="Email Notifications"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.notifications.push}
                                            onChange={(e) => handleChange('notifications', 'push', e.target.checked)}
                                        />
                                    }
                                    label="Push Notifications"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.notifications.sms}
                                            onChange={(e) => handleChange('notifications', 'sms', e.target.checked)}
                                        />
                                    }
                                    label="SMS Notifications"
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    {/* Privacy Settings */}
                    <Grid item xs={12}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <SecurityIcon />
                            Privacy Settings
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.privacy.profileVisible}
                                            onChange={(e) => handleChange('privacy', 'profileVisible', e.target.checked)}
                                        />
                                    }
                                    label="Make Profile Visible to Others"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.privacy.activityVisible}
                                            onChange={(e) => handleChange('privacy', 'activityVisible', e.target.checked)}
                                        />
                                    }
                                    label="Show Activity to Others"
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    {/* Preferences */}
                    <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Preferences
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Theme"
                                    value={settings.preferences.theme}
                                    onChange={(e) => handleChange('preferences', 'theme', e.target.value)}
                                    SelectProps={{
                                        native: true,
                                    }}
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="auto">Auto</option>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Language"
                                    value={settings.preferences.language}
                                    onChange={(e) => handleChange('preferences', 'language', e.target.value)}
                                    SelectProps={{
                                        native: true,
                                    }}
                                >
                                    <option value="en">English</option>
                                    <option value="es">Spanish</option>
                                    <option value="fr">French</option>
                                    <option value="de">German</option>
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Timezone"
                                    value={settings.preferences.timezone}
                                    onChange={(e) => handleChange('preferences', 'timezone', e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save Settings'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AccountSettings; 