import { connectionsDB, usersDB, conversationsDB } from '../db/dataStore.js';
import { notificationsDB } from '../routes/invitesRoutes.js';

let prismaInstance = null;
const getPrisma = async () => {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaInstance) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      prismaInstance = new PrismaClient();
    } catch (err) {
      console.warn('Prisma load skipped in connectionsController.');
      return null;
    }
  }
  return prismaInstance;
};

const normalizeEmail = (email) => (email || '').toLowerCase().trim();

// 1. POST /api/connections/request - Send connection request
export const sendConnectionRequest = async (req, res) => {
  const senderId = req.user?.id || req.body.senderId || 'user_current';
  const senderEmail = normalizeEmail(req.user?.email || req.body.senderEmail);
  const senderName = req.user?.name || req.body.senderName || 'Student';
  
  const receiverId = req.body.receiverId;
  const receiverEmail = normalizeEmail(req.body.receiverEmail);
  const receiverName = req.body.receiverName || 'Student Peer';
  const message = req.body.message || `Hi ${receiverName}, I'd love to connect with you on UniCollab!`;

  if (!receiverEmail && !receiverId) {
    return res.status(400).json({ success: false, message: 'Recipient email or ID is required.' });
  }

  if (senderEmail && receiverEmail && senderEmail === receiverEmail) {
    return res.status(400).json({ success: false, message: 'You cannot connect with yourself.' });
  }

  // Check if connection already exists in in-memory store
  const existingConn = connectionsDB.find(c => 
    (normalizeEmail(c.senderEmail) === senderEmail && normalizeEmail(c.receiverEmail) === receiverEmail) ||
    (normalizeEmail(c.senderEmail) === receiverEmail && normalizeEmail(c.receiverEmail) === senderEmail) ||
    (c.senderId === senderId && c.receiverId === receiverId) ||
    (c.senderId === receiverId && c.receiverId === senderId)
  );

  if (existingConn) {
    if (existingConn.status === 'ACCEPTED') {
      return res.status(200).json({ success: true, message: 'You are already connected with this student.', status: 'CONNECTED', connection: existingConn });
    }
    if (existingConn.status === 'PENDING') {
      const isSender = normalizeEmail(existingConn.senderEmail) === senderEmail || existingConn.senderId === senderId;
      return res.status(200).json({ 
        success: true, 
        message: isSender ? 'Connection request is already pending.' : 'This student has already sent you a connection request.',
        status: isSender ? 'PENDING_SENT' : 'PENDING_RECEIVED',
        connection: existingConn 
      });
    }
  }

  const connId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const newConnection = {
    id: connId,
    senderId,
    senderEmail,
    senderName,
    receiverId: receiverId || receiverEmail,
    receiverEmail,
    receiverName,
    message,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  connectionsDB.unshift(newConnection);

  // Add in-app notification for receiver
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  notificationsDB.unshift({
    id: notifId,
    userId: receiverEmail,
    title: 'New Connection Request',
    message: `${senderName} sent you a connection request: "${message}"`,
    type: 'CONNECTION_REQUEST',
    category: 'Connections',
    time: 'Just now',
    read: false,
    connectionId: connId,
    senderEmail,
    senderName,
    createdAt: new Date().toISOString()
  });

  // Real-time broadcast via Socket.IO
  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.to(`user_${receiverEmail}`).emit('connection:request', newConnection);
      if (receiverId) io.to(`user_${receiverId}`).emit('connection:request', newConnection);
      io.emit('connection:update', newConnection);
    }
  } catch (err) {
    console.warn('Socket broadcast warning:', err.message);
  }

  // Attempt Prisma persistence
  try {
    const prisma = await getPrisma();
    if (prisma && senderId.length > 20 && receiverId?.length > 20) {
      await prisma.connection.upsert({
        where: {
          senderId_receiverId: { senderId, receiverId }
        },
        update: { status: 'PENDING' },
        create: {
          id: connId,
          senderId,
          receiverId,
          status: 'PENDING'
        }
      }).catch(e => console.warn('Prisma connection save:', e.message));
    }
  } catch (e) {
    console.warn('Prisma connection fallback notice:', e.message);
  }

  return res.status(201).json({
    success: true,
    message: `Connection request sent to ${receiverName}!`,
    status: 'PENDING_SENT',
    connection: newConnection
  });
};

// 2. GET /api/connections - Get all connections & requests for current user
export const getConnections = async (req, res) => {
  const userEmail = normalizeEmail(req.query.email || req.user?.email || '');
  const userId = req.query.userId || req.user?.id || '';

  const userConnections = connectionsDB.filter(c => 
    (userEmail && (normalizeEmail(c.senderEmail) === userEmail || normalizeEmail(c.receiverEmail) === userEmail)) ||
    (userId && (c.senderId === userId || c.receiverId === userId))
  );

  const accepted = userConnections.filter(c => c.status === 'ACCEPTED');
  const incomingPending = userConnections.filter(c => 
    c.status === 'PENDING' && 
    ((userEmail && normalizeEmail(c.receiverEmail) === userEmail) || (userId && c.receiverId === userId))
  );
  const outgoingPending = userConnections.filter(c => 
    c.status === 'PENDING' && 
    ((userEmail && normalizeEmail(c.senderEmail) === userEmail) || (userId && c.senderId === userId))
  );

  return res.status(200).json({
    success: true,
    count: accepted.length,
    connections: accepted,
    incomingPending,
    outgoingPending,
    all: userConnections
  });
};

// 3. POST /api/connections/:id/accept - Accept connection request
export const acceptConnection = async (req, res) => {
  const connId = req.params.id;
  const userEmail = normalizeEmail(req.user?.email || req.body.userEmail);
  const userId = req.user?.id || req.body.userId;

  let conn = connectionsDB.find(c => 
    c.id === connId || 
    (c.status === 'PENDING' && (
      (userEmail && (normalizeEmail(c.receiverEmail) === userEmail || normalizeEmail(c.senderEmail) === userEmail)) ||
      (userId && (c.receiverId === userId || c.senderId === userId))
    ))
  );

  if (!conn) {
    // If not found by ID, look by target emails provided in body
    const targetEmail = normalizeEmail(req.body.targetEmail);
    if (targetEmail && userEmail) {
      conn = connectionsDB.find(c => 
        (normalizeEmail(c.senderEmail) === targetEmail && normalizeEmail(c.receiverEmail) === userEmail) ||
        (normalizeEmail(c.senderEmail) === userEmail && normalizeEmail(c.receiverEmail) === targetEmail)
      );
    }
  }

  if (!conn) {
    // Create pre-accepted connection if explicitly accepted
    const senderEmail = normalizeEmail(req.body.targetEmail || 'student@university.edu');
    const senderName = req.body.targetName || 'Student Peer';
    conn = {
      id: connId || `conn_${Date.now()}`,
      senderId: 'user_target',
      senderEmail,
      senderName,
      receiverId: userId || 'user_current',
      receiverEmail: userEmail,
      receiverName: req.user?.name || 'Student',
      status: 'ACCEPTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    connectionsDB.unshift(conn);
  } else {
    conn.status = 'ACCEPTED';
    conn.updatedAt = new Date().toISOString();
  }

  // Create or unlock conversation between the two connected users
  const p1 = conn.senderEmail || conn.senderId;
  const p2 = conn.receiverEmail || conn.receiverId;
  const pairKey = [p1.toLowerCase(), p2.toLowerCase()].sort().join(':');

  let conv = conversationsDB.find(c => c.pairKey === pairKey);
  if (!conv) {
    conv = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      pairKey,
      participants: [p1, p2],
      participantDetails: [
        { id: conn.senderId, email: conn.senderEmail, name: conn.senderName },
        { id: conn.receiverId, email: conn.receiverEmail, name: conn.receiverName }
      ],
      name: conn.senderName,
      role: 'Connected Teammate',
      avatarBg: '#EFF6FF',
      avatarColor: '#2563EB',
      initials: (conn.senderName || 'ST').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      type: 'direct',
      lastMsg: 'You are now connected! Start the discussion.',
      time: 'Just now',
      unread: 0,
      updatedAt: new Date().toISOString()
    };
    conversationsDB.unshift(conv);
  }

  // Notify sender that their request was accepted
  notificationsDB.unshift({
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userId: conn.senderEmail,
    title: 'Connection Accepted! 🎉',
    message: `${conn.receiverName || 'Your teammate'} accepted your connection request. You can now chat!`,
    type: 'CONNECTION_ACCEPTED',
    category: 'Connections',
    time: 'Just now',
    read: false,
    targetPage: 'messages',
    createdAt: new Date().toISOString()
  });

  // Real-time broadcast
  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.to(`user_${conn.senderEmail}`).emit('connection:accepted', conn);
      io.to(`user_${conn.receiverEmail}`).emit('connection:accepted', conn);
      io.emit('connection:update', conn);
    }
  } catch (e) {
    console.warn('Socket accept notice:', e.message);
  }

  return res.status(200).json({
    success: true,
    message: `Connected with ${conn.senderName}! Direct messaging is now unlocked.`,
    status: 'CONNECTED',
    connection: conn,
    conversationId: conv.id
  });
};

// 4. POST /api/connections/:id/reject - Decline connection request
export const rejectConnection = async (req, res) => {
  const connId = req.params.id;
  const connIndex = connectionsDB.findIndex(c => c.id === connId);
  
  if (connIndex !== -1) {
    connectionsDB[connIndex].status = 'REJECTED';
    connectionsDB[connIndex].updatedAt = new Date().toISOString();
  }

  return res.status(200).json({
    success: true,
    message: 'Connection request declined.',
    status: 'NOT_CONNECTED'
  });
};

// 5. GET /api/connections/status - Check connection status with a specific user
export const getConnectionStatus = async (req, res) => {
  const myEmail = normalizeEmail(req.query.myEmail || req.user?.email);
  const myId = req.query.myId || req.user?.id;
  const targetEmail = normalizeEmail(req.query.targetEmail);
  const targetId = req.query.targetId;

  if (!targetEmail && !targetId) {
    return res.status(400).json({ success: false, message: 'Target user email or ID required.' });
  }

  const conn = connectionsDB.find(c => 
    (myEmail && targetEmail && (
      (normalizeEmail(c.senderEmail) === myEmail && normalizeEmail(c.receiverEmail) === targetEmail) ||
      (normalizeEmail(c.senderEmail) === targetEmail && normalizeEmail(c.receiverEmail) === myEmail)
    )) ||
    (myId && targetId && (
      (c.senderId === myId && c.receiverId === targetId) ||
      (c.senderId === targetId && c.receiverId === myId)
    ))
  );

  if (!conn) {
    return res.status(200).json({ success: true, status: 'NOT_CONNECTED', isConnected: false });
  }

  if (conn.status === 'ACCEPTED') {
    return res.status(200).json({ success: true, status: 'CONNECTED', isConnected: true, connection: conn });
  }

  if (conn.status === 'PENDING') {
    const isSender = (myEmail && normalizeEmail(c.senderEmail) === myEmail) || (myId && c.senderId === myId);
    return res.status(200).json({
      success: true,
      status: isSender ? 'PENDING_SENT' : 'PENDING_RECEIVED',
      isConnected: false,
      connection: conn
    });
  }

  return res.status(200).json({ success: true, status: 'NOT_CONNECTED', isConnected: false });
};
