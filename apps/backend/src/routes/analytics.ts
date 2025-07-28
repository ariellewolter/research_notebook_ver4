import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Analytics validation schemas
const dateRangeSchema = z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
});

const projectFilterSchema = z.object({
    projectIds: z.array(z.string()).optional(),
    dateRange: dateRangeSchema.optional()
});

// Get experiment success rate analytics
router.post('/experiment-success', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const filters = projectFilterSchema.parse(req.body);

        const whereClause: any = {
            project: { userId }
        };

        if (filters.projectIds && filters.projectIds.length > 0) {
            whereClause.projectId = { in: filters.projectIds };
        }

        if (filters.dateRange) {
            whereClause.createdAt = {
                gte: new Date(filters.dateRange.startDate),
                lte: new Date(filters.dateRange.endDate)
            };
        }

        const experiments = await prisma.experiment.findMany({
            where: whereClause,
            include: {
                project: true,
                notes: {
                    where: { type: 'result' }
                }
            }
        });

        // Analyze success rates
        const totalExperiments = experiments.length;
        const successfulExperiments = experiments.filter(exp => {
            const resultNotes = exp.notes.filter(note => 
                note.content.toLowerCase().includes('success') || 
                note.content.toLowerCase().includes('positive') ||
                note.content.toLowerCase().includes('working')
            );
            return resultNotes.length > 0;
        }).length;

        const failedExperiments = experiments.filter(exp => {
            const resultNotes = exp.notes.filter(note => 
                note.content.toLowerCase().includes('fail') || 
                note.content.toLowerCase().includes('negative') ||
                note.content.toLowerCase().includes('error')
            );
            return resultNotes.length > 0;
        }).length;

        const successRate = totalExperiments > 0 ? (successfulExperiments / totalExperiments) * 100 : 0;
        const failureRate = totalExperiments > 0 ? (failedExperiments / totalExperiments) * 100 : 0;
        const inconclusiveRate = totalExperiments > 0 ? ((totalExperiments - successfulExperiments - failedExperiments) / totalExperiments) * 100 : 0;

        // Success rate by project
        const projectSuccessRates = await Promise.all(
            Array.from(new Set(experiments.map(exp => exp.projectId))).map(async (projectId) => {
                const projectExperiments = experiments.filter(exp => exp.projectId === projectId);
                const project = projectExperiments[0]?.project;
                
                const projectSuccessful = projectExperiments.filter(exp => {
                    const resultNotes = exp.notes.filter(note => 
                        note.content.toLowerCase().includes('success') || 
                        note.content.toLowerCase().includes('positive')
                    );
                    return resultNotes.length > 0;
                }).length;

                return {
                    projectId,
                    projectName: project?.name || 'Unknown',
                    totalExperiments: projectExperiments.length,
                    successfulExperiments: projectSuccessful,
                    successRate: projectExperiments.length > 0 ? (projectSuccessful / projectExperiments.length) * 100 : 0
                };
            })
        );

        // Monthly trends
        const monthlyData = experiments.reduce((acc: any, exp) => {
            const month = exp.createdAt.toISOString().substring(0, 7); // YYYY-MM
            if (!acc[month]) {
                acc[month] = { total: 0, successful: 0, failed: 0 };
            }
            acc[month].total++;
            
            const hasSuccess = exp.notes.some(note => 
                note.content.toLowerCase().includes('success') || 
                note.content.toLowerCase().includes('positive')
            );
            const hasFailure = exp.notes.some(note => 
                note.content.toLowerCase().includes('fail') || 
                note.content.toLowerCase().includes('negative')
            );
            
            if (hasSuccess) acc[month].successful++;
            if (hasFailure) acc[month].failed++;
            
            return acc;
        }, {});

        const monthlyTrends = Object.entries(monthlyData).map(([month, data]: [string, any]) => ({
            month,
            total: data.total,
            successful: data.successful,
            failed: data.failed,
            successRate: data.total > 0 ? (data.successful / data.total) * 100 : 0
        })).sort((a, b) => a.month.localeCompare(b.month));

        res.json({
            summary: {
                totalExperiments,
                successfulExperiments,
                failedExperiments,
                inconclusiveExperiments: totalExperiments - successfulExperiments - failedExperiments,
                successRate: Math.round(successRate * 100) / 100,
                failureRate: Math.round(failureRate * 100) / 100,
                inconclusiveRate: Math.round(inconclusiveRate * 100) / 100
            },
            byProject: projectSuccessRates,
            monthlyTrends
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Experiment success analytics error:', error);
        res.status(500).json({ error: 'Failed to get experiment success analytics' });
    }
});

// Get time tracking and productivity metrics
router.post('/productivity', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const filters = projectFilterSchema.parse(req.body);

        const whereClause: any = {
            project: { userId }
        };

        if (filters.projectIds && filters.projectIds.length > 0) {
            whereClause.projectId = { in: filters.projectIds };
        }

        if (filters.dateRange) {
            whereClause.createdAt = {
                gte: new Date(filters.dateRange.startDate),
                lte: new Date(filters.dateRange.endDate)
            };
        }

        // Get all activities (experiments, notes, tasks)
        const experiments = await prisma.experiment.findMany({
            where: whereClause,
            include: {
                project: true,
                notes: true
            }
        });

        const tasks = await prisma.task.findMany({
            where: {
                project: { userId },
                ...(filters.projectIds && filters.projectIds.length > 0 && { projectId: { in: filters.projectIds } }),
                ...(filters.dateRange && {
                    createdAt: {
                        gte: new Date(filters.dateRange.startDate),
                        lte: new Date(filters.dateRange.endDate)
                    }
                })
            },
            include: {
                project: true
            }
        });

        // Calculate productivity metrics
        const totalActivities = experiments.length + tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
        const pendingTasks = tasks.filter(task => task.status === 'pending').length;

        // Activity frequency by day of week
        const dayOfWeekActivity = experiments.reduce((acc: any, exp) => {
            const day = exp.createdAt.toLocaleDateString('en-US', { weekday: 'long' });
            acc[day] = (acc[day] || 0) + 1;
            return acc;
        }, {});

        // Most active hours
        const hourlyActivity = experiments.reduce((acc: any, exp) => {
            const hour = exp.createdAt.getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {});

        // Project activity distribution
        const projectActivity = experiments.reduce((acc: any, exp) => {
            const projectName = exp.project.name;
            acc[projectName] = (acc[projectName] || 0) + 1;
            return acc;
        }, {});

        // Note creation frequency (as a proxy for documentation productivity)
        const totalNotes = experiments.reduce((sum, exp) => sum + exp.notes.length, 0);
        const avgNotesPerExperiment = experiments.length > 0 ? totalNotes / experiments.length : 0;

        // Task completion rate
        const taskCompletionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

        // Weekly productivity trends
        const weeklyData = experiments.reduce((acc: any, exp) => {
            const week = getWeekNumber(exp.createdAt);
            if (!acc[week]) {
                acc[week] = { experiments: 0, notes: 0 };
            }
            acc[week].experiments++;
            acc[week].notes += exp.notes.length;
            return acc;
        }, {});

        const weeklyTrends = Object.entries(weeklyData).map(([week, data]: [string, any]) => ({
            week,
            experiments: data.experiments,
            notes: data.notes,
            avgNotesPerExperiment: data.experiments > 0 ? data.notes / data.experiments : 0
        })).sort((a, b) => parseInt(a.week) - parseInt(b.week));

        res.json({
            summary: {
                totalActivities,
                totalExperiments: experiments.length,
                totalTasks: tasks.length,
                completedTasks,
                inProgressTasks,
                pendingTasks,
                taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
                totalNotes,
                avgNotesPerExperiment: Math.round(avgNotesPerExperiment * 100) / 100
            },
            activityPatterns: {
                byDayOfWeek: dayOfWeekActivity,
                byHour: hourlyActivity,
                byProject: projectActivity
            },
            weeklyTrends
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Productivity analytics error:', error);
        res.status(500).json({ error: 'Failed to get productivity analytics' });
    }
});

// Get resource usage analytics
router.post('/resource-usage', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const filters = projectFilterSchema.parse(req.body);

        // Get database entries (resources)
        const databaseEntries = await prisma.databaseEntry.findMany({
            where: {
                ...(filters.dateRange && {
                    createdAt: {
                        gte: new Date(filters.dateRange.startDate),
                        lte: new Date(filters.dateRange.endDate)
                    }
                })
            }
        });

        // Get protocols and recipes (methodologies)
        const protocols = await prisma.protocol.findMany({
            where: {
                ...(filters.dateRange && {
                    createdAt: {
                        gte: new Date(filters.dateRange.startDate),
                        lte: new Date(filters.dateRange.endDate)
                    }
                })
            }
        });

        const recipes = await prisma.recipe.findMany({
            where: {
                ...(filters.dateRange && {
                    createdAt: {
                        gte: new Date(filters.dateRange.startDate),
                        lte: new Date(filters.dateRange.endDate)
                    }
                })
            }
        });

        // Analyze resource usage by type
        const resourceUsageByType = databaseEntries.reduce((acc: any, entry) => {
            acc[entry.type] = (acc[entry.type] || 0) + 1;
            return acc;
        }, {});

        // Most used resources
        const resourceUsage = databaseEntries.reduce((acc: any, entry) => {
            acc[entry.name] = (acc[entry.name] || 0) + 1;
            return acc;
        }, {});

        const topResources = Object.entries(resourceUsage)
            .sort(([,a]: any, [,b]: any) => b - a)
            .slice(0, 10)
            .map(([name, count]) => ({ name, usageCount: count }));

        // Protocol and recipe usage
        const methodologyUsage = {
            protocols: protocols.length,
            recipes: recipes.length,
            total: protocols.length + recipes.length
        };

        // Resource categories
        const resourceCategories = Object.keys(resourceUsageByType).map(type => ({
            type,
            count: resourceUsageByType[type]
        }));

        // Monthly resource acquisition
        const monthlyResourceData = databaseEntries.reduce((acc: any, entry) => {
            const month = entry.createdAt.toISOString().substring(0, 7);
            if (!acc[month]) {
                acc[month] = { total: 0, byType: {} };
            }
            acc[month].total++;
            acc[month].byType[entry.type] = (acc[month].byType[entry.type] || 0) + 1;
            return acc;
        }, {});

        const monthlyResourceTrends = Object.entries(monthlyResourceData).map(([month, data]: [string, any]) => ({
            month,
            total: data.total,
            byType: data.byType
        })).sort((a, b) => a.month.localeCompare(b.month));

        res.json({
            summary: {
                totalResources: databaseEntries.length,
                totalProtocols: protocols.length,
                totalRecipes: recipes.length,
                uniqueResourceTypes: Object.keys(resourceUsageByType).length
            },
            resourceUsage: {
                byType: resourceCategories,
                topResources,
                monthlyTrends: monthlyResourceTrends
            },
            methodologyUsage
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Resource usage analytics error:', error);
        res.status(500).json({ error: 'Failed to get resource usage analytics' });
    }
});

// Get comprehensive dashboard analytics
router.get('/dashboard', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get recent activity
        const recentExperiments = await prisma.experiment.findMany({
            where: {
                project: { userId },
                createdAt: { gte: thirtyDaysAgo }
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
                createdAt: { gte: thirtyDaysAgo }
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

        const activeProjects = await prisma.project.count({
            where: { 
                userId,
                status: 'active'
            }
        });

        const totalExperiments = await prisma.experiment.count({
            where: {
                project: { userId }
            }
        });

        const pendingTasks = await prisma.task.count({
            where: {
                project: { userId },
                status: 'pending'
            }
        });

        const completedTasks = await prisma.task.count({
            where: {
                project: { userId },
                status: 'completed'
            }
        });

        const totalTasks = pendingTasks + completedTasks;

        // Recent notes
        const recentNotes = await prisma.note.findMany({
            where: {
                experiment: {
                    project: { userId }
                },
                createdAt: { gte: thirtyDaysAgo }
            },
            include: {
                experiment: {
                    include: {
                        project: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        res.json({
            quickStats: {
                totalProjects,
                activeProjects,
                totalExperiments,
                pendingTasks,
                completedTasks,
                taskCompletionRate: (totalTasks + completedTasks) > 0 ? 
                    Math.round((completedTasks / (pendingTasks + completedTasks)) * 100) : 0
            },
            recentActivity: {
                experiments: recentExperiments,
                tasks: recentTasks,
                notes: recentNotes
            }
        });
    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({ error: 'Failed to get dashboard analytics' });
    }
});

// Helper function to get week number
function getWeekNumber(date: Date): string {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

export default router; 