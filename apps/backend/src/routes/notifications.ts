import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = express.Router();

// Schema for creating notifications
const createNotificationSchema = z.object({
  taskId: z.string(),
  type: z.enum(['reminder', 'overdue', 'due_soon', 'completed', 'assigned', 'commented', 'time_logged']),
  message: z.string(),
  scheduledFor: z.string().datetime(),
  deliveryMethod: z.enum(['in_app', 'email', 'push', 'sms']).default('in_app'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  metadata: z.string().optional(),
});

// Schema for updating notifications
const updateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
  sentAt: z.string().datetime().optional(),
  message: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
});

// Get all notifications for a user (via tasks)
router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '20', unreadOnly = 'false', type } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    
    if (unreadOnly === 'true') {
      where.isRead = false;
    }
    
    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      prisma.taskNotification.findMany({
        where,
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              deadline: true,
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledFor: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum,
      }),
      prisma.taskNotification.count({ where })
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
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get notifications for a specific task
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const notifications = await prisma.taskNotification.findMany({
      where: { taskId },
      orderBy: { scheduledFor: 'asc' }
    });
    res.json(notifications);
  } catch (error) {
    console.error('Get task notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch task notifications' });
  }
});

// Create a new notification
router.post('/', async (req, res) => {
  try {
    const data = createNotificationSchema.parse(req.body);
    
    const notification = await prisma.taskNotification.create({
      data: {
        ...data,
        scheduledFor: new Date(data.scheduledFor),
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          }
        }
      }
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(400).json({ error: 'Failed to create notification' });
  }
});

// Update a notification
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateNotificationSchema.parse(req.body);
    
    const updateData: any = { ...data };
    if (data.sentAt) {
      updateData.sentAt = new Date(data.sentAt);
    }

    const notification = await prisma.taskNotification.update({
      where: { id },
      data: updateData,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          }
        }
      }
    });

    res.json(notification);
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(400).json({ error: 'Failed to update notification' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.taskNotification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json(notification);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    const result = await prisma.taskNotification.updateMany({
      where: { isRead: false },
      data: { isRead: true }
    });
    res.json({ updated: result.count });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.taskNotification.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get notification statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      total,
      unread,
      overdue,
      dueSoon,
      highPriority
    ] = await Promise.all([
      prisma.taskNotification.count(),
      prisma.taskNotification.count({ where: { isRead: false } }),
      prisma.taskNotification.count({ 
        where: { 
          type: 'overdue',
          isRead: false 
        } 
      }),
      prisma.taskNotification.count({ 
        where: { 
          type: 'due_soon',
          isRead: false 
        } 
      }),
      prisma.taskNotification.count({ 
        where: { 
          priority: { in: ['high', 'urgent'] },
          isRead: false 
        } 
      })
    ]);

    res.json({
      total,
      unread,
      overdue,
      dueSoon,
      highPriority
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
});

// Create reminder notifications for tasks
router.post('/create-reminders', async (req, res) => {
  try {
    const { taskId, reminderTimes } = req.body;
    
    // Delete existing reminders for this task
    await prisma.taskNotification.deleteMany({
      where: { 
        taskId,
        type: 'reminder'
      }
    });

    // Create new reminders
    const notifications = await Promise.all(
      reminderTimes.map((time: string) =>
        prisma.taskNotification.create({
          data: {
            taskId,
            type: 'reminder',
            message: `Reminder: Task is due soon`,
            scheduledFor: new Date(time),
            deliveryMethod: 'in_app',
            priority: 'normal'
          }
        })
      )
    );

    res.json(notifications);
  } catch (error) {
    console.error('Create reminders error:', error);
    res.status(500).json({ error: 'Failed to create reminders' });
  }
});

export default router; 