import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
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
    Alert,
    Snackbar,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Paper,
    InputAdornment,
    Tooltip,
    Badge,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Drawer,
    List as MUIList,
    ListItem as MUIListItem,
    ListItemText as MUIListItemText,
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import {
    Restaurant as RecipeIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Search as SearchIcon,
    ExpandMore as ExpandMoreIcon,
    Science as ScienceIcon,
    LocalDining as MediaIcon,
    WaterDrop as BufferIcon,
    Inventory as SolutionIcon,
    Category as CategoryIcon,
    Info as InfoIcon,
    Storage as StorageIcon,
    Schedule as ScheduleIcon,
    Source as SourceIcon,
    Public as PublicIcon,
    Lock as PrivateIcon,
} from '@mui/icons-material';
import { recipesApi } from '../services/api';
import ColorLegend from '../components/Legend/ColorLegend';
import { useThemePalette } from '../services/ThemePaletteContext';
import { NOTE_TYPE_TO_PALETTE_ROLE } from '../services/colorPalettes';
import ImportExportDialog from '../components/ImportExportDialog';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import EntityLinksSidebar from '../components/EntityLinksSidebar';

interface RecipeIngredient {
    id: string;
    name: string;
    amount: number;
    unit: string;
    concentration?: string;
    supplier?: string;
    catalogNumber?: string;
    notes?: string;
}

interface RecipeStep {
    id: string;
    stepNumber: number;
    title: string;
    description?: string;
    duration?: string;
    notes?: string;
}

interface Recipe {
    id: string;
    name: string;
    description?: string;
    category: string;
    type: string;
    ingredients: RecipeIngredient[];
    steps?: RecipeStep[];
    instructions?: string;
    notes?: string;
    pH?: number;
    osmolarity?: string;
    storage?: string;
    shelfLife?: string;
    source?: string;
    version: string;
    isPublic: boolean;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
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

const Recipes: React.FC = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openRecipeDialog, setOpenRecipeDialog] = useState(false);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [types, setTypes] = useState<string[]>([]);
    const [importExportOpen, setImportExportOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    const [recipeFormData, setRecipeFormData] = useState({
        name: '',
        description: '',
        category: '',
        type: '',
        ingredients: [] as RecipeIngredient[],
        steps: [] as RecipeStep[],
        instructions: '',
        notes: '',
        pH: undefined as number | undefined,
        osmolarity: '',
        storage: '',
        shelfLife: '',
        source: '',
        version: '1.0',
        isPublic: false,
    });

    const recipeCategories = [
        'Media',
        'Buffer',
        'Solution',
        'Reagent',
        'Staining',
        'Fixative',
        'Other',
    ];

    const recipeTypes = {
        'Media': ['Cell Culture Media', 'Bacterial Media', 'Fungal Media', 'Selective Media', 'Enriched Media'],
        'Buffer': ['PBS', 'Tris Buffer', 'Citrate Buffer', 'Phosphate Buffer', 'Acetate Buffer', 'HEPES Buffer'],
        'Solution': ['Lysis Buffer', 'Wash Buffer', 'Blocking Buffer', 'Loading Buffer', 'Running Buffer'],
        'Reagent': ['Staining Reagent', 'Detection Reagent', 'Enzyme Reagent', 'Antibody Diluent'],
        'Staining': ['H&E Staining', 'Immunofluorescence', 'Immunohistochemistry', 'Crystal Violet'],
        'Fixative': ['Formalin', 'Paraformaldehyde', 'Glutaraldehyde', 'Methanol'],
        'Other': ['Custom Solution', 'Specialty Reagent'],
    };

    const RECIPE_FIELDS = [
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'category', label: 'Category' },
        { key: 'type', label: 'Type' },
        { key: 'ingredients', label: 'Ingredients' },
        { key: 'instructions', label: 'Instructions' },
        { key: 'notes', label: 'Notes' },
        { key: 'pH', label: 'pH' },
        { key: 'osmolarity', label: 'Osmolarity' },
        { key: 'storage', label: 'Storage' },
        { key: 'shelfLife', label: 'Shelf Life' },
        { key: 'source', label: 'Source' },
        { key: 'version', label: 'Version' },
    ];

    const { palette } = useThemePalette();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

    // Load recipes on component mount
    useEffect(() => {
        loadData();
    }, []);

    // Filter recipes when search query or filters change
    useEffect(() => {
        filterRecipes();
    }, [searchQuery, selectedCategory, selectedType, recipes]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [recipesRes, categoriesRes, typesRes] = await Promise.allSettled([
                recipesApi.getAll(),
                recipesApi.getCategories(),
                recipesApi.getTypes(),
            ]);

            if (recipesRes.status === 'fulfilled') {
                const loadedRecipes = recipesRes.value.data.recipes || recipesRes.value.data || [];
                setRecipes(loadedRecipes);
                setFilteredRecipes(loadedRecipes);
            }

            if (categoriesRes.status === 'fulfilled') {
                setCategories(categoriesRes.value.data.categories || []);
            }

            if (typesRes.status === 'fulfilled') {
                setTypes(typesRes.value.data.types || []);
            }

            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load data');
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterRecipes = () => {
        let filtered = recipes;

        if (selectedCategory) {
            filtered = filtered.filter(recipe => recipe.category === selectedCategory);
        }

        if (selectedType) {
            filtered = filtered.filter(recipe => recipe.type === selectedType);
        }

        if (searchQuery.trim()) {
            filtered = filtered.filter(recipe =>
                recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (recipe.description && recipe.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                recipe.type.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredRecipes(filtered);
    };

    const handleOpenRecipeDialog = (recipe?: Recipe) => {
        if (recipe) {
            setEditingRecipe(recipe);
            setRecipeFormData({
                name: recipe.name,
                description: recipe.description || '',
                category: recipe.category,
                type: recipe.type,
                ingredients: recipe.ingredients,
                steps: recipe.steps || [],
                instructions: recipe.instructions || '',
                notes: recipe.notes || '',
                pH: recipe.pH,
                osmolarity: recipe.osmolarity || '',
                storage: recipe.storage || '',
                shelfLife: recipe.shelfLife || '',
                source: recipe.source || '',
                version: recipe.version,
                isPublic: recipe.isPublic,
            });
        } else {
            setEditingRecipe(null);
            setRecipeFormData({
                name: '',
                description: '',
                category: '',
                type: '',
                ingredients: [],
                steps: [],
                instructions: '',
                notes: '',
                pH: undefined,
                osmolarity: '',
                storage: '',
                shelfLife: '',
                source: '',
                version: '1.0',
                isPublic: false,
            });
        }
        setOpenRecipeDialog(true);
    };

    const handleOpenViewDialog = (recipe: Recipe) => {
        setViewingRecipe(recipe);
        setSelectedRecipeId(recipe.id);
        setSidebarOpen(true);
        setOpenViewDialog(true);
    };

    const handleCloseRecipeDialog = () => {
        setOpenRecipeDialog(false);
        setEditingRecipe(null);
    };

    const handleCloseViewDialog = () => {
        setOpenViewDialog(false);
        setViewingRecipe(null);
        setSelectedRecipeId(null);
    };

    const handleSaveRecipe = async () => {
        if (!recipeFormData.name.trim()) {
            setSnackbar({
                open: true,
                message: 'Please enter a recipe name',
                severity: 'error',
            });
            return;
        }

        if (!recipeFormData.category.trim()) {
            setSnackbar({
                open: true,
                message: 'Please select a category',
                severity: 'error',
            });
            return;
        }

        if (!recipeFormData.type.trim()) {
            setSnackbar({
                open: true,
                message: 'Please select a type',
                severity: 'error',
            });
            return;
        }

        if (recipeFormData.ingredients.length === 0) {
            setSnackbar({
                open: true,
                message: 'Please add at least one ingredient',
                severity: 'error',
            });
            return;
        }

        try {
            setSaving(true);
            if (editingRecipe) {
                await recipesApi.update(editingRecipe.id, recipeFormData);
                setSnackbar({
                    open: true,
                    message: 'Recipe updated successfully',
                    severity: 'success',
                });
            } else {
                await recipesApi.create(recipeFormData);
                setSnackbar({
                    open: true,
                    message: 'Recipe created successfully',
                    severity: 'success',
                });
            }
            handleCloseRecipeDialog();
            loadData();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to save recipe',
                severity: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRecipe = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this recipe?')) {
            return;
        }

        try {
            await recipesApi.delete(id);
            setSnackbar({
                open: true,
                message: 'Recipe deleted successfully',
                severity: 'success',
            });
            loadData();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to delete recipe',
                severity: 'error',
            });
        }
    };

    const addIngredient = () => {
        setRecipeFormData(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, {
                id: Date.now().toString(),
                name: '',
                amount: 0,
                unit: '',
                concentration: '',
                supplier: '',
                catalogNumber: '',
                notes: '',
            }],
        }));
    };

    const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
        setRecipeFormData(prev => ({
            ...prev,
            ingredients: prev.ingredients.map((ingredient, i) =>
                i === index ? { ...ingredient, [field]: value } : ingredient
            ),
        }));
    };

    const removeIngredient = (index: number) => {
        setRecipeFormData(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index),
        }));
    };

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'media':
                return <MediaIcon />;
            case 'buffer':
                return <BufferIcon />;
            case 'solution':
                return <SolutionIcon />;
            default:
                return <ScienceIcon />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'media':
                return 'primary';
            case 'buffer':
                return 'secondary';
            case 'solution':
                return 'success';
            case 'reagent':
                return 'warning';
            case 'staining':
                return 'info';
            case 'fixative':
                return 'error';
            default:
                return 'default';
        }
    };

    const handleImport = async (rows: any[]) => {
        for (const row of rows) {
            await recipesApi.create(row);
        }
        await loadData();
        setSnackbar({ open: true, message: 'Import successful!', severity: 'success' });
    };
    const handleExport = (format: 'csv' | 'json' | 'xlsx') => {
        const exportData = recipes.map(r => ({
            name: r.name,
            description: r.description,
            category: r.category,
            type: r.type,
            ingredients: r.ingredients,
            instructions: r.instructions,
            notes: r.notes,
            pH: r.pH,
            osmolarity: r.osmolarity,
            storage: r.storage,
            shelfLife: r.shelfLife,
            source: r.source,
            version: r.version,
        }));
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            saveAs(blob, 'recipes.json');
        } else if (format === 'csv') {
            const csv = Papa.unparse(exportData);
            const blob = new Blob([csv], { type: 'text/csv' });
            saveAs(blob, 'recipes.csv');
        } else if (format === 'xlsx') {
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Recipes');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            saveAs(blob, 'recipes.xlsx');
        }
        setSnackbar({ open: true, message: `Exported as ${format.toUpperCase()}`, severity: 'success' });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', height: '100%' }}>
            {sidebarOpen && selectedRecipeId && (
                <EntityLinksSidebar
                    entityType="recipe"
                    entityId={selectedRecipeId}
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />
            )}
            <Box sx={{ flex: 1, p: 3 }}>
                <Button onClick={() => setSidebarOpen(o => !o)} sx={{ mb: 2 }}>
                    {sidebarOpen ? 'Hide Connections' : 'Show Connections'}
                </Button>
                <ColorLegend types={['recipe']} />
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" component="h1" display="flex" alignItems="center" gap={1}>
                        <RecipeIcon />
                        Recipe Book
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenRecipeDialog()}
                    >
                        Create Recipe
                    </Button>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setImportExportOpen(true)}>Import/Export</Button>
                    <ImportExportDialog
                        open={importExportOpen}
                        onClose={() => setImportExportOpen(false)}
                        entityType="Recipe"
                        fields={RECIPE_FIELDS}
                        onImport={handleImport}
                        onExport={handleExport}
                        data={recipes}
                    />
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Filters */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                placeholder="Search recipes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    label="Category"
                                >
                                    <MenuItem value="">All Categories</MenuItem>
                                    {recipeCategories.map((category) => (
                                        <MenuItem key={category} value={category}>
                                            {category}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    label="Type"
                                >
                                    <MenuItem value="">All Types</MenuItem>
                                    {selectedCategory && recipeTypes[selectedCategory as keyof typeof recipeTypes]?.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Typography variant="body2" color="text.secondary">
                                {filteredRecipes.length} recipes found
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Recipes Grid */}
                <Grid container spacing={3}>
                    {filteredRecipes.map((recipe) => (
                        <Grid item xs={12} md={6} lg={4} key={recipe.id}>
                            <Card sx={{ borderLeft: `8px solid ${palette[NOTE_TYPE_TO_PALETTE_ROLE['recipe']]}` }}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {getCategoryIcon(recipe.category)}
                                            <Typography variant="h6" component="h2">
                                                {recipe.name}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            {recipe.isPublic ? (
                                                <Tooltip title="Public Recipe">
                                                    <PublicIcon color="primary" fontSize="small" />
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title="Private Recipe">
                                                    <PrivateIcon color="action" fontSize="small" />
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </Box>

                                    <Box mb={2}>
                                        <Chip
                                            label={recipe.category}
                                            color={getCategoryColor(recipe.category) as any}
                                            size="small"
                                            sx={{ mr: 1 }}
                                        />
                                        <Chip
                                            label={recipe.type}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </Box>

                                    {recipe.description && (
                                        <Typography variant="body2" color="text.secondary" mb={2}>
                                            {recipe.description}
                                        </Typography>
                                    )}

                                    <Box display="flex" gap={1} mb={2}>
                                        {recipe.pH && (
                                            <Chip
                                                label={`pH ${recipe.pH}`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                        {recipe.storage && (
                                            <Chip
                                                label={recipe.storage}
                                                size="small"
                                                variant="outlined"
                                                icon={<StorageIcon />}
                                            />
                                        )}
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        {recipe.ingredients.length} ingredients
                                    </Typography>

                                    <Box display="flex" gap={1}>
                                        <Button
                                            size="small"
                                            startIcon={<ViewIcon />}
                                            onClick={() => handleOpenViewDialog(recipe)}
                                        >
                                            View
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => handleOpenRecipeDialog(recipe)}
                                        >
                                            Edit
                                        </Button>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteRecipe(recipe.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {filteredRecipes.length === 0 && !loading && (
                    <Box textAlign="center" py={4}>
                        <Typography variant="h6" color="text.secondary">
                            No recipes found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Create your first recipe to get started
                        </Typography>
                    </Box>
                )}

                {/* Create/Edit Recipe Dialog */}
                <Dialog
                    open={openRecipeDialog}
                    onClose={handleCloseRecipeDialog}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        {editingRecipe ? 'Edit Recipe' : 'Create New Recipe'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Recipe Name"
                                    value={recipeFormData.name}
                                    onChange={(e) => setRecipeFormData(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Version"
                                    value={recipeFormData.version}
                                    onChange={(e) => setRecipeFormData(prev => ({ ...prev, version: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    value={recipeFormData.description}
                                    onChange={(e) => setRecipeFormData(prev => ({ ...prev, description: e.target.value }))}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={recipeFormData.category}
                                        onChange={(e) => {
                                            setRecipeFormData(prev => ({
                                                ...prev,
                                                category: e.target.value,
                                                type: '' // Reset type when category changes
                                            }));
                                        }}
                                        label="Category"
                                    >
                                        {recipeCategories.map((category) => (
                                            <MenuItem key={category} value={category}>
                                                {category}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={recipeFormData.type}
                                        onChange={(e) => setRecipeFormData(prev => ({ ...prev, type: e.target.value }))}
                                        label="Type"
                                    >
                                        {recipeFormData.category && recipeTypes[recipeFormData.category as keyof typeof recipeTypes]?.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="pH"
                                    type="number"
                                    value={recipeFormData.pH || ''}
                                    onChange={(e) => setRecipeFormData(prev => ({ ...prev, pH: e.target.value ? parseFloat(e.target.value) : undefined }))}
                                    inputProps={{ min: 0, max: 14, step: 0.1 }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Osmolarity"
                                    value={recipeFormData.osmolarity}
                                    onChange={(e) => setRecipeFormData(prev => ({ ...prev, osmolarity: e.target.value }))}
                                    placeholder="e.g., 300 mOsm/L"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Storage"
                                    value={recipeFormData.storage}
                                    onChange={(e) => setRecipeFormData(prev => ({ ...prev, storage: e.target.value }))}
                                    placeholder="e.g., 4°C, -20°C, RT"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Shelf Life"
                                    value={recipeFormData.shelfLife}
                                    onChange={(e) => setRecipeFormData(prev => ({ ...prev, shelfLife: e.target.value }))}
                                    placeholder="e.g., 6 months, 1 year"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Source"
                                    value={recipeFormData.source}
                                    onChange={(e) => setRecipeFormData(prev => ({ ...prev, source: e.target.value }))}
                                    placeholder="e.g., Lab protocol, Paper reference, Commercial"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Instructions"
                                    value={recipeFormData.instructions}
                                    onChange={(e) => setRecipeFormData(prev => ({ ...prev, instructions: e.target.value }))}
                                    multiline
                                    rows={3}
                                    placeholder="Step-by-step instructions for preparing this recipe..."
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Notes"
                                    value={recipeFormData.notes}
                                    onChange={(e) => setRecipeFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    multiline
                                    rows={2}
                                    placeholder="Additional notes, tips, or warnings..."
                                />
                            </Grid>

                            {/* Ingredients Section */}
                            <Grid item xs={12}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6">Ingredients</Typography>
                                    <Button
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={addIngredient}
                                    >
                                        Add Ingredient
                                    </Button>
                                </Box>

                                {recipeFormData.ingredients.map((ingredient, index) => (
                                    <Paper key={ingredient.id} sx={{ p: 2, mb: 2 }}>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={12} md={3}>
                                                <TextField
                                                    fullWidth
                                                    label="Ingredient Name"
                                                    value={ingredient.name}
                                                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                                                    required
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <TextField
                                                    fullWidth
                                                    label="Amount"
                                                    type="number"
                                                    value={ingredient.amount}
                                                    onChange={(e) => updateIngredient(index, 'amount', parseFloat(e.target.value) || 0)}
                                                    required
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <TextField
                                                    fullWidth
                                                    label="Unit"
                                                    value={ingredient.unit}
                                                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                                                    required
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <TextField
                                                    fullWidth
                                                    label="Concentration"
                                                    value={ingredient.concentration || ''}
                                                    onChange={(e) => updateIngredient(index, 'concentration', e.target.value)}
                                                    placeholder="e.g., 10%, 1M"
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <TextField
                                                    fullWidth
                                                    label="Supplier"
                                                    value={ingredient.supplier || ''}
                                                    onChange={(e) => updateIngredient(index, 'supplier', e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={1}>
                                                <IconButton
                                                    color="error"
                                                    onClick={() => removeIngredient(index)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Notes"
                                                    value={ingredient.notes || ''}
                                                    onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                                                    size="small"
                                                />
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                ))}
                            </Grid>

                            {/* Steps Section */}
                            <Grid item xs={12}>
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="h6">Recipe Steps</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {recipeFormData.steps.map((step, index) => (
                                            <Box key={step.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                                                <Grid container spacing={2} alignItems="center">
                                                    <Grid item xs={12} sm={3}>
                                                        <TextField
                                                            fullWidth
                                                            label="Step Title"
                                                            value={step.title}
                                                            onChange={(e) => {
                                                                const newSteps = [...recipeFormData.steps];
                                                                newSteps[index] = { ...newSteps[index], title: e.target.value };
                                                                setRecipeFormData(prev => ({ ...prev, steps: newSteps }));
                                                            }}
                                                            size="small"
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={2}>
                                                        <TextField
                                                            fullWidth
                                                            label="Duration"
                                                            value={step.duration || ''}
                                                            onChange={(e) => {
                                                                const newSteps = [...recipeFormData.steps];
                                                                newSteps[index] = { ...newSteps[index], duration: e.target.value };
                                                                setRecipeFormData(prev => ({ ...prev, steps: newSteps }));
                                                            }}
                                                            size="small"
                                                            placeholder="e.g., 30 min"
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={2}>
                                                        <TextField
                                                            fullWidth
                                                            label="Step Number"
                                                            type="number"
                                                            value={step.stepNumber}
                                                            onChange={(e) => {
                                                                const newSteps = [...recipeFormData.steps];
                                                                newSteps[index] = { ...newSteps[index], stepNumber: parseInt(e.target.value) };
                                                                setRecipeFormData(prev => ({ ...prev, steps: newSteps }));
                                                            }}
                                                            size="small"
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={3}>
                                                        <IconButton
                                                            color="error"
                                                            onClick={() => {
                                                                const newSteps = recipeFormData.steps.filter((_, i) => i !== index);
                                                                setRecipeFormData(prev => ({ ...prev, steps: newSteps.map((s, i) => ({ ...s, stepNumber: i + 1 })) }));
                                                            }}
                                                            size="small"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Grid>
                                                </Grid>
                                                <TextField
                                                    fullWidth
                                                    label="Step Description"
                                                    multiline
                                                    rows={2}
                                                    value={step.description || ''}
                                                    onChange={(e) => {
                                                        const newSteps = [...recipeFormData.steps];
                                                        newSteps[index] = { ...newSteps[index], description: e.target.value };
                                                        setRecipeFormData(prev => ({ ...prev, steps: newSteps }));
                                                    }}
                                                    sx={{ mt: 1 }}
                                                    size="small"
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Notes"
                                                    value={step.notes || ''}
                                                    onChange={(e) => {
                                                        const newSteps = [...recipeFormData.steps];
                                                        newSteps[index] = { ...newSteps[index], notes: e.target.value };
                                                        setRecipeFormData(prev => ({ ...prev, steps: newSteps }));
                                                    }}
                                                    sx={{ mt: 1 }}
                                                    size="small"
                                                />
                                            </Box>
                                        ))}
                                        <Button
                                            variant="outlined"
                                            startIcon={<AddIcon />}
                                            onClick={() => {
                                                setRecipeFormData(prev => ({
                                                    ...prev,
                                                    steps: [
                                                        ...prev.steps,
                                                        {
                                                            id: `step_${Date.now()}`,
                                                            stepNumber: prev.steps.length + 1,
                                                            title: '',
                                                            description: '',
                                                            duration: '',
                                                            notes: '',
                                                        },
                                                    ],
                                                }));
                                            }}
                                            sx={{ mt: 1 }}
                                            disabled={saving}
                                        >
                                            Add Step
                                        </Button>
                                    </AccordionDetails>
                                </Accordion>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseRecipeDialog}>Cancel</Button>
                        <Button
                            onClick={handleSaveRecipe}
                            variant="contained"
                            disabled={saving}
                        >
                            {saving ? <CircularProgress size={20} /> : (editingRecipe ? 'Update' : 'Create')}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* View Recipe Dialog */}
                <Dialog
                    open={openViewDialog}
                    onClose={handleCloseViewDialog}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        {viewingRecipe?.name}
                    </DialogTitle>
                    <DialogContent>
                        {viewingRecipe && (
                            <Box>
                                <Box display="flex" gap={1} mb={2}>
                                    <Chip
                                        label={viewingRecipe.category}
                                        color={getCategoryColor(viewingRecipe.category) as any}
                                    />
                                    <Chip
                                        label={viewingRecipe.type}
                                        variant="outlined"
                                    />
                                    {viewingRecipe.isPublic ? (
                                        <Chip label="Public" color="primary" size="small" />
                                    ) : (
                                        <Chip label="Private" color="default" size="small" />
                                    )}
                                </Box>

                                {viewingRecipe.description && (
                                    <Typography variant="body1" mb={2}>
                                        {viewingRecipe.description}
                                    </Typography>
                                )}

                                <Grid container spacing={2} mb={3}>
                                    {viewingRecipe.pH && (
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="body2" color="text.secondary">
                                                pH: {viewingRecipe.pH}
                                            </Typography>
                                        </Grid>
                                    )}
                                    {viewingRecipe.osmolarity && (
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="body2" color="text.secondary">
                                                Osmolarity: {viewingRecipe.osmolarity}
                                            </Typography>
                                        </Grid>
                                    )}
                                    {viewingRecipe.storage && (
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="body2" color="text.secondary">
                                                Storage: {viewingRecipe.storage}
                                            </Typography>
                                        </Grid>
                                    )}
                                    {viewingRecipe.shelfLife && (
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="body2" color="text.secondary">
                                                Shelf Life: {viewingRecipe.shelfLife}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>

                                {viewingRecipe.instructions && (
                                    <Box mb={3}>
                                        <Typography variant="h6" mb={1}>Instructions</Typography>
                                        <Typography variant="body2" whiteSpace="pre-wrap">
                                            {viewingRecipe.instructions}
                                        </Typography>
                                    </Box>
                                )}

                                <Box mb={3}>
                                    <Typography variant="h6" mb={1}>Ingredients</Typography>
                                    <TableContainer component={Paper}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Ingredient</TableCell>
                                                    <TableCell>Amount</TableCell>
                                                    <TableCell>Unit</TableCell>
                                                    <TableCell>Concentration</TableCell>
                                                    <TableCell>Supplier</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {viewingRecipe.ingredients.map((ingredient) => (
                                                    <TableRow key={ingredient.id}>
                                                        <TableCell>{ingredient.name}</TableCell>
                                                        <TableCell>{ingredient.amount}</TableCell>
                                                        <TableCell>{ingredient.unit}</TableCell>
                                                        <TableCell>{ingredient.concentration || '-'}</TableCell>
                                                        <TableCell>{ingredient.supplier || '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>

                                {viewingRecipe.notes && (
                                    <Box mb={3}>
                                        <Typography variant="h6" mb={1}>Notes</Typography>
                                        <Typography variant="body2" whiteSpace="pre-wrap">
                                            {viewingRecipe.notes}
                                        </Typography>
                                    </Box>
                                )}

                                {viewingRecipe.source && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Source: {viewingRecipe.source}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                        {viewingRecipe && (
                            <Box mt={4}>
                                <Typography variant="h6" mb={2}>Recipe Executions</Typography>
                                <RecipeExecutionsView recipe={viewingRecipe} />
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseViewDialog}>Close</Button>
                    </DialogActions>
                </Dialog>

                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
                </Snackbar>
            </Box>
        </Box>
    );
};

export default Recipes;

function RecipeExecutionsView({ recipe }: { recipe: Recipe }) {
    const [executions, setExecutions] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [creating, setCreating] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    useEffect(() => {
        setLoading(true);
        recipesApi.getExecutions(recipe.id).then(res => {
            setExecutions(res.data.executions || []);
            setLoading(false);
        }).catch(err => {
            setError('Failed to load executions');
            setLoading(false);
        });
    }, [recipe.id]);
    const handleCreateExecution = async () => {
        setCreating(true);
        try {
            await recipesApi.createExecution(recipe.id, { status: 'planned', completedSteps: [] });
            const res = await recipesApi.getExecutions(recipe.id);
            setExecutions(res.data.executions || []);
        } finally {
            setCreating(false);
        }
    };
    if (loading) return <Typography>Loading executions...</Typography>;
    if (error) return <Alert severity="error">{error}</Alert>;
    return (
        <Box>
            <Button onClick={handleCreateExecution} variant="outlined" size="small" disabled={creating} sx={{ mb: 2 }}>
                {creating ? 'Creating...' : 'New Execution'}
            </Button>
            {executions.length === 0 && <Typography>No executions found for this recipe.</Typography>}
            {executions.map(exec => (
                <RecipeExecutionStepCompletionView
                    key={exec.id}
                    execution={exec}
                    steps={recipe.steps || []}
                    recipeId={recipe.id}
                    onExecutionUpdated={async () => {
                        const res = await recipesApi.getExecutions(recipe.id);
                        setExecutions(res.data.executions || []);
                    }}
                />
            ))}
        </Box>
    );
}

function RecipeExecutionStepCompletionView({ execution, steps, recipeId, onExecutionUpdated }: { execution: any, steps: any[], recipeId: string, onExecutionUpdated: () => void }) {
    const [editing, setEditing] = React.useState(false);
    const [completedSteps, setCompletedSteps] = React.useState<string[]>(execution.completedSteps || []);
    const [saving, setSaving] = React.useState(false);
    React.useEffect(() => {
        setCompletedSteps(execution.completedSteps || []);
    }, [execution.completedSteps]);
    const handleSave = async () => {
        setSaving(true);
        try {
            await recipesApi.updateExecution(recipeId, execution.id, { completedSteps });
            setEditing(false);
            onExecutionUpdated();
        } finally {
            setSaving(false);
        }
    };
    return (
        <Box sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
                Execution: {execution.status} • {execution.startDate ? new Date(execution.startDate).toLocaleString() : 'No start date'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                {steps.map((step: any) => (
                    <FormControlLabel
                        key={step.id}
                        control={
                            <Checkbox
                                checked={completedSteps.includes(step.id)}
                                disabled={!editing}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setCompletedSteps(prev => {
                                        if (checked) return [...prev, step.id];
                                        return prev.filter(id => id !== step.id);
                                    });
                                }}
                            />
                        }
                        label={`Step ${step.stepNumber}: ${step.title}`}
                    />
                ))}
            </Box>
            {editing ? (
                <Box sx={{ mt: 1 }}>
                    <Button onClick={handleSave} variant="contained" size="small" disabled={saving} sx={{ mr: 1 }}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button onClick={() => setEditing(false)} size="small" disabled={saving}>Cancel</Button>
                </Box>
            ) : (
                <Button onClick={() => setEditing(true)} size="small" sx={{ mt: 1 }}>Edit</Button>
            )}
        </Box>
    );
} 