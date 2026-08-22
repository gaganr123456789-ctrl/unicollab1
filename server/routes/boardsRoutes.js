import express from 'express';
import { getBoards, getBoardById, createColumn, createCard, updateCardPosition } from '../controllers/boardsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getBoards);
router.get('/:id', authenticateToken, getBoardById);
router.post('/:id/columns', authenticateToken, createColumn);
router.post('/:id/cards', authenticateToken, createCard);
router.patch('/:id/cards/:cardId', authenticateToken, updateCardPosition);

export default router;
