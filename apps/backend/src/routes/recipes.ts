import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const RecipeIngredientSchema = z.object({
    name: z.string().min(1, 'Ingredient name is required'),
    amount: z.number().positive('Amount must be positive'),
    unit: z.string().min(1, 'Unit is required'),
    concentration: z.string().optional(),
    supplier: z.string().optional(),
    catalogNumber: z.string().optional(),
    notes: z.string().optional(),
});

const RecipeStepSchema = z.object({
    id: z.string(),
    stepNumber: z.number(),
    title: z.string(),
    description: z.string().optional(),
    duration: z.string().optional(),
    notes: z.string().optional(),
});

const RecipeSchema = z.object({
    name: z.string().min(1, 'Recipe name is required'),
    description: z.string().optional(),
    category: z.string().optional(), // Made optional
    type: z.string().optional(), // Made optional
    ingredients: z.array(RecipeIngredientSchema).optional(), // Made optional
    steps: z.array(RecipeStepSchema).optional(),
    instructions: z.string().optional(),
    notes: z.string().optional(),
    pH: z.number().min(0).max(14).optional(),
    osmolarity: z.string().optional(),
    storage: z.string().optional(),
    shelfLife: z.string().optional(),
    source: z.string().optional(),
    version: z.string().optional(),
    isPublic: z.boolean().optional(),
    createdBy: z.string().optional(),
});

// Zod schema for RecipeExecution
const RecipeExecutionSchema = z.object({
    experimentId: z.string().optional(),
    status: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    notes: z.string().optional(),
    completedSteps: z.array(z.string()).optional(),
});

// Get all recipes with pagination and filtering
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, category, type, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};

        if (category) where.category = category;
        if (type) where.type = type;
        if (search) {
            where.OR = [
                { name: { contains: search as string } },
                { description: { contains: search as string } },
                { type: { contains: search as string } },
            ];
        }

        const [recipes, total] = await Promise.all([
            prisma.recipe.findMany({
                where,
                include: {
                    ingredients: true,
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: Number(limit),
            }),
            prisma.recipe.count({ where }),
        ]);

        // Parse steps for each recipe
        const parsedRecipes = recipes.map(r => ({
            ...r,
            steps: r.steps ? JSON.parse(r.steps) : [],
        }));

        res.json({
            recipes: parsedRecipes,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

// Get recipe by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const recipe = await prisma.recipe.findUnique({
            where: { id },
            include: {
                ingredients: true,
            },
        });

        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        res.json({
            recipe: {
                ...recipe,
                steps: recipe.steps ? JSON.parse(recipe.steps) : [],
            },
        });
    } catch (error) {
        console.error('Error fetching recipe:', error);
        res.status(500).json({ error: 'Failed to fetch recipe' });
    }
});

// Create new recipe
router.post('/', async (req, res) => {
    try {
        const validatedData = RecipeSchema.parse(req.body);

        const recipe = await prisma.recipe.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                category: validatedData.category || 'General',
                type: validatedData.type || 'Standard',
                steps: validatedData.steps ? JSON.stringify(validatedData.steps) : null,
                instructions: validatedData.instructions,
                notes: validatedData.notes,
                pH: validatedData.pH,
                osmolarity: validatedData.osmolarity,
                storage: validatedData.storage,
                shelfLife: validatedData.shelfLife,
                source: validatedData.source,
                version: validatedData.version || '1.0',
                isPublic: validatedData.isPublic || false,
                createdBy: validatedData.createdBy,
                ingredients: {
                    create: validatedData.ingredients,
                },
            },
            include: {
                ingredients: true,
            },
        });

        res.status(201).json({
            ...recipe,
            steps: recipe.steps ? JSON.parse(recipe.steps) : [],
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error creating recipe:', error);
        res.status(500).json({ error: 'Failed to create recipe' });
    }
});

// Update recipe
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = RecipeSchema.parse(req.body);

        // First, delete existing ingredients
        await prisma.recipeIngredient.deleteMany({
            where: { recipeId: id },
        });

        // Then update recipe and create new ingredients
        const recipe = await prisma.recipe.update({
            where: { id },
            data: {
                name: validatedData.name,
                description: validatedData.description,
                category: validatedData.category || 'General',
                type: validatedData.type || 'Standard',
                steps: validatedData.steps ? JSON.stringify(validatedData.steps) : null,
                instructions: validatedData.instructions,
                notes: validatedData.notes,
                pH: validatedData.pH,
                osmolarity: validatedData.osmolarity,
                storage: validatedData.storage,
                shelfLife: validatedData.shelfLife,
                source: validatedData.source,
                version: validatedData.version || '1.0',
                isPublic: validatedData.isPublic || false,
                ingredients: {
                    create: validatedData.ingredients,
                },
            },
            include: {
                ingredients: true,
            },
        });

        res.json({
            ...recipe,
            steps: recipe.steps ? JSON.parse(recipe.steps) : [],
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error updating recipe:', error);
        res.status(500).json({ error: 'Failed to update recipe' });
    }
});

// Delete recipe
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.recipe.delete({
            where: { id },
        });

        res.json({ message: 'Recipe deleted successfully' });
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ error: 'Failed to delete recipe' });
    }
});

// Create a recipe execution
router.post('/:id/executions', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = RecipeExecutionSchema.parse(req.body);
        const execution = await prisma.recipeExecution.create({
            data: {
                recipeId: id,
                experimentId: validatedData.experimentId,
                status: validatedData.status,
                startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
                endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
                notes: validatedData.notes,
                completedSteps: validatedData.completedSteps ? JSON.stringify(validatedData.completedSteps) : null,
            },
            include: {
                recipe: true,
                experiment: true,
            },
        });
        res.status(201).json({
            ...execution,
            completedSteps: execution.completedSteps ? JSON.parse(execution.completedSteps) : [],
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error creating recipe execution:', error);
        res.status(500).json({ error: 'Failed to create recipe execution' });
    }
});

// Update a recipe execution
router.put('/:recipeId/executions/:executionId', async (req, res) => {
    try {
        const { recipeId, executionId } = req.params;
        const validatedData = RecipeExecutionSchema.parse(req.body);
        const updateData: any = {};
        if (validatedData.status) updateData.status = validatedData.status;
        if (validatedData.startDate !== undefined) updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
        if (validatedData.endDate !== undefined) updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;
        if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
        if (validatedData.completedSteps !== undefined) updateData.completedSteps = JSON.stringify(validatedData.completedSteps);
        const execution = await prisma.recipeExecution.update({
            where: { id: executionId },
            data: updateData,
            include: {
                recipe: true,
                experiment: true,
            },
        });
        res.json({
            ...execution,
            completedSteps: execution.completedSteps ? JSON.parse(execution.completedSteps) : [],
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error updating recipe execution:', error);
        res.status(500).json({ error: 'Failed to update recipe execution' });
    }
});

// Get all executions for a recipe
router.get('/:id/executions', async (req, res) => {
    try {
        const { id } = req.params;
        const executions = await prisma.recipeExecution.findMany({
            where: { recipeId: id },
            include: {
                recipe: true,
                experiment: true,
            },
            orderBy: { createdAt: 'asc' },
        });
        const result = executions.map(exec => ({
            ...exec,
            completedSteps: exec.completedSteps ? JSON.parse(exec.completedSteps) : [],
        }));
        res.json({ executions: result });
    } catch (error) {
        console.error('Error fetching recipe executions:', error);
        res.status(500).json({ error: 'Failed to fetch recipe executions' });
    }
});

// Get recipe categories
router.get('/categories/list', async (req, res) => {
    try {
        const categories = await prisma.recipe.findMany({
            select: { category: true },
            distinct: ['category'],
            orderBy: { category: 'asc' },
        });

        res.json({ categories: categories.map(c => c.category) });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Get recipe types
router.get('/types/list', async (req, res) => {
    try {
        const types = await prisma.recipe.findMany({
            select: { type: true },
            distinct: ['type'],
            orderBy: { type: 'asc' },
        });

        res.json({ types: types.map(t => t.type) });
    } catch (error) {
        console.error('Error fetching types:', error);
        res.status(500).json({ error: 'Failed to fetch types' });
    }
});

// Get recipe statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const [totalRecipes, categoryStats, typeStats] = await Promise.all([
            prisma.recipe.count(),
            prisma.recipe.groupBy({
                by: ['category'],
                _count: { category: true },
                orderBy: { _count: { category: 'desc' } },
            }),
            prisma.recipe.groupBy({
                by: ['type'],
                _count: { type: true },
                orderBy: { _count: { type: 'desc' } },
                take: 10,
            }),
        ]);

        res.json({
            totalRecipes,
            categoryStats: categoryStats.map(stat => ({
                category: stat.category,
                count: stat._count.category,
            })),
            typeStats: typeStats.map(stat => ({
                type: stat.type,
                count: stat._count.type,
            })),
        });
    } catch (error) {
        console.error('Error fetching recipe stats:', error);
        res.status(500).json({ error: 'Failed to fetch recipe statistics' });
    }
});

export default router; 