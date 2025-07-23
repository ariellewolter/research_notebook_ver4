import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, List, ListItem, ListItemText } from '@mui/material';

interface ZoteroCitationModalProps {
    open: boolean;
    onClose: () => void;
    onSelectCitation: (citation: any) => void;
}

const ZoteroCitationModal: React.FC<ZoteroCitationModalProps> = ({ open, onClose, onSelectCitation }) => {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<number | null>(null);
    // Placeholder results
    const results = [
        { id: 1, title: 'Smith et al. (2022) - "CRISPR in Yeast"' },
        { id: 2, title: 'Johnson & Lee (2021) - "Protein Folding"' },
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Cite from Zotero</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="Search Zotero"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <List>
                    {results.map((item, idx) => (
                        <ListItem
                            key={item.id}
                            button
                            selected={selected === idx}
                            onClick={() => setSelected(idx)}
                        >
                            <ListItemText primary={item.title} />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={() => selected !== null && onSelectCitation(results[selected])}
                    variant="contained"
                    disabled={selected === null}
                >
                    Insert Cite
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ZoteroCitationModal; 