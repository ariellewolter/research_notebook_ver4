export interface CitationStyle {
    key: string;
    name: string;
    url: string;
}

export const CITATION_STYLES: CitationStyle[] = [
    { key: 'apa', name: 'APA (American Psychological Association)', url: 'https://www.zotero.org/styles/apa' },
    { key: 'mla', name: 'MLA (Modern Language Association)', url: 'https://www.zotero.org/styles/modern-language-association' },
    { key: 'chicago-author-date', name: 'Chicago Author-Date', url: 'https://www.zotero.org/styles/chicago-author-date' },
    { key: 'chicago-note-bibliography', name: 'Chicago Note-Bibliography', url: 'https://www.zotero.org/styles/chicago-note-bibliography' },
    { key: 'ieee', name: 'IEEE', url: 'https://www.zotero.org/styles/ieee' },
    { key: 'nature', name: 'Nature', url: 'https://www.zotero.org/styles/nature' },
    { key: 'science', name: 'Science', url: 'https://www.zotero.org/styles/science' },
    { key: 'cell', name: 'Cell', url: 'https://www.zotero.org/styles/cell' },
    { key: 'plos', name: 'PLOS', url: 'https://www.zotero.org/styles/plos' },
    { key: 'bmc', name: 'BMC', url: 'https://www.zotero.org/styles/bmc' },
]; 