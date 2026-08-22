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
  origin: ['https://unicollab-33.vercel.app', 'http://localhost:5173', 'http://localhost:5000', 'http://127.0.0.1:5173'],
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
app.use('/api/teammates', teammatesRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/invites', invitesRoutes);
app.use('/api/notifications', notificationsRoutes);

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
// 5. Socket.io Real-Time Messaging Engine with JWT Authentication
// --------------------------------------------------------------------------
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    credentials: true
  }
});

app.set('io', io);
global.io = io;

// Authenticate Socket connection using JWT Token (or allow admin connections)
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    // Allow anonymous admin socket connections for real-time dashboard listeners
    socket.user = { id: `anon_${socket.id}`, name: 'Admin Listener' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    socket.user = { id: `anon_${socket.id}`, name: 'Guest Listener' };
    next();
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 [SOCKET.IO] Authenticated student/admin connected: ${socket.user?.name || socket.id}`);

  socket.on('join_admin_room', () => {
    socket.join('admin_room');
    console.log(`🛡️ Socket ${socket.id} joined admin authorization room.`);
  });

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`💬 Socket ${socket.id} joined conversation room: ${conversationId}`);
  });

  socket.on('send_message', async (data) => {
    const { conversationId, content } = data;
    if (!conversationId || !content) return;

    let savedMsgId = `msg_${Date.now()}`;
    try {
      if (process.env.DATABASE_URL) {
        const { PrismaClient } = await import('@prisma/client');
        const prismaClient = new PrismaClient();
        const created = await prismaClient.message.create({
          data: {
            conversationId,
            senderId: socket.user?.id || 'usr_demo',
            content: content.trim()
          }
        });
        savedMsgId = created.id;
      }
    } catch (err) {
      console.warn('Prisma Socket message save fallback:', err.message);
    }

    const messagePayload = {
      id: savedMsgId,
      conversationId,
      senderId: socket.user?.id || 'usr_demo',
      senderName: socket.user?.name || 'Alex Rivera',
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    // Broadcast message to room members
    io.to(conversationId).emit('receive_message', messagePayload);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [SOCKET.IO] Student disconnected: ${socket.id}`);
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
