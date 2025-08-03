import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';
import * as XLSX from 'xlsx';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Root import-export endpoint
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        res.json({
            message: 'Import/Export API',
            endpoints: {
                export: 'GET /export',
                exportExcel: 'GET /export/excel',
                import: 'POST /import'
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Import/Export service error' });
    }
});

// Export all user data
router.get('/export', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        // Get all user data
        const projects = await prisma.project.findMany({
            where: { userId },
            include: {
                experiments: {
                    include: {
                        notes: true
                    }
                }
            }
        });

        const notes = await prisma.note.findMany({
            where: {
                experiment: {
                    project: {
                        userId
                    }
                }
            }
        });

        const databaseEntries = await prisma.databaseEntry.findMany();
        const literatureNotes = await prisma.literatureNote.findMany();
        const protocols = await prisma.protocol.findMany();
        const recipes = await prisma.recipe.findMany();
        const tasks = await prisma.task.findMany({
            where: {
                project: {
                    userId
                }
            }
        });

        const exportData = {
            exportDate: new Date().toISOString(),
            user: {
                id: req.user.userId,
                username: req.user.username
            },
            data: {
                projects,
                notes,
                databaseEntries,
                literatureNotes,
                protocols,
                recipes,
                tasks
            }
        };

        res.json(exportData);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// Export as Excel file
router.get('/export/excel', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        // Get all user data
        const projects = await prisma.project.findMany({
            where: { userId },
            include: {
                experiments: {
                    include: {
                        notes: true
                    }
                }
            }
        });

        const notes = await prisma.note.findMany({
            where: {
                experiment: {
                    project: {
                        userId
                    }
                }
            }
        });

        const databaseEntries = await prisma.databaseEntry.findMany();
        const literatureNotes = await prisma.literatureNote.findMany();
        const protocols = await prisma.protocol.findMany();
        const recipes = await prisma.recipe.findMany();
        const tasks = await prisma.task.findMany({
            where: {
                project: {
                    userId
                }
            }
        });

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Add sheets
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(projects), 'Projects');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(notes), 'Notes');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(databaseEntries), 'Database');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(literatureNotes), 'Literature');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(protocols), 'Protocols');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(recipes), 'Recipes');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(tasks), 'Tasks');

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=research_notebook_export_${new Date().toISOString().split('T')[0]}.xlsx`);

        // Write to buffer and send
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);
    } catch (error) {
        console.error('Excel export error:', error);
        res.status(500).json({ error: 'Failed to export Excel file' });
    }
});

// Import data validation schemas
const importDataSchema = z.object({
    projects: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        status: z.enum(['active', 'archived', 'future']).default('active'),
        startDate: z.string().optional(),
        lastActivity: z.string().optional(),
        experiments: z.array(z.object({
            name: z.string(),
            description: z.string().optional(),
            notes: z.array(z.object({
                title: z.string(),
                content: z.string(),
                type: z.string(),
                date: z.string().optional()
            })).optional()
        })).optional()
    })).optional(),
    databaseEntries: z.array(z.object({
        name: z.string(),
        type: z.string(),
        description: z.string().optional(),
        properties: z.string().optional()
    })).optional(),
    literatureNotes: z.array(z.object({
        title: z.string(),
        authors: z.string().optional(),
        year: z.string().optional(),
        journal: z.string().optional(),
        doi: z.string().optional(),
        abstract: z.string().optional(),
        tags: z.string().optional(),
        citation: z.string().optional(),
        userNote: z.string().optional()
    })).optional()
});

// Import data
router.post('/import', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = importDataSchema.parse(req.body);

        const results = {
            projects: { created: 0, errors: [] as string[] },
            databaseEntries: { created: 0, errors: [] as string[] },
            literatureNotes: { created: 0, errors: [] as string[] }
        };

        // Import projects (simplified)
        if (validatedData.projects) {
            for (const projectData of validatedData.projects) {
                try {
                    await prisma.project.create({
                        data: {
                            name: projectData.name,
                            description: projectData.description,
                            status: projectData.status,
                            startDate: projectData.startDate ? new Date(projectData.startDate) : null,
                            lastActivity: projectData.lastActivity ? new Date(projectData.lastActivity) : null,
                            userId
                        }
                    });
                    results.projects.created++;
                } catch (error: any) {
                    results.projects.errors.push(`Project ${projectData.name}: ${error.message}`);
                }
            }
        }

        // Import database entries
        if (validatedData.databaseEntries) {
            for (const entryData of validatedData.databaseEntries) {
                try {
                    await prisma.databaseEntry.create({
                        data: entryData
                    });
                    results.databaseEntries.created++;
                } catch (error: any) {
                    results.databaseEntries.errors.push(`Entry ${entryData.name}: ${error.message}`);
                }
            }
        }

        // Import literature notes
        if (validatedData.literatureNotes) {
            for (const noteData of validatedData.literatureNotes) {
                try {
                    await prisma.literatureNote.create({
                        data: noteData
                    });
                    results.literatureNotes.created++;
                } catch (error: any) {
                    results.literatureNotes.errors.push(`Note ${noteData.title}: ${error.message}`);
                }
            }
        }

        res.json({
            message: 'Import completed',
            results
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Import error:', error);
        res.status(500).json({ error: 'Failed to import data' });
    }
});

// Import from Excel file
router.post('/import/excel', authenticateToken, async (req: any, res) => {
    try {
        // This would require multer for file upload
        // For now, we'll return a message about the endpoint
        res.json({ 
            message: 'Excel import endpoint ready',
            note: 'File upload implementation required'
        });
    } catch (error) {
        console.error('Excel import error:', error);
        res.status(500).json({ error: 'Failed to import Excel file' });
    }
});

// Backup database
router.get('/backup', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        // Get all user data for backup
        const userData = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true
            }
        });

        const projects = await prisma.project.findMany({
            where: { userId },
            include: {
                experiments: {
                    include: {
                        notes: true
                    }
                }
            }
        });

        const backup = {
            timestamp: new Date().toISOString(),
            user: userData,
            projects,
            version: '1.0.0'
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=backup_${userId}_${new Date().toISOString().split('T')[0]}.json`);
        res.json(backup);
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ error: 'Failed to create backup' });
    }
});

export default router; 