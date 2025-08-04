import { NoteRepository } from '../repositories/NoteRepository';
import { CreateNoteData, UpdateNoteData, NoteWithExperiment } from '../types/note.types';

export class NoteService {
    constructor(
        private noteRepository: NoteRepository = new NoteRepository()
    ) {}

    async getAllNotes(userId: string, filters?: {
        type?: string;
        search?: string;
        dateFrom?: string;
        dateTo?: string;
        experimentId?: string;
        page?: number;
        limit?: number;
    }): Promise<{ notes: any[]; total: number; pagination: any }> {
        const { page = 1, limit = 10, ...filterParams } = filters || {};
        const skip = (page - 1) * limit;

        const [notes, total] = await Promise.all([
            this.noteRepository.findMany({
                ...filterParams,
                skip,
                take: limit,
            }),
            this.noteRepository.count({ ...filterParams }),
        ]);

        return {
            notes,
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    }

    async getNoteById(id: string, userId: string): Promise<NoteWithExperiment | null> {
        return this.noteRepository.findById(id);
    }

    async createNote(data: CreateNoteData, userId: string): Promise<any> {
        return this.noteRepository.create({
            ...data,
            date: data.date || new Date(),
        });
    }

    async updateNote(id: string, data: UpdateNoteData, userId: string): Promise<any> {
        const existingNote = await this.noteRepository.findById(id);
        if (!existingNote) {
            throw new Error('Note not found');
        }

        const updateData = { ...data };
        if (data.date) {
            updateData.date = data.date;
        }

        return this.noteRepository.update(id, updateData);
    }

    async deleteNote(id: string, userId: string): Promise<void> {
        const existingNote = await this.noteRepository.findById(id);
        if (!existingNote) {
            throw new Error('Note not found');
        }

        await this.noteRepository.delete(id);
    }

    async getNoteStats(userId: string): Promise<{
        total: number;
        byType: Record<string, number>;
        recent: any[];
    }> {
        return this.noteRepository.getStats();
    }

    async searchNotes(query: string, userId: string, limit: number = 10): Promise<any[]> {
        return this.noteRepository.search(query, limit);
    }

    async getNotesByDate(date: string, userId: string): Promise<any[]> {
        return this.noteRepository.getByDate(date);
    }
} 