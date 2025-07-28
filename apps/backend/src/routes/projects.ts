import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken } from './auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createProjectSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(['active', 'archived', 'future']).default('active'),
    startDate: z.string().datetime().optional().nullable(),
    lastActivity: z.string().datetime().optional().nullable(),
});

const updateProjectSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(['active', 'archived', 'future']).optional(),
    startDate: z.string().datetime().optional().nullable(),
    lastActivity: z.string().datetime().optional().nullable(),
});

const createExperimentSchema = z.object({
    projectId: z.string(),
    name: z.string().min(1),
    description: z.string().optional(),
});

const updateExperimentSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    protocolIds: z.array(z.string()).optional(),
    noteIds: z.array(z.string()).optional(),
    literatureNoteIds: z.array(z.string()).optional(),
});

// Get all projects
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const projects = await prisma.project.findMany({
            where: {
                userId: req.user.userId
            },
            include: {
                experiments: {
                    include: {
                        notes: {
                            select: { id: true, title: true, type: true, createdAt: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get a specific project
router.get('/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;

        const project = await prisma.project.findFirst({
            where: { 
                id,
                userId: req.user.userId
            },
            include: {
                experiments: {
                    include: {
                        notes: {
                            select: { id: true, title: true, type: true, createdAt: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// Create a new project
router.post('/', authenticateToken, async (req: any, res) => {
    try {
        const validatedData = createProjectSchema.parse(req.body);

        const project = await prisma.project.create({
            data: {
                ...validatedData,
                userId: req.user.userId
            }
        });

        res.status(201).json(project);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Update a project
router.put('/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateProjectSchema.parse(req.body);

        const project = await prisma.project.update({
            where: { 
                id,
                userId: req.user.userId
            },
            data: validatedData
        });

        res.json(project);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete a project
router.delete('/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;

        // Verify the project belongs to the user
        const project = await prisma.project.findFirst({
            where: { 
                id,
                userId: req.user.userId
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Delete all experiments and their notes first
        const experiments = await prisma.experiment.findMany({
            where: { projectId: id },
            include: { notes: true }
        });

        for (const experiment of experiments) {
            // Delete experiment notes
            await prisma.note.deleteMany({
                where: { experimentId: experiment.id }
            });
        }

        // Delete experiments
        await prisma.experiment.deleteMany({
            where: { projectId: id }
        });

        // Delete project
        await prisma.project.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Get all experiments for a project
router.get('/:projectId/experiments', async (req, res) => {
    try {
        const { projectId } = req.params;

        const experiments = await prisma.experiment.findMany({
            where: { projectId },
            include: {
                notes: {
                    select: { id: true, title: true, type: true, createdAt: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(experiments);
    } catch (error) {
        console.error('Error fetching experiments:', error);
        res.status(500).json({ error: 'Failed to fetch experiments' });
    }
});

// Create a new experiment
router.post('/:projectId/experiments', async (req, res) => {
    try {
        const { projectId } = req.params;
        const validatedData = createExperimentSchema.parse({ ...req.body, projectId });

        const experiment = await prisma.experiment.create({
            data: validatedData,
            include: {
                project: { select: { id: true, name: true } }
            }
        });

        res.status(201).json(experiment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error creating experiment:', error);
        res.status(500).json({ error: 'Failed to create experiment' });
    }
});

// Update an experiment
router.put('/experiments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateExperimentSchema.parse(req.body);

        // Update experiment fields
        const experiment = await prisma.experiment.update({
            where: { id },
            data: {
                name: validatedData.name,
                description: validatedData.description,
            },
            include: {
                project: { select: { id: true, name: true } }
            }
        });

        // --- Protocols ---
        if (validatedData.protocolIds) {
            // Remove ProtocolExecutions not in protocolIds
            await prisma.protocolExecution.deleteMany({
                where: {
                    experimentId: id,
                    protocolId: { notIn: validatedData.protocolIds },
                },
            });
            // Add missing ProtocolExecutions
            for (const protocolId of validatedData.protocolIds) {
                const exists = await prisma.protocolExecution.findFirst({
                    where: { experimentId: id, protocolId },
                });
                if (!exists) {
                    await prisma.protocolExecution.create({
                        data: { experimentId: id, protocolId, status: 'planned' },
                    });
                }
            }
        }

        // --- Notes ---
        if (validatedData.noteIds) {
            // Set experimentId for selected notes
            await prisma.note.updateMany({
                where: { id: { in: validatedData.noteIds } },
                data: { experimentId: id },
            });
            // Unlink notes that are no longer selected
            await prisma.note.updateMany({
                where: { experimentId: id, id: { notIn: validatedData.noteIds } },
                data: { experimentId: null },
            });
        }

        // --- Literature Notes ---
        if (validatedData.literatureNoteIds) {
            // Remove old links
            await prisma.link.deleteMany({
                where: {
                    sourceType: 'experiment',
                    sourceId: id,
                    targetType: 'literatureNote',
                    targetId: { notIn: validatedData.literatureNoteIds },
                },
            });
            // Add new links
            for (const litId of validatedData.literatureNoteIds) {
                const exists = await prisma.link.findFirst({
                    where: {
                        sourceType: 'experiment',
                        sourceId: id,
                        targetType: 'literatureNote',
                        targetId: litId,
                    },
                });
                if (!exists) {
                    await prisma.link.create({
                        data: {
                            sourceType: 'experiment',
                            sourceId: id,
                            targetType: 'literatureNote',
                            targetId: litId,
                        },
                    });
                }
            }
        }

        res.json(experiment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error updating experiment:', error);
        res.status(500).json({ error: 'Failed to update experiment' });
    }
});

// Delete an experiment
router.delete('/experiments/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Delete experiment notes first
        await prisma.note.deleteMany({
            where: { experimentId: id }
        });

        await prisma.experiment.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting experiment:', error);
        res.status(500).json({ error: 'Failed to delete experiment' });
    }
});

router.get('/experiments/:id/executions', async (req, res) => {
    try {
        const { id } = req.params;
        const executions = await prisma.protocolExecution.findMany({
            where: { experimentId: id },
            include: {
                protocol: true,
            },
            orderBy: { createdAt: 'asc' },
        });
        const result = executions.map(exec => ({
            ...exec,
            completedSteps: exec.completedSteps ? JSON.parse(exec.completedSteps) : [],
            protocol: {
                ...exec.protocol,
                steps: exec.protocol.steps ? JSON.parse(exec.protocol.steps) : [],
            },
        }));
        res.json({ executions: result });
    } catch (error) {
        console.error('Error fetching protocol executions for experiment:', error);
        res.status(500).json({ error: 'Failed to fetch protocol executions for experiment' });
    }
});

export default router; 