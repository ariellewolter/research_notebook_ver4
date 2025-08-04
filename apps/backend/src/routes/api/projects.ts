import { Router } from 'express';
import { projectsController } from '../../controllers/projectsController';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

router.use(authenticateToken); // Apply auth to all routes

router.get('/', projectsController.getAllProjects);
router.get('/stats', projectsController.getProjectStats);
router.get('/:id', projectsController.getProjectById);
router.post('/', projectsController.createProject);
router.put('/:id', projectsController.updateProject);
router.delete('/:id', projectsController.deleteProject);

export { router as projectsRoutes }; 