import { Router } from 'express';

const router = Router();

// Respond to GET / when mounted at /api/health
router.get('/', (req, res) => {
    res.json({ status: 'ok' });
});

export default router; 