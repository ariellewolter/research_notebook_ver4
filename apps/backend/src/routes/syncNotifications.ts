import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = express.Router();

// Schema for creating sync notifications
const createSyncNotificationSchema = z.object({
  service: z.string(),
  type: z.enum(['warning', 'critical', 'error']),
  message: z.string(),
  scheduledFor: z.string().datetime(),
  deliveryMethod: z.enum(['in_app', 'email', 'push', 'sms']).default('in_app'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  metadata: z.string().optional(),
});

// Schema for updating sync notifications
const updateSyncNotificationSchema = z.object({
  isRead: z.boolean().optional(),
  sentAt: z.string().datetime().optional(),
  message: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
});

// Get all sync notifications
router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '20', unreadOnly = 'false', service, type } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    
    if (unreadOnly === 'true') {
      where.isRead = false;
    }
    
    if (service) {
      where.service = service;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      prisma.syncNotification.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { scheduledFor: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum,
      }),
      prisma.syncNotification.count({ where })
    ]);

    res.json({
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get sync notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch sync notifications' });
  }
});

// Get sync notifications for a specific service
router.get('/service/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string);

    const notifications = await prisma.syncNotification.findMany({
      where: { service },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limitNum,
    });

    res.json(notifications);
  } catch (error) {
    console.error('Get service sync notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch service sync notifications' });
  }
});

// Create a new sync notification
router.post('/', async (req, res) => {
  try {
    const validatedData = createSyncNotificationSchema.parse(req.body);

    const notification = await prisma.syncNotification.create({
      data: {
        service: validatedData.service,
        type: validatedData.type,
        message: validatedData.message,
        scheduledFor: new Date(validatedData.scheduledFor),
        deliveryMethod: validatedData.deliveryMethod,
        priority: validatedData.priority,
        metadata: validatedData.metadata,
      }
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error('Create sync notification error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create sync notification' });
    }
  }
});

// Update a sync notification
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateSyncNotificationSchema.parse(req.body);

    const updateData: any = {};
    if (validatedData.isRead !== undefined) updateData.isRead = validatedData.isRead;
    if (validatedData.sentAt !== undefined) updateData.sentAt = new Date(validatedData.sentAt);
    if (validatedData.message !== undefined) updateData.message = validatedData.message;
    if (validatedData.scheduledFor !== undefined) updateData.scheduledFor = new Date(validatedData.scheduledFor);

    const notification = await prisma.syncNotification.update({
      where: { id },
      data: updateData
    });

    res.json(notification);
  } catch (error) {
    console.error('Update sync notification error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update sync notification' });
    }
  }
});

// Mark a sync notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.syncNotification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json(notification);
  } catch (error) {
    console.error('Mark sync notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark sync notification as read' });
  }
});

// Mark all sync notifications as read
router.put('/read-all', async (req, res) => {
  try {
    const { service } = req.query;
    
    const where: any = { isRead: false };
    if (service) {
      where.service = service;
    }

    await prisma.syncNotification.updateMany({
      where,
      data: { isRead: true }
    });

    res.json({ message: 'All sync notifications marked as read' });
  } catch (error) {
    console.error('Mark all sync notifications as read error:', error);
    res.status(500).json({ error: 'Failed to mark all sync notifications as read' });
  }
});

// Delete a sync notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.syncNotification.delete({
      where: { id }
    });

    res.json({ message: 'Sync notification deleted' });
  } catch (error) {
    console.error('Delete sync notification error:', error);
    res.status(500).json({ error: 'Failed to delete sync notification' });
  }
});

// Get sync notification stats
router.get('/stats', async (req, res) => {
  try {
    const { service } = req.query;
    
    const where: any = {};
    if (service) {
      where.service = service;
    }

    const [total, unread, byType] = await Promise.all([
      prisma.syncNotification.count({ where }),
      prisma.syncNotification.count({ where: { ...where, isRead: false } }),
      prisma.syncNotification.groupBy({
        by: ['type'],
        where,
        _count: { type: true }
      })
    ]);

    const typeStats = byType.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      total,
      unread,
      byType: typeStats
    });
  } catch (error) {
    console.error('Get sync notification stats error:', error);
    res.status(500).json({ error: 'Failed to fetch sync notification stats' });
  }
});

// Create sync reminder notifications
router.post('/create-reminders', async (req, res) => {
  try {
    const { service, type, message, hoursSinceLastSync, errorCount } = req.body;
    
    // Delete existing reminders for this service and type
    await prisma.syncNotification.deleteMany({
      where: { 
        service,
        type
      }
    });

    // Create new reminder
    const notification = await prisma.syncNotification.create({
      data: {
        service,
        type,
        message,
        scheduledFor: new Date(),
        deliveryMethod: 'in_app',
        priority: type === 'critical' ? 'high' : 'normal',
        metadata: JSON.stringify({
          hoursSinceLastSync,
          errorCount,
          reminderType: type,
          canRetry: true
        })
      }
    });

    res.json(notification);
  } catch (error) {
    console.error('Create sync reminders error:', error);
    res.status(500).json({ error: 'Failed to create sync reminders' });
  }
});

export default router; 