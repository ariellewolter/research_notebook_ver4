import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createDatabaseEntrySchema = z.object({
    type: z.string().optional(), // Made optional - only name is required
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    properties: z.string().optional(), // JSON string
    metadata: z.object({
        molecularWeight: z.string().optional(),
        concentration: z.string().optional(),
        storage: z.string().optional(),
        supplier: z.string().optional(),
        catalogNumber: z.string().optional(),
        purity: z.string().optional(),
        sequence: z.string().optional(),
        organism: z.string().optional(),
        function: z.string().optional(),
        protocol: z.string().optional(),
        equipment: z.string().optional(),
        duration: z.string().optional(),
        temperature: z.string().optional(),
        pH: z.string().optional(),
        // New model/animal fields
        modelType: z.string().optional(),
        species: z.string().optional(),
        strain: z.string().optional(),
        geneticModification: z.string().optional(),
        sex: z.string().optional(),
        age: z.string().optional(),
        anatomicalLocation: z.string().optional(),
        condition: z.string().optional(),
        notes: z.string().optional(),
    }).optional(),
});

const updateDatabaseEntrySchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    properties: z.string().optional(), // JSON string
    metadata: z.object({
        molecularWeight: z.string().optional(),
        concentration: z.string().optional(),
        storage: z.string().optional(),
        supplier: z.string().optional(),
        catalogNumber: z.string().optional(),
        purity: z.string().optional(),
        sequence: z.string().optional(),
        organism: z.string().optional(),
        function: z.string().optional(),
        protocol: z.string().optional(),
        equipment: z.string().optional(),
        duration: z.string().optional(),
        temperature: z.string().optional(),
        pH: z.string().optional(),
        // New model/animal fields
        modelType: z.string().optional(),
        species: z.string().optional(),
        strain: z.string().optional(),
        geneticModification: z.string().optional(),
        sex: z.string().optional(),
        age: z.string().optional(),
        anatomicalLocation: z.string().optional(),
        condition: z.string().optional(),
        notes: z.string().optional(),
    }).optional(),
});

const createLinkSchema = z.object({
    sourceType: z.enum(['note', 'highlight', 'databaseEntry']),
    sourceId: z.string(),
    targetType: z.enum(['note', 'highlight', 'databaseEntry']),
    targetId: z.string(),
});

// Helper function to transform metadata for database storage
const transformMetadataForStorage = (metadata: any) => {
    if (!metadata) return {};

    return {
        molecularWeight: metadata.molecularWeight ? parseFloat(metadata.molecularWeight) : null,
        concentration: metadata.concentration || null,
        storage: metadata.storage || null,
        supplier: metadata.supplier || null,
        catalogNumber: metadata.catalogNumber || null,
        purity: metadata.purity || null,
        sequence: metadata.sequence || null,
        organism: metadata.organism || null,
        function: metadata.function || null,
        protocol: metadata.protocol || null,
        equipment: metadata.equipment || null,
        duration: metadata.duration || null,
        temperature: metadata.temperature || null,
        pH: metadata.pH || null,
        // New model/animal fields
        modelType: metadata.modelType || null,
        species: metadata.species || null,
        strain: metadata.strain || null,
        geneticModification: metadata.geneticModification || null,
        sex: metadata.sex || null,
        age: metadata.age || null,
        anatomicalLocation: metadata.anatomicalLocation || null,
        condition: metadata.condition || null,
        notes: metadata.notes || null,
    };
};

// Helper function to transform database data for API response
const transformEntryForResponse = (entry: any) => {
    return {
        ...entry,
        metadata: {
            molecularWeight: entry.molecularWeight,
            concentration: entry.concentration,
            storage: entry.storage,
            supplier: entry.supplier,
            catalogNumber: entry.catalogNumber,
            purity: entry.purity,
            sequence: entry.sequence,
            organism: entry.organism,
            function: entry.function,
            protocol: entry.protocol,
            equipment: entry.equipment ? entry.equipment.split(',').map((e: string) => e.trim()) : [],
            duration: entry.duration,
            temperature: entry.temperature,
            pH: entry.pH,
            // New model/animal fields
            modelType: entry.modelType,
            species: entry.species,
            strain: entry.strain,
            geneticModification: entry.geneticModification,
            sex: entry.sex,
            age: entry.age,
            anatomicalLocation: entry.anatomicalLocation,
            condition: entry.condition,
            notes: entry.notes,
        }
    };
};

/**
 * @openapi
 * components:
 *   schemas:
 *     DatabaseEntry:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *           description: Entry type (CHEMICAL, GENE, CELL_TYPE, ANIMAL_MODEL, etc.)
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         properties:
 *           type: string
 *           description: JSON string of extra properties
 *         metadata:
 *           type: object
 *           properties:
 *             molecularWeight: { type: number }
 *             concentration: { type: string }
 *             storage: { type: string }
 *             supplier: { type: string }
 *             catalogNumber: { type: string }
 *             purity: { type: string }
 *             sequence: { type: string }
 *             organism: { type: string }
 *             function: { type: string }
 *             protocol: { type: string }
 *             equipment: { type: string }
 *             duration: { type: string }
 *             temperature: { type: string }
 *             pH: { type: string }
 *             modelType: { type: string, description: 'cell, mouse, rat, monkey, human, other' }
 *             species: { type: string }
 *             strain: { type: string }
 *             geneticModification: { type: string }
 *             sex: { type: string, description: 'male, female, unknown' }
 *             age: { type: string }
 *             anatomicalLocation: { type: string, description: 'e.g., fat pad, kidney capsule' }
 *             condition: { type: string, description: 'live, anesthetized, fixed, other' }
 *             notes: { type: string }
 *         relatedResearch:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */
// Get all database entries with optional filtering
router.get('/', async (req, res) => {
    try {
        const { type, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = {};
        if (type) where.type = type;

        const entries = await prisma.databaseEntry.findMany({
            where,
            include: {
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

        const total = await prisma.databaseEntry.count({ where });

        // Transform entries for response
        const transformedEntries = entries.map(transformEntryForResponse);

        res.json({
            entries: transformedEntries,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error) {
        console.error('Error fetching database entries:', error);
        res.status(500).json({ error: 'Failed to fetch database entries' });
    }
});

// Get database entries by type
router.get('/type/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const entries = await prisma.databaseEntry.findMany({
            where: { type },
            include: {
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

        const total = await prisma.databaseEntry.count({ where: { type } });

        // Transform entries for response
        const transformedEntries = entries.map(transformEntryForResponse);

        res.json({
            entries: transformedEntries,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error) {
        console.error('Error fetching database entries by type:', error);
        res.status(500).json({ error: 'Failed to fetch database entries' });
    }
});

// Get a specific database entry
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const entry = await prisma.databaseEntry.findUnique({
            where: { id },
            include: {
                links: {
                    include: {
                        note: { select: { id: true, title: true } },
                        highlight: { select: { id: true, text: true, pdf: { select: { title: true } } } },
                        databaseEntry: { select: { id: true, name: true, type: true } }
                    }
                }
            }
        });

        if (!entry) {
            return res.status(404).json({ error: 'Database entry not found' });
        }

        // Transform entry for response
        const transformedEntry = transformEntryForResponse(entry);

        res.json(transformedEntry);
    } catch (error) {
        console.error('Error fetching database entry:', error);
        res.status(500).json({ error: 'Failed to fetch database entry' });
    }
});

// Create a new database entry
router.post('/', async (req, res) => {
    try {
        const validatedData = createDatabaseEntrySchema.parse(req.body);

        // Transform metadata for storage
        const metadata = transformMetadataForStorage(validatedData.metadata);

        const entryData = {
            type: validatedData.type || 'UNKNOWN', // Provide default type if not specified
            name: validatedData.name,
            description: validatedData.description,
            properties: validatedData.properties,
            ...metadata,
        };

        const entry = await prisma.databaseEntry.create({
            data: entryData
        });

        // Transform response
        const transformedEntry = transformEntryForResponse(entry);

        res.status(201).json(transformedEntry);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error creating database entry:', error);
        res.status(500).json({ error: 'Failed to create database entry' });
    }
});

// Update a database entry
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateDatabaseEntrySchema.parse(req.body);

        // Transform metadata for storage
        const metadata = transformMetadataForStorage(validatedData.metadata);

        const entryData = {
            ...(validatedData.name && { name: validatedData.name }),
            ...(validatedData.description !== undefined && { description: validatedData.description }),
            ...(validatedData.properties !== undefined && { properties: validatedData.properties }),
            ...metadata,
        };

        const entry = await prisma.databaseEntry.update({
            where: { id },
            data: entryData
        });

        // Transform response
        const transformedEntry = transformEntryForResponse(entry);

        res.json(transformedEntry);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error updating database entry:', error);
        res.status(500).json({ error: 'Failed to update database entry' });
    }
});

// Delete a database entry
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Delete associated links first
        await prisma.link.deleteMany({
            where: {
                OR: [
                    { sourceId: id, sourceType: 'databaseEntry' },
                    { targetId: id, targetType: 'databaseEntry' }
                ]
            }
        });

        await prisma.databaseEntry.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting database entry:', error);
        res.status(500).json({ error: 'Failed to delete database entry' });
    }
});

// Search database entries
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const { type } = req.query;

        const where: any = {
            OR: [
                { name: { contains: query } },
                { description: { contains: query } },
                { supplier: { contains: query } },
                { organism: { contains: query } },
                { sequence: { contains: query } },
            ]
        };

        if (type) {
            where.type = type;
        }

        const entries = await prisma.databaseEntry.findMany({
            where,
            include: {
                links: {
                    include: {
                        note: { select: { id: true, title: true } },
                        highlight: { select: { id: true, text: true, pdf: { select: { title: true } } } },
                        databaseEntry: { select: { id: true, name: true, type: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        // Transform entries for response
        const transformedEntries = entries.map(transformEntryForResponse);

        res.json({ entries: transformedEntries });
    } catch (error) {
        console.error('Error searching database entries:', error);
        res.status(500).json({ error: 'Failed to search database entries' });
    }
});

// Create a link between database entry and another entity
router.post('/:id/links', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = createLinkSchema.parse(req.body);

        // Verify the database entry exists
        const entry = await prisma.databaseEntry.findUnique({
            where: { id }
        });

        if (!entry) {
            return res.status(404).json({ error: 'Database entry not found' });
        }

        // Create the link
        const link = await prisma.link.create({
            data: {
                sourceType: 'databaseEntry',
                sourceId: id,
                targetType: validatedData.targetType,
                targetId: validatedData.targetId,
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

// Get statistics for database entries
router.get('/stats/overview', async (req, res) => {
    try {
        const totalEntries = await prisma.databaseEntry.count();

        const entriesByType = await prisma.databaseEntry.groupBy({
            by: ['type'],
            _count: {
                type: true
            }
        });

        const recentEntries = await prisma.databaseEntry.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                name: true,
                type: true,
                createdAt: true,
            }
        });

        const stats = {
            total: totalEntries,
            byType: entriesByType.reduce((acc, item) => {
                acc[item.type] = item._count.type;
                return acc;
            }, {} as Record<string, number>),
            recent: recentEntries,
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching database statistics:', error);
        res.status(500).json({ error: 'Failed to fetch database statistics' });
    }
});

export default router; 