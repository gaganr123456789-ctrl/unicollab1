import express from 'express';
import { processAiChat } from '../controllers/aiController.js';

const router = express.Router();

// POST /api/ai/chat
router.post('/chat', processAiChat);

export default router;
