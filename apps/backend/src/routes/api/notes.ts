import { Router } from 'express';
import { notesController } from '../../controllers/notesController';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

router.use(authenticateToken); // Apply auth to all routes

router.get('/', notesController.getAllNotes);
router.get('/stats', notesController.getNoteStats);
router.get('/search/:query', notesController.searchNotes);
router.get('/date/:date', notesController.getNotesByDate);
router.get('/:id', notesController.getNoteById);
router.post('/', notesController.createNote);
router.put('/:id', notesController.updateNote);
router.delete('/:id', notesController.deleteNote);

export { router as notesRoutes }; 