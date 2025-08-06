import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';
import { requireAdmin, requireRole } from '../middleware/roleAuth';

const router = express.Router();
const prisma = new PrismaClient();

// Admin dashboard statistics
router.get('/dashboard', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
        const [
            totalUsers,
            totalProjects,
            totalExperiments,
            totalNotes
        ] = await Promise.all([
            prisma.user.count(),
            prisma.project.count(),
            prisma.experiment.count(),
            prisma.note.count()
        ]);

        res.json({
            statistics: {
                totalUsers,
                totalProjects,
                totalExperiments,
                totalNotes
            }
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin-only: Get system health and performance metrics
router.get('/system-health', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const dbSize = await prisma.$queryRaw`SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()`;
        
        res.json({
            status: 'healthy',
            database: {
                size: dbSize,
                connection: 'active'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('System health check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Role-based: Get user's own projects (member access)
router.get('/my-projects', authenticateToken, requireRole('member'), async (req: any, res) => {
    try {
        const projects = await prisma.project.findMany({
            where: { userId: req.user.userId },
            select: {
                id: true,
                name: true,
                description: true,
                status: true,
                createdAt: true
            }
        });

        res.json({ projects });
    } catch (error) {
        console.error('Get user projects error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin-only: Get all projects across all users
router.get('/all-projects', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        res.json({ projects });
    } catch (error) {
        console.error('Get all projects error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin-only: Get user activity logs
router.get('/user-activity/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const activity = await prisma.usageLog.findMany({
            where: { userId },
            orderBy: { timestamp: 'desc' },
            take: 50
        });

        res.json({ activity });
    } catch (error) {
        console.error('Get user activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 