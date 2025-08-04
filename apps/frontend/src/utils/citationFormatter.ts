export interface CitationItem {
    id: string;
    type: 'article-journal' | 'article' | 'book' | 'chapter' | 'thesis' | 'report';
    title: string;
    author?: Array<{ family: string; given: string }>;
    'container-title'?: string;
    volume?: string;
    issue?: string;
    page?: string;
    issued?: { 'date-parts': number[][] };
    DOI?: string;
    URL?: string;
    abstract?: string;
    keyword?: string[];
    'publisher-place'?: string;
    publisher?: string;
    ISBN?: string;
    ISSN?: string;
}

export interface LiteratureNote {
    id: string;
    title: string;
    authors?: string;
    journal?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    year?: string;
    doi?: string;
    url?: string;
    abstract?: string;
    tags?: string;
}

export const convertToCSLFormat = (item: LiteratureNote): CitationItem => {
    return {
        id: item.id,
        type: 'article-journal',
        title: item.title,
        author: item.authors ? item.authors.split(' and ').map((author: string) => {
            const parts = author.trim().split(' ');
            return {
                family: parts[parts.length - 1] || '',
                given: parts.slice(0, -1).join(' ') || ''
            };
        }) : undefined,
        'container-title': item.journal,
        volume: item.volume,
        issue: item.issue,
        page: item.pages,
        issued: item.year ? { 'date-parts': [[parseInt(item.year)]] } : undefined,
        DOI: item.doi,
        URL: item.url,
        abstract: item.abstract,
        keyword: item.tags ? item.tags.split(',').map((tag: string) => tag.trim()) : undefined,
    };
};

export const formatCitation = (item: LiteratureNote, style: string): string => {
    const cslItem = convertToCSLFormat(item);

    switch (style) {
        case 'apa':
            return formatAPACitation(cslItem);
        case 'mla':
            return formatMLACitation(cslItem);
        case 'chicago-author-date':
            return formatChicagoAuthorDate(cslItem);
        case 'ieee':
            return formatIEEECitation(cslItem);
        default:
            return formatAPACitation(cslItem);
    }
};

export const formatAPACitation = (item: CitationItem): string => {
    const authors = item.author?.map(a => `${a.family}, ${a.given?.charAt(0)}.`).join(', ') || 'Unknown Author';
    const year = item.issued?.['date-parts']?.[0]?.[0] || '';
    const title = item.title || '';
    const journal = item['container-title'] || '';
    const volume = item.volume || '';
    const issue = item.issue || '';
    const pages = item.page || '';
    const doi = item.DOI || '';

    return `${authors} (${year}). ${title}. ${journal}${volume ? `, ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `, ${pages}` : ''}.${doi ? ` https://doi.org/${doi}` : ''}`;
};

export const formatMLACitation = (item: CitationItem): string => {
    const authors = item.author?.map(a => `${a.family}, ${a.given}`).join(', ') || 'Unknown Author';
    const title = item.title || '';
    const journal = item['container-title'] || '';
    const volume = item.volume || '';
    const issue = item.issue || '';
    const year = item.issued?.['date-parts']?.[0]?.[0] || '';
    const pages = item.page || '';

    return `${authors}. "${title}." ${journal}${volume ? `, vol. ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${year ? `, ${year}` : ''}${pages ? `, pp. ${pages}` : ''}.`;
};

export const formatChicagoAuthorDate = (item: CitationItem): string => {
    const authors = item.author?.map(a => `${a.given} ${a.family}`).join(', ') || 'Unknown Author';
    const year = item.issued?.['date-parts']?.[0]?.[0] || '';
    const title = item.title || '';
    const journal = item['container-title'] || '';
    const volume = item.volume || '';
    const issue = item.issue || '';
    const pages = item.page || '';

    return `${authors}. ${year}. "${title}." ${journal}${volume ? ` ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${pages ? `: ${pages}` : ''}.`;
};

export const formatIEEECitation = (item: CitationItem): string => {
    const authors = item.author?.map(a => `${a.given} ${a.family}`).join(', ') || 'Unknown Author';
    const title = item.title || '';
    const journal = item['container-title'] || '';
    const volume = item.volume || '';
    const issue = item.issue || '';
    const year = item.issued?.['date-parts']?.[0]?.[0] || '';
    const pages = item.page || '';

    return `${authors}, "${title}," ${journal}${volume ? `, vol. ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${year ? `, ${year}` : ''}${pages ? `, pp. ${pages}` : ''}.`;
}; 