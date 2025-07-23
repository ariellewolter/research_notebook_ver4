import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createLitNoteSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    authors: z.string().optional(),
    year: z.string().optional(),
    journal: z.string().optional(),
    doi: z.string().optional(),
    abstract: z.string().optional(),
    tags: z.string().optional(),
    citation: z.string().optional(),
    synonyms: z.string().optional(),
    userNote: z.string().optional(),
    relatedEntries: z.array(z.string()).optional(),
});

const updateLitNoteSchema = z.object({
    title: z.string().optional(),
    authors: z.string().optional(),
    year: z.string().optional(),
    journal: z.string().optional(),
    doi: z.string().optional(),
    abstract: z.string().optional(),
    tags: z.string().optional(),
    citation: z.string().optional(),
    synonyms: z.string().optional(),
    userNote: z.string().optional(),
    relatedEntries: z.array(z.string()).optional(),
});

// Get all literature notes
router.get('/', async (req, res) => {
    try {
        const notes = await prisma.literatureNote.findMany({
            include: { relatedEntries: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(notes);
    } catch (error) {
        console.error('Error fetching literature notes:', error);
        res.status(500).json({ error: 'Failed to fetch literature notes' });
    }
});

// Get a specific literature note by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const note = await prisma.literatureNote.findUnique({
            where: { id },
            include: { relatedEntries: true },
        });
        if (!note) return res.status(404).json({ error: 'Literature note not found' });
        res.json(note);
    } catch (error) {
        console.error('Error fetching literature note:', error);
        res.status(500).json({ error: 'Failed to fetch literature note' });
    }
});

// Create a new literature note
router.post('/', async (req, res) => {
    try {
        const validated = createLitNoteSchema.parse(req.body);
        const note = await prisma.literatureNote.create({
            data: {
                title: validated.title,
                authors: validated.authors,
                year: validated.year,
                journal: validated.journal,
                doi: validated.doi,
                abstract: validated.abstract,
                tags: validated.tags,
                citation: validated.citation,
                synonyms: validated.synonyms,
                userNote: validated.userNote,
                relatedEntries: validated.relatedEntries
                    ? { connect: validated.relatedEntries.map((id: string) => ({ id })) }
                    : undefined,
            },
            include: { relatedEntries: true },
        });
        res.status(201).json(note);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error creating literature note:', error);
        res.status(500).json({ error: 'Failed to create literature note' });
    }
});

// Update a literature note
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const validated = updateLitNoteSchema.parse(req.body);
        const updateData: any = { ...validated };
        if (validated.relatedEntries) {
            updateData.relatedEntries = { set: validated.relatedEntries.map((id: string) => ({ id })) };
        }
        const note = await prisma.literatureNote.update({
            where: { id },
            data: updateData,
            include: { relatedEntries: true },
        });
        res.json(note);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error updating literature note:', error);
        res.status(500).json({ error: 'Failed to update literature note' });
    }
});

// Delete a literature note
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.literatureNote.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting literature note:', error);
        res.status(500).json({ error: 'Failed to delete literature note' });
    }
});

export default router; 