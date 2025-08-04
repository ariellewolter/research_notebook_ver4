export interface Note {
    id: string;
    title: string;
    content: string;
    type: string;
    date: string;
    experimentId?: string;
    createdAt: string;
    updatedAt: string;
}

export type CreateNoteData = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateNoteData = Partial<CreateNoteData>; 