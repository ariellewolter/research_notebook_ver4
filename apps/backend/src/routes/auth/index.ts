import { Router } from 'express';

const router = Router();

// TODO: Implement auth routes
router.get('/status', (req, res) => {
    res.json({ message: 'Auth routes placeholder' });
});

export { router as authRoutes }; 