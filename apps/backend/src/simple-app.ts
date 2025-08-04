import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
    origin: [/^http:\/\/localhost:\d+$/],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Simple health endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Electronic Lab Notebook API',
        version: '1.0.0',
        status: 'running'
    });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
    console.log('Login attempt:', req.body);
    res.json({
        success: true,
        message: 'Login successful (mock)',
        token: 'mock-jwt-token',
        user: {
            id: '1',
            email: req.body.email || 'user@example.com',
            name: 'Mock User'
        }
    });
});

app.post('/api/auth/register', (req, res) => {
    console.log('Register attempt:', req.body);
    res.json({
        success: true,
        message: 'Registration successful (mock)',
        token: 'mock-jwt-token',
        user: {
            id: '1',
            email: req.body.email || 'user@example.com',
            name: req.body.name || 'Mock User'
        }
    });
});

app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logout successful' });
});

app.get('/api/auth/me', (req, res) => {
    res.json({
        id: '1',
        email: 'user@example.com',
        name: 'Mock User'
    });
});

// Mock API endpoints to prevent frontend errors
app.get('/api/notes', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.post('/api/notes', (req, res) => {
    console.log('Creating note:', req.body);
    res.json({
        success: true,
        data: {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        }
    });
});

app.get('/api/projects', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.post('/api/projects', (req, res) => {
    console.log('Creating project:', req.body);
    res.json({
        success: true,
        data: {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        }
    });
});

app.get('/api/database', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.post('/api/database', (req, res) => {
    console.log('Creating database entry:', req.body);
    res.json({
        success: true,
        data: {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        }
    });
});

app.get('/api/tasks', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.post('/api/tasks', (req, res) => {
    console.log('Creating task:', req.body);
    res.json({
        success: true,
        data: {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        }
    });
});

app.get('/api/protocols', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.post('/api/protocols', (req, res) => {
    console.log('Creating protocol:', req.body);
    res.json({
        success: true,
        data: {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        }
    });
});

app.get('/api/recipes', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.post('/api/recipes', (req, res) => {
    console.log('Creating recipe:', req.body);
    res.json({
        success: true,
        data: {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        }
    });
});

app.get('/api/pdfs', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.post('/api/pdfs', (req, res) => {
    console.log('Creating PDF entry:', req.body);
    res.json({
        success: true,
        data: {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        }
    });
});

app.get('/api/literature-notes', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.post('/api/literature-notes', (req, res) => {
    console.log('Creating literature note:', req.body);
    res.json({
        success: true,
        data: {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        }
    });
});

app.get('/api/notifications', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.post('/api/notifications', (req, res) => {
    console.log('Creating notification:', req.body);
    res.json({
        success: true,
        data: {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        }
    });
});

app.get('/api/search/suggestions', (req, res) => {
    res.json({ suggestions: [] });
});

app.post('/api/search/advanced', (req, res) => {
    console.log('Advanced search:', req.body);
    res.json({ results: [], total: 0 });
});

// Additional endpoints that might be needed
app.get('/api/analytics', (req, res) => {
    res.json({
        totalProjects: 0,
        totalExperiments: 0,
        totalTasks: 0,
        recentActivity: []
    });
});

app.get('/api/calendar/events', (req, res) => {
    res.json({ events: [] });
});

app.get('/api/export/data', (req, res) => {
    res.json({ data: [], message: 'No data to export' });
});

app.get('/api/import/status', (req, res) => {
    res.json({ status: 'idle', progress: 0 });
});

app.get('/api/zotero/items', (req, res) => {
    res.json({ items: [] });
});

app.get('/api/zotero/collections', (req, res) => {
    res.json({ collections: [] });
});

// Catch-all for any other API routes
app.all('/api/*', (req, res) => {
    console.log(`API request to: ${req.method} ${req.path}`);
    res.status(404).json({
        error: 'Endpoint not implemented in simple backend',
        message: 'This endpoint is not available in the simple backend mode',
        path: req.path,
        method: req.method
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔧 Simple backend mode - limited API endpoints available`);
}); 