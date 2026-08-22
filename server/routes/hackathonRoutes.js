import express from 'express';
import { hackathonsDB } from '../db/dataStore.js';

const router = express.Router();

// GET /api/hackathons
router.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    total: hackathonsDB.length,
    hackathons: hackathonsDB
  });
});

// POST /api/hackathons/register
router.post('/register', (req, res) => {
  const { hackathonId, teamName, membersCount } = req.body;

  const hackathon = hackathonsDB.find(h => h.id === Number(hackathonId));

  if (hackathon) {
    hackathon.participantsCount += 1;
  }

  return res.status(200).json({
    success: true,
    message: `Team '${teamName || 'Alpha'}' registered successfully for ${hackathon ? hackathon.title : 'Hackathon'}!`,
    registrationId: `HK_${Date.now()}`
  });
});

export default router;
