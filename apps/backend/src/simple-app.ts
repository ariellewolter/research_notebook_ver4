import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
    // For now, just add a mock user
    req.user = { userId: 'mock-user-id' };
    next();
};

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Electronic Lab Notebook API is running!' });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    // Simple mock authentication
    if (username === 'admin' && password === 'admin123') {
        res.json({
            success: true,
            token: 'mock-jwt-token',
            user: { id: 'mock-user-id', username: 'admin' }
        });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

// Cloud sync status
app.get('/api/cloud-sync/status', authenticateToken, (req, res) => {
    res.json({
        success: true,
        data: {
            connectedServices: [],
            lastSyncTime: null,
            syncEnabled: false,
            configured: false,
            isSyncing: false,
            hasErrors: false
        }
    });
});

// Zotero sync status
app.get('/api/zotero/sync/status', authenticateToken, (req, res) => {
    res.json({
        success: true,
        data: {
            configured: false,
            lastSyncTime: null,
            isSyncing: false,
            config: null
        }
    });
});

// Zotero background sync status
app.get('/api/zotero/sync/background/status', authenticateToken, (req, res) => {
    res.json({
        success: true,
        data: {
            active: false,
            intervalMinutes: null
        }
    });
});

// Basic notes API
app.get('/api/notes', authenticateToken, async (req, res) => {
    try {
        const notes = await prisma.note.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: notes });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch notes' });
    }
});

// Basic projects API
app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: projects });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch projects' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Simple server running on http://localhost:${PORT}`);
    console.log(`📚 Electronic Lab Notebook API ready!`);
    console.log(`📱 Environment: development`);
}); 