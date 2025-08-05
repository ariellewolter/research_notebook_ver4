import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createFreeformDrawingBlockSchema = z.object({
    blockId: z.string().min(1, "Block ID is required"),
    entityId: z.string().min(1, "Entity ID is required"),
    entityType: z.enum(['note', 'project', 'protocol', 'task', 'database'], {
        errorMap: () => ({ message: "Entity type must be one of: note, project, protocol, task, database" })
    }),
    strokes: z.string().optional(), // JSON string of DrawingStroke[]
    svgPath: z.string().optional(),
    pngThumbnail: z.string().optional(),
    width: z.number().int().positive().default(600),
    height: z.number().int().positive().default(400)
});

const updateFreeformDrawingBlockSchema = z.object({
    strokes: z.string().optional(),
    svgPath: z.string().optional(),
    pngThumbnail: z.string().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional()
});

// Universal route to get all freeform drawing blocks for any entity type
router.get('/:entityType/:entityId/freeform', async (req, res) => {
    try {
        const { entityType, entityId } = req.params;
        const { page = '1', limit = '20' } = req.query;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        // Validate entity type
        const validEntityTypes = ['note', 'project', 'protocol', 'task', 'database'];
        if (!validEntityTypes.includes(entityType)) {
            return res.status(400).json({ 
                error: 'Invalid entity type. Must be one of: note, project, protocol, task, database' 
            });
        }

        const blocks = await prisma.freeformDrawingBlock.findMany({
            where: {
                entityId,
                entityType
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: parseInt(limit as string),
        });

        const total = await prisma.freeformDrawingBlock.count({
            where: {
                entityId,
                entityType
            }
        });

        res.json({
            blocks,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error) {
        console.error('Error fetching freeform drawing blocks:', error);
        res.status(500).json({ error: 'Failed to fetch freeform drawing blocks' });
    }
});

// Get a specific freeform drawing block by ID
router.get('/freeform/:blockId', async (req, res) => {
    try {
        const { blockId } = req.params;

        const block = await prisma.freeformDrawingBlock.findUnique({
            where: { blockId }
        });

        if (!block) {
            return res.status(404).json({ error: 'Freeform drawing block not found' });
        }

        res.json(block);
    } catch (error) {
        console.error('Error fetching freeform drawing block:', error);
        res.status(500).json({ error: 'Failed to fetch freeform drawing block' });
    }
});

// Create a new freeform drawing block
router.post('/freeform', async (req, res) => {
    try {
        const validatedData = createFreeformDrawingBlockSchema.parse(req.body);

        // Check if block with same blockId already exists
        const existingBlock = await prisma.freeformDrawingBlock.findUnique({
            where: { blockId: validatedData.blockId }
        });

        if (existingBlock) {
            return res.status(409).json({ error: 'Block with this ID already exists' });
        }

        // Verify that the referenced entity exists
        let entityExists = false;
        switch (validatedData.entityType) {
            case 'note':
                entityExists = await prisma.note.findUnique({ where: { id: validatedData.entityId } }) !== null;
                break;
            case 'project':
                entityExists = await prisma.project.findUnique({ where: { id: validatedData.entityId } }) !== null;
                break;
            case 'protocol':
                entityExists = await prisma.protocol.findUnique({ where: { id: validatedData.entityId } }) !== null;
                break;
            case 'task':
                entityExists = await prisma.task.findUnique({ where: { id: validatedData.entityId } }) !== null;
                break;
            case 'database':
                entityExists = await prisma.databaseEntry.findUnique({ where: { id: validatedData.entityId } }) !== null;
                break;
        }

        if (!entityExists) {
            return res.status(404).json({ 
                error: `${validatedData.entityType} with ID ${validatedData.entityId} not found` 
            });
        }

        const block = await prisma.freeformDrawingBlock.create({
            data: {
                blockId: validatedData.blockId,
                entityId: validatedData.entityId,
                entityType: validatedData.entityType,
                strokes: validatedData.strokes || '[]',
                svgPath: validatedData.svgPath || '',
                pngThumbnail: validatedData.pngThumbnail || '',
                width: validatedData.width,
                height: validatedData.height
            }
        });

        res.status(201).json(block);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: 'Validation error', 
                details: error.errors 
            });
        }
        console.error('Error creating freeform drawing block:', error);
        res.status(500).json({ error: 'Failed to create freeform drawing block' });
    }
});

// Update a freeform drawing block
router.put('/freeform/:blockId', async (req, res) => {
    try {
        const { blockId } = req.params;
        const validatedData = updateFreeformDrawingBlockSchema.parse(req.body);

        const existingBlock = await prisma.freeformDrawingBlock.findUnique({
            where: { blockId }
        });

        if (!existingBlock) {
            return res.status(404).json({ error: 'Freeform drawing block not found' });
        }

        const updatedBlock = await prisma.freeformDrawingBlock.update({
            where: { blockId },
            data: {
                ...validatedData,
                updatedAt: new Date()
            }
        });

        res.json(updatedBlock);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: 'Validation error', 
                details: error.errors 
            });
        }
        console.error('Error updating freeform drawing block:', error);
        res.status(500).json({ error: 'Failed to update freeform drawing block' });
    }
});

// Delete a freeform drawing block
router.delete('/freeform/:blockId', async (req, res) => {
    try {
        const { blockId } = req.params;

        const existingBlock = await prisma.freeformDrawingBlock.findUnique({
            where: { blockId }
        });

        if (!existingBlock) {
            return res.status(404).json({ error: 'Freeform drawing block not found' });
        }

        await prisma.freeformDrawingBlock.delete({
            where: { blockId }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting freeform drawing block:', error);
        res.status(500).json({ error: 'Failed to delete freeform drawing block' });
    }
});

// Get statistics for freeform drawing blocks
router.get('/freeform/stats', async (req, res) => {
    try {
        const [totalBlocks, blocksByEntityType, recentBlocks] = await Promise.all([
            prisma.freeformDrawingBlock.count(),
            prisma.freeformDrawingBlock.groupBy({
                by: ['entityType'],
                _count: {
                    entityType: true
                }
            }),
            prisma.freeformDrawingBlock.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    blockId: true,
                    entityType: true,
                    entityId: true,
                    createdAt: true,
                    updatedAt: true
                }
            })
        ]);

        const statsByType = blocksByEntityType.reduce((acc, item) => {
            acc[item.entityType] = item._count.entityType;
            return acc;
        }, {} as Record<string, number>);

        res.json({
            total: totalBlocks,
            byEntityType: statsByType,
            recent: recentBlocks
        });
    } catch (error) {
        console.error('Error fetching freeform drawing block stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Bulk operations for freeform drawing blocks
router.post('/freeform/bulk', async (req, res) => {
    try {
        const { blocks } = req.body;

        if (!Array.isArray(blocks)) {
            return res.status(400).json({ error: 'Blocks must be an array' });
        }

        const validatedBlocks = blocks.map(block => createFreeformDrawingBlockSchema.parse(block));

        const createdBlocks = await prisma.freeformDrawingBlock.createMany({
            data: validatedBlocks.map(block => ({
                blockId: block.blockId,
                entityId: block.entityId,
                entityType: block.entityType,
                strokes: block.strokes || '[]',
                svgPath: block.svgPath || '',
                pngThumbnail: block.pngThumbnail || '',
                width: block.width,
                height: block.height
            })),
            skipDuplicates: true
        });

        res.status(201).json({
            message: `Created ${createdBlocks.count} freeform drawing blocks`,
            count: createdBlocks.count
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: 'Validation error', 
                details: error.errors 
            });
        }
        console.error('Error creating bulk freeform drawing blocks:', error);
        res.status(500).json({ error: 'Failed to create bulk freeform drawing blocks' });
    }
});

// Search freeform drawing blocks
router.get('/freeform/search', async (req, res) => {
    try {
        const { q, entityType, page = '1', limit = '20' } = req.query;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = {};
        
        if (entityType) {
            where.entityType = entityType;
        }

        if (q) {
            where.OR = [
                { blockId: { contains: q as string, mode: 'insensitive' } },
                { entityId: { contains: q as string, mode: 'insensitive' } }
            ];
        }

        const blocks = await prisma.freeformDrawingBlock.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: parseInt(limit as string),
        });

        const total = await prisma.freeformDrawingBlock.count({ where });

        res.json({
            blocks,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error) {
        console.error('Error searching freeform drawing blocks:', error);
        res.status(500).json({ error: 'Failed to search freeform drawing blocks' });
    }
});

export default router; 