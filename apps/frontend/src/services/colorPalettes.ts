// Palette roles for full MUI theming
export type PaletteRole =
    | 'primary'
    | 'secondary'
    | 'background'
    | 'paper'
    | 'text'
    | 'error'
    | 'success'
    | 'warning'
    | 'info'
    | 'divider';

export interface Palette {
    primary: string;
    secondary: string;
    background: string;
    paper: string;
    text: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    divider: string;
    // Add more roles as needed
}

// Example curated palettes
export const colorPalettes: Record<string, Palette> = {
    OceanicUI: {
        primary: '#0077B6',
        secondary: '#00B4D8',
        background: '#F6F9FB',
        paper: '#FFFFFF',
        text: '#22223B',
        error: '#FF6F61',
        success: '#06D6A0',
        warning: '#FFD166',
        info: '#118AB2',
        divider: '#E0E0E0',
    },
    SunsetUI: {
        primary: '#FF6F61',
        secondary: '#FFD166',
        background: '#FFF6F0',
        paper: '#FFFFFF',
        text: '#22223B',
        error: '#EF476F',
        success: '#06D6A0',
        warning: '#FFD166',
        info: '#118AB2',
        divider: '#E0E0E0',
    },
    ForestUI: {
        primary: '#386641',
        secondary: '#6A994E',
        background: '#F0F5F1',
        paper: '#FFFFFF',
        text: '#22223B',
        error: '#D7263D',
        success: '#4CAF50',
        warning: '#FFB300',
        info: '#1976D2',
        divider: '#BDBDBD',
    },
    // LavenderDream: soft purples and pinks
    LavenderDream: {
        primary: '#8E7CC3', // lavender
        secondary: '#D5A6BD', // soft pink
        background: '#F3F0F9', // pale lavender
        paper: '#FFFFFF',
        text: '#3E2753',
        error: '#D72660',
        success: '#6DC5A3',
        warning: '#FFD166',
        info: '#A3C4F3',
        divider: '#E0D7F3',
    },
    // SolarizedLight: based on the Solarized color scheme
    SolarizedLight: {
        primary: '#268BD2', // blue
        secondary: '#2AA198', // cyan
        background: '#FDF6E3', // base3
        paper: '#FFFFFF',
        text: '#586E75', // base00
        error: '#DC322F',
        success: '#859900',
        warning: '#B58900',
        info: '#268BD2',
        divider: '#EEE8D5',
    },
    // MidnightBlues: deep blues and grays
    MidnightBlues: {
        primary: '#232946', // deep blue
        secondary: '#B8C1EC', // light blue
        background: '#121629', // almost black
        paper: '#232946',
        text: '#E7E7E7',
        error: '#FF6F61',
        success: '#6DC5A3',
        warning: '#FFD166',
        info: '#A3C4F3',
        divider: '#393E5B',
    },
    RoseGold: {
        // Elegant rose gold theme
        primary: '#B76E79', // rose gold
        secondary: '#FFD6D6', // blush
        background: '#FFF5F5', // soft pink
        paper: '#FFFFFF',
        text: '#3E2723',
        error: '#D7263D',
        success: '#3EC300',
        warning: '#FFB400',
        info: '#A7C7E7',
        divider: '#E0BFB8',
    },
    AutumnSpice: {
        // Warm autumnal theme
        primary: '#A23E12', // burnt orange
        secondary: '#F18805', // pumpkin
        background: '#FFF3E0', // light cream
        paper: '#FFFFFF',
        text: '#4E342E',
        error: '#D7263D',
        success: '#4CAF50',
        warning: '#FFB400',
        info: '#FF8C42',
        divider: '#E0C2A2',
    },
    AquaMint: {
        // Fresh aqua and mint theme
        primary: '#00BFAE', // aqua
        secondary: '#A7FFEB', // mint
        background: '#E0F7FA', // pale aqua
        paper: '#FFFFFF',
        text: '#004D40',
        error: '#D7263D',
        success: '#00C853',
        warning: '#FFD600',
        info: '#00B8D4',
        divider: '#B2DFDB',
    },
    Sandstone: {
        // Warm, soft beige neutrals
        primary: '#C2B280', // sandstone
        secondary: '#E6D3B3', // light sand
        background: '#F8F5F2', // off-white
        paper: '#FFFFFF',
        text: '#5C504A',
        error: '#B85C5C',
        success: '#7CA982',
        warning: '#E2B07A',
        info: '#B3B8A3',
        divider: '#E0D6C3',
    },
    CloudMist: {
        // Cool, airy greys and whites
        primary: '#BFC9CA', // mist grey
        secondary: '#E5E8E8', // pale cloud
        background: '#F9FAFB', // near-white
        paper: '#FFFFFF',
        text: '#4A4A4A',
        error: '#C97D7D',
        success: '#A3C9A8',
        warning: '#E2C275',
        info: '#A3B8C9',
        divider: '#D6DBDF',
    },
    StoneGrey: {
        // Modern, deep greys and charcoals
        primary: '#6D6A75', // stone
        secondary: '#A3A3A3', // light grey
        background: '#F4F4F4', // soft grey
        paper: '#FFFFFF',
        text: '#2E2E2E',
        error: '#B85C5C',
        success: '#7CA982',
        warning: '#E2B07A',
        info: '#7D8CA3',
        divider: '#BDBDBD',
    },
};

// Shared mapping from note type to palette role
export const NOTE_TYPE_TO_PALETTE_ROLE: Record<string, PaletteRole> = {
    experiment: 'primary',
    literature: 'secondary',
    daily: 'info', // Use 'info' so daily notes don't blend with background
    project: 'success', // Projects: green
    pdf: 'warning', // PDFs: yellow/orange
    database: 'paper', // Database: white/paper
    protocol: 'secondary', // Protocols: secondary accent
    recipe: 'success', // Recipes: green
    table: 'divider', // Tables: divider/grey
    highlight: 'error', // Highlights: error/red
}; 