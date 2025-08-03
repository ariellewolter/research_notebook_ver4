import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Root advanced-reporting endpoint
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        res.json({
            message: 'Advanced Reporting API',
            endpoints: {
                templates: 'GET /templates',
                createTemplate: 'POST /templates',
                updateTemplate: 'PUT /templates/:id',
                deleteTemplate: 'DELETE /templates/:id',
                reports: 'GET /reports',
                createReport: 'POST /reports',
                updateReport: 'PUT /reports/:id',
                deleteReport: 'DELETE /reports/:id',
                generateReport: 'POST /reports/:id/generate',
                scheduled: 'GET /scheduled',
                createScheduled: 'POST /scheduled',
                updateScheduled: 'PUT /scheduled/:id',
                deleteScheduled: 'DELETE /scheduled/:id',
                analytics: 'GET /analytics'
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Advanced Reporting service error' });
    }
});

// Validation schemas
const reportTemplateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    category: z.enum(['project', 'experiment', 'task', 'analytics', 'custom']),
    dataSources: z.string(), // JSON array of data sources
    layout: z.string(), // JSON object for report layout
    filters: z.string().optional(), // JSON array of filter configurations
    isPublic: z.boolean().default(false)
});

const customReportSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    templateId: z.string().uuid().optional(),
    dataSources: z.string(), // JSON array of data sources
    layout: z.string(), // JSON object for report layout
    filters: z.string().optional(), // JSON object for applied filters
    schedule: z.string().optional(), // JSON object for scheduling configuration
    isActive: z.boolean().default(true)
});

const scheduledReportSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    reportId: z.string().uuid(),
    schedule: z.string().min(1, 'Schedule is required'), // Cron expression
    recipients: z.array(z.string().email()).optional(),
    enabled: z.boolean().default(true)
});

// Report Templates
router.get('/templates', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const templates = await prisma.reportTemplate.findMany({
            where: {
                OR: [
                    { userId },
                    { isPublic: true }
                ]
            },
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
        const validatedData = reportTemplateSchema.parse(req.body);

        const template = await prisma.reportTemplate.create({
            data: {
                ...validatedData,
                userId
            }
        });

        res.status(201).json(template);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
        } else {
            console.error('Error creating report template:', error);
            res.status(500).json({ error: 'Failed to create report template' });
        }
    }
});

router.put('/templates/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const validatedData = reportTemplateSchema.parse(req.body);

        const template = await prisma.reportTemplate.findFirst({
            where: { id, userId }
        });

        if (!template) {
            return res.status(404).json({ error: 'Report template not found' });
        }

        const updatedTemplate = await prisma.reportTemplate.update({
            where: { id },
            data: validatedData
        });

        res.json(updatedTemplate);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
        } else {
            console.error('Error updating report template:', error);
            res.status(500).json({ error: 'Failed to update report template' });
        }
    }
});

router.delete('/templates/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const template = await prisma.reportTemplate.findFirst({
            where: { id, userId }
        });

        if (!template) {
            return res.status(404).json({ error: 'Report template not found' });
        }

        await prisma.reportTemplate.delete({
            where: { id }
        });

        res.json({ message: 'Report template deleted successfully' });
    } catch (error) {
        console.error('Error deleting report template:', error);
        res.status(500).json({ error: 'Failed to delete report template' });
    }
});

// Custom Reports
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
        const validatedData = customReportSchema.parse(req.body);

        const report = await prisma.customReport.create({
            data: {
                ...validatedData,
                userId
            },
            include: { template: true }
        });

        res.status(201).json(report);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
        } else {
            console.error('Error creating custom report:', error);
            res.status(500).json({ error: 'Failed to create custom report' });
        }
    }
});

router.put('/reports/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const validatedData = customReportSchema.parse(req.body);

        const report = await prisma.customReport.findFirst({
            where: { id, userId }
        });

        if (!report) {
            return res.status(404).json({ error: 'Custom report not found' });
        }

        const updatedReport = await prisma.customReport.update({
            where: { id },
            data: validatedData,
            include: { template: true }
        });

        res.json(updatedReport);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
        } else {
            console.error('Error updating custom report:', error);
            res.status(500).json({ error: 'Failed to update custom report' });
        }
    }
});

router.delete('/reports/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const report = await prisma.customReport.findFirst({
            where: { id, userId }
        });

        if (!report) {
            return res.status(404).json({ error: 'Custom report not found' });
        }

        await prisma.customReport.delete({
            where: { id }
        });

        res.json({ message: 'Custom report deleted successfully' });
    } catch (error) {
        console.error('Error deleting custom report:', error);
        res.status(500).json({ error: 'Failed to delete custom report' });
    }
});

router.post('/reports/:id/generate', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const { filters, format } = req.body;

        const report = await prisma.customReport.findFirst({
            where: { id, userId },
            include: { template: true }
        });

        if (!report) {
            return res.status(404).json({ error: 'Custom report not found' });
        }

        // Create a report execution record
        const reportExecution = await prisma.reportExecution.create({
            data: {
                reportId: id,
                filters: filters ? JSON.stringify(filters) : '{}',
                format: format || 'pdf',
                status: 'completed',
                userId
            }
        });

        // Mock report generation - in a real implementation, this would generate the actual report
        const generatedReport = {
            id: reportExecution.id,
            name: report.name,
            format: format || 'pdf',
            generatedAt: new Date().toISOString(),
            downloadUrl: `/api/advanced-reporting/reports/${id}/download/${reportExecution.id}`,
            status: 'completed'
        };

        res.json(generatedReport);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Scheduled Reports
router.get('/scheduled', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const scheduledReports = await prisma.scheduledReport.findMany({
            where: { userId },
            include: { report: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(scheduledReports);
    } catch (error) {
        console.error('Error fetching scheduled reports:', error);
        res.status(500).json({ error: 'Failed to fetch scheduled reports' });
    }
});

router.post('/scheduled', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = scheduledReportSchema.parse(req.body);

        const scheduledReport = await prisma.scheduledReport.create({
            data: {
                ...validatedData,
                userId
            },
            include: { report: true }
        });

        res.status(201).json(scheduledReport);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
        } else {
            console.error('Error creating scheduled report:', error);
            res.status(500).json({ error: 'Failed to create scheduled report' });
        }
    }
});

router.put('/scheduled/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const validatedData = scheduledReportSchema.parse(req.body);

        const scheduledReport = await prisma.scheduledReport.findFirst({
            where: { id, userId }
        });

        if (!scheduledReport) {
            return res.status(404).json({ error: 'Scheduled report not found' });
        }

        const updatedScheduledReport = await prisma.scheduledReport.update({
            where: { id },
            data: validatedData,
            include: { report: true }
        });

        res.json(updatedScheduledReport);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
        } else {
            console.error('Error updating scheduled report:', error);
            res.status(500).json({ error: 'Failed to update scheduled report' });
        }
    }
});

router.delete('/scheduled/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const scheduledReport = await prisma.scheduledReport.findFirst({
            where: { id, userId }
        });

        if (!scheduledReport) {
            return res.status(404).json({ error: 'Scheduled report not found' });
        }

        await prisma.scheduledReport.delete({
            where: { id }
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

        // Mock analytics data - in a real implementation, this would calculate actual metrics
        const analytics = {
            totalReports: 0,
            reportsThisMonth: 0,
            mostPopularTemplate: null,
            averageGenerationTime: 0,
            topReportTypes: [],
            generationTrends: []
        };

        res.json(analytics);
    } catch (error) {
        console.error('Error fetching report analytics:', error);
        res.status(500).json({ error: 'Failed to fetch report analytics' });
    }
});

export default router; 