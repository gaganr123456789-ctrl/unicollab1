import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import projectsRoutes from './routes/projectsRoutes.js';
import boardsRoutes from './routes/boardsRoutes.js';
import mentorsRoutes from './routes/mentorsRoutes.js';
import resourcesRoutes from './routes/resourcesRoutes.js';
import hackathonsRoutes from './routes/hackathonsRoutes.js';
import messagesRoutes from './routes/messagesRoutes.js';
import teammatesRoutes from './routes/teammatesRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'unicollab_jwt_secret_key_2026';

// --------------------------------------------------------------------------
// 1. CORS & Express Body Parser
// --------------------------------------------------------------------------
app.use(cors({
  origin: ['https://unicollab1.onrender.com', 'http://localhost:5173', 'http://localhost:5000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// --------------------------------------------------------------------------
// 2. Health Check Endpoint
// --------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'UniCollab Prisma & Express Backend Server',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// --------------------------------------------------------------------------
// 3. Mount All API Routers
// --------------------------------------------------------------------------
import invitesRoutes from './routes/invitesRoutes.js';
import notificationsRoutes from './routes/notificationsRoutes.js';
import connectionsRoutes from './routes/connectionsRoutes.js';
import teamsRoutes from './routes/teamsRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/boards', boardsRoutes);
app.use('/api/mentors', mentorsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/hackathons', hackathonsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/teammates', teammatesRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/invites', invitesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/teams', teamsRoutes);

// --------------------------------------------------------------------------
// 4. Centralized Error Handling & Prisma Error Translation Middleware
// --------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('[API ERROR LOG]', err);

  // Prisma Unique Constraint Violation
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `Conflict: A record with this unique field (${err.meta?.target || 'field'}) already exists.`
    });
  }

  // Prisma Record Not Found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Not Found: The requested database record does not exist.'
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error.'
  });
});

// --------------------------------------------------------------------------
// 5. Socket.io Real-Time Messaging & Presence Engine
// --------------------------------------------------------------------------
// 5. Socket.io Real-Time Messaging & Presence Engine
// --------------------------------------------------------------------------
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    credentials: true
  },
  transports: ['polling', 'websocket'], // Robust fallback for Render proxy
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true
});

app.set('io', io);
global.io = io;

// Track online users and socket mappings
const userSocketsMap = new Map(); // socket.id -> { id, email, name }
const onlineUsersMap = new Map(); // id or email -> { id, email, name, sockets: Set<socketId>, lastSeen }

// Authenticate Socket connection using JWT Token (or allow guest listeners)
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    socket.user = { id: `anon_${socket.id}`, name: 'UniCollab Student' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    socket.user = { id: `anon_${socket.id}`, name: 'UniCollab Guest' };
    next();
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 [SOCKET.IO] Connected: ${socket.user?.name || socket.id}`);

  // Helper to register user presence
  const registerUserPresence = (userData) => {
    const email = (userData?.email || socket.user?.email || '').toLowerCase().trim();
    const id = userData?.id || socket.user?.id || socket.id;
    const name = userData?.name || socket.user?.name || 'Student';

    userSocketsMap.set(socket.id, { id, email, name });

    const key = email || id;
    if (!onlineUsersMap.has(key)) {
      onlineUsersMap.set(key, { id, email, name, sockets: new Set(), lastSeen: null });
    }
    const entry = onlineUsersMap.get(key);
    entry.sockets.add(socket.id);
    entry.name = name;
    entry.email = email;
    entry.id = id;

    if (email) socket.join(`user_${email}`);
    if (id) socket.join(`user_${id}`);

    // Broadcast online presence to all connected clients
    const onlineList = Array.from(onlineUsersMap.values()).map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      status: 'online'
    }));
    io.emit('online_users_updated', onlineList);
  };

  // Register online user presence
  socket.on('register_user', (userData) => {
    registerUserPresence(userData);
  });

  // Auto-register if user authenticated via handshake
  if (socket.user && socket.user.email) {
    registerUserPresence(socket.user);
  }

  socket.on('join_admin_room', () => {
    socket.join('admin_room');
    console.log(`🛡️ Socket ${socket.id} joined admin authorization room.`);
  });

  // Conversation Rooms
  socket.on('join_conversation', (conversationId) => {
    if (!conversationId) return;
    socket.join(conversationId);
    socket.join(`conv_${conversationId}`);
    console.log(`💬 Socket ${socket.id} joined conversation room: ${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    if (!conversationId) return;
    socket.leave(conversationId);
    socket.leave(`conv_${conversationId}`);
  });

  // Project & Kanban Board Rooms
  socket.on('join_project', (projectId) => {
    if (!projectId) return;
    socket.join(`project_${projectId}`);
    socket.join(`proj_${projectId}`);
    console.log(`📋 Socket ${socket.id} joined project room: project_${projectId}`);
  });

  socket.on('leave_project', (projectId) => {
    if (!projectId) return;
    socket.leave(`project_${projectId}`);
    socket.leave(`proj_${projectId}`);
  });

  // Real-time Kanban Task Moved
  socket.on('kanban:task_moved', async (data, ackCallback) => {
    const { projectId, taskId, fromColumn, toColumn, task } = data;
    console.log(`⚡ [KANBAN] Task ${taskId} moved: ${fromColumn} -> ${toColumn} (Project: ${projectId})`);

    // Update in-memory tasksDB
    try {
      const { tasksDB } = await import('./db/dataStore.js');
      const idx = tasksDB.findIndex(t => t.id === Number(taskId) || t.id === taskId);
      if (idx !== -1) {
        tasksDB[idx].column = toColumn;
      }
    } catch (e) {}

    // Broadcast to everyone else in this project room
    const projectRoom = `project_${projectId || 'default'}`;
    socket.to(projectRoom).to(`proj_${projectId || 'default'}`).emit('kanban:task_moved', data);

    // Also broadcast globally if project isn't strictly scoped or for demo reassurance
    socket.broadcast.emit('kanban:task_moved', data);

    if (typeof ackCallback === 'function') {
      ackCallback({ success: true, message: 'Task position synced.' });
    }
  });

  // Real-time Kanban Task Created
  socket.on('kanban:task_created', async (data, ackCallback) => {
    const { projectId, task } = data;
    console.log(`⚡ [KANBAN] Task created in project ${projectId}:`, task?.title);

    try {
      const { tasksDB } = await import('./db/dataStore.js');
      if (task && !tasksDB.some(t => t.id === task.id)) {
        tasksDB.push(task);
      }
    } catch (e) {}

    const projectRoom = `project_${projectId || 'default'}`;
    socket.to(projectRoom).to(`proj_${projectId || 'default'}`).emit('kanban:task_created', data);
    socket.broadcast.emit('kanban:task_created', data);

    if (typeof ackCallback === 'function') {
      ackCallback({ success: true, task });
    }
  });

  // Real-time Kanban Task Deleted
  socket.on('kanban:task_deleted', async (data, ackCallback) => {
    const { projectId, taskId } = data;
    console.log(`⚡ [KANBAN] Task ${taskId} deleted in project ${projectId}`);

    try {
      const { tasksDB } = await import('./db/dataStore.js');
      const idx = tasksDB.findIndex(t => t.id === Number(taskId) || t.id === taskId);
      if (idx !== -1) {
        tasksDB.splice(idx, 1);
      }
    } catch (e) {}

    const projectRoom = `project_${projectId || 'default'}`;
    socket.to(projectRoom).to(`proj_${projectId || 'default'}`).emit('kanban:task_deleted', data);
    socket.broadcast.emit('kanban:task_deleted', data);

    if (typeof ackCallback === 'function') {
      ackCallback({ success: true, taskId });
    }
  });

  // Typing indicator broadcast
  socket.on('typing:start', (data) => {
    const { conversationId, senderName, senderId, senderEmail } = data;
    if (!conversationId) return;
    socket.to(conversationId).to(`conv_${conversationId}`).emit('typing:status', {
      conversationId,
      senderName: senderName || socket.user?.name || 'Teammate',
      senderId: senderId || socket.user?.id,
      senderEmail: senderEmail || socket.user?.email,
      isTyping: true
    });
  });

  socket.on('typing:stop', (data) => {
    const { conversationId, senderId, senderEmail } = data;
    if (!conversationId) return;
    socket.to(conversationId).to(`conv_${conversationId}`).emit('typing:status', {
      conversationId,
      senderId: senderId || socket.user?.id,
      senderEmail: senderEmail || socket.user?.email,
      isTyping: false
    });
  });

  // Real-time message dispatch
  socket.on('send_message', async (data, ackCallback) => {
    const { conversationId, content, text, message, senderId, senderName, senderEmail, receiverId, receiverEmail, clientTempId } = data;
    const rawContent = (content || text || message || '').trim();
    if (!conversationId || !rawContent) {
      if (typeof ackCallback === 'function') ackCallback({ success: false, message: 'Missing conversationId or content' });
      return;
    }

    const sEmail = (senderEmail || socket.user?.email || '').toLowerCase().trim();
    const sId = senderId || socket.user?.id || socket.id;
    const sName = senderName || socket.user?.name || 'Student';
    const rEmail = (receiverEmail || '').toLowerCase().trim();
    const rId = receiverId || '';

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const messagePayload = {
      id: messageId,
      message_id: messageId,
      clientTempId: clientTempId || null,
      conversationId,
      conversation_id: conversationId,
      senderId: sId,
      sender_id: sId,
      senderName: sName,
      senderEmail: sEmail,
      receiverId: rId || rEmail,
      receiver_id: rId || rEmail,
      receiverEmail: rEmail,
      content: rawContent,
      message: rawContent,
      text: rawContent,
      status: 'DELIVERED',
      message_status: 'DELIVERED',
      createdAt: now.toISOString(),
      created_at: now.toISOString(),
      time: timeFormatted
    };

    // 1. Store in memory dataStore
    try {
      const { messagesDB, conversationsDB } = await import('./db/dataStore.js');
      messagesDB.push(messagePayload);

      const conv = conversationsDB.find(c => c.id === conversationId);
      if (conv) {
        conv.lastMsg = rawContent;
        conv.time = timeFormatted;
        conv.updatedAt = now.toISOString();
      }
    } catch (e) {
      console.warn('DataStore save notice:', e.message);
    }

    // 2. Broadcast immediately to active conversation room
    io.to(conversationId).to(`conv_${conversationId}`).emit('receive_message', messagePayload);

    // 3. Deliver to receiver's user rooms (for real-time sidebar & unread count updates)
    if (rEmail) {
      io.to(`user_${rEmail}`).emit('receive_message', messagePayload);
      io.to(`user_${rEmail}`).emit('new_message_notification', messagePayload);
    }
    if (rId) {
      io.to(`user_${rId}`).emit('receive_message', messagePayload);
      io.to(`user_${rId}`).emit('new_message_notification', messagePayload);
    }

    // 4. Acknowledge sender client
    if (typeof ackCallback === 'function') {
      ackCallback({ success: true, message: messagePayload });
    }
  });

  // Mark messages as read
  socket.on('mark_read', async (data) => {
    const { conversationId, readerId, readerEmail } = data;
    if (!conversationId) return;
    const normalizedReader = (readerEmail || socket.user?.email || readerId || '').toLowerCase().trim();
    const readAt = new Date().toISOString();

    try {
      const { messagesDB } = await import('./db/dataStore.js');
      messagesDB.forEach(m => {
        if (m.conversationId === conversationId &&
            ((m.receiverEmail && m.receiverEmail.toLowerCase() === normalizedReader) || m.receiverId === readerId) &&
            m.status !== 'READ') {
          m.status = 'READ';
          m.message_status = 'READ';
          m.readAt = readAt;
          m.read_at = readAt;
        }
      });
    } catch (e) {}

    io.to(conversationId).to(`conv_${conversationId}`).emit('messages_read', {
      conversationId,
      readerId: normalizedReader,
      readerEmail: normalizedReader,
      readAt
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [SOCKET.IO] Student disconnected: ${socket.id}`);
    const userMeta = userSocketsMap.get(socket.id);
    userSocketsMap.delete(socket.id);

    if (userMeta) {
      const key = userMeta.email || userMeta.id;
      if (onlineUsersMap.has(key)) {
        const entry = onlineUsersMap.get(key);
        entry.sockets.delete(socket.id);
        if (entry.sockets.size === 0) {
          entry.lastSeen = new Date().toISOString();
          onlineUsersMap.delete(key);
          io.emit('user:presence_changed', {
            id: entry.id,
            email: entry.email,
            name: entry.name,
            status: 'offline',
            lastSeen: entry.lastSeen
          });
        }
      }
    }

    const onlineList = Array.from(onlineUsersMap.values()).map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      status: 'online'
    }));
    io.emit('online_users_updated', onlineList);
  });
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');

// Serve compiled static SPA frontend files with no-cache headers for instant updates
app.use(express.static(distPath, {
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// SPA Catch-All Middleware: Any non-API GET request serves index.html for client-side routing
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`<!DOCTYPE html><html><head><title>UniCollab</title></head><body><div id="root"></div></body></html>`);
    }
  });
});

// --------------------------------------------------------------------------
// 6. Start Unified Node & WebSockets Server & Keep-Alive Self-Ping Engine
// --------------------------------------------------------------------------
httpServer.listen(PORT, () => {
  console.log(`🚀 UniCollab Unified Server (API + WebSockets + Static SPA) running on port ${PORT}`);

  // Keep-Alive Self-Ping Engine: Pings health endpoint every 10 mins so Render never spins down or sleeps
  const RENDER_HEALTH_URL = 'https://unicollab1.onrender.com/api/health';
  setInterval(async () => {
    try {
      const { default: https } = await import('https');
      https.get(RENDER_HEALTH_URL, (res) => {
        console.log(`⚡ [KEEP-ALIVE] Self-ping dispatched - Status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.warn('Keep-alive ping notice:', err.message);
      });
    } catch (e) {
      console.warn('Keep-alive error:', e.message);
    }
  }, 10 * 60 * 1000); // 10 minutes interval
});

export default app;
