import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, List, ListItem, ListItemText, IconButton, Chip, Drawer, List as MUIList, ListItem as MUIListItem, ListItemText as MUIListItemText } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ReactMarkdown from 'react-markdown';
import { LiteratureNote } from '../../../../packages/shared/types';
import { databaseApi } from '../services/api';
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
import { Alert, Snackbar } from '@mui/material';
import ImportExportDialog from '../components/ImportExportDialog';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const fetchLitNotes = async (): Promise<LiteratureNote[]> => {
    const res = await fetch('/api/literature-notes');
    return res.json();
};

const saveLitNote = async (note: Partial<LiteratureNote>, id?: string) => {
    const res = await fetch(`/api/literature-notes${id ? `/${id}` : ''}`, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
    });
    return res.json();
};

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

async function handleLinkAllEntities() {
    try {
        // This function needs to be moved inside the component to access state
        console.log('handleLinkAllEntities called');
    } catch (error) {
        console.error('Failed to link entities:', error);
    }
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
    // Add state for selectedNoteId and editMode
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        fetchLitNotes().then(setNotes);
        databaseApi.getAll().then(res => setAllEntries(res.data));
    }, []);

    const handleOpenEntity = (entry: any) => {
        // Navigate to the appropriate page based on entry type
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
        const saved = await saveLitNote(editing, editing.id);
        setNotes((prev) => {
            const idx = prev.findIndex((n) => n.id === saved.id);
            if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = saved;
                return copy;
            }
            return [saved, ...prev];
        });
        handleClose();
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
        for (const row of rows) {
            await saveLitNote(row); // Assuming saveLitNote handles create/update
        }
        await fetchLitNotes().then(setNotes);
        setSnackbar({ open: true, message: 'Import successful!', severity: 'success' });
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

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Literature Notes</Typography>
                <Box>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setZoteroConfigOpen(true)}>Configure Zotero</Button>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setZoteroDragDropOpen(true)}>Import from Zotero</Button>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setAdvancedExportOpen(true)}>Advanced Export</Button>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setImportExportOpen(true)}>Import/Export</Button>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportPDF}>Export PDF</Button>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportWord}>Export Word</Button>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportBibTeX}>Export BibTeX</Button>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportMarkdown}>Export MD</Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>Add</Button>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField size="small" label="Search Title" value={search} onChange={e => setSearch(e.target.value)} />
                <TextField size="small" label="Author" value={filterAuthor} onChange={e => setFilterAuthor(e.target.value)} />
                <TextField size="small" label="Year" value={filterYear} onChange={e => setFilterYear(e.target.value)} />
                <TextField size="small" label="Tag" value={filterTag} onChange={e => setFilterTag(e.target.value)} />
                <TextField size="small" label="Related Entry ID" value={filterEntry} onChange={e => setFilterEntry(e.target.value)} />
            </Box>
            <List>
                {notes.filter(note =>
                    (!search || note.title.toLowerCase().includes(search.toLowerCase())) &&
                    (!filterAuthor || (note.authors || '').toLowerCase().includes(filterAuthor.toLowerCase())) &&
                    (!filterYear || (note.year || '').includes(filterYear)) &&
                    (!filterTag || (note.tags || '').toLowerCase().includes(filterTag.toLowerCase())) &&
                    (!filterEntry || (note.relatedEntries || []).includes(filterEntry))
                ).map((note) => (
                    <ListItem key={note.id} secondaryAction={<IconButton onClick={() => handleOpen(note)}><EditIcon /></IconButton>}>
                        <ListItemText
                            primary={note.title}
                            secondary={note.authors ? `${note.authors} (${note.year || ''})` : note.year}
                        />
                    </ListItem>
                ))}
            </List>
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
                    // Example: parse fields from citation.title string
                    // e.g., 'Smith et al. (2022) - "CRISPR in Yeast"'
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
            <Drawer anchor="right" open={entitySidebarOpen} onClose={() => setEntitySidebarOpen(false)}>
                <Box sx={{ width: 320, p: 2 }}>
                    <Typography variant="h6">Entity Suggestions</Typography>
                    <MUIList>
                        {entityMentions.map((m, i) => (
                            <MUIListItem button key={i} onClick={() => { setEntitySidebarOpen(false); handleOpenEntity(m.entry); }}>
                                <MUIListItemText primary={m.entry.name} secondary={m.entry.type} />
                            </MUIListItem>
                        ))}
                        {entityMentions.length === 0 && <Typography>No suggestions found.</Typography>}
                    </MUIList>
                    <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={handleLinkAllEntities}>Link All</Button>
                </Box>
            </Drawer>
            <ImportExportDialog
                open={importExportOpen}
                onClose={() => setImportExportOpen(false)}
                entityType="Literature Note"
                fields={LITNOTE_FIELDS}
                onImport={handleImport}
                onExport={handleExport}
                data={notes}
            />
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
            </Snackbar>

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
                    // Refresh notes after import
                    fetchLitNotes().then(setNotes);
                }}
            />

        </Box>
    );
};

export default LiteratureNotes; 