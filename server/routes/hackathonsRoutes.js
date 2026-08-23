import express from 'express';
import { getHackathons, registerForHackathon, getHackathonRegistrations } from '../controllers/hackathonsController.js';

const router = express.Router();

router.get('/', getHackathons);
router.get('/registrations', getHackathonRegistrations);
router.post('/register', registerForHackathon);
router.post('/:id/register', registerForHackathon);

export default router;
