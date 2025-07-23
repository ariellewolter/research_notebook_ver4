import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createLinkSchema = z.object({
    sourceType: z.enum(['note', 'highlight', 'databaseEntry']),
    sourceId: z.string(),
    targetType: z.enum(['note', 'highlight', 'databaseEntry']),
    targetId: z.string(),
});

// Get all links
router.get('/', async (req, res) => {
    try {
        const { sourceType, sourceId, targetType, targetId } = req.query;

        const where: any = {};
        if (sourceType) where.sourceType = sourceType;
        if (sourceId) where.sourceId = sourceId;
        if (targetType) where.targetType = targetType;
        if (targetId) where.targetId = targetId;

        const links = await prisma.link.findMany({
            where,
            include: {
                note: { select: { id: true, title: true, type: true } },
                highlight: {
                    select: {
                        id: true,
                        text: true,
                        page: true,
                        pdf: { select: { id: true, title: true } }
                    }
                },
                databaseEntry: { select: { id: true, name: true, type: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(links);
    } catch (error) {
        console.error('Error fetching links:', error);
        res.status(500).json({ error: 'Failed to fetch links' });
    }
});

// Get links for a specific item (backlinks)
router.get('/backlinks/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;

        const links = await prisma.link.findMany({
            where: {
                targetType: type,
                targetId: id
            },
            include: {
                note: { select: { id: true, title: true, type: true } },
                highlight: {
                    select: {
                        id: true,
                        text: true,
                        page: true,
                        pdf: { select: { id: true, title: true } }
                    }
                },
                databaseEntry: { select: { id: true, name: true, type: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(links);
    } catch (error) {
        console.error('Error fetching backlinks:', error);
        res.status(500).json({ error: 'Failed to fetch backlinks' });
    }
});

// Get outgoing links for a specific item
router.get('/outgoing/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;

        const links = await prisma.link.findMany({
            where: {
                sourceType: type,
                sourceId: id
            },
            include: {
                note: { select: { id: true, title: true, type: true } },
                highlight: {
                    select: {
                        id: true,
                        text: true,
                        page: true,
                        pdf: { select: { id: true, title: true } }
                    }
                },
                databaseEntry: { select: { id: true, name: true, type: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(links);
    } catch (error) {
        console.error('Error fetching outgoing links:', error);
        res.status(500).json({ error: 'Failed to fetch outgoing links' });
    }
});

// Create a new link
router.post('/', async (req, res) => {
    try {
        const validatedData = createLinkSchema.parse(req.body);

        // Check if link already exists
        const existingLink = await prisma.link.findFirst({
            where: {
                sourceType: validatedData.sourceType,
                sourceId: validatedData.sourceId,
                targetType: validatedData.targetType,
                targetId: validatedData.targetId
            }
        });

        if (existingLink) {
            return res.status(409).json({ error: 'Link already exists' });
        }

        // Validate that source and target exist
        const sourceExists = await validateEntityExists(validatedData.sourceType, validatedData.sourceId);
        const targetExists = await validateEntityExists(validatedData.targetType, validatedData.targetId);

        if (!sourceExists) {
            return res.status(400).json({ error: 'Source entity does not exist' });
        }

        if (!targetExists) {
            return res.status(400).json({ error: 'Target entity does not exist' });
        }

        const link = await prisma.link.create({
            data: validatedData,
            include: {
                note: { select: { id: true, title: true, type: true } },
                highlight: {
                    select: {
                        id: true,
                        text: true,
                        page: true,
                        pdf: { select: { id: true, title: true } }
                    }
                },
                databaseEntry: { select: { id: true, name: true, type: true } }
            }
        });

        res.status(201).json(link);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error creating link:', error);
        res.status(500).json({ error: 'Failed to create link' });
    }
});

// Delete a link
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.link.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting link:', error);
        res.status(500).json({ error: 'Failed to delete link' });
    }
});

// Get link graph (for visualization)
router.get('/graph', async (req, res) => {
    try {
        const { limit = '100' } = req.query;

        const links = await prisma.link.findMany({
            take: parseInt(limit as string),
            include: {
                note: { select: { id: true, title: true, type: true } },
                highlight: {
                    select: {
                        id: true,
                        text: true,
                        page: true,
                        pdf: { select: { id: true, title: true } }
                    }
                },
                databaseEntry: { select: { id: true, name: true, type: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform into graph format
        const nodes = new Set<string>();
        const edges = links.map(link => {
            const sourceNode = `${link.sourceType}:${link.sourceId}`;
            const targetNode = `${link.targetType}:${link.targetId}`;

            nodes.add(sourceNode);
            nodes.add(targetNode);

            return {
                id: link.id,
                source: sourceNode,
                target: targetNode,
                sourceType: link.sourceType,
                targetType: link.targetType,
                createdAt: link.createdAt
            };
        });

        res.json({
            nodes: Array.from(nodes).map(node => {
                const [type, id] = node.split(':');
                return { id: node, type, entityId: id };
            }),
            edges
        });
    } catch (error) {
        console.error('Error fetching link graph:', error);
        res.status(500).json({ error: 'Failed to fetch link graph' });
    }
});

// Search for linkable items
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const { type, limit = '20' } = req.query;

        const results = [];

        // Search notes
        if (!type || type === 'note') {
            const notes = await prisma.note.findMany({
                where: {
                    OR: [
                        { title: { contains: query } },
                        { content: { contains: query } }
                    ]
                },
                select: { id: true, title: true, type: true },
                take: parseInt(limit as string)
            });

            results.push(...notes.map(note => ({
                id: note.id,
                title: note.title,
                type: 'note',
                subtype: note.type
            })));
        }

        // Search highlights
        if (!type || type === 'highlight') {
            const highlights = await prisma.highlight.findMany({
                where: {
                    text: { contains: query }
                },
                select: {
                    id: true,
                    text: true,
                    page: true,
                    pdf: { select: { id: true, title: true } }
                },
                take: parseInt(limit as string)
            });

            results.push(...highlights.map(highlight => ({
                id: highlight.id,
                title: `${highlight.pdf.title} - Page ${highlight.page}`,
                type: 'highlight',
                text: highlight.text
            })));
        }

        // Search database entries
        if (!type || type === 'databaseEntry') {
            const entries = await prisma.databaseEntry.findMany({
                where: {
                    OR: [
                        { name: { contains: query } },
                        { description: { contains: query } }
                    ]
                },
                select: { id: true, name: true, type: true },
                take: parseInt(limit as string)
            });

            results.push(...entries.map(entry => ({
                id: entry.id,
                title: entry.name,
                type: 'databaseEntry',
                subtype: entry.type
            })));
        }

        res.json(results.slice(0, parseInt(limit as string)));
    } catch (error) {
        console.error('Error searching linkable items:', error);
        res.status(500).json({ error: 'Failed to search linkable items' });
    }
});

// Helper function to validate entity exists
async function validateEntityExists(type: string, id: string): Promise<boolean> {
    try {
        switch (type) {
            case 'note':
                const note = await prisma.note.findUnique({ where: { id } });
                return !!note;
            case 'highlight':
                const highlight = await prisma.highlight.findUnique({ where: { id } });
                return !!highlight;
            case 'databaseEntry':
                const entry = await prisma.databaseEntry.findUnique({ where: { id } });
                return !!entry;
            default:
                return false;
        }
    } catch (error) {
        return false;
    }
}

export default router; 