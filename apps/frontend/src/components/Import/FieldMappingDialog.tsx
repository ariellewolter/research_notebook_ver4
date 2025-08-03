import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem,
    TextField, Switch, FormControlLabel, Chip, Alert, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
    Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon,
    ExpandMore as ExpandMoreIcon, CheckCircle as CheckIcon,
    Warning as WarningIcon, Info as InfoIcon
} from '@mui/icons-material';

interface FieldMapping {
    sourceField: string;
    targetField: string;
    transformation?: string;
    required: boolean;
    defaultValue?: any;
    validation?: string;
}

interface FieldMappingDialogProps {
    open: boolean;
    onClose: () => void;
    sourceFields: string[];
    targetFields: string[];
    currentMapping: FieldMapping[];
    onMappingChange: (mapping: FieldMapping[]) => void;
    targetEntity: string;
}

const FieldMappingDialog: React.FC<FieldMappingDialogProps> = ({
    open, onClose, sourceFields, targetFields, currentMapping, onMappingChange, targetEntity
}) => {
    const [mapping, setMapping] = useState<FieldMapping[]>(currentMapping);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [newMapping, setNewMapping] = useState<FieldMapping>({
        sourceField: '',
        targetField: '',
        transformation: '',
        required: false,
        defaultValue: '',
        validation: ''
    });

    const transformations = [
        { value: 'uppercase', label: 'Convert to Uppercase' },
        { value: 'lowercase', label: 'Convert to Lowercase' },
        { value: 'trim', label: 'Trim Whitespace' },
        { value: 'date_format', label: 'Format Date' },
        { value: 'number_format', label: 'Format Number' },
        { value: 'extract_text', label: 'Extract Text' },
        { value: 'combine_fields', label: 'Combine Fields' },
        { value: 'split_field', label: 'Split Field' },
        { value: 'replace_text', label: 'Replace Text' },
        { value: 'custom', label: 'Custom Transformation' }
    ];

    const validationRules = [
        { value: 'required', label: 'Required Field' },
        { value: 'email', label: 'Valid Email' },
        { value: 'url', label: 'Valid URL' },
        { value: 'date', label: 'Valid Date' },
        { value: 'number', label: 'Valid Number' },
        { value: 'min_length', label: 'Minimum Length' },
        { value: 'max_length', label: 'Maximum Length' },
        { value: 'regex', label: 'Regular Expression' },
        { value: 'unique', label: 'Unique Value' },
        { value: 'custom', label: 'Custom Validation' }
    ];

    const getTargetFieldOptions = (entity: string) => {
        const baseFields = {
            experiments: ['name', 'description', 'status', 'startDate', 'endDate', 'projectId', 'protocolId', 'results', 'notes'],
            protocols: ['name', 'description', 'steps', 'equipment', 'reagents', 'duration', 'difficulty', 'category'],
            notes: ['title', 'content', 'type', 'tags', 'createdAt', 'updatedAt', 'experimentId'],
            database: ['name', 'type', 'properties', 'description', 'tags', 'references'],
            projects: ['name', 'description', 'status', 'startDate', 'endDate', 'team', 'budget'],
            tasks: ['name', 'description', 'status', 'priority', 'dueDate', 'assignedTo', 'projectId']
        };
        return baseFields[entity as keyof typeof baseFields] || [];
    };

    useEffect(() => {
        setMapping(currentMapping);
    }, [currentMapping]);

    const handleAddMapping = () => {
        if (newMapping.sourceField && newMapping.targetField) {
            const updatedMapping = [...mapping, { ...newMapping }];
            setMapping(updatedMapping);
            onMappingChange(updatedMapping);
            setNewMapping({
                sourceField: '',
                targetField: '',
                transformation: '',
                required: false,
                defaultValue: '',
                validation: ''
            });
        }
    };

    const handleUpdateMapping = (index: number) => {
        if (editingIndex !== null && newMapping.sourceField && newMapping.targetField) {
            const updatedMapping = [...mapping];
            updatedMapping[editingIndex] = { ...newMapping };
            setMapping(updatedMapping);
            onMappingChange(updatedMapping);
            setEditingIndex(null);
            setNewMapping({
                sourceField: '',
                targetField: '',
                transformation: '',
                required: false,
                defaultValue: '',
                validation: ''
            });
        }
    };

    const handleDeleteMapping = (index: number) => {
        const updatedMapping = mapping.filter((_, i) => i !== index);
        setMapping(updatedMapping);
        onMappingChange(updatedMapping);
    };

    const handleEditMapping = (index: number) => {
        const mappingToEdit = mapping[index];
        setNewMapping({ ...mappingToEdit });
        setEditingIndex(index);
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setNewMapping({
            sourceField: '',
            targetField: '',
            transformation: '',
            required: false,
            defaultValue: '',
            validation: ''
        });
    };

    const getMappingStatus = (mapping: FieldMapping) => {
        if (!mapping.sourceField || !mapping.targetField) {
            return { status: 'error', message: 'Missing required fields' };
        }
        if (mapping.required && !mapping.defaultValue) {
            return { status: 'warning', message: 'Required field without default value' };
        }
        return { status: 'success', message: 'Mapping configured' };
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckIcon color="success" />;
            case 'warning':
                return <WarningIcon color="warning" />;
            case 'error':
                return <InfoIcon color="error" />;
            default:
                return <InfoIcon />;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Typography variant="h6">Field Mapping Configuration</Typography>
                <Typography variant="body2" color="text.secondary">
                    Map source fields to target fields for {targetEntity}
                </Typography>
            </DialogTitle>

            <DialogContent>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                            Add New Mapping
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Source Field</InputLabel>
                                    <Select
                                        value={newMapping.sourceField}
                                        onChange={(e) => setNewMapping(prev => ({ ...prev, sourceField: e.target.value }))}
                                    >
                                        {sourceFields.map(field => (
                                            <MenuItem key={field} value={field}>{field}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Target Field</InputLabel>
                                    <Select
                                        value={newMapping.targetField}
                                        onChange={(e) => setNewMapping(prev => ({ ...prev, targetField: e.target.value }))}
                                    >
                                        {getTargetFieldOptions(targetEntity).map(field => (
                                            <MenuItem key={field} value={field}>{field}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Transformation (Optional)</InputLabel>
                                    <Select
                                        value={newMapping.transformation || ''}
                                        onChange={(e) => setNewMapping(prev => ({ ...prev, transformation: e.target.value }))}
                                    >
                                        <MenuItem value="">No Transformation</MenuItem>
                                        {transformations.map(trans => (
                                            <MenuItem key={trans.value} value={trans.value}>{trans.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Validation Rule (Optional)</InputLabel>
                                    <Select
                                        value={newMapping.validation || ''}
                                        onChange={(e) => setNewMapping(prev => ({ ...prev, validation: e.target.value }))}
                                    >
                                        <MenuItem value="">No Validation</MenuItem>
                                        {validationRules.map(rule => (
                                            <MenuItem key={rule.value} value={rule.value}>{rule.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Default Value (Optional)"
                                    value={newMapping.defaultValue || ''}
                                    onChange={(e) => setNewMapping(prev => ({ ...prev, defaultValue: e.target.value }))}
                                    helperText="Used when source field is empty"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={newMapping.required}
                                            onChange={(e) => setNewMapping(prev => ({ ...prev, required: e.target.checked }))}
                                        />
                                    }
                                    label="Required Field"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Box display="flex" gap={2}>
                                    {editingIndex !== null ? (
                                        <>
                                            <Button
                                                variant="contained"
                                                onClick={() => handleUpdateMapping(editingIndex)}
                                                disabled={!newMapping.sourceField || !newMapping.targetField}
                                            >
                                                Update Mapping
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                onClick={handleCancelEdit}
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            onClick={handleAddMapping}
                                            disabled={!newMapping.sourceField || !newMapping.targetField}
                                            startIcon={<AddIcon />}
                                        >
                                            Add Mapping
                                        </Button>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                            Current Mappings ({mapping.length})
                        </Typography>

                        {mapping.length === 0 ? (
                            <Alert severity="info">
                                No field mappings configured. Add mappings to proceed with import.
                            </Alert>
                        ) : (
                            <TableContainer component={Box}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Source</TableCell>
                                            <TableCell>Target</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mapping.map((map, index) => {
                                            const status = getMappingStatus(map);
                                            return (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {map.sourceField}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {map.targetField}
                                                        </Typography>
                                                        {map.transformation && (
                                                            <Chip
                                                                label={map.transformation}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ mt: 0.5 }}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            {getStatusIcon(status.status)}
                                                            <Typography variant="caption">
                                                                {status.message}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box display="flex" gap={1}>
                                                            <Tooltip title="Edit">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleEditMapping(index)}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Delete">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleDeleteMapping(index)}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">Mapping Statistics</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                                <Box textAlign="center">
                                    <Typography variant="h4" color="primary">
                                        {mapping.length}
                                    </Typography>
                                    <Typography variant="body2">Total Mappings</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Box textAlign="center">
                                    <Typography variant="h4" color="success.main">
                                        {mapping.filter(m => getMappingStatus(m).status === 'success').length}
                                    </Typography>
                                    <Typography variant="body2">Valid Mappings</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Box textAlign="center">
                                    <Typography variant="h4" color="warning.main">
                                        {mapping.filter(m => getMappingStatus(m).status === 'warning').length}
                                    </Typography>
                                    <Typography variant="body2">Warnings</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Box textAlign="center">
                                    <Typography variant="h4" color="error.main">
                                        {mapping.filter(m => getMappingStatus(m).status === 'error').length}
                                    </Typography>
                                    <Typography variant="body2">Errors</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={onClose}
                    disabled={mapping.length === 0}
                >
                    Apply Mapping
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FieldMappingDialog; 