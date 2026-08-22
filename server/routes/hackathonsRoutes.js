import express from 'express';
import { getHackathons, registerForHackathon } from '../controllers/hackathonsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getHackathons);
router.post('/', authenticateToken, registerForHackathon);
router.post('/:id/register', authenticateToken, registerForHackathon);

export default router;
