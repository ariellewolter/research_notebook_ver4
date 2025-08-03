import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createProtocolSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    category: z.string().optional(), // Made optional
    version: z.string().optional(),
    steps: z.array(z.object({
        id: z.string(),
        stepNumber: z.number(),
        title: z.string(),
        description: z.string(),
        duration: z.string().optional(),
        critical: z.boolean().default(false),
        notes: z.string().optional(),
    })).optional(), // Made optional
    equipment: z.array(z.string()).optional(),
    reagents: z.array(z.object({
        name: z.string(),
        concentration: z.string().optional(),
        supplier: z.string().optional(),
        catalogNumber: z.string().optional(),
    })).optional(),
    safetyNotes: z.string().optional(),
    expectedDuration: z.string().optional(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
});

const updateProtocolSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    category: z.string().min(1).optional(),
    version: z.string().optional(),
    steps: z.array(z.object({
        id: z.string(),
        stepNumber: z.number(),
        title: z.string(),
        description: z.string(),
        duration: z.string().optional(),
        critical: z.boolean().default(false),
        notes: z.string().optional(),
    })).optional(),
    equipment: z.array(z.string()).optional(),
    reagents: z.array(z.object({
        name: z.string(),
        concentration: z.string().optional(),
        supplier: z.string().optional(),
        catalogNumber: z.string().optional(),
    })).optional(),
    safetyNotes: z.string().optional(),
    expectedDuration: z.string().optional(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
});

const createExecutionSchema = z.object({
    protocolId: z.string(),
    experimentId: z.string().optional(),
    status: z.enum(['planned', 'in_progress', 'completed', 'failed', 'abandoned']),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    notes: z.string().optional(),
    modifications: z.array(z.object({
        stepId: z.string(),
        originalValue: z.string(),
        newValue: z.string(),
        reason: z.string(),
    })).optional(),
    results: z.array(z.object({
        parameter: z.string(),
        value: z.string(),
        unit: z.string().optional(),
        notes: z.string().optional(),
    })).optional(),
    issues: z.array(z.object({
        stepId: z.string().optional(),
        description: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        resolved: z.boolean().default(false),
        resolution: z.string().optional(),
    })).optional(),
    nextSteps: z.string().optional(),
    executedBy: z.string().optional(),
    completedSteps: z.array(z.string()).optional(),
});

const updateExecutionSchema = z.object({
    status: z.enum(['planned', 'in_progress', 'completed', 'failed', 'abandoned']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    notes: z.string().optional(),
    modifications: z.array(z.object({
        stepId: z.string(),
        originalValue: z.string(),
        newValue: z.string(),
        reason: z.string(),
    })).optional(),
    results: z.array(z.object({
        parameter: z.string(),
        value: z.string(),
        unit: z.string().optional(),
        notes: z.string().optional(),
    })).optional(),
    issues: z.array(z.object({
        stepId: z.string().optional(),
        description: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        resolved: z.boolean().default(false),
        resolution: z.string().optional(),
    })).optional(),
    nextSteps: z.string().optional(),
    executedBy: z.string().optional(),
    completedSteps: z.array(z.string()).optional(),
});

// Get all protocols with optimized queries
router.get('/', async (req, res) => {
    try {
        const { page = '1', limit = '20', category } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = {};
        if (category) where.category = category;

        // Optimized query with reduced includes and selective fields
        const protocols = await prisma.protocol.findMany({
            where,
            select: {
                id: true,
                name: true,
                description: true,
                category: true,
                version: true,
                steps: true,
                equipment: true,
                reagents: true,
                safetyNotes: true,
                expectedDuration: true,
                difficulty: true,
                successRate: true,
                createdAt: true,
                updatedAt: true,
                // Only get count of executions instead of full data
                _count: {
                    select: {
                        executions: true
                    }
                },
                // Get only recent executions with minimal data
                executions: {
                    select: {
                        id: true,
                        status: true,
                        startDate: true,
                        endDate: true,
                        experiment: {
                            select: {
                                id: true,
                                name: true,
                                project: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 3, // Reduced from 5 to 3 for better performance
                }
            },
            orderBy: { updatedAt: 'desc' },
            skip,
            take: parseInt(limit as string),
        });

        const total = await prisma.protocol.count({ where });

        // Transform protocols with optimized JSON parsing
        const transformedProtocols = protocols.map(protocol => {
            try {
                return {
                    ...protocol,
                    steps: JSON.parse(protocol.steps),
                    equipment: protocol.equipment ? JSON.parse(protocol.equipment) : [],
                    reagents: protocol.reagents ? JSON.parse(protocol.reagents) : [],
                    executionCount: protocol._count.executions,
                    // Remove _count from response
                    _count: undefined
                };
            } catch (error) {
                console.error('Error parsing protocol JSON:', error);
                return {
                    ...protocol,
                    steps: [],
                    equipment: [],
                    reagents: [],
                    executionCount: protocol._count.executions,
                    _count: undefined
                };
            }
        });

        res.json({
            protocols: transformedProtocols,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error) {
        console.error('Error fetching protocols:', error);
        res.status(500).json({ error: 'Failed to fetch protocols' });
    }
});

// Get protocols by category
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const protocols = await prisma.protocol.findMany({
            where: { category },
            include: {
                executions: {
                    include: {
                        experiment: { select: { id: true, name: true, project: { select: { id: true, name: true } } } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
            orderBy: { updatedAt: 'desc' },
            skip,
            take: parseInt(limit as string),
        });

        const total = await prisma.protocol.count({ where: { category } });

        // Transform protocols
        const transformedProtocols = protocols.map(protocol => ({
            ...protocol,
            steps: JSON.parse(protocol.steps),
            equipment: protocol.equipment ? JSON.parse(protocol.equipment) : [],
            reagents: protocol.reagents ? JSON.parse(protocol.reagents) : [],
            executions: protocol.executions.map(execution => ({
                ...execution,
                modifications: execution.modifications ? JSON.parse(execution.modifications) : [],
                results: execution.results ? JSON.parse(execution.results) : [],
                issues: execution.issues ? JSON.parse(execution.issues) : [],
            })),
        }));

        res.json({
            protocols: transformedProtocols,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error) {
        console.error('Error fetching protocols by category:', error);
        res.status(500).json({ error: 'Failed to fetch protocols' });
    }
});

// Get a specific protocol
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const protocol = await prisma.protocol.findUnique({
            where: { id },
            include: {
                executions: {
                    include: {
                        experiment: { select: { id: true, name: true, project: { select: { id: true, name: true } } } }
                    },
                    orderBy: { createdAt: 'desc' },
                },
                links: {
                    include: {
                        note: { select: { id: true, title: true } },
                        highlight: { select: { id: true, text: true, pdf: { select: { title: true } } } },
                        databaseEntry: { select: { id: true, name: true, type: true } },
                        table: { select: { id: true, name: true } },
                    }
                }
            }
        });

        if (!protocol) {
            return res.status(404).json({ error: 'Protocol not found' });
        }

        // Transform protocol
        const transformedProtocol = {
            ...protocol,
            steps: JSON.parse(protocol.steps),
            equipment: protocol.equipment ? JSON.parse(protocol.equipment) : [],
            reagents: protocol.reagents ? JSON.parse(protocol.reagents) : [],
            executions: protocol.executions.map(execution => ({
                ...execution,
                modifications: execution.modifications ? JSON.parse(execution.modifications) : [],
                results: execution.results ? JSON.parse(execution.results) : [],
                issues: execution.issues ? JSON.parse(execution.issues) : [],
            })),
        };

        res.json(transformedProtocol);
    } catch (error) {
        console.error('Error fetching protocol:', error);
        res.status(500).json({ error: 'Failed to fetch protocol' });
    }
});

// Create a new protocol
router.post('/', async (req, res) => {
    try {
        const validatedData = createProtocolSchema.parse(req.body);

        const protocol = await prisma.protocol.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                category: validatedData.category || 'General', // Provide default category
                version: validatedData.version || '1.0',
                steps: JSON.stringify(validatedData.steps || []), // Provide default empty array
                equipment: validatedData.equipment ? JSON.stringify(validatedData.equipment) : null,
                reagents: validatedData.reagents ? JSON.stringify(validatedData.reagents) : null,
                safetyNotes: validatedData.safetyNotes,
                expectedDuration: validatedData.expectedDuration,
                difficulty: validatedData.difficulty,
            },
            include: {
                executions: true,
            }
        });

        // Transform response
        const transformedProtocol = {
            ...protocol,
            steps: JSON.parse(protocol.steps),
            equipment: protocol.equipment ? JSON.parse(protocol.equipment) : [],
            reagents: protocol.reagents ? JSON.parse(protocol.reagents) : [],
            executions: [],
        };

        res.status(201).json(transformedProtocol);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error creating protocol:', error);
        res.status(500).json({ error: 'Failed to create protocol' });
    }
});

// Update a protocol
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateProtocolSchema.parse(req.body);

        const updateData: any = {};
        if (validatedData.name) updateData.name = validatedData.name;
        if (validatedData.description !== undefined) updateData.description = validatedData.description;
        if (validatedData.category) updateData.category = validatedData.category;
        if (validatedData.version) updateData.version = validatedData.version;
        if (validatedData.steps) updateData.steps = JSON.stringify(validatedData.steps);
        if (validatedData.equipment !== undefined) updateData.equipment = validatedData.equipment ? JSON.stringify(validatedData.equipment) : null;
        if (validatedData.reagents !== undefined) updateData.reagents = validatedData.reagents ? JSON.stringify(validatedData.reagents) : null;
        if (validatedData.safetyNotes !== undefined) updateData.safetyNotes = validatedData.safetyNotes;
        if (validatedData.expectedDuration !== undefined) updateData.expectedDuration = validatedData.expectedDuration;
        if (validatedData.difficulty !== undefined) updateData.difficulty = validatedData.difficulty;

        const protocol = await prisma.protocol.update({
            where: { id },
            data: updateData,
            include: {
                executions: {
                    include: {
                        experiment: { select: { id: true, name: true, project: { select: { id: true, name: true } } } }
                    },
                    orderBy: { createdAt: 'desc' },
                },
            }
        });

        // Transform response
        const transformedProtocol = {
            ...protocol,
            steps: JSON.parse(protocol.steps),
            equipment: protocol.equipment ? JSON.parse(protocol.equipment) : [],
            reagents: protocol.reagents ? JSON.parse(protocol.reagents) : [],
            executions: protocol.executions.map(execution => ({
                ...execution,
                modifications: execution.modifications ? JSON.parse(execution.modifications) : [],
                results: execution.results ? JSON.parse(execution.results) : [],
                issues: execution.issues ? JSON.parse(execution.issues) : [],
            })),
        };

        res.json(transformedProtocol);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error updating protocol:', error);
        res.status(500).json({ error: 'Failed to update protocol' });
    }
});

// Delete a protocol
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Delete associated links first
        await prisma.link.deleteMany({
            where: {
                OR: [
                    { sourceId: id, sourceType: 'protocol' },
                    { targetId: id, targetType: 'protocol' }
                ]
            }
        });

        // Delete all executions first
        await prisma.protocolExecution.deleteMany({
            where: { protocolId: id }
        });

        await prisma.protocol.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting protocol:', error);
        res.status(500).json({ error: 'Failed to delete protocol' });
    }
});

// Create a protocol execution
router.post('/:id/executions', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = createExecutionSchema.parse(req.body);

        // Verify the protocol exists
        const protocol = await prisma.protocol.findUnique({
            where: { id }
        });

        if (!protocol) {
            return res.status(404).json({ error: 'Protocol not found' });
        }

        const execution = await prisma.protocolExecution.create({
            data: {
                protocolId: id,
                experimentId: validatedData.experimentId,
                status: validatedData.status,
                startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
                endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
                notes: validatedData.notes,
                modifications: validatedData.modifications ? JSON.stringify(validatedData.modifications) : null,
                results: validatedData.results ? JSON.stringify(validatedData.results) : null,
                issues: validatedData.issues ? JSON.stringify(validatedData.issues) : null,
                nextSteps: validatedData.nextSteps,
                executedBy: validatedData.executedBy,
                completedSteps: validatedData.completedSteps ? JSON.stringify(validatedData.completedSteps) : null,
            },
            include: {
                protocol: { select: { id: true, name: true } },
                experiment: { select: { id: true, name: true, project: { select: { id: true, name: true } } } }
            }
        });

        // Transform response
        const transformedExecution = {
            ...execution,
            modifications: execution.modifications ? JSON.parse(execution.modifications) : [],
            results: execution.results ? JSON.parse(execution.results) : [],
            issues: execution.issues ? JSON.parse(execution.issues) : [],
            completedSteps: execution.completedSteps ? JSON.parse(execution.completedSteps) : [],
        };

        res.status(201).json(transformedExecution);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error creating protocol execution:', error);
        res.status(500).json({ error: 'Failed to create protocol execution' });
    }
});

// Update a protocol execution
router.put('/:protocolId/executions/:executionId', async (req, res) => {
    try {
        const { protocolId, executionId } = req.params;
        const validatedData = updateExecutionSchema.parse(req.body);

        const updateData: any = {};
        if (validatedData.status) updateData.status = validatedData.status;
        if (validatedData.startDate !== undefined) updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
        if (validatedData.endDate !== undefined) updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;
        if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
        if (validatedData.modifications !== undefined) updateData.modifications = validatedData.modifications ? JSON.stringify(validatedData.modifications) : null;
        if (validatedData.results !== undefined) updateData.results = validatedData.results ? JSON.stringify(validatedData.results) : null;
        if (validatedData.issues !== undefined) updateData.issues = validatedData.issues ? JSON.stringify(validatedData.issues) : null;
        if (validatedData.nextSteps !== undefined) updateData.nextSteps = validatedData.nextSteps;
        if (validatedData.executedBy !== undefined) updateData.executedBy = validatedData.executedBy;
        if (validatedData.completedSteps !== undefined) updateData.completedSteps = JSON.stringify(validatedData.completedSteps);

        const execution = await prisma.protocolExecution.update({
            where: { id: executionId },
            data: updateData,
            include: {
                protocol: { select: { id: true, name: true } },
                experiment: { select: { id: true, name: true, project: { select: { id: true, name: true } } } }
            }
        });

        // Transform response
        const transformedExecution = {
            ...execution,
            modifications: execution.modifications ? JSON.parse(execution.modifications) : [],
            results: execution.results ? JSON.parse(execution.results) : [],
            issues: execution.issues ? JSON.parse(execution.issues) : [],
            completedSteps: execution.completedSteps ? JSON.parse(execution.completedSteps) : [],
        };

        res.json(transformedExecution);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error updating protocol execution:', error);
        res.status(500).json({ error: 'Failed to update protocol execution' });
    }
});

// Delete a protocol execution
router.delete('/:protocolId/executions/:executionId', async (req, res) => {
    try {
        const { executionId } = req.params;

        await prisma.protocolExecution.delete({
            where: { id: executionId }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting protocol execution:', error);
        res.status(500).json({ error: 'Failed to delete protocol execution' });
    }
});

// Search protocols
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const { category } = req.query;

        const where: any = {
            OR: [
                { name: { contains: query } },
                { description: { contains: query } },
                { category: { contains: query } },
            ]
        };

        if (category) {
            where.category = category;
        }

        const protocols = await prisma.protocol.findMany({
            where,
            include: {
                executions: {
                    include: {
                        experiment: { select: { id: true, name: true, project: { select: { id: true, name: true } } } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 3,
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Transform protocols
        const transformedProtocols = protocols.map(protocol => ({
            ...protocol,
            steps: JSON.parse(protocol.steps),
            equipment: protocol.equipment ? JSON.parse(protocol.equipment) : [],
            reagents: protocol.reagents ? JSON.parse(protocol.reagents) : [],
            executions: protocol.executions.map(execution => ({
                ...execution,
                modifications: execution.modifications ? JSON.parse(execution.modifications) : [],
                results: execution.results ? JSON.parse(execution.results) : [],
                issues: execution.issues ? JSON.parse(execution.issues) : [],
            })),
        }));

        res.json({ protocols: transformedProtocols });
    } catch (error) {
        console.error('Error searching protocols:', error);
        res.status(500).json({ error: 'Failed to search protocols' });
    }
});

// Get protocol statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const totalProtocols = await prisma.protocol.count();

        const protocolsByCategory = await prisma.protocol.groupBy({
            by: ['category'],
            _count: {
                category: true
            }
        });

        const recentProtocols = await prisma.protocol.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 5,
            include: {
                executions: { select: { id: true, status: true } }
            }
        });

        const executionStats = await prisma.protocolExecution.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });

        const stats = {
            total: totalProtocols,
            byCategory: protocolsByCategory.reduce((acc, item) => {
                acc[item.category] = item._count.category;
                return acc;
            }, {} as Record<string, number>),
            recent: recentProtocols.map(protocol => ({
                id: protocol.id,
                name: protocol.name,
                category: protocol.category,
                executionCount: protocol.executions.length,
                updatedAt: protocol.updatedAt,
            })),
            executions: executionStats.reduce((acc, item) => {
                acc[item.status] = item._count.status;
                return acc;
            }, {} as Record<string, number>),
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching protocol statistics:', error);
        res.status(500).json({ error: 'Failed to fetch protocol statistics' });
    }
});

export default router; 