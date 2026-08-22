import express from 'express';
import { getOrCreateConversation, sendMessage, getConversationMessages } from '../controllers/messagesController.js';

const router = express.Router();

router.post('/conversation', getOrCreateConversation);
router.post('/', sendMessage);
router.get('/', getConversationMessages);
router.get('/conversations/:id/messages', getConversationMessages);

export default router;
