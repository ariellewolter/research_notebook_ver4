import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const updateCloudSyncSchema = z.object({
  cloudSynced: z.boolean(),
  cloudPath: z.string().optional(),
  cloudService: z.enum(['dropbox', 'google', 'onedrive', 'icloud']).optional(),
});

const entityTypeSchema = z.enum(['note', 'project', 'pdf']);

// Update cloud sync settings for an entity
router.put('/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const validatedType = entityTypeSchema.parse(entityType);
    const validatedData = updateCloudSyncSchema.parse(req.body);

    let updatedEntity;

    switch (validatedType) {
      case 'note':
        updatedEntity = await prisma.note.update({
          where: { id: entityId },
          data: {
            cloudSynced: validatedData.cloudSynced,
            cloudPath: validatedData.cloudPath,
            cloudService: validatedData.cloudService,
            lastSynced: validatedData.cloudSynced ? new Date() : null,
            syncStatus: validatedData.cloudSynced ? 'pending' : null,
          },
        });
        break;

      case 'project':
        updatedEntity = await prisma.project.update({
          where: { id: entityId },
          data: {
            cloudSynced: validatedData.cloudSynced,
            cloudPath: validatedData.cloudPath,
            cloudService: validatedData.cloudService,
            lastSynced: validatedData.cloudSynced ? new Date() : null,
            syncStatus: validatedData.cloudSynced ? 'pending' : null,
          },
        });
        break;

      case 'pdf':
        updatedEntity = await prisma.pDF.update({
          where: { id: entityId },
          data: {
            cloudSynced: validatedData.cloudSynced,
            cloudPath: validatedData.cloudPath,
            cloudService: validatedData.cloudService,
            lastSynced: validatedData.cloudSynced ? new Date() : null,
            syncStatus: validatedData.cloudSynced ? 'pending' : null,
          },
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid entity type' });
    }

    res.json(updatedEntity);
  } catch (error) {
    console.error('Error updating cloud sync settings:', error);
    res.status(500).json({ error: 'Failed to update cloud sync settings' });
  }
});

// Get cloud sync settings for an entity
router.get('/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const validatedType = entityTypeSchema.parse(entityType);

    let entity;

    switch (validatedType) {
      case 'note':
        entity = await prisma.note.findUnique({
          where: { id: entityId },
          select: {
            id: true,
            title: true,
            cloudSynced: true,
            cloudPath: true,
            cloudService: true,
            lastSynced: true,
            syncStatus: true,
          },
        });
        break;

      case 'project':
        entity = await prisma.project.findUnique({
          where: { id: entityId },
          select: {
            id: true,
            name: true,
            cloudSynced: true,
            cloudPath: true,
            cloudService: true,
            lastSynced: true,
            syncStatus: true,
          },
        });
        break;

      case 'pdf':
        entity = await prisma.pDF.findUnique({
          where: { id: entityId },
          select: {
            id: true,
            title: true,
            cloudSynced: true,
            cloudPath: true,
            cloudService: true,
            lastSynced: true,
            syncStatus: true,
          },
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid entity type' });
    }

    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    res.json(entity);
  } catch (error) {
    console.error('Error fetching cloud sync settings:', error);
    res.status(500).json({ error: 'Failed to fetch cloud sync settings' });
  }
});

// Get all entities with cloud sync status
router.get('/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    const validatedType = entityTypeSchema.parse(entityType);

    let entities;

    switch (validatedType) {
      case 'note':
        entities = await prisma.note.findMany({
          select: {
            id: true,
            title: true,
            cloudSynced: true,
            cloudPath: true,
            cloudService: true,
            lastSynced: true,
            syncStatus: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        break;

      case 'project':
        entities = await prisma.project.findMany({
          select: {
            id: true,
            name: true,
            cloudSynced: true,
            cloudPath: true,
            cloudService: true,
            lastSynced: true,
            syncStatus: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        break;

      case 'pdf':
        entities = await prisma.pDF.findMany({
          select: {
            id: true,
            title: true,
            cloudSynced: true,
            cloudPath: true,
            cloudService: true,
            lastSynced: true,
            syncStatus: true,
          },
          orderBy: { uploadedAt: 'desc' },
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid entity type' });
    }

    res.json(entities);
  } catch (error) {
    console.error('Error fetching entities with cloud sync status:', error);
    res.status(500).json({ error: 'Failed to fetch entities' });
  }
});

// Update sync status for an entity
router.patch('/:entityType/:entityId/status', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { syncStatus, lastSynced } = req.body;

    const validatedType = entityTypeSchema.parse(entityType);
    const validatedStatus = z.enum(['pending', 'synced', 'error', 'conflict']).parse(syncStatus);

    let updatedEntity;

    switch (validatedType) {
      case 'note':
        updatedEntity = await prisma.note.update({
          where: { id: entityId },
          data: {
            syncStatus: validatedStatus,
            lastSynced: lastSynced ? new Date(lastSynced) : new Date(),
          },
        });
        break;

      case 'project':
        updatedEntity = await prisma.project.update({
          where: { id: entityId },
          data: {
            syncStatus: validatedStatus,
            lastSynced: lastSynced ? new Date(lastSynced) : new Date(),
          },
        });
        break;

      case 'pdf':
        updatedEntity = await prisma.pDF.update({
          where: { id: entityId },
          data: {
            syncStatus: validatedStatus,
            lastSynced: lastSynced ? new Date(lastSynced) : new Date(),
          },
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid entity type' });
    }

    res.json(updatedEntity);
  } catch (error) {
    console.error('Error updating sync status:', error);
    res.status(500).json({ error: 'Failed to update sync status' });
  }
});

// Get sync statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [notes, projects, pdfs] = await Promise.all([
      prisma.note.groupBy({
        by: ['cloudSynced', 'syncStatus'],
        _count: true,
      }),
      prisma.project.groupBy({
        by: ['cloudSynced', 'syncStatus'],
        _count: true,
      }),
      prisma.pDF.groupBy({
        by: ['cloudSynced', 'syncStatus'],
        _count: true,
      }),
    ]);

    const stats = {
      notes: {
        total: notes.reduce((sum, item) => sum + item._count, 0),
        synced: notes.filter(item => item.cloudSynced).reduce((sum, item) => sum + item._count, 0),
        byStatus: notes,
      },
      projects: {
        total: projects.reduce((sum, item) => sum + item._count, 0),
        synced: projects.filter(item => item.cloudSynced).reduce((sum, item) => sum + item._count, 0),
        byStatus: projects,
      },
      pdfs: {
        total: pdfs.reduce((sum, item) => sum + item._count, 0),
        synced: pdfs.filter(item => item.cloudSynced).reduce((sum, item) => sum + item._count, 0),
        byStatus: pdfs,
      },
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching sync statistics:', error);
    res.status(500).json({ error: 'Failed to fetch sync statistics' });
  }
});

export default router; 