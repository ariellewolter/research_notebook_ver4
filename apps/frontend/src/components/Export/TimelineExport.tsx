import React from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    Download as DownloadIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { generateTimelineData, formatTimelineForExport, TimelineItem } from '../../utils/exportFormatters';

interface TimelineExportProps {
    projects: any[];
    experiments: any[];
    protocols: any[];
    loading: boolean;
    onExport: (format: string, content: any, mimeType: string, extension: string) => Promise<void>;
}

const TimelineExport: React.FC<TimelineExportProps> = ({
    projects,
    experiments,
    protocols,
    loading,
    onExport,
}) => {
    const [error, setError] = React.useState<string | null>(null);
    const [timelineData, setTimelineData] = React.useState<TimelineItem[]>([]);

    React.useEffect(() => {
        const timeline = generateTimelineData(projects, experiments, protocols);
        setTimelineData(timeline);
    }, [projects, experiments, protocols]);

    const handleExportTimeline = async (format: 'csv' | 'json' | 'xlsx') => {
        setError(null);

        try {
            const timelineExport = formatTimelineForExport(timelineData);

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

            await onExport(format, content, mimeType, extension);
        } catch (err) {
            setError('Failed to export timeline. Please try again.');
        }
    };

    return (
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
                    onClick={() => handleExportTimeline('csv')}
                    disabled={loading}
                    startIcon={<DownloadIcon />}
                >
                    Export CSV
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => handleExportTimeline('json')}
                    disabled={loading}
                    startIcon={<DownloadIcon />}
                >
                    Export JSON
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => handleExportTimeline('xlsx')}
                    disabled={loading}
                    startIcon={<DownloadIcon />}
                >
                    Export Excel
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

export default TimelineExport; 