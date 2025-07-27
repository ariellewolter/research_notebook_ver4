import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Tabs,
    Tab,
    IconButton as MuiIconButton,
    List,
    ListItem,
    ListItemText,
    Drawer,
    List as MUIList,
    ListItem as MUIListItem,
    ListItemText as MUIListItemText,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import { Alert, Snackbar } from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Note as NoteIcon,
    Link as LinkIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { notesApi } from '../services/api';
import { linksApi } from '../services/api';
import LinkManager from '../components/Links/LinkManager';
import { useThemePalette } from '../services/ThemePaletteContext';
import { NOTE_TYPE_TO_PALETTE_ROLE } from '../services/colorPalettes';
import Paper from '@mui/material/Paper';
import { useNavigate } from 'react-router-dom';
import ScienceIcon from '@mui/icons-material/Science';
import { protocolsApi } from '../services/api';
import ZoteroCitationModal from '../components/Zotero/ZoteroCitationModal';
import jsPDF from 'jspdf';
import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { BibtexParser } from '@orcid/bibtex-parse-js';
import ImportExportDialog from '../components/ImportExportDialog';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { databaseApi } from '../services/api';
import { projectsApi } from '../services/api';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useWorkspaceTabs } from './WorkspaceTabsContext';
import { createNoteTab } from '../services/tabUtils';

interface Note {
    id: string;
    title: string;
    content: string;
    type: 'daily' | 'experiment' | 'literature';
    date: string;
    createdAt: string;
    experimentId?: string;
}

interface Protocol {
    id: string;
    name: string;
    description: string;
    category: string;
    version: string;
    difficulty: string;
    expectedDuration: string;
    steps: Array<{ id: string; title: string; description: string }>;
}

// Utility to parse and render [[...]] links in note content
function renderNoteContentWithLinks(content: string, notes: Note[], navigate: (id: string) => void) {
    const parts = [];
    let lastIndex = 0;
    const linkRegex = /\[\[([^\]]+)\]\]/g;
    let match;
    let key = 0;
    while ((match = linkRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            parts.push(<span key={key++}>{content.slice(lastIndex, match.index)}</span>);
        }
        const linkText = match[1];
        // Find note by title
        const targetNote = notes.find(n => n.title === linkText);
        parts.push(
            <span
                key={key++}
                style={{ color: targetNote ? '#1976d2' : '#888', cursor: targetNote ? 'pointer' : 'not-allowed', textDecoration: targetNote ? 'underline' : 'none' }}
                onClick={() => {
                    if (targetNote) navigate(targetNote.id);
                    else alert(`No note found with title: ${linkText}`);
                }}
                title={targetNote ? `Go to ${linkText}` : `No note found with title: ${linkText}`}
            >
                {linkText}
            </span>
        );
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
        parts.push(<span key={key++}>{content.slice(lastIndex)}</span>);
    }
    return parts;
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

function renderContentWithEntities(text: string, entries: any[], onEntityClick: (entry: any) => void) {
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

const Notes: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });
    const [openLinkManager, setOpenLinkManager] = useState(false);
    const [selectedNoteId, setSelectedNoteId] = useState<string>('');

    // Protocols state
    const [protocols, setProtocols] = useState<any[]>([]);
    const [protocolsLoading, setProtocolsLoading] = useState(true);
    const [protocolsError, setProtocolsError] = useState<string | null>(null);

    // 1. Add state for allEntities and fetch them on mount for use in entity suggestions.
    const [allEntities, setAllEntities] = useState<any[]>([]);

    const navigate = useNavigate();

    // Use the global tab system
    const { openTab } = useWorkspaceTabs();

    // Open a note in the global tab system
    const openNoteInTab = (note: Note) => {
        const tabData = createNoteTab(note.id, note.title);
        openTab(tabData);
    };

    // Remove the old tab system functions (openProtocolTab, closeTab, renderTabContent)

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'daily' as 'daily' | 'experiment' | 'literature',
        date: new Date().toISOString().split('T')[0],
    });

    // Autocomplete state for [[...]]
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [autocompleteOptions, setAutocompleteOptions] = useState<any[]>([]);
    const [autocompleteQuery, setAutocompleteQuery] = useState('');
    const [autocompleteAnchor, setAutocompleteAnchor] = useState<{ top: number; left: number } | null>(null);
    const [autocompleteSelected, setAutocompleteSelected] = useState(0);

    const { palette } = useThemePalette();

    // Load notes on component mount
    useEffect(() => {
        loadNotes();
    }, []);

    // Load protocols on mount
    useEffect(() => {
        const loadProtocols = async () => {
            try {
                setProtocolsLoading(true);
                const res = await protocolsApi.getAll();
                setProtocols(res.data.protocols || res.data || []);
                setProtocolsError(null);
            } catch (err: any) {
                setProtocolsError(err.response?.data?.error || 'Failed to load protocols');
            } finally {
                setProtocolsLoading(false);
            }
        };
        loadProtocols();
    }, []);

    // 1. Add state for allEntities and fetch them on mount for use in entity suggestions.
    useEffect(() => {
        async function fetchEntities() {
            const protocols = await protocolsApi.getAll().then(res => res.data.protocols || res.data || []);
            const databaseEntries = await databaseApi.getAll().then(res => res.data.entries || res.data || []);
            const projects = await projectsApi.getAll().then(res => res.data || []);
            setAllEntities([
                ...protocols.map((p: any) => ({ ...p, type: 'protocol' })),
                ...databaseEntries.map((d: any) => ({ ...d, type: 'databaseEntry' })),
                ...projects.map((pr: any) => ({ ...pr, type: 'project' })),
            ]);
        }
        fetchEntities();
    }, []);

    const loadNotes = async () => {
        try {
            setLoading(true);
            const response = await notesApi.getAll();
            setNotes(response.data.notes || response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load notes');
            console.error('Error loading notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (note?: Note) => {
        if (note) {
            setEditingNote(note);
            setFormData({
                title: note.title,
                content: note.content,
                type: note.type,
                date: note.date,
            });
        } else {
            setEditingNote(null);
            setFormData({
                title: '',
                content: '',
                type: 'daily',
                date: new Date().toISOString().split('T')[0],
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingNote(null);
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            setSnackbar({
                open: true,
                message: 'Please fill in all required fields',
                severity: 'error',
            });
            return;
        }

        try {
            setSaving(true);
            if (editingNote) {
                // Update existing note
                await notesApi.update(editingNote.id, formData);
                setSnackbar({
                    open: true,
                    message: 'Note updated successfully',
                    severity: 'success',
                });
            } else {
                // Create new note
                await notesApi.create(formData);
                setSnackbar({
                    open: true,
                    message: 'Note created successfully',
                    severity: 'success',
                });
            }
            handleCloseDialog();
            loadNotes(); // Reload notes
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to save note',
                severity: 'error',
            });
            console.error('Error saving note:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this note?')) {
            return;
        }

        try {
            await notesApi.delete(id);
            setSnackbar({
                open: true,
                message: 'Note deleted successfully',
                severity: 'success',
            });
            loadNotes(); // Reload notes
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to delete note',
                severity: 'error',
            });
            console.error('Error deleting note:', err);
        }
    };

    const getTypeColor = (type: string) => {
        const role = NOTE_TYPE_TO_PALETTE_ROLE[type] || 'background';
        return palette[role];
    };

    // Helper: fetch suggestions for [[...]]
    const fetchAutocompleteOptions = async (query: string) => {
        try {
            const res = await linksApi.search(query);
            setAutocompleteOptions(res.data || []);
        } catch (e) {
            setAutocompleteOptions([]);
        }
    };

    // Handler for content change with autocomplete
    const handleContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, content: value });

        // Find last [[... in the text
        const cursor = e.target.selectionStart || 0;
        const beforeCursor = value.slice(0, cursor);
        const match = beforeCursor.match(/\[\[([^\]]*)$/);
        if (match) {
            setAutocompleteQuery(match[1]);
            setShowAutocomplete(true);
            fetchAutocompleteOptions(match[1]);
            // Calculate anchor position (basic, not pixel-perfect)
            const textarea = e.target;
            const rect = textarea.getBoundingClientRect();
            setAutocompleteAnchor({ top: rect.top + 24, left: rect.left + 16 });
        } else {
            setShowAutocomplete(false);
        }
    };

    // Handler for selecting an autocomplete option
    const handleAutocompleteSelect = (option: any) => {
        // Insert [[option.title]] at the cursor position
        const textarea = document.activeElement as HTMLTextAreaElement;
        if (!textarea) return;
        const cursor = textarea.selectionStart || 0;
        const value = formData.content;
        const before = value.slice(0, cursor).replace(/\[\[[^\]]*$/, '');
        const after = value.slice(cursor);
        const insert = `[[${option.title}]]`;
        const newValue = before + insert + after;
        setFormData({ ...formData, content: newValue });
        setShowAutocomplete(false);
        setAutocompleteOptions([]);
        setAutocompleteQuery('');
    };

    // Keyboard navigation for autocomplete
    const handleContentKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (showAutocomplete && autocompleteOptions.length > 0) {
            if (e.key === 'ArrowDown') {
                setAutocompleteSelected((prev) => (prev + 1) % autocompleteOptions.length);
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                setAutocompleteSelected((prev) => (prev - 1 + autocompleteOptions.length) % autocompleteOptions.length);
                e.preventDefault();
            } else if (e.key === 'Enter') {
                handleAutocompleteSelect(autocompleteOptions[autocompleteSelected]);
                e.preventDefault();
            } else if (e.key === 'Escape') {
                setShowAutocomplete(false);
            }
        }
    };

    const [zoteroModalOpen, setZoteroModalOpen] = useState(false);

    const contentRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    const handleInsertCitation = (citation: { id: number; title: string }) => {
        // Example: parse author/year from title string
        // e.g., 'Smith et al. (2022) - "CRISPR in Yeast"'
        const match = citation.title.match(/^(.*?) \((\d{4})\)/);
        const citeText = match ? `(${match[1]}, ${match[2]})` : citation.title;
        const textarea = contentRef.current;
        if (!textarea) return;
        const cursor = textarea.selectionStart || 0;
        const value = formData.content;
        const before = value.slice(0, cursor);
        const after = value.slice(cursor);
        const newValue = before + citeText + after;
        setFormData({ ...formData, content: newValue });
        setZoteroModalOpen(false);
        setTimeout(() => {
            // Restore focus and move cursor after inserted citation
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = cursor + citeText.length;
        }, 0);
    };

    // Add at the top or import from a shared utility if available
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

    function handleExportPDF() {
        const doc = new jsPDF();
        const citations = notes.map(n => formatCitation(n, getCitationStyle())).join("\n\n");
        doc.text(citations, 10, 10);
        doc.save("notes-citations.pdf");
    }
    function handleExportWord() {
        const doc = new DocxDocument({
            sections: [{
                properties: {},
                children: notes.map(n => new Paragraph({ children: [new TextRun(formatCitation(n, getCitationStyle()))] }))
            }]
        });
        Packer.toBlob(doc).then(blob => saveAs(blob, "notes-citations.docx"));
    }
    function handleExportBibTeX() {
        // Notes do not have authors, journal, year, doi fields. Export only title and content.
        const bibtex = notes.map(n => `@misc{${n.id},\n  title={${n.title}},\n  note={${n.content}}\n}`).join("\n\n");
        const blob = new Blob([bibtex], { type: 'text/x-bibtex' });
        saveAs(blob, "notes-citations.bib");
    }
    function handleExportMarkdown() {
        // Notes do not have citation fields, just export title and content
        const md = notes.map(n => `- **${n.title}**\n\n${n.content}`).join("\n\n");
        const blob = new Blob([md], { type: 'text/markdown' });
        saveAs(blob, "notes-citations.md");
    }

    const [importExportOpen, setImportExportOpen] = useState(false);

    const handleImport = async (rows: any[]) => {
        for (const row of rows) {
            await notesApi.create(row);
        }
        await loadNotes();
        setSnackbar({ open: true, message: 'Import successful!', severity: 'success' });
    };
    const handleExport = (format: 'csv' | 'json' | 'xlsx') => {
        const exportData = notes.map(n => ({
            title: n.title,
            content: n.content,
            type: n.type,
            date: n.date,
            createdAt: n.createdAt,
        }));
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            saveAs(blob, 'notes.json');
        } else if (format === 'csv') {
            const csv = Papa.unparse(exportData);
            const blob = new Blob([csv], { type: 'text/csv' });
            saveAs(blob, 'notes.csv');
        } else if (format === 'xlsx') {
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Notes');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            saveAs(blob, 'notes.xlsx');
        }
        setSnackbar({ open: true, message: `Exported as ${format.toUpperCase()}`, severity: 'success' });
    };

    const NOTE_FIELDS = [
        { key: 'title', label: 'Title' },
        { key: 'content', label: 'Content' },
        { key: 'type', label: 'Type' },
        { key: 'date', label: 'Date' },
        { key: 'createdAt', label: 'Created At' },
    ];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
                {/* Left: Current Notes */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Current Notes (Active Projects/Experiments)</Typography>
                            {/* Placeholder: Expandable list grouped by project/experiment */}
                            {[{ name: 'Project Alpha', notes: ['Note 1', 'Note 2'] }, { name: 'Experiment Beta', notes: ['Note 3'] }].map((group, idx) => (
                                <Accordion key={group.name} defaultExpanded={idx === 0}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography>{group.name}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <List>
                                            {group.notes.map(note => (
                                                <ListItem key={note} button>
                                                    <ListItemText primary={note} secondary="Last edited: ... | Status: ..." />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
                {/* Right: Quick Actions */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                            <Button variant="contained" fullWidth sx={{ mb: 1 }} onClick={() => handleOpenDialog()}>New Note</Button>
                            <Button variant="outlined" fullWidth sx={{ mb: 1 }}>Import</Button>
                            <Button variant="outlined" fullWidth sx={{ mb: 1 }}>Export</Button>
                            <Button variant="outlined" fullWidth sx={{ mb: 1 }}>Browse Tags</Button>
                            <Button variant="outlined" fullWidth sx={{ mb: 1 }}>Create Project/Experiment</Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            {/* Middle Section: Recents and Recent Activity */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Recent Notes</Typography>
                            {/* List of recent notes with click to open in tab */}
                            <List>
                                {notes.slice(0, 5).map(note => (
                                    <ListItem key={note.id} button onClick={() => openNoteInTab(note)}>
                                        <ListItemText 
                                            primary={note.title} 
                                            secondary={`Edited: ${new Date(note.createdAt).toLocaleDateString()} | Type: ${note.type}`} 
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                            {/* Placeholder: List of recent activity */}
                            <List>
                                {["Created Note 1", "Edited Note 2", "Favorited Note 3"].map(activity => (
                                    <ListItem key={activity}>
                                        <ListItemText primary={activity} secondary="Timestamp..." />
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

export default Notes; 