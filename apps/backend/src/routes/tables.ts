import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createTableSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    experimentId: z.string().optional(),
    columns: z.array(z.object({
        id: z.string(),
        name: z.string().min(1),
        type: z.enum(['text', 'number', 'date', 'boolean', 'select']),
        required: z.boolean().default(false),
        options: z.array(z.string()).optional(), // For select type
        defaultValue: z.any().optional(),
    })).optional(), // Made optional
});

const updateTableSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    columns: z.array(z.object({
        id: z.string(),
        name: z.string().min(1),
        type: z.enum(['text', 'number', 'date', 'boolean', 'select']),
        required: z.boolean().default(false),
        options: z.array(z.string()).optional(),
        defaultValue: z.any().optional(),
    })).optional(),
});

const createRowSchema = z.object({
    data: z.record(z.any()),
});

const updateRowSchema = z.object({
    data: z.record(z.any()),
});

// Get all tables
router.get('/', async (req, res) => {
    try {
        const { experimentId, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = {};
        if (experimentId) where.experimentId = experimentId;

        const tables = await prisma.table.findMany({
            where,
            include: {
                experiment: { select: { id: true, name: true } },
                rows: { orderBy: { rowNumber: 'asc' } },
                links: {
                    include: {
                        note: { select: { id: true, title: true } },
                        highlight: { select: { id: true, text: true, pdf: { select: { title: true } } } },
                        databaseEntry: { select: { id: true, name: true, type: true } },
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            skip,
            take: parseInt(limit as string),
        });

        const total = await prisma.table.count({ where });

        // Transform tables to include parsed columns and row data
        const transformedTables = tables.map(table => ({
            ...table,
            columns: JSON.parse(table.columns),
            rows: table.rows.map(row => ({
                ...row,
                data: JSON.parse(row.data),
            })),
        }));

        res.json({
            tables: transformedTables,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error) {
        console.error('Error fetching tables:', error);
        res.status(500).json({ error: 'Failed to fetch tables' });
    }
});

// Get a specific table
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const table = await prisma.table.findUnique({
            where: { id },
            include: {
                experiment: { select: { id: true, name: true } },
                rows: { orderBy: { rowNumber: 'asc' } },
                links: {
                    include: {
                        note: { select: { id: true, title: true } },
                        highlight: { select: { id: true, text: true, pdf: { select: { title: true } } } },
                        databaseEntry: { select: { id: true, name: true, type: true } },
                    }
                }
            }
        });

        if (!table) {
            return res.status(404).json({ error: 'Table not found' });
        }

        // Transform table to include parsed columns and row data
        const transformedTable = {
            ...table,
            columns: JSON.parse(table.columns),
            rows: table.rows.map(row => ({
                ...row,
                data: JSON.parse(row.data),
            })),
        };

        res.json(transformedTable);
    } catch (error) {
        console.error('Error fetching table:', error);
        res.status(500).json({ error: 'Failed to fetch table' });
    }
});

// Create a new table
router.post('/', async (req, res) => {
    try {
        const validatedData = createTableSchema.parse(req.body);

        const table = await prisma.table.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                experimentId: validatedData.experimentId,
                columns: JSON.stringify(validatedData.columns),
            },
            include: {
                experiment: { select: { id: true, name: true } },
                rows: true,
            }
        });

        // Transform response
        const transformedTable = {
            ...table,
            columns: JSON.parse(table.columns),
            rows: table.rows.map(row => ({
                ...row,
                data: JSON.parse(row.data),
            })),
        };

        res.status(201).json(transformedTable);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error creating table:', error);
        res.status(500).json({ error: 'Failed to create table' });
    }
});

// Update a table
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateTableSchema.parse(req.body);

        const updateData: any = {};
        if (validatedData.name) updateData.name = validatedData.name;
        if (validatedData.description !== undefined) updateData.description = validatedData.description;
        if (validatedData.columns) updateData.columns = JSON.stringify(validatedData.columns);

        const table = await prisma.table.update({
            where: { id },
            data: updateData,
            include: {
                experiment: { select: { id: true, name: true } },
                rows: { orderBy: { rowNumber: 'asc' } },
            }
        });

        // Transform response
        const transformedTable = {
            ...table,
            columns: JSON.parse(table.columns),
            rows: table.rows.map(row => ({
                ...row,
                data: JSON.parse(row.data),
            })),
        };

        res.json(transformedTable);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error updating table:', error);
        res.status(500).json({ error: 'Failed to update table' });
    }
});

// Delete a table
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Delete associated links first
        await prisma.link.deleteMany({
            where: {
                OR: [
                    { sourceId: id, sourceType: 'table' },
                    { targetId: id, targetType: 'table' }
                ]
            }
        });

        // Delete all rows first
        await prisma.tableRow.deleteMany({
            where: { tableId: id }
        });

        await prisma.table.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting table:', error);
        res.status(500).json({ error: 'Failed to delete table' });
    }
});

// Add a row to a table
router.post('/:id/rows', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = createRowSchema.parse(req.body);

        // Get the table to validate data against columns
        const table = await prisma.table.findUnique({
            where: { id }
        });

        if (!table) {
            return res.status(404).json({ error: 'Table not found' });
        }

        const columns = JSON.parse(table.columns);

        // Validate data against column definitions
        for (const column of columns) {
            if (column.required && !(column.id in validatedData.data)) {
                return res.status(400).json({
                    error: `Required column '${column.name}' is missing`
                });
            }
        }

        // Get the next row number
        const lastRow = await prisma.tableRow.findFirst({
            where: { tableId: id },
            orderBy: { rowNumber: 'desc' }
        });

        const rowNumber = lastRow ? lastRow.rowNumber + 1 : 1;

        const row = await prisma.tableRow.create({
            data: {
                tableId: id,
                data: JSON.stringify(validatedData.data),
                rowNumber,
            }
        });

        // Transform response
        const transformedRow = {
            ...row,
            data: JSON.parse(row.data),
        };

        res.status(201).json(transformedRow);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error creating table row:', error);
        res.status(500).json({ error: 'Failed to create table row' });
    }
});

// Update a table row
router.put('/:tableId/rows/:rowId', async (req, res) => {
    try {
        const { tableId, rowId } = req.params;
        const validatedData = updateRowSchema.parse(req.body);

        // Get the table to validate data against columns
        const table = await prisma.table.findUnique({
            where: { id: tableId }
        });

        if (!table) {
            return res.status(404).json({ error: 'Table not found' });
        }

        const columns = JSON.parse(table.columns);

        // Validate data against column definitions
        for (const column of columns) {
            if (column.required && !(column.id in validatedData.data)) {
                return res.status(400).json({
                    error: `Required column '${column.name}' is missing`
                });
            }
        }

        const row = await prisma.tableRow.update({
            where: { id: rowId },
            data: {
                data: JSON.stringify(validatedData.data),
            }
        });

        // Transform response
        const transformedRow = {
            ...row,
            data: JSON.parse(row.data),
        };

        res.json(transformedRow);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error updating table row:', error);
        res.status(500).json({ error: 'Failed to update table row' });
    }
});

// Delete a table row
router.delete('/:tableId/rows/:rowId', async (req, res) => {
    try {
        const { rowId } = req.params;

        await prisma.tableRow.delete({
            where: { id: rowId }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting table row:', error);
        res.status(500).json({ error: 'Failed to delete table row' });
    }
});

// Bulk operations for rows
router.post('/:id/rows/bulk', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = req.body;

        if (!Array.isArray(rows)) {
            return res.status(400).json({ error: 'Rows must be an array' });
        }

        // Get the table to validate data against columns
        const table = await prisma.table.findUnique({
            where: { id }
        });

        if (!table) {
            return res.status(404).json({ error: 'Table not found' });
        }

        const columns = JSON.parse(table.columns);

        // Get the next row number
        const lastRow = await prisma.tableRow.findFirst({
            where: { tableId: id },
            orderBy: { rowNumber: 'desc' }
        });

        let nextRowNumber = lastRow ? lastRow.rowNumber + 1 : 1;

        const createdRows = [];
        for (const rowData of rows) {
            // Validate data against column definitions
            for (const column of columns) {
                if (column.required && !(column.id in rowData)) {
                    return res.status(400).json({
                        error: `Required column '${column.name}' is missing in row ${nextRowNumber}`
                    });
                }
            }

            const row = await prisma.tableRow.create({
                data: {
                    tableId: id,
                    data: JSON.stringify(rowData),
                    rowNumber: nextRowNumber,
                }
            });

            createdRows.push({
                ...row,
                data: JSON.parse(row.data),
            });

            nextRowNumber++;
        }

        res.status(201).json({ rows: createdRows });
    } catch (error) {
        console.error('Error creating bulk table rows:', error);
        res.status(500).json({ error: 'Failed to create bulk table rows' });
    }
});

// Search tables
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const { experimentId } = req.query;

        const where: any = {
            OR: [
                { name: { contains: query } },
                { description: { contains: query } },
            ]
        };

        if (experimentId) {
            where.experimentId = experimentId;
        }

        const tables = await prisma.table.findMany({
            where,
            include: {
                experiment: { select: { id: true, name: true } },
                rows: { orderBy: { rowNumber: 'asc' } },
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Transform tables
        const transformedTables = tables.map(table => ({
            ...table,
            columns: JSON.parse(table.columns),
            rows: table.rows.map(row => ({
                ...row,
                data: JSON.parse(row.data),
            })),
        }));

        res.json({ tables: transformedTables });
    } catch (error) {
        console.error('Error searching tables:', error);
        res.status(500).json({ error: 'Failed to search tables' });
    }
});

// Get table statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const totalTables = await prisma.table.count();

        const tablesByExperiment = await prisma.table.groupBy({
            by: ['experimentId'],
            _count: {
                experimentId: true
            }
        });

        const recentTables = await prisma.table.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 5,
            include: {
                experiment: { select: { id: true, name: true } },
                rows: { select: { id: true } }
            }
        });

        const stats = {
            total: totalTables,
            byExperiment: tablesByExperiment.reduce((acc, item) => {
                acc[item.experimentId || 'unassigned'] = item._count.experimentId;
                return acc;
            }, {} as Record<string, number>),
            recent: recentTables.map(table => ({
                id: table.id,
                name: table.name,
                experimentName: table.experiment?.name || 'Unassigned',
                rowCount: table.rows.length,
                updatedAt: table.updatedAt,
            })),
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching table statistics:', error);
        res.status(500).json({ error: 'Failed to fetch table statistics' });
    }
});

export default router; 