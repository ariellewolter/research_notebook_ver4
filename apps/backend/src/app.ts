import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import notesRoutes from './routes/notes';
import projectsRoutes from './routes/projects';
import pdfsRoutes from './routes/pdfs';
import databaseRoutes from './routes/database';
import tasksRoutes from './routes/tasks';
import linksRoutes from './routes/links';
import zoteroRoutes from './routes/zotero';
import tablesRoutes from './routes/tables';
import protocolsRoutes from './routes/protocols';
import recipesRoutes from './routes/recipes';
import literatureNotesRouter from './routes/literatureNotes';
import taskTemplatesRoutes from './routes/taskTemplates';
import taskDependenciesRoutes from './routes/taskDependencies';
import taskFlowManagementRoutes from './routes/taskFlowManagement';
import notificationsRoutes from './routes/notifications';
import importExportRoutes from './routes/importExport';
import searchRoutes from './routes/search';
import analyticsRoutes from './routes/analytics';
import calendarRoutes from './routes/calendar';
import experimentalVariablesRoutes from './routes/experimentalVariables';
import advancedReportingRoutes from './routes/advancedReporting';

const app = express();
const PORT = process.env.PORT || 4000;

// Simple in-memory cache for performance optimization
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache middleware
const cacheMiddleware = (duration: number = CACHE_TTL) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        // Skip cache for non-GET requests or authenticated requests
        if (req.method !== 'GET' || req.headers.authorization) {
            return next();
        }

        const key = `${req.originalUrl}`;
        const cached = cache.get(key);

        if (cached && Date.now() - cached.timestamp < duration) {
            return res.json(cached.data);
        }

        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function (data) {
            cache.set(key, {
                data,
                timestamp: Date.now()
            });
            return originalJson.call(this, data);
        };

        next();
    };
};

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

// API Routes with caching for read-only endpoints
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/import-export', importExportRoutes);
app.use('/api/search', cacheMiddleware(2 * 60 * 1000), searchRoutes); // 2 min cache
app.use('/api/analytics', cacheMiddleware(5 * 60 * 1000), analyticsRoutes); // 5 min cache
app.use('/api/calendar', calendarRoutes);
app.use('/api/experimental-variables', experimentalVariablesRoutes);
app.use('/api/advanced-reporting', advancedReportingRoutes);

app.use('/api/notes', cacheMiddleware(1 * 60 * 1000), notesRoutes); // 1 min cache
app.use('/api/projects', cacheMiddleware(2 * 60 * 1000), projectsRoutes); // 2 min cache
app.use('/api/pdfs', pdfsRoutes);
app.use('/api/database', cacheMiddleware(2 * 60 * 1000), databaseRoutes); // 2 min cache
app.use('/api/tasks', cacheMiddleware(30 * 1000), tasksRoutes); // 30 sec cache
app.use('/api/links', cacheMiddleware(1 * 60 * 1000), linksRoutes); // 1 min cache
app.use('/api/zotero', zoteroRoutes);
app.use('/api/tables', cacheMiddleware(2 * 60 * 1000), tablesRoutes); // 2 min cache
app.use('/api/protocols', cacheMiddleware(2 * 60 * 1000), protocolsRoutes); // 2 min cache
app.use('/api/recipes', cacheMiddleware(2 * 60 * 1000), recipesRoutes); // 2 min cache
app.use('/api/literature-notes', cacheMiddleware(1 * 60 * 1000), literatureNotesRouter); // 1 min cache
app.use('/api/task-templates', cacheMiddleware(5 * 60 * 1000), taskTemplatesRoutes); // 5 min cache
app.use('/api/task-dependencies', cacheMiddleware(1 * 60 * 1000), taskDependenciesRoutes); // 1 min cache
app.use('/api/task-flow-management', taskFlowManagementRoutes);
app.use('/api/notifications', notificationsRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Electronic Lab Notebook API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            importExport: '/api/import-export',
            search: '/api/search',
            analytics: '/api/analytics',
            health: '/api/health',
            notes: '/api/notes',
            projects: '/api/projects',
            pdfs: '/api/pdfs',
            database: '/api/database',
            links: '/api/links',
            zotero: '/api/zotero',
            tables: '/api/tables',
            protocols: '/api/protocols',
            recipes: '/api/recipes',
            notifications: '/api/notifications',
            taskDependencies: '/api/task-dependencies',
        },
        performance: {
            caching: 'Enabled for read-only endpoints',
            indexes: 'Added for frequently queried fields',
            optimization: 'Query optimization implemented'
        }
    });
});

// Cache management endpoint
app.post('/api/cache/clear', (req, res) => {
    const cleared = cache.size;
    cache.clear();
    res.json({
        message: 'Cache cleared successfully',
        clearedEntries: cleared
    });
});

app.get('/api/cache/stats', (req, res) => {
    res.json({
        cacheSize: cache.size,
        cacheEntries: Array.from(cache.keys())
    });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);

    // Handle different types of errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message,
            details: err.details || []
        });
    }

    if (err.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            error: 'Database Error',
            message: 'Invalid request to database',
            code: err.code
        });
    }

    if (err.name === 'PrismaClientUnknownRequestError') {
        return res.status(500).json({
            error: 'Database Error',
            message: 'Unknown database error occurred'
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required'
        });
    }

    // Default error response
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 Electronic Lab Notebook API ready!`);
    console.log(`🔗 API Documentation: http://localhost:${PORT}/`);
});

export default app; 