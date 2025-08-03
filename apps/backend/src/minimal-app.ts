import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

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

// Health endpoint
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

// Mock API endpoints to prevent frontend errors
app.get('/api/notes', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.get('/api/projects', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.get('/api/tasks', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.get('/api/experiments', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.get('/api/protocols', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.get('/api/recipes', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.get('/api/tables', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.get('/api/links', (req, res) => {
    res.json({ data: [], total: 0, page: 1, limit: 10 });
});

app.get('/api/analytics', (req, res) => {
    res.json({
        totalNotes: 0,
        totalProjects: 0,
        totalTasks: 0,
        totalExperiments: 0,
        recentActivity: []
    });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
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

// Catch-all for any other API routes
app.all('/api/*', (req, res) => {
    res.json({
        success: false,
        message: 'API endpoint not implemented in minimal mode',
        endpoint: req.path
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Minimal backend server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🏠 Root endpoint: http://localhost:${PORT}/`);
});

export default app; 