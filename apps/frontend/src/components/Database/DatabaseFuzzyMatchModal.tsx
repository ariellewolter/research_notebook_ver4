import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemText, Typography, Box } from '@mui/material';

interface DatabaseFuzzyMatchModalProps {
    open: boolean;
    matches: Array<{ id: string; name: string; type: string; description?: string; score?: number; matches?: Array<{ key: string; value: string; indices: [number, number][] }> }>;
    zoteroItem: { title: string; type: string };
    onSelectMatch: (entryId: string) => void;
    onCreateNew: () => void;
    onClose: () => void;
}

function highlightMatch(text: string, indices: [number, number][] = []): React.ReactNode {
    if (!indices.length) return <span>{text}</span>;
    let last = 0;
    const parts = indices.map(([start, end], i) => {
        const before = text.slice(last, start);
        const match = text.slice(start, end + 1);
        last = end + 1;
        return (
            <React.Fragment key={i}>
                {before}
                <span style={{ background: '#ffe082', fontWeight: 600 }}>{match}</span>
            </React.Fragment>
        );
    });
    parts.push(<span key="last">{text.slice(last)}</span>);
    return parts;
}

const DatabaseFuzzyMatchModal: React.FC<DatabaseFuzzyMatchModalProps> = ({ open, matches, zoteroItem, onSelectMatch, onCreateNew, onClose }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Match Zotero Item to Database Entry</DialogTitle>
            <DialogContent>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Zotero Item: <strong>{zoteroItem.title}</strong> ({zoteroItem.type})
                </Typography>
                {matches.length > 0 ? (
                    <>
                        <Typography variant="body2" sx={{ mb: 1 }}>Possible matches found in your database:</Typography>
                        <List>
                            {matches.map(match => (
                                <ListItem key={match.id} alignItems="flex-start" sx={{ mb: 1 }}>
                                    <ListItemText
                                        primary={
                                            <Box>
                                                <strong>{highlightMatch(match.name, match.matches?.find(m => m.key === 'name')?.indices)}</strong>
                                                <span style={{ color: '#888', marginLeft: 8 }}>({match.type})</span>
                                                {typeof match.score === 'number' && (
                                                    <span style={{ color: '#1976d2', marginLeft: 12, fontWeight: 500 }}>
                                                        {Math.round((1 - match.score) * 100)}% match
                                                    </span>
                                                )}
                                            </Box>
                                        }
                                        secondary={highlightMatch(match.description || '', match.matches?.find(m => m.key === 'description')?.indices)}
                                    />
                                    <Button variant="outlined" onClick={() => onSelectMatch(match.id)} sx={{ ml: 2 }}>Select</Button>
                                </ListItem>
                            ))}
                        </List>
                        <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>None of these?</Typography>
                        <Button variant="contained" color="primary" onClick={onCreateNew}>Create New Entry</Button>
                    </>
                ) : (
                    <>
                        <Typography variant="body2" sx={{ mb: 2 }}>No matches found in your database.</Typography>
                        <Button variant="contained" color="primary" onClick={onCreateNew}>Create New Entry</Button>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};

export default DatabaseFuzzyMatchModal; 