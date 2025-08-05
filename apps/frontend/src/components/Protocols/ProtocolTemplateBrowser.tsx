import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Tooltip,
  Badge,
  Avatar,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  PlayArrow as ExecuteIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Star as StarIcon,
  Timer as TimerIcon,
  Science as ScienceIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingIcon,
  NewReleases as NewIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Sort as SortIcon,
} from '@mui/icons-material';

interface ProtocolTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  author: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  isBookmarked: boolean;
  executionCount: number;
  lastExecuted?: Date;
}

interface ProtocolVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'date';
  required: boolean;
  description: string;
  defaultValue?: any;
}

export const ProtocolTemplateBrowser: React.FC = () => {
  const [templates, setTemplates] = useState<ProtocolTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ProtocolTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<ProtocolTemplate | null>(null);
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Mock data
  const mockTemplates: ProtocolTemplate[] = [
    {
      id: 'template_1',
      name: 'PCR Amplification Protocol',
      description: 'Standard PCR protocol for DNA amplification with customizable parameters',
      category: 'molecular-biology',
      estimatedDuration: 180,
      difficulty: 'intermediate',
      author: 'Dr. Smith',
      rating: 4.5,
      reviewCount: 23,
      tags: ['PCR', 'DNA', 'amplification', 'molecular-biology'],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      isFavorite: true,
      isBookmarked: false,
      executionCount: 45,
      lastExecuted: new Date('2024-01-18'),
    },
    {
      id: 'template_2',
      name: 'Cell Culture Maintenance',
      description: 'Daily maintenance protocol for mammalian cell cultures',
      category: 'cell-culture',
      estimatedDuration: 30,
      difficulty: 'beginner',
      author: 'Dr. Johnson',
      rating: 4.8,
      reviewCount: 15,
      tags: ['cell-culture', 'maintenance', 'mammalian'],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-12'),
      isFavorite: false,
      isBookmarked: true,
      executionCount: 67,
      lastExecuted: new Date('2024-01-19'),
    },
    {
      id: 'template_3',
      name: 'Protein Extraction and Western Blot',
      description: 'Complete protocol for protein extraction and western blot analysis',
      category: 'biochemistry',
      estimatedDuration: 240,
      difficulty: 'advanced',
      author: 'Dr. Williams',
      rating: 4.2,
      reviewCount: 8,
      tags: ['protein', 'western-blot', 'extraction', 'biochemistry'],
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-08'),
      isFavorite: false,
      isBookmarked: false,
      executionCount: 12,
      lastExecuted: new Date('2024-01-15'),
    },
    {
      id: 'template_4',
      name: 'Microscopy Sample Preparation',
      description: 'Protocol for preparing samples for fluorescence microscopy',
      category: 'microscopy',
      estimatedDuration: 90,
      difficulty: 'intermediate',
      author: 'Dr. Brown',
      rating: 4.6,
      reviewCount: 19,
      tags: ['microscopy', 'fluorescence', 'sample-preparation'],
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-22'),
      isFavorite: true,
      isBookmarked: true,
      executionCount: 28,
      lastExecuted: new Date('2024-01-21'),
    },
  ];

  useEffect(() => {
    setTemplates(mockTemplates);
    setFilteredTemplates(mockTemplates);
  }, []);

  useEffect(() => {
    // Filter and sort templates
    let filtered = templates;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(template => template.difficulty === selectedDifficulty);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.rating - a.rating;
        case 'duration':
          return a.estimatedDuration - b.estimatedDuration;
        case 'recent':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'popular':
          return b.executionCount - a.executionCount;
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  const handleExecuteTemplate = (template: ProtocolTemplate) => {
    setSelectedTemplate(template);
    setExecuteDialogOpen(true);
  };

  const toggleFavorite = (templateId: string) => {
    setTemplates(prev => prev.map(template =>
      template.id === templateId
        ? { ...template, isFavorite: !template.isFavorite }
        : template
    ));
  };

  const toggleBookmark = (templateId: string) => {
    setTemplates(prev => prev.map(template =>
      template.id === templateId
        ? { ...template, isBookmarked: !template.isBookmarked }
        : template
    ));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'molecular-biology':
        return <ScienceIcon />;
      case 'cell-culture':
        return <CategoryIcon />;
      case 'biochemistry':
        return <ScienceIcon />;
      case 'microscopy':
        return <CategoryIcon />;
      default:
        return <CategoryIcon />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getFavorites = () => templates.filter(t => t.isFavorite);
  const getBookmarks = () => templates.filter(t => t.isBookmarked);
  const getRecent = () => templates.filter(t => t.lastExecuted).sort((a, b) => 
    (b.lastExecuted?.getTime() || 0) - (a.lastExecuted?.getTime() || 0)
  );

  const getTemplatesForTab = () => {
    switch (activeTab) {
      case 0: // All
        return filteredTemplates;
      case 1: // Favorites
        return filteredTemplates.filter(t => t.isFavorite);
      case 2: // Bookmarks
        return filteredTemplates.filter(t => t.isBookmarked);
      case 3: // Recent
        return filteredTemplates.filter(t => t.lastExecuted);
      default:
        return filteredTemplates;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Protocol Templates</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {/* Navigate to template editor */}}
        >
          Create Template
        </Button>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search protocols..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="molecular-biology">Molecular Biology</MenuItem>
                  <MenuItem value="cell-culture">Cell Culture</MenuItem>
                  <MenuItem value="biochemistry">Biochemistry</MenuItem>
                  <MenuItem value="microscopy">Microscopy</MenuItem>
                  <MenuItem value="analytical">Analytical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  label="Difficulty"
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="rating">Rating</MenuItem>
                  <MenuItem value="duration">Duration</MenuItem>
                  <MenuItem value="recent">Recently Updated</MenuItem>
                  <MenuItem value="popular">Most Popular</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                  setSortBy('name');
                }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label={`All (${filteredTemplates.length})`} />
          <Tab label={`Favorites (${getFavorites().length})`} />
          <Tab label={`Bookmarks (${getBookmarks().length})`} />
          <Tab label={`Recent (${getRecent().length})`} />
        </Tabs>
      </Paper>

      {/* Templates Grid */}
      <Grid container spacing={3}>
        {getTemplatesForTab().map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getCategoryIcon(template.category)}
                    <Typography variant="h6" component="h2">
                      {template.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => toggleFavorite(template.id)}
                      color={template.isFavorite ? 'primary' : 'default'}
                    >
                      {template.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => toggleBookmark(template.id)}
                      color={template.isBookmarked ? 'primary' : 'default'}
                    >
                      {template.isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Rating value={template.rating} precision={0.1} size="small" readOnly />
                  <Typography variant="body2" color="text.secondary">
                    ({template.reviewCount})
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={template.difficulty}
                    color={getDifficultyColor(template.difficulty) as any}
                    size="small"
                  />
                  <Chip
                    icon={<TimerIcon />}
                    label={formatDuration(template.estimatedDuration)}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<TrendingIcon />}
                    label={`${template.executionCount} runs`}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {template.tags.slice(0, 3).map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                  {template.tags.length > 3 && (
                    <Chip
                      label={`+${template.tags.length - 3}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    by {template.author}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {template.lastExecuted ? `Last run: ${template.lastExecuted.toLocaleDateString()}` : 'Never run'}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between' }}>
                <Button
                  variant="contained"
                  startIcon={<ExecuteIcon />}
                  onClick={() => handleExecuteTemplate(template)}
                  fullWidth
                >
                  Execute
                </Button>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Edit">
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Share">
                    <IconButton size="small">
                      <ShareIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {getTemplatesForTab().length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography variant="h6">No protocols found</Typography>
          <Typography variant="body2">
            Try adjusting your search criteria or create a new protocol template.
          </Typography>
        </Box>
      )}

      {/* Execute Dialog */}
      <Dialog open={executeDialogOpen} onClose={() => setExecuteDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Execute Protocol: {selectedTemplate?.name}
        </DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedTemplate.description}
              </Typography>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Protocol Variables</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    Configure any variables for this protocol execution.
                  </Typography>
                  {/* Variable configuration would go here */}
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Execution Settings</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    Configure execution settings and preferences.
                  </Typography>
                  {/* Execution settings would go here */}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExecuteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setExecuteDialogOpen(false);
              // Navigate to protocol executor
              setMessage({ type: 'success', text: 'Starting protocol execution...' });
            }}
          >
            Start Execution
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 