import { Router } from 'express';
import { projectsRoutes } from './projects';
import { notesRoutes } from './notes';
import { linksRoutes } from './links';
import cloudSyncRoutes from './cloudSync';
import entityCloudSyncRoutes from '../../entityCloudSync';

const router = Router();

// API routes
router.use('/projects', projectsRoutes);
router.use('/notes', notesRoutes);
router.use('/links', linksRoutes);
router.use('/cloud-sync', cloudSyncRoutes);
router.use('/entity-cloud-sync', entityCloudSyncRoutes);

// Add other API routes here as they are refactored
// router.use('/database', databaseRoutes);
// router.use('/tasks', tasksRoutes);
// router.use('/notifications', notificationsRoutes);

export { router as apiRoutes }; 