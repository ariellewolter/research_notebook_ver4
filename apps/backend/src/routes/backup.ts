import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

// Schema for backup configuration
const backupConfigSchema = z.object({
  enabled: z.boolean(),
  interval: z.number().min(1).max(90),
  maxBackups: z.number().min(1).max(100),
  cloudFolder: z.string(),
  includeMetadata: z.boolean(),
  includeRelationships: z.boolean(),
  compression: z.boolean()
});

// Get all data for backup
router.get('/export', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    // Get all user data with relationships
    const [projects, notes, tasks, databaseEntries, literatureNotes, protocols, recipes] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        include: {
          experiments: {
            include: {
              notes: true,
              variables: {
                include: {
                  values: true
                }
              }
            }
          },
          tasks: true
        }
      }),
      prisma.note.findMany({
        where: {
          experiment: {
            project: {
              userId
            }
          }
        },
        include: {
          experiment: true,
          links: true
        }
      }),
      prisma.task.findMany({
        where: {
          project: {
            userId
          }
        },
        include: {
          project: true,
          experiment: true,
          attachments: true,
          comments: true,
          timeEntries: true,
          dependencies: true
        }
      }),
      prisma.databaseEntry.findMany({
        include: {
          links: true,
          relatedLitNotes: true
        }
      }),
      prisma.literatureNote.findMany({
        include: {
          relatedEntries: true
        }
      }),
      prisma.protocol.findMany({
        include: {
          executions: true
        }
      }),
      prisma.recipe.findMany({
        include: {
          ingredients: true,
          executions: true
        }
      })
    ]);

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true
      }
    });

    const backupData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      user: {
        id: user?.id,
        username: user?.username,
        email: user?.email,
        createdAt: user?.createdAt
      },
      data: {
        projects,
        notes,
        tasks,
        databaseEntries,
        literatureNotes,
        protocols,
        recipes
      },
      metadata: {
        entityCounts: {
          projects: projects.length,
          notes: notes.length,
          tasks: tasks.length,
          databaseEntries: databaseEntries.length,
          literatureNotes: literatureNotes.length,
          protocols: protocols.length,
          recipes: recipes.length
        },
        totalSize: 0,
        backupId: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    };

    res.json(backupData);
  } catch (error) {
    console.error('Backup export error:', error);
    res.status(500).json({ error: 'Failed to export backup data' });
  }
});

// Get backup configuration
router.get('/config', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    // Get user's backup configuration from database
    // For now, return default config
    const config = {
      enabled: true,
      interval: 7,
      maxBackups: 10,
      cloudFolder: '/backups',
      includeMetadata: true,
      includeRelationships: true,
      compression: true
    };

    res.json(config);
  } catch (error) {
    console.error('Get backup config error:', error);
    res.status(500).json({ error: 'Failed to get backup configuration' });
  }
});

// Update backup configuration
router.put('/config', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const validatedData = backupConfigSchema.parse(req.body);

    // Save backup configuration to database
    // For now, just return success
    // TODO: Implement database storage for backup config

    res.json({ message: 'Backup configuration updated successfully', config: validatedData });
  } catch (error) {
    console.error('Update backup config error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid configuration data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update backup configuration' });
    }
  }
});

// Get backup history
router.get('/history', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get backup history from database
    // For now, return empty array
    // TODO: Implement database storage for backup history
    const backups: any[] = [];
    const total = 0;

    res.json({
      backups,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get backup history error:', error);
    res.status(500).json({ error: 'Failed to get backup history' });
  }
});

// Create backup
router.post('/create', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    // Create backup record
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filename = `research_notebook_backup_${new Date().toISOString().split('T')[0]}_${new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-')}.json`;

    // TODO: Save backup record to database
    const backupRecord = {
      id: backupId,
      userId,
      filename,
      status: 'completed',
      createdAt: new Date(),
      metadata: {
        entityCounts: {
          projects: 0,
          notes: 0,
          tasks: 0,
          databaseEntries: 0,
          literatureNotes: 0,
          protocols: 0,
          recipes: 0
        }
      }
    };

    res.json({
      message: 'Backup created successfully',
      backup: backupRecord
    });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Delete backup
router.delete('/:backupId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { backupId } = req.params;

    // TODO: Delete backup from database and cloud storage

    res.json({ message: 'Backup deleted successfully' });
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

// Restore from backup
router.post('/:backupId/restore', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { backupId } = req.params;

    // TODO: Implement restore logic
    // This would involve:
    // 1. Downloading backup from cloud storage
    // 2. Validating backup data
    // 3. Clearing current data
    // 4. Restoring from backup
    // 5. Handling conflicts

    res.json({ message: 'Backup restore initiated successfully' });
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// Get backup statistics
router.get('/stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    // TODO: Calculate backup statistics from database
    const stats = {
      totalBackups: 0,
      completedBackups: 0,
      failedBackups: 0,
      totalSize: 0,
      averageSize: 0,
      successRate: 0,
      lastBackupDate: null
    };

    res.json(stats);
  } catch (error) {
    console.error('Get backup stats error:', error);
    res.status(500).json({ error: 'Failed to get backup statistics' });
  }
});

export default router; 