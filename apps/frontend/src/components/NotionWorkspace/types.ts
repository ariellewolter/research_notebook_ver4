import { ImageData } from './ImageBlock';
import { MathData } from './MathBlock';

export interface Block {
    id: string;
    type: 'text' | 'heading' | 'protocol' | 'note' | 'pdf' | 'image' | 'table' | 'divider' | 'callout' | 'code' | 'equation' | 'freeform-drawing';
    content: any;
    metadata?: {
        createdAt: Date;
        updatedAt: Date;
        author?: string;
        tags?: string[];
        drawingData?: any; // For storing FreeformDrawingBlock data
    };
    style?: {
        backgroundColor?: string;
        textColor?: string;
        fontSize?: string;
        alignment?: 'left' | 'center' | 'right';
    };
}

export interface NotionPage {
    id: string;
    title: string;
    icon?: string;
    cover?: string;
    blocks: Block[];
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        parentId?: string;
        path: string;
    };
}

export interface SlashCommand {
    command: string;
    label: string;
    description?: string;
    icon?: string;
    category: 'content' | 'linking';
    keywords?: string[];
}

export interface LinkableItem {
    id: string;
    title: string;
    type: string;
    description?: string;
    url?: string;
}

export interface DatabaseEntry {
    id: string;
    name: string;
    type: string;
    description?: string;
    metadata?: Record<string, any>;
}

export interface CrossLink {
    id: string;
    sourceBlockId: string;
    targetItem: LinkableItem;
    displayMode: 'link' | 'embed';
    createdAt: Date;
}

export interface LinkableEntity {
    id: string;
    title: string;
    type: string;
    description?: string;
    url?: string;
} 