import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, LinearProgress, List, ListItem, ListItemText, Divider, CircularProgress } from '@mui/material';
import { protocolsApi } from '../services/api';

const ProtocolDashboard: React.FC = () => {
    const [protocols, setProtocols] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        protocolsApi.getAll()
            .then(res => setProtocols(res.data.protocols || []))
            .catch(err => setError('Failed to load protocols'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    if (error) return <Box sx={{ p: 4 }}><Typography color="error">{error}</Typography></Box>;

    // Aggregate stats
    const totalProtocols = protocols.length;
    const totalSteps = protocols.reduce((sum, p) => sum + (p.steps?.length || 0), 0);
    const avgSteps = totalProtocols > 0 ? Math.round(totalSteps / totalProtocols) : 0;
    // Recent runs: treat each protocol as a "run" for demo, or use executions if available
    const recentRuns = protocols.slice(-3).reverse().map(p => ({
        name: p.name,
        status: 'completed', // Placeholder, replace with real status if available
        progress: 100, // Placeholder, replace with real progress if available
        date: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
    }));
    // Weekly activity: count protocols created per day in the last week
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
    const weeklyActivity = Array(7).fill(0);
    protocols.forEach(p => {
        const d = new Date(p.createdAt);
        if (d >= weekAgo) {
            const day = d.getDay();
            weeklyActivity[day === 0 ? 6 : day - 1] += 1; // Mon=0, Sun=6
        }
    });
    // Recent activity: show recent protocol creations/edits
    const recentActivity = protocols.slice(-5).reverse().map(p => ({
        text: `Created protocol: ${p.name}`,
        time: p.createdAt ? new Date(p.createdAt).toLocaleString() : '',
    }));

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>Protocols Dashboard</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Total Protocols</Typography>
                            <Typography variant="h4">{totalProtocols}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Total Steps</Typography>
                            <Typography variant="h4">{totalSteps}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Avg Steps/Protocol</Typography>
                            <Typography variant="h4">{avgSteps}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 2 }}>
                {/* Recent Runs */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>Recent Runs</Typography>
                            {recentRuns.map((run, i) => (
                                <Box key={i} sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle1">{run.name}</Typography>
                                        <Chip label={run.status} color={run.status === 'completed' ? 'success' : run.status === 'active' ? 'primary' : 'warning'} size="small" />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">{run.date}</Typography>
                                    <LinearProgress variant="determinate" value={run.progress} sx={{ height: 8, borderRadius: 2, my: 1 }} color={run.status === 'completed' ? 'success' : run.status === 'active' ? 'primary' : 'warning'} />
                                    <Typography variant="caption">Progress: {run.progress}%</Typography>
                                    <Divider sx={{ my: 1 }} />
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
                {/* Quick Actions & Task Summary */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6">Quick Actions</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                <Button variant="contained" color="success" sx={{ mb: 1 }}>Log Run</Button>
                                <Button variant="contained" color="primary" sx={{ mb: 1 }}>Add Protocol</Button>
                                <Button variant="contained" color="warning" sx={{ mb: 1 }}>Link Entity</Button>
                            </Box>
                        </CardContent>
                    </Card>
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6">Task Summary</Typography>
                            <List>
                                <ListItem><ListItemText primary="Completed" /><Chip label={5} color="success" /></ListItem>
                                <ListItem><ListItemText primary="In Progress" /><Chip label={2} color="warning" /></ListItem>
                                <ListItem><ListItemText primary="Overdue" /><Chip label={1} color="error" /></ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 2 }}>
                {/* Weekly Activity & Recent Activity */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6">Weekly Activity</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mt: 2 }}>
                                {weeklyActivity.map((val, i) => (
                                    <Box key={i} sx={{ textAlign: 'center' }}>
                                        <Box sx={{ width: 24, height: val * 8, bgcolor: 'primary.main', borderRadius: 1, mb: 0.5 }} />
                                        <Typography variant="caption">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                {/* Recent Activity */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Recent Activity</Typography>
                            <List>
                                {recentActivity.map((a, i) => (
                                    <ListItem key={i}>
                                        <ListItemText primary={a.text} secondary={a.time} />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProtocolDashboard; 