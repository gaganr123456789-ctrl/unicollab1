import express from 'express';
import { 
  getHackathons, 
  getHackathonById, 
  createHackathon, 
  updateHackathon, 
  deleteHackathon, 
  registerForHackathon, 
  getHackathonRegistrations 
} from '../controllers/hackathonsController.js';

const router = express.Router();

// Public & Student Endpoints
router.get('/', getHackathons);
router.get('/registrations', getHackathonRegistrations);
router.get('/:id', getHackathonById);
router.post('/register', registerForHackathon);
router.post('/:id/register', registerForHackathon);

// Admin Management Endpoints
router.post('/', createHackathon);
router.put('/:id', updateHackathon);
router.delete('/:id', deleteHackathon);

export default router;

