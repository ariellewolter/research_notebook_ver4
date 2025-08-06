import { Application } from 'express';
import { apiRoutes } from './api';
import authRoutes from './auth';
import adminRoutes from './admin';
import { integrationRoutes } from './integration';

export function setupRoutes(app: Application): void {
    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Route groups
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api', apiRoutes);
    app.use('/api/integration', integrationRoutes);
    
    console.log('✅ Routes configured');
} 