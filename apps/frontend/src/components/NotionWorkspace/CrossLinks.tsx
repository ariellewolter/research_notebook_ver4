import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Button,
    Collapse,
    Divider,
    CircularProgress,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Link as LinkIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Science as ScienceIcon,
    Assignment as ProjectIcon,
    Build as ProtocolIcon,
    Restaurant as RecipeIcon,
    MenuBook as LiteratureIcon,
    Task as TaskIcon,
    PictureAsPdf as PdfIcon,
    Storage as DatabaseIcon,
    Description as NoteIcon,
    OpenInNew as OpenInNewIcon,
    Add as AddIcon
} from '@mui/icons-material';

export interface CrossLink {
    id: string;
    sourceType: string;
    sourceId: string;
    targetType: string;
    targetId: string;
    createdAt: string;
    note?: {
        id: string;
        title: string;
        type: string;
    };
    highlight?: {
        id: string;
        text: string;
        page: number;
        pdf: {
            id: string;
            title: string;
        };
    };
    databaseEntry?: {
        id: string;
        name: string;
        type: string;
    };
}

interface CrossLinksProps {
    blockId: string;
    blockType: string;
    onLinkClick?: (link: CrossLink) => void;
    onAddLink?: () => void;
}

const CrossLinks: React.FC<CrossLinksProps> = ({
    blockId,
    blockType,
    onLinkClick,
    onAddLink
}) => {
    const [backlinks, setBacklinks] = useState<CrossLink[]>([]);
    const [outgoingLinks, setOutgoingLinks] = useState<CrossLink[]>([]);
    const [loading, setLoading] = useState(false);
    const [backlinksExpanded, setBacklinksExpanded] = useState(true);
    const [outgoingExpanded, setOutgoingExpanded] = useState(true);

    const getIconForType = (type: string) => {
        switch (type) {
            case 'experiment':
                return <ScienceIcon />;
            case 'project':
                return <ProjectIcon />;
            case 'protocol':
                return <ProtocolIcon />;
            case 'recipe':
                return <RecipeIcon />;
            case 'literature':
                return <LiteratureIcon />;
            case 'task':
                return <TaskIcon />;
            case 'pdf':
                return <PdfIcon />;
            case 'database':
            case 'databaseEntry':
                return <DatabaseIcon />;
            case 'note':
                return <NoteIcon />;
            default:
                return <LinkIcon />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'experiment':
                return 'Experiment';
            case 'project':
                return 'Project';
            case 'protocol':
                return 'Protocol';
            case 'recipe':
                return 'Recipe';
            case 'literature':
                return 'Literature';
            case 'task':
                return 'Task';
            case 'pdf':
                return 'PDF';
            case 'database':
            case 'databaseEntry':
                return 'Database';
            case 'note':
                return 'Note';
            default:
                return type;
        }
    };

    const getLinkTitle = (link: CrossLink) => {
        if (link.note) return link.note.title;
        if (link.databaseEntry) return link.databaseEntry.name;
        if (link.highlight) return `${link.highlight.pdf.title} (p.${link.highlight.page})`;
        return 'Unknown';
    };

    const getLinkType = (link: CrossLink) => {
        if (link.note) return link.note.type;
        if (link.databaseEntry) return link.databaseEntry.type;
        if (link.highlight) return 'highlight';
        return link.sourceType || link.targetType;
    };

    const fetchLinks = async () => {
        setLoading(true);
        try {
            // Fetch backlinks (what links to this block)
            const backlinksResponse = await fetch(`/api/links/backlinks/${blockType}/${blockId}`);
            if (backlinksResponse.ok) {
                const backlinksData = await backlinksResponse.json();
                setBacklinks(backlinksData);
            }

            // Fetch outgoing links (what this block links to)
            const outgoingResponse = await fetch(`/api/links/outgoing/${blockType}/${blockId}`);
            if (outgoingResponse.ok) {
                const outgoingData = await outgoingResponse.json();
                setOutgoingLinks(outgoingData);
            }
        } catch (error) {
            console.error('Error fetching links:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (blockId && blockType) {
            fetchLinks();
        }
    }, [blockId, blockType]);

    const handleLinkClick = (link: CrossLink) => {
        if (onLinkClick) {
            onLinkClick(link);
        } else {
            // Default behavior - navigate to the linked item
            const linkType = link.sourceType || link.targetType;
            const linkId = link.sourceId || link.targetId;
            window.open(`/${linkType}/${linkId}`, '_blank');
        }
    };

    const renderLinkItem = (link: CrossLink, isBacklink: boolean = false) => {
        const title = getLinkTitle(link);
        const type = getLinkType(link);
        const icon = getIconForType(type);

        return (
            <ListItem
                key={link.id}
                sx={{
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'grey.50'
                    }
                }}
            >
                <ListItemIcon>
                    {icon}
                </ListItemIcon>
                <ListItemText
                    primary={title}
                    secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip
                                label={getTypeLabel(type)}
                                size="small"
                                variant="outlined"
                                color="primary"
                            />
                            {isBacklink && (
                                <Chip
                                    label="Links to this"
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                />
                            )}
                        </Box>
                    }
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Open link">
                        <IconButton
                            size="small"
                            onClick={() => handleLinkClick(link)}
                        >
                            <OpenInNewIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </ListItem>
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    const hasBacklinks = backlinks.length > 0;
    const hasOutgoingLinks = outgoingLinks.length > 0;

    if (!hasBacklinks && !hasOutgoingLinks) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    No links found
                </Typography>
                {onAddLink && (
                    <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={onAddLink}
                        variant="outlined"
                    >
                        Add Link
                    </Button>
                )}
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            {/* Backlinks Section */}
            {hasBacklinks && (
                <Box sx={{ mb: 3 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 1,
                            cursor: 'pointer'
                        }}
                        onClick={() => setBacklinksExpanded(!backlinksExpanded)}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Links to this ({backlinks.length})
                        </Typography>
                        {backlinksExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Box>
                    <Collapse in={backlinksExpanded}>
                        <List dense>
                            {backlinks.map(link => renderLinkItem(link, true))}
                        </List>
                    </Collapse>
                </Box>
            )}

            {/* Divider */}
            {hasBacklinks && hasOutgoingLinks && (
                <Divider sx={{ my: 2 }} />
            )}

            {/* Outgoing Links Section */}
            {hasOutgoingLinks && (
                <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 1,
                            cursor: 'pointer'
                        }}
                        onClick={() => setOutgoingExpanded(!outgoingExpanded)}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Links from this ({outgoingLinks.length})
                        </Typography>
                        {outgoingExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Box>
                    <Collapse in={outgoingExpanded}>
                        <List dense>
                            {outgoingLinks.map(link => renderLinkItem(link, false))}
                        </List>
                    </Collapse>
                </Box>
            )}

            {/* Add Link Button */}
            {onAddLink && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={onAddLink}
                        variant="outlined"
                    >
                        Add New Link
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default CrossLinks; 