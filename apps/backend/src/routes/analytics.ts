import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Root analytics endpoint
router.get('/', async (req: any, res) => {
    try {
        res.json({
            message: 'Analytics API',
            endpoints: {
                dashboard: 'GET /dashboard',
                experimentSuccess: 'GET /experiment-success',
                productivity: 'GET /productivity',
                resourceUsage: 'GET /resource-usage'
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Analytics service error' });
    }
});

// Get basic dashboard analytics
router.get('/dashboard', async (req: any, res) => {
    try {
        const userId = req.user?.userId || 'default-user';
        const { dateRange, projects } = req.query;

        let dateFilter = {};
        if (dateRange && dateRange !== 'all') {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(dateRange as string));
            dateFilter = {
                createdAt: { gte: startDate, lte: endDate }
            };
        }

        let projectFilter = {};
        if (projects && projects.length > 0) {
            const projectIds = projects.split(',');
            projectFilter = {
                projectId: { in: projectIds }
            };
        }

        // Get recent activity
        const recentExperiments = await prisma.experiment.findMany({
            where: {
                project: { userId },
                ...dateFilter,
                ...projectFilter
            },
            include: {
                project: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const recentTasks = await prisma.task.findMany({
            where: {
                project: { userId },
                ...dateFilter,
                ...projectFilter
            },
            include: {
                project: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        // Quick stats
        const totalProjects = await prisma.project.count({
            where: { userId }
        });

        const totalExperiments = await prisma.experiment.count({
            where: {
                project: { userId },
                ...dateFilter,
                ...projectFilter
            }
        });

        const pendingTasks = await prisma.task.count({
            where: {
                project: { userId },
                status: 'pending',
                ...dateFilter,
                ...projectFilter
            }
        });

        const completedTasks = await prisma.task.count({
            where: {
                project: { userId },
                status: 'completed',
                ...dateFilter,
                ...projectFilter
            }
        });

        const totalTasks = pendingTasks + completedTasks;
        const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Basic productivity trends
        const productivityData = await generateBasicProductivityTrends(userId, dateRange as string, projectFilter);

        res.json({
            recentExperiments,
            recentTasks,
            stats: {
                totalProjects,
                totalExperiments,
                pendingTasks,
                completedTasks,
                taskCompletionRate
            },
            productivityTrends: productivityData
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Get experiment success analytics
router.get('/experiment-success', async (req: any, res) => {
    try {
        const userId = req.user?.userId || 'default-user';
        const { dateRange, projects } = req.query;

        let dateFilter = {};
        if (dateRange && dateRange !== 'all') {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(dateRange as string));
            dateFilter = {
                createdAt: { gte: startDate, lte: endDate }
            };
        }

        let projectFilter = {};
        if (projects && projects.length > 0) {
            const projectIds = projects.split(',');
            projectFilter = {
                projectId: { in: projectIds }
            };
        }

        const experiments = await prisma.experiment.findMany({
            where: {
                project: { userId },
                ...dateFilter,
                ...projectFilter
            },
            include: {
                project: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const successRate = experiments.length > 0 ? 75 : 0; // Placeholder
        const totalExperiments = experiments.length;

        res.json({
            successRate,
            totalExperiments,
            experiments: experiments.slice(0, 10) // Return first 10
        });
    } catch (error) {
        console.error('Experiment success analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch experiment success analytics' });
    }
});

// Get productivity analytics
router.get('/productivity', async (req: any, res) => {
    try {
        const userId = req.user?.userId || 'default-user';
        const { dateRange, projects } = req.query;

        let dateFilter = {};
        if (dateRange && dateRange !== 'all') {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(dateRange as string));
            dateFilter = {
                createdAt: { gte: startDate, lte: endDate }
            };
        }

        let projectFilter = {};
        if (projects && projects.length > 0) {
            const projectIds = projects.split(',');
            projectFilter = {
                projectId: { in: projectIds }
            };
        }

        const tasks = await prisma.task.findMany({
            where: {
                project: { userId },
                ...dateFilter,
                ...projectFilter
            },
            include: {
                project: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        const totalTasks = tasks.length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        res.json({
            completionRate,
            totalTasks,
            completedTasks,
            tasks: tasks.slice(0, 10) // Return first 10
        });
    } catch (error) {
        console.error('Productivity analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch productivity analytics' });
    }
});

// Get resource usage analytics
router.get('/resource-usage', async (req: any, res) => {
    try {
        const userId = req.user?.userId || 'default-user';

        const databaseEntries = await prisma.databaseEntry.count({
            where: { /* Add user filter if needed */ }
        });

        const totalProjects = await prisma.project.count({
            where: { userId }
        });

        const totalExperiments = await prisma.experiment.count({
            where: {
                project: { userId }
            }
        });

        res.json({
            databaseEntries,
            totalProjects,
            totalExperiments,
            usageBreakdown: {
                projects: totalProjects,
                experiments: totalExperiments,
                databaseEntries
            }
        });
    } catch (error) {
        console.error('Resource usage analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch resource usage analytics' });
    }
});

// Helper function for basic productivity trends
async function generateBasicProductivityTrends(userId: string, dateRange: string, projectFilter: any) {
    try {
        const endDate = new Date();
        const startDate = new Date();

        if (dateRange && dateRange !== 'all') {
            startDate.setDate(startDate.getDate() - parseInt(dateRange));
        } else {
            startDate.setDate(startDate.getDate() - 30); // Default to 30 days
        }

        const tasks = await prisma.task.findMany({
            where: {
                project: { userId },
                createdAt: { gte: startDate, lte: endDate },
                ...projectFilter
            },
            select: {
                createdAt: true,
                status: true
            }
        });

        // Group by day
        const dailyStats = new Map();
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            dailyStats.set(dateKey, { completed: 0, total: 0 });
        }

        tasks.forEach(task => {
            const dateKey = task.createdAt.toISOString().split('T')[0];
            const stats = dailyStats.get(dateKey) || { completed: 0, total: 0 };
            stats.total++;
            if (task.status === 'completed') {
                stats.completed++;
            }
            dailyStats.set(dateKey, stats);
        });

        return Array.from(dailyStats.entries()).map(([date, stats]) => ({
            date,
            completed: (stats as any).completed,
            total: (stats as any).total
        }));
    } catch (error) {
        console.error('Error generating productivity trends:', error);
        return [];
    }
}

export default router; 