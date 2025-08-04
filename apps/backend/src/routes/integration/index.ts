import { Router } from 'express';

const router = Router();

// TODO: Implement integration routes
router.get('/status', (req, res) => {
    res.json({ message: 'Integration routes placeholder' });
});

export { router as integrationRoutes }; 