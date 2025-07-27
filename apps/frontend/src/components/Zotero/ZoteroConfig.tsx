import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Alert,
    Typography,
    Box,
    Link
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

interface ZoteroConfigProps {
    open: boolean;
    onClose: () => void;
    onConfigSuccess: () => void;
}

const ZoteroConfig: React.FC<ZoteroConfigProps> = ({ open, onClose, onConfigSuccess }) => {
    const [config, setConfig] = useState({
        apiKey: '',
        userId: '',
        groupId: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        if (!config.apiKey || !config.userId) {
            setError('API Key and User ID are required');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/zotero/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey: config.apiKey,
                    userId: config.userId,
                    groupId: config.groupId || undefined
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to configure Zotero');
            }

            const result = await response.json();
            setSuccess(true);
            setTimeout(() => {
                onConfigSuccess();
                onClose();
                setSuccess(false);
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Configuration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon />
                    Configure Zotero Integration
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    To use Zotero integration, you need to configure your Zotero API credentials.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Zotero configured successfully! You can now search and import from your library.
                    </Alert>
                )}

                <TextField
                    fullWidth
                    label="Zotero API Key"
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    sx={{ mb: 2 }}
                    type="password"
                    helperText={
                        <span>
                            Get your API key from{' '}
                            <Link href="https://www.zotero.org/settings/keys" target="_blank" rel="noopener">
                                Zotero Settings
                            </Link>
                        </span>
                    }
                />

                <TextField
                    fullWidth
                    label="Zotero User ID"
                    value={config.userId}
                    onChange={(e) => setConfig(prev => ({ ...prev, userId: e.target.value }))}
                    sx={{ mb: 2 }}
                    helperText="Your Zotero user ID (found in your profile URL)"
                />

                <TextField
                    fullWidth
                    label="Group ID (Optional)"
                    value={config.groupId}
                    onChange={(e) => setConfig(prev => ({ ...prev, groupId: e.target.value }))}
                    sx={{ mb: 2 }}
                    helperText="If you want to access a specific group library"
                />

                <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        <strong>How to find your credentials:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        1. Go to{' '}
                        <Link href="https://www.zotero.org/settings/keys" target="_blank" rel="noopener">
                            Zotero Settings → API
                        </Link>
                    </Typography>
                    <Typography variant="body2">
                        2. Create a new API key with library access permissions
                    </Typography>
                    <Typography variant="body2">
                        3. Your User ID is in your profile URL: zotero.org/users/[USER_ID]
                    </Typography>
                </Alert>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading || !config.apiKey || !config.userId}
                    startIcon={loading ? null : <SettingsIcon />}
                >
                    {loading ? 'Configuring...' : 'Save Configuration'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ZoteroConfig; 