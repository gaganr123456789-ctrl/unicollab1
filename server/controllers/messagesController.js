import { getPrisma } from '../db/postgres.js';

// In-memory persistent stores for fallback
export const conversationsStore = [
  {
    id: 'conv_seed_1',
    pairKey: 'alex_ananya',
    participants: ['usr_demo', 'Dr. Ananya Sharma'],
    name: 'Dr. Ananya Sharma',
    role: 'Active now',
    avatarBg: '#EFF6FF',
    avatarColor: '#2563EB',
    initials: 'AS',
    type: 'direct',
    lastMsg: 'The project proposal looks great! Should we finalize the tech stack tonight?',
    time: '10:23 AM'
  }
];

export const messagesStore = [
  {
    id: 'msg_seed_1',
    conversationId: 'conv_seed_1',
    senderId: 'usr_demo',
    senderName: 'Alex Rivera',
    sender: 'user',
    text: 'Hey Ananya! Have you had a chance to look at the team formation guidelines?',
    time: '10:15 AM',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'msg_seed_2',
    conversationId: 'conv_seed_1',
    senderId: 'usr_ananya',
    senderName: 'Dr. Ananya Sharma',
    sender: 'other',
    text: 'The project proposal looks great! Should we finalize the tech stack tonight?',
    time: '10:23 AM',
    createdAt: new Date(Date.now() - 1800000).toISOString()
  }
];

// POST /api/messages/conversation - Deduplicated Conversation Creation or Retrieval
export const getOrCreateConversation = async (req, res) => {
  const { userAId = 'usr_demo', userAName = 'Alex Rivera', userBId, userBName } = req.body;

  if (!userBName && !userBId) {
    return res.status(400).json({ success: false, message: 'Partner ID or Name is required.' });
  }

  const targetPartnerName = userBName || userBId;
  const pairKey = [userAId.toLowerCase(), targetPartnerName.toLowerCase()].sort().join(':');

  try {
    const prisma = await getPrisma();
    if (prisma) {
      // Find existing conversation in Prisma DB
      const existingConv = await prisma.conversation.findFirst({
        where: { name: pairKey },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });

      if (existingConv) {
        return res.status(200).json({
          success: true,
          conversation: existingConv,
          messages: existingConv.messages
        });
      }

      // Create unique conversation in Prisma DB
      const newConv = await prisma.conversation.create({
        data: {
          name: pairKey
        }
      });

      return res.status(201).json({
        success: true,
        conversation: newConv,
        messages: []
      });
    }
  } catch (err) {
    console.warn('Prisma getOrCreateConversation fallback:', err.message);
  }

  // Memory Store Fallback with Pair Key Deduplication
  let existing = conversationsStore.find(c => c.pairKey === pairKey || c.name.toLowerCase() === targetPartnerName.toLowerCase());

  if (!existing) {
    existing = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      pairKey,
      participants: [userAId, targetPartnerName],
      name: targetPartnerName,
      role: 'Active now',
      avatarBg: '#EFF6FF',
      avatarColor: '#2563EB',
      initials: targetPartnerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      type: 'direct',
      lastMsg: 'Chat initiated.',
      time: 'Just now'
    };
    conversationsStore.unshift(existing);
  }

  const convMessages = messagesStore.filter(m => m.conversationId === existing.id);

  return res.status(200).json({
    success: true,
    conversation: existing,
    messages: convMessages
  });
};

// POST /api/messages - Send Message
export const sendMessage = async (req, res) => {
  const { conversationId = 'conv_seed_1', senderId = 'usr_demo', senderName = 'Student User', text, recipientId } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Message text is required.' });
  }

  const cleanText = text.trim();
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newMsg = {
    id: msgId,
    conversationId,
    senderId,
    senderName,
    sender: senderId === 'usr_demo' || senderId === 'user_current' ? 'user' : 'other',
    text: cleanText,
    time: timeFormatted,
    createdAt: new Date().toISOString()
  };

  try {
    const prisma = await getPrisma();
    if (prisma) {
      await prisma.message.create({
        data: {
          id: msgId,
          conversationId,
          senderId: senderId.includes('-') ? senderId : 'usr_demo',
          content: cleanText
        }
      }).catch(e => console.warn('Prisma message save notice:', e.message));
    }
  } catch (err) {
    console.warn('Prisma sendMessage fallback:', err.message);
  }

  // Update memory store
  messagesStore.push(newMsg);
  const conv = conversationsStore.find(c => c.id === conversationId);
  if (conv) {
    conv.lastMsg = cleanText;
    conv.time = 'Just now';
  }

  // Broadcast Socket.io message & notification
  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.to(`conversation_${conversationId}`).emit('message:new', newMsg);
      io.emit('message:new', newMsg);

      if (recipientId) {
        io.to(`user_${recipientId}`).emit('notification:new', {
          id: `notif_msg_${Date.now()}`,
          title: `New Message from ${senderName}`,
          message: cleanText,
          type: 'MESSAGE',
          sender: senderName,
          unread: true
        });
      }
    }
  } catch (e) {
    console.warn('Socket broadcast warning:', e.message);
  }

  return res.status(201).json({
    success: true,
    message: newMsg
  });
};

// GET /api/messages - Retrieve Messages for Conversation
export const getConversationMessages = async (req, res) => {
  const { conversationId, partnerName } = req.query;

  let filtered = messagesStore;
  if (conversationId) {
    filtered = messagesStore.filter(m => m.conversationId === conversationId);
  } else if (partnerName) {
    const conv = conversationsStore.find(c => c.name.toLowerCase() === partnerName.toLowerCase());
    if (conv) {
      filtered = messagesStore.filter(m => m.conversationId === conv.id);
    }
  }

  return res.status(200).json({
    success: true,
    messages: filtered
  });
};
