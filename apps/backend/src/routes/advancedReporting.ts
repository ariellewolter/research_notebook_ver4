import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Zod schemas for validation
const reportTemplateSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    category: z.enum(['project', 'experiment', 'task', 'analytics', 'custom']),
    dataSources: z.array(z.string()),
    layout: z.object({
        sections: z.array(z.object({
            id: z.string(),
            type: z.enum(['chart', 'table', 'summary', 'text']),
            title: z.string(),
            config: z.record(z.any())
        }))
    }),
    filters: z.array(z.object({
        field: z.string(),
        type: z.enum(['date', 'text', 'select', 'number']),
        label: z.string(),
        required: z.boolean().default(false)
    })).optional()
});

const customReportSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    templateId: z.string().optional(),
    dataSources: z.array(z.string()),
    layout: z.object({
        sections: z.array(z.object({
            id: z.string(),
            type: z.enum(['chart', 'table', 'summary', 'text']),
            title: z.string(),
            config: z.record(z.any())
        }))
    }),
    filters: z.record(z.any()).optional(),
    schedule: z.object({
        enabled: z.boolean(),
        frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        time: z.string().optional(),
        recipients: z.array(z.string()).optional()
    }).optional()
});

const scheduledReportSchema = z.object({
    reportId: z.string(),
    schedule: z.object({
        frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        time: z.string(),
        recipients: z.array(z.string()),
        enabled: z.boolean().default(true)
    }),
    lastRun: z.date().optional(),
    nextRun: z.date().optional()
});

// Report Templates CRUD
router.get('/templates', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const templates = await prisma.reportTemplate.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(templates);
    } catch (error) {
        console.error('Error fetching report templates:', error);
        res.status(500).json({ error: 'Failed to fetch report templates' });
    }
});

router.post('/templates', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const data = reportTemplateSchema.parse(req.body);

        const template = await prisma.reportTemplate.create({
            data: {
                ...data,
                userId
            }
        });
        res.json(template);
    } catch (error) {
        console.error('Error creating report template:', error);
        res.status(500).json({ error: 'Failed to create report template' });
    }
});

router.put('/templates/:id', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const data = reportTemplateSchema.parse(req.body);

        const template = await prisma.reportTemplate.update({
            where: { id: parseInt(id), userId },
            data
        });
        res.json(template);
    } catch (error) {
        console.error('Error updating report template:', error);
        res.status(500).json({ error: 'Failed to update report template' });
    }
});

router.delete('/templates/:id', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        await prisma.reportTemplate.delete({
            where: { id: parseInt(id), userId }
        });
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting report template:', error);
        res.status(500).json({ error: 'Failed to delete report template' });
    }
});

// Custom Reports CRUD
router.get('/reports', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const reports = await prisma.customReport.findMany({
            where: { userId },
            include: { template: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reports);
    } catch (error) {
        console.error('Error fetching custom reports:', error);
        res.status(500).json({ error: 'Failed to fetch custom reports' });
    }
});

router.post('/reports', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const data = customReportSchema.parse(req.body);

        const report = await prisma.customReport.create({
            data: {
                ...data,
                userId,
                templateId: data.templateId ? parseInt(data.templateId) : null
            },
            include: { template: true }
        });
        res.json(report);
    } catch (error) {
        console.error('Error creating custom report:', error);
        res.status(500).json({ error: 'Failed to create custom report' });
    }
});

router.put('/reports/:id', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const data = customReportSchema.parse(req.body);

        const report = await prisma.customReport.update({
            where: { id: parseInt(id), userId },
            data: {
                ...data,
                templateId: data.templateId ? parseInt(data.templateId) : null
            },
            include: { template: true }
        });
        res.json(report);
    } catch (error) {
        console.error('Error updating custom report:', error);
        res.status(500).json({ error: 'Failed to update custom report' });
    }
});

router.delete('/reports/:id', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        await prisma.customReport.delete({
            where: { id: parseInt(id), userId }
        });
        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Error deleting custom report:', error);
        res.status(500).json({ error: 'Failed to delete custom report' });
    }
});

// Generate Report Data
router.post('/reports/:id/generate', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { filters, format } = req.body;

        const report = await prisma.customReport.findUnique({
            where: { id: parseInt(id), userId },
            include: { template: true }
        });

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Generate report data based on data sources and layout
        const reportData = await generateReportData(report, filters);

        // Store report execution
        await prisma.reportExecution.create({
            data: {
                reportId: parseInt(id),
                userId,
                filters: filters || {},
                format: format || 'json',
                status: 'completed',
                data: reportData
            }
        });

        res.json({ data: reportData, format });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Scheduled Reports
router.get('/scheduled', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const scheduled = await prisma.scheduledReport.findMany({
            where: { userId },
            include: { report: true },
            orderBy: { nextRun: 'asc' }
        });
        res.json(scheduled);
    } catch (error) {
        console.error('Error fetching scheduled reports:', error);
        res.status(500).json({ error: 'Failed to fetch scheduled reports' });
    }
});

router.post('/scheduled', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const data = scheduledReportSchema.parse(req.body);

        const scheduled = await prisma.scheduledReport.create({
            data: {
                ...data,
                userId,
                reportId: parseInt(data.reportId)
            },
            include: { report: true }
        });
        res.json(scheduled);
    } catch (error) {
        console.error('Error creating scheduled report:', error);
        res.status(500).json({ error: 'Failed to create scheduled report' });
    }
});

router.put('/scheduled/:id', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const data = scheduledReportSchema.parse(req.body);

        const scheduled = await prisma.scheduledReport.update({
            where: { id: parseInt(id), userId },
            data: {
                ...data,
                reportId: parseInt(data.reportId)
            },
            include: { report: true }
        });
        res.json(scheduled);
    } catch (error) {
        console.error('Error updating scheduled report:', error);
        res.status(500).json({ error: 'Failed to update scheduled report' });
    }
});

router.delete('/scheduled/:id', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        await prisma.scheduledReport.delete({
            where: { id: parseInt(id), userId }
        });
        res.json({ message: 'Scheduled report deleted successfully' });
    } catch (error) {
        console.error('Error deleting scheduled report:', error);
        res.status(500).json({ error: 'Failed to delete scheduled report' });
    }
});

// Report Analytics
router.get('/analytics', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { dateRange } = req.query;

        const analytics = await generateReportAnalytics(userId, dateRange);
        res.json(analytics);
    } catch (error) {
        console.error('Error fetching report analytics:', error);
        res.status(500).json({ error: 'Failed to fetch report analytics' });
    }
});

// Helper function to generate report data
async function generateReportData(report: any, filters: any) {
    const data: any = {};

    for (const dataSource of report.dataSources) {
        switch (dataSource) {
            case 'projects':
                data.projects = await prisma.project.findMany({
                    where: {
                        userId: report.userId,
                        ...(filters?.dateRange && {
                            createdAt: {
                                gte: new Date(filters.dateRange.start),
                                lte: new Date(filters.dateRange.end)
                            }
                        })
                    },
                    include: { experiments: true }
                });
                break;

            case 'experiments':
                data.experiments = await prisma.experiment.findMany({
                    where: {
                        userId: report.userId,
                        ...(filters?.dateRange && {
                            createdAt: {
                                gte: new Date(filters.dateRange.start),
                                lte: new Date(filters.dateRange.end)
                            }
                        })
                    },
                    include: { project: true }
                });
                break;

            case 'tasks':
                data.tasks = await prisma.task.findMany({
                    where: {
                        userId: report.userId,
                        ...(filters?.dateRange && {
                            createdAt: {
                                gte: new Date(filters.dateRange.start),
                                lte: new Date(filters.dateRange.end)
                            }
                        })
                    }
                });
                break;

            case 'analytics':
                data.analytics = await generateAnalyticsData(report.userId, filters);
                break;
        }
    }

    return data;
}

// Helper function to generate analytics data
async function generateAnalyticsData(userId: string, filters: any) {
    const dateFilter = filters?.dateRange ? {
        gte: new Date(filters.dateRange.start),
        lte: new Date(filters.dateRange.end)
    } : {};

    const [projects, experiments, tasks] = await Promise.all([
        prisma.project.count({ where: { userId, ...(dateFilter && { createdAt: dateFilter }) } }),
        prisma.experiment.count({ where: { userId, ...(dateFilter && { createdAt: dateFilter }) } }),
        prisma.task.count({ where: { userId, ...(dateFilter && { createdAt: dateFilter }) } })
    ]);

    return {
        summary: { projects, experiments, tasks },
        trends: await generateTrends(userId, dateFilter),
        distributions: await generateDistributions(userId, dateFilter)
    };
}

// Helper function to generate trends
async function generateTrends(userId: string, dateFilter: any) {
    // Generate mock trend data for now
    return {
        projects: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 10) + 1
        })),
        experiments: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 20) + 5
        })),
        tasks: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 50) + 10
        }))
    };
}

// Helper function to generate distributions
async function generateDistributions(userId: string, dateFilter: any) {
    return {
        projectStatus: [
            { status: 'Active', count: Math.floor(Math.random() * 20) + 10 },
            { status: 'Completed', count: Math.floor(Math.random() * 15) + 5 },
            { status: 'On Hold', count: Math.floor(Math.random() * 5) + 1 }
        ],
        taskPriority: [
            { priority: 'High', count: Math.floor(Math.random() * 20) + 10 },
            { priority: 'Medium', count: Math.floor(Math.random() * 30) + 15 },
            { priority: 'Low', count: Math.floor(Math.random() * 15) + 5 }
        ],
        experimentTypes: [
            { type: 'Research', count: Math.floor(Math.random() * 25) + 15 },
            { type: 'Development', count: Math.floor(Math.random() * 20) + 10 },
            { type: 'Testing', count: Math.floor(Math.random() * 15) + 5 }
        ]
    };
}

// Helper function to generate report analytics
async function generateReportAnalytics(userId: string, dateRange?: any) {
    const dateFilter = dateRange ? {
        gte: new Date(dateRange.start),
        lte: new Date(dateRange.end)
    } : {};

    const [totalReports, totalExecutions, popularReports] = await Promise.all([
        prisma.customReport.count({ where: { userId } }),
        prisma.reportExecution.count({
            where: {
                userId,
                ...(dateFilter && { createdAt: dateFilter })
            }
        }),
        prisma.reportExecution.groupBy({
            by: ['reportId'],
            where: {
                userId,
                ...(dateFilter && { createdAt: dateFilter })
            },
            _count: { reportId: true },
            orderBy: { _count: { reportId: 'desc' } },
            take: 5
        })
    ]);

    return {
        summary: {
            totalReports,
            totalExecutions,
            averageExecutionsPerReport: totalReports > 0 ? totalExecutions / totalReports : 0
        },
        popularReports,
        executionTrends: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 10) + 1
        }))
    };
}

export default router; 