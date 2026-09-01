import { connectionsDB, saveConnectionRecord, removeConnectionRecord, usersDB, conversationsDB } from '../db/dataStore.js';
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
  
  const receiverId = req.body.receiverId || req.body.recipientId;
  const receiverEmail = normalizeEmail(req.body.receiverEmail || req.body.recipientEmail);
  const receiverName = req.body.receiverName || req.body.recipientName || 'Student Peer';
  const message = req.body.message || `Hi ${receiverName}, let's connect and collaborate on capstone projects!`;

  if (!receiverEmail && !receiverId) {
    return res.status(400).json({ success: false, message: 'Recipient email or ID is required.' });
  }

  if (senderEmail && receiverEmail && senderEmail === receiverEmail) {
    return res.status(400).json({ success: false, message: 'You cannot connect with yourself.' });
  }

  // Check if connection already exists in store
  const existingConn = connectionsDB.find(c => 
    (normalizeEmail(c.senderEmail) === senderEmail && normalizeEmail(c.receiverEmail) === receiverEmail) ||
    (normalizeEmail(c.senderEmail) === receiverEmail && normalizeEmail(c.receiverEmail) === senderEmail) ||
    (c.senderId && c.receiverId && ((c.senderId === senderId && c.receiverId === receiverId) || (c.senderId === receiverId && c.receiverId === senderId)))
  );

  if (existingConn) {
    if (existingConn.status === 'ACCEPTED') {
      return res.status(200).json({ 
        success: true, 
        message: 'You are already connected with this student.', 
        status: 'CONNECTED', 
        connection: existingConn 
      });
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

  // 1. Save to Memory & Disk
  saveConnectionRecord(newConnection);

  // 2. Add in-app notification for receiver
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const connNotification = {
    id: notifId,
    userId: receiverEmail,
    recipientEmail: receiverEmail,
    title: 'Connection Request Received',
    message: `${senderName} wants to connect with you on UniCollab: "${message}"`,
    type: 'CONNECTION_REQUEST',
    category: 'Connections',
    time: 'Just now',
    read: false,
    connectionId: connId,
    senderId,
    senderEmail,
    senderName,
    actionType: 'connection-buttons',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  notificationsDB.unshift(connNotification);

  // 3. Attempt Cloud Database (Prisma) persistence
  try {
    const prisma = await getPrisma();
    if (prisma) {
      await prisma.connection.upsert({
        where: {
          senderId_receiverId: { senderId, receiverId: receiverId || receiverEmail }
        },
        update: { status: 'PENDING' },
        create: {
          id: connId,
          senderId,
          receiverId: receiverId || receiverEmail,
          status: 'PENDING'
        }
      }).catch(async () => {
        await prisma.connection.create({
          data: {
            id: connId,
            senderId,
            receiverId: receiverId || receiverEmail,
            status: 'PENDING'
          }
        }).catch(e => console.warn('Prisma connection fallback save:', e.message));
      });
    }
  } catch (e) {
    console.warn('Prisma connection save error:', e.message);
  }

  // 4. Real-time broadcast via Socket.IO
  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.to(`user_${receiverEmail}`).emit('connection:request', newConnection);
      io.to(`user_${receiverEmail}`).emit('notification:new', connNotification);
      if (receiverId) {
        io.to(`user_${receiverId}`).emit('connection:request', newConnection);
        io.to(`user_${receiverId}`).emit('notification:new', connNotification);
      }
      io.emit('connection:request', newConnection);
      io.emit('connection:update', newConnection);
      io.emit('notification:new', connNotification);
    }
  } catch (err) {
    console.warn('Socket broadcast warning:', err.message);
  }

  return res.status(201).json({
    success: true,
    message: `Connection request sent to ${receiverName}!`,
    status: 'PENDING_SENT',
    connection: newConnection
  });
};

// 2. GET /api/connections - Get all connections & requests for current user (Bidirectional & Merged)
export const getConnections = async (req, res) => {
  const userEmail = normalizeEmail(req.query.email || req.user?.email || '');
  const userId = req.query.userId || req.user?.id || '';

  // 1. Fetch from Prisma Cloud Database if available
  let cloudConnections = [];
  try {
    const prisma = await getPrisma();
    if (prisma) {
      const orClauses = [];
      if (userId) {
        orClauses.push({ senderId: userId }, { receiverId: userId });
      }
      if (userEmail) {
        orClauses.push({ senderId: userEmail }, { receiverId: userEmail });
      }
      if (orClauses.length > 0) {
        const dbRecords = await prisma.connection.findMany({
          where: { OR: orClauses }
        });
        if (Array.isArray(dbRecords)) {
          cloudConnections = dbRecords.map(dbConn => ({
            id: dbConn.id,
            senderId: dbConn.senderId,
            senderEmail: dbConn.senderId.includes('@') ? dbConn.senderId : '',
            receiverId: dbConn.receiverId,
            receiverEmail: dbConn.receiverId.includes('@') ? dbConn.receiverId : '',
            status: dbConn.status,
            createdAt: dbConn.createdAt?.toISOString ? dbConn.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: dbConn.updatedAt?.toISOString ? dbConn.updatedAt.toISOString() : new Date().toISOString()
          }));
        }
      }
    }
  } catch (err) {
    console.warn('Prisma getConnections query info:', err.message);
  }

  // 2. Merge with Disk & Memory Store
  const allMerged = [...cloudConnections, ...connectionsDB];
  const uniqueMap = new Map();

  for (const conn of allMerged) {
    if (!conn) continue;
    const s = (conn.senderEmail || conn.senderId || '').toLowerCase().trim();
    const r = (conn.receiverEmail || conn.receiverId || '').toLowerCase().trim();
    const pairKey = [s, r].sort().join(':');

    if (!uniqueMap.has(pairKey)) {
      uniqueMap.set(pairKey, conn);
    } else {
      // Prioritize ACCEPTED status if either record is accepted
      const existing = uniqueMap.get(pairKey);
      if (conn.status === 'ACCEPTED') {
        uniqueMap.set(pairKey, { ...existing, ...conn, status: 'ACCEPTED' });
      }
    }
  }

  const mergedList = Array.from(uniqueMap.values());

  // 3. Filter for current user
  const userConnections = mergedList.filter(c => {
    const sEmail = normalizeEmail(c.senderEmail);
    const rEmail = normalizeEmail(c.receiverEmail);
    const sId = String(c.senderId || '');
    const rId = String(c.receiverId || '');

    return (
      (userEmail && (sEmail === userEmail || rEmail === userEmail)) ||
      (userId && (sId === String(userId) || rId === String(userId))) ||
      (userEmail && (sId === userEmail || rId === userEmail))
    );
  });

  const accepted = userConnections.filter(c => c.status === 'ACCEPTED');
  
  const incomingPending = userConnections.filter(c => {
    if (c.status !== 'PENDING') return false;
    const isReceiver = (userEmail && normalizeEmail(c.receiverEmail) === userEmail) || 
                       (userId && String(c.receiverId) === String(userId)) ||
                       (userEmail && String(c.receiverId) === userEmail);
    return isReceiver;
  });

  const outgoingPending = userConnections.filter(c => {
    if (c.status !== 'PENDING') return false;
    const isSender = (userEmail && normalizeEmail(c.senderEmail) === userEmail) || 
                     (userId && String(c.senderId) === String(userId)) ||
                     (userEmail && String(c.senderId) === userEmail);
    return isSender;
  });

  return res.status(200).json({
    success: true,
    count: accepted.length,
    connections: accepted,
    incomingPending,
    outgoingPending,
    all: userConnections
  });
};

// 3. POST /api/connections/:id/accept (or /api/connections/accept) - Accept connection request
export const acceptConnection = async (req, res) => {
  const connId = req.params.id;
  const userEmail = normalizeEmail(req.user?.email || req.body.userEmail || req.body.userBEmail || req.body.receiverEmail);
  const targetEmail = normalizeEmail(req.body.targetEmail || req.body.userAEmail || req.body.senderEmail);
  const userId = req.user?.id || req.body.userId || req.body.userBId;
  const targetId = req.body.targetId || req.body.userAId;

  let conn = connectionsDB.find(c => 
    (connId && connId !== 'accept' && c.id === connId) || 
    (targetEmail && userEmail && (
      (normalizeEmail(c.senderEmail) === targetEmail && normalizeEmail(c.receiverEmail) === userEmail) ||
      (normalizeEmail(c.senderEmail) === userEmail && normalizeEmail(c.receiverEmail) === targetEmail)
    )) ||
    (targetId && userId && (
      (String(c.senderId) === String(targetId) && String(c.receiverId) === String(userId)) ||
      (String(c.senderId) === String(userId) && String(c.receiverId) === String(targetId))
    )) ||
    (c.status === 'PENDING' && (
      (userEmail && (normalizeEmail(c.receiverEmail) === userEmail || normalizeEmail(c.senderEmail) === userEmail)) ||
      (userId && (String(c.receiverId) === String(userId) || String(c.senderId) === String(userId)))
    ))
  );

  const senderUser = usersDB.find(u => 
    (targetEmail && normalizeEmail(u.email) === targetEmail) || 
    (targetId && String(u.id) === String(targetId))
  );

  const receiverUser = usersDB.find(u => 
    (userEmail && normalizeEmail(u.email) === userEmail) || 
    (userId && String(u.id) === String(userId))
  );

  if (!conn) {
    const resolvedSenderEmail = targetEmail || senderUser?.email || 'peer@university.edu';
    const resolvedSenderName = req.body.targetName || senderUser?.name || 'Student Peer';
    const resolvedSenderId = targetId || senderUser?.id || `usr_${Date.now()}`;

    conn = {
      id: (connId && connId !== 'accept') ? connId : `conn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      senderId: resolvedSenderId,
      senderEmail: resolvedSenderEmail,
      senderName: resolvedSenderName,
      receiverId: userId || receiverUser?.id || 'user_current',
      receiverEmail: userEmail || receiverUser?.email,
      receiverName: req.user?.name || receiverUser?.name || 'Student',
      status: 'ACCEPTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } else {
    conn.status = 'ACCEPTED';
    conn.updatedAt = new Date().toISOString();
  }

  // 1. Persist to Disk & Memory
  saveConnectionRecord(conn);

  // 2. Persist to Cloud Database (Prisma)
  try {
    const prisma = await getPrisma();
    if (prisma) {
      await prisma.connection.upsert({
        where: {
          senderId_receiverId: { senderId: conn.senderId, receiverId: conn.receiverId }
        },
        update: { status: 'ACCEPTED' },
        create: {
          id: conn.id,
          senderId: conn.senderId,
          receiverId: conn.receiverId,
          status: 'ACCEPTED'
        }
      }).catch(async () => {
        await prisma.connection.updateMany({
          where: {
            OR: [
              { senderId: conn.senderId, receiverId: conn.receiverId },
              { senderId: conn.receiverId, receiverId: conn.senderId }
            ]
          },
          data: { status: 'ACCEPTED' }
        }).catch(e => console.warn('Prisma accept connection fallback:', e.message));
      });
    }
  } catch (err) {
    console.warn('Prisma connection accept error:', err.message);
  }

  // 3. Create or unlock conversation between the two connected users
  const p1 = (conn.senderEmail || conn.senderId || '').toLowerCase();
  const p2 = (conn.receiverEmail || conn.receiverId || '').toLowerCase();
  const pairKey = [p1, p2].sort().join(':');

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

  // 4. Notify sender that their request was accepted
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

  // 5. Real-time broadcast
  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.to(`user_${conn.senderEmail}`).emit('connection:accepted', conn);
      io.to(`user_${conn.receiverEmail}`).emit('connection:accepted', conn);
      io.emit('connection:accepted', conn);
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

// 4. POST /api/connections/:id/reject (or /api/connections/reject) - Decline connection request
export const rejectConnection = async (req, res) => {
  const connId = req.params.id;
  const userEmail = normalizeEmail(req.user?.email || req.body.userEmail);
  const targetEmail = normalizeEmail(req.body.targetEmail);

  let conn = connectionsDB.find(c => 
    (connId && connId !== 'reject' && c.id === connId) ||
    (targetEmail && userEmail && (
      (normalizeEmail(c.senderEmail) === targetEmail && normalizeEmail(c.receiverEmail) === userEmail) ||
      (normalizeEmail(c.senderEmail) === userEmail && normalizeEmail(c.receiverEmail) === targetEmail)
    ))
  );

  if (conn) {
    conn.status = 'REJECTED';
    conn.updatedAt = new Date().toISOString();
    saveConnectionRecord(conn);

    try {
      const prisma = await getPrisma();
      if (prisma) {
        await prisma.connection.updateMany({
          where: {
            OR: [
              { id: conn.id },
              { senderId: conn.senderId, receiverId: conn.receiverId },
              { senderId: conn.receiverId, receiverId: conn.senderId }
            ]
          },
          data: { status: 'REJECTED' }
        }).catch(e => console.warn('Prisma reject notice:', e.message));
      }
    } catch (err) {
      console.warn('Prisma reject error:', err.message);
    }

    try {
      const io = req.app?.get('io') || global.io;
      if (io) {
        io.to(`user_${conn.senderEmail}`).emit('connection:update', conn);
        io.to(`user_${conn.receiverEmail}`).emit('connection:update', conn);
        io.emit('connection:update', conn);
      }
    } catch (e) {
      console.warn('Socket reject emit warning:', e.message);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Connection request declined.',
    status: 'NOT_CONNECTED'
  });
};

// 5. DELETE /api/connections/:id - Remove/Unconnect
export const removeConnection = async (req, res) => {
  const connId = req.params.id;
  const userEmail = normalizeEmail(req.user?.email || req.body.userEmail);
  const targetEmail = normalizeEmail(req.body.targetEmail);

  removeConnectionRecord(connId, userEmail, targetEmail);

  try {
    const prisma = await getPrisma();
    if (prisma) {
      await prisma.connection.deleteMany({
        where: {
          OR: [
            { id: connId },
            ...(userEmail && targetEmail ? [
              { senderId: userEmail, receiverId: targetEmail },
              { senderId: targetEmail, receiverId: userEmail }
            ] : [])
          ]
        }
      }).catch(e => console.warn('Prisma remove connection notice:', e.message));
    }
  } catch (err) {
    console.warn('Prisma remove connection error:', err.message);
  }

  return res.status(200).json({
    success: true,
    message: 'Connection removed successfully.',
    status: 'NOT_CONNECTED'
  });
};

// 6. GET /api/connections/status - Check connection status with a specific user
export const getConnectionStatus = async (req, res) => {
  const myEmail = normalizeEmail(req.query.myEmail || req.query.user1 || req.user?.email);
  const myId = req.query.myId || req.user?.id;
  const targetEmail = normalizeEmail(req.query.targetEmail || req.query.user2);
  const targetId = req.query.targetId;

  if (!targetEmail && !targetId && !myEmail) {
    return res.status(400).json({ success: false, message: 'Target user email or ID required.' });
  }

  const conn = connectionsDB.find(c => 
    (myEmail && targetEmail && (
      (normalizeEmail(c.senderEmail) === myEmail && normalizeEmail(c.receiverEmail) === targetEmail) ||
      (normalizeEmail(c.senderEmail) === targetEmail && normalizeEmail(c.receiverEmail) === myEmail)
    )) ||
    (myId && targetId && (
      (String(c.senderId) === String(myId) && String(c.receiverId) === String(targetId)) ||
      (String(c.senderId) === String(targetId) && String(c.receiverId) === String(myId))
    ))
  );

  if (!conn) {
    return res.status(200).json({ success: true, status: 'NOT_CONNECTED', isConnected: false });
  }

  if (conn.status === 'ACCEPTED') {
    return res.status(200).json({ success: true, status: 'CONNECTED', isConnected: true, connection: conn });
  }

  if (conn.status === 'PENDING') {
    const isSender = (myEmail && normalizeEmail(conn.senderEmail) === myEmail) || (myId && String(conn.senderId) === String(myId));
    return res.status(200).json({
      success: true,
      status: isSender ? 'PENDING_SENT' : 'PENDING_RECEIVED',
      isConnected: false,
      connection: conn
    });
  }

  return res.status(200).json({ success: true, status: 'NOT_CONNECTED', isConnected: false });
};
