import express from 'express';
import { getAllUsers, searchUsers, getMyProfile, updateMyProfile } from '../controllers/usersController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllUsers);
router.get('/search', searchUsers);
router.get('/me', authenticateToken, getMyProfile);
router.patch('/me', authenticateToken, updateMyProfile);

export default router;
