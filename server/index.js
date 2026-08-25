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
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    credentials: true
  }
});

app.set('io', io);
global.io = io;

// Track online users: key -> { socketId, id, email, name, lastSeen }
const onlineUsersMap = new Map();

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
  console.log(`🔌 [SOCKET.IO] Authenticated student/admin connected: ${socket.user?.name || socket.id}`);

  // Register online user presence
  socket.on('register_user', (userData) => {
    const email = (userData?.email || socket.user?.email || '').toLowerCase().trim();
    const id = userData?.id || socket.user?.id || socket.id;
    const name = userData?.name || socket.user?.name || 'Student';

    if (email) {
      onlineUsersMap.set(email, { socketId: socket.id, id, email, name });
      socket.join(`user_${email}`);
    }
    if (id) {
      onlineUsersMap.set(id, { socketId: socket.id, id, email, name });
      socket.join(`user_${id}`);
    }

    // Broadcast online presence to all connected clients
    const onlineList = Array.from(onlineUsersMap.values()).map(u => ({ id: u.id, email: u.email, name: u.name }));
    io.emit('online_users_updated', onlineList);
  });

  socket.on('join_admin_room', () => {
    socket.join('admin_room');
    console.log(`🛡️ Socket ${socket.id} joined admin authorization room.`);
  });

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

  // Typing indicator broadcast
  socket.on('typing:start', (data) => {
    const { conversationId, senderName, senderId, senderEmail } = data;
    if (!conversationId) return;
    socket.to(conversationId).to(`conv_${conversationId}`).emit('typing:status', {
      conversationId,
      senderName: senderName || 'Teammate',
      senderId,
      senderEmail,
      isTyping: true
    });
  });

  socket.on('typing:stop', (data) => {
    const { conversationId, senderId, senderEmail } = data;
    if (!conversationId) return;
    socket.to(conversationId).to(`conv_${conversationId}`).emit('typing:status', {
      conversationId,
      senderId,
      senderEmail,
      isTyping: false
    });
  });

  // Real-time message dispatch
  socket.on('send_message', async (data) => {
    const { conversationId, content, text, senderId, senderName, senderEmail, receiverId, receiverEmail } = data;
    const rawContent = (content || text || '').trim();
    if (!conversationId || !rawContent) return;

    const messagePayload = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      conversation_id: conversationId,
      conversationId,
      sender_id: senderId || socket.user?.id || 'usr_demo',
      senderId: senderId || socket.user?.id || 'usr_demo',
      senderName: senderName || socket.user?.name || 'Student',
      senderEmail: (senderEmail || socket.user?.email || '').toLowerCase().trim(),
      receiver_id: receiverId,
      receiverId: receiverId,
      receiverEmail: (receiverEmail || '').toLowerCase().trim(),
      content: rawContent,
      message: rawContent,
      text: rawContent,
      status: 'DELIVERED',
      message_status: 'DELIVERED',
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Broadcast to active conversation room
    io.to(conversationId).to(`conv_${conversationId}`).emit('receive_message', messagePayload);

    // Also send direct push notification event to receiver's user room
    if (receiverEmail) {
      io.to(`user_${receiverEmail.toLowerCase().trim()}`).emit('new_message_notification', messagePayload);
    }
    if (receiverId) {
      io.to(`user_${receiverId}`).emit('new_message_notification', messagePayload);
    }
  });

  // Mark messages as read
  socket.on('mark_read', (data) => {
    const { conversationId, readerId, readerEmail } = data;
    if (!conversationId) return;
    socket.to(conversationId).to(`conv_${conversationId}`).emit('messages_read', {
      conversationId,
      readerId,
      readerEmail,
      readAt: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [SOCKET.IO] Student disconnected: ${socket.id}`);
    for (const [key, val] of onlineUsersMap.entries()) {
      if (val.socketId === socket.id) {
        onlineUsersMap.delete(key);
      }
    }
    const onlineList = Array.from(onlineUsersMap.values()).map(u => ({ id: u.id, email: u.email, name: u.name }));
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
