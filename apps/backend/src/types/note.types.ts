export interface Note {
    id: string;
    title: string;
    content: string;
    type: string;
    date: Date | null;
    experimentId?: string | null;
    createdAt: Date;
}

export interface NoteWithExperiment extends Note {
    experiment?: {
        id: string;
        name: string;
        description?: string | null;
    } | null;
}

export type CreateNoteData = Omit<Note, 'id' | 'createdAt'>;
export type UpdateNoteData = Partial<CreateNoteData>; 