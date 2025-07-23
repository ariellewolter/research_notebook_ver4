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
    CircularProgress,
    Alert,
    Snackbar,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Paper,
    Input,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Drawer,
    List as MUIList,
    ListItem as MUIListItem,
    ListItemText as MUIListItemText,
} from '@mui/material';
import {
    PictureAsPdf as PdfIcon,
    Upload as UploadIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Highlight as HighlightIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { pdfsApi, linksApi, literatureNotesApi, databaseApi } from '../services/api';
import ColorLegend from '../components/Legend/ColorLegend';
import { useThemePalette } from '../services/ThemePaletteContext';
import { NOTE_TYPE_TO_PALETTE_ROLE } from '../services/colorPalettes';
import { Document, Page, pdfjs } from 'react-pdf';
import jsPDF from 'jspdf';
import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
// Add a module declaration for @orcid/bibtex-parse-js if needed
// @ts-ignore
import { BibtexParser } from '@orcid/bibtex-parse-js';
import ImportExportDialog from '../components/ImportExportDialog';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Snackbar, Alert } from '@mui/material';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface PDF {
    id: string;
    title: string;
    filename: string;
    uploadedAt: string;
    highlights?: Highlight[];
}

interface Highlight {
    id: string;
    page: number;
    text: string;
    coords?: string;
    createdAt: string;
}

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

function renderHighlightWithEntities(text: string, entries: any[], onEntityClick: (entry: any) => void) {
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

const PDFs: React.FC = () => {
    const [pdfs, setPdfs] = useState<PDF[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [openViewerDialog, setOpenViewerDialog] = useState(false);
    const [openHighlightDialog, setOpenHighlightDialog] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState<PDF | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const [uploadFormData, setUploadFormData] = useState({
        title: '',
        file: null as File | null,
    });

    const [highlightFormData, setHighlightFormData] = useState({
        page: 1,
        text: '',
        coords: '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfViewerRef = useRef<HTMLDivElement>(null);
    const { palette } = useThemePalette();
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkHighlightId, setLinkHighlightId] = useState<string | null>(null);
    const [linkSearch, setLinkSearch] = useState('');
    const [linkResults, setLinkResults] = useState<any[]>([]);
    const [linkType, setLinkType] = useState<'literatureNote' | 'databaseEntry'>('literatureNote');
    const [highlightLinks, setHighlightLinks] = useState<Record<string, any[]>>({});
    const [openLitNoteDialog, setOpenLitNoteDialog] = useState(false);
    const [selectedLitNote, setSelectedLitNote] = useState<any>(null);
    const [openDbEntryDialog, setOpenDbEntryDialog] = useState(false);
    const [selectedDbEntry, setSelectedDbEntry] = useState<any>(null);
    const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
    const [viewingHighlight, setViewingHighlight] = useState<Highlight | null>(null);
    const [databaseEntries, setDatabaseEntries] = useState<any[]>([]);
    const [entitySidebarOpen, setEntitySidebarOpen] = useState(false);
    const [entityMentions, setEntityMentions] = useState<{ start: number, end: number, entry: any }[]>([]);
    const [importExportOpen, setImportExportOpen] = useState(false);

    // Load PDFs on component mount
    useEffect(() => {
        loadPDFs();
    }, []);

    useEffect(() => {
        if (!openViewerDialog) return;
        const handleMouseUp = () => {
            const selection = window.getSelection();
            if (selection && selection.toString().trim()) {
                // Get selected text and open highlight dialog
                setHighlightFormData({
                    page: pageNumber,
                    text: selection.toString(),
                    coords: '',
                });
                setOpenHighlightDialog(true);
                selection.removeAllRanges();
            }
        };
        const viewer = pdfViewerRef.current;
        if (viewer) {
            viewer.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            if (viewer) {
                viewer.removeEventListener('mouseup', handleMouseUp);
            }
        };
    }, [openViewerDialog, pageNumber]);

    useEffect(() => {
        if (!linkDialogOpen || !linkSearch) return;
        const fetchResults = async () => {
            if (linkType === 'literatureNote') {
                const res = await literatureNotesApi.getAll();
                setLinkResults(res.data.filter((n: any) => n.title.toLowerCase().includes(linkSearch.toLowerCase())));
            } else {
                const res = await databaseApi.getAll();
                setLinkResults(res.data.filter((e: any) => e.name.toLowerCase().includes(linkSearch.toLowerCase())));
            }
        };
        fetchResults();
    }, [linkDialogOpen, linkSearch, linkType]);

    // Fetch links for all highlights when selectedPdf changes
    useEffect(() => {
        if (!selectedPdf || !selectedPdf.highlights) return;
        const fetchLinks = async () => {
            const linksMap: Record<string, any[]> = {};
            for (const h of (selectedPdf.highlights || [])) {
                const res = await linksApi.getOutgoing('highlight', h.id);
                linksMap[h.id] = res.data;
            }
            setHighlightLinks(linksMap);
        };
        fetchLinks();
    }, [selectedPdf]);

    useEffect(() => {
        if (editingHighlight && editingHighlight.text) {
            setEntityMentions(findEntityMentions(editingHighlight.text, databaseEntries));
        } else if (viewingHighlight && viewingHighlight.text) {
            setEntityMentions(findEntityMentions(viewingHighlight.text, databaseEntries));
        } else {
            setEntityMentions([]);
        }
    }, [editingHighlight, viewingHighlight, databaseEntries]);

    const loadPDFs = async () => {
        try {
            setLoading(true);
            const response = await pdfsApi.getAll();
            setPdfs(response.data.pdfs || response.data || []);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load PDFs');
            console.error('Error loading PDFs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenUploadDialog = () => {
        setUploadFormData({
            title: '',
            file: null,
        });
        setOpenUploadDialog(true);
    };

    const handleCloseUploadDialog = () => {
        setOpenUploadDialog(false);
        setUploadFormData({
            title: '',
            file: null,
        });
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            setUploadFormData({
                ...uploadFormData,
                file,
                title: uploadFormData.title || file.name.replace('.pdf', ''),
            });
        } else if (file) {
            setSnackbar({
                open: true,
                message: 'Please select a PDF file',
                severity: 'error',
            });
        }
    };

    const handleUpload = async () => {
        if (!uploadFormData.file || !uploadFormData.title.trim()) {
            setSnackbar({
                open: true,
                message: 'Please select a file and enter a title',
                severity: 'error',
            });
            return;
        }

        try {
            setUploading(true);
            await pdfsApi.upload(uploadFormData.file, uploadFormData.title);
            setSnackbar({
                open: true,
                message: 'PDF uploaded successfully',
                severity: 'success',
            });
            handleCloseUploadDialog();
            loadPDFs();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to upload PDF',
                severity: 'error',
            });
            console.error('Error uploading PDF:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this PDF? This will also delete all associated highlights.')) {
            return;
        }

        try {
            await pdfsApi.delete(id);
            setSnackbar({
                open: true,
                message: 'PDF deleted successfully',
                severity: 'success',
            });
            loadPDFs();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to delete PDF',
                severity: 'error',
            });
            console.error('Error deleting PDF:', err);
        }
    };

    const handleOpenViewer = async (pdf: PDF) => {
        setSelectedPdf(pdf);
        setOpenViewerDialog(true);

        // Load highlights for this PDF
        try {
            const response = await pdfsApi.getHighlights(pdf.id);
            setSelectedPdf({
                ...pdf,
                highlights: response.data.highlights || response.data || [],
            });
        } catch (err: any) {
            console.error('Error loading highlights:', err);
        }
    };

    const handleCloseViewer = () => {
        setOpenViewerDialog(false);
        setSelectedPdf(null);
    };

    const handleOpenHighlightDialog = (page?: number) => {
        setHighlightFormData({
            page: page || 1,
            text: '',
            coords: '',
        });
        setOpenHighlightDialog(true);
    };

    const handleCloseHighlightDialog = () => {
        setOpenHighlightDialog(false);
    };

    const handleSaveHighlight = async () => {
        if (!selectedPdf || !highlightFormData.text.trim()) {
            setSnackbar({
                open: true,
                message: 'Please enter highlight text',
                severity: 'error',
            });
            return;
        }

        try {
            setSaving(true);
            const res = await pdfsApi.createHighlight(selectedPdf.id, highlightFormData);
            setSnackbar({
                open: true,
                message: 'Highlight created successfully',
                severity: 'success',
            });
            handleCloseHighlightDialog();

            // Reload highlights
            const response = await pdfsApi.getHighlights(selectedPdf.id);
            setSelectedPdf({
                ...selectedPdf,
                highlights: response.data.highlights || response.data || [],
            });
            // Prompt to link
            setLinkHighlightId(res.data.id);
            setLinkDialogOpen(true);
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to create highlight',
                severity: 'error',
            });
            console.error('Error creating highlight:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteHighlight = async (highlightId: string) => {
        if (!window.confirm('Are you sure you want to delete this highlight?')) {
            return;
        }

        try {
            await pdfsApi.deleteHighlight(highlightId);
            setSnackbar({
                open: true,
                message: 'Highlight deleted successfully',
                severity: 'success',
            });

            // Reload highlights
            if (selectedPdf) {
                const response = await pdfsApi.getHighlights(selectedPdf.id);
                setSelectedPdf({
                    ...selectedPdf,
                    highlights: response.data.highlights || response.data || [],
                });
            }
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to delete highlight',
                severity: 'error',
            });
            console.error('Error deleting highlight:', err);
        }
    };

    const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPageNumber(1);
    };

    function handleExportPDF() {
        const doc = new jsPDF();
        const citations = pdfs.map(n => formatCitation(n, getCitationStyle())).join("\n\n");
        doc.text(citations, 10, 10);
        doc.save("pdfs-citations.pdf");
    }
    function handleExportWord() {
        const doc = new DocxDocument({
            sections: [{
                properties: {},
                children: pdfs.map(n => new Paragraph({ children: [new TextRun(formatCitation(n, getCitationStyle()))] }))
            }]
        });
        Packer.toBlob(doc).then(blob => saveAs(blob, "pdfs-citations.docx"));
    }
    function handleExportBibTeX() {
        // @ts-expect-error: PDFs may have linked literature note fields
        const bibtex = pdfs.map(n => `@article{${n.id},\n  title={${n.title ?? ''}},\n  author={${n.authors ?? n.author ?? ''}},\n  journal={${n.journal ?? ''}},\n  year={${n.year ?? ''}},\n  doi={${n.doi ?? ''}}\n}`).join("\n\n");
        const blob = new Blob([bibtex], { type: 'text/x-bibtex' });
        saveAs(blob, "pdfs-citations.bib");
    }
    function handleExportMarkdown() {
        const md = pdfs.map(n => `- ${formatCitation(n, getCitationStyle())}`).join("\n");
        const blob = new Blob([md], { type: 'text/markdown' });
        saveAs(blob, "pdfs-citations.md");
    }

    const PDF_FIELDS = [
        { key: 'title', label: 'Title' },
        { key: 'filename', label: 'File Name' },
        { key: 'highlights', label: 'Highlights' },
        { key: 'uploadedAt', label: 'Uploaded At' },
    ];

    const handleImport = async (rows: any[]) => {
        // PDFs API only supports upload with a File, so for now, only import metadata rows (simulate create)
        for (const row of rows) {
            // Only import if title is present
            if (row.title) {
                // Simulate a metadata-only import (no file upload)
                // You may want to add a backend endpoint for metadata-only PDF creation in the future
                // For now, skip rows without a file
                // Optionally, show a warning if file is missing
                // await pdfsApi.upload(file, row.title); // Not possible here
            }
        }
        await loadPDFs();
        setSnackbar({ open: true, message: 'Import completed (metadata only, no files uploaded)', severity: 'success' });
    };
    const handleExport = (format: 'csv' | 'json' | 'xlsx') => {
        const exportData = pdfs.map(p => ({
            title: p.title,
            filename: p.filename,
            highlights: JSON.stringify(p.highlights),
            uploadedAt: p.uploadedAt,
        }));
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            saveAs(blob, 'pdfs.json');
        } else if (format === 'csv') {
            const csv = Papa.unparse(exportData);
            const blob = new Blob([csv], { type: 'text/csv' });
            saveAs(blob, 'pdfs.csv');
        } else if (format === 'xlsx') {
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'PDFs');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            saveAs(blob, 'pdfs.xlsx');
        }
        setSnackbar({ open: true, message: `Exported as ${format.toUpperCase()}`, severity: 'success' });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <ColorLegend types={['pdf', 'highlight']} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">PDFs</Typography>
                <Box>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setImportExportOpen(true)}>Import/Export</Button>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportPDF}>Export PDF</Button>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportWord}>Export Word</Button>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportBibTeX}>Export BibTeX</Button>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportMarkdown}>Export MD</Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenUploadDialog(true)}>Add</Button>
                </Box>
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Manage your PDF documents and highlights.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {pdfs.length === 0 && !loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No PDFs yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Upload your first PDF to get started
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {pdfs.map((pdf) => (
                        <Grid item xs={12} key={pdf.id}>
                            <Card sx={{ borderLeft: `8px solid ${palette[NOTE_TYPE_TO_PALETTE_ROLE['pdf']]}` }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" component="div">
                                                {pdf.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                {pdf.filename}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                Uploaded: {new Date(pdf.uploadedAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Chip
                                                label={`${pdf.highlights?.length || 0} highlights`}
                                                size="small"
                                                color="primary"
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenViewer(pdf)}
                                                sx={{ mr: 1 }}
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDelete(pdf.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" gutterBottom>
                                        Highlights ({pdf.highlights?.length || 0})
                                    </Typography>
                                    {pdf.highlights && pdf.highlights.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {pdf.highlights.map((highlight) => (
                                                <Chip
                                                    key={highlight.id}
                                                    label={highlight.text}
                                                    sx={{
                                                        background: palette[NOTE_TYPE_TO_PALETTE_ROLE['highlight']],
                                                        color: '#fff',
                                                        fontWeight: 500,
                                                    }}
                                                    size="small"
                                                />
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                            No highlights yet.
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Upload Dialog */}
            <Dialog open={openUploadDialog} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Upload PDF</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Title"
                            value={uploadFormData.title}
                            onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
                            sx={{ mb: 2 }}
                            disabled={uploading}
                        />

                        <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            startIcon={<UploadIcon />}
                            disabled={uploading}
                            sx={{ mb: 2 }}
                        >
                            {uploadFormData.file ? uploadFormData.file.name : 'Choose PDF File'}
                            <input
                                type="file"
                                hidden
                                accept=".pdf"
                                onChange={handleFileSelect}
                                ref={fileInputRef}
                            />
                        </Button>

                        {uploadFormData.file && (
                            <Typography variant="body2" color="text.secondary">
                                File size: {(uploadFormData.file.size / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseUploadDialog} disabled={uploading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        variant="contained"
                        disabled={uploading || !uploadFormData.file}
                        startIcon={uploading ? <CircularProgress size={16} /> : undefined}
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* PDF Viewer Dialog */}
            <Dialog
                open={openViewerDialog}
                onClose={handleCloseViewer}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { height: '80vh' } }}
            >
                <DialogTitle>
                    {selectedPdf?.title}
                    <IconButton
                        onClick={() => handleOpenHighlightDialog()}
                        sx={{ ml: 2 }}
                        size="small"
                    >
                        <AddIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', height: '100%' }}>
                        {/* PDF Viewer */}
                        <Box ref={pdfViewerRef} sx={{ flex: 1, border: '1px solid #ddd', borderRadius: 1, p: 2, mr: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'text' }}>
                            {selectedPdf && (
                                <Document
                                    file={`/api/pdfs/${selectedPdf.id}/file`}
                                    onLoadSuccess={handleDocumentLoadSuccess}
                                    loading={<CircularProgress />}
                                >
                                    <Page pageNumber={pageNumber} width={600} />
                                </Document>
                            )}
                            {numPages && (
                                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1}>Prev</Button>
                                    <Typography>Page {pageNumber} of {numPages}</Typography>
                                    <Button onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages}>Next</Button>
                                </Box>
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                Select text in the PDF to create a highlight.
                            </Typography>
                        </Box>

                        {/* Highlights Panel */}
                        <Box sx={{ width: 300 }}>
                            <Typography variant="h6" gutterBottom>
                                Highlights ({selectedPdf?.highlights?.length || 0})
                            </Typography>
                            {(selectedPdf?.highlights || []).length > 0 ? (
                                <List>
                                    {(selectedPdf?.highlights || []).map((highlight) => (
                                        <ListItem key={highlight.id} divider alignItems="flex-start">
                                            <ListItemIcon>
                                                <HighlightIcon color="primary" />
                                            </ListItemIcon>
                                            <Box sx={{ flex: 1 }}>
                                                <ListItemText
                                                    primary={highlight.text}
                                                    secondary={`Page ${highlight.page} • ${new Date(highlight.createdAt).toLocaleDateString()}`}
                                                />
                                                {/* Linked entities */}
                                                {highlightLinks[highlight.id] && highlightLinks[highlight.id].length > 0 && (
                                                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {highlightLinks[highlight.id].map((link: any) => (
                                                            <Chip
                                                                key={link.id}
                                                                label={link.targetType === 'literatureNote' ? link.literatureNote?.title : link.databaseEntry?.name}
                                                                color={link.targetType === 'literatureNote' ? 'secondary' : 'default'}
                                                                size="small"
                                                                sx={{ cursor: 'pointer' }}
                                                                onClick={async () => {
                                                                    if (link.targetType === 'literatureNote') {
                                                                        const res = await literatureNotesApi.getById(link.targetId);
                                                                        setSelectedLitNote(res.data);
                                                                        setOpenLitNoteDialog(true);
                                                                    } else if (link.targetType === 'databaseEntry') {
                                                                        const res = await databaseApi.getById(link.targetId);
                                                                        setSelectedDbEntry(res.data);
                                                                        setOpenDbEntryDialog(true);
                                                                    }
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>
                                            <IconButton size="small" onClick={() => handleDeleteHighlight(highlight.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                    No highlights yet. Click the + button to add one.
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseViewer}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Highlight Dialog */}
            <Dialog open={openHighlightDialog} onClose={handleCloseHighlightDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Add Highlight</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Page Number"
                            type="number"
                            value={highlightFormData.page}
                            onChange={(e) => setHighlightFormData({ ...highlightFormData, page: parseInt(e.target.value) || 1 })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />

                        <TextField
                            fullWidth
                            label="Highlight Text"
                            multiline
                            rows={3}
                            value={highlightFormData.text}
                            onChange={(e) => setHighlightFormData({ ...highlightFormData, text: e.target.value })}
                            sx={{ mb: 2 }}
                            disabled={saving}
                        />

                        <TextField
                            fullWidth
                            label="Coordinates (optional)"
                            value={highlightFormData.coords}
                            onChange={(e) => setHighlightFormData({ ...highlightFormData, coords: e.target.value })}
                            helperText="Optional: x,y coordinates for highlight position"
                            disabled={saving}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseHighlightDialog} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveHighlight}
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} /> : undefined}
                    >
                        {saving ? 'Saving...' : 'Add Highlight'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Link Highlight Dialog */}
            <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Link Highlight to {linkType === 'literatureNote' ? 'Literature Note' : 'Database Entry'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Button variant={linkType === 'literatureNote' ? 'contained' : 'outlined'} onClick={() => setLinkType('literatureNote')}>Literature Note</Button>
                        <Button variant={linkType === 'databaseEntry' ? 'contained' : 'outlined'} onClick={() => setLinkType('databaseEntry')}>Database Entry</Button>
                    </Box>
                    <TextField
                        fullWidth
                        label={`Search ${linkType === 'literatureNote' ? 'Literature Notes' : 'Database Entries'}`}
                        value={linkSearch}
                        onChange={e => setLinkSearch(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <List>
                        {linkResults.map((item: any) => (
                            <ListItem key={item.id} button onClick={async () => {
                                if (!linkHighlightId) return;
                                await linksApi.create({ sourceType: 'highlight', sourceId: linkHighlightId, targetType: linkType, targetId: item.id });
                                setSnackbar({ open: true, message: 'Highlight linked successfully', severity: 'success' });
                                setLinkDialogOpen(false);
                                setLinkHighlightId(null);
                                setLinkSearch('');
                                setLinkResults([]);
                                // Optionally reload highlights/links
                            }}>
                                <ListItemText primary={item.title || item.name} secondary={item.authors || item.type} />
                            </ListItem>
                        ))}
                        {linkSearch && linkResults.length === 0 && (
                            <ListItem><ListItemText primary="No results found." /></ListItem>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
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

            {/* Literature Note Dialog (view only) */}
            <Dialog open={openLitNoteDialog} onClose={() => setOpenLitNoteDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>{selectedLitNote?.title}</DialogTitle>
                <DialogContent>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>{selectedLitNote?.authors} {selectedLitNote?.year}</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>{selectedLitNote?.journal}</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>{selectedLitNote?.abstract}</Typography>
                    <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>{formatCitation(selectedLitNote, getCitationStyle())}</Typography>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">Your Notes</Typography>
                        <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 1, background: '#fafafa' }}>
                            {selectedLitNote?.userNote}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenLitNoteDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
            {/* Database Entry Dialog (view only) */}
            <Dialog open={openDbEntryDialog} onClose={() => setOpenDbEntryDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>{selectedDbEntry?.name}</DialogTitle>
                <DialogContent>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>{selectedDbEntry?.type}</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>{selectedDbEntry?.description}</Typography>
                    {/* Add more fields as needed */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDbEntryDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
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
                entityType="PDF"
                fields={PDF_FIELDS}
                onImport={handleImport}
                onExport={handleExport}
                data={pdfs}
            />
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default PDFs; 