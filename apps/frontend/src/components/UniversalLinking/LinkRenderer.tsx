import React from 'react';
import { Link } from 'react-router-dom';
import { Chip, Tooltip } from '@mui/material';
import {
    Science as ScienceIcon,
    Assignment as AssignmentIcon,
    Book as BookIcon,
    Description as DescriptionIcon,
    Folder as FolderIcon,
    Article as ArticleIcon,
    Task as TaskIcon,
    TableChart as TableIcon,
    Link as LinkIcon
} from '@mui/icons-material';

interface LinkRendererProps {
    content: string;
    className?: string;
}

const getIconForType = (type: string) => {
    switch (type) {
        case 'experiment': return <ScienceIcon />;
        case 'project': return <FolderIcon />;
        case 'protocol': return <AssignmentIcon />;
        case 'recipe': return <BookIcon />;
        case 'literature': return <ArticleIcon />;
        case 'task': return <TaskIcon />;
        case 'pdf': return <DescriptionIcon />;
        case 'database': return <TableIcon />;
        case 'note': return <DescriptionIcon />;
        default: return <LinkIcon />;
    }
};

const getRouteForType = (type: string) => {
    switch (type) {
        case 'experiment': return '/projects';
        case 'project': return '/projects';
        case 'protocol': return '/protocols';
        case 'recipe': return '/recipes';
        case 'literature': return '/literature-notes';
        case 'task': return '/tasks';
        case 'pdf': return '/pdfs';
        case 'database': return '/database';
        case 'note': return '/notes';
        default: return '/';
    }
};

export const LinkRenderer: React.FC<LinkRendererProps> = ({ content, className = "" }) => {
    // Function to render text with [[ ]] links
    const renderContentWithLinks = (text: string) => {
        if (!text) return null;

        // Split text by [[ ]] links
        const parts = text.split(/(\[\[.*?\]\])/g);

        return parts.map((part, index) => {
            // Check if this part is a link
            const linkMatch = part.match(/\[\[(.*?)\]\]/);

            if (linkMatch) {
                const linkText = linkMatch[1];

                // Try to determine the type based on the link text
                // This is a simple heuristic - in a real app, you'd want to look up the actual item
                let linkType = 'note'; // default
                if (linkText.toLowerCase().includes('experiment') || linkText.toLowerCase().includes('pcr') || linkText.toLowerCase().includes('culture')) {
                    linkType = 'experiment';
                } else if (linkText.toLowerCase().includes('project') || linkText.toLowerCase().includes('discovery') || linkText.toLowerCase().includes('editing')) {
                    linkType = 'project';
                } else if (linkText.toLowerCase().includes('protocol') || linkText.toLowerCase().includes('blot') || linkText.toLowerCase().includes('extraction')) {
                    linkType = 'protocol';
                } else if (linkText.toLowerCase().includes('recipe') || linkText.toLowerCase().includes('media') || linkText.toLowerCase().includes('gel')) {
                    linkType = 'recipe';
                } else if (linkText.toLowerCase().includes('task') || linkText.toLowerCase().includes('order') || linkText.toLowerCase().includes('prepare')) {
                    linkType = 'task';
                } else if (linkText.toLowerCase().includes('pdf') || linkText.toLowerCase().includes('manual')) {
                    linkType = 'pdf';
                } else if (linkText.toLowerCase().includes('database') || linkText.toLowerCase().includes('sample')) {
                    linkType = 'database';
                }

                return (
                    <Tooltip key={index} title={`Click to view ${linkType}`}>
                        <Link
                            to={getRouteForType(linkType)}
                            className="inline-flex items-center gap-1 px-2 py-1 mx-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors duration-200 text-decoration-none"
                            style={{ textDecoration: 'none' }}
                        >
                            {getIconForType(linkType)}
                            <span className="text-sm font-medium">{linkText}</span>
                        </Link>
                    </Tooltip>
                );
            }

            // Regular text
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <div className={`whitespace-pre-wrap ${className}`}>
            {renderContentWithLinks(content)}
        </div>
    );
};

export default LinkRenderer; 