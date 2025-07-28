import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Search validation schemas
const searchQuerySchema = z.object({
    query: z.string().optional(),
    types: z.array(z.enum(['projects', 'experiments', 'notes', 'database', 'literature', 'protocols', 'recipes', 'tasks'])).optional(),
    dateRange: z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional()
    }).optional(),
    status: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    sortBy: z.enum(['relevance', 'date', 'name', 'type']).default('relevance'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0)
});

const saveSearchSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    searchQuery: searchQuerySchema
});

// Advanced search across all data types
router.post('/advanced', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const searchParams = searchQuerySchema.parse(req.body);
        
        const results: any = {
            projects: [],
            experiments: [],
            notes: [],
            databaseEntries: [],
            literatureNotes: [],
            protocols: [],
            recipes: [],
            tasks: [],
            totalResults: 0,
            searchTime: 0
        };

        const startTime = Date.now();

        // Build date filter
        const dateFilter = searchParams.dateRange ? {
            ...(searchParams.dateRange.startDate && { gte: new Date(searchParams.dateRange.startDate) }),
            ...(searchParams.dateRange.endDate && { lte: new Date(searchParams.dateRange.endDate) })
        } : {};

        // Search projects
        if (!searchParams.types || searchParams.types.includes('projects')) {
            const projects = await prisma.project.findMany({
                where: {
                    userId,
                    ...(searchParams.query && {
                        OR: [
                            { name: { contains: searchParams.query } },
                            { description: { contains: searchParams.query } }
                        ]
                    }),
                    ...(searchParams.status && { status: { in: searchParams.status } }),
                    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
                },
                include: {
                    experiments: {
                        include: {
                            notes: true
                        }
                    }
                },
                orderBy: {
                    [searchParams.sortBy === 'date' ? 'createdAt' : 'name']: searchParams.sortOrder
                },
                take: searchParams.limit,
                skip: searchParams.offset
            });
            results.projects = projects;
        }

        // Search experiments
        if (!searchParams.types || searchParams.types.includes('experiments')) {
            const experiments = await prisma.experiment.findMany({
                where: {
                    project: { userId },
                    ...(searchParams.query && {
                        OR: [
                            { name: { contains: searchParams.query } },
                            { description: { contains: searchParams.query } }
                        ]
                    }),
                    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
                },
                include: {
                    project: true,
                    notes: true
                },
                orderBy: {
                    [searchParams.sortBy === 'date' ? 'createdAt' : 'name']: searchParams.sortOrder
                },
                take: searchParams.limit,
                skip: searchParams.offset
            });
            results.experiments = experiments;
        }

        // Search notes
        if (!searchParams.types || searchParams.types.includes('notes')) {
            const notes = await prisma.note.findMany({
                where: {
                    experiment: {
                        project: { userId }
                    },
                    ...(searchParams.query && {
                        OR: [
                            { title: { contains: searchParams.query } },
                            { content: { contains: searchParams.query } },
                            { type: { contains: searchParams.query } }
                        ]
                    }),
                    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
                },
                include: {
                    experiment: {
                        include: {
                            project: true
                        }
                    }
                },
                orderBy: {
                    [searchParams.sortBy === 'date' ? 'createdAt' : 'title']: searchParams.sortOrder
                },
                take: searchParams.limit,
                skip: searchParams.offset
            });
            results.notes = notes;
        }

        // Search database entries
        if (!searchParams.types || searchParams.types.includes('database')) {
            const databaseEntries = await prisma.databaseEntry.findMany({
                where: {
                    ...(searchParams.query && {
                        OR: [
                            { name: { contains: searchParams.query } },
                            { description: { contains: searchParams.query } },
                            { type: { contains: searchParams.query } }
                        ]
                    }),
                    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
                },
                orderBy: {
                    [searchParams.sortBy === 'date' ? 'createdAt' : 'name']: searchParams.sortOrder
                },
                take: searchParams.limit,
                skip: searchParams.offset
            });
            results.databaseEntries = databaseEntries;
        }

        // Search literature notes
        if (!searchParams.types || searchParams.types.includes('literature')) {
            const literatureNotes = await prisma.literatureNote.findMany({
                where: {
                    ...(searchParams.query && {
                        OR: [
                            { title: { contains: searchParams.query } },
                            { authors: { contains: searchParams.query } },
                            { abstract: { contains: searchParams.query } },
                            { tags: { contains: searchParams.query } }
                        ]
                    }),
                    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
                },
                orderBy: {
                    [searchParams.sortBy === 'date' ? 'createdAt' : 'title']: searchParams.sortOrder
                },
                take: searchParams.limit,
                skip: searchParams.offset
            });
            results.literatureNotes = literatureNotes;
        }

        // Search protocols
        if (!searchParams.types || searchParams.types.includes('protocols')) {
            const protocols = await prisma.protocol.findMany({
                where: {
                    ...(searchParams.query && {
                        OR: [
                            { name: { contains: searchParams.query } },
                            { description: { contains: searchParams.query } },
                            { category: { contains: searchParams.query } }
                        ]
                    }),
                    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
                },
                orderBy: {
                    [searchParams.sortBy === 'date' ? 'createdAt' : 'name']: searchParams.sortOrder
                },
                take: searchParams.limit,
                skip: searchParams.offset
            });
            results.protocols = protocols;
        }

        // Search recipes
        if (!searchParams.types || searchParams.types.includes('recipes')) {
            const recipes = await prisma.recipe.findMany({
                where: {
                    ...(searchParams.query && {
                        OR: [
                            { name: { contains: searchParams.query } },
                            { description: { contains: searchParams.query } },
                            { category: { contains: searchParams.query } }
                        ]
                    }),
                    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
                },
                orderBy: {
                    [searchParams.sortBy === 'date' ? 'createdAt' : 'name']: searchParams.sortOrder
                },
                take: searchParams.limit,
                skip: searchParams.offset
            });
            results.recipes = recipes;
        }

        // Search tasks
        if (!searchParams.types || searchParams.types.includes('tasks')) {
            const tasks = await prisma.task.findMany({
                where: {
                    project: { userId },
                    ...(searchParams.query && {
                        OR: [
                            { title: { contains: searchParams.query } },
                            { description: { contains: searchParams.query } }
                        ]
                    }),
                    ...(searchParams.status && { status: { in: searchParams.status } }),
                    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
                },
                include: {
                    project: true
                },
                orderBy: {
                    [searchParams.sortBy === 'date' ? 'createdAt' : 'title']: searchParams.sortOrder
                },
                take: searchParams.limit,
                skip: searchParams.offset
            });
            results.tasks = tasks;
        }

        // Calculate totals
        results.totalResults = 
            results.projects.length + 
            results.experiments.length + 
            results.notes.length + 
            results.databaseEntries.length + 
            results.literatureNotes.length + 
            results.protocols.length + 
            results.recipes.length + 
            results.tasks.length;

        results.searchTime = Date.now() - startTime;

        // Save search to history
        await saveSearchHistory(userId, searchParams);

        res.json(results);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Search error:', error);
        res.status(500).json({ error: 'Failed to perform search' });
    }
});

// Save search query
router.post('/save', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const saveData = saveSearchSchema.parse(req.body);

        const savedSearch = await prisma.savedSearch.create({
            data: {
                name: saveData.name,
                description: saveData.description,
                searchQuery: JSON.stringify(saveData.searchQuery),
                userId
            }
        });

        res.status(201).json(savedSearch);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Save search error:', error);
        res.status(500).json({ error: 'Failed to save search' });
    }
});

// Get saved searches
router.get('/saved', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const savedSearches = await prisma.savedSearch.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(savedSearches);
    } catch (error) {
        console.error('Get saved searches error:', error);
        res.status(500).json({ error: 'Failed to get saved searches' });
    }
});

// Delete saved search
router.delete('/saved/:id', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const savedSearch = await prisma.savedSearch.findFirst({
            where: { 
                id,
                userId
            }
        });

        if (!savedSearch) {
            return res.status(404).json({ error: 'Saved search not found' });
        }

        await prisma.savedSearch.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Delete saved search error:', error);
        res.status(500).json({ error: 'Failed to delete saved search' });
    }
});

// Get search history
router.get('/history', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit as string) || 20;

        const searchHistory = await prisma.searchHistory.findMany({
            where: { userId },
            orderBy: { timestamp: 'desc' },
            take: limit
        });

        res.json(searchHistory);
    } catch (error) {
        console.error('Get search history error:', error);
        res.status(500).json({ error: 'Failed to get search history' });
    }
});

// Clear search history
router.delete('/history', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        await prisma.searchHistory.deleteMany({
            where: { userId }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Clear search history error:', error);
        res.status(500).json({ error: 'Failed to clear search history' });
    }
});

// Get search suggestions
router.get('/suggestions', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const query = req.query.q as string;

        if (!query || query.length < 2) {
            return res.json([]);
        }

        const suggestions = [];

        // Get project suggestions
        const projectSuggestions = await prisma.project.findMany({
            where: {
                userId,
                name: { contains: query }
            },
            select: { name: true },
            take: 5
        });
        suggestions.push(...projectSuggestions.map(p => ({ type: 'project', text: p.name })));

        // Get note suggestions
        const noteSuggestions = await prisma.note.findMany({
            where: {
                experiment: {
                    project: { userId }
                },
                title: { contains: query }
            },
            select: { title: true },
            take: 5
        });
        suggestions.push(...noteSuggestions.map(n => ({ type: 'note', text: n.title })));

        // Get database entry suggestions
        const dbSuggestions = await prisma.databaseEntry.findMany({
            where: {
                name: { contains: query }
            },
            select: { name: true },
            take: 5
        });
        suggestions.push(...dbSuggestions.map(d => ({ type: 'database', text: d.name })));

        // Remove duplicates and limit results
        const uniqueSuggestions = suggestions
            .filter((s, index, self) => 
                index === self.findIndex(t => t.text === s.text)
            )
            .slice(0, 10);

        res.json(uniqueSuggestions);
    } catch (error) {
        console.error('Get suggestions error:', error);
        res.status(500).json({ error: 'Failed to get suggestions' });
    }
});

// Helper function to save search history
async function saveSearchHistory(userId: string, searchParams: any) {
    try {
        await prisma.searchHistory.create({
            data: {
                userId,
                query: JSON.stringify(searchParams),
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error('Failed to save search history:', error);
    }
}

export default router; 