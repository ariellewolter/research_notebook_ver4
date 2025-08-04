import React, { useState } from 'react';
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    Button,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Code as CodeIcon,
} from '@mui/icons-material';
import { saveFileDialog } from '@/utils/fileSystemAPI';
import { CITATION_STYLES } from '../../constants/citationStyles';
import { formatCitation, LiteratureNote } from '../../utils/citationFormatter';
import { generateRTF, generateHTML, generateDocx, generateBibTeX } from '../../utils/exportFormatters';

interface CitationExportProps {
    literatureNotes: LiteratureNote[];
    filename: string;
    onFilenameChange: (filename: string) => void;
    loading: boolean;
    onExport: (format: string, content: string, extension: string) => Promise<void>;
}

const CitationExport: React.FC<CitationExportProps> = ({
    literatureNotes,
    filename,
    onFilenameChange,
    loading,
    onExport,
}) => {
    const [selectedStyle, setSelectedStyle] = useState('apa');
    const [exportFormat, setExportFormat] = useState<'bibliography' | 'in-text' | 'footnotes'>('bibliography');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        // Auto-select all literature notes
        setSelectedItems(literatureNotes.map(note => note.id));
    }, [literatureNotes]);

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

    const handleExportCitations = async (format: 'txt' | 'rtf' | 'html' | 'docx' | 'bibtex') => {
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

            await onExport(format, content, extension);
        } catch (err) {
            setError('Failed to export citations. Please try again.');
        }
    };

    return (
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
                    onChange={(e) => onFilenameChange(e.target.value)}
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
                    onClick={() => handleExportCitations('txt')}
                    disabled={selectedItems.length === 0 || loading}
                    startIcon={<DownloadIcon />}
                >
                    Export TXT
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => handleExportCitations('rtf')}
                    disabled={selectedItems.length === 0 || loading}
                    startIcon={<DownloadIcon />}
                >
                    Export RTF
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => handleExportCitations('html')}
                    disabled={selectedItems.length === 0 || loading}
                    startIcon={<DownloadIcon />}
                >
                    Export HTML
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => handleExportCitations('docx')}
                    disabled={selectedItems.length === 0 || loading}
                    startIcon={<DownloadIcon />}
                >
                    Export DOCX
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => handleExportCitations('bibtex')}
                    disabled={selectedItems.length === 0 || loading}
                    startIcon={<CodeIcon />}
                >
                    Export BibTeX
                </Button>
            </Box>

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
        </Box>
    );
};

export default CitationExport; 