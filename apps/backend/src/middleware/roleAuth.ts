import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware to check if user has admin role
export const requireAdmin = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user || !req.user.userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { role: true }
        });

        if (!user || user.role !== 'admin') {
            res.status(403).json({ error: 'Admin access required' });
            return;
        }

        next();
    } catch (error) {
        console.error('Role check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Middleware to check if user has specific role
export const requireRole = (requiredRole: string) => {
    return async (req: any, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user || !req.user.userId) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }

            const user = await prisma.user.findUnique({
                where: { id: req.user.userId },
                select: { role: true }
            });

            if (!user || user.role !== requiredRole) {
                res.status(403).json({ error: `${requiredRole} access required` });
                return;
            }

            next();
        } catch (error) {
            console.error('Role check error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};

// Middleware to check if user has any of the specified roles
export const requireAnyRole = (allowedRoles: string[]) => {
    return async (req: any, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user || !req.user.userId) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }

            const user = await prisma.user.findUnique({
                where: { id: req.user.userId },
                select: { role: true }
            });

            if (!user || !allowedRoles.includes(user.role)) {
                res.status(403).json({ error: 'Insufficient permissions' });
                return;
            }

            next();
        } catch (error) {
            console.error('Role check error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}; 