import React from 'react';
import { useNavigate } from 'react-router-dom';
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

    return <AdvancedSearch onResultSelect={handleResultSelect} />;
};

export default Search; 