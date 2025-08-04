import { Request, Response, NextFunction } from 'express';

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
    // TODO: Implement proper JWT authentication
    // For now, just add a mock user
    (req as any).user = { userId: 'mock-user-id' };
    next();
} 