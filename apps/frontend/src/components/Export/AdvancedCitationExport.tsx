import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Alert,
    Tabs,
    Tab,
} from '@mui/material';
import {
    FileDownload as FileDownloadIcon,
    Description as DescriptionIcon,
    Timeline as TimelineIcon,
} from '@mui/icons-material';
import { saveFileDialog } from '@/utils/fileSystemAPI';
import { saveAs } from 'file-saver';
import CitationExport from './CitationExport';
import TimelineExport from './TimelineExport';
import { LiteratureNote } from '../../utils/citationFormatter';

interface AdvancedCitationExportProps {
    open: boolean;
    onClose: () => void;
    literatureNotes: LiteratureNote[];
    projects: any[];
    experiments: any[];
    protocols: any[];
}

const AdvancedCitationExport: React.FC<AdvancedCitationExportProps> = ({
    open, onClose, literatureNotes, projects, experiments, protocols
}) => {
    const [activeTab, setActiveTab] = useState(0);
    const [filename, setFilename] = useState('research-citations');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleCitationExport = async (format: string, content: string, extension: string) => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
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

    const handleTimelineExport = async (format: string, content: any, mimeType: string, extension: string) => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const blob = new Blob([content], { type: mimeType });
            saveAs(blob, `research-timeline.${extension}`);
            setSuccess(`Successfully exported timeline to research-timeline.${extension}`);
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
                    <CitationExport
                        literatureNotes={literatureNotes}
                        filename={filename}
                        onFilenameChange={setFilename}
                        loading={loading}
                        onExport={handleCitationExport}
                    />
                )}

                {activeTab === 1 && (
                    <TimelineExport
                        projects={projects}
                        experiments={experiments}
                        protocols={protocols}
                        loading={loading}
                        onExport={handleTimelineExport}
                    />
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