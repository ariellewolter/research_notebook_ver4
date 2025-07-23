import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Tabs, Tab, Box, Typography, TextField, MenuItem, Select, InputLabel, FormControl, Snackbar, Alert } from '@mui/material';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ImportExportDialogProps {
    open: boolean;
    onClose: () => void;
    entityType: string;
    fields: { key: string; label: string }[];
    onImport: (rows: any[]) => Promise<void>;
    onExport: (format: 'csv' | 'json' | 'xlsx') => void;
    data: any[];
}

const formats = [
    { value: 'csv', label: 'CSV' },
    { value: 'xlsx', label: 'Excel' },
    { value: 'json', label: 'JSON' },
];

const ImportExportDialog: React.FC<ImportExportDialogProps> = ({ open, onClose, entityType, fields, onImport, onExport, data }) => {
    const [tab, setTab] = useState(0);
    const [importFormat, setImportFormat] = useState('csv');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importPreview, setImportPreview] = useState<any[]>([]);
    const [importError, setImportError] = useState<string | null>(null);
    const [mapping, setMapping] = useState<{ [key: string]: string }>({});
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    const handleTabChange = (_: any, value: number) => setTab(value);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setImportFile(file || null);
        setImportPreview([]);
        setMapping({});
        setImportError(null);
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    let rows: any[] = [];
                    if (importFormat === 'csv') {
                        const parsed = Papa.parse(evt.target?.result as string, { header: true });
                        if (parsed.errors.length) throw new Error(parsed.errors[0].message);
                        rows = parsed.data;
                    } else if (importFormat === 'json') {
                        rows = JSON.parse(evt.target?.result as string);
                    } else if (importFormat === 'xlsx') {
                        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        rows = XLSX.utils.sheet_to_json(ws);
                    }
                    setImportPreview(rows);
                    // Auto-map columns
                    const first = rows[0] || {};
                    const autoMap: any = {};
                    fields.forEach(f => {
                        const match = Object.keys(first).find(k => k.toLowerCase() === f.key.toLowerCase() || k.toLowerCase() === f.label.toLowerCase());
                        if (match) autoMap[f.key] = match;
                    });
                    setMapping(autoMap);
                } catch (err: any) {
                    setImportError(err.message || 'Failed to parse file');
                }
            };
            if (importFormat === 'xlsx') reader.readAsBinaryString(file);
            else reader.readAsText(file);
        }
    };

    const handleImport = async () => {
        if (!importPreview.length) return setSnackbar({ open: true, message: 'No data to import', severity: 'error' });
        // Map columns
        const mapped = importPreview.map(row => {
            const obj: any = {};
            fields.forEach(f => {
                obj[f.key] = row[mapping[f.key]];
            });
            return obj;
        });
        try {
            await onImport(mapped);
            setSnackbar({ open: true, message: 'Import successful!', severity: 'success' });
            setImportFile(null);
            setImportPreview([]);
            setMapping({});
            onClose();
        } catch (err: any) {
            setSnackbar({ open: true, message: err.message || 'Import failed', severity: 'error' });
        }
    };

    const handleExport = (format: 'csv' | 'json' | 'xlsx') => {
        onExport(format);
        setSnackbar({ open: true, message: `Exported as ${format.toUpperCase()}`, severity: 'success' });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Import/Export {entityType}</DialogTitle>
            <DialogContent>
                <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
                    <Tab label="Import" />
                    <Tab label="Export" />
                </Tabs>
                {tab === 0 && (
                    <Box>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Format</InputLabel>
                            <Select value={importFormat} label="Format" onChange={e => setImportFormat(e.target.value)}>
                                {formats.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <Button variant="outlined" component="label" sx={{ mb: 2 }}>
                            Select File
                            <input type="file" accept={importFormat === 'xlsx' ? '.xlsx,.xls' : importFormat === 'csv' ? '.csv' : '.json'} hidden onChange={handleFileChange} />
                        </Button>
                        {importError && <Alert severity="error">{importError}</Alert>}
                        {importPreview.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2">Column Mapping</Typography>
                                {fields.map(f => (
                                    <FormControl key={f.key} fullWidth sx={{ mb: 1 }}>
                                        <InputLabel>{f.label}</InputLabel>
                                        <Select
                                            value={mapping[f.key] || ''}
                                            label={f.label}
                                            onChange={e => setMapping({ ...mapping, [f.key]: e.target.value })}
                                        >
                                            <MenuItem value="">Ignore</MenuItem>
                                            {Object.keys(importPreview[0] || {}).map(col => (
                                                <MenuItem key={col} value={col}>{col}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                ))}
                                <Button variant="contained" color="primary" onClick={handleImport}>Import</Button>
                            </Box>
                        )}
                    </Box>
                )}
                {tab === 1 && (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>Export Format</Typography>
                        {formats.map(f => (
                            <Button key={f.value} variant="outlined" sx={{ mr: 2, mb: 2 }} onClick={() => handleExport(f.value as any)}>{f.label}</Button>
                        ))}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
            </Snackbar>
        </Dialog>
    );
};

export default ImportExportDialog; 