import { conversationsDB, messagesDB, connectionsDB, usersDB } from '../db/dataStore.js';
import { notificationsDB } from '../routes/invitesRoutes.js';

let prismaInstance = null;
const getPrisma = async () => {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaInstance) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      prismaInstance = new PrismaClient();
    } catch (err) {
      console.warn('Prisma load skipped in messagesController.');
      return null;
    }
  }
  return prismaInstance;
};

const normalizeEmail = (email) => (email || '').toLowerCase().trim();

// 1. GET /api/messages/conversations - Retrieve all conversations for current user
export const getConversations = async (req, res) => {
  const myEmail = normalizeEmail(req.query.email || req.user?.email || '');
  const myId = req.query.userId || req.user?.id || '';

  // Filter conversations where user is a participant or return all if none specified
  let userConvs = conversationsDB;
  if (myEmail || myId) {
    userConvs = conversationsDB.filter(c => {
      if (!c.participants || c.participants.length === 0) return true;
      const inParticipants = c.participants.some(p => 
        (myEmail && normalizeEmail(p) === myEmail) || 
        (myId && p === myId) || 
        (myEmail && c.pairKey && c.pairKey.includes(myEmail))
      );
      const inDetails = Array.isArray(c.participantDetails) && c.participantDetails.some(pd => 
        (myEmail && normalizeEmail(pd.email) === myEmail) || (myId && pd.id === myId)
      );
      return inParticipants || inDetails || (c.email && normalizeEmail(c.email) === myEmail);
    });
  }

  // Calculate unread counts for each conversation for this user
  const formatted = userConvs.map(conv => {
    const unreadCount = messagesDB.filter(m => 
      m.conversationId === conv.id && 
      (normalizeEmail(m.receiverId) === myEmail || m.receiverId === myId) &&
      m.status !== 'READ'
    ).length;

    const convMessages = messagesDB.filter(m => m.conversationId === conv.id);
    const lastMsgObj = convMessages[convMessages.length - 1];

    return {
      ...conv,
      unread: unreadCount,
      lastMsg: lastMsgObj ? (lastMsgObj.content || lastMsgObj.text || lastMsgObj.message) : (conv.lastMsg || 'Chat active'),
      time: lastMsgObj ? formatMessageTime(lastMsgObj.createdAt) : (conv.time || 'Active'),
      updatedAt: lastMsgObj ? lastMsgObj.createdAt : conv.updatedAt
    };
  });

  // Sort by latest message / update descending
  formatted.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  return res.status(200).json({
    success: true,
    count: formatted.length,
    conversations: formatted
  });
};

// 2. POST /api/messages/conversation - Deduplicated Conversation Creation or Retrieval
export const getOrCreateConversation = async (req, res) => {
  const { userAId = 'usr_demo', userAEmail, userAName = 'Alex Rivera', userBId, userBEmail, userBName, partnerRole } = req.body;

  if (!userBName && !userBId && !userBEmail) {
    return res.status(400).json({ success: false, message: 'Partner identification (name, email, or ID) is required.' });
  }

  const myIdentifier = normalizeEmail(userAEmail || userAId);
  const targetIdentifier = normalizeEmail(userBEmail || userBId || userBName);
  const targetDisplayName = userBName || (userBEmail ? userBEmail.split('@')[0] : 'Teammate');

  const pairKey = [myIdentifier, targetIdentifier].sort().join(':');

  // Verify connection access
  const isConnected = connectionsDB.some(c => 
    c.status === 'ACCEPTED' && (
      (normalizeEmail(c.senderEmail) === myIdentifier && normalizeEmail(c.receiverEmail) === targetIdentifier) ||
      (normalizeEmail(c.senderEmail) === targetIdentifier && normalizeEmail(c.receiverEmail) === myIdentifier) ||
      (c.senderId === userAId && c.receiverId === userBId) ||
      (c.senderId === userBId && c.receiverId === userAId)
    )
  );

  // If not explicitly recorded as connected, auto-connect if it is a registered student peer to enable seamless chatting
  if (!isConnected && myIdentifier && targetIdentifier && myIdentifier !== targetIdentifier) {
    connectionsDB.unshift({
      id: `conn_auto_${Date.now()}`,
      senderId: userAId,
      senderEmail: myIdentifier,
      senderName: userAName,
      receiverId: userBId || targetIdentifier,
      receiverEmail: targetIdentifier,
      receiverName: targetDisplayName,
      status: 'ACCEPTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // Check if conversation already exists in memory store
  let existing = conversationsDB.find(c => 
    c.pairKey === pairKey || 
    (c.name && c.name.toLowerCase() === targetDisplayName.toLowerCase()) ||
    (c.id && c.id === req.body.conversationId)
  );

  if (!existing) {
    const newConvId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    existing = {
      id: newConvId,
      pairKey,
      participants: [myIdentifier, targetIdentifier],
      name: targetDisplayName,
      email: targetIdentifier,
      role: partnerRole || 'Connected Teammate',
      avatarBg: req.body.avatarBg || '#EFF6FF',
      avatarColor: req.body.avatarColor || '#2563EB',
      initials: targetDisplayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TM',
      type: 'direct',
      lastMsg: 'Chat connection active.',
      time: 'Just now',
      unread: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    conversationsDB.unshift(existing);
  }

  // Get all messages for this conversation
  const convMessages = messagesDB.filter(m => m.conversationId === existing.id);

  return res.status(200).json({
    success: true,
    conversation: existing,
    messages: convMessages
  });
};

// 3. GET /api/messages - Retrieve messages for a conversation
export const getConversationMessages = async (req, res) => {
  const conversationId = req.query.conversationId || req.params.id || 'conv_seed_1';
  const myId = req.query.userId || req.user?.id || 'usr_demo';
  const myEmail = normalizeEmail(req.query.email || req.user?.email);

  // Mark all unread messages received by this user as READ
  messagesDB.forEach(m => {
    if (m.conversationId === conversationId && (normalizeEmail(m.receiverId) === myEmail || m.receiverId === myId) && m.status !== 'READ') {
      m.status = 'READ';
      m.readAt = new Date().toISOString();
    }
  });

  const convMessages = messagesDB.filter(m => m.conversationId === conversationId);

  return res.status(200).json({
    success: true,
    count: convMessages.length,
    messages: convMessages
  });
};

// 4. POST /api/messages - Send a new message
export const sendMessage = async (req, res) => {
  const {
    conversationId,
    senderId = 'usr_demo',
    senderEmail,
    senderName = 'Student',
    receiverId,
    receiverEmail,
    text,
    content,
    message
  } = req.body;

  const rawMessage = (text || content || message || '').trim();
  if (!rawMessage) {
    return res.status(400).json({ success: false, message: 'Message content is required.' });
  }

  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date();
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const resolvedSenderEmail = normalizeEmail(senderEmail || req.user?.email || senderId);
  const resolvedReceiverEmail = normalizeEmail(receiverEmail || receiverId || '');

  const newMsg = {
    id: msgId,
    message_id: msgId,
    conversation_id: conversationId,
    conversationId,
    sender_id: senderId,
    senderId,
    senderEmail: resolvedSenderEmail,
    senderName,
    receiver_id: receiverId || resolvedReceiverEmail,
    receiverId: receiverId || resolvedReceiverEmail,
    receiverEmail: resolvedReceiverEmail,
    message: rawMessage,
    content: rawMessage,
    text: rawMessage,
    created_at: now.toISOString(),
    createdAt: now.toISOString(),
    read_at: null,
    readAt: null,
    status: 'DELIVERED',
    message_status: 'DELIVERED',
    time: timeFormatted
  };

  // 1. Store in memory messages database
  messagesDB.push(newMsg);

  // 2. Update conversation's latest message and time
  const conv = conversationsDB.find(c => c.id === conversationId);
  if (conv) {
    conv.lastMsg = rawMessage;
    conv.time = timeFormatted;
    conv.updatedAt = now.toISOString();
  }

  // 3. Real-time delivery via Socket.IO
  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      // Broadcast to active conversation room
      io.to(`conv_${conversationId}`).emit('receive_message', newMsg);
      io.to(conversationId).emit('receive_message', newMsg);

      // Deliver direct message notification to receiver's personal user room
      if (resolvedReceiverEmail) {
        io.to(`user_${resolvedReceiverEmail}`).emit('new_message_notification', {
          ...newMsg,
          conversationName: senderName
        });
      }
      if (receiverId) {
        io.to(`user_${receiverId}`).emit('new_message_notification', {
          ...newMsg,
          conversationName: senderName
        });
      }
    }
  } catch (err) {
    console.warn('Socket message emission warning:', err.message);
  }

  // 4. Attempt Prisma persistence
  try {
    const prisma = await getPrisma();
    if (prisma && senderId.length > 20) {
      await prisma.message.create({
        data: {
          id: msgId,
          conversationId: conversationId.length > 20 ? conversationId : undefined,
          senderId,
          content: rawMessage,
          status: 'DELIVERED'
        }
      }).catch(e => console.warn('Prisma message save notice:', e.message));
    }
  } catch (e) {
    console.warn('Prisma message fallback notice:', e.message);
  }

  return res.status(201).json({
    success: true,
    message: 'Message sent successfully!',
    data: newMsg,
    messagePayload: newMsg
  });
};

// 5. POST /api/messages/read - Mark messages as read
export const markMessagesRead = async (req, res) => {
  const { conversationId, readerId, readerEmail } = req.body;
  const normalizedReader = normalizeEmail(readerEmail || req.user?.email || readerId);

  let updatedCount = 0;
  messagesDB.forEach(m => {
    if (m.conversationId === conversationId && (normalizeEmail(m.receiverId) === normalizedReader || normalizeEmail(m.receiverEmail) === normalizedReader || m.receiverId === readerId)) {
      if (m.status !== 'READ') {
        m.status = 'READ';
        m.message_status = 'READ';
        m.readAt = new Date().toISOString();
        m.read_at = m.readAt;
        updatedCount++;
      }
    }
  });

  // Notify sender that messages were read
  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.to(`conv_${conversationId}`).emit('messages_read', { conversationId, readerId: normalizedReader });
      io.to(conversationId).emit('messages_read', { conversationId, readerId: normalizedReader });
    }
  } catch (e) {
    console.warn('Socket mark_read notice:', e.message);
  }

  return res.status(200).json({
    success: true,
    message: `Marked ${updatedCount} messages as read.`,
    updatedCount
  });
};

const formatMessageTime = (isoString) => {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    // If today, show time
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Active';
  }
};
