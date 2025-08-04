import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Tooltip,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Alert,
    LinearProgress,
    Switch,
    FormControlLabel,
    InputAdornment,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    Science,
    Timeline,
    Analytics,
    Settings,
    ExpandMore,
    Visibility,
    VisibilityOff,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    Warning,
    Error,
    Info,
    Category,
    Functions,
    DateRange,
    TextFields,
    ToggleOn,
    List as ListIcon,
    BarChart,
    PieChart
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    BarChart as RechartsBarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface VariableCategory {
    id: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    unit?: string;
    dataType: 'number' | 'text' | 'boolean' | 'date' | 'select';
    options?: string; // JSON array for select type
    minValue?: number;
    maxValue?: number;
    isRequired: boolean;
    isGlobal: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ExperimentVariable {
    id: string;
    experimentId: string;
    categoryId: string;
    name: string;
    description?: string;
    unit?: string;
    dataType: 'number' | 'text' | 'boolean' | 'date' | 'select';
    isRequired: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
    category: VariableCategory;
    values: VariableValue[];
}

interface VariableValue {
    id: string;
    variableId: string;
    value: string;
    timestamp: string;
    notes?: string;
    metadata?: string;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}

interface Experiment {
    id: string;
    name: string;
    description?: string;
    project: {
        id: string;
        name: string;
    };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

const ExperimentalVariableTracker: React.FC = () => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<VariableCategory[]>([]);
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [selectedExperiment, setSelectedExperiment] = useState<string>('');
    const [experimentVariables, setExperimentVariables] = useState<ExperimentVariable[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Dialog states
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [variableDialogOpen, setVariableDialogOpen] = useState(false);
    const [valueDialogOpen, setValueDialogOpen] = useState(false);
    const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);

    // Form states
    const [editingCategory, setEditingCategory] = useState<VariableCategory | null>(null);
    const [editingVariable, setEditingVariable] = useState<ExperimentVariable | null>(null);
    const [selectedVariable, setSelectedVariable] = useState<ExperimentVariable | null>(null);

    const [categoryForm, setCategoryForm] = useState<{
        name: string;
        description: string;
        color: string;
        icon: string;
        unit: string;
        dataType: 'number' | 'text' | 'boolean' | 'date' | 'select';
        options: string;
        minValue: string;
        maxValue: string;
        isRequired: boolean;
        isGlobal: boolean;
    }>({
        name: '',
        description: '',
        color: '#0088FE',
        icon: 'Science',
        unit: '',
        dataType: 'text',
        options: '',
        minValue: '',
        maxValue: '',
        isRequired: false,
        isGlobal: false
    });

    const [variableForm, setVariableForm] = useState<{
        categoryId: string;
        name: string;
        description: string;
        unit: string;
        dataType: 'number' | 'text' | 'boolean' | 'date' | 'select';
        isRequired: boolean;
        order: number;
    }>({
        categoryId: '',
        name: '',
        description: '',
        unit: '',
        dataType: 'text',
        isRequired: false,
        order: 0
    });

    const [valueForm, setValueForm] = useState({
        value: '',
        notes: ''
    });

    // Fix Bug 20: Add cleanup for API calls when component unmounts
    const abortControllerRef = useRef<AbortController | null>(null);

    // Memoize API functions to prevent unnecessary re-renders
    const fetchCategories = useCallback(async () => {
        if (!token) return;
        
        try {
            const controller = new AbortController();
            abortControllerRef.current = controller;
            
            const response = await api.get('/experimental-variables/categories', {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            });
            setCategories(response.data);
            setError(null);
        } catch (error: any) {
            if (error.name === 'AbortError') return; // Ignore aborted requests
            console.error('Failed to fetch categories:', error);
            setError('Failed to fetch categories. Please try again.');
        }
    }, [token]);

    const fetchExperiments = useCallback(async () => {
        if (!token) return;
        
        try {
            const controller = new AbortController();
            abortControllerRef.current = controller;
            
            const response = await api.get('/projects/experiments/all', {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            });
            setExperiments(response.data);
            setError(null);
        } catch (error: any) {
            if (error.name === 'AbortError') return; // Ignore aborted requests
            console.error('Failed to fetch experiments:', error);
            setError('Failed to fetch experiments. Please try again.');
        }
    }, [token]);

    const fetchExperimentVariables = useCallback(async (experimentId: string) => {
        if (!token || !experimentId) return;
        
        setLoading(true);
        try {
            const controller = new AbortController();
            abortControllerRef.current = controller;
            
            const response = await api.get(`/experimental-variables/experiments/${experimentId}/variables`, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            });
            setExperimentVariables(response.data);
            setError(null);
        } catch (error: any) {
            if (error.name === 'AbortError') return; // Ignore aborted requests
            console.error('Failed to fetch experiment variables:', error);
            setError('Failed to fetch experiment variables. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchAnalytics = useCallback(async () => {
        if (!token || !selectedExperiment) return;
        
        try {
            const controller = new AbortController();
            abortControllerRef.current = controller;
            
            const response = await api.get('/experimental-variables/analytics', {
                headers: { Authorization: `Bearer ${token}` },
                params: { experimentId: selectedExperiment },
                signal: controller.signal
            });
            setAnalytics(response.data);
            setError(null);
        } catch (error: any) {
            if (error.name === 'AbortError') return; // Ignore aborted requests
            console.error('Failed to fetch analytics:', error);
            setError('Failed to fetch analytics. Please try again.');
        }
    }, [token, selectedExperiment]);

    // Initialize data on component mount
    useEffect(() => {
        fetchCategories();
        fetchExperiments();

        // Cleanup function
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchCategories, fetchExperiments]);

    // Handle experiment selection changes
    useEffect(() => {
        if (selectedExperiment) {
            fetchExperimentVariables(selectedExperiment);
            fetchAnalytics();
        } else {
            // Clear state when no experiment is selected
            setExperimentVariables([]);
            setAnalytics(null);
        }
    }, [selectedExperiment, fetchExperimentVariables, fetchAnalytics]);

    const validateCategoryForm = (): string | null => {
        // Fix Bug 17: Add proper error handling for form validation
        try {
            if (!categoryForm.name.trim()) {
                return 'Category name is required';
            }
            const dataType = categoryForm.dataType;
            if (dataType === 'select' && !categoryForm.options.trim()) {
                return 'Options are required for select type';
            }
            if (dataType === 'select' && categoryForm.options.trim()) {
                // Fix Bug 18: Add error handling for JSON parsing
                try {
                    const options = JSON.parse(categoryForm.options);
                    if (!Array.isArray(options) || options.length === 0) {
                        return 'Options must be a non-empty JSON array';
                    }
                } catch (parseError) {
                    return 'Options must be a valid JSON array';
                }
            }
            if (dataType === 'number' && categoryForm.minValue && categoryForm.maxValue) {
                const min = parseFloat(categoryForm.minValue);
                const max = parseFloat(categoryForm.maxValue);
                if (isNaN(min) || isNaN(max)) {
                    return 'Min and max values must be valid numbers';
                }
                if (min >= max) {
                    return 'Min value must be less than max value';
                }
            }
            return null;
        } catch (error) {
            console.error('Validation error:', error);
            return 'An error occurred during validation';
        }
    };

    const validateVariableForm = (): string | null => {
        try {
            if (!variableForm.name.trim()) {
                return 'Variable name is required';
            }
            if (!variableForm.categoryId) {
                return 'Category is required';
            }
            if (variableForm.order < 0) {
                return 'Order must be a non-negative number';
            }
            return null;
        } catch (error) {
            console.error('Validation error:', error);
            return 'An error occurred during validation';
        }
    };

    const validateValueForm = (): string | null => {
        try {
            if (!valueForm.value.trim()) {
                return 'Value is required';
            }
            if (selectedVariable?.dataType === 'number') {
                const numValue = parseFloat(valueForm.value);
                if (isNaN(numValue)) {
                    return 'Value must be a valid number';
                }
                // Check min/max constraints if they exist
                const category = selectedVariable.category;
                if (category.minValue !== undefined && numValue < category.minValue) {
                    return `Value must be at least ${category.minValue}`;
                }
                if (category.maxValue !== undefined && numValue > category.maxValue) {
                    return `Value must be at most ${category.maxValue}`;
                }
            }
            return null;
        } catch (error) {
            console.error('Validation error:', error);
            return 'An error occurred during validation';
        }
    };

    const handleCategorySubmit = async () => {
        const validationError = validateCategoryForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            const data = {
                ...categoryForm,
                minValue: categoryForm.minValue ? parseFloat(categoryForm.minValue) : undefined,
                maxValue: categoryForm.maxValue ? parseFloat(categoryForm.maxValue) : undefined
            };

            const controller = new AbortController();
            abortControllerRef.current = controller;

            if (editingCategory) {
                await api.put(`/experimental-variables/categories/${editingCategory.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal
                });
            } else {
                await api.post('/experimental-variables/categories', data, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal
                });
            }

            setCategoryDialogOpen(false);
            setEditingCategory(null);
            setCategoryForm({
                name: '',
                description: '',
                color: '#0088FE',
                icon: 'Science',
                unit: '',
                dataType: 'text',
                options: '',
                minValue: '',
                maxValue: '',
                isRequired: false,
                isGlobal: false
            });
            setError(null);
            await fetchCategories();
        } catch (error: any) {
            if (error.name === 'AbortError') return; // Ignore aborted requests
            console.error('Failed to save category:', error);
            setError(error.response?.data?.error || 'Failed to save category. Please try again.');
        }
    };

    const handleVariableSubmit = async () => {
        const validationError = validateVariableForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            const data = {
                ...variableForm,
                order: parseInt(variableForm.order.toString())
            };

            const controller = new AbortController();
            abortControllerRef.current = controller;

            if (editingVariable) {
                await api.put(`/experimental-variables/variables/${editingVariable.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal
                });
            } else {
                await api.post(`/experimental-variables/experiments/${selectedExperiment}/variables`, data, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal
                });
            }

            setVariableDialogOpen(false);
            setEditingVariable(null);
            setVariableForm({
                categoryId: '',
                name: '',
                description: '',
                unit: '',
                dataType: 'text',
                isRequired: false,
                order: 0
            });
            setError(null);
            await fetchExperimentVariables(selectedExperiment);
        } catch (error: any) {
            if (error.name === 'AbortError') return; // Ignore aborted requests
            console.error('Failed to save variable:', error);
            setError(error.response?.data?.error || 'Failed to save variable. Please try again.');
        }
    };

    const handleValueSubmit = async () => {
        if (!selectedVariable) return;

        const validationError = validateValueForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            const controller = new AbortController();
            abortControllerRef.current = controller;

            await api.post(`/experimental-variables/variables/${selectedVariable.id}/values`, valueForm, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            });

            setValueDialogOpen(false);
            setSelectedVariable(null);
            setValueForm({ value: '', notes: '' });
            setError(null);
            await fetchExperimentVariables(selectedExperiment);
        } catch (error: any) {
            if (error.name === 'AbortError') return; // Ignore aborted requests
            console.error('Failed to save value:', error);
            setError(error.response?.data?.error || 'Failed to save value. Please try again.');
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        try {
            const controller = new AbortController();
            abortControllerRef.current = controller;

            await api.delete(`/experimental-variables/categories/${categoryId}`, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            });
            setError(null);
            await fetchCategories();
        } catch (error: any) {
            if (error.name === 'AbortError') return; // Ignore aborted requests
            console.error('Failed to delete category:', error);
            setError(error.response?.data?.error || 'Failed to delete category. Please try again.');
        }
    };

    const handleDeleteVariable = async (variableId: string) => {
        if (!window.confirm('Are you sure you want to delete this variable?')) return;

        try {
            const controller = new AbortController();
            abortControllerRef.current = controller;

            await api.delete(`/experimental-variables/variables/${variableId}`, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            });
            setError(null);
            await fetchExperimentVariables(selectedExperiment);
        } catch (error: any) {
            if (error.name === 'AbortError') return; // Ignore aborted requests
            console.error('Failed to delete variable:', error);
            setError(error.response?.data?.error || 'Failed to delete variable. Please try again.');
        }
    };

    const renderValueInput = (dataType: string, options?: string) => {
        switch (dataType) {
            case 'number':
                return (
                    <TextField
                        fullWidth
                        type="number"
                        label="Value"
                        value={valueForm.value}
                        onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })}
                        InputProps={{
                            endAdornment: selectedVariable?.unit && (
                                <InputAdornment position="end">{selectedVariable.unit}</InputAdornment>
                            )
                        }}
                    />
                );
            case 'boolean':
                return (
                    <FormControl fullWidth>
                        <InputLabel>Value</InputLabel>
                        <Select
                            value={valueForm.value}
                            onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })}
                            label="Value"
                        >
                            <MenuItem value="true">True</MenuItem>
                            <MenuItem value="false">False</MenuItem>
                            <MenuItem value="1">Yes (1)</MenuItem>
                            <MenuItem value="0">No (0)</MenuItem>
                        </Select>
                    </FormControl>
                );
            case 'date':
                return (
                    <TextField
                        fullWidth
                        type="datetime-local"
                        label="Value"
                        value={valueForm.value}
                        onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                );
            case 'select':
                let selectOptions: string[] = [];
                try {
                    selectOptions = options ? JSON.parse(options) : [];
                    if (!Array.isArray(selectOptions)) {
                        selectOptions = [];
                    }
                } catch (parseError) {
                    console.error('Failed to parse select options:', parseError);
                    selectOptions = [];
                }
                return (
                    <FormControl fullWidth>
                        <InputLabel>Value</InputLabel>
                        <Select
                            value={valueForm.value}
                            onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })}
                            label="Value"
                        >
                            {selectOptions.map((option: string) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );
            default:
                return (
                    <TextField
                        fullWidth
                        label="Value"
                        value={valueForm.value}
                        onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })}
                    />
                );
        }
    };

    const getDataTypeIcon = (dataType: string) => {
        switch (dataType) {
            case 'number': return <Functions />;
            case 'text': return <TextFields />;
            case 'boolean': return <ToggleOn />;
            case 'date': return <DateRange />;
            case 'select': return <ListIcon />;
            default: return <TextFields />;
        }
    };

    const renderAnalytics = () => {
        if (!analytics) return null;

        return (
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Variable Distribution by Category
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsPieChart>
                                    <Pie
                                        data={analytics.variableStats.map((stat: any) => ({
                                            name: categories.find(c => c.id === stat.categoryId)?.name || 'Unknown',
                                            value: stat._count.id
                                        }))}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {analytics.variableStats.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Recent Variable Values
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Variable</TableCell>
                                            <TableCell>Value</TableCell>
                                            <TableCell>Time</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {analytics.recentValues.map((value: any) => (
                                            <TableRow key={value.id}>
                                                <TableCell>{value.variable.name}</TableCell>
                                                <TableCell>{value.value}</TableCell>
                                                <TableCell>
                                                    {new Date(value.timestamp).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Experimental Variable Tracker</Typography>
                <Box display="flex" gap={2}>
                    <Button
                        variant="outlined"
                        startIcon={<Category />}
                        onClick={() => {
                            setEditingCategory(null);
                            setCategoryDialogOpen(true);
                        }}
                    >
                        Add Category
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Analytics />}
                        onClick={() => setAnalyticsDialogOpen(true)}
                    >
                        Analytics
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="Categories" />
                    <Tab label="Experiment Variables" />
                    <Tab label="Value Tracking" />
                </Tabs>
            </Paper>

            {activeTab === 0 && (
                <Grid container spacing={3}>
                    {categories.map((category) => (
                        <Grid item xs={12} md={6} lg={4} key={category.id}>
                            <Card>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: '50%',
                                                    bgcolor: category.color || '#0088FE',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {getDataTypeIcon(category.dataType)}
                                            </Box>
                                            <Typography variant="h6">{category.name}</Typography>
                                        </Box>
                                        <Box>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setEditingCategory(category);
                                                    setCategoryForm({
                                                        name: category.name,
                                                        description: category.description || '',
                                                        color: category.color || '#0088FE',
                                                        icon: category.icon || 'Science',
                                                        unit: category.unit || '',
                                                        dataType: category.dataType,
                                                        options: category.options || '',
                                                        minValue: category.minValue?.toString() || '',
                                                        maxValue: category.maxValue?.toString() || '',
                                                        isRequired: category.isRequired,
                                                        isGlobal: category.isGlobal
                                                    });
                                                    setCategoryDialogOpen(true);
                                                }}
                                            >
                                                <Edit />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteCategory(category.id)}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                    {category.description && (
                                        <Typography variant="body2" color="textSecondary" mb={2}>
                                            {category.description}
                                        </Typography>
                                    )}
                                    <Box display="flex" gap={1} flexWrap="wrap">
                                        <Chip
                                            label={category.dataType}
                                            size="small"
                                            color="primary"
                                        />
                                        {category.unit && (
                                            <Chip
                                                label={category.unit}
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                        {category.isRequired && (
                                            <Chip
                                                label="Required"
                                                size="small"
                                                color="error"
                                            />
                                        )}
                                        {category.isGlobal && (
                                            <Chip
                                                label="Global"
                                                size="small"
                                                color="success"
                                            />
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {activeTab === 1 && (
                <Box>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Select Experiment</InputLabel>
                        <Select
                            value={selectedExperiment}
                            onChange={(e) => setSelectedExperiment(e.target.value)}
                            label="Select Experiment"
                        >
                            {experiments.map((experiment) => (
                                <MenuItem key={experiment.id} value={experiment.id}>
                                    {experiment.name} - {experiment.project.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {selectedExperiment && (
                        <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">Experiment Variables</Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() => {
                                        setEditingVariable(null);
                                        setVariableDialogOpen(true);
                                    }}
                                >
                                    Add Variable
                                </Button>
                            </Box>

                            {loading ? (
                                <LinearProgress />
                            ) : (
                                <Grid container spacing={3}>
                                    {experimentVariables.map((variable) => (
                                        <Grid item xs={12} md={6} lg={4} key={variable.id}>
                                            <Card>
                                                <CardContent>
                                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                                        <Typography variant="h6">{variable.name}</Typography>
                                                        <Box>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    setEditingVariable(variable);
                                                                    setVariableForm({
                                                                        categoryId: variable.categoryId,
                                                                        name: variable.name,
                                                                        description: variable.description || '',
                                                                        unit: variable.unit || '',
                                                                        dataType: variable.dataType,
                                                                        isRequired: variable.isRequired,
                                                                        order: variable.order
                                                                    });
                                                                    setVariableDialogOpen(true);
                                                                }}
                                                            >
                                                                <Edit />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteVariable(variable.id)}
                                                            >
                                                                <Delete />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                    {variable.description && (
                                                        <Typography variant="body2" color="textSecondary" mb={2}>
                                                            {variable.description}
                                                        </Typography>
                                                    )}
                                                    <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                                                        <Chip
                                                            label={variable.category.name}
                                                            size="small"
                                                            color="primary"
                                                        />
                                                        <Chip
                                                            label={variable.dataType}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                        {variable.unit && (
                                                            <Chip
                                                                label={variable.unit}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                    </Box>
                                                    {variable.values.length > 0 && (
                                                        <Typography variant="body2">
                                                            Latest: {variable.values[0].value}
                                                        </Typography>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>
                    )}
                </Box>
            )}

            {activeTab === 2 && (
                <Box>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Select Experiment</InputLabel>
                        <Select
                            value={selectedExperiment}
                            onChange={(e) => setSelectedExperiment(e.target.value)}
                            label="Select Experiment"
                        >
                            {experiments.map((experiment) => (
                                <MenuItem key={experiment.id} value={experiment.id}>
                                    {experiment.name} - {experiment.project.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {selectedExperiment && (
                        <Grid container spacing={3}>
                            {experimentVariables.map((variable) => (
                                <Grid item xs={12} md={6} lg={4} key={variable.id}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                {variable.name}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" mb={2}>
                                                {variable.category.name} • {variable.dataType}
                                            </Typography>
                                            {variable.values.length > 0 && (
                                                <Typography variant="h5" gutterBottom>
                                                    {variable.values[0].value}
                                                    {variable.unit && ` ${variable.unit}`}
                                                </Typography>
                                            )}
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                onClick={() => {
                                                    setSelectedVariable(variable);
                                                    setValueForm({ value: '', notes: '' });
                                                    setValueDialogOpen(true);
                                                }}
                                            >
                                                Record Value
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            )}

            {/* Category Dialog */}
            <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Create New Category'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Name"
                                value={categoryForm.name}
                                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Color"
                                type="color"
                                value={categoryForm.color}
                                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={2}
                                value={categoryForm.description}
                                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Data Type</InputLabel>
                                <Select
                                    value={categoryForm.dataType}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, dataType: e.target.value as any })}
                                    label="Data Type"
                                >
                                    <MenuItem value="text">Text</MenuItem>
                                    <MenuItem value="number">Number</MenuItem>
                                    <MenuItem value="boolean">Boolean</MenuItem>
                                    <MenuItem value="date">Date</MenuItem>
                                    <MenuItem value="select">Select</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Unit"
                                value={categoryForm.unit}
                                onChange={(e) => setCategoryForm({ ...categoryForm, unit: e.target.value })}
                            />
                        </Grid>
                        {categoryForm.dataType === 'select' && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Options (JSON array)"
                                    placeholder='["Option 1", "Option 2", "Option 3"]'
                                    value={categoryForm.options}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, options: e.target.value })}
                                    required
                                    helperText="Enter options as a JSON array"
                                />
                            </Grid>
                        )}
                        {categoryForm.dataType === 'number' && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Min Value"
                                        type="number"
                                        value={categoryForm.minValue}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, minValue: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Max Value"
                                        type="number"
                                        value={categoryForm.maxValue}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, maxValue: e.target.value })}
                                    />
                                </Grid>
                            </>
                        )}
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={categoryForm.isRequired}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, isRequired: e.target.checked })}
                                    />
                                }
                                label="Required"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={categoryForm.isGlobal}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, isGlobal: e.target.checked })}
                                    />
                                }
                                label="Global (Available across all projects)"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCategorySubmit} variant="contained">
                        {editingCategory ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Variable Dialog */}
            <Dialog open={variableDialogOpen} onClose={() => setVariableDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingVariable ? 'Edit Variable' : 'Add Variable to Experiment'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={variableForm.categoryId}
                                    onChange={(e) => setVariableForm({ ...variableForm, categoryId: e.target.value })}
                                    label="Category"
                                    required
                                >
                                    {categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Name"
                                value={variableForm.name}
                                onChange={(e) => setVariableForm({ ...variableForm, name: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={2}
                                value={variableForm.description}
                                onChange={(e) => setVariableForm({ ...variableForm, description: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Unit"
                                value={variableForm.unit}
                                onChange={(e) => setVariableForm({ ...variableForm, unit: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Order"
                                type="number"
                                value={variableForm.order}
                                onChange={(e) => setVariableForm({ ...variableForm, order: parseInt(e.target.value) })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={variableForm.isRequired}
                                        onChange={(e) => setVariableForm({ ...variableForm, isRequired: e.target.checked })}
                                    />
                                }
                                label="Required"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setVariableDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleVariableSubmit} variant="contained">
                        {editingVariable ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Value Dialog */}
            <Dialog open={valueDialogOpen} onClose={() => setValueDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Record Value for {selectedVariable?.name}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            {selectedVariable && renderValueInput(selectedVariable.dataType, selectedVariable.category.options)}
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notes"
                                multiline
                                rows={3}
                                value={valueForm.notes}
                                onChange={(e) => setValueForm({ ...valueForm, notes: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setValueDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleValueSubmit} variant="contained">
                        Record Value
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Analytics Dialog */}
            <Dialog open={analyticsDialogOpen} onClose={() => setAnalyticsDialogOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle>Variable Tracking Analytics</DialogTitle>
                <DialogContent>
                    {renderAnalytics()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAnalyticsDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ExperimentalVariableTracker; 