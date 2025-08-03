import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const variableCategorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    icon: z.string().optional(),
    unit: z.string().optional(),
    dataType: z.enum(['number', 'text', 'boolean', 'date', 'select']),
    options: z.string().optional(), // JSON array for select type
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    isRequired: z.boolean().default(false),
    isGlobal: z.boolean().default(false)
});

const experimentVariableSchema = z.object({
    experimentId: z.string().uuid(),
    categoryId: z.string().uuid(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    unit: z.string().optional(),
    dataType: z.enum(['number', 'text', 'boolean', 'date', 'select']).optional(),
    isRequired: z.boolean().default(false),
    order: z.number().int().default(0)
});

const variableValueSchema = z.object({
    variableId: z.string().uuid(),
    value: z.string().min(1, 'Value is required'),
    notes: z.string().optional(),
    metadata: z.string().optional() // JSON string
});

// Get all variable categories for a user
router.get('/categories', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const categories = await prisma.variableCategory.findMany({
            where: {
                OR: [
                    { userId },
                    { isGlobal: true }
                ]
            },
            orderBy: { name: 'asc' }
        });

        res.json(categories);
    } catch (error) {
        console.error('Error fetching variable categories:', error);
        res.status(500).json({ error: 'Failed to fetch variable categories' });
    }
});

// Create a new variable category
router.post('/categories', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = variableCategorySchema.parse(req.body);

        const category = await prisma.variableCategory.create({
            data: {
                ...validatedData,
                userId
            }
        });

        res.status(201).json(category);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
        } else {
            console.error('Error creating variable category:', error);
            res.status(500).json({ error: 'Failed to create variable category' });
        }
    }
});

// Update a variable category
router.put('/categories/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const validatedData = variableCategorySchema.parse(req.body);

        const category = await prisma.variableCategory.findFirst({
            where: { id, userId }
        });

        if (!category) {
            return res.status(404).json({ error: 'Variable category not found' });
        }

        const updatedCategory = await prisma.variableCategory.update({
            where: { id },
            data: validatedData
        });

        res.json(updatedCategory);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
        } else {
            console.error('Error updating variable category:', error);
            res.status(500).json({ error: 'Failed to update variable category' });
        }
    }
});

// Delete a variable category
router.delete('/categories/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const category = await prisma.variableCategory.findFirst({
            where: { id, userId },
            include: {
                variables: {
                    include: {
                        values: true
                    }
                }
            }
        });

        if (!category) {
            return res.status(404).json({ error: 'Variable category not found' });
        }

        // Check if category has variables
        if (category.variables.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete category with existing variables. Please delete all variables first.'
            });
        }

        await prisma.variableCategory.delete({
            where: { id }
        });

        res.json({ message: 'Variable category deleted successfully' });
    } catch (error) {
        console.error('Error deleting variable category:', error);
        res.status(500).json({ error: 'Failed to delete variable category' });
    }
});

// Get variables for an experiment
router.get('/experiments/:experimentId/variables', authenticateToken, async (req: any, res) => {
    try {
        const { experimentId } = req.params;
        const userId = req.user.userId;

        // Verify user has access to the experiment
        const experiment = await prisma.experiment.findFirst({
            where: {
                id: experimentId,
                project: { userId }
            }
        });

        if (!experiment) {
            return res.status(404).json({ error: 'Experiment not found' });
        }

        const variables = await prisma.experimentVariable.findMany({
            where: { experimentId },
            include: {
                category: true,
                values: {
                    orderBy: { timestamp: 'desc' },
                    take: 1 // Get latest value
                }
            },
            orderBy: { order: 'asc' }
        });

        res.json(variables);
    } catch (error) {
        console.error('Error fetching experiment variables:', error);
        res.status(500).json({ error: 'Failed to fetch experiment variables' });
    }
});

// Add a variable to an experiment
router.post('/experiments/:experimentId/variables', authenticateToken, async (req: any, res) => {
    try {
        const { experimentId } = req.params;
        const userId = req.user.userId;
        const validatedData = experimentVariableSchema.parse({
            ...req.body,
            experimentId
        });

        // Verify user has access to the experiment
        const experiment = await prisma.experiment.findFirst({
            where: {
                id: experimentId,
                project: { userId }
            }
        });

        if (!experiment) {
            return res.status(404).json({ error: 'Experiment not found' });
        }

        // Verify category exists and user has access
        const category = await prisma.variableCategory.findFirst({
            where: {
                id: validatedData.categoryId,
                OR: [
                    { userId },
                    { isGlobal: true }
                ]
            }
        });

        if (!category) {
            return res.status(404).json({ error: 'Variable category not found' });
        }

        const variable = await prisma.experimentVariable.create({
            data: {
                ...validatedData,
                dataType: validatedData.dataType || category.dataType
            },
            include: {
                category: true
            }
        });

        res.status(201).json(variable);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
        } else {
            console.error('Error creating experiment variable:', error);
            res.status(500).json({ error: 'Failed to create experiment variable' });
        }
    }
});

// Update an experiment variable
router.put('/variables/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const validatedData = experimentVariableSchema.omit({ experimentId: true }).parse(req.body);

        // Verify user has access to the variable
        const variable = await prisma.experimentVariable.findFirst({
            where: {
                id,
                experiment: {
                    project: { userId }
                }
            }
        });

        if (!variable) {
            return res.status(404).json({ error: 'Experiment variable not found' });
        }

        const updatedVariable = await prisma.experimentVariable.update({
            where: { id },
            data: validatedData,
            include: {
                category: true
            }
        });

        res.json(updatedVariable);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
        } else {
            console.error('Error updating experiment variable:', error);
            res.status(500).json({ error: 'Failed to update experiment variable' });
        }
    }
});

// Delete an experiment variable
router.delete('/variables/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Verify user has access to the variable
        const variable = await prisma.experimentVariable.findFirst({
            where: {
                id,
                experiment: {
                    project: { userId }
                }
            }
        });

        if (!variable) {
            return res.status(404).json({ error: 'Experiment variable not found' });
        }

        await prisma.experimentVariable.delete({
            where: { id }
        });

        res.json({ message: 'Experiment variable deleted successfully' });
    } catch (error) {
        console.error('Error deleting experiment variable:', error);
        res.status(500).json({ error: 'Failed to delete experiment variable' });
    }
});

// Get values for a variable
router.get('/variables/:id/values', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const userId = req.user.userId;

        // Verify user has access to the variable
        const variable = await prisma.experimentVariable.findFirst({
            where: {
                id,
                experiment: {
                    project: { userId }
                }
            }
        });

        if (!variable) {
            return res.status(404).json({ error: 'Experiment variable not found' });
        }

        const values = await prisma.variableValue.findMany({
            where: { variableId: id },
            orderBy: { timestamp: 'desc' },
            take: parseInt(limit as string),
            skip: parseInt(offset as string)
        });

        const totalCount = await prisma.variableValue.count({
            where: { variableId: id }
        });

        res.json({
            values,
            pagination: {
                total: totalCount,
                limit: parseInt(limit as string),
                offset: parseInt(offset as string)
            }
        });
    } catch (error) {
        console.error('Error fetching variable values:', error);
        res.status(500).json({ error: 'Failed to fetch variable values' });
    }
});

// Add a value to a variable
router.post('/variables/:id/values', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const validatedData = variableValueSchema.parse({
            ...req.body,
            variableId: id
        });

        // Verify user has access to the variable
        const variable = await prisma.experimentVariable.findFirst({
            where: {
                id,
                experiment: {
                    project: { userId }
                }
            }
        });

        if (!variable) {
            return res.status(404).json({ error: 'Experiment variable not found' });
        }

        // Validate value based on data type
        const validationError = validateValueByType(validatedData.value, variable.dataType);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const value = await prisma.variableValue.create({
            data: {
                ...validatedData,
                createdBy: userId
            }
        });

        res.status(201).json(value);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
        } else {
            console.error('Error creating variable value:', error);
            res.status(500).json({ error: 'Failed to create variable value' });
        }
    }
});

// Get variable tracking analytics
router.get('/analytics', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { experimentId, categoryId, dateRange } = req.query;

        let whereClause: any = {
            experiment: {
                project: { userId }
            }
        };

        if (experimentId) {
            whereClause.experimentId = experimentId;
        }

        if (categoryId) {
            whereClause.categoryId = categoryId;
        }

        // Get variable statistics
        const variableStats = await prisma.experimentVariable.groupBy({
            by: ['categoryId'],
            where: whereClause,
            _count: {
                id: true
            }
        });

        // Get value statistics
        const valueStats = await prisma.variableValue.groupBy({
            by: ['variableId'],
            where: {
                variable: whereClause
            },
            _count: {
                id: true
            },
            _max: {
                timestamp: true
            },
            _min: {
                timestamp: true
            }
        });

        // Get recent values
        const recentValues = await prisma.variableValue.findMany({
            where: {
                variable: whereClause
            },
            include: {
                variable: {
                    include: {
                        category: true,
                        experiment: true
                    }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: 10
        });

        res.json({
            variableStats,
            valueStats,
            recentValues
        });
    } catch (error) {
        console.error('Error fetching variable analytics:', error);
        res.status(500).json({ error: 'Failed to fetch variable analytics' });
    }
});

// Helper function to validate values based on data type
function validateValueByType(value: string, dataType: string): string | null {
    switch (dataType) {
        case 'number':
            if (isNaN(Number(value))) {
                return 'Value must be a valid number';
            }
            break;
        case 'boolean':
            if (!['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase())) {
                return 'Value must be a valid boolean (true/false, yes/no, 1/0)';
            }
            break;
        case 'date':
            if (isNaN(Date.parse(value))) {
                return 'Value must be a valid date';
            }
            break;
        case 'select':
            // Validation for select options would be done at the category level
            break;
        case 'text':
        default:
            // Text accepts any value
            break;
    }
    return null;
}

export default router; 