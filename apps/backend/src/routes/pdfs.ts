import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Validation schemas
const createHighlightSchema = z.object({
    pdfId: z.string(),
    page: z.number().int().positive(),
    text: z.string().min(1),
    coords: z.string().optional(),
});

const updateHighlightSchema = z.object({
    text: z.string().min(1).optional(),
    coords: z.string().optional(),
});

// Get all PDFs
router.get('/', async (req, res) => {
    try {
        const { page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const pdfs = await prisma.pDF.findMany({
            include: {
                highlights: {
                    orderBy: { page: 'asc' }
                }
            },
            orderBy: { uploadedAt: 'desc' },
            skip,
            take: parseInt(limit as string),
        });

        const total = await prisma.pDF.count();

        res.json({
            pdfs,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error) {
        console.error('Error fetching PDFs:', error);
        res.status(500).json({ error: 'Failed to fetch PDFs' });
    }
});

// Get a specific PDF
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const pdf = await prisma.pDF.findUnique({
            where: { id },
            include: {
                highlights: {
                    orderBy: { page: 'asc' }
                }
            }
        });

        if (!pdf) {
            return res.status(404).json({ error: 'PDF not found' });
        }

        res.json(pdf);
    } catch (error) {
        console.error('Error fetching PDF:', error);
        res.status(500).json({ error: 'Failed to fetch PDF' });
    }
});

// Upload a new PDF
router.post('/', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const pdf = await prisma.pDF.create({
            data: {
                title,
                filePath: req.file.path,
            }
        });

        res.status(201).json(pdf);
    } catch (error) {
        console.error('Error uploading PDF:', error);
        res.status(500).json({ error: 'Failed to upload PDF' });
    }
});

// Delete a PDF
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const pdf = await prisma.pDF.findUnique({
            where: { id },
            include: { highlights: true }
        });

        if (!pdf) {
            return res.status(404).json({ error: 'PDF not found' });
        }

        // Delete associated highlights first
        await prisma.highlight.deleteMany({
            where: { pdfId: id }
        });

        // Delete the file from disk
        if (fs.existsSync(pdf.filePath)) {
            fs.unlinkSync(pdf.filePath);
        }

        await prisma.pDF.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting PDF:', error);
        res.status(500).json({ error: 'Failed to delete PDF' });
    }
});

// Get all highlights for a PDF
router.get('/:pdfId/highlights', async (req, res) => {
    try {
        const { pdfId } = req.params;

        const highlights = await prisma.highlight.findMany({
            where: { pdfId },
            orderBy: { page: 'asc' }
        });

        res.json(highlights);
    } catch (error) {
        console.error('Error fetching highlights:', error);
        res.status(500).json({ error: 'Failed to fetch highlights' });
    }
});

// Create a new highlight
router.post('/:pdfId/highlights', async (req, res) => {
    try {
        const { pdfId } = req.params;
        const validatedData = createHighlightSchema.parse({ ...req.body, pdfId });

        const highlight = await prisma.highlight.create({
            data: validatedData,
            include: {
                pdf: { select: { id: true, title: true } }
            }
        });

        res.status(201).json(highlight);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error creating highlight:', error);
        res.status(500).json({ error: 'Failed to create highlight' });
    }
});

// Update a highlight
router.put('/highlights/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateHighlightSchema.parse(req.body);

        const highlight = await prisma.highlight.update({
            where: { id },
            data: validatedData,
            include: {
                pdf: { select: { id: true, title: true } }
            }
        });

        res.json(highlight);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error updating highlight:', error);
        res.status(500).json({ error: 'Failed to update highlight' });
    }
});

// Delete a highlight
router.delete('/highlights/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.highlight.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting highlight:', error);
        res.status(500).json({ error: 'Failed to delete highlight' });
    }
});

// Serve PDF file
router.get('/:id/file', async (req, res) => {
    try {
        const { id } = req.params;

        const pdf = await prisma.pDF.findUnique({
            where: { id }
        });

        if (!pdf) {
            return res.status(404).json({ error: 'PDF not found' });
        }

        if (!fs.existsSync(pdf.filePath)) {
            return res.status(404).json({ error: 'PDF file not found on disk' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${pdf.title}.pdf"`);

        const fileStream = fs.createReadStream(pdf.filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error serving PDF file:', error);
        res.status(500).json({ error: 'Failed to serve PDF file' });
    }
});

export default router; 