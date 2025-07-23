import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Storage as DatabaseIcon,
    Science as ChemicalIcon,
    Biotech as GeneIcon,
    TrendingUp as GrowthFactorIcon,
    MenuBook as ProtocolIcon,
} from '@mui/icons-material';
import { databaseApi } from '../../services/api';

interface DatabaseStats {
    total: number;
    byType: Record<string, number>;
    recent: Array<{
        id: string;
        name: string;
        type: string;
        createdAt: string;
    }>;
}

const DatabaseStats: React.FC = () => {
    const [stats, setStats] = useState<DatabaseStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const response = await databaseApi.getStats();
            setStats(response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load database statistics');
            console.error('Error loading database stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'CHEMICAL':
                return <ChemicalIcon />;
            case 'GENE':
                return <GeneIcon />;
            case 'GROWTH_FACTOR':
                return <GrowthFactorIcon />;
            case 'PROTOCOL':
                return <ProtocolIcon />;
            default:
                return <DatabaseIcon />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'CHEMICAL':
                return 'primary';
            case 'GENE':
                return 'secondary';
            case 'GROWTH_FACTOR':
                return 'success';
            case 'PROTOCOL':
                return 'warning';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    if (!stats) {
        return null;
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Database Overview
            </Typography>

            <Grid container spacing={2}>
                {/* Total Entries */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <DatabaseIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h4" component="div">
                                {stats.total}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Entries
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Entries by Type */}
                {Object.entries(stats.byType).map(([type, count]) => (
                    <Grid item xs={12} sm={6} md={3} key={type}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                {getTypeIcon(type)}
                                <Typography variant="h4" component="div" sx={{ mt: 1 }}>
                                    {count}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {type.replace('_', ' ')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Recent Entries */}
            {stats.recent.length > 0 && (
                <Card sx={{ mt: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Recent Entries
                        </Typography>
                        <List>
                            {stats.recent.map((entry) => (
                                <ListItem key={entry.id} divider>
                                    <ListItemIcon>
                                        {getTypeIcon(entry.type)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={entry.name}
                                        secondary={`${entry.type.replace('_', ' ')} • ${new Date(entry.createdAt).toLocaleDateString()}`}
                                    />
                                    <Chip
                                        label={entry.type.replace('_', ' ')}
                                        size="small"
                                        color={getTypeColor(entry.type)}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default DatabaseStats; 