import { Application } from 'express';
import { authenticateToken } from './auth';
import { asyncHandler } from './asyncHandler';

export function setupMiddleware(app: Application): void {
    // Add any global middleware here
    console.log('✅ Middleware configured');
}

export { authenticateToken, asyncHandler }; 