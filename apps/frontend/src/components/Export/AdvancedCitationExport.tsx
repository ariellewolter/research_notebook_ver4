import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Checkbox,
    Box,
    Typography,
    Chip,
    CircularProgress,
    Alert,
    Divider,
    Tabs,
    Tab
} from '@mui/material';
import {
    Download as DownloadIcon,
    FileDownload as FileDownloadIcon,
    Bookmark as LiteratureIcon,
    Science as ProtocolIcon,
    Folder as ProjectIcon,
    CheckBox as TaskIcon
} from '@mui/icons-material';
import { saveFileDialog } from '@/utils/fileSystemAPI';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Citation styles data (simplified - in real app, you'd fetch from CSL repository)
const CITATION_STYLES = [
    { key: 'apa', name: 'APA (American Psychological Association)', url: 'https://www.zotero.org/styles/apa' },
    { key: 'mla', name: 'MLA (Modern Language Association)', url: 'https://www.zotero.org/styles/modern-language-association' },
    { key: 'chicago-author-date', name: 'Chicago Author-Date', url: 'https://www.zotero.org/styles/chicago-author-date' },
    { key: 'chicago-note-bibliography', name: 'Chicago Note-Bibliography', url: 'https://www.zotero.org/styles/chicago-note-bibliography' },
    { key: 'ieee', name: 'IEEE', url: 'https://www.zotero.org/styles/ieee' },
    { key: 'nature', name: 'Nature', url: 'https://www.zotero.org/styles/nature' },
    { key: 'science', name: 'Science', url: 'https://www.zotero.org/styles/science' },
    { key: 'cell', name: 'Cell', url: 'https://www.zotero.org/styles/cell' },
    { key: 'plos', name: 'PLOS', url: 'https://www.zotero.org/styles/plos' },
    { key: 'bmc', name: 'BMC', url: 'https://www.zotero.org/styles/bmc' },
];

interface CitationItem {
    id: string;
    type: 'article-journal' | 'article' | 'book' | 'chapter' | 'thesis' | 'report';
    title: string;
    author?: Array<{ family: string; given: string }>;
    'container-title'?: string;
    volume?: string;
    issue?: string;
    page?: string;
    issued?: { 'date-parts': number[][] };
    DOI?: string;
    URL?: string;
    abstract?: string;
    keyword?: string[];
    'publisher-place'?: string;
    publisher?: string;
    ISBN?: string;
    ISSN?: string;
}

interface AdvancedCitationExportProps {
    open: boolean;
    onClose: () => void;
    literatureNotes: any[];
    projects: any[];
    experiments: any[];
    protocols: any[];
}

const AdvancedCitationExport: React.FC<AdvancedCitationExportProps> = ({
    open, onClose, literatureNotes, projects, experiments, protocols
}) => {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedStyle, setSelectedStyle] = useState('apa');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [exportFormat, setExportFormat] = useState<'bibliography' | 'in-text' | 'footnotes'>('bibliography');
    const [filename, setFilename] = useState('research-citations');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timelineData, setTimelineData] = useState<any[]>([]);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            // Auto-select all literature notes
            setSelectedItems(literatureNotes.map(note => note.id));
            generateTimelineData();
        }
    }, [open, literatureNotes]);

    const generateTimelineData = () => {
        const timeline = [];
        
        // Add projects with their experiments
        projects.forEach(project => {
            const projectExperiments = experiments.filter(exp => exp.projectId === project.id);
            timeline.push({
                id: project.id,
                type: 'project',
                title: project.name,
                start: project.createdAt,
                end: project.status === 'completed' ? project.updatedAt : new Date().toISOString(),
                children: projectExperiments.map(exp => ({
                    id: exp.id,
                    type: 'experiment',
                    title: exp.name,
                    start: exp.createdAt,
                    end: exp.status === 'completed' ? exp.updatedAt : new Date().toISOString(),
                }))
            });
        });

        // Add protocols
        protocols.forEach(protocol => {
            timeline.push({
                id: protocol.id,
                type: 'protocol',
                title: protocol.name,
                start: protocol.createdAt,
                end: protocol.status === 'completed' ? protocol.updatedAt : new Date().toISOString(),
            });
        });

        setTimelineData(timeline);
    };

    const formatCitation = (item: any, style: string): string => {
        // Convert literature note to CSL format
        const cslItem: CitationItem = {
            id: item.id,
            type: 'article-journal',
            title: item.title,
            author: item.authors ? item.authors.split(' and ').map((author: string) => {
                const parts = author.trim().split(' ');
                return {
                    family: parts[parts.length - 1] || '',
                    given: parts.slice(0, -1).join(' ') || ''
                };
            }) : undefined,
            'container-title': item.journal,
            volume: item.volume,
            issue: item.issue,
            page: item.pages,
            issued: item.year ? { 'date-parts': [[parseInt(item.year)]] } : undefined,
            DOI: item.doi,
            URL: item.url,
            abstract: item.abstract,
            keyword: item.tags ? item.tags.split(',').map((tag: string) => tag.trim()) : undefined,
        };

        // Simple citation formatting based on style
        switch (style) {
            case 'apa':
                return formatAPACitation(cslItem);
            case 'mla':
                return formatMLACitation(cslItem);
            case 'chicago-author-date':
                return formatChicagoAuthorDate(cslItem);
            case 'ieee':
                return formatIEEECitation(cslItem);
            default:
                return formatAPACitation(cslItem);
        }
    };

    const formatAPACitation = (item: CitationItem): string => {
        const authors = item.author?.map(a => `${a.family}, ${a.given?.charAt(0)}.`).join(', ') || 'Unknown Author';
        const year = item.issued?.['date-parts']?.[0]?.[0] || '';
        const title = item.title || '';
        const journal = item['container-title'] || '';
        const volume = item.volume || '';
        const issue = item.issue || '';
        const pages = item.page || '';
        const doi = item.DOI || '';

        return `${authors} (${year}). ${title}. ${journal}${volume ? `, ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `, ${pages}` : ''}.${doi ? ` https://doi.org/${doi}` : ''}`;
    };

    const formatMLACitation = (item: CitationItem): string => {
        const authors = item.author?.map(a => `${a.family}, ${a.given}`).join(', ') || 'Unknown Author';
        const title = item.title || '';
        const journal = item['container-title'] || '';
        const volume = item.volume || '';
        const issue = item.issue || '';
        const year = item.issued?.['date-parts']?.[0]?.[0] || '';
        const pages = item.page || '';

        return `${authors}. "${title}." ${journal}${volume ? `, vol. ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${year ? `, ${year}` : ''}${pages ? `, pp. ${pages}` : ''}.`;
    };

    const formatChicagoAuthorDate = (item: CitationItem): string => {
        const authors = item.author?.map(a => `${a.given} ${a.family}`).join(', ') || 'Unknown Author';
        const year = item.issued?.['date-parts']?.[0]?.[0] || '';
        const title = item.title || '';
        const journal = item['container-title'] || '';
        const volume = item.volume || '';
        const issue = item.issue || '';
        const pages = item.page || '';

        return `${authors}. ${year}. "${title}." ${journal}${volume ? ` ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${pages ? `: ${pages}` : ''}.`;
    };

    const formatIEEECitation = (item: CitationItem): string => {
        const authors = item.author?.map(a => `${a.given} ${a.family}`).join(', ') || 'Unknown Author';
        const title = item.title || '';
        const journal = item['container-title'] || '';
        const volume = item.volume || '';
        const issue = item.issue || '';
        const year = item.issued?.['date-parts']?.[0]?.[0] || '';
        const pages = item.page || '';

        return `${authors}, "${title}," ${journal}${volume ? `, vol. ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${year ? `, ${year}` : ''}${pages ? `, pp. ${pages}` : ''}.`;
    };

    const handleItemToggle = (itemId: string) => {
        setSelectedItems(prev => 
            prev.includes(itemId) 
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSelectAll = () => {
        setSelectedItems(literatureNotes.map(note => note.id));
    };

    const handleSelectNone = () => {
        setSelectedItems([]);
    };

    const exportCitations = async (format: 'txt' | 'rtf' | 'html' | 'docx' | 'bibtex') => {
        setLoading(true);
        setError(null);

        try {
            const selectedNotes = literatureNotes.filter(note => selectedItems.includes(note.id));
            const citations = selectedNotes.map(note => formatCitation(note, selectedStyle));

            let content = '';
            let extension = '';

            switch (format) {
                case 'txt':
                    content = citations.join('\n\n');
                    extension = 'txt';
                    break;
                case 'rtf':
                    content = generateRTF(citations);
                    extension = 'rtf';
                    break;
                case 'html':
                    content = generateHTML(citations, selectedStyle);
                    extension = 'html';
                    break;
                case 'docx':
                    content = generateDocx(citations);
                    extension = 'docx';
                    break;
                case 'bibtex':
                    content = generateBibTeX(selectedNotes);
                    extension = 'bib';
                    break;
            }

            const exportFilename = `${filename}.${extension}`;
            
            // Use fileSystemAPI for native file dialog
            const result = await saveFileDialog(content, exportFilename);
            
            if (result.success) {
                setSuccess(`Successfully exported citations to ${exportFilename}`);
            } else if (result.canceled) {
                setSuccess('Export canceled');
            } else {
                setError(result.error || 'Export failed');
            }
        } catch (err) {
            setError('Failed to export citations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const generateRTF = (citations: string[]): string => {
        const rtfHeader = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}';
        const rtfFooter = '}';
        const rtfCitations = citations.map(citation => 
            `\\f0\\fs24 ${citation.replace(/"/g, '\\"')}\\par\\par`
        ).join('');
        
        return rtfHeader + rtfCitations + rtfFooter;
    };

    const generateHTML = (citations: string[], style: string): string => {
        const htmlHeader = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bibliography - ${style.toUpperCase()}</title>
    <style>
        body { font-family: Times New Roman, serif; margin: 2cm; line-height: 1.5; }
        h1 { text-align: center; margin-bottom: 2cm; }
        .citation { margin-bottom: 1em; text-indent: -2em; padding-left: 2em; }
    </style>
</head>
<body>
    <h1>Bibliography</h1>
    <p><em>Citation Style: ${style.toUpperCase()}</em></p>`;
        
        const htmlCitations = citations.map(citation => 
            `<div class="citation">${citation}</div>`
        ).join('');
        
        const htmlFooter = '</body></html>';
        
        return htmlHeader + htmlCitations + htmlFooter;
    };

    const generateDocx = (citations: string[]): string => {
        // Simplified DOCX generation - in a real app, you'd use a proper DOCX library
        const docxContent = citations.join('\n\n');
        return docxContent;
    };

    const generateBibTeX = (notes: any[]): string => {
        return notes.map(note => {
            const entry = `@article{${note.id},
  title={${note.title || ''}},
  author={${note.authors || ''}},
  journal={${note.journal || ''}},
  year={${note.year || ''}},
  volume={${note.volume || ''}},
  number={${note.issue || ''}},
  pages={${note.pages || ''}},
  doi={${note.doi || ''}},
  url={${note.url || ''}},
  abstract={${note.abstract || ''}},
  keywords={${note.tags || ''}}
}`;
            return entry;
        }).join('\n\n');
    };

    const exportTimeline = async (format: 'csv' | 'json' | 'xlsx') => {
        setLoading(true);
        setError(null);

        try {
            const timelineExport = timelineData.map(item => ({
                id: item.id,
                type: item.type,
                title: item.title,
                start_date: item.start,
                end_date: item.end,
                duration_days: Math.ceil((new Date(item.end).getTime() - new Date(item.start).getTime()) / (1000 * 60 * 60 * 24)),
                status: item.end === new Date().toISOString() ? 'ongoing' : 'completed'
            }));

            let content: any;
            let mimeType: string;
            let extension: string;

            switch (format) {
                case 'json':
                    content = JSON.stringify(timelineExport, null, 2);
                    mimeType = 'application/json';
                    extension = 'json';
                    break;
                case 'csv':
                    content = Papa.unparse(timelineExport);
                    mimeType = 'text/csv';
                    extension = 'csv';
                    break;
                case 'xlsx':
                    const ws = XLSX.utils.json_to_sheet(timelineExport);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Research Timeline');
                    content = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                    mimeType = 'application/octet-stream';
                    extension = 'xlsx';
                    break;
            }

            const blob = new Blob([content], { type: mimeType });
            saveAs(blob, `research-timeline.${extension}`);
        } catch (err) {
            setError('Failed to export timeline. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileDownloadIcon />
                    Advanced Citation Export
                </Box>
            </DialogTitle>
            <DialogContent>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                    <Tab icon={<DescriptionIcon />} label="Citations" />
                    <Tab icon={<TimelineIcon />} label="Research Timeline" />
                </Tabs>

                {activeTab === 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Citation Export</Typography>
                        
                        <Box sx={{ mb: 3 }}>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Citation Style</InputLabel>
                                <Select
                                    value={selectedStyle}
                                    onChange={(e) => setSelectedStyle(e.target.value)}
                                    label="Citation Style"
                                >
                                    {CITATION_STYLES.map(style => (
                                        <MenuItem key={style.key} value={style.key}>
                                            {style.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Export Format</InputLabel>
                                <Select
                                    value={exportFormat}
                                    onChange={(e) => setExportFormat(e.target.value as any)}
                                    label="Export Format"
                                >
                                    <MenuItem value="bibliography">Bibliography</MenuItem>
                                    <MenuItem value="in-text">In-text Citations</MenuItem>
                                    <MenuItem value="footnotes">Footnotes</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Filename"
                                value={filename}
                                onChange={(e) => setFilename(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1">Select Literature Notes</Typography>
                                <Box>
                                    <Button size="small" onClick={handleSelectAll}>Select All</Button>
                                    <Button size="small" onClick={handleSelectNone}>Select None</Button>
                                </Box>
                            </Box>
                            <List sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                                {literatureNotes.map(note => (
                                    <ListItem key={note.id} dense>
                                        <Checkbox
                                            checked={selectedItems.includes(note.id)}
                                            onChange={() => handleItemToggle(note.id)}
                                        />
                                        <ListItemText
                                            primary={note.title}
                                            secondary={`${note.authors || 'Unknown'} (${note.year || 'No year'})`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                                variant="outlined"
                                onClick={() => exportCitations('txt')}
                                disabled={selectedItems.length === 0 || loading}
                                startIcon={<DownloadIcon />}
                            >
                                Export TXT
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => exportCitations('rtf')}
                                disabled={selectedItems.length === 0 || loading}
                                startIcon={<DownloadIcon />}
                            >
                                Export RTF
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => exportCitations('html')}
                                disabled={selectedItems.length === 0 || loading}
                                startIcon={<DownloadIcon />}
                            >
                                Export HTML
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => exportCitations('docx')}
                                disabled={selectedItems.length === 0 || loading}
                                startIcon={<DownloadIcon />}
                            >
                                Export DOCX
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => exportCitations('bibtex')}
                                disabled={selectedItems.length === 0 || loading}
                                startIcon={<CodeIcon />}
                            >
                                Export BibTeX
                            </Button>
                        </Box>
                    </Box>
                )}

                {activeTab === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Research Timeline Export</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Export your research timeline including projects, experiments, and protocols with their dates and durations.
                        </Typography>

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>Timeline Summary:</Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Chip label={`${timelineData.length} Total Items`} color="primary" />
                                <Chip label={`${projects.length} Projects`} color="secondary" />
                                <Chip label={`${experiments.length} Experiments`} color="info" />
                                <Chip label={`${protocols.length} Protocols`} color="success" />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                                variant="outlined"
                                onClick={() => exportTimeline('csv')}
                                disabled={loading}
                                startIcon={<DownloadIcon />}
                            >
                                Export CSV
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => exportTimeline('json')}
                                disabled={loading}
                                startIcon={<DownloadIcon />}
                            >
                                Export JSON
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => exportTimeline('xlsx')}
                                disabled={loading}
                                startIcon={<DownloadIcon />}
                            >
                                Export Excel
                            </Button>
                        </Box>
                    </Box>
                )}

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        {success}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdvancedCitationExport; 