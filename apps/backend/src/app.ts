import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health';
import notesRoutes from './routes/notes';
import projectsRoutes from './routes/projects';
import pdfsRoutes from './routes/pdfs';
import databaseRoutes from './routes/database';
import linksRoutes from './routes/links';
import zoteroRoutes from './routes/zotero';
import tablesRoutes from './routes/tables';
import protocolsRoutes from './routes/protocols';
import recipesRoutes from './routes/recipes';
import literatureNotesRouter from './routes/literatureNotes';
import tasksRoutes from './routes/tasks';

const app = express();
const PORT = process.env.PORT || 4000;

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

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/pdfs', pdfsRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/zotero', zoteroRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/protocols', protocolsRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/literature-notes', literatureNotesRouter);
app.use('/api/tasks', tasksRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Electronic Lab Notebook API',
        version: '1.0.0',
        endpoints: {
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
        },
    });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
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