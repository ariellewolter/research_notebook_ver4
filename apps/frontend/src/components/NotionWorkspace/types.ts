import { ImageData } from './ImageBlock';
import { MathData } from './MathBlock';

export interface Block {
    id: string;
    type: 'text' | 'heading' | 'note' | 'project' | 'protocol' | 'database' | 'pdf' | 'page' | 'experiment' | 'recipe' | 'literature' | 'task' | 'columns' | 'list' | 'code' | 'quote' | 'divider' | 'image' | 'table' | 'math' | 'horizontal' | 'link';
    content: string;
    title?: string;
    entityId?: string;
    createdAt: Date;
    updatedAt: Date;
    order: number;
    isEditing?: boolean;
    isFocused?: boolean;
    columns?: Block[][];
    columnCount?: number;
    layout?: 'vertical' | 'horizontal' | 'grid';
    metadata?: {
        level?: number;
        checked?: boolean;
        language?: string;
        url?: string;
        rows?: number;
        cols?: number;
        width?: number;
        height?: number;
        displayMode?: 'link' | 'embed';
        linkType?: string;
        imageData?: ImageData;
        mathData?: MathData;
    };
}

export interface Page {
    id: string;
    title: string;
    blocks: Block[];
    createdAt: Date;
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