import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Chip, Divider, Drawer, List, ListItem, ListItemText, Tooltip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { linksApi } from '../services/api';

interface EntityLinksSidebarProps {
    entityType: 'protocol' | 'recipe';
    entityId: string;
    open: boolean;
    onClose: () => void;
}

const ENTITY_LABELS: Record<string, string> = {
    note: 'Notes',
    experiment: 'Experiments',
    project: 'Projects',
    protocol: 'Protocols',
    recipe: 'Recipes',
    pdf: 'PDFs',
    databaseEntry: 'Database Entries',
};

const EntityLinksSidebar: React.FC<EntityLinksSidebarProps> = ({ entityType, entityId, open, onClose }) => {
    const [outgoing, setOutgoing] = useState<any[]>([]);
    const [backlinks, setBacklinks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        Promise.all([
            linksApi.getOutgoing(entityType, entityId),
            linksApi.getBacklinks(entityType, entityId),
        ]).then(([outRes, backRes]) => {
            setOutgoing(outRes.data || []);
            setBacklinks(backRes.data || []);
        }).finally(() => setLoading(false));
    }, [entityType, entityId, open]);

    // Group links by targetType/sourceType
    const groupLinks = (links: any[], direction: 'outgoing' | 'incoming') => {
        const groups: Record<string, any[]> = {};
        links.forEach(link => {
            const type = direction === 'outgoing' ? link.targetType : link.sourceType;
            if (!groups[type]) groups[type] = [];
            groups[type].push(link);
        });
        return groups;
    };

    const outgoingGroups = groupLinks(outgoing, 'outgoing');
    const backlinkGroups = groupLinks(backlinks, 'incoming');

    return (
        <Drawer
            variant="persistent"
            anchor="left"
            open={open}
            sx={{ width: 320, flexShrink: 0, '& .MuiDrawer-paper': { width: 320, boxSizing: 'border-box' } }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: '1px solid #eee' }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Connections
                </Typography>
                <Tooltip title="Collapse Sidebar">
                    <IconButton onClick={onClose} size="small">
                        <ChevronLeftIcon />
                    </IconButton>
                </Tooltip>
            </Box>
            <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
                {loading ? (
                    <Typography variant="body2">Loading...</Typography>
                ) : (
                    <>
                        {/* Outgoing Links */}
                        {Object.keys(outgoingGroups).map(type => (
                            <Box key={type} sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>{ENTITY_LABELS[type] || type}</Typography>
                                <List dense>
                                    {outgoingGroups[type].map(link => (
                                        <ListItem key={link.id} button>
                                            <ListItemText
                                                primary={link[link.targetType]?.name || link[link.targetType]?.title || link[link.targetType]?.id || 'Untitled'}
                                                secondary={link.targetType}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        ))}
                        <Divider sx={{ my: 2 }} />
                        {/* Incoming Links */}
                        {Object.keys(backlinkGroups).map(type => (
                            <Box key={type} sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Backlinked from {ENTITY_LABELS[type] || type}</Typography>
                                <List dense>
                                    {backlinkGroups[type].map(link => (
                                        <ListItem key={link.id} button>
                                            <ListItemText
                                                primary={link[link.sourceType]?.name || link[link.sourceType]?.title || link[link.sourceType]?.id || 'Untitled'}
                                                secondary={link.sourceType}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        ))}
                    </>
                )}
            </Box>
        </Drawer>
    );
};

export default EntityLinksSidebar; 