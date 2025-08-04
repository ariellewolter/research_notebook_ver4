import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import axios from 'axios';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { zoteroSyncService, ZoteroConfig } from '../services/zoteroSyncService';

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
                search: 'GET /search',
                sync: 'POST /sync',
                syncStatus: 'GET /sync/status',
                backgroundSync: 'POST /sync/background',
                backgroundSyncStatus: 'GET /sync/background/status'
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

const backgroundSyncSchema = z.object({
    enabled: z.boolean(),
    intervalMinutes: z.number().min(1).max(1440), // 1 minute to 24 hours
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
let zoteroConfig: ZoteroConfig | null = null;

// Configure Zotero API
router.post('/config', async (req, res) => {
    try {
        const validatedData = zoteroConfigSchema.parse(req.body);

        zoteroConfig = {
            ...validatedData,
            baseUrl: 'https://api.zotero.org'
        };

        // Update the sync service configuration
        zoteroSyncService.setConfig(zoteroConfig);

        // Test the configuration
        const testUrl = `${zoteroConfig.baseUrl}/users/${zoteroConfig.userId}/items?limit=1`;
        const response = await axios.get(testUrl, {
            headers: {
                'Zotero-API-Key': zoteroConfig.apiKey,
                'Zotero-API-Version': '3'
            }
        });

        res.json({
            message: 'Zotero configuration saved successfully',
            config: {
                userId: zoteroConfig.userId,
                hasGroupId: !!zoteroConfig.groupId,
                testSuccessful: true
            }
        });
    } catch (error) {
        console.error('Error configuring Zotero:', error);
        res.status(500).json({ error: 'Failed to configure Zotero' });
    }
});

// Get Zotero items
router.get('/items', async (req, res) => {
    try {
        if (!zoteroConfig) {
            return res.status(400).json({ error: 'Zotero not configured' });
        }

        const { limit = 50, offset = 0, collection } = req.query;
        let url = `${zoteroConfig.baseUrl}/users/${zoteroConfig.userId}/items`;

        if (collection) {
            url = `${zoteroConfig.baseUrl}/users/${zoteroConfig.userId}/collections/${collection}/items`;
        }

        const response = await axios.get(url, {
            headers: {
                'Zotero-API-Key': zoteroConfig.apiKey,
                'Zotero-API-Version': '3'
            },
            params: {
                limit,
                start: offset,
                format: 'json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching Zotero items:', error);
        res.status(500).json({ error: 'Failed to fetch Zotero items' });
    }
});

// Get specific Zotero item
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

// Import PDF with Zotero metadata
router.post('/import', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file provided' });
        }

        const validatedData = importItemSchema.parse(req.body);

        // Create database entry
        const properties = JSON.stringify({
            zoteroKey: validatedData.zoteroKey,
            title: validatedData.title,
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

        const entry = await prisma.databaseEntry.create({
            data: {
                type: 'REFERENCE',
                name: validatedData.title,
                description: validatedData.abstract,
                properties
            }
        });

        // Create PDF entry
        const pdf = await prisma.pDF.create({
            data: {
                title: validatedData.title,
                fileName: req.file.filename,
                filePath: req.file.path,
                fileSize: req.file.size,
                properties: JSON.stringify({
                    zoteroKey: validatedData.zoteroKey,
                    importedFrom: 'zotero'
                })
            }
        });

        res.json({
            message: 'PDF imported successfully with Zotero metadata',
            entry,
            pdf
        });
    } catch (error) {
        console.error('Error importing PDF:', error);
        res.status(500).json({ error: 'Failed to import PDF' });
    }
});

// Search Zotero items
router.get('/search/:query', async (req, res) => {
    try {
        if (!zoteroConfig) {
            return res.status(400).json({ error: 'Zotero not configured' });
        }

        const { query } = req.params;
        const { limit = 20 } = req.query;

        const url = `${zoteroConfig.baseUrl}/users/${zoteroConfig.userId}/items`;
        const response = await axios.get(url, {
            headers: {
                'Zotero-API-Key': zoteroConfig.apiKey,
                'Zotero-API-Version': '3'
            },
            params: {
                q: query,
                limit,
                format: 'json'
            }
        });

        res.json(response.data);
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
        const { limit = 50, offset = 0 } = req.query;

        const url = `${zoteroConfig.baseUrl}/users/${zoteroConfig.userId}/collections/${key}/items`;
        const response = await axios.get(url, {
            headers: {
                'Zotero-API-Key': zoteroConfig.apiKey,
                'Zotero-API-Version': '3'
            },
            params: {
                limit,
                start: offset,
                format: 'json'
            }
        });

        res.json(response.data);
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

        // Get PDF annotations from Zotero
        const url = `${zoteroConfig.baseUrl}/users/${zoteroConfig.userId}/items/${zoteroKey}/children`;
        const response = await axios.get(url, {
            headers: {
                'Zotero-API-Key': zoteroConfig.apiKey,
                'Zotero-API-Version': '3'
            }
        });

        const annotations = response.data.filter((item: any) => item.data.itemType === 'annotation');
        const highlights = [];

        for (const annotation of annotations) {
            const highlight = await prisma.highlight.create({
                data: {
                    pdfId,
                    page: annotation.data.pageIndex + 1,
                    text: annotation.data.text,
                    color: annotation.data.color || '#FFD700',
                    position: JSON.stringify(annotation.data.position),
                    properties: JSON.stringify({
                        zoteroKey: annotation.key,
                        importedFrom: 'zotero'
                    })
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

// Manual sync Zotero library
router.post('/sync', async (req, res) => {
    try {
        const result = await zoteroSyncService.performSync();
        
        if (result.success) {
            res.json({
                message: result.message,
                totalItems: result.totalItems,
                syncedCount: result.syncedCount,
                newItems: result.newItems,
                updatedItems: result.updatedItems,
                errors: result.errors
            });
        } else {
            res.status(400).json({
                error: result.message,
                errors: result.errors
            });
        }
    } catch (error) {
        console.error('Error syncing Zotero library:', error);
        res.status(500).json({ error: 'Failed to sync Zotero library' });
    }
});

// Get sync status
router.get('/sync/status', async (req, res) => {
    try {
        const config = zoteroSyncService.getConfig();
        const lastSyncTime = zoteroSyncService.getLastSyncTime();
        const isSyncing = zoteroSyncService.isSyncInProgress();

        res.json({
            configured: !!config,
            lastSyncTime: lastSyncTime?.toISOString(),
            isSyncing,
            config: config ? {
                userId: config.userId,
                hasGroupId: !!config.groupId
            } : null
        });
    } catch (error) {
        console.error('Error getting sync status:', error);
        res.status(500).json({ error: 'Failed to get sync status' });
    }
});

// Configure background sync
router.post('/sync/background', async (req, res) => {
    try {
        const validatedData = backgroundSyncSchema.parse(req.body);

        if (validatedData.enabled) {
            zoteroSyncService.startBackgroundSync(validatedData.intervalMinutes);
        } else {
            zoteroSyncService.stopBackgroundSync();
        }

        res.json({
            message: validatedData.enabled 
                ? `Background sync enabled with ${validatedData.intervalMinutes} minute interval`
                : 'Background sync disabled',
            enabled: validatedData.enabled,
            intervalMinutes: validatedData.enabled ? validatedData.intervalMinutes : null
        });
    } catch (error) {
        console.error('Error configuring background sync:', error);
        res.status(500).json({ error: 'Failed to configure background sync' });
    }
});

// Get background sync status
router.get('/sync/background/status', async (req, res) => {
    try {
        const isActive = zoteroSyncService.isBackgroundSyncActive();
        const interval = zoteroSyncService.getBackgroundSyncInterval();

        res.json({
            active: isActive,
            intervalMinutes: interval ? Math.round(interval / (60 * 1000)) : null
        });
    } catch (error) {
        console.error('Error getting background sync status:', error);
        res.status(500).json({ error: 'Failed to get background sync status' });
    }
});

// Import a specific Zotero item
router.post('/import-item/:key', async (req, res) => {
    try {
        if (!zoteroConfig) {
            return res.status(400).json({ error: 'Zotero not configured' });
        }

        const { key } = req.params;

        // Get the specific item from Zotero
        const url = `${zoteroConfig.baseUrl}/users/${zoteroConfig.userId}/items/${key}`;
        const response = await axios.get(url, {
            headers: {
                'Zotero-API-Key': zoteroConfig.apiKey,
                'Zotero-API-Version': '3'
            }
        });

        const item = response.data;

        // Check if item already exists
        const existingEntry = await prisma.databaseEntry.findFirst({
            where: {
                properties: {
                    contains: `"zoteroKey":"${key}"`
                }
            }
        });

        if (existingEntry) {
            return res.status(400).json({ error: 'Item already imported' });
        }

        // Create database entry
        const properties = JSON.stringify({
            zoteroKey: key,
            title: item.data.title,
            authors: item.data.creators?.map((creator: any) => `${creator.firstName} ${creator.lastName}`.trim()) || [],
            abstract: item.data.abstractNote,
            publicationYear: item.data.date ? new Date(item.data.date).getFullYear() : null,
            journal: item.data.publicationTitle,
            doi: item.data.DOI,
            url: item.data.url,
            tags: item.data.tags?.map((tag: any) => tag.tag) || [],
            itemType: item.data.itemType,
            importedFrom: 'zotero',
            importedAt: new Date().toISOString()
        });

        const entry = await prisma.databaseEntry.create({
            data: {
                type: 'REFERENCE',
                name: item.data.title,
                description: item.data.abstractNote,
                properties
            }
        });

        res.json({
            message: 'Zotero item imported successfully',
            entry
        });
    } catch (error) {
        console.error('Error importing Zotero item:', error);
        res.status(500).json({ error: 'Failed to import Zotero item' });
    }
});

export default router; 