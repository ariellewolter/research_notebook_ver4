import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Chip,
    Drawer,
    List as MUIList,
    ListItem as MUIListItem,
    ListItemText as MUIListItemText,
    Card,
    CardContent,
    Grid,
    Paper,
    Tabs,
    Tab,
    Badge,
    Tooltip,
    Divider,
    Alert,
    Snackbar,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Book as BookIcon,
    Article as ArticleIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
    Label as LabelIcon,
    Link as LinkIcon,
    Visibility as ViewIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { LiteratureNote } from '../../../../packages/shared/types';
import { databaseApi, literatureNotesApi } from '../services/api';
import type { DatabaseEntry } from '../../../../packages/shared/types';
import ZoteroCitationModal from '../components/Zotero/ZoteroCitationModal';
import ZoteroConfig from '../components/Zotero/ZoteroConfig';
import AdvancedCitationExport from '../components/Export/AdvancedCitationExport';
import ZoteroDragDrop from '../components/Zotero/ZoteroDragDrop';
import jsPDF from 'jspdf';
import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { BibtexParser } from '@orcid/bibtex-parse-js';
import { linksApi } from '../services/api';
import ImportExportDialog from '../components/ImportExportDialog';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

function getCitationStyle() {
    return localStorage.getItem('biblioStyle') || 'apa';
}

function formatCitation(note: any, style: string) {
    const author = note.authors || '';
    const year = note.year || '';
    const title = note.title || '';
    const journal = note.journal || '';
    const doi = note.doi ? `https://doi.org/${note.doi}` : '';
    switch (style) {
        case 'mla':
            return `${author}. "${title}." ${journal}, ${year}. ${doi}`;
        case 'chicago':
            return `${author}. "${title}." ${journal} (${year}). ${doi}`;
        case 'apa':
        default:
            return `${author} (${year}). ${title}. ${journal}. ${doi}`;
    }
}

// Utility: Fuzzy match entity names in text and return match positions
function findEntityMentions(text: string, entries: any[]): { start: number, end: number, entry: any }[] {
    const matches: { start: number, end: number, entry: any }[] = [];
    if (!text) return matches;
    for (const entry of entries) {
        const names = [entry.name, ...(entry.properties?.synonyms || [])];
        for (const name of names) {
            if (!name) continue;
            const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({ start: match.index, end: match.index + match[0].length, entry });
            }
        }
    }
    return matches;
}

function renderTextWithEntities(text: string, entries: any[], onEntityClick: (entry: any) => void) {
    const mentions = findEntityMentions(text, entries).sort((a, b) => a.start - b.start);
    if (mentions.length === 0) return text;
    const parts = [];
    let last = 0;
    mentions.forEach((m, i) => {
        if (m.start > last) parts.push(<span key={last}>{text.slice(last, m.start)}</span>);
        parts.push(
            <span
                key={m.start}
                style={{ textDecoration: 'underline', color: '#1976d2', cursor: 'pointer', fontWeight: 500 }}
                onClick={() => onEntityClick(m.entry)}
                title={`Go to ${m.entry.name}`}
            >
                {text.slice(m.start, m.end)}
            </span>
        );
        last = m.end;
    });
    if (last < text.length) parts.push(<span key={last}>{text.slice(last)}</span>);
    return parts;
}

const LITNOTE_FIELDS = [
    { key: 'title', label: 'Title' },
    { key: 'authors', label: 'Authors' },
    { key: 'year', label: 'Year' },
    { key: 'journal', label: 'Journal' },
    { key: 'doi', label: 'DOI' },
    { key: 'abstract', label: 'Abstract' },
    { key: 'tags', label: 'Tags' },
    { key: 'citation', label: 'Citation' },
    { key: 'synonyms', label: 'Synonyms' },
    { key: 'userNote', label: 'User Note' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
];

const LiteratureNotes: React.FC = () => {
    const [notes, setNotes] = useState<LiteratureNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Partial<LiteratureNote> | null>(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [allEntries, setAllEntries] = useState<DatabaseEntry[]>([]);
    const [entrySearch, setEntrySearch] = useState('');
    const [zoteroModalOpen, setZoteroModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filterAuthor, setFilterAuthor] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterTag, setFilterTag] = useState('');
    const [filterEntry, setFilterEntry] = useState('');
    const [entitySidebarOpen, setEntitySidebarOpen] = useState(false);
    const [entityMentions, setEntityMentions] = useState<{ start: number, end: number, entry: any }[]>([]);
    const [importExportOpen, setImportExportOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    const [zoteroConfigOpen, setZoteroConfigOpen] = useState(false);
    const [advancedExportOpen, setAdvancedExportOpen] = useState(false);
    const [zoteroDragDropOpen, setZoteroDragDropOpen] = useState(false);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    useEffect(() => {
        fetchNotes();
        fetchEntries();
    }, []);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const response = await literatureNotesApi.getAll();
            setNotes(response.data);
        } catch (error) {
            console.error('Error fetching literature notes:', error);
            setSnackbar({ open: true, message: 'Failed to fetch literature notes', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchEntries = async () => {
        try {
            const response = await databaseApi.getAll();
            setAllEntries(response.data);
        } catch (error) {
            console.error('Error fetching database entries:', error);
        }
    };

    const handleOpenEntity = (entry: any) => {
        console.log('Opening entity:', entry);
        // TODO: Implement navigation to entity details
    };

    const handleOpen = (note?: LiteratureNote) => {
        setEditing(note || { title: '', authors: '', year: '', journal: '', doi: '', abstract: '', tags: '', citation: '', synonyms: '', userNote: '' });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditing(null);
    };

    const handleSave = async () => {
        if (!editing) return;
        try {
            let saved;
            if (editing.id) {
                const response = await literatureNotesApi.update(editing.id, editing);
                saved = response.data;
            } else {
                const response = await literatureNotesApi.create(editing);
                saved = response.data;
            }

            setNotes((prev) => {
                const idx = prev.findIndex((n) => n.id === saved.id);
                if (idx >= 0) {
                    const copy = [...prev];
                    copy[idx] = saved;
                    return copy;
                }
                return [saved, ...prev];
            });

            setSnackbar({ open: true, message: 'Literature note saved successfully', severity: 'success' });
            handleClose();
        } catch (error) {
            console.error('Error saving literature note:', error);
            setSnackbar({ open: true, message: 'Failed to save literature note', severity: 'error' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this literature note?')) {
            return;
        }

        try {
            await literatureNotesApi.delete(id);
            setNotes(prev => prev.filter(note => note.id !== id));
            setSnackbar({ open: true, message: 'Literature note deleted successfully', severity: 'success' });
        } catch (error) {
            console.error('Error deleting literature note:', error);
            setSnackbar({ open: true, message: 'Failed to delete literature note', severity: 'error' });
        }
    };

    function handleExportPDF() {
        const doc = new jsPDF();
        const citations = notes.map(n => formatCitation(n, getCitationStyle())).join("\n\n");
        doc.text(citations, 10, 10);
        doc.save("literature-citations.pdf");
    }

    function handleExportWord() {
        const doc = new DocxDocument({
            sections: [{
                properties: {},
                children: notes.map(n => new Paragraph({ children: [new TextRun(formatCitation(n, getCitationStyle()))] }))
            }]
        });
        Packer.toBlob(doc).then(blob => saveAs(blob, "literature-citations.docx"));
    }

    function handleExportBibTeX() {
        const bibtex = notes.map(n => `@article{${n.id},\n  title={${n.title}},\n  author={${n.authors}},\n  journal={${n.journal}},\n  year={${n.year}},\n  doi={${n.doi}}\n}`).join("\n\n");
        const blob = new Blob([bibtex], { type: 'text/x-bibtex' });
        saveAs(blob, "literature-citations.bib");
    }

    function handleExportMarkdown() {
        const md = notes.map(n => `- ${formatCitation(n, getCitationStyle())}`).join("\n");
        const blob = new Blob([md], { type: 'text/markdown' });
        saveAs(blob, "literature-citations.md");
    }

    const handleImport = async (rows: any[]) => {
        try {
            for (const row of rows) {
                await literatureNotesApi.create(row);
            }
            await fetchNotes();
            setSnackbar({ open: true, message: 'Import successful!', severity: 'success' });
        } catch (error) {
            console.error('Error importing literature notes:', error);
            setSnackbar({ open: true, message: 'Failed to import literature notes', severity: 'error' });
        }
    };

    const handleExport = (format: 'csv' | 'json' | 'xlsx') => {
        const exportData = notes.map(n => ({
            title: n.title,
            authors: n.authors,
            year: n.year,
            journal: n.journal,
            doi: n.doi,
            abstract: n.abstract,
            tags: n.tags,
            citation: n.citation,
            synonyms: n.synonyms,
            userNote: n.userNote,
            createdAt: n.createdAt,
            updatedAt: n.updatedAt,
        }));
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            saveAs(blob, 'literature-notes.json');
        } else if (format === 'csv') {
            const csv = Papa.unparse(exportData);
            const blob = new Blob([csv], { type: 'text/csv' });
            saveAs(blob, 'literature-notes.csv');
        } else if (format === 'xlsx') {
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'LiteratureNotes');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            saveAs(blob, 'literature-notes.xlsx');
        }
        setSnackbar({ open: true, message: `Exported as ${format.toUpperCase()}`, severity: 'success' });
    };

    const filteredNotes = notes.filter(note =>
        (!search || note.title.toLowerCase().includes(search.toLowerCase())) &&
        (!filterAuthor || (note.authors || '').toLowerCase().includes(filterAuthor.toLowerCase())) &&
        (!filterYear || (note.year || '').includes(filterYear)) &&
        (!filterTag || (note.tags || '').toLowerCase().includes(filterTag.toLowerCase())) &&
        (!filterEntry || (note.relatedEntries || []).includes(filterEntry))
    );

    const renderNoteList = () => (
        <List>
            {filteredNotes.map((note) => (
                <ListItem
                    key={note.id}
                    secondaryAction={
                        <Box>
                            <Tooltip title="View Details">
                                <IconButton onClick={() => setSelectedNoteId(note.id)}>
                                    <ViewIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                                <IconButton onClick={() => handleOpen(note)}>
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton color="error" onClick={() => handleDelete(note.id)}>
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    }
                >
                    <ListItemText
                        primary={
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="subtitle1">{note.title}</Typography>
                                {note.doi && (
                                    <Chip
                                        label="DOI"
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        icon={<LinkIcon />}
                                    />
                                )}
                            </Box>
                        }
                        secondary={
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    {note.authors ? `${note.authors} (${note.year || ''})` : note.year}
                                </Typography>
                                {note.journal && (
                                    <Typography variant="body2" color="text.secondary">
                                        {note.journal}
                                    </Typography>
                                )}
                                {note.tags && (
                                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                                        {note.tags.split(',').map((tag, index) => (
                                            <Chip key={index} label={tag.trim()} size="small" variant="outlined" />
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        }
                    />
                </ListItem>
            ))}
        </List>
    );

    const renderNoteGrid = () => (
        <Grid container spacing={2}>
            {filteredNotes.map((note) => (
                <Grid item xs={12} sm={6} md={4} key={note.id}>
                    <Card
                        sx={{
                            height: '100%',
                            cursor: 'pointer',
                            '&:hover': { boxShadow: 4 }
                        }}
                        onClick={() => setSelectedNoteId(note.id)}
                    >
                        <CardContent>
                            <Typography variant="h6" gutterBottom noWrap>
                                {note.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {note.authors ? `${note.authors} (${note.year || ''})` : note.year}
                            </Typography>
                            {note.journal && (
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {note.journal}
                                </Typography>
                            )}
                            {note.abstract && (
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    {note.abstract.substring(0, 100)}
                                    {note.abstract.length > 100 && '...'}
                                </Typography>
                            )}
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {note.tags && note.tags.split(',').slice(0, 3).map((tag, index) => (
                                    <Chip key={index} label={tag.trim()} size="small" variant="outlined" />
                                ))}
                                {note.tags && note.tags.split(',').length > 3 && (
                                    <Chip label={`+${note.tags.split(',').length - 3}`} size="small" />
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );

    let detailPane = null;
    if (selectedNoteId) {
        const note = notes.find(n => n.id === selectedNoteId);
        if (note) {
            detailPane = (
                <Box sx={{ p: 2, borderLeft: '1px solid #eee', ml: 2, minHeight: '100vh' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5">{note.title}</Typography>
                        <Box>
                            <Tooltip title="Edit">
                                <IconButton onClick={() => handleOpen(note)}>
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Close">
                                <IconButton onClick={() => setSelectedNoteId(null)}>
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    <Grid container spacing={2} mb={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Authors</Typography>
                            <Typography variant="body1">{note.authors || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Year</Typography>
                            <Typography variant="body1">{note.year || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Journal</Typography>
                            <Typography variant="body1">{note.journal || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">DOI</Typography>
                            <Typography variant="body1">
                                {note.doi ? (
                                    <a href={`https://doi.org/${note.doi}`} target="_blank" rel="noopener noreferrer">
                                        {note.doi}
                                    </a>
                                ) : 'N/A'}
                            </Typography>
                        </Grid>
                    </Grid>

                    {note.abstract && (
                        <Box mb={2}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Abstract</Typography>
                            <Typography variant="body1">{note.abstract}</Typography>
                        </Box>
                    )}

                    {note.tags && (
                        <Box mb={2}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Tags</Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {note.tags.split(',').map((tag, index) => (
                                    <Chip key={index} label={tag.trim()} size="small" />
                                ))}
                            </Box>
                        </Box>
                    )}

                    <Box mb={2}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Related Entries</Typography>
                        {note.relatedEntries && note.relatedEntries.length > 0 ? (
                            <Box display="flex" flexWrap="wrap" gap={1}>
                                {note.relatedEntries.map(id => {
                                    const entry = allEntries.find(e => e.id === id);
                                    if (!entry) return null;
                                    return (
                                        <Chip
                                            key={id}
                                            label={`${entry.name} (${entry.type})`}
                                            onDelete={() => {
                                                const updatedNote = { ...note, relatedEntries: (note.relatedEntries || []).filter(eid => eid !== id) };
                                                literatureNotesApi.update(note.id, updatedNote);
                                                setNotes(prev => prev.map(n => n.id === note.id ? updatedNote : n));
                                                setSnackbar({ open: true, message: 'Related entry removed.', severity: 'success' });
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        ) : (
                            <Typography variant="body2">No related entries.</Typography>
                        )}
                    </Box>

                    {note.userNote && (
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Your Notes</Typography>
                            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <ReactMarkdown>{note.userNote}</ReactMarkdown>
                            </Paper>
                        </Box>
                    )}
                </Box>
            );
        }
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Literature Notes
                </Typography>
                <Box display="flex" gap={1}>
                    <Tooltip title="Configure Zotero">
                        <Button variant="outlined" onClick={() => setZoteroConfigOpen(true)}>
                            <BookIcon sx={{ mr: 1 }} />
                            Zotero Config
                        </Button>
                    </Tooltip>
                    <Tooltip title="Import from Zotero">
                        <Button variant="outlined" onClick={() => setZoteroDragDropOpen(true)}>
                            <UploadIcon sx={{ mr: 1 }} />
                            Import Zotero
                        </Button>
                    </Tooltip>
                    <Tooltip title="Advanced Export">
                        <Button variant="outlined" onClick={() => setAdvancedExportOpen(true)}>
                            <DownloadIcon sx={{ mr: 1 }} />
                            Advanced Export
                        </Button>
                    </Tooltip>
                    <Tooltip title="Import/Export">
                        <Button variant="outlined" onClick={() => setImportExportOpen(true)}>
                            <DownloadIcon sx={{ mr: 1 }} />
                            Import/Export
                        </Button>
                    </Tooltip>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                        Add Note
                    </Button>
                </Box>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Search Title"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Author"
                            value={filterAuthor}
                            onChange={e => setFilterAuthor(e.target.value)}
                            InputProps={{
                                startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Year"
                            value={filterYear}
                            onChange={e => setFilterYear(e.target.value)}
                            InputProps={{
                                startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Tag"
                            value={filterTag}
                            onChange={e => setFilterTag(e.target.value)}
                            InputProps={{
                                startAdornment: <LabelIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>View Mode</InputLabel>
                            <Select
                                value={viewMode}
                                onChange={(e) => setViewMode(e.target.value as 'list' | 'grid')}
                                label="View Mode"
                            >
                                <MenuItem value="list">List View</MenuItem>
                                <MenuItem value="grid">Grid View</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={fetchNotes}
                            fullWidth
                        >
                            Refresh
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Content */}
            <Box display="flex">
                <Box sx={{ flex: 1 }}>
                    {viewMode === 'list' ? renderNoteList() : renderNoteGrid()}

                    {filteredNotes.length === 0 && !loading && (
                        <Box textAlign="center" py={4}>
                            <ArticleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                No literature notes found
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {search || filterAuthor || filterYear || filterTag
                                    ? 'Try adjusting your filters'
                                    : 'Create your first literature note to get started'
                                }
                            </Typography>
                        </Box>
                    )}
                </Box>

                {detailPane}
            </Box>

            {/* Dialogs */}
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{editing?.id ? 'Edit Literature Note' : 'Add Literature Note'}</DialogTitle>
                <DialogContent>
                    <Button
                        variant="outlined"
                        sx={{ mb: 2 }}
                        onClick={() => setZoteroModalOpen(true)}
                    >
                        Fetch from Zotero
                    </Button>
                    <TextField fullWidth label="Title" value={editing?.title || ''} onChange={e => setEditing({ ...editing!, title: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth label="Authors" value={editing?.authors || ''} onChange={e => setEditing({ ...editing!, authors: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth label="Year" value={editing?.year || ''} onChange={e => setEditing({ ...editing!, year: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth label="Journal" value={editing?.journal || ''} onChange={e => setEditing({ ...editing!, journal: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth label="DOI" value={editing?.doi || ''} onChange={e => setEditing({ ...editing!, doi: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth label="Abstract" value={editing?.abstract || ''} onChange={e => setEditing({ ...editing!, abstract: e.target.value })} sx={{ mb: 2 }} multiline rows={2} />
                    <TextField fullWidth label="Tags" value={editing?.tags || ''} onChange={e => setEditing({ ...editing!, tags: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth label="Citation" value={editing?.citation || ''} onChange={e => setEditing({ ...editing!, citation: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth label="Synonyms (comma-separated)" value={editing?.synonyms || ''} onChange={e => setEditing({ ...editing!, synonyms: e.target.value })} sx={{ mb: 2 }} />
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">Formatted Citation ({getCitationStyle().toUpperCase()})</Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            {formatCitation(editing || {}, getCitationStyle())}
                        </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>Related Database Entries</Typography>
                        <TextField
                            fullWidth
                            placeholder="Search database entries..."
                            value={entrySearch}
                            onChange={e => setEntrySearch(e.target.value)}
                            sx={{ mb: 1 }}
                            disabled={!editing}
                        />
                        {editing && (
                            <>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                    {(editing.relatedEntries || []).map(id => {
                                        const entry = allEntries.find(e => e.id === id);
                                        if (!entry) return null;
                                        return (
                                            <Chip
                                                key={id}
                                                label={`${entry.name} (${entry.type})`}
                                                onDelete={() => setEditing({ ...editing, relatedEntries: (editing.relatedEntries || []).filter(eid => eid !== id) })}
                                            />
                                        );
                                    })}
                                </Box>
                                <List dense sx={{ maxHeight: 120, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                                    {allEntries.filter(e =>
                                        (!editing.relatedEntries?.includes(e.id)) &&
                                        (e.name.toLowerCase().includes(entrySearch.toLowerCase()) || e.type.toLowerCase().includes(entrySearch.toLowerCase()))
                                    ).slice(0, 10).map(e => (
                                        <ListItem key={e.id} button onClick={() => setEditing({ ...editing, relatedEntries: [...(editing.relatedEntries || []), e.id] })}>
                                            <ListItemText primary={e.name} secondary={e.type} />
                                        </ListItem>
                                    ))}
                                </List>
                            </>
                        )}
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ flex: 1 }}>Your Notes (Markdown Supported)</Typography>
                            <Button size="small" onClick={() => setPreviewMode((p) => !p)}>{previewMode ? 'Edit' : 'Preview'}</Button>
                        </Box>
                        {previewMode ? (
                            <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1, minHeight: 120, background: '#fafafa' }}>
                                <ReactMarkdown>{editing?.userNote || ''}</ReactMarkdown>
                            </Box>
                        ) : (
                            <TextField fullWidth label="Your Notes" value={editing?.userNote || ''} onChange={e => setEditing({ ...editing!, userNote: e.target.value })} multiline rows={4} />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            <ZoteroCitationModal
                open={zoteroModalOpen}
                onClose={() => setZoteroModalOpen(false)}
                onSelectCitation={citation => {
                    const match = citation.title.match(/^(.*?) \((\d{4})\) - "(.*)"/);
                    setEditing(editing => ({
                        ...editing!,
                        title: match ? match[3] : citation.title,
                        authors: match ? match[1] : '',
                        year: match ? match[2] : '',
                        citation: citation.title,
                    }));
                    setZoteroModalOpen(false);
                }}
            />

            <ImportExportDialog
                open={importExportOpen}
                onClose={() => setImportExportOpen(false)}
                entityType="Literature Note"
                fields={LITNOTE_FIELDS}
                onImport={handleImport}
                onExport={handleExport}
                data={notes}
            />

            <ZoteroConfig
                open={zoteroConfigOpen}
                onClose={() => setZoteroConfigOpen(false)}
                onConfigSuccess={() => {
                    setSnackbar({ open: true, message: 'Zotero configured successfully!', severity: 'success' });
                }}
            />

            <AdvancedCitationExport
                open={advancedExportOpen}
                onClose={() => setAdvancedExportOpen(false)}
                literatureNotes={notes}
                projects={[]}
                experiments={[]}
                protocols={[]}
            />

            <ZoteroDragDrop
                open={zoteroDragDropOpen}
                onClose={() => setZoteroDragDropOpen(false)}
                onImportSuccess={(items) => {
                    setSnackbar({ open: true, message: `Successfully imported ${items.length} items from Zotero!`, severity: 'success' });
                    fetchNotes();
                }}
            />

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default LiteratureNotes; 