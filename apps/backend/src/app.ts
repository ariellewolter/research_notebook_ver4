import express from 'express';
import { corsConfig } from './config/cors';
import { setupMiddleware } from './middleware';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): express.Application {
    const app = express();

    // Basic middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // CORS configuration
    app.use(corsConfig);
    
    // Custom middleware
    setupMiddleware(app);
    
    // API routes
    setupRoutes(app);
    
    // Error handling (must be last)
    app.use(errorHandler);
    
    return app;
} 