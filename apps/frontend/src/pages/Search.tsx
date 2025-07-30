import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import AdvancedSearch from '../components/Search/AdvancedSearch';

interface SearchResult {
    id: string;
    type: string;
    title: string;
    content: string;
    project?: string;
    createdAt: string;
    score?: number;
}

const Search: React.FC = () => {
    const navigate = useNavigate();

    const handleResultSelect = (result: SearchResult) => {
        // Navigate to the appropriate page based on result type
        switch (result.type) {
            case 'note':
                navigate(`/notes`);
                break;
            case 'project':
                navigate(`/projects`);
                break;
            case 'protocol':
                navigate(`/protocols`);
                break;
            case 'recipe':
                navigate(`/recipes`);
                break;
            case 'database':
                navigate(`/database`);
                break;
            case 'pdf':
                navigate(`/pdfs`);
                break;
            case 'table':
                navigate(`/tables`);
                break;
            case 'task':
                navigate(`/tasks`);
                break;
            case 'literature':
                navigate(`/literature`);
                break;
            default:
                navigate(`/`);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    🔍 Search & Discovery
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Search across all your research data with powerful filters, saved searches, and intelligent suggestions.
                </Typography>
            </Paper>

            <AdvancedSearch onResultSelect={handleResultSelect} />
        </Box>
    );
};

export default Search; 