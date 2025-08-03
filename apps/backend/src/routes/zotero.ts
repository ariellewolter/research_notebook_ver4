import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import axios from 'axios';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Root zotero endpoint
router.get('/', async (req, res) => {
    try {
        res.json({
            message: 'Zotero API',
            endpoints: {
                config: 'POST /config',
                items: 'GET /items',
                collections: 'GET /collections',
                import: 'POST /import',
                search: 'GET /search'
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Zotero service error' });
    }
});

// Configure multer for PDF uploads from Zotero
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
        cb(null, 'zotero-' + uniqueSuffix + path.extname(file.originalname));
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
const zoteroConfigSchema = z.object({
    apiKey: z.string().min(1),
    userId: z.string().min(1),
    groupId: z.string().optional(),
});

const importItemSchema = z.object({
    zoteroKey: z.string().min(1),
    title: z.string().min(1),
    authors: z.array(z.string()).optional(),
    abstract: z.string().optional(),
    publicationYear: z.number().optional(),
    journal: z.string().optional(),
    doi: z.string().optional(),
    url: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

// Zotero API configuration
let zoteroConfig: {
    apiKey: string;
    userId: string;
    groupId?: string;
    baseUrl: string;
} | null = null;

// Configure Zotero API
router.post('/config', async (req, res) => {
    try {
        const validatedData = zoteroConfigSchema.parse(req.body);

        zoteroConfig = {
            ...validatedData,
            baseUrl: 'https://api.zotero.org'
        };

        // Test the configuration
        const testUrl = `${zoteroConfig.baseUrl}/users/${zoteroConfig.userId}/items?limit=1`;
        const response = await axios.get(testUrl, {
            headers: {
                'Zotero-API-Key': zoteroConfig.apiKey,
                'Zotero-API-Version': '3'
            }
        });

        res.json({
            message: 'Zotero configuration successful',
            itemsCount: response.headers['total-results'] || 0
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error configuring Zotero:', error);
        res.status(500).json({ error: 'Failed to configure Zotero API' });
    }
});

// Get Zotero library items
router.get('/items', async (req, res) => {
    try {
        if (!zoteroConfig) {
            return res.status(400).json({ error: 'Zotero not configured' });
        }

        const { limit = '50', start = '0', itemType = 'journalArticle' } = req.query;

        const url = `${zoteroConfig.baseUrl}/users/${zoteroConfig.userId}/items`;
        const params = new URLSearchParams({
            limit: limit as string,
            start: start as string,
            itemType: itemType as string,
            format: 'json'
        });

        const response = await axios.get(`${url}?${params}`, {
            headers: {
                'Zotero-API-Key': zoteroConfig.apiKey,
                'Zotero-API-Version': '3'
            }
        });

        res.json({
            items: response.data,
            total: response.headers['total-results'] || 0,
            start: parseInt(start as string),
            limit: parseInt(limit as string)
        });
    } catch (error) {
        console.error('Error fetching Zotero items:', error);
        res.status(500).json({ error: 'Failed to fetch Zotero items' });
    }
});

// Get a specific Zotero item
router.get('/items/:key', async (req, res) => {
    try {
        if (!zoteroConfig) {
            return res.status(400).json({ error: 'Zotero not configured' });
        }

        const { key } = req.params;

        const url = `${zoteroConfig.baseUrl}/users/${zoteroConfig.userId}/items/${key}`;
        const response = await axios.get(url, {
            headers: {
                'Zotero-API-Key': zoteroConfig.apiKey,
                'Zotero-API-Version': '3'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching Zotero item:', error);
        res.status(500).json({ error: 'Failed to fetch Zotero item' });
    }
});

// Import Zotero item as PDF with metadata
router.post('/import', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        const validatedData = importItemSchema.parse(req.body);

        // Create PDF entry
        const pdf = await prisma.pDF.create({
            data: {
                title: validatedData.title,
                filePath: req.file.path,
            }
        });

        // Create database entry for the reference
        const properties = JSON.stringify({
            zoteroKey: validatedData.zoteroKey,
            authors: validatedData.authors || [],
            abstract: validatedData.abstract,
            publicationYear: validatedData.publicationYear,
            journal: validatedData.journal,
            doi: validatedData.doi,
            url: validatedData.url,
            tags: validatedData.tags || [],
            importedFrom: 'zotero',
            importedAt: new Date().toISOString()
        });

        const databaseEntry = await prisma.databaseEntry.create({
            data: {
                type: 'REFERENCE',
                name: validatedData.title,
                description: validatedData.abstract,
                properties
            }
        });

        // Create link between PDF and reference
        await prisma.link.create({
            data: {
                sourceType: 'databaseEntry',
                sourceId: databaseEntry.id,
                targetType: 'highlight',
                targetId: pdf.id // Using PDF as target for now
            }
        });

        res.status(201).json({
            pdf,
            reference: databaseEntry,
            message: 'Successfully imported from Zotero'
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error importing from Zotero:', error);
        res.status(500).json({ error: 'Failed to import from Zotero' });
    }
});

// Search Zotero library
router.get('/search/:query', async (req, res) => {
    try {
        if (!zoteroConfig) {
            return res.status(400).json({ error: 'Zotero not configured' });
        }

        const { query } = req.params;
        const { limit = '20' } = req.query;

        const url = `${zoteroConfig.baseUrl}/users/${zoteroConfig.userId}/items`;
        const params = new URLSearchParams({
            q: query,
            limit: limit as string,
            format: 'json'
        });

        const response = await axios.get(`${url}?${params}`, {
            headers: {
                'Zotero-API-Key': zoteroConfig.apiKey,
                'Zotero-API-Version': '3'
            }
        });

        res.json({
            items: response.data,
            total: response.headers['total-results'] || 0,
            query
        });
    } catch (error) {
        console.error('Error searching Zotero:', error);
        res.status(500).json({ error: 'Failed to search Zotero' });
    }
});

// Get Zotero collections
router.get('/collections', async (req, res) => {
    try {
        if (!zoteroConfig) {
            return res.status(400).json({ error: 'Zotero not configured' });
        }

        const url = `${zoteroConfig.baseUrl}/users/${zoteroConfig.userId}/collections`;
        const response = await axios.get(url, {
            headers: {
                'Zotero-API-Key': zoteroConfig.apiKey,
                'Zotero-API-Version': '3'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching Zotero collections:', error);
        res.status(500).json({ error: 'Failed to fetch Zotero collections' });
    }
});

// Get items from a specific collection
router.get('/collections/:key/items', async (req, res) => {
    try {
        if (!zoteroConfig) {
            return res.status(400).json({ error: 'Zotero not configured' });
        }

        const { key } = req.params;
        const { limit = '50', start = '0' } = req.query;

        const url = `${zoteroConfig.baseUrl}/users/${zoteroConfig.userId}/collections/${key}/items`;
        const params = new URLSearchParams({
            limit: limit as string,
            start: start as string,
            format: 'json'
        });

        const response = await axios.get(`${url}?${params}`, {
            headers: {
                'Zotero-API-Key': zoteroConfig.apiKey,
                'Zotero-API-Version': '3'
            }
        });

        res.json({
            items: response.data,
            total: response.headers['total-results'] || 0,
            collectionKey: key
        });
    } catch (error) {
        console.error('Error fetching collection items:', error);
        res.status(500).json({ error: 'Failed to fetch collection items' });
    }
});

// Sync highlights from Zotero annotations
router.post('/sync-highlights/:pdfId', async (req, res) => {
    try {
        if (!zoteroConfig) {
            return res.status(400).json({ error: 'Zotero not configured' });
        }

        const { pdfId } = req.params;
        const { zoteroKey } = req.body;

        // Get Zotero item annotations
        const url = `${zoteroConfig.baseUrl}/users/${zoteroConfig.userId}/items/${zoteroKey}/children`;
        const response = await axios.get(url, {
            headers: {
                'Zotero-API-Key': zoteroConfig.apiKey,
                'Zotero-API-Version': '3'
            }
        });

        const annotations = response.data.filter((item: any) => item.data.itemType === 'annotation');

        // Create highlights for each annotation
        const highlights = [];
        for (const annotation of annotations) {
            const highlight = await prisma.highlight.create({
                data: {
                    pdfId,
                    page: annotation.data.pageIndex + 1, // Zotero uses 0-based indexing
                    text: annotation.data.text || '',
                    coords: JSON.stringify(annotation.data.rects || [])
                }
            });
            highlights.push(highlight);
        }

        res.json({
            message: `Synced ${highlights.length} highlights from Zotero`,
            highlights
        });
    } catch (error) {
        console.error('Error syncing highlights:', error);
        res.status(500).json({ error: 'Failed to sync highlights' });
    }
});

export default router; 