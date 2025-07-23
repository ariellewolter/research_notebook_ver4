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

// TabbedWorkspace component
interface TabData {
    id: string;
    title: string;
    type: string; // 'note' | 'protocol'
    content?: string;
    protocol?: Protocol;
}
interface TabbedWorkspaceProps {
    openTabs: TabData[];
    activeTab: string | null;
    onTabChange: (id: string) => void;
    onTabClose: (id: string) => void;
    renderTabContent: (id: string | null) => React.ReactNode;
}
function TabbedWorkspace({ openTabs, activeTab, onTabChange, onTabClose, renderTabContent }: TabbedWorkspaceProps) {
    return (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
                value={activeTab}
                onChange={(_, v) => onTabChange(v as string)}
                variant="scrollable"
                scrollButtons="auto"
            >
                {openTabs.map((tab: TabData, idx: number) => (
                    <Tab
                        key={tab.id}
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {tab.title}
                                <MuiIconButton
                                    size="small"
                                    onClick={e => { e.stopPropagation(); onTabClose(tab.id); }}
                                    sx={{ ml: 1 }}
                                >
                                    <CloseIcon fontSize="small" />
                                </MuiIconButton>
                            </Box>
                        }
                        value={tab.id}
                    />
                ))}
            </Tabs>
            <Box sx={{ mt: 2 }}>
                {renderTabContent(activeTab)}
            </Box>
        </Box>
    );
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

    const navigate = useNavigate();

    // Tabbed workspace state
    const [openTabs, setOpenTabs] = useState<any[]>([]); // { id, title, type, content }
    const [activeTab, setActiveTab] = useState<string | null>(null);

    // Open a note in a tab
    const openNoteTab = (noteId: string) => {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;
        if (!openTabs.some(tab => tab.id === noteId && tab.type === 'note')) {
            setOpenTabs([...openTabs, { id: note.id, title: note.title, type: 'note', content: note.content }]);
        }
        setActiveTab(noteId);
    };
    // Open a protocol in a tab
    const openProtocolTab = (protocolId: string) => {
        const protocol = protocols.find((p: any) => p.id === protocolId);
        if (!protocol) return;
        if (!openTabs.some(tab => tab.id === protocolId && tab.type === 'protocol')) {
            setOpenTabs([...openTabs, { id: protocol.id, title: protocol.name, type: 'protocol', protocol }]);
        }
        setActiveTab(protocolId + ':protocol');
    };
    // Close a tab
    const closeTab = (tabId: string) => {
        const idx = openTabs.findIndex(tab => tab.id === tabId);
        if (idx === -1) return;
        const newTabs = openTabs.filter(tab => tab.id !== tabId);
        setOpenTabs(newTabs);
        if (activeTab === tabId) {
            setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
        }
    };
    // Render tab content
    const renderTabContent = (tabId: string | null) => {
        const tab = openTabs.find(t => (t.type === 'protocol' ? t.id + ':protocol' : t.id) === tabId);
        if (!tab) return null;
        if (tab.type === 'note') {
            return (
                <Box>
                    <Typography variant="h5" sx={{ mb: 2 }}>{tab.title}</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                        {renderNoteContentWithLinks(tab.content || '', notes, (id) => openNoteTab(id))}
                    </Typography>
                </Box>
            );
        } else if (tab.type === 'protocol') {
            const protocol = tab.protocol;
            if (!protocol) return null;
            return (
                <Box>
                    <Typography variant="h5" sx={{ mb: 2 }}>{protocol.name}</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>{protocol.description}</Typography>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Category: {protocol.category}</Typography>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Version: {protocol.version}</Typography>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Difficulty: {protocol.difficulty}</Typography>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Expected Duration: {protocol.expectedDuration}</Typography>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Steps:</Typography>
                    <List>
                        {protocol.steps.map((step: any, idx: number) => (
                            <ListItem key={step.id || idx}>
                                <ListItemText
                                    primary={step.title}
                                    secondary={step.description}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            );
        }
        return null;
    };

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
        <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
            {openTabs.length > 0 && (
                <Box sx={{ width: 280, borderRight: 1, borderColor: 'divider', p: 2, bgcolor: 'background.paper', overflowY: 'auto' }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Notes</Typography>
                    {notes.map((note) => (
                        <Box
                            key={note.id}
                            sx={{
                                mb: 1,
                                p: 1,
                                borderRadius: 1,
                                bgcolor: openTabs.some(tab => tab.id === note.id && tab.type === 'note') ? 'primary.light' : 'transparent',
                                cursor: 'pointer',
                                fontWeight: openTabs.some(tab => tab.id === note.id && tab.type === 'note') ? 600 : 400,
                                '&:hover': { bgcolor: 'action.hover' },
                            }}
                            onClick={() => openNoteTab(note.id)}
                        >
                            {note.title}
                        </Box>
                    ))}
                    <Typography variant="h6" sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScienceIcon fontSize="small" /> Protocols
                    </Typography>
                    {protocolsLoading ? (
                        <CircularProgress size={20} />
                    ) : protocolsError ? (
                        <Alert severity="error">{protocolsError}</Alert>
                    ) : protocols.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">No protocols</Typography>
                    ) : (
                        protocols.map((protocol) => (
                            <Box
                                key={protocol.id}
                                sx={{
                                    mb: 1,
                                    p: 1,
                                    borderRadius: 1,
                                    bgcolor: openTabs.some(tab => tab.id === protocol.id && tab.type === 'protocol') ? 'primary.light' : 'transparent',
                                    cursor: 'pointer',
                                    fontWeight: openTabs.some(tab => tab.id === protocol.id && tab.type === 'protocol') ? 600 : 400,
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                                onClick={() => openProtocolTab(protocol.id)}
                            >
                                {protocol.name}
                            </Box>
                        ))
                    )}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={() => handleOpenDialog()}
                    >
                        New Note
                    </Button>
                </Box>
            )}
            <Box sx={{ flex: 1, p: openTabs.length > 0 ? 3 : 0, overflow: 'auto' }}>
                {openTabs.length > 0 ? (
                    <TabbedWorkspace
                        openTabs={openTabs}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        onTabClose={closeTab}
                        renderTabContent={renderTabContent}
                    />
                ) : (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5">Notes</Typography>
                            <Box>
                                <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setImportExportOpen(true)}>Import/Export</Button>
                                <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportPDF}>Export PDF</Button>
                                <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportWord}>Export Word</Button>
                                <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportBibTeX}>Export BibTeX</Button>
                                <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportMarkdown}>Export MD</Button>
                                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Add</Button>
                            </Box>
                        </Box>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}
                        {notes.length === 0 && !loading ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    No notes yet
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Create your first note to get started
                                </Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={3}>
                                {notes.map((note) => (
                                    <Grid item xs={12} md={6} lg={4} key={note.id}>
                                        <Card>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, mr: 1, cursor: 'pointer' }}
                                                        onClick={() => openNoteTab(note.id)}
                                                    >
                                                        {note.title}
                                                    </Typography>
                                                    <Box>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setSelectedNoteId(note.id);
                                                                setOpenLinkManager(true);
                                                            }}
                                                            sx={{ mr: 1 }}
                                                        >
                                                            <LinkIcon />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={() => handleOpenDialog(note)}>
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={() => handleDelete(note.id)}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    {renderNoteContentWithLinks(
                                                        note.content.length > 100
                                                            ? `${note.content.substring(0, 100)}...`
                                                            : note.content,
                                                        notes,
                                                        (id) => openNoteTab(id)
                                                    )}
                                                </Typography>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Chip
                                                        label={note.type}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: getTypeColor(note.type),
                                                            color: palette.text,
                                                        }}
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(note.date).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </>
                )}
            </Box>
            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingNote ? 'Edit Note' : 'Create New Note'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={formData.type}
                                label="Type"
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                disabled={saving}
                            >
                                <MenuItem value="daily">Daily Note</MenuItem>
                                <MenuItem value="experiment">Experiment Note</MenuItem>
                                <MenuItem value="literature">Literature Note</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            sx={{ mb: 2 }}
                            InputLabelProps={{ shrink: true }}
                            disabled={saving}
                        />
                        {/* Zotero citation button */}
                        <Button
                            variant="outlined"
                            startIcon={<ScienceIcon />}
                            sx={{ mb: 2 }}
                            onClick={() => setZoteroModalOpen(true)}
                            disabled={saving}
                        >
                            Cite from Zotero
                        </Button>
                        <TextField
                            fullWidth
                            label="Content"
                            multiline
                            rows={6}
                            value={formData.content}
                            onChange={handleContentChange}
                            onKeyDown={handleContentKeyDown}
                            disabled={saving}
                            inputRef={contentRef}
                        />
                        {showAutocomplete && autocompleteOptions.length > 0 && (
                            <Paper
                                style={{
                                    position: 'absolute',
                                    zIndex: 10,
                                    top: autocompleteAnchor?.top || 200,
                                    left: autocompleteAnchor?.left || 200,
                                    minWidth: 240,
                                    maxHeight: 200,
                                    overflowY: 'auto',
                                }}
                                elevation={4}
                            >
                                {autocompleteOptions.map((option, idx) => (
                                    <div
                                        key={option.id}
                                        style={{
                                            padding: 8,
                                            background: idx === autocompleteSelected ? '#e3f2fd' : 'white',
                                            cursor: 'pointer',
                                        }}
                                        onMouseDown={() => handleAutocompleteSelect(option)}
                                    >
                                        {option.title} <span style={{ color: '#888', fontSize: 12 }}>({option.type})</span>
                                    </div>
                                ))}
                            </Paper>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} /> : undefined}
                    >
                        {saving ? 'Saving...' : (editingNote ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
            {/* Link Manager */}
            <LinkManager
                entityType="note"
                entityId={selectedNoteId}
                open={openLinkManager}
                onClose={() => setOpenLinkManager(false)}
            />
            <ZoteroCitationModal open={zoteroModalOpen} onClose={() => setZoteroModalOpen(false)} onSelectCitation={handleInsertCitation} />
            <ImportExportDialog
                open={importExportOpen}
                onClose={() => setImportExportOpen(false)}
                entityType="Note"
                fields={NOTE_FIELDS}
                onImport={handleImport}
                onExport={handleExport}
                data={notes}
            />
        </Box>
    );
};

export default Notes; 