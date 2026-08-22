import express from 'express';
import { getMentors, getMentorById, bookMentorSession } from '../controllers/mentorsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getMentors);
router.get('/:id', getMentorById);
router.post('/book', bookMentorSession);
router.post('/:id/book', bookMentorSession);

export default router;
