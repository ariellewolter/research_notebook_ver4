import { Router } from 'express';
import { linksController } from '../../controllers/linksController';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

router.use(authenticateToken); // Apply auth to all routes

router.get('/', linksController.getAllLinks);
router.get('/search/:query', linksController.searchLinks);
router.get('/graph', linksController.getLinkGraph);
router.get('/backlinks/:entityType/:entityId', linksController.getBacklinks);
router.get('/outgoing/:entityType/:entityId', linksController.getOutgoingLinks);
router.get('/connections/:entityType/:entityId', linksController.getEntityConnections);
router.get('/:id', linksController.getLinkById);
router.post('/', linksController.createLink);
router.delete('/:id', linksController.deleteLink);

export { router as linksRoutes }; 