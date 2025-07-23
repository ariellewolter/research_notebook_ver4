import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createNoteSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().optional(), // Made optional
    type: z.enum(['daily', 'experiment', 'literature']).optional(), // Made optional
    date: z.string().optional(),
    experimentId: z.string().optional(),
});

const updateNoteSchema = z.object({
    title: z.string().min(1).optional(),
    content: z.string().optional(),
    date: z.string().optional(),
    experimentId: z.string().optional(),
});

// Get all notes with optional filtering
router.get('/', async (req, res) => {
    try {
        const { type, experimentId, page = '1', limit = '20' } = req.query;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = {};
        if (type) where.type = type;
        if (experimentId) where.experimentId = experimentId;

        const notes = await prisma.note.findMany({
            where,
            include: {
                experiment: {
                    select: { id: true, name: true, project: { select: { id: true, name: true } } }
                },
                links: {
                    include: {
                        note: { select: { id: true, title: true } },
                        highlight: { select: { id: true, text: true, pdf: { select: { title: true } } } },
                        databaseEntry: { select: { id: true, name: true, type: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: parseInt(limit as string),
        });

        const total = await prisma.note.count({ where });

        res.json({
            notes,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// Get journal statistics
router.get('/stats', async (req, res) => {
    try {
        const [totalNotes, dailyNotes, experimentNotes, literatureNotes, recentNotes] = await Promise.all([
            prisma.note.count(),
            prisma.note.count({ where: { type: 'daily' } }),
            prisma.note.count({ where: { type: 'experiment' } }),
            prisma.note.count({ where: { type: 'literature' } }),
            prisma.note.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    type: true,
                    createdAt: true,
                }
            })
        ]);

        res.json({
            total: totalNotes,
            byType: {
                daily: dailyNotes,
                experiment: experimentNotes,
                literature: literatureNotes,
            },
            recent: recentNotes
        });
    } catch (error) {
        console.error('Error fetching note statistics:', error);
        res.status(500).json({ error: 'Failed to fetch note statistics' });
    }
});

// Get notes by date range
router.get('/by-date', async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;

        const where: any = {};

        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string),
            };
        }

        if (type) {
            where.type = type;
        }

        const notes = await prisma.note.findMany({
            where,
            include: {
                experiment: {
                    select: { id: true, name: true, project: { select: { id: true, name: true } } }
                },
                links: {
                    include: {
                        note: { select: { id: true, title: true } },
                        highlight: { select: { id: true, text: true, pdf: { select: { title: true } } } },
                        databaseEntry: { select: { id: true, name: true, type: true } }
                    }
                }
            },
            orderBy: { date: 'desc' },
        });

        res.json({ notes });
    } catch (error) {
        console.error('Error fetching notes by date:', error);
        res.status(500).json({ error: 'Failed to fetch notes by date' });
    }
});

// Get a specific note by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const note = await prisma.note.findUnique({
            where: { id },
            include: {
                experiment: {
                    select: { id: true, name: true, project: { select: { id: true, name: true } } }
                },
                links: {
                    include: {
                        note: { select: { id: true, title: true } },
                        highlight: { select: { id: true, text: true, pdf: { select: { title: true } } } },
                        databaseEntry: { select: { id: true, name: true, type: true } }
                    }
                }
            }
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json(note);
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ error: 'Failed to fetch note' });
    }
});

// Helper to extract [[...]] links from content
function extractLinksFromContent(content: string): string[] {
    const regex = /\[\[([^\]]+)\]\]/g;
    const links: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        links.push(match[1]);
    }
    return links;
}

// Helper to sync links for a note
async function syncNoteLinks(noteId: string, content: string, prisma: any) {
    // 1. Extract all [[...]]
    const linkTitles = extractLinksFromContent(content || '');
    // 2. Find all notes with those titles
    const targetNotes = await prisma.note.findMany({ where: { title: { in: linkTitles } } });
    const targetTitleToId = Object.fromEntries(targetNotes.map((n: any) => [n.title, n.id]));
    // 3. Remove all outgoing links from this note
    await prisma.link.deleteMany({ where: { sourceType: 'note', sourceId: noteId } });
    // 4. Create new links for each found target
    for (const title of linkTitles) {
        const targetId = targetTitleToId[title];
        if (targetId) {
            await prisma.link.create({
                data: {
                    sourceType: 'note',
                    sourceId: noteId,
                    targetType: 'note',
                    targetId,
                }
            });
        }
    }
}

// Create a new note
router.post('/', async (req, res) => {
    try {
        const validatedData = createNoteSchema.parse(req.body);

        const noteData: any = {
            title: validatedData.title,
            content: validatedData.content || '', // Provide default empty content
            type: validatedData.type || 'daily', // Provide default type
        };

        if (validatedData.date) {
            noteData.date = new Date(validatedData.date);
        }

        if (validatedData.experimentId) {
            noteData.experimentId = validatedData.experimentId;
        }

        const note = await prisma.note.create({
            data: noteData,
            include: {
                experiment: {
                    select: { id: true, name: true, project: { select: { id: true, name: true } } }
                }
            }
        });

        // Sync links
        await syncNoteLinks(note.id, note.content, prisma);

        res.status(201).json(note);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// Update a note
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateNoteSchema.parse(req.body);

        const updateData: any = {};
        if (validatedData.title !== undefined) updateData.title = validatedData.title;
        if (validatedData.content !== undefined) updateData.content = validatedData.content;
        if (validatedData.date !== undefined) updateData.date = new Date(validatedData.date);
        if (validatedData.experimentId !== undefined) updateData.experimentId = validatedData.experimentId;

        const note = await prisma.note.update({
            where: { id },
            data: updateData,
            include: {
                experiment: {
                    select: { id: true, name: true, project: { select: { id: true, name: true } } }
                }
            }
        });

        // Sync links
        await syncNoteLinks(note.id, note.content, prisma);

        res.json(note);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error updating note:', error);
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// Delete a note
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Delete associated links first
        await prisma.link.deleteMany({
            where: {
                OR: [
                    { sourceId: id, sourceType: 'note' },
                    { targetId: id, targetType: 'note' }
                ]
            }
        });

        await prisma.note.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

export default router; 