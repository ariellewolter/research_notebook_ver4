import { Request, Response } from 'express';
import { NoteService } from '../services/NoteService';
import { createNoteSchema, updateNoteSchema } from '../validation/noteSchemas';
import { asyncHandler } from '../middleware/asyncHandler';

const noteService = new NoteService();

export const notesController = {
    getAllNotes: asyncHandler(async (req: any, res: Response) => {
        const { page, limit, type, search, dateFrom, dateTo, experimentId } = req.query;
        
        const result = await noteService.getAllNotes(req.user.userId, {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            type,
            search,
            dateFrom,
            dateTo,
            experimentId,
        });

        res.json(result);
    }),

    getNoteById: asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        
        const note = await noteService.getNoteById(id, req.user.userId);
        
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json(note);
    }),

    createNote: asyncHandler(async (req: any, res: Response) => {
        const validatedData = createNoteSchema.parse(req.body);
        
        const note = await noteService.createNote({
            ...validatedData,
            date: validatedData.date ? new Date(validatedData.date) : null,
        }, req.user.userId);
        
        res.status(201).json(note);
    }),

    updateNote: asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const validatedData = updateNoteSchema.parse(req.body);
        
        const note = await noteService.updateNote(id, {
            ...validatedData,
            date: validatedData.date ? new Date(validatedData.date) : null,
        }, req.user.userId);
        
        res.json(note);
    }),

    deleteNote: asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        
        await noteService.deleteNote(id, req.user.userId);
        
        res.status(204).send();
    }),

    getNoteStats: asyncHandler(async (req: any, res: Response) => {
        const stats = await noteService.getNoteStats(req.user.userId);
        res.json(stats);
    }),

    searchNotes: asyncHandler(async (req: any, res: Response) => {
        const { query } = req.params;
        const { limit } = req.query;
        
        const notes = await noteService.searchNotes(query, req.user.userId, limit ? parseInt(limit) : 10);
        res.json(notes);
    }),

    getNotesByDate: asyncHandler(async (req: any, res: Response) => {
        const { date } = req.params;
        
        const notes = await noteService.getNotesByDate(date, req.user.userId);
        res.json(notes);
    }),
}; 