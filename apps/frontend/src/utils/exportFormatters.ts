import { LiteratureNote } from './citationFormatter';

export const generateRTF = (citations: string[]): string => {
    const rtfHeader = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}';
    const rtfFooter = '}';
    const rtfCitations = citations.map(citation => 
        `\\f0\\fs24 ${citation.replace(/"/g, '\\"')}\\par\\par`
    ).join('');
    
    return rtfHeader + rtfCitations + rtfFooter;
};

export const generateHTML = (citations: string[], style: string): string => {
    const htmlHeader = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bibliography - ${style.toUpperCase()}</title>
    <style>
        body { font-family: Times New Roman, serif; margin: 2cm; line-height: 1.5; }
        h1 { text-align: center; margin-bottom: 2cm; }
        .citation { margin-bottom: 1em; text-indent: -2em; padding-left: 2em; }
    </style>
</head>
<body>
    <h1>Bibliography</h1>
    <p><em>Citation Style: ${style.toUpperCase()}</em></p>`;
        
    const htmlCitations = citations.map(citation => 
        `<div class="citation">${citation}</div>`
    ).join('');
        
    const htmlFooter = '</body></html>';
        
    return htmlHeader + htmlCitations + htmlFooter;
};

export const generateDocx = (citations: string[]): string => {
    // Simplified DOCX generation - in a real app, you'd use a proper DOCX library
    const docxContent = citations.join('\n\n');
    return docxContent;
};

export const generateBibTeX = (notes: LiteratureNote[]): string => {
    return notes.map(note => {
        const entry = `@article{${note.id},
  title={${note.title || ''}},
  author={${note.authors || ''}},
  journal={${note.journal || ''}},
  year={${note.year || ''}},
  volume={${note.volume || ''}},
  number={${note.issue || ''}},
  pages={${note.pages || ''}},
  doi={${note.doi || ''}},
  url={${note.url || ''}},
  abstract={${note.abstract || ''}},
  keywords={${note.tags || ''}}
}`;
        return entry;
    }).join('\n\n');
};

export interface TimelineItem {
    id: string;
    type: string;
    title: string;
    start: string;
    end: string;
    children?: TimelineItem[];
}

export const generateTimelineData = (
    projects: any[],
    experiments: any[],
    protocols: any[]
): TimelineItem[] => {
    const timeline = [];
    
    // Add projects with their experiments
    projects.forEach(project => {
        const projectExperiments = experiments.filter(exp => exp.projectId === project.id);
        timeline.push({
            id: project.id,
            type: 'project',
            title: project.name,
            start: project.createdAt,
            end: project.status === 'completed' ? project.updatedAt : new Date().toISOString(),
            children: projectExperiments.map(exp => ({
                id: exp.id,
                type: 'experiment',
                title: exp.name,
                start: exp.createdAt,
                end: exp.status === 'completed' ? exp.updatedAt : new Date().toISOString(),
            }))
        });
    });

    // Add protocols
    protocols.forEach(protocol => {
        timeline.push({
            id: protocol.id,
            type: 'protocol',
            title: protocol.name,
            start: protocol.createdAt,
            end: protocol.status === 'completed' ? protocol.updatedAt : new Date().toISOString(),
        });
    });

    return timeline;
};

export const formatTimelineForExport = (timelineData: TimelineItem[]) => {
    return timelineData.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        start_date: item.start,
        end_date: item.end,
        duration_days: Math.ceil((new Date(item.end).getTime() - new Date(item.start).getTime()) / (1000 * 60 * 60 * 24)),
        status: item.end === new Date().toISOString() ? 'ongoing' : 'completed'
    }));
}; 