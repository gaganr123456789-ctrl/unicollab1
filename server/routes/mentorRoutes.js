import express from 'express';
import { mentorsDB } from '../db/dataStore.js';

const router = express.Router();

// GET /api/mentors
router.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    total: mentorsDB.length,
    mentors: mentorsDB
  });
});

// POST /api/mentors/book
router.post('/book', (req, res) => {
  const { mentorId, date, timeSlot, topic } = req.body;

  const mentor = mentorsDB.find(m => m.id === Number(mentorId));

  return res.status(200).json({
    success: true,
    message: `1-on-1 mentorship session with ${mentor ? mentor.name : 'Mentor'} requested successfully!`,
    booking: {
      bookingId: `BK_${Date.now()}`,
      mentorName: mentor ? mentor.name : 'Mentor',
      date: date || 'Tomorrow',
      timeSlot: timeSlot || '4:00 PM',
      topic: topic || 'Project Guidance'
    }
  });
});

export default router;
