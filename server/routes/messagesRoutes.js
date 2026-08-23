import express from 'express';
import { 
  getOrCreateConversation, 
  sendMessage, 
  getConversationMessages,
  getConversations,
  markMessagesRead
} from '../controllers/messagesController.js';

const router = express.Router();

router.get('/conversations', getConversations);
router.post('/conversation', getOrCreateConversation);
router.post('/', sendMessage);
router.get('/', getConversationMessages);
router.get('/conversations/:id/messages', getConversationMessages);
router.post('/read', markMessagesRead);

export default router;
